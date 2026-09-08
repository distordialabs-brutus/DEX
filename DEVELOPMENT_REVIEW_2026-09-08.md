# Development and architecture review — 2026-09-08

**Review window:** changes after the prior reviewed head `9ea48d923df7c4463b5a5bd9d7388bf11d87b601` through 2026-09-08

**Base HEAD:** `593ff0a517e5da78dbf37f723f9cdcc4219e7284`

**Branch:** `master` (aligned with locally recorded `origin/master` at review start)

**Worktree at review start:** clean; no staged, unstaged, or untracked paths

## Verdict

The 2026-09-07 reconciliation materially advances the repository and is internally coherent: native DEX performance/correctness work, executable ESLint/Jest/CI, and the cross-chain client are now merged on `master`; the accidental backup/original files are absent; the ErrorBoundary relocation is tracked; both test suites, both lint gates, and the production build execute successfully.

**Cross-chain funding is correctly not release-ready.** The visible page supports read-only discovery/inspection/quotes and durable-job recovery code, but `src/swap/deployment.js:7-17` leaves `ACCEPTED_DEPLOYMENTS` empty and `src/configureStore.js:57-62` requires a future `updateStorageAcknowledged` host method. The local suites replace wallet/RPC/storage boundaries with fixtures and do not establish Nexus Interface installation, real node semantics, browser-wallet operation, service settlement, or restart durability.

No production transaction, dependency upgrade, lockfile edit, commit, or push was performed.

## Change assessment since the prior review

The first-parent change is merge `593ff0a` (`f3a253c` + `9d24ee8`), with 49 changed paths, 6,556 insertions, and 1,374 deletions relative to the first parent. Feature-side commits `8ba5eba`, `8a666f3`, and `9d24ee8` introduced the swap domain and then tightened scope rechecks, manual CREDIT/mapping recovery, exact CREATE verification, bounded claim pagination, and storage-reason UI. The merge preserved master's native DEX fixes and Jest/CI rather than replacing that side wholesale.

### Reconciled native DEX and performance work

- `src/App/Main.js:70-102` mirrors Redux pair changes into the form and uses `tokensRef` so the 15-second poll sees fresh tokens without recreating the interval on each input change.
- `src/configureStore.js:17-55` memoizes the session projection by `ui` identity and removes transient optimistic order/trade keys.
- `src/reducers/index.js:20-32` recursively restores older persisted state without dropping newly introduced reducer defaults.
- `src/utils/marketData.js:1-88` centralizes bid/ask amount orientation, NXS 1e6 conversion, and price recomputation instead of trusting the core `price` field.
- `package.json:18-39` now contains Jest, React Hooks ESLint, combined tests, and a zero-warning swap lint command. `.github/workflows/ci.yml:31-64` installs with `npm ci`, runs both suites/lints/build, validates manifest files, and uploads the full distribution.

### Implemented swap boundary

- `providers.js` performs bounded discovery, rejects unsupported schema, preserves same-owner deployments, and re-reads by immutable address.
- `money.js` uses integer units and explicit decimal conversion rather than native DEX floating-point arithmetic.
- `jobs.js:3-24,65-117,119-189` validates a versioned journal, forbids secret-named fields, freezes intent and remote identities, limits size, and serializes mutations under a Web Lock.
- `controller.js:162-205` persists `submission_unknown` before Nexus debit and requires exact proof to recover a lost response; `238-293` prevents an uncertain mapping CREATE from being repeated and allows only exact verified recovery.
- `nexus.js` distinguishes user DEBIT from provider CREDIT, verifies mapping CREATE evidence, follows source-bound receipts, and paginates up to 2,000 claim-history transactions without treating an incomplete scan as a confirmed absence.
- `solana.js` constructs classic SPL `TransferChecked` plus memo and verifies exact finalized source/output evidence.
- `stablecoinSwap.js:162-283` exposes discovery, terms, consent, explicit held states, and evidence-based recovery. It does not bypass the static deployment or durable-storage gates.

## Ranked findings and acceptance tests

### P0 — No new critical release-bypass finding; keep the two independent funding gates

**Evidence:** `src/swap/deployment.js:9` defines an empty frozen acceptance list, and `assertDeploymentAccepted` rejects unmatched jobs at lines 11-20. `src/swap/runtime.js:48-68` revalidates deployment, expiry, provider terms, account ownership, destination mint, and observed reserve before funding. `src/swap/persistence.js:9-29` rejects absent/non-Promise acknowledgement and records journal faults. The UI disables saving when storage is unavailable (`stablecoinSwap.js:229-232`) and disables draft funding for unaccepted deployments (`243-249`).

**Action:** preserve both controls. Do not populate acceptance from provider-controlled data, do not wrap fire-and-forget `updateStorage` in an artificial Promise, and do not use blind dependency upgrades as a substitute for wallet acceptance.

**Acceptance:** in exact supported Nexus Interface builds, prove acknowledged atomic storage survives process termination and profile/module changes; then run each direction on isolated Nexus/Solana test networks with exact provider evidence. Verify rejection, timeout-after-acceptance, restart, insufficient liquidity, provider changes, mapping uncertainty, pending claims, and no duplicate mutation. Only then add an evidence-pinned deployment entry. No production funds are required.

### P1 — The swap page has no mounted rendering or interaction coverage

**Evidence:** `test/swap/integration.test.cjs:6-16` uses regular expressions over source text; lines 18-28 parse `Main.js` and count JSX nodes. This proves source wiring but does not render `StablecoinSwap`. `jest.config.js` has jsdom, but the current five Jest suites cover cache/actions/reducers/store and no React tree. A malformed control, stale consent, inaccessible interaction, or runtime error in the page could pass all 151 current tests.

**Action:** add component tests around the existing `runtimeOverride` boundary without changing wallet-compatible production dependencies blindly. Cover fulfilled/rejected/incomplete discovery, same-owner providers, address inspection, pair/network changes, exact quote display, consent invalidation, storage/deployment blocks, busy-state deduplication, observer cleanup, and every state-specific recovery button.

**Acceptance:** a mounted test drives the page as a user, proves no secure adapter is called while either gate is closed, proves one call under rapid duplicate interaction, and verifies unmount/network/profile changes prevent stale updates. Keep the AST check only as an additional route-wiring assertion.

### P1 — Current Redux hydration emits a real unknown-key diagnostic

**Evidence:** storage has `{settings, swapJournal}` (`__tests__/configureStore.test.js:18-28`). The root reducer passes state to `combineReducers` before initialization merging (`src/reducers/index.js:35-50`), so `swapJournal` is temporarily returned as a root Redux key even though only `ui`, `settings`, and `nexus` are owned. The executed Jest run emitted Redux's `Unexpected key "swapJournal"` diagnostic three times from `src/reducers/index.js:43`.

The durable journal is still retained by `src/swap/persistence.js`; this is not evidence of journal loss. It is a boundary leak and masks future console errors in tests.

**Action:** hydrate the persistence coordinator with the full storage object but pass only reducer-owned keys into `mergePersistedState`, or explicitly strip `swapJournal` before the root merge.

**Acceptance:** initialize from a storage object containing settings and a pending journal; assert zero `console.error` calls, no `state.swapJournal`, unchanged `getPersistence().readJournal()`, one settings write preserving the latest journal, and serialized ordering behind an outstanding acknowledged journal write.

### P2 — Bundle cost increased and both entrypoints exceed the performance budget

**Evidence:** the fresh build emitted `app.js` at 1.23 MiB and `solana-signer.js` at 567 KiB with three webpack performance warnings. The prior 2026-09-07 review recorded an 846 KiB app before the final reconciliation. `Main.js:16,196-212` statically imports and mounts the swap page by active-tab condition; `runtime.js:21-33` composes the installed Solana SDK path, so inspection capability now contributes to the main entry.

**Action:** profile the bundle, then test a lazy swap-route boundary and deliberate shared/isolated signer chunks against Nexus Interface's module serving rules. Keep the signer self-contained and all emitted runtime files explicit in `nxs_package.json`. Do not reduce size through unvalidated dependency upgrades.

**Acceptance:** record analyzer evidence and before/after compressed and parsed sizes; first load must not download/parse swap-only code until selected, the tab must still load from a production-installed module, the external signer must work from its served URL, and every emitted dependency must be manifest-listed. Define a numeric budget before marking this complete.

### P2 — Whole-repository lint is green only for errors; 21 warnings remain

**Evidence:** `npm run lint` exited 0 with 21 warnings. These include `react-hooks/exhaustive-deps` at `overview.js:137,150`, `TradeForm.js:107`, and `ChartWindow.js:199,245,376,526,607,718`, plus unused bindings and a `prefer-const` warning. `npm run lint:swap` is correctly strict and produced no output beyond the command.

Some ChartWindow omissions appear intentional to avoid effect loops, so adding every suggested dependency mechanically would be unsafe. The Overview market-cap effect does use `quoteTokenDecimals` at line 136 while omitting it at line 137, which can leave formatting stale when precision changes independently.

**Action:** resolve warnings one behavior at a time with focused tests, stable callbacks/refs, or narrow explanatory suppressions. Tighten the main gate only after baseline reaches zero; do not hide warnings globally.

**Acceptance:** `npm run lint -- --max-warnings 0` passes; changing market pair/precision/range/interval updates the corresponding calculations once; chart series are neither leaked nor recreated in loops; initial TradeForm mode remains correct after restored state.

### P2 — Offline coverage is strong at adapter logic but is not live acceptance

**Evidence:** `npm run test:all` passed 41 Jest tests and 110 Node tests. The swap suite executes production controller/provider/money/Nexus/Solana closures, but wallet API, RPC, persistence, locks, and chain results are supplied by harnesses. The tests validate local fail-closed behavior, not actual Tritium projections, owner fields, DEBIT/CREDIT linkage, Solana RPC response versions, browser extension injection, service receipt publication, or filesystem durability.

**Action:** retain these regressions and add staged read-only target-node probes before test-asset mutations. Capture exact wallet/node/service versions and fixture provenance so schema drift cannot be mistaken for a client regression.

**Acceptance:** complete the M1 read-only matrix first; then use isolated non-production assets for the M3/M4 fault matrix in `SWAP_SERVICE_DEVELOPMENT_PLAN.md`. A finalized signature alone is insufficient—completion must include the exact expected source, routing, payout, and spendable recipient evidence.

## Fresh local verification

Executed against unchanged source at base HEAD with Node `v22.23.2` and npm `10.9.8`:

| Command | Result |
|---|---|
| `npm run test:all` | **PASS** — 5 Jest suites / 41 tests and 110 swap tests; 151 total, no failures/skips. Jest emitted the `swapJournal` Redux diagnostics described above and one expected `fetchExecuted` warning-path log. |
| `npm run lint` | **PASS with debt** — 0 errors, 21 warnings. |
| `npm run lint:swap` | **PASS** — 0 errors, 0 warnings. |
| `npm run build` | **PASS** — webpack 5.99.9; `app.js` 1.23 MiB, `solana-signer.js` 567 KiB; 3 performance warnings. |

Browserslist reported 16-month-old `caniuse-lite`; dependency metadata was not updated because dependency/security changes are intentionally compatibility-gated. A supplemental combined whitespace/status/manifest command was approval-denied and is not counted as evidence. Parent verification subsequently ran `git diff --check` successfully and checked all 12 manifest-listed files exist with `/tmp/repo-review-doc-gates-20260908.py`. This is a file-existence check, not production wallet installation or proof that every runtime dependency is listed.

## Plan and documentation status

- `ARCHITECTURE.md` now describes the merged head, current state/persistence boundaries, native market normalization contract, swap modules, release containment, and mocked-versus-live verification boundary. The obsolete dirty-worktree/old-head section was removed.
- `SWAP_SERVICE_DEVELOPMENT_PLAN.md` now marks M0/M1 as implemented offline, M2 as host-blocked, M3/M4 as implemented behind gates but awaiting live acceptance, and M5 as pending. Its next batch prioritizes mounted UI tests, hydration cleanup, target-wallet storage acceptance, read-only/live test-network evidence, and bundle work.
- This review is documentation-only. It does not change runtime behavior or waive any release criterion.
