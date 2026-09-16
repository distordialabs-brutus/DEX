# Development and architecture review — 2026-09-16

## Scope and verdict

The delegated review context identifies a clean `master` at `a735b621e0338c904d3b42aef2023d60feb7ef12`, with the September 15 documentation as the latest baseline. A local Git identity/diff probe was approval-blocked and was not rerouted, so this report does not independently claim commit continuity. Direct source inspection found the same safety boundaries documented on September 15, and a clean `npm ci` followed by the repository's configured CI commands reproduced the same results. **No runtime delta is established since the September 15 review.**

**Verdict:** native DEX offline gates pass, while cross-chain funding remains correctly disabled and not release-ready. No wallet, node, profile/session, signer, RPC, chain, or funds-moving action was performed. Dependency/security upgrades remain intentionally deferred for Nexus Interface compatibility.

## Fresh executed evidence

| Command | Result |
|---|---|
| `npm ci` | PASS: 1,056 packages installed; audit reports 36 findings (4 low, 14 moderate, 16 high, 2 critical) |
| `npm run lint` | PASS with debt: 0 errors, 21 warnings |
| `npm test -- --ci --coverage` | PASS: 5 suites / 41 tests; 78.4% statements, 62.24% branches, 67.9% functions, 86.18% lines |
| `npm run test:swap` | PASS: 110 tests |
| `npm run lint:swap` | PASS: zero warnings |
| `npm run build` | PASS: Webpack 5.99.9; app 1.23 MiB, signer 567 KiB; 3 performance warnings |
| CI manifest-file command | PASS: all 12 `nxs_package.json` entries exist |

The combined post-install gate was executed in CI order after `npm ci`. Existing deprecation notices and audit findings were recorded, not auto-fixed.

## Architecture findings

1. **Strong containment remains intact.** `src/swap/deployment.js` still has an empty `ACCEPTED_DEPLOYMENTS`; `src/configureStore.js` still requires the future `updateStorageAcknowledged` capability for financial-journal writes. Discovery and recovery surfaces do not establish funding acceptance.
2. **P1 hydration defect remains directly observable.** `src/reducers/index.js` merges `storageData.swapJournal` into the Redux root even though `combineReducers` owns only `ui`, `settings`, and `nexus`. The collected Jest gate emitted the same Redux unknown-key diagnostic three times. Split reducer-owned hydration from persistence-owned journal data and assert warning-free INITIALIZE → unrelated dispatch → settings update behavior while preserving exact journal bytes.
3. **The swap “integration” label still overstates UI evidence.** `test/swap/integration.test.cjs` reads source and uses Babel AST traversal to prove navigation/component wiring; it does not mount React or exercise user interactions. Add rendered tests for discovery failure/partial results, quote invalidation, blocked storage/deployment, double activation, and recovery actions.
4. **Frontend lifecycle debt is still actionable.** Whole-repository lint reports hook dependency warnings in `overview.js`, `ChartWindow.js`, and `TradeForm.js`; source inspection also confirms independent pollers at 5s, 15s, 30s, 60s, and 120s cadences. Fix behavior under pair/tab/profile changes with focused tests before suppressing rules or centralizing scheduling.
5. **Documentation drift was found, not runtime drift.** `README.md` already states inspection-only/funding-disabled behavior, but `ARCHITECTURE.md` still called it unsafe and the development plan still listed README correction as uncompleted. The active architecture and plan are updated in this review; dated snapshots remain historical.

## Next development batch

1. Remove `swapJournal` from Redux hydration and add a warning-free persistence regression.
2. Add mounted React interaction tests; do not count AST/source checks as rendered acceptance.
3. Build the real supported-wallet acknowledged-storage/restart/profile-switch harness.
4. Close the documented swapService disposition/minimum-policy exits, then run isolated two-direction acceptance with non-production assets.
5. Only after exact wallet/node/service/client evidence exists, add an evidence-pinned accepted deployment. Keep dependency remediation in a separate compatibility-tested batch.
