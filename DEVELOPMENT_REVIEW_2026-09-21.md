# Development and architecture review — 2026-09-21

## Scope and verdict

Review start was a clean `master` at `a78b82f884c196fb71c48ba899b83b528254d8db`, aligned with `origin/master`. A path-limited comparison confirms there are **no runtime, test, build, manifest, lockfile, or CI changes** after source baseline `a735b621e0338c904d3b42aef2023d60feb7ef12`; the intervening commits change review documents only. This review therefore revalidates the September 17 blockers rather than claiming new implementation.

**Verdict:** the configured native DEX and offline cross-chain regression gates pass. Cross-chain discovery and inspection remain available, while funding is correctly fail-closed by the empty deployment registry and the unavailable acknowledged wallet-storage contract. The implementation is not release-ready for cross-chain funding. No wallet, node, RPC, signer, chain, service, profile/session, or funds-moving action was performed. Dependency and security remediation remains deliberately deferred until Nexus Interface compatibility can be exercised; no forced audit fix was attempted.

## Executed evidence

Local execution used Node `v22.23.2` and npm `10.9.8`; repository CI independently uses Node `20.x`.

| Command | Result |
|---|---|
| `npm ci` | PASS: 1,056 packages installed / 1,057 audited; 36 findings (4 low, 14 moderate, 16 high, 2 critical) |
| `npm run lint` | PASS under the configured threshold: 0 errors, 21 warnings, including 9 `react-hooks/exhaustive-deps` warnings |
| `npm test -- --ci --coverage --runInBand` | PASS: 5 suites / 41 tests; 78.4% statements, 62.24% branches, 67.9% functions, 86.18% lines |
| `npm run test:swap` | PASS: 110 tests |
| `npm run lint:swap` | PASS: zero warnings |
| `npm run build` | PASS: Webpack 5.99.9; `app.js` 1.23 MiB and `solana-signer.js` 567 KiB; 3 performance warnings |
| manifest verification | PASS: all 12 `nxs_package.json` files exist after the build |
| `git diff --check` | PASS |

Targeted architecture checks make the remaining gaps explicit:

- `npm test -- --ci --runInBand __tests__/configureStore.test.js`: 3/3 pass, but Redux emits the `Unexpected key "swapJournal"` diagnostic once in each test.
- `node --test test/swap/deployment.test.cjs test/swap/controller.test.cjs test/swap/integration.test.cjs`: 25/25 pass, including storage-before-mutation and unaccepted-deployment containment.
- The latter command does **not** render React. `test/swap/integration.test.cjs` reads source and parses `Main.js`; its “mounted component branch” title overstates the evidence.

The full suite also logs the expected no-session user-trades warning. Generated `dist/js` and coverage output are ignored; the worktree remained clean after verification.

## Findings and executable coder acceptance

### P1 — separate Redux hydration from the financial journal

`src/reducers/index.js:45-51` recursively merges the complete `storageData` object into a reducer whose owned roots are only `ui`, `settings`, and `nexus`. `src/configureStore.js:66-68` already sends the complete object to `persistence.hydrate`, so the extra `swapJournal` Redux root is unnecessary and is discarded on the next dispatch. The warning is not data loss today because the persistence coordinator retains the journal, but it proves the hydration boundary is wrong and can hide future unknown-root mistakes.

**Coder acceptance, batch 1:**

1. Add a failing case in `__tests__/configureStore.test.js` that spies on `console.error`, initializes settings plus an exact journal, dispatches an unrelated UI action, then changes settings.
2. Project persisted Redux data to `ui/settings/nexus` before `mergePersistedState`; continue passing the unmodified storage object to `persistence.hydrate`.
3. Assert the store root keys are exactly `ui`, `settings`, and `nexus`; the console spy receives no Redux unknown-key diagnostic; `readJournal()` is byte-equivalent to the initialized journal; and the settings write contains the latest journal.
4. Execute `npm test -- --ci --runInBand __tests__/configureStore.test.js`; acceptance is 3+ tests passing with no unexpected console output. Then execute the complete gate below.

### P1 — replace source-shape claims with rendered swap interaction evidence

The 110 swap tests are strong React-free controller and adapter regressions. They do not prove that `StablecoinSwap({ runtimeOverride })` renders the right state, invalidates approval correctly, fences stale async completion, prevents duplicate activation, or wires each recovery control. There is no rendered component suite in default Jest collection.

**Coder acceptance, batch 2:**

1. Add a collected `__tests__/stablecoinSwap.render.test.js` (or equivalent `*.test.js`) that mounts the real component with Redux state and a deterministic `runtimeOverride`; mock only wallet/RPC/storage/browser mutation boundaries.
2. Drive controls through DOM events. Cover fulfilled complete, fulfilled incomplete, empty, rejected, and failed discovery; immutable-address selection failure; storage and deployment blocks; and every state-specific recovery button.
3. Use deferred promises and fake timers to prove that amount, direction, provider, cluster, or wallet identity changes invalidate quote/consent; a second activation cannot submit; stale generations and post-unmount completions do not update the active UI; and observer cleanup does not cancel unrelated work.
4. Rename the current AST test to navigation/source-wiring evidence or remove it once superseded. It must not contain “mounted” unless a React tree is mounted.
5. Execute `npm test -- --ci --runInBand __tests__/stablecoinSwap.render.test.js` and `npm run test:swap`; acceptance is default collection, zero unhandled rejections/timer leaks, and all cases passing. Then execute the complete gate below.

### P2 — establish behavior before repairing hook dependencies or polling ownership

Five active intervals remain independently owned: market 15 s, swap observation 15 s, NFT 30 s, markets 60 s, and holders 120 s. Repository lint reports hook dependency warnings in `overview.js`, `ChartWindow.js`, and `TradeForm.js`. Mechanical dependency-array edits can introduce duplicate requests or stale-pair displays.

**Coder acceptance, batch 3:**

1. Add fake-timer/deferred-request tests for pair, interval, tab, profile, and unmount transitions in the warned components and polling owners.
2. Prove an old pair/profile response cannot update current UI, hidden/unmounted consumers stop polling, a resource has at most one in-flight request per cadence, and repeated failures back off without repeated dialogs.
3. Repair the closures or introduce one visibility-aware scheduler only after those tests fail for the intended reason.
4. Execute the new focused suites and `npm run lint`; acceptance is zero `react-hooks/exhaustive-deps` warnings in touched files without suppressions, followed by the complete gate.

### Release gate — external evidence remains mandatory

`src/swap/deployment.js:9` still has `ACCEPTED_DEPLOYMENTS = []`, and `src/configureStore.js:61-62` still requires a future real `NEXUS.utilities.updateStorageAcknowledged`. Keep both boundaries closed until a supported Nexus Interface harness proves acknowledged write/read/restart, capacity failure, profile switching, and Web Locks, followed by isolated two-direction service/chain acceptance with exact revisions and fault injection. Never substitute `Promise.resolve(updateStorage(...))` for durable acknowledgement.

## Complete candidate gate

Run from a clean candidate with the supported Node 20 CI runtime:

```sh
npm ci
npm run lint
npm test -- --ci --coverage --runInBand
npm run test:swap
npm run lint:swap
npm run build
node -e "const fs=require('node:fs');const m=require('./nxs_package.json');for(const f of m.files){if(!fs.statSync(f).isFile())throw new Error('Missing module file '+f)}console.log('All '+m.files.length+' module manifest files exist')"
git diff --check
```

Offline green gates are regression evidence, not target-wallet, live-node, provider-solvency, chain-finality, or release acceptance.
