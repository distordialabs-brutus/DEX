/** @jest-environment node */

import { createModulePersistence } from '../src/swap/persistence';
import { createJobStore } from '../src/swap/jobs';
import { createSwapController } from '../src/swap/controller';

const clone = value => JSON.parse(JSON.stringify(value));
const scope = { genesis: 'profile-A', nexusNetwork: 'testnet', solanaGenesis: 'solana-test' };
const draft = {
  id: 'scope-switch-job', reference: '1', scope, direction: 'nexus-to-solana', state: 'draft',
  provider: { address: 'provider', owner: 'owner' },
  quote: { inputUnits: '1000000', outputUnits: '997500' },
  nexusAccount: 'source-account', solanaAccount: 'destination-account',
  nexusMinConfirmations: 6, expiresAt: 2000000000000,
};

function harness(initialJob = draft) {
  const initial = { settings: { timeSpan: '1d' }, swapJournal: { version: 1, jobs: [initialJob] }, future: { version: 2 } };
  let disk = clone(initial);
  let currentScope = clone(scope);
  let finishValidation;
  let validationStarted;
  const validating = new Promise(resolve => { validationStarted = resolve; });
  const validation = new Promise(resolve => { finishValidation = resolve; });
  const validateFunding = jest.fn(() => { validationStarted(); return validation; });
  // Explicit unit-test injection, not production admission of a snapshot writer.
  // Real coordinators/stores/controllers run; only host boundaries are mocked.
  const writer = jest.fn(async value => { disk = clone(value); return true; });
  const debit = jest.fn(async () => ({ txid: 'mock-debit' }));
  const publishMapping = jest.fn(async () => ({ address: 'mock-mapping', txid: 'mock-create' }));
  const verifyMapping = jest.fn(async (address, txid) => ({ verified: true, address, txid }));
  const loadScope = jest.fn(async () => clone(currentScope));
  let queue = Promise.resolve();
  const locks = { request: (name, options, callback) => {
    const operation = queue.then(callback);
    queue = operation.catch(() => {});
    return operation;
  } };
  const openController = () => {
    const persistence = createModulePersistence(writer);
    persistence.hydrate(disk);
    return createSwapController({
      store: createJobStore({ persistence, locks }),
      nexus: { submitDebit: debit, publishMapping, verifyMapping }, solana: {}, validateFunding, loadScope,
    });
  };
  const delayNextAcknowledgement = () => {
    let acknowledge;
    let notifyWritten;
    const written = new Promise(resolve => { notifyWritten = resolve; });
    const acknowledgement = new Promise(resolve => { acknowledge = resolve; });
    writer.mockImplementationOnce(async value => {
      disk = clone(value);
      notifyWritten();
      await acknowledgement;
      return true;
    });
    return { written, acknowledge };
  };
  return {
    initial, writer, debit, publishMapping, verifyMapping, loadScope, validateFunding, validating, finishValidation, openController,
    delayNextAcknowledgement,
    readDisk: () => clone(disk),
    setScope: value => { currentScope = clone(value); },
  };
}

test.each(['genesis', 'nexusNetwork', 'solanaGenesis'])(
  '%s change during asynchronous funding validation blocks intent and debit', async field => {
    const h = harness();
    const controller = h.openController();
    const submission = controller.submitNexus(draft.id);
    await h.validating;
    expect(h.writer).not.toHaveBeenCalled();
    expect(h.debit).not.toHaveBeenCalled();
    h.setScope({ ...scope, [field]: 'changed-context' });
    const rejected = expect(submission).rejects.toThrow(/scope changed/i);
    h.finishValidation();
    await rejected;

    expect(h.validateFunding).toHaveBeenCalledTimes(1);
    expect(h.loadScope).toHaveBeenCalledTimes(2);
    expect(h.writer).not.toHaveBeenCalled();
    expect(h.debit).not.toHaveBeenCalled();
    expect(h.readDisk()).toEqual(h.initial);
    expect(controller.get(draft.id)).toEqual(draft);
    expect(h.openController().get(draft.id)).toEqual(draft);
  }
);

test.each([
  ['unavailable', async () => null, /scope changed/i],
  ['rejected', async () => { throw new Error('Scope lookup failed'); }, /scope lookup failed/i],
])('%s post-validation scope read blocks intent and debit', async (name, readScope, error) => {
  const h = harness();
  const controller = h.openController();
  const submission = controller.submitNexus(draft.id);
  await h.validating;
  h.loadScope.mockImplementation(readScope);
  const rejected = expect(submission).rejects.toThrow(error);
  h.finishValidation();
  await rejected;

  expect(h.loadScope).toHaveBeenCalledTimes(2);
  expect(h.writer).not.toHaveBeenCalled();
  expect(h.debit).not.toHaveBeenCalled();
  expect(h.readDisk()).toEqual(h.initial);
  expect(controller.get(draft.id)).toEqual(draft);
  expect(h.openController().get(draft.id)).toEqual(draft);
});

test.each(['genesis', 'nexusNetwork', 'solanaGenesis'])(
  '%s change during intent acknowledgement blocks debit and retains unknown on restart', async field => {
    const h = harness();
    const controller = h.openController();
    const acknowledgement = h.delayNextAcknowledgement();
    const submission = controller.submitNexus(draft.id);
    await h.validating;
    h.finishValidation();
    await acknowledgement.written;
    const intent = h.readDisk().swapJournal.jobs[0];
    expect(intent.state).toBe('submission_unknown');
    expect(h.debit).not.toHaveBeenCalled();

    h.setScope({ ...scope, [field]: 'changed-context' });
    const rejected = expect(submission).rejects.toThrow(/scope changed/i);
    acknowledgement.acknowledge();
    await rejected;

    expect(h.debit).not.toHaveBeenCalled();
    expect(h.writer).toHaveBeenCalledTimes(1);
    expect(h.readDisk()).toEqual({ ...h.initial, swapJournal: { version: 1, jobs: [intent] } });
    expect(controller.get(draft.id)).toEqual(intent);
    h.setScope(scope);
    const restarted = h.openController();
    expect(restarted.get(draft.id)).toEqual(intent);
    await expect(restarted.submitNexus(draft.id)).rejects.toThrow(/never retried/i);
    expect(h.writer).toHaveBeenCalledTimes(1);
    expect(h.debit).not.toHaveBeenCalled();
  }
);

test.each([
  ['unavailable', async () => null, /scope changed/i],
  ['rejected', async () => { throw new Error('Scope lookup failed'); }, /scope lookup failed/i],
])('%s post-intent scope read blocks debit and preserves committed unknown', async (name, readScope, error) => {
  const h = harness();
  const controller = h.openController();
  const acknowledgement = h.delayNextAcknowledgement();
  const submission = controller.submitNexus(draft.id);
  await h.validating;
  h.finishValidation();
  await acknowledgement.written;
  const intent = h.readDisk().swapJournal.jobs[0];
  expect(intent.state).toBe('submission_unknown');
  h.loadScope.mockImplementation(readScope);
  const rejected = expect(submission).rejects.toThrow(error);
  acknowledgement.acknowledge();
  await rejected;

  expect(h.loadScope).toHaveBeenCalledTimes(3);
  expect(h.debit).not.toHaveBeenCalled();
  expect(h.writer).toHaveBeenCalledTimes(1);
  expect(h.readDisk()).toEqual({ ...h.initial, swapJournal: { version: 1, jobs: [intent] } });
  expect(controller.get(draft.id)).toEqual(intent);
  h.loadScope.mockImplementation(async () => clone(scope));
  const restarted = h.openController();
  expect(restarted.get(draft.id)).toEqual(intent);
  await expect(restarted.submitNexus(draft.id)).rejects.toThrow(/never retried/i);
  expect(h.writer).toHaveBeenCalledTimes(1);
  expect(h.debit).not.toHaveBeenCalled();
});

test('unchanged scope persists intent before one debit and retains its identity on restart', async () => {
  const h = harness();
  const controller = h.openController();
  const acknowledgement = h.delayNextAcknowledgement();
  h.debit.mockImplementation(async job => {
    expect(h.readDisk().swapJournal.jobs[0]).toEqual(job);
    expect(job.state).toBe('submission_unknown');
    expect(job.submissionStartedAt).toEqual(expect.any(String));
    expect(h.loadScope).toHaveBeenCalledTimes(3);
    expect(h.writer).toHaveBeenCalledTimes(1);
    return { txid: 'mock-debit' };
  });
  const submission = controller.submitNexus(draft.id);
  await h.validating;
  h.finishValidation();
  await acknowledgement.written;
  expect(h.debit).not.toHaveBeenCalled();
  expect(h.loadScope).toHaveBeenCalledTimes(2);
  acknowledgement.acknowledge();
  const submitted = await submission;

  expect(submitted.state).toBe('awaiting_service_credit');
  expect(submitted.debitTxid).toBe('mock-debit');
  expect(h.readDisk()).toEqual({ ...h.initial, swapJournal: { version: 1, jobs: [submitted] } });
  expect(h.debit).toHaveBeenCalledTimes(1);
  expect(h.loadScope).toHaveBeenCalledTimes(4);
  const restarted = h.openController();
  expect(restarted.get(draft.id)).toEqual(submitted);
  await expect(restarted.submitNexus(draft.id)).rejects.toThrow(/never retried/i);
  expect(h.debit).toHaveBeenCalledTimes(1);
});

const mappingJob = {
  ...draft, state: 'mapping_unknown', debitTxid: 'first-debit',
  sourceTxid: 'provider-credit', sourceContract: '0',
};

test.each(['genesis', 'nexusNetwork', 'solanaGenesis'])(
  '%s change during mapping intent acknowledgement blocks publication and retains recovery state', async field => {
    const h = harness(mappingJob);
    const controller = h.openController();
    const acknowledgement = h.delayNextAcknowledgement();
    const publication = controller.repairMapping(mappingJob.id);
    await acknowledgement.written;
    const intent = h.readDisk().swapJournal.jobs[0];
    expect(intent).toEqual({ ...mappingJob, mappingStartedAt: expect.any(String) });
    expect(h.publishMapping).not.toHaveBeenCalled();

    h.setScope({ ...scope, [field]: 'changed-context' });
    const rejected = expect(publication).rejects.toThrow(/scope changed/i);
    acknowledgement.acknowledge();
    await rejected;

    expect(h.publishMapping).not.toHaveBeenCalled();
    expect(h.debit).not.toHaveBeenCalled();
    expect(h.writer).toHaveBeenCalledTimes(1);
    expect(h.readDisk()).toEqual({ ...h.initial, swapJournal: { version: 1, jobs: [intent] } });
    expect(controller.get(mappingJob.id)).toEqual(intent);
    h.setScope(scope);
    const restarted = h.openController();
    expect(restarted.get(mappingJob.id)).toEqual(intent);
    await expect(restarted.repairMapping(mappingJob.id)).rejects.toThrow(/manual recovery/i);
    expect(h.writer).toHaveBeenCalledTimes(1);
    expect(h.publishMapping).not.toHaveBeenCalled();

    // Recovery requires exact host proof, not an inferred safe retry after the guard.
    const recovered = await restarted.recoverMapping(mappingJob.id, 'proven-address', 'proven-create');
    expect(h.verifyMapping).toHaveBeenCalledWith('proven-address', 'proven-create', intent);
    expect(recovered.state).toBe('awaiting_payout');
    expect(recovered.debitTxid).toBe(mappingJob.debitTxid);
    expect(recovered.sourceTxid).toBe(mappingJob.sourceTxid);
    expect(recovered.sourceContract).toBe('0');
    expect(h.openController().get(mappingJob.id)).toEqual(recovered);
    expect(h.publishMapping).not.toHaveBeenCalled();
    expect(h.debit).not.toHaveBeenCalled();
  }
);

test.each([
  ['unavailable', async () => null, /scope changed/i],
  ['rejected', async () => { throw new Error('Scope lookup failed'); }, /scope lookup failed/i],
])('%s post-mapping-intent scope read blocks publication without rewriting intent', async (name, readScope, error) => {
  const h = harness(mappingJob);
  const controller = h.openController();
  const acknowledgement = h.delayNextAcknowledgement();
  const publication = controller.repairMapping(mappingJob.id);
  await acknowledgement.written;
  const intent = h.readDisk().swapJournal.jobs[0];
  h.loadScope.mockImplementation(readScope);
  const rejected = expect(publication).rejects.toThrow(error);
  acknowledgement.acknowledge();
  await rejected;

  expect(h.loadScope).toHaveBeenCalledTimes(2);
  expect(h.publishMapping).not.toHaveBeenCalled();
  expect(h.debit).not.toHaveBeenCalled();
  expect(h.writer).toHaveBeenCalledTimes(1);
  expect(h.readDisk()).toEqual({ ...h.initial, swapJournal: { version: 1, jobs: [intent] } });
  expect(controller.get(mappingJob.id)).toEqual(intent);
  h.loadScope.mockImplementation(async () => clone(scope));
  const restarted = h.openController();
  expect(restarted.get(mappingJob.id)).toEqual(intent);
  await expect(restarted.repairMapping(mappingJob.id)).rejects.toThrow(/manual recovery/i);
  expect(h.writer).toHaveBeenCalledTimes(1);
  expect(h.publishMapping).not.toHaveBeenCalled();
});

test('unchanged scope publishes mapping once after acknowledged intent and preserves identities on restart', async () => {
  const h = harness(mappingJob);
  const controller = h.openController();
  const acknowledgement = h.delayNextAcknowledgement();
  h.publishMapping.mockImplementation(async (job, options) => {
    expect(h.readDisk().swapJournal.jobs[0]).toEqual(job);
    expect(job.mappingStartedAt).toEqual(expect.any(String));
    expect(job.state).toBe('mapping_unknown');
    expect(options).toEqual({ allowCreate: true });
    expect(h.loadScope).toHaveBeenCalledTimes(2);
    expect(h.writer).toHaveBeenCalledTimes(1);
    return { address: 'mock-mapping', txid: 'mock-create' };
  });
  const publication = controller.repairMapping(mappingJob.id);
  await acknowledgement.written;
  expect(h.publishMapping).not.toHaveBeenCalled();
  acknowledgement.acknowledge();
  const mapped = await publication;

  expect(mapped).toEqual({
    ...mappingJob, mappingStartedAt: expect.any(String),
    state: 'awaiting_payout', mappingAddress: 'mock-mapping', mappingTxid: 'mock-create', reason: '',
  });
  expect(h.writer).toHaveBeenCalledTimes(2);
  expect(h.publishMapping).toHaveBeenCalledTimes(1);
  expect(h.debit).not.toHaveBeenCalled();
  expect(h.validateFunding).not.toHaveBeenCalled();
  expect(h.readDisk()).toEqual({ ...h.initial, swapJournal: { version: 1, jobs: [mapped] } });
  const restarted = h.openController();
  expect(restarted.get(mappingJob.id)).toEqual(mapped);
  await expect(restarted.repairMapping(mappingJob.id)).rejects.toThrow(/not allowed/i);
  expect(h.publishMapping).toHaveBeenCalledTimes(1);
  expect(h.writer).toHaveBeenCalledTimes(2);
});
