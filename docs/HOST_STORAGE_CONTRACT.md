# Authoritative host storage contract for swap journals

**Status:** required design contract; not implemented by the current DEX client, `nexus-module` 1.1.11, or the reviewed Nexus Interface boundary. Funding must remain disabled until the target wallet implements and passes this contract.

This contract governs the financial journal used by the cross-chain client. It is intentionally stronger than `NEXUS.utilities.updateStorage(data)`, which is a fire-and-forget full-snapshot write. A resolved Promise wrapper around that API does not satisfy this contract.

## Safety objective

For one module installation and wallet context, every renderer/window must observe one authoritative sequence of storage revisions. A mutation may proceed only after its intent is durably committed. Concurrent settings writes, independent windows, renderer restart, process crash, delayed acknowledgement, and storage-capacity failure must not erase or replace an in-flight job or its first remote identity.

The required sequence is:

```text
authoritative read -> pure transition -> compare-and-swap commit
-> prove commit -> invoke wallet at most once
-> compare-and-swap remote identity -> reconcile or hold
```

A Web Lock may reduce local contention, but it is not authority. Private hydrate-once caches and whole-object last-writer-wins updates are forbidden for the journal.

## Logical host API

Names below are normative logical operations, not claims about existing SDK exports. The wallet and module SDK may choose different names only if they preserve all inputs, outputs, and semantics.

```ts
type StorageSnapshot = {
  contextId: string;       // opaque host identity for module install + active wallet context
  revision: string;        // opaque, monotonic within contextId
  value: unknown;          // complete authoritative module value
};

type CommitRequest = {
  contextId: string;
  expectedRevision: string;
  operationId: string;     // globally unique and caller-stable for this intended commit
  value: unknown;
};

type CommitResult =
  | { status: 'committed'; revision: string; operationId: string; valueHash: string }
  | { status: 'conflict'; current: StorageSnapshot }
  | { status: 'outcome_unknown'; operationId: string };

type OperationResult =
  | { status: 'committed'; revision: string; operationId: string; valueHash: string }
  | { status: 'not_committed'; current: StorageSnapshot }
  | { status: 'unknown'; operationId: string };

readModuleStorageVersioned(): Promise<StorageSnapshot>;
compareAndSwapModuleStorage(request: CommitRequest): Promise<CommitResult>;
readModuleStorageOperation(contextId: string, operationId: string): Promise<OperationResult>;
```

A rejected call, missing response, malformed response, renderer termination, or context change is treated by the module as `outcome_unknown`; it is never silently converted to `conflict` or `not_committed`.

## Host invariants

1. **Authoritative read.** `readModuleStorageVersioned` reads host-owned current state, not a renderer cache. All windows reading one `contextId` observe the same revision sequence.
2. **Atomic CAS.** The host commits `value`, the next revision, and the operation receipt atomically only when `expectedRevision` equals the current revision. A conflict performs no write.
3. **Durable acknowledgement.** `committed` is returned only after the storage bytes and operation receipt meet the wallet's documented crash-durability boundary. Queueing an asynchronous filesystem write is not acknowledgement.
4. **Idempotent operation identity.** Repeating a committed `operationId` with identical content returns the original committed result. Reusing it with different content is rejected and surfaced as an integrity error.
5. **Truthful operation lookup.** `not_committed` is returned only when the host can authoritatively prove that operation did not commit. If receipts are unavailable, expired, corrupt, or ambiguous, return `unknown`. Receipts affecting a nonterminal financial job may not expire before that job is explicitly resolved.
6. **Opaque context binding.** The host rejects a commit if the active module installation, wallet/profile context, or storage target no longer matches `contextId`. The module must also keep its existing Nexus/Solana scope checks; `contextId` does not replace job scope.
7. **Capacity and validation are pre-commit.** Size-limit, serialization, permissions, and target-path failures leave the old revision/value intact and return a closed failure. Partial writes are never reported as committed.
8. **Unknown keys survive.** A module commit preserves top-level data it does not own. Migration must preserve existing settings, journal data, and future/foreign envelope fields.
9. **No stale full-snapshot bypass.** Every writer that can address the journal uses this CAS protocol. Alternatively, the journal lives in a separate host namespace that legacy settings writers cannot overwrite. A legacy `updateStorage` call may not replace a namespace containing the journal.
10. **Readback is exact.** The returned `valueHash` is computed by the host over its persisted representation. Operation reconciliation compares the intended hash and the job's immutable content/identity, not revision alone.

## Module transition rules

The module coordinator must expose a pure transition over a supplied authoritative snapshot. The transition performs no wallet, RPC, timer, UI, or storage calls and returns either a complete next value plus operation intent, or a closed domain result.

### Safe conflict retry

For transitions before any external side effect—draft creation, cancellation, and `draft -> submission_unknown`—a CAS conflict is retried by rereading the returned/current snapshot and recomputing the transition. Never resubmit the same stale candidate unchanged.

Retry is bounded. Repeated conflicts end in a visible storage hold; they do not bypass persistence.

### Nexus submission

1. Read the authoritative snapshot and require the exact job to be `draft` in the active scope.
2. Generate one submission operation ID and include it in the job transition to `submission_unknown`.
3. CAS that complete transition. On `conflict`, recompute from the fresh snapshot. If another context already moved the job out of `draft`, stop without invoking the wallet.
4. On a missing/unknown acknowledgement, query the operation and reread authority. Proceed only if the host proves that the intended operation committed and the exact immutable job is `submission_unknown` with the same submission operation ID. Otherwise retain a visible non-sendable storage hold.
5. Only the original, uninterrupted controller invocation that won this submission CAS may call `secureApiCall` after step 4, and only if it has not already invoked the wallet. A host receipt proves a storage commit, not whether the wallet was called. Restart, a second controller, or a recovered operation ID must never regain send authority from that receipt. A thrown error, timeout, malformed response, or missing txid leaves `submission_unknown` and is never automatically retried.
6. Record the returned txid with a second operation ID. If an unrelated settings/job commit causes a CAS conflict, reread and retry this **local identity write only** when the same job remains at the same submission operation, has no remote identity, and all immutable terms match. Do not call `secureApiCall` again.
7. If the same txid is already present, treat identity persistence as idempotently complete. If a different txid, changed job, missing job, changed context, or ambiguous storage operation is observed, retain both known facts in an operator-visible hold and never overwrite the first identity.

### Crash interpretation

- Crash after intent commit but before the wallet call: restart sees `submission_unknown`; no automatic resend is allowed because it cannot prove the call did not occur.
- Crash after wallet acceptance but before identity persistence: restart sees `submission_unknown`; exact manual/authoritative remote proof may attach the identity, but a new send is forbidden.
- Crash after identity commit but before acknowledgement: operation lookup or exact authoritative readback may complete recovery. An inconclusive result remains held.

This conservative boundary can produce a zero-send unresolved job; it must never produce a second send by guessing.

### Settings and Redux

Settings must either use the same authoritative CAS envelope or a physically/logically separate namespace. If they share the envelope, a settings transition starts from a fresh authoritative snapshot and modifies only `settings`, preserving the exact current journal and unknown fields.

`INITIALIZE` must pass the untouched host envelope to the persistence coordinator, while Redux receives only reducer-owned roots: `ui`, `settings`, and `nexus`. `swapJournal` is never a Redux root and Redux is never journal authority.

## Migration from current storage

1. The host assigns an initial revision to the existing module value without rewriting it through renderer state.
2. DEX performs an authoritative read and validates the existing `swapJournal`. Read/parse/validation failure blocks funding and preserves the bytes for export/recovery.
3. The first versioned write preserves `settings`, `swapJournal`, and all unknown fields. Two windows attempting migration yield one commit and one conflict/re-read; neither may initialize from an empty default after a failed read.
4. Legacy settings middleware is removed from the journal namespace only after migration tests prove no caller can issue an unversioned full-snapshot write.
5. A wallet/profile/context switch during migration invalidates the operation. It must not redirect a commit to the new active context.
6. Funding stays disabled throughout migration and until restart readback proves the revision, value, and operation receipts survive the target wallet's real durability boundary.

## Default-collected acceptance matrix

Tests must use two real `createModulePersistence`/job-store/controller instances and a revisioned fake host that implements the contract. Mock only host storage and wallet transport.

| Case | Required result |
|---|---|
| Same draft submitted from two hydrated windows | Exactly one mocked wallet call; both controllers observe the same submission operation and remote identity. |
| Two independent jobs created from stale windows | Both jobs survive in one authoritative journal after conflict/recompute. |
| Settings races with pre-submit intent | Settings and `submission_unknown` both survive; wallet call occurs only after proven intent commit. |
| Settings races with returned txid persistence | The local identity CAS retries safely; one wallet call; settings and the first txid both survive. |
| Host commits intent then loses acknowledgement | Operation lookup/readback either proves the exact commit before one wallet call or leaves a no-call storage hold. |
| Host commits txid then loses acknowledgement | Restart recovers the same txid; no wallet retry and no settings overwrite. |
| Delayed old-window acknowledgement | It cannot replace a newer revision or mark a stale candidate current. |
| Same operation ID, same payload | Host returns the original committed receipt and revision. |
| Same operation ID, different payload | Integrity failure; no write and no wallet call. |
| Crash after intent, before wallet | Restart remains non-sendable `submission_unknown`. |
| Crash after remote acceptance, before txid commit | Restart remains non-sendable; exact proof can recover; automatic resend is impossible. |
| First identity already present, second differs | First identity is immutable; job enters visible operator hold. |
| Capacity/serialization/disk failure | Prior revision remains exact; no wallet call. |
| Profile/context switch during read/commit/call | Commit or action is rejected; no cross-context write or wallet call. |
| Third context after restart | Reads the same revision, jobs, uncertainty, and operation receipts. |
| Redux initialization with journal present | State has exactly `ui/settings/nexus`; persistence reads the exact journal; no unexpected console output. |

The regression titles must name the real boundary. The existing single-instance tests and shared-Web-Lock test remain useful but do not satisfy this matrix.

## Target-wallet acceptance

After fake-host tests pass, repeat the matrix in each supported Nexus Interface version with an installed production module. Capture exact wallet, `nexus-module`, DEX, and test-harness revisions. Exercise independent windows, process termination, restart, profile switch, capacity rejection, and a host commit followed by a deliberately lost renderer acknowledgement. Inspect the persisted target and operation receipt after every injected fault.

No live financial call is needed to validate storage: the wallet mutation remains mocked until the storage contract passes. Funding acceptance and test-network settlement are later gates.