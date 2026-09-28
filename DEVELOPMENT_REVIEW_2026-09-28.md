# Development and architecture review — 2026-09-28

## Scope, source identity, and verdict

Review source is `/home/brutus/github/DEX`, sanitized origin
`https://github.com/distordialabs-brutus/DEX.git`, branch `master`, at
`19982fbb6af95c79bc1e2414d3d25c24f07657fd`. `origin/master` has the same local
remote-tracking identity. The user-supplied September 25 baseline is the current head: the range
`19982fbb..HEAD` contains no commits and no tracked path delta.

The baseline commit is documentation/evidence-only. Relative to runtime baseline
`416855d14ab605450bdf4ead92b66ded5e931330`, every changed path is Markdown or a SHA-256 evidence
manifest. Before this review's documentation edits, the committed
`docs/review_evidence/2026-09-25/reviewed-sources.sha256` verified all 53 entries. In the final
candidate, its two expected failures are the intentionally updated `ARCHITECTURE.md` and
`SWAP_SERVICE_DEVELOPMENT_PLAN.md`; the dedicated 36-file runtime-source manifest still passes in
full, and the other 51 broader entries remain unchanged.

The review started with index tree `34366ea36b552c3ae4ea5f4cb7a98101fb6f7ea5` and only these
pre-existing untracked paths:

- `docs/review_evidence/2026-09-22/`
- `vision.md`

They were read, hash-checked and preserved. Nothing was staged, reset, stashed, cleaned, committed or
pushed. No package installation, dependency upgrade, wallet action, signer invocation, live service
call, RPC call or chain transaction was performed.

**Verdict:** funding must remain disabled. The exact current client retains the cross-window journal
and uncertain-acknowledgement failures, browser-local signer coordination, Redux hydration error,
and absence of rendered-component/target-wallet/live evidence. The empty
`ACCEPTED_DEPLOYMENTS` registry and missing host capability currently contain financial reachability.
Green offline gates do not close those activation blockers.

## Implementation continuity and architecture readback

There is no implementation change to assess after the requested baseline. Current source still has
the following boundaries:

- `src/swap/persistence.js` hydrates one private `data` snapshot and later reads/writes from that
  cache. It has no authoritative reread, revision, CAS, operation identity or unknown-commit
  reconciliation.
- `src/swap/jobs.js` holds a named Web Lock across a transaction, but each coordinator reads its own
  persistence snapshot. The lock serializes stale decisions; it does not make one snapshot
  authoritative.
- `src/swap/controller.js` correctly writes `submission_unknown` before `submitDebit` and refuses
  automatic same-instance resend. That safety does not survive stale independent coordinators or
  journal erasure.
- `src/configureStore.js` names `NEXUS.utilities.updateStorageAcknowledged` as a future gate, while
  installed `nexus-module` 1.1.11 exports only `updateStorage`. Settings continue through the legacy
  writer and can address the same full envelope.
- `src/reducers/index.js` merges the complete `storageData` into Redux during `INITIALIZE`, admitting
  `swapJournal` even though the combined reducer owns only `ui`, `settings`, and `nexus`.
- `test/swap/integration.test.cjs` reads source and traverses the `Main.js` AST. Its “mounted component
  branch” title does not represent a React mount, DOM event, effect, or cleanup.
- `src/swap/deployment.js` keeps `ACCEPTED_DEPLOYMENTS` empty. `runtime.js` also blocks funding when
  acknowledged storage is absent. These remain effective current containment.

The storage repair is now specified normatively in
[`docs/HOST_STORAGE_CONTRACT.md`](docs/HOST_STORAGE_CONTRACT.md). It defines host-owned context and
revision authority, atomic CAS with idempotent operation receipts, truthful unknown-commit readback,
safe conflict handling before and after a remote side effect, migration, Redux projection, and a
default-collected two-context fault matrix.

## Fresh local verification

Execution used the unchanged dependency tree with Node `v22.23.2` and npm `10.9.8`. Repository CI
uses Node 20. No `npm ci`, audit, install or upgrade ran.

| Check | 2026-09-28 result |
|---|---|
| `npm run test:all` | PASS: 5 Jest suites / **41 tests**, then **110/110** reported Node subtests |
| Jest diagnostics | Three Redux unknown-`swapJournal` `console.error` calls; one expected no-session warning in `fetchExecuted` |
| `npm run lint:swap` | PASS: zero warnings/errors |
| `npm run lint` | PASS at configured threshold: **0 errors, 21 warnings** |
| `npm run build` | PASS: Webpack 5.99.9; app **1,287,841 bytes**, signer **580,804 bytes**, 3 performance warnings |
| Manifest existence | PASS: all **12** `nxs_package.json` files exist after build |
| Runtime-source manifest | PASS: **36/36** SHA-256 entries match; broader baseline manifest has only the 2 expected edited-doc differences |
| Baseline continuity | PASS: `19982fbb..HEAD` has no commit or tracked-path delta |
| Runtime continuity | PASS: `416855d..HEAD` changed only Markdown/SHA-256 evidence paths |
| Direct renderer dependencies | `npm ls react react-dom @testing-library/react react-test-renderer --depth=0` resolves none (exit 1) |
| Installed wallet shims | `nexus-module` 1.1.11 React/ReactDOM bridge files identify host version 19.1.0 |
| Exact-head remote CI | Not refreshed in this local documentation-only review |
| Live wallet/chains | Not exercised |

## Fresh offline fault probes

All probes use production DEX controller/coordinator or funding-call code with in-memory/mock
host/wallet boundaries. They do not authorize or perform live financial calls.

| Probe | Result | Scope limit |
|---|---|---|
| `persistence-lifecycle-probe.cjs` | Host-committed `submission_unknown` was erased by the next settings write; serialized stale windows left only `[job-B]`, losing `job-A` | In-memory host; no real wallet disk fault |
| `controller-two-window-probe.cjs` | Two controllers hydrated from one draft made **2** mocked debit calls; durable txid became `mock-wallet-debit-2` | Requires hypothetical enabled deployment and two explicit approvals; no live send |
| `signing-isolation-probe.cjs` | Same handoff in two isolated storage/lock namespaces made **2** mocked wallet submissions; main job remained `awaiting_signature` | Explicit consent in each fixture; no consent bypass |
| `dex-production-caller-probe.cjs` | Current release gate blocked; under a synthetic matching acceptance, 1,000-token unadvertised-max quotes and a 150-unit Nexus dust-gap quote passed DEX validation | Synthetic acceptance/policy; no service, RPC, wallet or funds |

## Findings

### Critical financial activation blockers

1. **Authoritative journal ownership is absent.** Shared Web Locks do not repair private hydrate-once
   snapshots. Independent windows can erase unrelated jobs and submit the same stale draft twice.
2. **Unknown commit plus legacy settings replacement can erase the no-resend marker.** A host may
   commit `submission_unknown` and lose the acknowledgement; the cached old envelope then overwrites
   it through `saveSettings`. This probe proves journal erasure. It does not by itself prove a second
   wallet call because the failed pre-submit persistence call blocks that invocation.
3. **Remote identity needs a post-call local-CAS rule.** Any repair must permit safe retry of only the
   local txid write after an unrelated settings conflict while forbidding a second wallet call.
   Same identity is idempotent; different identity, changed/missing job or unknown storage outcome
   must retain the first fact and hold.

### High money-contract and lifecycle defects

1. **Signer attempt coordination is origin/profile-local.** Separate browser storage/lock namespaces
   can each submit the same public handoff with explicit approval while the wallet journal remains
   `awaiting_signature`.
2. **Current provider policy is incomplete for activation.** The retained production-caller probe
   confirms DEX does not enforce unadvertised service maxima or Nexus input dust under a synthetic
   accepted deployment. This is latent while acceptance remains empty.
3. **Receipt/service and broader service recovery gates are not re-accepted here.** The September 22
   cross-protocol evidence and separately reviewed service findings remain external release inputs;
   this DEX-only review does not claim their current implementation state.

### Test and live-evidence gaps

1. The passing suite tolerates three Redux errors. `swapJournal` must bypass Redux while the complete
   host envelope still hydrates persistence.
2. No default-collected test mounts `StablecoinSwap`. The installed module injects React through
   wallet shims, but the repository lacks direct renderer dependencies. Choose supported Nexus
   Interface versions first and pin matching test-only React/renderer versions in a separate
   compatibility-reviewed lockfile change.
3. No target-wallet versioned storage, real rendering, restart, profile switch, target-node query,
   browser-wallet handoff, test-network settlement or exact-head remote CI was exercised.

### Operational and compatibility hardening

1. Keep dependency remediation separate. Current build/test evidence depends on the existing
   Nexus Interface-compatible lock; no forced audit fix belongs in the journal batch.
2. Keep accepted deployments empty until host, renderer, signer, service and test-network gates pass
   against exact candidate identities.
3. Keep the app/signer size warnings visible. Bundle splitting is subsequent compatibility work, not
   a substitute for safety evidence.

### Positive controls actually verified

- Empty deployment acceptance and absent acknowledged host storage block current funding.
- Intent-first, no-automatic-resend logic works within the existing single authoritative test
  instance.
- Exact BigInt quote math, immutable job fields, scope checks, source/payout evidence, mapping holds,
  classic SPL validation and static network policy retain their passing offline coverage.
- Strict swap lint remains clean; both production bundles and every declared manifest file build.
- `vision.md` remains consistent with fail-closed uncertainty, wallet-held authority, exact identity,
  integer money and evidence-before-claims. It remains untracked design context.

## Coder-ready repair order

1. Implement the logical API and invariants in `docs/HOST_STORAGE_CONTRACT.md` in the wallet/SDK and
   a DEX revisioned fake host. Do not add an acknowledgement-only wrapper.
2. Convert persistence to authoritative read + pure transition + bounded CAS conflict retry. Add
   operation readback and explicit storage holds for inconclusive commits.
3. Gate `secureApiCall` on proven commit of the exact `submission_unknown` operation. After return,
   retry only local identity persistence under the contract's exact preconditions.
4. Put every settings writer through the same CAS envelope or isolate journal storage from legacy
   replacement. Prove migration preserves unknown fields and old settings/journals.
5. Project only `ui/settings/nexus` into Redux and fail tests on unexpected console output.
6. Add the default-collected two-window/crash/restart matrix, then a real rendered component suite,
   then wallet-installed storage/rendering acceptance. Repair signer handoff only after the host
   authority exists.
7. Close complete service policy/receipt/recovery exits and run explicitly authorized non-production
   end-to-end tests before adding any deployment acceptance entry.

## Publication commands

Run from `/home/brutus/github/DEX` against the intended final candidate:

```bash
npm run test:all
npm run lint:swap
npm run lint
npm run build
node -e "const fs=require('node:fs');const m=require('./nxs_package.json');for(const f of m.files){if(!fs.statSync(f).isFile())throw new Error('Missing '+f)};console.log('All module manifest files exist')"
sha256sum -c docs/review_evidence/2026-09-23/runtime-sources.sha256
git diff --check
git status --short --branch
```

If publishing these documentation changes later, stage only the explicitly reviewed documents, run
the full gate against that exact candidate, commit/push only with authorization, read back the remote
head, and inspect CI for that exact SHA. No publication action was taken here.

## Review artifacts and changed documentation

Full local evidence artifact:

- `/home/brutus/.hermes/profiles/principal-dev/cache/scratch/dex-architecture-review-2026-09-28.md`

Repository documentation created or updated by this review:

- `ARCHITECTURE.md`
- `SWAP_SERVICE_DEVELOPMENT_PLAN.md`
- `docs/CROSS_CHAIN_SWAPS.md`
- `docs/HOST_STORAGE_CONTRACT.md` (new)
- `DEVELOPMENT_REVIEW_2026-09-28.md` (new)
- `IMPROVEMENTS.md`

The September 22 evidence directory and `vision.md` remain untracked and unstaged. Source, tests,
configuration, manifests and dependencies were not modified.