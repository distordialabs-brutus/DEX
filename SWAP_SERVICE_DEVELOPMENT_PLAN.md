# swapService Client Development Plan

## Governing vision and portfolio traceability

Read [the repository vision](vision.md) and [Distordia alignment/dependency map](docs/DISTORDIA_ALIGNMENT.md) before assigning work. Authority is master Distordia strategy/customer evidence → portfolio roadmap/strategy decisions → repository vision → this development plan → tasks/code/tests/external evidence and human release.

**Portfolio purpose:** O1 interoperable open interfaces; O4 attributable wallet settlement. User-wallet authorization and recoverable, independently inspectable settlement; no module custody. Native Nexus trading and provider-custodial cross-chain transfers stay visibly distinct. The alignment map supplies customer-evidence qualification, batch ownership, upstream prerequisites and human gates. Each material task must name those fields alongside its exact production paths and collected acceptance tests. This documentation alignment changes no runtime, test result or release status; dated evidence below remains evidence for its stated snapshot only.

**Date:** 2026-09-07; DEX implementation status reviewed 2026-10-07 at remote `master`
`7a28fcdd97710901e4317fb62d4ffc268b8743ca`, covering the five runtime repair commits after
`052b9ab56e37ba1f4162f7be2df759ee0f9380f3`. **Accepted boundary:** M0/M1 remain
substantially implemented offline and M2-M4 remain behind release gates. The range adds three
scope rereads and two storage-containment controls: acknowledgement-only writers are rejected for
journal admission; one coordinator blocks stale settings after a journal fault; funding scope is
rechecked after validation and after intent acknowledgement; and mapping scope is rechecked after
mapping-intent acknowledgement. These are accepted DEX-local containment, not authoritative
cross-window storage or context-bound dispatch. Production remains read-only because
`configureStore` supplies no journal writer and `ACCEPTED_DEPLOYMENTS` is empty. NexusInterface/SDK
revision/CAS storage, durable operation and invocation receipts, namespace/legacy-writer isolation,
and context-bound one-shot debit and mapping mutations are still upstream prerequisites. Clean
Redux projection, rendered UI evidence, service-contract acceptance, supported-wallet acceptance,
live-node/test-network evidence and M5 remain incomplete. **Basis:** this exact-head review,
[host storage and mutation-handoff contract](docs/HOST_STORAGE_CONTRACT.md),
[current evaluation](SWAP_SERVICE_EVALUATION.md), and
[implementation/operating boundary](docs/CROSS_CHAIN_SWAPS.md). No dependency install, upgrade,
deployment, live transport, funds movement or release approval occurred.

## 2026-10-05 narrow C-1 admission containment

Removed production admission of the acknowledgement-only snapshot writer in
`src/configureStore.js`. Default-collected `__tests__/configureStore.test.js`
regressions reproduce the old two-controller duplicate and now require zero
mocked debits/writes, unchanged restart state, blocked journal admission, continued
inspection and existing native settings behavior. This advances **O4** recoverable
wallet settlement for the explicit non-Atlas wallet/bridge hypothesis. DEX owns the
admission boundary; keys, consent and dispatch remain wallet-owned. No dependency
versions, accepted deployments, custody or human release authority change.

This is containment only: C-1/C-2/C-7 and the following batch exits remain open.
NexusInterface/SDK authoritative CAS, receipts and bound invocation are upstream
prerequisites; revisioned-host and installed-wallet acceptance remain required.
No real financial transport is used or authorized. See the maintained evaluation
for scope; the October 2 evidence below is historical for its stated snapshot.
Local verification after a clean `npm ci`: 4/4 focused configure-store tests,
42/42 Jest tests with coverage and 110/110 swap tests passed. Both lint gates,
production build and all 12 manifest files passed; existing Redux diagnostics,
lint/build warnings and dependency audit findings remain separate open debt.

## 2026-10-05 narrow C-2 journal-fault containment

After the C-1 admission fix at `bff04e2`, the first priority still includes journal
loss through stale settings writes. This increment changes only
`src/swap/persistence.js`: once a journal fault is latched, every later queued
snapshot write rejects, including legacy settings. Reads remain inspectable;
settings changes remain local after a fault, with the existing storage diagnostic.
No automatic recovery/reset is introduced. A successful delayed acknowledgement
still permits the queued settings write while preserving the journal and foreign
keys.

**Traceability:** O4 recoverable, attributable wallet settlement; explicit non-Atlas
wallet/bridge hypothesis; DEX owns coordinator/middleware containment. The scheduled
maintainer implements and verifies the local candidate; the repository's human
maintainers retain release authority, and wallet owners retain keys/consent. No
production funds, custody, deployment acceptance or dependency versions change.
NexusInterface/SDK CAS, durable receipts, namespace isolation and bound invocation
remain upstream prerequisites. This same-instance hold is not cross-window or
restart write authority and does not close C-1/C-2/C-7.

**Collected evidence:** five regressions failed before the guard and passed after.
`__tests__/persistence.test.js` covers committing-host acknowledgement rejection,
negative/error/missing acknowledgement, delayed failure, repeated blocked settings
and journal writes, restart preservation, and successful-delay/unknown-field
controls. Existing configure-store and swap persistence tests now require no
legacy-writer bypass after a fault. After `npm ci`,
`npm test -- --ci --coverage --runInBand` passed 48/48 and `npm run test:swap`
passed 110/110; `npm run lint`, `npm run lint:swap` and `npm run build` passed.
Existing Redux diagnostics, 21 repository lint warnings, bundle warnings and
67 dependency audit findings remain unrelated open debt. Installed-wallet and
revisioned multi-context acceptance are still required before later batches.

## 2026-10-06 narrow C-7 post-validation scope guard

Following C-1/C-2 containment at `8605427`, the first-priority host/context group
still includes the observed validation-time profile-switch defect. This increment
changes only `submitNexus` in `src/swap/controller.js`: reread wallet/network scope
after asynchronous funding validation and before updating or committing intent.
An observed profile, Nexus network or Solana genesis change, an unavailable scope,
or a rejected scope read stops without storage writes or a wallet debit; the draft
remains unchanged in the coordinator and on restart. Stable scope retains the
intent-before-debit and no-blind-resubmit behavior.

**Traceability:** O4 attributable, recoverable wallet settlement; explicit non-Atlas
wallet/bridge hypothesis; DEX owns this controller guard. The scheduled maintainer
implements/verifies the local candidate; repository human maintainers retain release
approval and wallet owners retain keys/consent. No real financial transport,
dependency upgrade, custody or accepted deployment is introduced.
NexusInterface/SDK authoritative CAS, durable operation receipts, legacy-writer
isolation and context-bound one-shot invocation remain upstream prerequisites.
This reread cannot bind dispatch or detect a context switch after it; it is not
completion of C-7 or the C-1/C-2/C-7 batch. Keep funding disabled.

**Collected evidence:** three changed-scope regressions failed on the old controller
and passed after the guard. Default-collected `__tests__/controller.test.js` uses
real persistence/job-store/controller instances with mocked host boundaries and a
deterministically delayed validator. Six focused cases cover all three scope fields,
unavailable/rejected scope read, unchanged-scope intent-before-debit, envelope
preservation and restart/no-resubmit. After `npm ci`, the full coverage run passed
54/54 Jest tests and the swap suite passed 110/110; both lint gates and production
build passed. Existing Redux diagnostics, 21 lint warnings, three bundle warnings,
stale Browserslist data and 67 audit findings remain separate debt. Local Node is
22.23.2; repository CI uses Node 20. Installed-wallet acceptance remains unproven.

## 2026-10-06 narrow C-7 post-intent scope guard

The first-priority host/context group remains unresolved after `73fbebc`. Its
post-validation guard does not cover a profile/network switch while the intent
write acknowledgement is pending. This increment adds a scope reread in
`src/swap/controller.js` after intent commit and before `nexus.submitDebit`.
Observed scope changes or unavailable/rejected reads stop with zero mocked debits.
The already committed `submission_unknown` remains intact, including on restart;
no reset to draft, automatic resend or additional write is introduced.

**Traceability:** O4 attributable, recoverable wallet settlement; explicit non-Atlas
wallet/bridge hypothesis; DEX owns the controller containment. The scheduled
maintainer implements and verifies this candidate; repository human maintainers
retain release approval, wallet owners retain keys and consent, and providers
retain the separate custody/counterparty boundary. No real transport, accepted
deployment, dependency version or custody change is introduced. Authoritative
NexusInterface/SDK CAS, operation receipts, legacy-writer isolation and context-bound
one-shot invocation remain upstream prerequisites. The remaining reread-to-dispatch
race cannot be closed by this DEX-only guard; C-1/C-2/C-7 and batch exits stay open.

**Collected evidence:** three changed-scope regressions failed before the guard
because the old controller invoked the mocked debit once. Afterward all 11 focused
controller cases pass. Real persistence/job-store/controller instances and a
mocked host with a delayed intent acknowledgement cover all three scope fields,
unavailable/rejected post-intent reads, envelope/restart preservation, refusal to
resubmit even after restoring scope, and stable-scope intent-before-debit. After
`npm ci`, `npm test -- --ci --coverage --runInBand` passed 59/59 and
`npm run test:swap` passed 110/110; both lint gates and production build passed.
Existing Redux diagnostics, 21 lint warnings, three bundle warnings, stale
Browserslist data and 70 dependency audit findings remain separate debt. Local
Node is 22.23.2; CI uses Node 20. Installed-wallet acceptance remains unproven.

## 2026-10-07 narrow C-7 post-mapping-intent scope guard

The first-priority host/context group remains open after `e6ac4fe`. The debit
scope guards do not cover `repairMapping`: a profile/network change while its
mapping-intent acknowledgement is pending could still invoke `publishMapping`
before the existing post-call check. This increment rereads scope in
`src/swap/controller.js` after intent acknowledgement and before that adapter.
Scope changes and unavailable/rejected reads stop publication without rewriting
`mapping_unknown` or clearing `mappingStartedAt`. Restart and scope restoration
retain the manual-recovery requirement; no automatic create or debit retry occurs.
Exact manually verified mapping identities remain recoverable.

**Traceability:** O4 attributable, recoverable wallet settlement; explicit non-Atlas
wallet/bridge hypothesis; DEX owns controller containment. The scheduled maintainer
implements/verifies the candidate; repository human maintainers retain release
approval, wallet owners retain keys/consent and providers retain custody risk.
No real financial transport, dependency version or accepted deployment changes.
NexusInterface/SDK authoritative CAS, durable receipts, legacy-writer isolation and
context-bound one-shot invocation remain upstream prerequisites. This module reread
cannot bind the adapter's later async reads/dispatch or close C-1/C-2/C-7. Funding
stays disabled; installed-wallet and multi-context host acceptance remain unproven.

**Collected evidence:** three regressions first failed with one mocked publication
each on the prior controller, then passed after the guard. The 17 focused controller
cases include six mapping cases covering all three scope fields, unavailable/rejected
reads, exact envelope/first-source preservation, restart/no-retry, verified manual
recovery and unchanged-scope intent-before-publication. Real coordinators/stores and
controllers run against mocked host boundaries. After `npm ci`, full coverage passed
65/65 Jest tests; 110/110 swap tests, both lint gates, production build and all 12
manifest files passed. Existing Redux diagnostics, 21 lint warnings, three bundle
warnings, stale Browserslist data and 70 audit findings remain separate debt.
Local Node is 22.23.2; CI uses Node 20. This is containment, not release acceptance.

## Current execution order — exact-head 2026-10-07

The five repairs through `7a28fcd` are accepted as **local containment**. Do not assign them again as
unimplemented, and do not promote their mocked tests into host acceptance. The production path is
intentionally read-only: the acknowledgement-only writer is rejected and the deployment registry is
empty. The next work begins at the independent host boundary.

### Prioritized coding and ownership matrix

| Priority / batch | Objective, evidence class and vision outcome | Production paths and owner | Upstream and human boundary |
|---|---|---|---|
| P0 / H1 — implement and accept host authority | O4; unvalidated non-Atlas wallet hypothesis; one authoritative, recoverable intent history across contexts, with no module custody | **NexusInterface/SDK owns** versioned read, CAS, durable operation receipts, journal/settings namespace isolation, and one invocation claim per committed intent. DEX's `docs/HOST_STORAGE_CONTRACT.md` is the consumer contract; no DEX mock closes H1. | Wallet maintainers choose and approve the host API/durability boundary. The human user still approves the displayed mutation; the module holds no keys. Keep DEX funding disabled until installed-wallet acceptance. |
| P1 / D1 — consume CAS and project Redux safely | O4; same non-Atlas hypothesis; preserve intents/settings/unknown envelope fields and expose held uncertainty | **DEX owns** `src/configureStore.js`, `src/swap/persistence.js`, `src/swap/jobs.js`, `src/swap/runtime.js`, `src/reducers/index.js`, and default-collected integration tests. Replace hydrate-once write authority with pure transition plus bounded CAS/reconciliation. | Requires accepted H1 storage API and pinned SDK/wallet versions. Repository maintainers approve the compatibility change and migration; users retain signing authority. No dependency-wide upgrade belongs in this batch. |
| P2 / D2+H2 — bind debit and mapping dispatch | O4; attributable settlement; each committed debit or mapping intent reaches the wallet boundary at most once in its exact context | **Host owns** context binding, PIN/dispatch binding and durable invocation receipt. **DEX owns** `src/swap/controller.js`, `src/swap/runtime.js`, and `src/swap/nexus.js` consumption for both `finance/debit/account` and `assets/create/asset`. | Requires H1 plus accepted host one-shot invocation. Wallet maintainers approve the new mutation API; repository maintainers approve caller migration; the user separately approves each consequential action. Provider custody remains explicit. |
| P3 / U1 — rendered workflow and signer attempt authority | O1/O4; trustworthy visible authorization and recoverable external handoff, not UI-derived authority | **DEX owns** `src/App/stablecoinSwap.js`, `src/swap/signingPage.js` and a default-collected renderer suite. **Wallet/host owns** any cross-context durable signer-attempt claim. | Pin only renderer versions compatible with the supported wallet in a separate lockfile review. Human consent is required in each signer context; browser-local state cannot be described as global exactly-once authority. |
| P4 / S1+R1 — service contract, target acceptance and enablement | O1/O4; complete public terms and exact settlement/disposition evidence for one configured classic-SPL/Nexus pair | **swapService/operator owns** public max/dust/finality/receipt/admission/recovery behavior. **DEX owns** provider parsing, frozen-policy checks, exact evidence display and `src/swap/deployment.js`. | Requires independently accepted service candidate plus supported installed-wallet, target-node and isolated test-network evidence. Named human wallet, service and release owners approve any deployment entry. No live funds or production enablement follows automatically. |

### Executable negative, concurrency and recovery exits

| Batch | Negative/boundary exit | Concurrency exit | Restart/recovery and external exit |
|---|---|---|---|
| H1 | Reject malformed context/revision/receipt, operation-ID reuse with different content, capacity/disk/serialization failure, stale legacy writer and wrong-context commit before mutation. | Two independent WebViews/processes race the same and different jobs/settings; observe one revision order, no lost update, and one invocation claim per intent even with fresh competing invocation IDs. | Kill the writer after commit and after dispatch; a third context reads exact revisions, operation/invocation receipts, unknown outcomes and immutable first identity. Repeat in each supported installed wallet; mocks do not close H1. |
| D1 | `npm test -- --ci --runInBand __tests__/configureStore.test.js __tests__/persistence.test.js` must fail on unexpected Redux output and cover conflict, lost/rejected/malformed acknowledgement, invalid journal and unknown envelope fields. | Two real DEX coordinators against the revisioned host fixture preserve independent jobs and settings; stale candidates recompute after conflict and never overwrite. | Crash after intent and after identity commit; restart either reconciles exact operation/content or retains a visible no-send storage hold. Redux has exactly `ui/settings/nexus`; persistence receives the untouched envelope. |
| D2+H2 | Scope unavailable/changed after validation, after intent, during adapter preflight/PIN/dispatch, malformed/empty wallet response and conflicting identity all fail closed. `rejected_before_invocation` is accepted only with host proof. | Two controllers, repeated invocation ID and fresh competing invocation IDs produce at most one mocked remote attempt for each debit or mapping intent; no wrong-context call occurs. | Crash before dispatch, after acceptance and before identity CAS, and after identity commit. Restart never resends; returned/unknown invocation receipt and exact manual proof are the only recovery inputs. Run the same matrix in the installed wallet with transport mocked. |
| U1 | Render complete/incomplete/error discovery, address mismatch, stale quote/consent, storage/deployment block, every recovery control, launch-before-attempt failure and unmount cleanup. | Double activation, stale async generations, independent browser namespaces and profile switches never infer shared consent or a safe retry. | Reopen only from durable authority: proven no-attempt may restart handoff; any ambiguous attempt remains held. Then run the built module in the supported wallet; source/AST tests are insufficient. |
| S1+R1 | Shared fixtures reject below/exact/above dust, minimum and maximum, changed terms, wrong identity/program/finality, partial or sibling evidence and incomplete history. | Two providers and two jobs under one owner preserve pair/provider isolation; observation and disposition workers cannot cross-complete jobs. | Restart at every handoff, provider outage, accepted-but-lost response and operator disposition. Capture exact DEX/wallet/node/service/provider revisions and readback. Only then may a human add one evidence-pinned accepted deployment. |

Do not begin U1, signer work or release enablement by weakening P0-P2. H1 can be developed upstream in
parallel with D1 fixture design, but D1/D2 acceptance requires the real host API and H1 installed-wallet
evidence. Keep all financial transport mocked through H1/D2 and keep `ACCEPTED_DEPLOYMENTS` empty
through S1/R1.

### Batch 1 coder contract — authoritative journal, bound mutation and Redux projection

Implement [the host storage contract](docs/HOST_STORAGE_CONTRACT.md) before changing financial
controller behavior. Its storage API has three operations: authoritative versioned read,
compare-and-swap commit with `{contextId, expectedRevision, operationId, value}`, and durable
operation-result readback. A separate required host operation binds the committed intent and a
durably claimed one-shot invocation ID to the exact wallet/profile context, endpoint and parameters.
Export names may differ, but semantics may not.

1. Host commits storage value, next revision and operation receipt atomically and returns
   `committed`, `conflict` with current authority, or `outcome_unknown`. Reusing one operation ID with
   identical content returns its original receipt; reuse with different content is an integrity
   error. `not_committed` is legal only when the host can prove it; pruned/ambiguous receipts are
   `unknown`.
2. Route every writer that can address `swapJournal` through CAS, or put settings in a namespace
   unable to overwrite the journal. Preserve unknown envelope keys. Remove the legacy mixed
   full-snapshot path only after migration tests preserve old settings and journals under two-window
   conflict, restart, context switch, capacity rejection and malformed journal input.
3. Refactor the coordinator into pure `transition(authoritativeSnapshot)` plus bounded CAS retry.
   Recompute only after conflicts. Reconcile lost/rejected/missing acknowledgement by operation
   receipt and exact content; an inconclusive result creates a visible non-sendable storage hold.
4. Keep `submission_unknown` as the pre-wallet mutation state and persist its submission operation
   ID. Reread wallet/network scope after asynchronous funding validation and before committing that
   intent. The wallet mutation is reachable only after the exact CAS is proven committed and only
   through a host operation that binds `contextId`, intent operation ID, fresh invocation ID,
   endpoint and parameters. A second context or restarted caller cannot acquire send authority from
   a storage receipt. A profile switch racing dispatch is rejected before invocation or becomes an
   attributable unknown result without retry.
5. Persist a returned txid with a second local-only CAS. An unrelated settings conflict may reread
   and retry **only that local write** while the same job, submission operation and immutable terms
   remain unchanged and no txid exists. Never repeat the wallet call. Same txid is idempotent;
   different txid or changed/missing job retains the first identity and enters operator hold.
6. During `INITIALIZE`, give the complete host envelope to persistence but merge only reducer-owned
   `ui`, `settings` and `nexus` roots into Redux. Make unexpected `console.error` fail the focused
   test; Redux never owns the journal.

Default-collected acceptance uses two real coordinators/controllers and a revisioned fake host:

- same job from two hydrated windows: one mocked wallet call and one immutable identity;
- two independent jobs: both retained after conflict/recompute;
- settings race before intent and after returned txid: settings and journal both retained, one call;
- host commit plus lost/delayed/rejected acknowledgement: exact operation readback or a no-send hold;
- crash after intent/before wallet and after wallet/before txid: restart never automatically resends;
- repeated operation ID: same payload idempotent, different payload rejected;
- active-profile change during validation, between commit and dispatch, and during dispatch: no
  wrong-context call; repeated or fresh competing invocation IDs for one intent never dispatch twice;
- first identity conflict, capacity/disk/serialization fault and third-context restart: no overwrite,
  cross-context write or hidden loss.

Run these tests before rendered-UI or signer-handoff work so later batches consume one stable
journal contract. The current single-instance and shared-Web-Lock tests remain useful regressions,
but they do not satisfy this acceptance matrix.

### Batch 2 coder contract — rendered component evidence

Add a default-collected jsdom renderer compatible with the wallet's actual injected React surface.
The current lock resolves `nexus-module` 1.1.11; its React and ReactDOM bridge shims are labelled
19.1.0, while `npm ls react react-dom @testing-library/react react-test-renderer --depth=0` resolves
none. Choose the supported Nexus Interface version matrix first, then pin test-only React/renderer
versions matching that host in a separately reviewed lockfile change. Do not combine this with
production dependency upgrades. Mount the real `StablecoinSwap({runtimeOverride})`, drive it through
DOM events, and assert visible/disabled controls plus calls at the runtime boundary. Cover
complete/incomplete/empty/error discovery, address-bound selection failure, quote and consent
invalidation, storage/deployment blocking, double activation, stale generations, profile/network
change, every recovery action, and unmount timer cancellation. Rename the current AST test so no
test title claims mounting. Fail on unexpected console output, unhandled rejection and leaked timer.

## Historical execution order — 2026-09-21

The [September 21 review](DEVELOPMENT_REVIEW_2026-09-21.md) was the evidence for this historical order. With no implementation change since its prior baseline, a clean install and complete configured local gate reproduced 41 Jest and 110 swap passes. That review prioritized failing on Redux diagnostics, projecting only reducer-owned roots into Redux, adding a default-collected rendered `StablecoinSwap({ runtimeOverride })` suite, and proving the real supported-wallet acknowledged-write/restart contract. The September 22/23 evidence supersedes this ordering by placing authoritative multiwindow and uncertain-ack journal persistence first. Dependency upgrades remain a separate compatibility-controlled batch.

## Product boundary

The feature should let a user discover provider records on Nexus, inspect a provider and its configured pair, approve an exact funding instruction, and follow the resulting job to attributable completion or a clearly explained unresolved state.

It is a **custodial cross-chain bridge client**, distinct from native Nexus market orders. On-chain publication is not provider endorsement. Initial support is one classic SPL Token Program mint / Nexus token register per provider deployment; multiple provider records may belong to one operator. Do not advertise arbitrary assets, Token-2022, market-priced conversion or multi-chain execution merely because a record can describe them.

**Current recommendation:** preserve the implemented read-only provider discovery and offline-tested single-pair workflow, but keep every financial transition blocked until target-wallet storage, test-network settlement, service-side, and exact-deployment acceptance gates pass. The visible `StablecoinSwap` tab is not a release decision.

## Architectural contracts

### Provider identity and adapters

Use `(nexusNetworkIdentity, providerAssetAddress)` as the provider key—not its local name, display ticker or owner alone. One owner can publish several deployments.

A normalized provider model should distinguish:

- raw record/version and evidence source;
- immutable asset address and built-in owner;
- Nexus network and Solana cluster/genesis identity;
- exact Nexus token register and SPL mint, independent decimal precisions;
- treasury, vault, quarantine and fee-account roles where supported;
- supported directions and protocol/memo/mapping versions;
- directional fee, minimum, dust and cap policies with explicit unknown fields;
- declared operational status and separately measured liveness;
- validation results, trust-policy status, discovery completeness and reasons funding is disabled.

**Current compatibility:** recommended v1 uses `distordiaType=nexusBridgeHeartbeat`; older v1 heartbeat fields differ. Build explicit adapters and independent token-metadata reads. Missing required terms/identity must mean unsupported or inspect-only, not fallback to old USDC/USDD defaults. A current v1 adapter does not require changing the provider's name-based writer to let the client pin an asset address.

**Future target:** provider-v2 uses exact `distordia-type=swapService`, schema/service IDs, address-based instance isolation and a fuller public contract. Its builder/tests are now committed in swapService, but runtime publication remains v1. Agree its schema, field-size budget, migration rules and target-node query semantics jointly before enabling a v2 writer or reader as production infrastructure. Do not invent a v2-only discovery query and call existing v1 providers absent.

**Upstream release dependencies:** the current portfolio review, using the separate swapService
exact-source review at published `origin/main` `2c4ed319d251836f01dfb83de68da71b1c6c6a23`, records a
published sealed-image/witness runtime and finite in-process fingerprints for the root entrypoint,
running interpreter, selected native mappings, installed `solders` extension and selected wrapper
sources. Its fresh offline gate collected and passed 1,522 tests plus 77 subtests. That is bounded
offline containment, not upstream release acceptance: external trusted pre-execution artifact
authority, coherent restore/bootstrap authorization, exact service-record identity and Solana/Nexus
freshness/readiness, eligible capacity progress, operational witness/hold disposition and target-
infrastructure acceptance remain open. This DEX review did **not** inspect swapService and does not
independently accept those upstream claims; it carries the portfolio/upstream review as a pinned
dependency. Older 947-test staged-candidate and September 22 service-policy descriptions are
historical inputs, not the current comparison. These remain swapService/operator responsibilities;
a DEX parser, scope reread or UI guard cannot substitute for service-side controls. Include exact
published-candidate regression and live-boundary evidence in M5 acceptance.

### Frozen job contract

Before any funds-moving authorization, persist a versioned job containing:

- local job ID plus wallet profile/genesis and network scope;
- provider asset/owner and observed record/terms version or locally computed public snapshot hash;
- source account, destination token account and both immutable token identities;
- exact input/output/fee base-unit strings and decimal scales;
- memo bytes, mapping identity and supported numeric reference if used;
- submission intents, transaction IDs/signatures, source contract IDs and observation cursor;
- validated evidence, timestamps and reason-coded current state.

A local hash is evidence of what the user approved, **not proof that the provider contractually locked that quote**. If current v1 cannot commit or echo per-job terms, define the quote's advisory status and operator change policy explicitly; a guaranteed quote requires coordinated provider support.

Never persist PINs, sessions, signing keys or private RPC credentials with jobs. Nexus module storage has a bounded size and is not automatically a transactional database; validate its write-acknowledgement/durability semantics, version records, and apply bounded history/export rules before using it as the pre-submit intent journal.

### Proposed job states

```text
Draft -> ProviderValidated -> QuoteReviewed -> FundingIntentPersisted

Solana input:
  AwaitingExternalSignature -> DepositObserved -> DepositFinalized
  -> AwaitingNexusOutput -> NexusOutputVerified -> Completed

Nexus input:
  AwaitingWalletApproval -> DebitSubmitted -> DebitConfirmed
  -> RoutingMappingPublished -> RoutingMappingVerified
  -> AwaitingSolanaOutput -> SolanaOutputFinalized -> Completed

Nonterminal exceptional states:
  SubmissionUnknown | ObservationIncomplete | ProviderUnavailable |
  MappingRepairRequired | AccountOrNetworkSuspended | OperatorHold

Terminal states only with evidence:
  CancelledBeforeFunding | Completed | RefundVerified | DispositionVerified
```

The mapping asset can be prepared before debit, but its real transaction binding can only be finalized after the transaction identity is known. Persist intent before each mutation, read back each write and preserve per-job mapping isolation. The precise user-DEBIT/provider-CREDIT identity relation must be proven on the target Nexus build; do not synthesize contract IDs from UI sequence numbers.

Do not convert a timeout, missing lookup or changed balance into a terminal refund. Never automatically resubmit an uncertain debit, switch the provider for a funded job, or reuse another job's destination/quote snapshot.

## Milestones and acceptance criteria

Status below distinguishes implementation/offline fixtures from target-wallet and live test-network evidence. A passing mocked suite does not satisfy a live acceptance criterion.

| Milestone | 2026-10-07 status | Remaining exit evidence |
|---|---|---|
| M0 | **Substantially implemented offline; containment advanced** | Existing-tree verification passes 65 Jest + 110 reported Node tests, both lint gates and build. Focused storage/scope tests pass. Production rejects acknowledgement-only journal writers, and scope guards cover validation, intent acknowledgement and mapping-intent acknowledgement. Three Redux errors remain; no collected test renders the component; the CI-shaped manifest command was blocked by the execution wrapper. Exact-head remote CI was not refreshed. |
| M1 | **Implemented offline** | Verify rendering, real list/filter/pagination shapes, provider selection, and read-only behavior inside supported Nexus Interface versions against a target node. |
| M2 | **Partial / host-blocked** | Exact math/codecs and a module-local journal exist; current production intentionally admits no journal writer. Implement and accept host revision/CAS, durable operation receipts, settings isolation and restart/multi-context semantics, then consume them in DEX. |
| M3 | **Implemented behind gates, offline only** | Consume a context-bound one-shot host mutation for debit and mapping publication; exercise both directions with real test tokens, wallet rejection/timeouts, accepted-but-lost responses, and restart without duplicate sends. |
| M4 | **Implemented behind gates, offline only** | Validate receipt/claim, mapping, deep history, outages, disposition and restart recovery against accepted service and real Nexus/Solana behavior. |
| M5 | **Pending** | Complete all cross-repository acceptance and add a human-approved, evidence-pinned deployment entry; no entry is currently accepted. |

### M0 — Containment, integration contract and executable regression baseline

**Priority:** maintain as a required gate. **Ownership:** DEX, with swapService API/schema input. **Status:** substantially implemented offline; the transaction UI is visible for inspection/recovery, while storage and deployment gates prevent funding.

- Keep financial routing disabled behind explicit storage and deployment gates; the visible inspection/recovery page must not make a mutation reachable during unrelated tab work.
- Choose a test runner compatible with the supported Nexus Interface runtime and current lockfile. Do not bulk-upgrade dependencies. Resolve the unrelated ErrorBoundary move separately with explicit path staging.
- Add a real test command and swap-focused lint gate; record any repository-wide baseline rather than calling existing red lint green.
- Define versioned fixtures from current service output and chain evidence; distinguish recommended v1, old v1, future v2 and unsupported records.
- Turn reproduced defects into failing regressions before repairing them.

**Exit:** one local command runs isolated tests without a wallet/node; funding adapters are mocked/fail closed; regressions cover displayed memo, recipient account versus owner, missing treasury/mapping, false completion, partial fees and repeated submission. Build and scoped lint contracts are reproducible. No source/manifest lockfile drift is hidden by cached dependencies.

### M1 — Read-only provider discovery and inspection

**Priority:** first visible product increment. **Ownership:** DEX; target-node query validation jointly owned. **Status:** implemented in production code and fixture-tested; target-wallet rendering and target-node query acceptance remain open.

- Add paginated discovery through the wallet's Nexus read API with explicit complete/incomplete/unsupported/error outcomes.
- Normalize known schemas; re-read chosen records by immutable address; validate built-in owner and immutable token/custody identities through trusted chain reads.
- Show all providers, including independent records sharing one owner, with supported pairs, fee/minimum terms, declared status, freshness and trust/validation warnings.
- Reject future timestamps outside an explicit skew policy. A heartbeat is liveness, not solvency or readiness.
- Keep contact/explorer links sanitized. Do not accept provider-supplied RPC URLs as the authority for payment evidence.

**Exit:** tests include multiple providers, same-owner deployments, identical tickers with different registers/mints, wrong network, duplicate records, malformed/schema-unknown assets, missing fields, paused/future/stale records, multiple pages and mid-page errors. Provider selection cannot inherit another provider's addresses. Read-only module rendering is verified in Nexus Interface. Fund actions remain disabled.

### M2 — Exact quote core, protocol codecs and durable job store

**Priority:** required before funding. **Ownership:** DEX plus service policy compatibility. **Status:** exact quote/codecs and a serialized immutable journal are implemented; durable operation remains blocked because the current host lacks acknowledged module storage.

- Extract React-free decimal/base-unit math and versioned deposit/payout/mapping codecs.
- Derive terms from the selected validated provider and authoritative precision metadata. Show fees in the correct token domain; include minimum, dust/fee-only behavior and constraints.
- Persist funding intent and immutable quote/provider/account snapshots. Scope storage by profile and networks; validate storage acknowledgement and restore behavior.
- Revalidate provider identity/status/terms immediately before approval; changed terms return to review, never silently alter an already funded job.

**Exit:** exact 6/6, 8/6, 6/8, 9/6 and 0/0 fixtures agree with service arithmetic; zero/boundary/overprecision/unsafe-Number inputs are handled explicitly. Reload restores pending jobs without submitting. Account/network switches suspend incompatible actions. Storage failure prevents a new debit.

### M3 — Complete funding workflows without duplicate sends

**Priority:** after M2. **Ownership:** DEX, with target Nexus semantics tested jointly. **Status:** both controller paths, external Solana signing, intent-first writes, unknown-outcome holds, and manual recovery are implemented and fixture-tested, but no real wallet/node/test-network acceptance exists.

**Solana→Nexus MVP:** retain external-wallet handoff rather than introduce a new wallet-adapter dependency immediately. Display/copy exact mint, network, destination token account, amount and memo. Validate a pasted signature against that job, using supported transaction versions/programs and authoritative successful finalized evidence. An embedded Solana wallet can be added later as another funding adapter.

**Nexus→Solana:** resolve/validate a real destination token account; submit a supported `finance/debit/account` payload with exact `from`, `to`, amount and optional unsigned numeric reference through the context-bound host mutation operation tied to the committed intent. Persist the returned identity. Publish/read back a user-owned `txid_toService`/`receival_account` mapping unique to that pending job. Keep mutation sequencing resumable across separate PIN approvals.

**Exit:** wallet cancellation before send is safe; acceptance followed by timeout produces `SubmissionUnknown`; no duplicate send is possible by double-click, remount or retry. Mapping publication failure retains the debit/job and retries only the mapping. Two concurrent jobs cannot overwrite routing. Unknown token program, owner-only destination, wrong mint/network or changed provider identity is blocked before funding.

### M4 — Attributable completion, holds and recovery

**Priority:** required to complete the product promise. **Ownership:** DEX + service evidence contract. **Status:** exact source/output proof, source-bound Nexus receipts, bounded claim-history pagination, mapping recovery, scope rechecks, and held states are implemented offline; service and chain semantics still require live acceptance.

- Replace balance-delta and substring matching with exact source/contract/reference and destination/amount/mint/source-signer checks.
- Confirm output finality and, on Nexus, actual credit/claim semantics; display debit submission separately from spendable receipt.
- Run one non-overlapping observer per job with cancellation, backoff and generation fencing. Refresh UI state without cancelling unrelated pollers.
- Resume from durable evidence after wallet restart; handle deposits/payouts already completed before observation starts.
- Show explicit held/mapping-repair/provider-unavailable states with evidence export and operator contact. Do not promise an automated Nexus refund.

**Exit:** unrelated credits, split/partial outputs, wrong destination with the same owner, memo-prefix collisions, sibling CREDIT contracts, unfinalized/reverted transactions and failed provider responses cannot complete a job. A payout beyond the first history page is recoverable. Timeouts and incomplete scans retain unresolved status. Config/provider changes cannot rewrite funded-job terms.

### M5 — Cross-repository acceptance and controlled enablement

**Priority:** final release gate. **Ownership:** DEX, swapService operator implementation and wallet compatibility owners. **Status:** pending; `ACCEPTED_DEPLOYMENTS` is empty and the host-storage requirement is unresolved.

- Run the whole flow in supported Nexus Interface versions and isolated Solana/Nexus test networks; verify real API field selection, global asset discovery/indexing, confirmation rules, debit-to-credit identity, mapping reads and token decimals.
- Test one provider, two providers and two records owned by one signature chain. Include restart at every boundary, accepted-but-lost response, provider pause/outage, stale terms, incomplete history and explicit operator disposition.
- Preserve the four accepted published restored-source holds and close the service-side executable
  attestation, heartbeat identity, node-freshness, witness bootstrap, capacity scheduling,
  hold-resolution, provider-v2 and receipt-publication blockers documented in the current service
  evaluation. Older September 22 policy probes remain historical evidence unless rerun against the
  exact release candidate. A client badge cannot substitute for operator-side controls.
- Make local build/lint/tests and exact-candidate CI truthful. Preserve the Nexus Interface dependency compatibility policy.
- Enable discovery/inspection first. Enable funding only after the direction's entire initiation-to-final-evidence path passes; never enable a button on the strength of an isolated send test.

**Exit:** a user can discover a real test provider from a clean client, verify its pair and terms, authorize one transfer, survive restart and obtain exact finalized output evidence—or a truthful durable unresolved state. No real production funds are required for acceptance. Every evidence-dependent label is traceable to its source.

## Superseded recommendations — 2026-10-02 snapshot

The numbered list below is retained as historical planning context only. It is **not a current coder
entry point**: its first failure-collection and narrow scope-guard work shipped in the five commits
through `7a28fcd`. Use the 2026-10-07 H1/D1/D2+H2/U1/S1+R1 ownership and exit matrices above. In
particular, do not add another module-side acknowledgement wrapper or scope reread and call the host
gate complete.

At the October 2 snapshot, the intended sequence was acceptance-gated. It kept financial transport
mocked through Batch 6 and `ACCEPTED_DEPLOYMENTS` empty through Batch 7:

1. **Batch 1 — collect the failures without changing behavior:** convert the retained
   `persistence-lifecycle`, `controller-two-window`, and context-switch probes into default-collected
   regressions. Use two real coordinators/controllers and a revisioned fake host. Add explicit cases
   for same-job duplicate submission, independent-job lost update, commit-plus-lost/rejected/delayed
   acknowledgement, settings races before intent and after returned identity, crash boundaries,
   same-operation/same-content replay, operation-ID content conflict, and competing invocation IDs.
   Exit: the new tests fail for the documented reasons while all pre-existing tests remain green.
2. **Batch 2 — implement the authoritative host contract:** use
   [docs/HOST_STORAGE_CONTRACT.md](docs/HOST_STORAGE_CONTRACT.md) as the acceptance source. Add
   the versioned host adapter and pure-transition/CAS coordinator. Require one wallet mutation,
   preservation of independent jobs,
   conflict recomputation, operation-receipt reconciliation, safe local-only txid retry, immutable
   first identity and identical third-context restart state. Add the profile-switch probe and a
   context-bound, durably claimed one-shot wallet invocation tied to the committed intent; test
   switches during validation and dispatch plus repeated/fresh competing invocation IDs for one
   intent. A shared Web Lock, module-side scope read, plain `secureApiCall`, or
   `Promise.resolve(updateStorage(...))` does not pass.
3. **Batch 3 — repair Redux hydration and legacy-writer isolation:** project only reducer-owned `ui/settings/nexus` roots into
   `src/reducers/index.js` while persistence receives the untouched host envelope. In
   `__tests__/configureStore.test.js`, fail on unexpected `console.error`, assert exact root keys and
   journal readback, and prove settings cannot overwrite a newer revision or unknown commit. Focused command:
   `npm test -- --ci --runInBand __tests__/configureStore.test.js`.
4. **Batch 4 — render the workflow:** choose supported Nexus Interface versions, then pin test-only
   React/renderer dependencies matching the host in a separate compatibility change. The installed
   `nexus-module` 1.1.11 shims identify React/ReactDOM 19.1.0, but none is directly resolvable in the
   repository. Mount `StablecoinSwap({runtimeOverride})`; cover discovery outcomes, immutable-address
   failure, stale generations, consent invalidation, blocked funding, double activation,
   profile/network change, all recovery controls and unmount/timer cleanup. Rename the AST test that
   claims a mounted branch.
5. **Batch 5 — repair signer handoff only after storage:** coordinate handoff/attempt state through the same
   wallet-owned authority. Distinguish proven no-attempt from submission unknown, test browser-launch
   failure and safe reopen, and repeat across isolated storage/lock namespaces with explicit consent.
6. **Batch 6 — prove the host contract:** run its matrix in supported installed Nexus Interface versions with
   independent windows, real durable acknowledgement/readback, process termination, restart,
   capacity failure, profile changes and a context switch racing the one-shot invocation. Inspect
   the bound context and invocation receipt. Keep the wallet financial call mocked during this gate.
7. **Batch 7 — prove service/chain behavior:** run M1 read-only target-node acceptance before transfers; close
   swapService max/dust/finality, receipt, recovery/admission and disposition exits; then run isolated
   two-direction M3/M4 scenarios using explicitly authorized non-production assets and fault
   injection. Capture exact wallet, node, service, provider-record and client revisions.
8. **Batch 8 — control enablement:** add an accepted deployment only after all prior evidence exists. Separately
   measure and reduce the 1.23 MiB app and 567 KiB signer bundles with compatibility-tested splitting;
   do not solve size or audit debt through blind dependency upgrades.

After these safety and evidence exits, implement vision-aligned provider accountability as a
read-only adapter: preserve raw namespace/attestation/bond/challenge evidence and its issuer, revision
and expiry; label observed versus inferred versus attested claims; never treat a Distordia namespace
or score as custody/settlement proof or an undisclosed execution allowlist. This is subsequent product
work, not a reason to reorder the journal, rendered-component or live acceptance batches.

Treat broader TypeScript conversion, wallet-adapter replacement and dependency upgrades as separate work. Security remediation is intentionally deferred until Nexus Interface compatibility can be demonstrated; no forced audit fix belongs in this plan.
