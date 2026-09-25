# DEX architecture

## Current development review — 2026-09-25

The [September 25 review](DEVELOPMENT_REVIEW_2026-09-25.md) revalidates `master` and
`origin/master` at `d9ad9da0fb2011c227350c4ff90d8eaac4d657ea`. The only changes after the
September 23 runtime baseline `416855d14ab605450bdf4ead92b66ded5e931330` are documentation and
review evidence; every file in the September 23 runtime-source manifest remains byte-identical.
Fresh offline execution passes 41 Jest + 110 swap tests, strict swap lint, repository lint at its
21-warning threshold, both production bundles, and all 12 manifest files. Exact-head GitHub CI is
also green. These gates still permit three Redux unknown-`swapJournal` diagnostics and do not mount
the real swap component.

Funding remains disabled. Fresh real-controller/coordinator probes still produce two mocked debit
calls from one stale draft, erase a committed uncertain journal after a lost acknowledgement plus
settings save, and lose one of two independently created jobs. The
[cross-repository evaluation](SWAP_SERVICE_EVALUATION.md) retains the September 22 cross-protocol
snapshot and adds the parent's September 25 service-recovery reassessment at runtime `17f65a3`:
total-empty-database replay is contained, while partial-restore authorization remains open.
No live wallet, service, RPC, signer, or chain action was performed.

## Historical general review — 2026-09-21

The [September 21 review](DEVELOPMENT_REVIEW_2026-09-21.md) was the prior general evidence. Review start was a clean `master` at `a78b82f884c196fb71c48ba899b83b528254d8db`, aligned with `origin/master`. A path-limited comparison confirmed no runtime, test, build, manifest, lockfile, or CI changes since source baseline `a735b621e0338c904d3b42aef2023d60feb7ef12`; it was a revalidation, not a new implementation claim. A fresh `npm ci` and complete configured local gate passed (41 Jest tests and 110 swap tests); targeted containment tests passed, swap lint was clean, repository lint retained 21 warnings, and both bundles built with three performance warnings. Cross-chain funding remained blocked by the empty deployment acceptance registry and missing acknowledged wallet storage. The Redux hydration warning and absence of rendered swap interaction tests remained client exits. Older baselines below are historical.

## Historical reviewed baseline

Re-reviewed 2026-09-10 from the current worktree. The last verified Git baseline remains `master` at `bd03f9021c6260d6481fb044053bbc5276315c0b` with runtime baseline `593ff0a517e5da78dbf37f723f9cdcc4219e7284`: the 2026-09-10 Git identity/continuity command was approval-denied, so no newer HEAD or branch-alignment claim is made. Fresh SHA-256 readback shows `package.json`, `package-lock.json`, `nxs_package.json`, and the four safety-boundary files named in the 2026-09-09 review are byte-identical to that reviewed snapshot. Runtime architecture and release status remain unchanged in the inspected safety paths. Earlier dated reviews are historical snapshots; merge evidence is in [docs/BRANCH_RECONCILIATION.md](docs/BRANCH_RECONCILIATION.md) and the latest assessment is [DEVELOPMENT_REVIEW_2026-09-10.md](DEVELOPMENT_REVIEW_2026-09-10.md).

## Runtime and application shell

The project is a web-targeted Nexus Wallet app module built with Webpack and Babel from `src/index.js`. `listenToWalletData` feeds the `nexus` reducer, and `ModuleWrapper` delays the app until wallet initialization and supplies the wallet theme.

`src/App/Main.js` owns the top-level panel and tabs: Overview, Trade, Chart, Market Depth, Markets, Portfolio, NFT Art, and Cross-chain swaps. The app-shell error boundary is tracked at `src/App/components/ErrorBoundary.js`. Main starts an immediate market refresh and a 15-second interval; a ref supplies the latest base/quote tokens without rebuilding the interval for each token change. Four other active recurring loops remain: swap observation at 15 seconds, NFT refresh at 30 seconds, market-directory refresh at 60 seconds, and holder refresh at 120 seconds. The apparent 5-second Overview interval is commented out, and ChartWindow fetches on pair change rather than on a timer. Polling is not centrally deduplicated, visibility-aware, or backed off.

## Redux and persistence

The root reducer contains three slices:

- `ui`: active tab plus native market/order/trade/NFT state;
- `settings`: durable user settings such as time span;
- `nexus`: wallet-provided theme, core information, and user status.

`src/reducers/index.js` recursively overlays persisted data on reducer defaults during `INITIALIZE`, preserving keys introduced after an older snapshot. `src/configureStore.js` memoizes the session-state projection by `ui` identity and excludes `myUnconfirmedOrders`, `myCancellingOrders`, and `myUnconfirmedTrades`, preventing every unrelated dispatch from producing a new session payload or restoring stale optimistic transactions after restart.

Settings and the cross-chain journal share a per-instance serialized coordinator in
`src/swap/persistence.js`. That is not authoritative multiwindow serialization: each instance
reads a private hydrate-once cache. The current code can erase a newer journal through stale
settings snapshots after an uncertain acknowledgement, and another window can submit the same
job from stale draft state even while sharing the Web Lock. See C-1/C-2 in the evaluation.

The repair boundary is wallet-owned storage, not a stronger module-local lock. The supported host
contract must expose an authoritative value plus monotonic revision, and one compare-and-swap
commit that returns a closed result: `committed(newRevision)`, `conflict(currentRevision)`, or
`outcome_unknown(operationId)`. Every settings and journal writer must use that contract, or the
journal must live in a separate host-owned namespace that settings replacement cannot address.
On conflict, reread and rerun the pure journal transition before any wallet mutation. On unknown
outcome, read back by revision/operation identity and compare the intended journal content; if the
host cannot prove whether it committed, retain a visible storage hold and permit neither a new
mutation nor a stale full-snapshot write. Revision and operation identity must survive independent
windows, renderer restart, profile switches and process crashes. A promise-returning wrapper around
`updateStorage()` does not satisfy this contract.

The module-side transaction should therefore be split into a pure transition over an authoritative
snapshot and a host commit. `submitNexus` may call `secureApiCall` only after the CAS that moves the
job from `draft` to `submission_unknown` is proven committed. A second controller must reread that
revision and refuse submission. Remote-identity persistence must CAS from that exact uncertain row;
conflicts or lost acknowledgements remain recoverable holds and cannot overwrite the first identity.

One integration debt remains: `storageData.swapJournal` is also merged temporarily into Redux by
`src/reducers/index.js`, although `combineReducers` does not own that key. The current Jest run emits
Redux's “Unexpected key swapJournal” diagnostic before the key is discarded. Hydration must first
pass the untouched host envelope to the journal coordinator, then project only `ui`, `settings` and
`nexus` into Redux. Redux must never become the journal authority.

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

The maintained `README.md` now matches the fail-closed implementation: it labels cross-chain use inspection-only, identifies the provider as an intermediary, removes manual funding and fixed-identity guidance, and states that no `SOLANA_RPC_URL` override is supported. Keep that summary synchronized with this architecture and `docs/CROSS_CHAIN_SWAPS.md`; dated reviews that describe the earlier unsafe README are historical evidence, not current instructions.

## Vision alignment and future accountability evidence

The locally supplied `vision.md` was read as design context but remains untracked and was not staged.
Its safety hierarchy agrees with the current containment: exact identities and integer units,
wallet-held signing authority, explicit human approval, intent before mutation, attributable
completion evidence, and fail-closed unknown states. It also clarifies the future trust model.
Namespace attestations, bonds, challenge history and staked-accountability records may enrich
provider inspection and risk presentation, but they are evidence—not custody proof, settlement
proof, or permission to execute. Discovery must remain open, and absence of a Distordia attestation
must not silently become an execution ban. Any future scoring adapter must preserve raw evidence,
issuer/namespace identity, observed revision and expiry; labels must identify whether a claim is
observed, inferred or attested. Funding acceptance remains an explicit, evidence-pinned safety gate
independent of reputation UI.

## Build and verification boundaries

- `npm run lint`: repository ESLint gate; errors fail, warnings currently do not.
- `npm run lint:swap`: strict zero-warning gate for `src/swap` and `stablecoinSwap.js`.
- `npm test`: five Jest suites for native reducers/actions/cache/store; wallet boundaries are mocked and no React tree is mounted.
- `npm run test:swap`: Node tests for production swap closures with wallet/RPC/storage boundaries replaced by fixtures.
- `npm run test:all`: both suites.
- `npm run build`: emits `dist/js/app.js` and `dist/js/solana-signer.js`.

These are offline regression gates, not live-chain or target-wallet acceptance. They were rerun on
2026-09-25 at `d9ad9da` using the existing dependency tree: 41 Jest tests passed; 110 swap tests
passed; strict swap lint passed with zero warnings; repository lint passed with 21 warnings; and the
production build passed with three performance warnings while emitting a 1,287,841-byte app bundle
plus a 580,804-byte signer bundle. All 12 manifest-listed files existed after the build. No install,
audit fix, or dependency upgrade ran. The focused 31-test journal/controller/source-wiring shard and
three configure-store tests also passed, but the latter again emitted the known unknown-root-key
diagnostic three times. The two component checks read source and traverse the `Main.js` AST; they do
not render React or drive a DOM. Exact-head GitHub Actions run `35822340652` passed its Node 20
install, lint, Jest, swap-test, strict-lint, build and manifest steps. None of this establishes
target-wallet storage, rendering, or live-chain behavior.
