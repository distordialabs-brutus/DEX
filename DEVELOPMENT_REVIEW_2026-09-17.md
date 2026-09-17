# Development and architecture review — 2026-09-17

## Scope and change since the prior review

Review start was a clean `master` at `d07bffc6f900d94206662bd3b3f442fdf2b7f6c2`, aligned with `origin/master`. The commit after the September 16 report's source baseline (`a735b621e0338c904d3b42aef2023d60feb7ef12`) changes only `ARCHITECTURE.md`, `DEVELOPMENT_REVIEW_2026-09-16.md`, and `SWAP_SERVICE_DEVELOPMENT_PLAN.md`. Source inspection and the fresh clean-install gate therefore establish **no runtime change since the September 16 review**; the findings below are retained gaps, not new regressions.

**Verdict:** native DEX offline gates pass. Cross-chain provider inspection remains available, but funding is correctly disabled and is not release-ready. No wallet, node, profile/session, signer, RPC, chain, or funds-moving action was performed. Dependency/security upgrades remain intentionally deferred until Nexus Interface compatibility can be tested; do not apply a blind or forced audit upgrade.

## Fresh executed evidence

| Command | Result |
|---|---|
| `npm ci` | PASS: 1,056 packages installed / 1,057 audited; 36 findings (4 low, 14 moderate, 16 high, 2 critical) |
| `npm run lint` | PASS under the configured gate: 0 errors, 21 warnings |
| `npm test -- --ci --coverage` | PASS: 5 suites / 41 tests; 78.4% statements, 62.24% branches, 67.9% functions, 86.18% lines |
| `npm run test:swap` | PASS: 110 tests |
| `npm run lint:swap` | PASS: zero warnings |
| `npm run build` | PASS: Webpack 5.99.9; `app.js` 1.23 MiB and `solana-signer.js` 567 KiB; 3 performance warnings |
| CI manifest command | PASS: all 12 files listed by `nxs_package.json` exist after the build |
| `git diff --check` | PASS |

The Jest run still emits the expected `swapJournal` unknown-root-key diagnostic three times. `fetchExecuted.test.js` also exercises and logs the expected no-session user-trades warning. Build output and `node_modules` are ignored; the worktree remained clean after the gate.

## Architecture findings

### P1 — split reducer hydration from the financial journal

`src/reducers/index.js:45-51` recursively overlays all `storageData` onto a reducer whose only root keys are `ui`, `settings`, and `nexus`. `src/configureStore.js:66-68` separately hydrates the journal correctly through `src/swap/persistence.js`, so putting `swapJournal` in Redux is unnecessary. On the next dispatch, `combineReducers` warns and drops it. This is observable in all three `__tests__/configureStore.test.js` cases.

**Coder work:** filter persisted Redux input to reducer-owned keys in `src/reducers/index.js` (or construct that projection in `src/configureStore.js`) while continuing to pass the complete storage object to `persistence.hydrate`.

**Acceptance:** extend `__tests__/configureStore.test.js` to spy on `console.error`; INITIALIZE with settings plus an exact journal, dispatch an unrelated action, then update settings. Assert zero Redux unknown-key diagnostics, root keys exactly `ui/settings/nexus`, byte-equivalent journal readback, and a settings write that preserves the latest journal.

### P1 — current swap UI tests do not render the UI

`test/swap/integration.test.cjs` reads source text and traverses the Babel AST. Its test title says “mounted component branch,” but no React tree is mounted and `package.json` contains no Testing Library dependency. The 110 passing swap tests strongly cover React-free controllers/adapters; they do not prove `src/App/stablecoinSwap.js` state transitions, controls, announcements, or stale-generation behavior.

**Coder work:** add a Nexus-Interface-compatible rendered test harness around `StablecoinSwap({ runtimeOverride })`. Keep wallet/RPC/storage mutation boundaries mocked and fail closed.

**Acceptance:** rendered tests cover complete, incomplete, empty, rejected, and failed discovery; address selection failure; quote/consent invalidation when amount, direction, provider, network, or wallet identity changes; missing storage/deployment gates; double activation; unmount/stale promise completion; and every recovery control. Replace or rename the AST test so it cannot be cited as mounted acceptance.

### P1 — refresh ownership and hook warnings need behavioral tests

There are five active recurring loops: native market refresh in `src/App/Main.js` (15 s), swap observation in `src/App/stablecoinSwap.js` (15 s), NFT refresh (30 s), market-directory refresh (60 s), and holder refresh (120 s). The old 5-second Overview interval is commented out, and `ChartWindow` fetches on pair change rather than on an interval. Repository lint still reports hook-dependency warnings in `overview.js`, `ChartWindow.js`, and `TradeForm.js`; these can become stale-pair, stale-decimal, or repeated-request defects if “fixed” mechanically.

**Coder work:** first add fake-timer and deferred-promise tests for pair/tab/profile changes and unmount cleanup in the named files. Then either repair each closure or introduce one visibility-aware, in-flight-deduplicating scheduler. Do not suppress `react-hooks/exhaustive-deps` without a behavior-preserving test.

**Acceptance:** no request from the old pair/profile updates current UI; hidden/unmounted consumers stop polling; only one request per resource/cadence is active; failures back off without repeated dialogs; repository lint reaches zero hook warnings before tightening the global warning gate.

### Release containment remains correct

`src/swap/deployment.js:9` still defines an empty `ACCEPTED_DEPLOYMENTS`, and `src/configureStore.js:61-62` still requires the future host `updateStorageAcknowledged` capability for journal writes. The two bundle-size warnings and audit findings are real debt, but neither justifies weakening these boundaries or upgrading dependencies outside a compatibility-tested batch.

## Prioritized next coder batch

1. **Hydration repair:** `src/reducers/index.js`, `src/configureStore.js`, `__tests__/configureStore.test.js`; meet the warning-free exact-journal acceptance above.
2. **Rendered swap acceptance:** `src/App/stablecoinSwap.js` plus a new collected component suite; prove the interaction and cancellation cases above rather than source-string wiring.
3. **Supported-wallet persistence harness:** in the compatible Nexus Interface test environment, implement and prove a real acknowledged write/read/restart/profile-switch contract, capacity failure, and Web Locks behavior. Never wrap fire-and-forget `updateStorage` in a resolved promise.
4. **Service and chain acceptance:** close swapService disposition/refund-intent reconstruction and post-ingestion minimum-policy exits, then run both directions with isolated non-production assets and fault injection. Record exact wallet, node, service, provider record, and client revisions.
5. **Controlled enablement only after 1–4:** add an evidence-pinned deployment entry only when exact readback/restart evidence exists. Keep dependency remediation separate and compatibility-gated.

Offline green tests are regression evidence, not live-chain, target-wallet, provider-solvency, or release acceptance.