# Development and architecture review — 2026-09-10

## Scope and identity boundary

The current worktree was reviewed against the explicit 2026-09-09 evidence. The last verified Git identity remains `master` at `bd03f9021c6260d6481fb044053bbc5276315c0b`, with runtime baseline `593ff0a517e5da78dbf37f723f9cdcc4219e7284`.

The 2026-09-10 Git status/HEAD/tracking/log readback was approval-denied before execution. It was not rerouted. Consequently this review does not claim a current HEAD, commit delta, clean tree, branch alignment, remote SHA, or exact-head CI result. Fresh SHA-256 readback does establish that the manifest, lockfile, wallet manifest, and principal safety-boundary files below are byte-identical to the 2026-09-09 reviewed snapshot.

No production chain, wallet, node, profile/session, or funds-moving call was made. Dependency upgrades remain deliberately deferred for Nexus Interface compatibility.

## Current source and safety findings

1. **P0 funding containment remains intact in the inspected code.** `src/swap/deployment.js` keeps `ACCEPTED_DEPLOYMENTS` empty and `assertDeploymentAccepted` requires exact provider/network/direction evidence plus a direction-specific dust floor.
2. **P0 durable-intent containment remains intact.** `src/configureStore.js` requires the future `NEXUS.utilities.updateStorageAcknowledged` capability. `src/swap/persistence.js` rejects missing/non-Promise/negative acknowledgements, serializes settings and journal writes, applies a 900,000-byte limit, and faults closed for later funding.
3. **P1 Redux hydration defect remains.** `src/reducers/index.js` sends the entire prior state to `combineReducers` before handling `INITIALIZE`, so persisted `swapJournal` still produces Redux's unknown-root-key diagnostic. The fresh Jest run reproduced it three times.
4. **Funding code remains uncertainty-preserving.** `src/swap/controller.js` persists intent before Nexus debit, retains `submission_unknown` when no transaction ID is returned, blocks automatic resubmission, verifies source/mapping/payout identities, and rechecks wallet/network scope around asynchronous evidence.
5. **Release evidence remains absent.** There is still no accepted deployment, acknowledged target-wallet storage, mounted swap interaction suite, or isolated live Nexus/Solana/service acceptance. Offline green tests do not satisfy those exits.
6. **P0 maintained README guidance conflicts with the fail-closed runtime.** `README.md:95-138` advertises a working USDC/USDD bridge, instructs manual funding with a fixed memo, publishes fixed fees/minima and mainnet identity, calls the flow intermediary-free, and suggests a `SOLANA_RPC_URL` override. The inspected runtime is a custodial provider workflow with an empty accepted-deployment list, provider-derived terms, and static RPC policy. The README funding instructions must not be followed and should be replaced with read-only/release-gate status before distribution.
7. **Repository quality and dependency debt remains.** Whole-repository lint still reports 21 warnings. Build size remains 1.23 MiB for `app.js` and 567 KiB for `solana-signer.js`, with three Webpack performance warnings. A fresh `npm ci` reported 36 audit findings (4 low, 14 moderate, 16 high, 2 critical); no audit fix was applied because dependency/security remediation is explicitly deferred until Nexus Interface compatibility is proven.

## Reviewed snapshot hashes

These 2026-09-10 values exactly match the values recorded on 2026-09-09:

| Inspected file | SHA-256 |
|---|---|
| `package.json` | `98de914cc787f7c8e1585724b19d6cded5b7c20ffaa40e9aed65a3d5a917fd2a` |
| `package-lock.json` | `8bcd93593b25d884e0e880f2e189e6014adbef03c8cd25b95aacc6d4c5533fcf` |
| `nxs_package.json` | `7db2bda23b01cd49e9032af4a1481f960b8dd99ec61c4ba5a282bdeea0448f14` |
| `src/swap/deployment.js` | `baee61c193fba359a491ac4e5580d2a15789a6985636e203b4e58dc51c6c9963` |
| `src/swap/persistence.js` | `26b7284eece7ba1581f7f656fe9000f64176c1b665b9c2c40dfd6507274869a6` |
| `src/configureStore.js` | `409f78f8206faa4d3eb0d3c7ab4c768619332be996c200a407dfe1f8ae70f637` |
| `src/reducers/index.js` | `b691f0ce39e64c2b28da1d3dc35bb78f47a9756e798f3b5ba051790589bb4cb9` |

## Verification executed

| Command | 2026-09-10 result |
|---|---|
| `npm ci` | **PASS** — 1,056 packages installed; audit reported 36 findings (4 low, 14 moderate, 16 high, 2 critical); no upgrade/fix applied |
| `npm test -- --ci --coverage` | **PASS** — 5 Jest suites / 41 tests; 78.4% statements, 62.24% branches, 67.9% functions, 86.18% lines; known `swapJournal` Redux diagnostics remain |
| `npm run test:swap` | **PASS** — 110 tests |
| `npm run lint` | **PASS with debt** — 0 errors, 21 warnings |
| `npm run lint:swap` | **PASS** — zero warnings |
| `npm run build` | **PASS with 3 performance warnings** — `app.js` 1.23 MiB, `solana-signer.js` 567 KiB |
| CI manifest-file verification command | **NOT EXECUTED** — approval denied after build; not retried or rerouted |

These are current-worktree offline gates, not exact-commit CI or live-chain acceptance.

## Decision and next exits

Cross-chain funding remains correctly fail-closed and not release-ready. Preserve both funding gates. First remove the unsafe README funding guidance; then add mounted user-interaction coverage, a warning-free split between reducer-owned hydration and `swapJournal`, real target-wallet acknowledged-storage semantics, and isolated read-only/non-production M3/M4 live acceptance before any evidence-pinned deployment entry.

## Publication status

Updated review-owned paths are `ARCHITECTURE.md`, `SWAP_SERVICE_DEVELOPMENT_PLAN.md`, and this file. Staging, commit, push, remote-SHA readback, and CI lookup were not attempted because the prerequisite Git identity/worktree command was approval-denied. Publication must resume only after that approval boundary is cleared and unrelated work is proven preserved.
