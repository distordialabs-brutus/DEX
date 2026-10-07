# DEX architecture

## Governing vision and portfolio traceability

Read [the repository vision](vision.md) and [Distordia alignment/dependency map](docs/DISTORDIA_ALIGNMENT.md) before assigning work. Authority is master Distordia strategy/customer evidence → portfolio roadmap/strategy decisions → repository vision → this architecture → tasks/code/tests/external evidence and human release.

**Portfolio purpose:** O1 interoperable open interfaces; O4 attributable wallet settlement. User-wallet authorization and recoverable, independently inspectable settlement; no module custody. Native Nexus trading and provider-custodial cross-chain transfers stay visibly distinct. The alignment map supplies customer-evidence qualification, batch ownership, upstream prerequisites and human gates. Each material task must name those fields alongside its exact production paths and collected acceptance tests. This documentation alignment changes no runtime, test result or release status; dated evidence below remains evidence for its stated snapshot only.

## Current exact-head review — 2026-10-07

This review pins the sanitized `distordialabs-brutus/DEX` `master` remote at
`7a28fcdd97710901e4317fb62d4ffc268b8743ca` and assesses the five commits after
`052b9ab56e37ba1f4162f7be2df759ee0f9380f3`. The accepted runtime delta is deliberately narrow:

| Commit | Accepted DEX boundary | Boundary that remains open |
|---|---|---|
| `bff04e2` | `configureStore` no longer treats a Promise-shaped full-snapshot writer as financial-journal authority. Production funding stays read-only even if `updateStorageAcknowledged` exists. | No authoritative host read/revision/CAS, operation receipt, or bound invocation exists. This is admission containment, not host storage. |
| `8605427` | A journal fault latched by one `createModulePersistence` instance blocks every later queued full-snapshot write, including settings, so that instance cannot overwrite a possibly committed uncertain journal. | Other windows, renderer restart, truthful operation readback, and legacy-writer isolation remain host-owned and unproved. |
| `73fbebc` | `submitNexus` rereads the three-field wallet/network scope after asynchronous funding validation and before intent mutation. A changed, unavailable, or rejected scope leaves the draft unchanged with zero wallet call. | A read is not a context-bound dispatch and cannot close the later race. |
| `e6ac4fe` | `submitNexus` rereads scope after acknowledged `submission_unknown` persistence and before `submitDebit`; refusal retains the committed unknown state and cannot be retried automatically. | A switch between this read and host dispatch is still unbound. |
| `7a28fcd` | `repairMapping` rereads scope after acknowledged `mappingStartedAt` persistence and before `publishMapping`; refusal retains manual-recovery state and immutable source/debit identities. | `publishMapping` performs asynchronous reads before `secureApiCall('assets/create/asset', ...)`; only a host-bound one-shot mutation can close that dispatch window. |

The actual caller chain is `StablecoinSwap` → `createRuntime` → `createJobStore`/
`createSwapController`. Settings call `configureStore` → `saveSettings`; Nexus funding calls
`submitNexus` → runtime `validateFunding` → `nexus.submitDebit`; mapping recovery calls
`repairMapping` → `nexus.publishMapping`. The new tests exercise real DEX coordinators, stores and
controllers but mock host storage, wallet, RPC and chain boundaries. They establish local branch
behavior only and do not implement or accept the independent wallet-host gate.

Fresh execution in the detached review tree reused a copied existing dependency tree without an
install or upgrade. Seven Jest suites / 65 tests with coverage and all 110 reported Node tests pass.
The focused storage/scope shard passes 27 Jest tests; focused CJS persistence/controller execution
passes 24 tests. Strict swap lint passes; repository lint remains 0 errors / 21 warnings. Both
production bundles build with three performance warnings. Jest still emits three Redux
unknown-`swapJournal` diagnostics plus the expected no-session warning, and no default-collected
test renders the real swap component. The CI-shaped inline manifest command was blocked by the
execution security wrapper; the 12 declared files were present in the pre-run repository inventory,
but that inventory is not represented as a fresh pass of the maintained manifest command.

Funding remains fail-closed: `ACCEPTED_DEPLOYMENTS` is empty and production `configureStore` supplies
no journal writer. The earlier duplicate-debit and journal-erasure paths are therefore not reachable
through the current production admission path; their underlying multi-context requirements remain
release blockers, not closed host controls. No live wallet, service, RPC, signer, node, chain, funds,
deployment, or approval path was exercised.

The [host contract](docs/HOST_STORAGE_CONTRACT.md) remains the normative upstream requirement:
host-owned authoritative revisions/CAS and durable operation receipts, plus a separate
context-bound, durably claimed one-shot mutation tied to the committed intent. NexusInterface and
the module SDK own that capability. DEX owns fail-closed admission, consumption of the accepted API,
local state transitions, Redux projection and exact caller tests. Plain
`secureApiCall(endpoint, params)`, a Web Lock, or another module-side scope reread cannot substitute
for host acceptance.

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
contract is specified in [docs/HOST_STORAGE_CONTRACT.md](docs/HOST_STORAGE_CONTRACT.md). It requires
an authoritative `{contextId, revision, value}`, one compare-and-swap commit with a durable unique
operation ID, and truthful operation readback. Commit results are closed: `committed`, `conflict`,
or `outcome_unknown`; operation readback is `committed`, authoritatively `not_committed`, or
`unknown`. A committed operation ID is idempotent only for the same persisted content, and the host
must reject reuse with different content. Every writer that can address the journal uses this
protocol, or settings and journal occupy namespaces that cannot overwrite each other.

On conflict before a remote side effect, reread and rerun the pure transition against authority.
On unknown outcome, reconcile by operation receipt plus exact content readback; if the host cannot
prove whether it committed, retain a visible storage hold and permit neither a new mutation nor a
stale full-snapshot write. Revision, context and operation identity must survive independent
windows, renderer restart, profile switches and process crashes. A promise-returning wrapper around
`updateStorage()` does not satisfy this contract.

Storage commit authority alone does not bind the subsequent wallet mutation to the same active
profile. The host must durably claim a unique invocation and execute the exact endpoint/parameters
against the context of the committed `submission_unknown` operation. A duplicate/restarted caller
must observe the existing invocation result or uncertainty without another dispatch. The DEX must
also reread scope after asynchronous funding validation and before committing intent, but that read
only narrows the race; it is not a substitute for host-side context binding through dispatch.

The module transaction is split into a pure transition over an authoritative snapshot and a host
commit. `submitNexus` may invoke the wallet only through the context-bound one-shot handoff after the
CAS that moves the exact job from `draft` to `submission_unknown` is proven committed. A second
controller must reread that revision and refuse submission. After the wallet returns, persistence of
the first remote identity is a local-only CAS: an unrelated settings conflict may be reread and
retried only while the same job, submission operation and immutable terms remain unchanged and no
identity is present. The wallet call itself is never retried. The same already-persisted identity is
idempotent; a different identity, changed/missing job or unknown commit becomes an operator-visible
hold and cannot overwrite the first identity.

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
- current Nexus Interface lacks acknowledged versioned module-storage writes and context-bound one-shot mutation;
- no target-wallet installation, real node, Solana cluster, browser-wallet, restart, or service acceptance has been completed by the offline suites;
- an on-chain provider record is not an endorsement or solvency proof.

Do not populate an acceptance record or add a fake promise wrapper around fire-and-forget storage. Follow [docs/CROSS_CHAIN_SWAPS.md](docs/CROSS_CHAIN_SWAPS.md) and [SWAP_SERVICE_DEVELOPMENT_PLAN.md](SWAP_SERVICE_DEVELOPMENT_PLAN.md). Dependency/security remediation remains a compatibility-gated workstream; do not apply blind upgrades or forced audit fixes.

The maintained `README.md` now matches the fail-closed implementation: it labels cross-chain use inspection-only, identifies the provider as an intermediary, removes manual funding and fixed-identity guidance, and states that no `SOLANA_RPC_URL` override is supported. Keep that summary synchronized with this architecture and `docs/CROSS_CHAIN_SWAPS.md`; dated reviews that describe the earlier unsafe README are historical evidence, not current instructions.

## Future accountability evidence

The future trust model should preserve the current safety hierarchy: exact identities and integer
units, wallet-held signing authority, explicit human approval, intent before mutation, attributable
completion evidence, and fail-closed unknown states. Namespace attestations, bonds, challenge
history and staked-accountability records may enrich
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
2026-10-07 at `7a28fcdd97710901e4317fb62d4ffc268b8743ca` using a copied existing dependency
tree: 65 Jest tests with coverage and all 110 reported Node tests passed; the focused storage/scope
Jest shard passed 27 and focused CJS controller/persistence execution passed 24. Strict swap lint
passed with zero warnings; repository lint passed with 21 warnings; both bundles built with three
performance warnings. No install, audit fix or dependency upgrade ran. The Jest run emitted three
Redux unknown-root-key diagnostics and one expected no-session warning; the component check remains
source/AST evidence rather than a rendered React workflow. The CI-shaped inline manifest command was
blocked by the execution security wrapper, so the pre-run inventory of all 12 declared paths is not
claimed as an executed manifest-gate pass. None of this establishes target-wallet storage,
context-bound mutation, rendering, service acceptance or live-chain behavior.
