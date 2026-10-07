/** @jest-environment node */

import configureStore from '../src/configureStore';
import { INITIALIZE, stateMiddleware, updateStorage } from 'nexus-module';
import { getPersistence } from '../src/swap/persistence';
import { createJobStore } from '../src/swap/jobs';
import { createSwapController } from '../src/swap/controller';
import { SET_TIMESPAN, SWITCH_TAB } from '../src/actions/types';

// Replace only the wallet host boundary; exercise the real Redux reducers,
// configureStore middleware and shared persistence queue together.
jest.mock('nexus-module', () => ({
  ...jest.requireActual('../test/__mocks__/nexus-module'),
  updateStorage: jest.fn(),
  walletDataReducer: (state = { initialized: false }, action) =>
    action.type === '@@NWM/INITIALIZE' ? { ...state, initialized: true } : state,
}));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const initialJournal = { version: 1, jobs: [{ id: 'pending-job', state: 'submission_unknown' }] };

function initialize(journal = initialJournal) {
  const store = configureStore();
  store.dispatch({
    type: INITIALIZE,
    payload: {
      moduleState: {},
      storageData: { settings: { timeSpan: '1d' }, swapJournal: journal },
    },
  });
  return store;
}

beforeEach(() => {
  jest.clearAllMocks();
  global.NEXUS = { utilities: {} };
});

afterEach(() => {
  delete global.NEXUS;
});

test('initialization projects only Redux roots while preserving the complete host envelope', async () => {
  const diagnostic = jest.spyOn(console, 'error').mockImplementation(() => {});
  const storageData = {
    ui: { activeTab: 'Trade' },
    settings: { timeSpan: '1d' },
    nexus: { network: 'testnet' },
    swapJournal: initialJournal,
    futureStorage: { version: 2, evidence: ['retained'] },
  };
  const moduleState = {
    ui: { activeTab: 'Charts' },
    settings: { timeSpan: '1m' },
    nexus: { genesis: 'profile-A' },
    swapJournal: { version: 1, jobs: [] },
    futureSession: { transient: true },
  };
  const originalStorage = JSON.stringify(storageData);
  const originalSession = JSON.stringify(moduleState);
  try {
    const store = configureStore();
    store.dispatch({ type: INITIALIZE, payload: { storageData, moduleState } });
    const state = store.getState();
    expect(Object.keys(state).sort()).toEqual(['nexus', 'settings', 'ui']);
    expect(state.ui.activeTab).toBe('Charts');
    expect(state.ui.nft.listings).toEqual([]);
    expect(state.ui.market.myUnconfirmedOrders).toBeDefined();
    expect(state.settings.timeSpan).toBe('1m');
    expect(state.nexus).toEqual({ initialized: true, network: 'testnet', genesis: 'profile-A' });
    expect(getPersistence().readJournal()).toEqual(initialJournal);
    expect(() => getPersistence().healthy()).toThrow(/acknowledged/i);
    expect(updateStorage).not.toHaveBeenCalled();

    store.dispatch({ type: SWITCH_TAB, payload: 'Trade' });
    store.dispatch({ type: SET_TIMESPAN, payload: '1w' });
    await flush();
    expect(updateStorage).toHaveBeenCalledTimes(1);
    expect(updateStorage).toHaveBeenCalledWith({ ...storageData, settings: { timeSpan: '1w' } });
    expect(Object.keys(store.getState()).sort()).toEqual(['nexus', 'settings', 'ui']);
    expect(getPersistence().readJournal()).toEqual(initialJournal);
    expect(JSON.stringify(storageData)).toBe(originalStorage);
    expect(JSON.stringify(moduleState)).toBe(originalSession);
    expect(diagnostic).not.toHaveBeenCalled();
  } finally {
    diagnostic.mockRestore();
  }
});

test('session persistence preserves master memoization and excludes transient order state', () => {
  const store = initialize();
  const select = stateMiddleware.mock.calls[0][0];
  const initial = store.getState();
  const session = select(initial);
  const transient = ['myUnconfirmedOrders', 'myCancellingOrders', 'myUnconfirmedTrades'];
  for (const key of transient) {
    expect(initial.ui.market).toHaveProperty(key);
    expect(session.ui.market).not.toHaveProperty(key);
  }
  expect(select({ ...initial, settings: { timeSpan: '1w' } })).toBe(session);
  store.dispatch({ type: SWITCH_TAB, payload: 'Trade' });
  expect(select(store.getState())).not.toBe(session);
  expect(select(store.getState()).ui.activeTab).toBe('Trade');
});

test('legacy settings save preserves pending jobs while missing storage acknowledgement blocks funding', async () => {
  const store = initialize();
  expect(() => getPersistence().healthy()).toThrow(/acknowledged/);
  store.dispatch({ type: SWITCH_TAB, payload: 'Trade' });
  await flush();
  expect(updateStorage).not.toHaveBeenCalled();
  store.dispatch({ type: SET_TIMESPAN, payload: '1w' });
  await flush();
  expect(updateStorage).toHaveBeenCalledTimes(1);
  expect(updateStorage).toHaveBeenCalledWith({ settings: { timeSpan: '1w' }, swapJournal: initialJournal });
  expect(getPersistence().readJournal()).toEqual(initialJournal);
  store.dispatch({ type: SET_TIMESPAN, payload: '1w' });
  await flush();
  expect(updateStorage).toHaveBeenCalledTimes(1);
});

test('promise-returning snapshot writer cannot admit journal writes or funding', async () => {
  const writer = jest.fn(async () => true);
  global.NEXUS.utilities.updateStorageAcknowledged = writer;
  const store = initialize();
  const persistence = getPersistence();
  const nextJournal = { version: 1, jobs: [...initialJournal.jobs, { id: 'next-job', state: 'awaiting_signature' }] };

  expect(() => persistence.healthy()).toThrow(/capability|authoritative/i);
  // Native settings work before a fault; journal inspection remains available.
  store.dispatch({ type: SET_TIMESPAN, payload: '1m' });
  await flush();
  expect(updateStorage).toHaveBeenCalledWith({ settings: { timeSpan: '1m' }, swapJournal: initialJournal });

  await expect(persistence.writeJournal(nextJournal)).rejects.toThrow(/capability|authoritative/i);
  expect(writer).not.toHaveBeenCalled();
  expect(persistence.readJournal()).toEqual(initialJournal);

  // A fault holds every full-snapshot writer, including the settings middleware.
  const diagnostic = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    store.dispatch({ type: SET_TIMESPAN, payload: '1w' });
    await flush();
    expect(updateStorage).toHaveBeenCalledTimes(1);
    expect(store.getState().settings.timeSpan).toBe('1w');
    expect(diagnostic).toHaveBeenCalledWith(
      'Wallet storage failed; new swap funding is blocked.',
      expect.stringMatching(/writes blocked until authoritative recovery/i)
    );
  } finally {
    diagnostic.mockRestore();
  }
});

test('two real hydrated controllers reject snapshot-only storage before either wallet debit', async () => {
  const scope = { genesis: 'profile-A', nexusNetwork: 'testnet', solanaGenesis: 'solana-test' };
  const job = {
    id: 'same-job', reference: '1', scope, direction: 'nexus-to-solana', state: 'draft',
    provider: { address: 'provider', owner: 'owner' },
    quote: { inputUnits: '1000000', outputUnits: '997500' },
    nexusAccount: 'source-account', solanaAccount: 'destination-account',
    nexusMinConfirmations: 6, expiresAt: Date.now() + 60000,
  };
  const journal = { version: 1, jobs: [job] };
  let disk = { settings: { timeSpan: '1d' }, swapJournal: journal };
  const writer = jest.fn(async value => { disk = value; return true; });
  global.NEXUS.utilities.updateStorageAcknowledged = writer;
  const debit = jest.fn(async () => ({ txid: `mock-debit-${debit.mock.calls.length}` }));
  const validateFunding = jest.fn(async () => {});
  let queue = Promise.resolve();
  const locks = { request: (name, options, callback) => {
    const operation = queue.then(callback);
    queue = operation.catch(() => {});
    return operation;
  } };
  const openController = () => {
    initialize(disk.swapJournal);
    const persistence = getPersistence();
    return createSwapController({
      store: createJobStore({ persistence, locks }),
      nexus: { submitDebit: debit }, solana: {}, validateFunding,
      loadScope: async () => scope,
    });
  };
  const first = openController();
  const second = openController();
  const outcomes = await Promise.allSettled([
    first.submitNexus(job.id), second.submitNexus(job.id),
  ]);

  // Validation succeeds deliberately: the storage boundary, not deployment policy,
  // must stop both callers even if a future deployment were otherwise accepted.
  expect(validateFunding).toHaveBeenCalledTimes(2);
  expect(debit).not.toHaveBeenCalled();
  expect(writer).not.toHaveBeenCalled();
  for (const outcome of outcomes) {
    expect(outcome.status).toBe('rejected');
    expect(outcome.reason.message).toMatch(/capability|authoritative/i);
  }
  expect(disk.swapJournal).toEqual(journal);
  expect(first.get(job.id)).toEqual(job);
  expect(second.get(job.id)).toEqual(job);
  expect(openController().get(job.id)).toEqual(job);
});
