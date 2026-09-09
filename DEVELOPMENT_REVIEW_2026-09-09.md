# Development and architecture review — 2026-09-09

## Scope and continuity

**Reviewed HEAD:** `bd03f9021c6260d6481fb044053bbc5276315c0b` (`master`, aligned with the locally recorded `origin/master` at review start).

**Runtime baseline:** `593ff0a517e5da78dbf37f723f9cdcc4219e7284`.

The worktree was clean at review start. The only commit after the runtime baseline is `bd03f90` (`docs: record 2026-09-08 architecture review`). Its delta is limited to `ARCHITECTURE.md`, `DEVELOPMENT_REVIEW_2026-09-08.md`, and `SWAP_SERVICE_DEVELOPMENT_PLAN.md`; there is no source, test, manifest, dependency, lockfile, build-configuration, or workflow delta to assess as new runtime work. The findings below are unchanged open defects and release gates, not regressions introduced since the prior review.

No production transaction, dependency upgrade, lockfile edit, code modification, stage, commit, or push was performed.

## Code evidence re-inspected

- `src/swap/deployment.js:7-20` still keeps `ACCEPTED_DEPLOYMENTS` empty and rejects funding without an exact evidence-pinned deployment and direction-specific dust floor.
- `src/configureStore.js:57-62` still requires the future `NEXUS.utilities.updateStorageAcknowledged` host capability. `src/swap/persistence.js:21-30` rejects absent/non-Promise acknowledgements and records a journal fault. These are independent funding gates.
- `src/reducers/index.js:43-51` still merges the entire `storageData`, including `swapJournal`, through `combineReducers`; the known unknown-root-key diagnostic has no repair in this head.
- `package.json` still configures `test:all`, repository lint, strict swap lint, and production build. Dependencies and `package-lock.json` are unchanged from the runtime baseline, consistent with the Nexus Interface compatibility deferral.

## Verdict and repair exits

Runtime architecture and release readiness are **unchanged since 2026-09-08**. Native and swap offline regressions previously passed, but cross-chain funding remains correctly fail-closed and is not release-ready.

1. **P0 — Preserve both funding gates.** Exit only after an exact supported Nexus Interface provides acknowledged durable storage proven across crash/restart, profile and module changes, and capacity failure; then complete both directions on isolated Nexus/Solana test networks with exact source, routing, payout, restart, timeout and duplicate-prevention evidence before adding a static accepted deployment. Do not manufacture acknowledgement with a Promise wrapper.
2. **P1 — Add mounted swap interaction coverage.** Exit when a user-driven mounted test covers complete/incomplete discovery, provider and pair changes, quote/consent invalidation, storage/deployment blocks, every held-state recovery control, rapid duplicate interaction, and stale observer cleanup. Source/AST checks remain supplemental only.
3. **P1 — Remove the Redux hydration boundary leak.** Exit when initialization with settings plus a pending journal produces zero `console.error` calls, no `state.swapJournal`, an unchanged persistence journal, and serialized settings/journal writes.
4. **P2 — Establish live semantics and package performance.** Exit after target-wallet read-only probes and non-production M3/M4 fault scenarios capture exact wallet/node/service/provider/client versions, and after measured code splitting keeps all emitted runtime files in the wallet manifest with an explicit numeric bundle budget.
5. **P2 — Retire the repository lint-warning baseline.** Exit when `npm run lint -- --max-warnings 0` passes with focused behavior tests for repaired effects rather than mechanical dependency-array edits.

Dependency upgrades and security remediation remain deferred until Nexus Interface compatibility is demonstrated; no blind or forced audit fix is an acceptable repair.

## Reviewed snapshot hashes

Committed tree: `efe636f7801d127b9241dc9f335ac67451cbd5fb`.

| Reviewed runtime file | SHA-256 |
|---|---|
| `package.json` | `98de914cc787f7c8e1585724b19d6cded5b7c20ffaa40e9aed65a3d5a917fd2a` |
| `package-lock.json` | `8bcd93593b25d884e0e880f2e189e6014adbef03c8cd25b95aacc6d4c5533fcf` |
| `nxs_package.json` | `7db2bda23b01cd49e9032af4a1481f960b8dd99ec61c4ba5a282bdeea0448f14` |
| `src/swap/deployment.js` | `baee61c193fba359a491ac4e5580d2a15789a6985636e203b4e58dc51c6c9963` |
| `src/swap/persistence.js` | `26b7284eece7ba1581f7f656fe9000f64176c1b665b9c2c40dfd6507274869a6` |
| `src/configureStore.js` | `409f78f8206faa4d3eb0d3c7ab4c768619332be996c200a407dfe1f8ae70f637` |
| `src/reducers/index.js` | `b691f0ce39e64c2b28da1d3dc35bb78f47a9756e798f3b5ba051790589bb4cb9` |

## Verification evidence

The configured gate commands were requested on 2026-09-09, but execution was approval-denied before any command ran. They are **not** reported as fresh results and were not retried through an alternate path. The latest actual gate evidence remains the 2026-09-08 run at the unchanged runtime baseline:

| Command | Latest actual result | 2026-09-09 status |
|---|---|---|
| `npm run test:all` | 2026-09-08 PASS — 41 Jest + 110 swap tests; known Redux diagnostic | Not executed; approval denied |
| `npm run lint` | 2026-09-08 PASS with 21 warnings | Not executed; approval denied |
| `npm run lint:swap` | 2026-09-08 PASS, zero warnings | Not executed; approval denied |
| `npm run build` | 2026-09-08 PASS; 1.23 MiB app, 567 KiB signer, 3 performance warnings | Not executed; approval denied |

This documentation-only review does not convert historical gate output into exact-head CI or live wallet acceptance.