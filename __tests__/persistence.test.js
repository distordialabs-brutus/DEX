/** @jest-environment node */

import { createModulePersistence } from '../src/swap/persistence';
import { createJobStore } from '../src/swap/jobs';

const clone = value => JSON.parse(JSON.stringify(value));
const initial = { settings: { timeSpan: '1d' }, swapJournal: { version: 1, jobs: [] }, future: { version: 2 } };
const uncertainJournal = { version: 1, jobs: [{ id: 'pending-job', state: 'submission_unknown', txid: 'first-identity' }] };
const scope = { genesis: 'profile-A', nexusNetwork: 'testnet', solanaGenesis: 'solana-test' };
const draft = {
  id: 'new-job', reference: '1', scope, direction: 'nexus-to-solana', state: 'draft',
  provider: { address: 'provider', owner: 'owner' },
  quote: { inputUnits: '1000000', outputUnits: '997500' },
  nexusAccount: 'source-account', solanaAccount: 'destination-account',
  nexusMinConfirmations: 6, expiresAt: 2000000000000,
};
const locks = { request: (name, options, callback) => Promise.resolve().then(callback) };

test.each([
  ['null', null], ['false', false], ['zero', 0], ['empty string', ''],
  ['array', []], ['missing schema', {}], ['unsupported version', { version: 2, jobs: [] }],
])('a persisted %s journal blocks job access without replacing recovery data', async (name, journal) => {
  const envelope = { ...clone(initial), swapJournal: journal };
  const original = clone(envelope);
  let disk = clone(envelope);
  // Explicit test writer: even a successful acknowledgement must not conceal
  // malformed history. Production journal admission remains disabled.
  const writer = jest.fn(async value => { disk = clone(value); return true; });
  const settingsWriter = jest.fn(value => { disk = clone(value); });
  const persistence = createModulePersistence(writer, { writeSettings: settingsWriter });
  persistence.hydrate(envelope);
  const store = createJobStore({ persistence, locks });

  expect(() => store.list(scope)).toThrow(/malformed or unsupported swap journal/i);
  expect(() => store.get(draft.id)).toThrow(/malformed or unsupported swap journal/i);
  await expect(store.create(draft)).rejects.toThrow(/malformed or unsupported swap journal/i);
  await expect(store.create(draft)).rejects.toThrow(/malformed or unsupported swap journal/i);
  expect(writer).not.toHaveBeenCalled();
  expect(persistence.readJournal()).toEqual(journal);
  expect(disk).toEqual(original);

  // Native settings may still save, but preserve the exact invalid value and
  // foreign fields. Neither a save nor restart may reset the journal to empty.
  await persistence.saveSettings({ timeSpan: '1w' });
  expect(settingsWriter).toHaveBeenCalledTimes(1);
  expect(disk).toEqual({ ...original, settings: { timeSpan: '1w' } });
  expect(envelope).toEqual(original);
  const restarted = createModulePersistence(writer);
  restarted.hydrate(disk);
  expect(restarted.readJournal()).toEqual(journal);
  const reopened = createJobStore({ persistence: restarted, locks });
  expect(() => reopened.list(scope)).toThrow(/malformed or unsupported swap journal/i);
  await expect(reopened.create(draft)).rejects.toThrow(/malformed or unsupported swap journal/i);
  expect(writer).not.toHaveBeenCalled();
});

test.each([
  'pin', 'PIN', 'pinCode', 'pin_code', 'session', 'sessions', 'sessionToken', 'session_key',
])('job credentials in %s are rejected before persistence and remain blocked on restart', async key => {
  // Synthetic values only; the wallet remains the real credential boundary.
  const invalidJob = { ...clone(draft), recovery: { [key]: 'synthetic-credential' } };
  let disk = clone(initial);
  const writer = jest.fn(async value => { disk = clone(value); return true; });
  const persistence = createModulePersistence(writer);
  persistence.hydrate(initial);
  const store = createJobStore({ persistence, locks });

  await expect(store.create(invalidJob)).rejects.toThrow(/secret field/i);
  expect(writer).not.toHaveBeenCalled();
  expect(disk).toEqual(initial);
  expect(store.list(scope)).toEqual([]);

  await store.create(draft);
  const committed = clone(disk);
  writer.mockClear();
  await expect(store.update(draft.id, current => ({
    ...current, recovery: [{ [key]: 'synthetic-credential' }],
  }))).rejects.toThrow(/secret field/i);
  expect(writer).not.toHaveBeenCalled();
  expect(disk).toEqual(committed);
  expect(store.get(draft.id)).toEqual(draft);

  // Legacy invalid records must not be silently discarded or overwritten with a
  // new job. Settings retain the envelope for explicit host-owned recovery.
  const envelope = { ...clone(initial), swapJournal: { version: 1, jobs: [invalidJob] } };
  const original = clone(envelope);
  disk = clone(envelope);
  const restored = createModulePersistence(writer);
  restored.hydrate(envelope);
  const restoredStore = createJobStore({ persistence: restored, locks });
  expect(() => restoredStore.list(scope)).toThrow(/secret field/i);
  expect(() => restoredStore.get(draft.id)).toThrow(/secret field/i);
  await expect(restoredStore.create(draft)).rejects.toThrow(/secret field/i);
  await expect(restoredStore.create(draft)).rejects.toThrow(/secret field/i);
  expect(writer).not.toHaveBeenCalled();
  await restored.saveSettings({ timeSpan: '1w' });
  expect(disk).toEqual({ ...original, settings: { timeSpan: '1w' } });
  expect(envelope).toEqual(original);
  const restarted = createModulePersistence(undefined);
  restarted.hydrate(disk);
  expect(() => createJobStore({ persistence: restarted, locks }).list(scope)).toThrow(/secret field/i);
});

test('non-secret protocol and inspection fields are still preserved', async () => {
  const validJob = {
    ...clone(draft), mappingAddress: 'mapping-address',
    inspection: { pinningPolicy: 'exact-identity', sessionObservedAt: 1900000000000 },
  };
  let disk = clone(initial);
  const writer = jest.fn(async value => { disk = clone(value); return true; });
  const persistence = createModulePersistence(writer);
  persistence.hydrate(initial);
  const store = createJobStore({ persistence, locks });
  await expect(store.create(validJob)).resolves.toEqual(validJob);
  expect(disk).toEqual({ ...initial, swapJournal: { version: 1, jobs: [validJob] } });
  const restarted = createModulePersistence(undefined);
  restarted.hydrate(disk);
  expect(createJobStore({ persistence: restarted, locks }).get(validJob.id)).toEqual(validJob);
});

test.each([
  ['absent journal', { settings: { timeSpan: '1d' }, future: { version: 2 } }],
  ['valid empty journal', initial],
])('%s permits a first job without losing settings or foreign fields', async (name, envelope) => {
  let disk = clone(envelope);
  const writer = jest.fn(async value => { disk = clone(value); return true; });
  const persistence = createModulePersistence(writer);
  persistence.hydrate(envelope);
  const store = createJobStore({ persistence, locks });

  expect(store.list(scope)).toEqual([]);
  expect(persistence.readJournal()).toEqual({ version: 1, jobs: [] });
  await expect(store.create(draft)).resolves.toEqual(draft);
  expect(writer).toHaveBeenCalledTimes(1);
  expect(disk).toEqual({ ...envelope, swapJournal: { version: 1, jobs: [draft] } });
  const restarted = createModulePersistence(undefined);
  restarted.hydrate(disk);
  expect(createJobStore({ persistence: restarted, locks }).list(scope)).toEqual([draft]);
});

test.each([
  ['rejected acknowledgement', () => Promise.reject(new Error('Acknowledgement lost'))],
  ['negative acknowledgement', () => Promise.resolve(false)],
  ['error acknowledgement', () => Promise.resolve({ error: 'Storage response lost' })],
  ['missing durable acknowledgement', () => undefined],
])('%s cannot be followed by a stale settings overwrite', async (name, acknowledge) => {
  let disk = clone(initial);
  const journalWriter = jest.fn(value => {
    disk = clone(value);
    return acknowledge();
  });
  const settingsWriter = jest.fn(value => { disk = clone(value); });
  const persistence = createModulePersistence(journalWriter, { writeSettings: settingsWriter });
  persistence.hydrate(initial);

  await expect(persistence.writeJournal(uncertainJournal)).rejects.toThrow();
  await expect(persistence.saveSettings({ timeSpan: '1w' })).rejects.toThrow(/storage.*blocked|storage.*unavailable/i);
  await expect(persistence.saveSettings({ timeSpan: '1m' })).rejects.toThrow(/storage.*blocked|storage.*unavailable/i);

  await expect(persistence.writeJournal({ version: 1, jobs: [] })).rejects.toThrow(/writes blocked/i);
  expect(() => persistence.hydrate(disk)).toThrow(/already initialized/i);
  expect(journalWriter).toHaveBeenCalledTimes(1);
  expect(settingsWriter).not.toHaveBeenCalled();
  expect(disk).toEqual({ ...initial, swapJournal: uncertainJournal });
  // Inspection is still allowed, but the old cache is not authoritative recovery.
  expect(persistence.readJournal()).toEqual(initial.swapJournal);
  expect(() => persistence.healthy()).toThrow(/blocked/i);
  const restarted = createModulePersistence(undefined);
  restarted.hydrate(disk);
  expect(restarted.readJournal()).toEqual(uncertainJournal);
});

test('queued settings wait for a delayed journal acknowledgement and stay blocked if it rejects', async () => {
  let disk = clone(initial);
  let rejectAcknowledgement;
  const acknowledgement = new Promise((resolve, reject) => { rejectAcknowledgement = reject; });
  const journalWriter = jest.fn(value => { disk = clone(value); return acknowledgement; });
  const settingsWriter = jest.fn(value => { disk = clone(value); });
  const persistence = createModulePersistence(journalWriter, { writeSettings: settingsWriter });
  persistence.hydrate(initial);

  const journalOperation = persistence.writeJournal(uncertainJournal);
  const settingsOperation = persistence.saveSettings({ timeSpan: '1w' });
  await Promise.resolve();
  expect(journalWriter).toHaveBeenCalledTimes(1);
  expect(settingsWriter).not.toHaveBeenCalled();
  const journalFailure = expect(journalOperation).rejects.toThrow('Acknowledgement lost');
  const settingsFailure = expect(settingsOperation).rejects.toThrow(/storage.*blocked|storage.*unavailable/i);
  rejectAcknowledgement(new Error('Acknowledgement lost'));
  await Promise.all([journalFailure, settingsFailure]);

  expect(settingsWriter).not.toHaveBeenCalled();
  expect(disk).toEqual({ ...initial, swapJournal: uncertainJournal });
});

test('a successful delayed acknowledgement lets queued settings retain the committed journal and unknown fields', async () => {
  let disk = clone(initial);
  let resolveAcknowledgement;
  const acknowledgement = new Promise(resolve => { resolveAcknowledgement = resolve; });
  const journalWriter = jest.fn(value => { disk = clone(value); return acknowledgement; });
  const settingsWriter = jest.fn(value => { disk = clone(value); });
  const persistence = createModulePersistence(journalWriter, { writeSettings: settingsWriter });
  persistence.hydrate(initial);

  const journalOperation = persistence.writeJournal(uncertainJournal);
  const settingsOperation = persistence.saveSettings({ timeSpan: '1w' });
  await Promise.resolve();
  expect(settingsWriter).not.toHaveBeenCalled();
  resolveAcknowledgement(true);
  await Promise.all([journalOperation, settingsOperation]);

  expect(journalWriter).toHaveBeenCalledTimes(1);
  expect(settingsWriter).toHaveBeenCalledTimes(1);
  expect(disk).toEqual({ ...initial, settings: { timeSpan: '1w' }, swapJournal: uncertainJournal });
  expect(persistence.readJournal()).toEqual(uncertainJournal);
  expect(() => persistence.healthy()).not.toThrow();
});
