# Development and architecture review — 2026-09-12

## Scope and source identity

**Reviewed pre-publication head:** `cae41704cdddfdd5ce360bceea76fbe8bf0651fe` on `master`, equal to `origin/master` at review start.

**Executable baseline:** `593ff0a517e5da78dbf37f723f9cdcc4219e7284`. `git diff --name-status 593ff0a..cae4170` contains only `ARCHITECTURE.md`, `SWAP_SERVICE_DEVELOPMENT_PLAN.md`, and the 2026-09-08/09 review documents. There is no executable, dependency, manifest, build, test, or workflow delta to classify after the September 7 reconciliation.

The worktree started with older, unrelated documentation work: modified `ARCHITECTURE.md`, modified `SWAP_SERVICE_DEVELOPMENT_PLAN.md`, and untracked `DEVELOPMENT_REVIEW_2026-09-10.md`. They were preserved and excluded from this review's publication. Because the maintained architecture/plan were already dirty, today's architectural update is isolated in [`docs/ARCHITECTURE_REVIEW_ADDENDUM_2026-09-12.md`](docs/ARCHITECTURE_REVIEW_ADDENDUM_2026-09-12.md).

No dependency change, wallet/core call, profile/session action, chain query, financial mutation, runtime repair, reset, stash, or clean operation was performed.

## Verdict

**Native DEX gates remain green with known debt; cross-chain funding remains correctly fail-closed and is not release-ready.** The implementation retains exact-unit/frozen-intent/evidence boundaries in the offline-tested cross-chain client, but no accepted deployment or acknowledged host storage exists and there is no target-wallet/live-service acceptance.

## Findings and actions

1. **P0 documentation mismatch corrected in this review.** The README no longer advertises an active fixed bridge or tells users to fund through hard-coded memo/fee/minimum/identity instructions. It now states that the workflow is custodial/provider-mediated, inspection-only, and blocked by deployment plus durable-storage gates.
2. **P0 funding containment remains present.** `src/swap/deployment.js` keeps `ACCEPTED_DEPLOYMENTS` empty and requires exact provider/network/direction identity plus a reviewed dust floor. `src/configureStore.js` requires `NEXUS.utilities.updateStorageAcknowledged`; current Nexus Interface does not supply that contract.
3. **P1 Redux hydration warning is reproduced.** `src/reducers/index.js` calls `combineReducers` with persisted state before separating `swapJournal`. The Jest run emitted the unknown-root-key diagnostic three times. Split reducer-owned state from the persistence journal and require a warning-free integration regression.
4. **P1 rendered interaction and host acceptance remain absent.** The 110 swap tests exercise production closures with mocked boundaries, but current integration checks do not mount the React page. Target-wallet durable-write, signer handoff, restart, profile/network switch, and live test-service behavior remain unproven.
5. **P2 repository debt remains measurable.** Whole-repository ESLint reports 21 warnings. Webpack emits a 1.23 MiB app and 567 KiB signer and reports three performance warnings. Keep dependency upgrades separate and compatibility-tested; do not apply forced audit fixes.

## Source hashes

| File | SHA-256 |
|---|---|
| `package.json` | `98de914cc787f7c8e1585724b19d6cded5b7c20ffaa40e9aed65a3d5a917fd2a` |
| `package-lock.json` | `8bcd93593b25d884e0e880f2e189e6014adbef03c8cd25b95aacc6d4c5533fcf` |
| `nxs_package.json` | `7db2bda23b01cd49e9032af4a1481f960b8dd99ec61c4ba5a282bdeea0448f14` |
| `src/swap/deployment.js` | `baee61c193fba359a491ac4e5580d2a15789a6985636e203b4e58dc51c6c9963` |
| `src/swap/persistence.js` | `26b7284eece7ba1581f7f656fe9000f64176c1b665b9c2c40dfd6507274869a6` |
| `src/configureStore.js` | `409f78f8206faa4d3eb0d3c7ab4c768619332be996c200a407dfe1f8ae70f637` |
| `src/reducers/index.js` | `b691f0ce39e64c2b28da1d3dc35bb78f47a9756e798f3b5ba051790589bb4cb9` |
| `src/swap/controller.js` | `27121a40815f3379d6b81dc2e83cad92bd99e021dbf244965238326cd577aa7b` |

These principal hashes match the 2026-09-10 recorded snapshot; today's Git continuity check additionally establishes the current head and documentation-only delta.

## Verification executed

| Gate | 2026-09-12 result |
|---|---|
| Git identity and start-state readback | **PASS** — local/upstream `cae41704cdddfdd5ce360bceea76fbe8bf0651fe`; three older dirty documentation paths recorded |
| Runtime continuity | **PASS** — post-runtime-baseline delta contains documentation only; principal source hashes unchanged |
| `npm run test:all` | **PASS** — 5 Jest suites / 41 tests plus 110 swap tests; known `swapJournal` diagnostic reproduced |
| `npm run lint` | **PASS with debt** — 0 errors, 21 warnings |
| `npm run lint:swap` | **PASS** — zero warnings |
| `npm run build` | **PASS with 3 performance warnings** — `app.js` 1.23 MiB; `solana-signer.js` 567 KiB |
| Manifest-listed file existence | **PASS** — all 12 explicitly listed files exist after build |
| Fresh clean dependency install | **NOT RUN locally** — tests/build used the existing install; exact-head CI is expected to exercise `npm ci` |
| Live wallet/node/service acceptance | **NOT RUN** — excluded by safety scope |

## Next release exits

Keep both funding gates intact. Next: remove the reducer hydration warning; add mounted interaction coverage; prove acknowledged storage and restart semantics in supported Nexus Interface; run read-only target-node discovery; then run fault-injected, non-production M3/M4 acceptance for both directions. Populate no deployment acceptance until every identity and evidence path is pinned to the exact candidate.
