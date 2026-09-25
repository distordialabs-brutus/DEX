# Development and architecture review — 2026-09-25

## Scope, continuity, and verdict

Review source is `master`/`origin/master` at
`d9ad9da0fb2011c227350c4ff90d8eaac4d657ea`. Compared with the September 23
runtime baseline `416855d14ab605450bdf4ead92b66ded5e931330`, the two intervening
commits (`1ded310`, `d9ad9da`) modify documentation and review evidence only.
They add/update `ARCHITECTURE.md`, this review lineage, `IMPROVEMENTS.md`, the
bridge plan/evaluation/history, `docs/CROSS_CHAIN_SWAPS.md`, and the September 23
hash manifest. There is **no runtime, test, dependency, manifest, lockfile,
build-configuration, or workflow implementation delta**. All 36 files in the
September 23 runtime-source manifest verify byte-for-byte at the current head.

The pre-existing untracked `docs/review_evidence/2026-09-22/` directory and
`vision.md` were read and preserved. Nothing was staged. No reset, stash, clean,
package installation, dependency upgrade, wallet action, signer invocation,
RPC/service call, deployment, or chain transaction was performed.

**Verdict:** funding must remain disabled. `ACCEPTED_DEPLOYMENTS` is empty, and
the unchanged client still has no authoritative wallet-owned cross-window
journal protocol. Fresh real-controller probes reproduce duplicate mocked
submission and journal loss. The configured gates and exact-head CI are green,
but they permit Redux diagnostics and provide no rendered component, target
wallet, or live-chain acceptance.

## Implementation delta since the prior review

`git diff --name-status 416855d..d9ad9da` contains only:

- maintained architecture, improvement, development-plan, evaluation, and
  cross-chain operating documentation;
- the September 23 dated review and its 36-file source-hash manifest; and
- an unchanged historical evaluation archive.

The current source hashes match
`docs/review_evidence/2026-09-23/runtime-sources.sha256` in full. Consequently,
no prior defect can be closed from implementation evidence. The September 23
C-1/C-2, Redux hydration, rendered-test, host acceptance, and service/live
release exits remain open.

## Fresh verification

Execution used the existing dependency tree with Node `v22.23.2` and npm
`10.9.8`; repository CI uses Node 20. No install or audit command ran.

| Check | 2026-09-25 result |
|---|---|
| `npm run test:all` | PASS: 5 Jest suites / **41 tests**, then **110/110** Node swap tests |
| Jest diagnostics | Tests pass while configure-store emits **3** Redux unknown-`swapJournal` errors; fetch-executed emits one expected no-session warning |
| Focused configure-store | PASS: **3/3** tests, with the same 3 unexpected-key errors |
| Focused persistence/jobs/controller/integration shard | PASS: **31/31** tests |
| `npm run lint:swap` | PASS: zero warnings |
| `npm run lint` | PASS at configured threshold: **0 errors, 21 warnings** |
| `npm run build` | PASS: Webpack 5.99.9; app **1,287,841 bytes**, signer **580,804 bytes**, 3 performance warnings |
| Manifest check | PASS: all **12** declared files exist after build |
| September 23 runtime hashes | PASS: **36/36** files match |
| Exact-head GitHub Actions | PASS: run `35822340652`, job `107056671375`, all install/lint/test/build/manifest steps for `d9ad9da` |
| Live wallet/chains | **Not exercised** |

The blocked composite shell command that combined build with an inline manifest
script was not bypassed. The build was run directly as its named gate; manifest
existence was then checked path-by-path. The dependency-resolution sub-probe in
a second blocked composite command was not rerouted. The unchanged source and
lockfile hashes preserve the September 23 dependency finding; current component
coverage is established directly from the collected test source and focused
execution.

## Focused safety findings

### P0 — authoritative journal repair is absent

`src/swap/persistence.js` still hydrates a private snapshot once and serves all
later reads from it. `src/swap/jobs.js` still serializes that cached read with a
Web Lock but performs no authoritative reread, revision check, or CAS.
`src/swap/controller.js` still persists `submission_unknown` before the wallet
call only within that instance's snapshot.

Fresh execution of the retained safe probes, with real coordinators/job
stores/controllers and mocked host/wallet boundaries, produced:

```text
same job / serialized windows: 2
mocked debit calls: 2
retained remote identity: mock-wallet-debit-2
lost-ack then settings save: submission_unknown -> zero jobs
two independent jobs: final durable set [job-B], job-A lost
```

This is an activation blocker, not evidence of a live double transfer. The
duplicate-call fixture requires an accepted deployment, shared writable host
storage, and two explicit wallet approvals. The lost-ack fixture independently
proves journal erasure; because its failed pre-submit acknowledgement blocks the
wallet call, it does not alone prove a duplicate mutation.

**Required implementation:** the wallet host must own an authoritative
`{revision, value}` and a compare-and-swap commit with durable operation identity
and closed `committed`, `conflict`, or `outcome_unknown` results. Every settings
and journal writer must use it, or the journal must live in an isolated host
namespace. Retry only revision conflicts after reread and pure transition
recomputation. Resolve unknown commits by operation/content readback or retain a
non-sendable hold. Revisions and operation outcomes must survive independent
windows and restart.

`submitNexus` may reach `secureApiCall` only after the CAS from `draft` to
`submission_unknown` is proven committed. Remote identity must CAS from that
exact uncertain revision. A second context must observe uncertainty and stop;
it must never overwrite the first remote identity.

### P1 — Redux hydration remains incorrectly broad

The root reducer owns `ui`, `settings`, and `nexus`, but `INITIALIZE` still merges
the complete `storageData`, temporarily introducing `swapJournal`. All three
focused tests pass while Redux reports the unknown key. Pass the untouched host
envelope to persistence, then merge only reducer-owned roots into Redux. Extend
the test to fail on unexpected `console.error`, assert exact root keys and exact
journal readback, and verify that a settings save cannot overwrite a newer host
revision.

### P1 — the component gate is still source wiring, not rendering

The two tests in `test/swap/integration.test.cjs` read source text and traverse
the `Main.js` Babel AST. The test title says “mounted component branch,” but no
React tree is mounted, no DOM event is dispatched, and no effect/cleanup path is
executed. Rename this as source-wiring evidence. Add a compatibility-approved,
default-collected jsdom renderer for the real
`StablecoinSwap({runtimeOverride})`; drive complete/incomplete/error discovery,
selection failure, quote/consent invalidation, storage/deployment blocking,
double activation, stale generations, recovery controls, profile/network
change, and unmount timer cleanup. Fail on unexpected console output, unhandled
rejection, and leaked timers. Any required dev dependency must be a separately
reviewed compatibility change, not a broad production upgrade.

### External gates remain separate

This DEX workstream did not rerun cross-protocol fixtures against the sibling service.
The parent review separately assessed service runtime `17f65a3e3b45281162c1604cd0a695a36dc55991`
and [published its September 25 evidence](https://github.com/distordialabs-brutus/swapService/blob/9f12211811331bae741702757e9d8259a16d55ff/docs/DEVELOPMENT_REVIEW_2026-09-25.md).
The exact total-empty-database recovery path is now contained, but partial/stale
restore authorization, complete dashboard admission and malformed-hold scheduling remain open.
The retained September 22 fixtures still govern the cross-protocol max/dust/finality
and receipt comparison. Do not reintroduce the historical blanket main-payout-cap-bypass
claim. A reputation badge or accepted deployment cannot substitute for service exits.

## Vision-derived architecture value

The untracked `vision.md` agrees with the current safety model and adds one useful
future constraint: namespace attestations, bonds, challenge history, and staked
accountability are inspectable evidence, not custody or settlement proof and not
permission to execute. Future provider-risk work should preserve the raw claim,
issuer/namespace, revision, source, and expiry and label observed, inferred, and
attested states separately. Discovery remains open; absence of a Distordia
attestation must not silently become an execution ban. This read-only product
work follows the journal, renderer, and live-acceptance exits and does not lower
them.

## Actionable coder handoff

1. Add failing, default-collected versions of both retained journal probes around
   a revisioned fake host and two real coordinators/controllers.
2. Implement the host read/CAS/operation-readback protocol across every writer,
   then make the module coordinator a pure transition plus authoritative commit.
3. Prove one call for the same job, both independent jobs retained, immutable
   first remote identity, conflict progress, lost/delayed/rejected-ack readback,
   settings coexistence, third-context restart, capacity failure, and profile
   switch containment.
4. Project only `ui/settings/nexus` into Redux and make unexpected console errors
   fail the focused suite without moving journal ownership into Redux.
5. Add and collect the real rendered component suite; rename the AST test.
6. Only then test the same storage and rendering contracts in supported Nexus
   Interface versions, followed by service and non-production network
   acceptance. Keep `ACCEPTED_DEPLOYMENTS` empty throughout repair testing.

## Artifacts and preservation

- Reviewed-source hashes:
  [`docs/review_evidence/2026-09-25/reviewed-sources.sha256`](docs/review_evidence/2026-09-25/reviewed-sources.sha256)
- Prior runtime manifest:
  [`docs/review_evidence/2026-09-23/runtime-sources.sha256`](docs/review_evidence/2026-09-23/runtime-sources.sha256)
- Current evaluation: [`SWAP_SERVICE_EVALUATION.md`](SWAP_SERVICE_EVALUATION.md)
- Current coding plan:
  [`SWAP_SERVICE_DEVELOPMENT_PLAN.md`](SWAP_SERVICE_DEVELOPMENT_PLAN.md)
- Current architecture: [`ARCHITECTURE.md`](ARCHITECTURE.md)

The September 22 review directory and `vision.md` remain untracked and unstaged.
The retained probes are offline diagnostics, not default-collected regressions
or target-wallet/live-chain acceptance.