/** @jest-environment node */

import { createModulePersistence } from '../src/swap/persistence';

const clone = value => JSON.parse(JSON.stringify(value));
const initial = { settings: { timeSpan: '1d' }, swapJournal: { version: 1, jobs: [] }, future: { version: 2 } };
const uncertainJournal = { version: 1, jobs: [{ id: 'pending-job', state: 'submission_unknown', txid: 'first-identity' }] };

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
