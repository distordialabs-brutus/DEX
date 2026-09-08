# DEX architecture

## Reviewed baseline

This document describes `master` at `593ff0a517e5da78dbf37f723f9cdcc4219e7284`, the 2026-09-07 reconciliation of the native DEX performance/ESLint work and the release-gated cross-chain client. Earlier dated reviews are historical snapshots; the current merge evidence is in [docs/BRANCH_RECONCILIATION.md](docs/BRANCH_RECONCILIATION.md) and the latest assessment is [DEVELOPMENT_REVIEW_2026-09-08.md](DEVELOPMENT_REVIEW_2026-09-08.md).

## Runtime and application shell

The project is a web-targeted Nexus Wallet app module built with Webpack and Babel from `src/index.js`. `listenToWalletData` feeds the `nexus` reducer, and `ModuleWrapper` delays the app until wallet initialization and supplies the wallet theme.

`src/App/Main.js` owns the top-level panel and tabs: Overview, Trade, Chart, Market Depth, Markets, Portfolio, NFT Art, and Cross-chain swaps. The app-shell error boundary is tracked at `src/App/components/ErrorBoundary.js`. Main starts an immediate market refresh and a 15-second interval; a ref supplies the latest base/quote tokens without rebuilding the interval for each token change. Other feature components still own independent polling schedules, so polling is not centrally deduplicated, visibility-aware, or backed off.

## Redux and persistence

The root reducer contains three slices:

- `ui`: active tab plus native market/order/trade/NFT state;
- `settings`: durable user settings such as time span;
- `nexus`: wallet-provided theme, core information, and user status.

`src/reducers/index.js` recursively overlays persisted data on reducer defaults during `INITIALIZE`, preserving keys introduced after an older snapshot. `src/configureStore.js` memoizes the session-state projection by `ui` identity and excludes `myUnconfirmedOrders`, `myCancellingOrders`, and `myUnconfirmedTrades`, preventing every unrelated dispatch from producing a new session payload or restoring stale optimistic transactions after restart.

Settings and the cross-chain journal share one serialized coordinator in `src/swap/persistence.js`, so a settings write cannot erase a newer journal. Current Nexus Interface storage is fire-and-forget; financial journal writes therefore require a future, real `NEXUS.utilities.updateStorageAcknowledged` capability. Missing acknowledgement, corrupt data, size limits, and prior journal faults fail closed.

One integration debt remains: `storageData.swapJournal` is also merged temporarily into Redux by `src/reducers/index.js`, although `combineReducers` does not own that key. The current Jest run emits Redux's “Unexpected key swapJournal” diagnostic before the key is discarded. The journal itself remains available through the persistence coordinator, but hydration should split reducer-owned state from journal-owned state.

## Native DEX data flow

1. Components dispatch thunks from `src/actions`.
2. Thunks call Nexus through `nexus-module`; selected reads use `src/utils/apiCache.js` or `apiCallWithRetry.js`.
3. Reducers update `ui.market`, `ui.nft`, or `settings`.
4. Components select the relevant state and render.

All `market/*` order and executed-trade data must pass through `src/utils/marketData.js`. The core's `price` field is not authoritative, and NXS amounts are returned in divisible units:

```text
bid: contract = quote paid; order = base received; price = contract / order
ask: contract = base sold; order = quote received; price = order / contract
NXS display amount = wire amount / 1,000,000
```

Bypassing this normalizer can produce plausible but wrong prices or million-fold NXS volume errors. Endpoint projections are still distributed across actions and components rather than owned by one typed API layer.

Native order create, execute, and cancel operations and NFT mutations use `secureApiCall`, retaining the Nexus Wallet PIN-confirmation boundary. The native trading path still performs monetary calculations with JavaScript `number`/`parseFloat`; the cross-chain path does not share that limitation.

## Cross-chain swap domain

The Cross-chain swaps tab is a custodial bridge client, not the native order book and not an atomic swap. It replaced the hardcoded prototype with separate modules:

| Module | Responsibility |
|---|---|
| `src/swap/providers.js` | Bounded/paginated recommended-v1 discovery, schema validation, immutable address re-read, liveness, and term comparison. |
| `src/swap/money.js` | Exact BigInt base-unit parsing, decimal conversion, fees, minima, dust rejection, and formatting. |
| `src/swap/nexus.js` | Nexus context/account checks, secure debit submission, provider CREDIT linkage, routing assets, receipts, and DEBIT/CREDIT proof. |
| `src/swap/solana.js` | Static-network RPC access, classic SPL account/mint checks, transaction construction, and finalized transfer/memo/payout evidence. |
| `src/swap/jobs.js` | Versioned profile/network-scoped journal, immutable intent/evidence fields, storage limits, and Web Lock serialization. |
| `src/swap/controller.js` | Intent-first state transitions, scope rechecks, no-resubmit handling, mapping recovery, and completion. |
| `src/swap/persistence.js` | Ordered settings/journal writes and durable-acknowledgement gate. |
| `src/swap/runtime.js` | Adapter composition, fresh provider/pair/quote validation, funding/storage reasons, and public signer handoff. |
| `src/swap/deployment.js` | Static Solana network/genesis policy and exact accepted-deployment/dust release gate. |
| `src/swap/signingPage.js`, `dist/solana-sign.html` | Same-origin public-job handoff to an external Phantom/Solflare signer. |
| `src/App/stablecoinSwap.js` | Discovery, provider inspection, quotes, job history, and evidence-based recovery controls. |

Normal states are:

```text
Solana → Nexus: draft → awaiting_signature → awaiting_payout → completed
Nexus → Solana: draft → submission_unknown → debit_submitted
                    → awaiting_service_credit → mapping_unknown
                    → awaiting_payout → completed
```

Unknown states are durable holds, never inferred refunds. Only `draft` can be cancelled. Jobs freeze provider terms, network/profile scope, token/custody identities, exact unit strings, destination accounts, reference, expiry, and a Nexus confirmation floor before a mutation. PINs, sessions, seeds, and private keys are forbidden from the journal and public signer handoff.

## Funding containment

Cross-chain discovery, inspection, and quote calculation are exposed, but funding is not release-enabled:

- `src/swap/deployment.js` keeps `ACCEPTED_DEPLOYMENTS` empty;
- current Nexus Interface lacks acknowledged module-storage writes;
- no target-wallet installation, real node, Solana cluster, browser-wallet, restart, or service acceptance has been completed by the offline suites;
- an on-chain provider record is not an endorsement or solvency proof.

Do not populate an acceptance record or add a fake promise wrapper around fire-and-forget storage. Follow [docs/CROSS_CHAIN_SWAPS.md](docs/CROSS_CHAIN_SWAPS.md) and [SWAP_SERVICE_DEVELOPMENT_PLAN.md](SWAP_SERVICE_DEVELOPMENT_PLAN.md). Dependency/security remediation remains a compatibility-gated workstream; do not apply blind upgrades or forced audit fixes.

## Build and verification boundaries

- `npm run lint`: repository ESLint gate; errors fail, warnings currently do not.
- `npm run lint:swap`: strict zero-warning gate for `src/swap` and `stablecoinSwap.js`.
- `npm test`: five Jest suites for native reducers/actions/cache/store; wallet boundaries are mocked and no React tree is mounted.
- `npm run test:swap`: Node tests for production swap closures with wallet/RPC/storage boundaries replaced by fixtures.
- `npm run test:all`: both suites.
- `npm run build`: emits `dist/js/app.js` and `dist/js/solana-signer.js`.

These are offline regression gates, not live-chain or target-wallet acceptance. At the reviewed baseline, local tests and both lint commands pass, while whole-repository lint reports 21 warnings. The production build passes with three performance warnings and emits a 1.23 MiB app bundle plus a 567 KiB signer bundle. Rendering and user-interaction coverage for the swap page remains absent; its current “integration” checks parse source/AST rather than mounting the component.
