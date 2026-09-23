# Development and architecture review — 2026-09-23

## Scope, continuity, and verdict

DEX review start and end source identity is `master`/`origin/master` at
`416855d14ab605450bdf4ead92b66ded5e931330`, exactly the prior reviewed DEX
runtime. `git log 416855d..HEAD` and `git diff 416855d..HEAD` are empty. There
has therefore been **no runtime, test, build, manifest, lockfile, or CI
development since the prior `416855d` review**. This review re-executes the
offline gates, re-inspects the named safety boundaries, and updates
architecture/planning documentation; it does not claim a new implementation.

The worktree already contained the September 22 documentation/evidence update.
That work was preserved and extended. No runtime source, test, dependency,
configuration, manifest, lockfile, or Git index entry was changed. No reset,
stash, clean, broad staging, commit, push, package installation, dependency
upgrade, wallet operation, RPC call, service call, signer invocation, or
on-chain action was performed.

**Verdict:** funding must remain disabled. `ACCEPTED_DEPLOYMENTS` is empty and
the current wallet contract cannot establish authoritative cross-window journal
state. The offline suites and build remain green, but they do not cover the
reproduced stale-journal duplicate submission, uncertain-write/settings
overwrite, Redux hydration diagnostic, or real rendered-component behavior.

## Executed offline verification

Execution used the existing dependency tree with Node `v22.23.2` and npm
`10.9.8`; no install or audit-fix command ran. Repository CI targets Node 20.

| Command / check | 2026-09-23 result |
|---|---|
| `npm run test:all` | PASS: 5 Jest suites / **41 tests**, then **110/110** Node swap tests |
| Jest diagnostics | Tests pass, but `configureStore.test.js` emits **3** Redux `Unexpected key "swapJournal"` errors; `fetchExecuted.test.js` emits the expected no-session warning |
| `npm run lint:swap` | PASS: zero warnings |
| `npm run lint` | PASS at configured threshold: **0 errors, 21 warnings** |
| `npm run build` | PASS: Webpack 5.99.9; `app.js` **1.23 MiB**, `solana-signer.js` **567 KiB**, 3 performance warnings |
| Manifest verification | PASS: all **12** `nxs_package.json` entries exist after build |
| `git diff --check` / `git diff --cached --check` | PASS |
| Branch/source continuity | `HEAD` = `origin/master` = prior review SHA `416855d14ab605450bdf4ead92b66ded5e931330` |
| Live wallet/chains | **Not exercised**; no mainnet, testnet, RPC, wallet, key, signer, service, or funds action |

The build's stale Browserslist-data notice was not acted on because dependency
updates are intentionally compatibility-gated for Nexus Interface.

## Findings

### P0 — journal persistence is not authoritative across controllers/windows

`src/swap/persistence.js` hydrates one private `data` snapshot per coordinator
and thereafter reads only that cache. `src/swap/jobs.js` acquires a shared Web
Lock before calling `persistence.readJournal()`, but the lock serializes stale
snapshots; it does not refresh host storage and performs no revision/CAS check.
`src/swap/controller.js` correctly persists `submission_unknown` before the
wallet mutation **within one store**, but that protection is not global when a
second controller was hydrated from the same earlier draft.

The retained offline probe using the real persistence coordinator, job store,
and controller was rerun with only host/wallet boundaries mocked:

```text
sameJob: same-job
serializedWindows: 2
mockedDebitCalls: 2
retainedTxid: mock-wallet-debit-2
```

Both calls ran under one serialized lock, yet the second controller still saw a
stale `draft`, invoked the mocked debit again, and replaced the first remote
identity. This is a conditional activation defect, not evidence of a live
duplicate transfer: it requires funding enabled, two writable contexts sharing
the target, and two wallet approvals. The shipped empty acceptance registry
contains it.

The separate lost-ack probe was also rerun. The mocked host committed a
`submission_unknown` journal and then rejected its acknowledgement; a later
legacy settings save wrote the coordinator's stale full snapshot and reduced
`swapJournal.jobs.length` to zero. A second serialized coordinator likewise
replaced `job-A` with `job-B`. This proves journal erasure/lost update. It does
not by itself prove a second wallet call because the failed pre-submit
acknowledgement blocks that invocation; the controller probe above establishes
the separate duplicate-call path.

**Required repair and executable exit:**

1. Define a wallet-owned authoritative storage protocol with atomic
   read-modify-write, monotonic revision/CAS, durable acknowledgement, and an
   explicit uncertain-ack readback result. Alternatively, isolate the financial
   journal from every legacy full-snapshot settings writer.
2. Make every controller/window reread the authoritative revision while holding
   the host transaction/lock; a promise-shaped wrapper around
   `updateStorage()` is insufficient.
3. Add default-collected regressions using two real coordinators/controllers:
   same job submits one mocked wallet mutation; independent jobs are both
   retained; first remote identity cannot be overwritten; rejected/lost/delayed
   acknowledgement plus settings saves preserve the uncertain row; restart
   reads the same result.
4. Keep all acceptance records empty until the supported Nexus Interface host
   passes the same cases with real module storage, independent windows,
   profile/context switching, capacity failure, crash, and restart.

### P1 — Redux hydration crosses the journal ownership boundary

The root reducer owns exactly `ui`, `settings`, and `nexus`, but
`src/reducers/index.js` merges the full `storageData` object into Redux during
`INITIALIZE`. This temporarily creates a `swapJournal` root. The next
`combineReducers` pass warns and discards it. `src/configureStore.js` separately
passes the complete storage object to the persistence coordinator, so Redux does
not need or own this journal key.

All three current configure-store tests pass while each emits Redux's
`Unexpected key "swapJournal"` diagnostic. The journal remains available in the
coordinator in these fixtures; the warning is not proof of current loss. It is
proof that the hydration contract is wrong and that the suite permits an
unexpected error.

**Required repair and executable exit:** project only reducer-owned roots into
Redux while passing the untouched storage object to
`persistence.hydrate()`. Extend the collected configure-store test to spy on
`console.error` and require: exact `ui/settings/nexus` roots, zero unknown-key
diagnostics, byte-equivalent journal readback, and a later settings save that
preserves the newest authoritative journal. Run:

```sh
npm test -- --ci --runInBand __tests__/configureStore.test.js
```

Acceptance is all tests passing with no unexpected console output, followed by
the complete offline gate.

### P1 — there is still no real rendered cross-chain component test

`test/swap/integration.test.cjs` reads source text and parses `Main.js` with
Babel. The test titled “mounted component branch” counts JSX nodes; it does not
mount `StablecoinSwap`, dispatch DOM events, run React effects, or verify user
interaction. Repository search found no Testing Library, ReactDOM test render,
or react-test-renderer usage in the collected tests.

The existing local dependency graph resolves `react`, but not `react-dom`,
`react-dom/client`, `@testing-library/react`, or `react-test-renderer`. Production
bundling resolves host-injected aliases through `nexus-module`. No packages were
installed to manufacture a green harness during this documentation-only review.

**Required repair and executable exit:** add a compatibility-approved,
default-collected rendered harness for the real
`StablecoinSwap({ runtimeOverride })`. Drive controls through DOM events and
cover complete/incomplete/empty/error discovery, immutable-address selection
failure, quote and consent invalidation, blocked storage/deployment, double
activation, stale promises, wallet/profile/cluster change, unmount/timer
cleanup, and every state-specific recovery control. Rename the AST test as
source-wiring evidence. Acceptance requires the focused rendered suite,
`npm run test:all`, lint, and build with no unhandled rejection or timer leak;
it still does not replace target-wallet rendering.

### P1 — multi-controller/window safety belongs at the host boundary

A module-side Web Lock plus per-instance cache cannot provide global at-most-once
semantics. The proposed `updateStorageAcknowledged(data)` is necessary but not
sufficient unless its host implementation also exposes authoritative revisioned
read/commit semantics across every module writer and window. Independent browser
profiles/origins additionally remain outside same-origin Web Locks and signer
localStorage. Preserve explicit consent requirements, but do not advertise
wallet-global exactly-once behavior until a wallet-owned handoff/attempt record
is proven.

### External release gates remain open

The September 22 cross-repository findings remain active because DEX runtime is
unchanged: public service terms omit directional maximums and Nexus input dust;
client finality is not negotiated from the actual service policy; required
Solana→Nexus source-bound receipts conflict with current production service
admission; and backend recovery/admission/hold-resolution evidence remains
incomplete. These were not re-tested against a new swapService revision in this
DEX-only continuity review. Keep them separated from the locally reproduced DEX
persistence, hydration, and rendering gaps.

## Positive controls revalidated

- Funding remains fail-closed through an empty deployment acceptance registry
  and missing acknowledged wallet-storage capability.
- Within one controller/store, intent-first transitions, unknown-outcome holds,
  exact remote identity checks, immutable intent fields, composite source
  identity, and no blind resubmission remain covered by the 110-test swap suite.
- Exact BigInt quote/protocol code, address-bound provider selection, classic SPL
  transaction checks, and source-bound payout evidence compile and pass their
  offline fixtures.
- The build produces both required bundles and all 12 declared module files.

These controls are valuable containment and regression evidence. They do not
establish authoritative cross-window durability, target-wallet rendering,
service solvency, live finality, or production readiness.

## Actionable priority order

1. **Authoritative journal protocol:** host transaction/revision/CAS plus
   uncertain-ack readback; collected two-controller tests must fail before the
   repair and pass with one remote call and no lost identities.
2. **Redux boundary:** hydrate only `ui/settings/nexus`; require zero Redux
   diagnostics while preserving the full journal in its dedicated coordinator.
3. **Rendered UI gate:** mount the real component with `runtimeOverride`; test
   stale async work, consent, duplicate activation, recovery controls, and
   cleanup through DOM behavior.
4. **Wallet multi-context acceptance:** independent windows, restart, storage
   capacity/failure, profile change, and external signer handoff using supported
   Nexus Interface versions; do not emulate durable acknowledgement.
5. **Cross-repository policy/recovery acceptance:** complete max/dust/finality
   terms, production receipt eligibility, backend recovery/admission and exact
   disposition evidence before non-production two-direction transfers.
6. **Controlled enablement only after all exits:** pin exact DEX, wallet, node,
   service, provider, token, custody, and evidence identities. Do not add a
   mainnet acceptance record as part of testing.

Dependency/security upgrades remain a separate Nexus Interface compatibility
workstream. Do not run forced audit fixes as a substitute for these protocol
repairs.

## Review artifacts

- Reviewed runtime/test/configuration hashes:
  [`docs/review_evidence/2026-09-23/runtime-sources.sha256`](docs/review_evidence/2026-09-23/runtime-sources.sha256)
- Rerun offline diagnostic sources retained locally at
  `docs/review_evidence/2026-09-22/`; these local-only artifacts are excluded
  from the publication candidate
- Current bridge evaluation: [`SWAP_SERVICE_EVALUATION.md`](SWAP_SERVICE_EVALUATION.md)
- Current implementation order:
  [`SWAP_SERVICE_DEVELOPMENT_PLAN.md`](SWAP_SERVICE_DEVELOPMENT_PLAN.md)

The diagnostic scripts are evidence probes, not default-collected regression
tests and not live wallet/chain acceptance.