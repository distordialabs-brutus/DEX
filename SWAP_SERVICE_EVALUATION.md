# DEX ↔ swapService bridge functionality and security evaluation

**Current exact-head status, 2026-10-07:** remote `distordialabs-brutus/DEX` `master` is
`7a28fcdd97710901e4317fb62d4ffc268b8743ca`. This review covers the five commits after
`052b9ab56e37ba1f4162f7be2df759ee0f9380f3`: acknowledgement-only journal-admission
rejection, same-coordinator stale-settings containment after journal faults, scope rereads after
funding validation and intent acknowledgement, and a scope reread after mapping-intent
acknowledgement. These controls are accepted at their narrow DEX-local boundary. They do not provide
authoritative host storage, cross-context durability, context-bound dispatch, service acceptance or
release approval.

Fresh detached-tree evidence at the exact head is 7 Jest suites / 65 tests with coverage, 110
reported Node tests, 27 focused Jest storage/scope tests, 24 focused CJS controller/persistence tests,
strict swap lint green, repository lint at 0 errors / 21 warnings, and a successful production build
with three performance warnings. The run reused a copied existing dependency tree; no install,
upgrade or audit fix ran. Jest still emits three Redux unknown-`swapJournal` diagnostics and one
expected no-session warning. The CI-shaped inline manifest command was blocked by the execution
security wrapper; all 12 declared paths appeared in the pre-run inventory, which is not equivalent
to a fresh maintained manifest-command pass.

The October 2 DEX and swapService identities, service findings and retained probes below are dated
historical evidence unless this review explicitly supersedes them. The DEX-specific runtime pass inspected neither
swapService nor NexusInterface and therefore does not independently refresh their implementation status.
Their acceptance remains an upstream prerequisite rather than a DEX claim.

## 2026-10-07 maintainer increment — C-6 Redux projection only

The scheduled maintenance candidate based on `9fe3e28` addresses the independently
safe Redux-projection subissue in P1/D1 while P0/H1 remains an upstream prerequisite.
`src/reducers/index.js` now merges only reducer-owned roots from storage and session
initialization. The full host envelope still reaches persistence unchanged; settings
saves preserve the journal and foreign storage keys. Recursive reducer defaults and
session precedence are unchanged. Redux is not journal or financial authority.

A default-collected real configure-store regression first failed on the extra
`swapJournal`, `futureStorage` and `futureSession` roots. It now passes and requires
no unexpected console error, exact roots, no initialization write, unchanged source
envelopes, journal readback and complete-envelope preservation on settings save.
Additional reducer regressions cover disk/session sources, invalid input and inherited
roots. Fresh `npm ci` and candidate verification passed 26 focused Jest tests,
7 suites / 73 full Jest tests with coverage, 110 reported swap tests, both lint gates,
production build and all 12 regular manifest files. Redux unknown-root diagnostics
are absent from this run; one expected no-session warning, 21 lint warnings, three
bundle warnings, stale Browserslist data and 70 audit findings remain. No dependency
versions changed. Local Node is 22.23.2; CI uses Node 20.

This closes only the C-6 hydration-projection subissue, not H1/D1/D2 or C-1/C-2/C-7.
It advances O4 for the explicit unvalidated non-Atlas wallet hypothesis. DEX owns
the reducer/test boundary; human maintainers retain compatibility/release approval,
users retain keys/consent and providers retain custody risk. Host CAS, durable
operation/invocation receipts, namespace isolation, context-bound dispatch and
supported-wallet/service/target acceptance remain required. Funding stays disabled,
`ACCEPTED_DEPLOYMENTS` stays empty, and no real financial transport was used.
The exact-head tables above/below remain evidence for the pre-increment snapshot.

## 2026-10-08 maintainer increment — D1 malformed-journal preservation

Based on published `3651b7dc7d822ab609bc98e9b493e08000b57cd9`, the next
independently safe P1/D1 subissue is malformed journal input. P0/H1 remains
upstream-blocked: the installed SDK still exports only the legacy storage writer,
not the required versioned CAS/operation or bound-invocation API. The already
completed admission, fault/scope containment and Redux projection are not repeated.

`src/swap/persistence.js` now defaults to an empty journal only when the property
is absent. Previously persisted `null`, `false`, `0` and `''` were silently
presented as empty history, bypassing job-store validation and permitting a new
job to replace that history in explicitly writable fixtures. Existing malformed
values now reach the real job-store validator and produce its funding-blocked
error. Settings saves preserve those exact values and foreign envelope fields;
restart does not reset them. No automatic repair or recovery authority is added.

**Traceability:** O4 recoverable, independently inspectable wallet settlement;
explicit unvalidated non-Atlas wallet/bridge hypothesis. DEX owns the persistence
read boundary and tests; the scheduled maintainer implements/verifies the candidate.
Repository human maintainers retain compatibility/release approval, users retain
keys and consent, and providers retain custody risk. H1 authoritative CAS/receipts,
legacy-writer isolation and H2 context-bound invocation remain upstream prerequisites.
This closes only the falsy-journal masking subissue, not D1/H1/C-1/C-2/C-7.

**Collected evidence:** four default-collected regressions failed before the fix
because job listing did not throw. Real persistence/job-store tests now cover
seven invalid values, blocked repeated creation, unchanged input/storage, exact
settings preservation and restart; absent and valid-empty journal controls still
permit a first job through a mocked host writer. After fresh `npm ci`, focused
persistence tests pass 15/15; full coverage passes 7 suites / 82 tests; swap tests
pass 110/110. Both lint gates, production build and all 12 regular manifest files
pass. Existing no-session/Browserslist warnings, 21 lint warnings, three bundle
warnings and 70 audit findings remain unrelated debt. Local Node is 22.23.2; CI
uses Node 20. No dependency versions, live transport or accepted deployments change.
Installed-wallet, host multi-context, service/target and human acceptance remain
unproven; production funding stays disabled. Earlier exact-head tables remain
evidence for their stated snapshots.

## Verdict

**The exact-head client remains an implemented, release-gated custodial bridge and is not approved for
funding.** Navigation, provider discovery, exact quotes, adapters, job controller and signing
companion exist. The shipped `ACCEPTED_DEPLOYMENTS=[]` and the production refusal to admit a
snapshot-only journal writer independently block funding. Keep both boundaries closed.

The five reviewed commits remove two previously reachable module-local hazards from the admitted
production path and narrow three asynchronous scope windows. A Promise-shaped snapshot writer can no
longer enable the journal, a latched journal fault blocks later settings snapshots in that
coordinator, and changed/unavailable scope is checked before intent, before debit, and before mapping
publication after each relevant acknowledgement. Their default-collected tests use real DEX
persistence/store/controller callers with mocked host boundaries and pass at exact head.

They do **not** implement the financial authority required for release. There is still no host-owned
authoritative revision/CAS journal, durable operation readback, settings namespace isolation across
all contexts, or context-bound one-shot invocation. The new guards cannot prevent a switch after the
last read or during the asynchronous preflight inside `publishMapping`; plain `secureApiCall` accepts
no committed context/intent/invocation identity. Supported-wallet multi-context and restart
acceptance, signer attempt authority, rendered UI, complete service terms/receipts/dispositions, and
live target evidence remain open. These are release blockers, not claims that the currently disabled
path moved live funds.

The [September 7 evaluation](SWAP_SERVICE_EVALUATION_2026-09-07_HISTORICAL.md) is archived unchanged.
Its disabled-tab, absent-mapping, floating-point quote and heuristic-completion findings describe the
old prototype, not current runtime. Dated development reviews and the October 2 external-service
comparison remain historical evidence; this maintained evaluation is the current DEX issue register.

## Functionality against the actual service

| Contract / capability | Current result |
|---|---|
| UI and discovery | Live navigation/render branch and compiled bundle; bounded recommended-v1 discovery, address-bound selection and explicit rejection of incomplete/future schemas. Actual Nexus Interface rendering remains unverified. |
| Pair / fees / minima | Chain-enriched token identities and decimal scales; BigInt client quotes match actual service floor-rescaling and output-domain flat-plus-bps arithmetic in ordinary-range fixtures. |
| Solana→Nexus source | Classic SPL `TransferChecked` plus exact configured memo prefix and Nexus recipient; service parser agrees. |
| Solana→Nexus completion | Full-signature receipt → exact Nexus DEBIT → linked spendable CREDIT. Correct evidence model, but receipt-enabled production service is currently prohibited. |
| Nexus→Solana source | Exact source-account→treasury debit and numeric reference; client distinguishes user DEBIT from provider CREDIT. |
| Nexus→Solana routing | Owner-bound `txid_toService` and existing-mint-token-account `receival_account` match service requirements. Composite source contract is preserved; ambiguous sibling treasury credits are rejected. |
| Solana payout | Exact `nexus_txid:<provider-credit-txid>:<contract-id>` memo; finalized successful transfer, exact vault/mint/recipient/amount/authority—not a balance delta or substring. |
| Unknown outcomes | Controller normally commits intent before mutation and refuses blind resubmission. This protection depends on persistence defects C-1/C-2 being repaired. |
| Provider-v2 | Service builder/tests are committed but runtime still writes v1; DEX deliberately rejects v2. Coordinated migration remains necessary, not an active v1 incompatibility. |
| Custody | Provider holds the funds. Listing, fresh heartbeat and observed liquidity do not prove solvency or atomicity. |

The client does not use a provider-supplied RPC URL, import keys, or bypass wallet consent. A frozen
client quote is evidence of user intent, **not a service-enforced price/terms lock**.

## Findings and impact

### C-1 — High, activation blocker: separate windows can submit the same Nexus job twice

**2026-10-05 containment update:** `configureStore` no longer admits
`updateStorageAcknowledged` into the hydrate-once snapshot coordinator. A fulfilled
snapshot-write Promise cannot establish cross-window authority. The production
module now keeps journal writes/funding read-only even if a host exposes that
acknowledgement-only method; cached journal inspection and native settings remain
available. Default-collected configure-store regressions use two real persistence
coordinators, stores and controllers with shared serialized locks and mocked host
storage/wallet transport. Before containment they reproduced two mocked debits;
after containment both calls reject before storage or wallet mutation, and a third
context still reads the untouched draft. Funding validation deliberately succeeds
in the fixture, so deployment rejection does not mask this boundary.

This is a narrow admission fix, **not completion of C-1/C-2/C-7**. Authoritative
CAS/operation readback, settings isolation, bound one-shot invocation and the
revisioned-fake-host/real-wallet acceptance matrix remain unimplemented. The older
probes and line references below describe the pre-containment implementation.
`ACCEPTED_DEPLOYMENTS` remains empty.

**Code:** `src/swap/persistence.js:4-9,33-45`; `src/swap/jobs.js:127-145`;
`src/swap/controller.js:162-181`.

Each persistence coordinator hydrates once and reads its own cache. The shared Web Lock serializes
callbacks, but does not refresh authoritative storage or compare revisions. Consequently window B
can still read `draft` after window A persisted submission and sent the debit.

The parent ran the real controller, store and coordinators with mocked host/wallet boundaries:

```text
sameJob: same-job
serializedWindows: 2
mockedDebitCalls: 2
retainedTxid: mock-wallet-debit-2
```

Both windows were initialized from the same draft and operations were serialized. B overwrote A's
remote identity. Prerequisites are enabled funding, multiple writable module contexts sharing the
storage target, and approval of both wallet prompts. No actual target-wallet multiwindow support
or live duplicate transfer is claimed. Current empty acceptance prevents this funding path.

**Exit:** authoritative read-modify-write under a host-owned transaction/revision/CAS protocol,
including cross-context cache refresh. Test two real coordinators with the same draft and require
one wallet mutation, no lost identities and correct restart state. Locking stale snapshots is not
sufficient.

### C-2 — High integrity defect: settings can erase an uncertain journal write

**2026-10-05 narrow fault-containment update:** `src/swap/persistence.js` now
checks its latched journal fault before **every** queued snapshot write, including
`saveSettings`. A failed/missing acknowledgement may follow a durable host commit;
the stale cache is no longer allowed to overwrite that commit. Settings already
queued behind a delayed journal acknowledgement also reject if it fails. Inspection
continues, but cache readback and rehydration are not recovery authority. Native
settings saves before a journal fault and local Redux settings changes still work;
after a fault, settings are session-only and the existing middleware reports the
storage failure. Even a journal failure before host dispatch conservatively holds
later writes; there is no automatic fault reset.

Default-collected `__tests__/persistence.test.js` uses the real coordinator and a
mocked committing host to cover rejected, negative, error and missing durable
acknowledgements, delayed failure, repeated blocked writes and restart preservation
of the unknown state/first txid. A successful delayed-ack control preserves both
settings and journal plus unknown envelope fields. Updated configure-store and
swap regressions require the settings path not to bypass the hold. Five failing
regressions were observed before the fix; the full candidate passes 48 Jest tests
with coverage, 110 swap tests, both lint gates and the production build.

This contains the **same-coordinator fault path only**, not the full C-2 exit.
Other windows and restarts still require authoritative read/CAS/operation receipts
and isolation of all legacy settings writers. Restart fixtures prove durable bytes
survive the contained overwrite attempt, not that hydration creates global write
authority. C-1/C-2/C-7 host acceptance and human release remain open; no deployment
is accepted and no real wallet transport was used.

The following code references and probe describe the pre-containment snapshot.
**Code:** `src/swap/persistence.js:13-30,44-45`; `src/configureStore.js:61-71`.

If a host commits a journal write but rejects/loses its acknowledgement, cached `data` remains old.
The fault blocks later journal writes but not `saveSettings()`, which sends the stale full snapshot
through the legacy settings writer. The parent reran a probe that first observed a durable
`submission_unknown` row and then observed zero jobs after the settings save.

**Scope correction to the independent review:** this probe proves journal erasure, not an immediate
second debit. A failed pre-submit acknowledgement in `submitNexus()` prevents that invocation from
calling the wallet. C-1 separately demonstrates duplicate mocked submission through the controller.
Do not call the lost-ack-only fixture a live double-spend exploit.

**Exit:** separate journal storage from settings replacement, or use one acknowledged, revisioned
writer for all module data. An uncertain write must block conflicting full-snapshot writes until
authoritative readback resolves it. Cover rejected, lost and delayed acknowledgements plus restart.

The minimum host contract is an authoritative `{revision, value}` read plus compare-and-swap with a
durable operation ID and closed committed/conflict/outcome-unknown results. Conflicts may be retried
only after reread and pure transition recomputation. Unknown commits must be resolved by operation
identity/content readback or remain held. Every writer must participate, and revisions must survive
independent windows and restart. This makes the required implementation testable without mistaking a
shared Web Lock or fulfilled Promise for global durability.

### C-3 — High conditional policy mismatch: max inputs and Nexus dust are not public terms

**Code:** DEX `src/swap/providers.js:97-117`, `money.js:75-124`, `deployment.js:10-22`,
`runtime.js:48-68`; service `src/nexus_client.py:403-423,1861-1904`,
`src/solana_deposit_policy.py:100-112`, `src/swap_nexus.py:820-824,853-869`.

The actual v1 service record publishes minimums and fees, but neither directional `MAX_SWAP_*`
nor `DUST_CREDIT_NEXUS_UNITS`. DEX's funding revalidation therefore checks an incomplete policy.
Its static deployment entry has output dust floors, not input maxima or Nexus input dust.

Parent-rerun synthetic caller/policy probes establish:

- DEX quotes and passes funding validation for 1,000 tokens with a hypothetical matching acceptance
  entry, while a 100-token service maximum yields `refund_oversized` for Solana input and `over_cap`
  for Nexus input. The latter enters an operator refund hold, not the expected payout.
- With minimum 100 units, independently configured dust 200 units and input 150 units, DEX accepts
  positive output but the service classifier returns `dust`. Source inspection confirms the actual
  poller skips its state write for this disposition. This is configuration-dependent, not the default
  dust/minimum relationship; the classifier probe itself does not run a database/poller.

**Exit:** publish/enforce/freeze complete directional policy, or pin conservative reviewed bounds
in the deployment contract until a schema migration. Reject unknown policy before funding. Enforce
`dust <= minimum` as an additional configuration guard and retain positive custody obligations
rather than silently dropping them. Test both repos together below/exact/above dust, minimum and
maximum, including changed terms and unequal decimals. Fixed-field v1 assets need deliberate
migration/recreation; adding parser fields alone is not a deployment repair.

### C-4 — High functionality blocker: receipt requirement cannot currently satisfy production

**Code:** DEX `src/swap/runtime.js:53-55`, `signingPage.js:95-103`, `nexus.js:557-711`;
service `src/nexus_client.py:1902-1904`, `src/main.py:132-148`.

DEX requires `receipt_schema=nexus-swap-receipt-v1` to fund Solana→Nexus and to link its completion
proof to the full source signature. The service advertises this only with receipts enabled, but
production startup explicitly rejects receipt enablement. Both actual control paths were exercised
offline. Thus adding a DEX acceptance record and acknowledged storage is still insufficient to make
this direction production-eligible.

**Exit:** finish the service's NXS-spend budget, registration migration and target-node receipt
acceptance, or agree an equally source-bound alternative. Do not weaken completion to signature,
balance or sequential-reference-only evidence, and do not bypass service production admission.

### C-5 — Medium/high safety boundary: signer attempts are browser-local, not global

**Code:** `src/swap/controller.js:107-118`; `src/swap/signingPage.js:127-149,181-254`;
`src/App/stablecoinSwap.js:242-253`.

Two isolated browser storage/lock namespaces accepted the same synthetic handoff and invoked the
mock wallet twice. The module job remained `awaiting_signature`. Same-origin Web Locks and
localStorage correctly protect one namespace, but cannot coordinate another browser profile,
changed origin/port, cleared storage or device. Each attempt still required explicit wallet consent;
this is not an attacker bypass of wallet signing and was already warned about in the operating guide.

**Exit:** an acknowledged wallet-owned one-time handoff/attempt coordinator, with exact response or
persistent uncertainty. If cross-context replay cannot be prevented, keep this limitation explicit
and do not advertise global exactly-once behavior. A no-attempt recovery protocol is also required:
if browser launch fails after `prepareSolana()`, current UI only accepts a pasted signature, cannot
cancel the non-draft job, and has no safe reopen control.

### C-6 — Medium evidence/operability gaps

- The UI freezes six Nexus confirmations (`stablecoinSwap.js:148-150,225`); the service's static
  default is ten (`config.py:271-294`). This is a policy-negotiation gap, not proof of wrong payout:
  source receipt issuance already waits for the service policy. Pin actual directional finality in
  deployment acceptance rather than assume frontend and service defaults are interchangeable.
- No default-collected React interaction suite mounts the bridge. Current “mounted component” test
  parses source/AST. The scratch DOM attempt could not resolve host-injected ReactDOM; no dependencies
  were installed to manufacture host acceptance. Add rendered tests and real-wallet acceptance.
- **2026-10-07 projection increment:** Redux initialization now admits only reducer-owned
  `ui/settings/nexus` roots from both disk and session inputs. The full envelope and exact journal
  still reach persistence, and foreign storage keys survive the tested settings save. The 73-test
  candidate run emits no Redux unknown-root diagnostic. This closes only the hydration-projection
  subissue; it does not provide authoritative persistence or close the host acceptance gates.
- Service holds/refunds do not have an end-to-end DEX disposition-verification/recovery UI. In
  particular, oversized Nexus principal can require operator intervention. No local timeout should
  be labelled refunded without attributable evidence.

### C-7 — High activation blocker: committed storage does not bind wallet mutation context

**2026-10-06 narrow guard update:** `submitNexus` now rereads scope after
asynchronous funding validation and before changing or committing the draft.
Observed changes to profile/genesis, Nexus network or Solana genesis reject before
any storage write or wallet debit. An unavailable/rejected scope read also stops;
the unchanged draft remains inspectable and survives restart. Default-collected
`__tests__/controller.test.js` exercises the real coordinator, job store and
controller with delayed validation and mocked host boundaries. Three regressions
failed before the fix; all six focused cases pass after it, including scope-read
failures and a stable-scope intent-before-debit/restart/no-resubmit control. The
full candidate passes 54 Jest tests with coverage, 110 swap tests, both lint gates
and the production build.

This is the necessary module-side reread, **not host context binding or closure of
C-7**. The final check-to-commit/dispatch race, authoritative CAS/receipts and
host-owned one-shot invocation remain unimplemented. The test's explicitly injected
acknowledgement writer is not admitted by production `configureStore`; deployment
and storage gates stay closed. No real wallet transport or funds are used. The
following code references and validation-time probe describe the older snapshot.

**2026-10-06 post-intent containment update:** the remaining asynchronous intent
acknowledgement window is now checked too. After the intent commit returns,
`submitNexus` rereads wallet/network scope before invoking the debit adapter. A
profile, Nexus network or Solana genesis change, or unavailable/rejected scope read,
prevents the wallet call while retaining the committed `submission_unknown`.
Restart and restoration of the original scope do not permit automatic resubmission;
the guard deliberately does not infer safe cancellation or rewrite the intent.
Three default-collected regressions failed on the previous controller with one
mocked debit each; the new guard prevents all three. The 11 focused controller
cases also cover scope-read failures, delayed-ack stable-scope success, unchanged
foreign envelope fields and restart/no-resubmit. The full candidate passes 59 Jest
tests with coverage, 110 swap tests, both lint gates and the production build.

This is containment, not context-bound dispatch: another scope switch after the
reread is still possible. Authoritative host CAS/receipts, legacy-writer isolation
and one-shot invocation remain missing. Production admission and deployment gates
stay closed; all financial boundaries were mocked. C-1/C-2/C-7 remain unresolved.

**2026-10-07 mapping-intent containment update:** `repairMapping` now rereads
scope after its mapping-intent acknowledgement and before `publishMapping`.
Three default-collected regressions reproduced a mocked publication despite a
profile, Nexus network or Solana genesis change during that wait. The guard blocks
all three, plus unavailable/rejected scope reads, while preserving `mapping_unknown`,
`mappingStartedAt`, first debit/source identities and foreign envelope fields on
restart. Scope restoration does not authorize another mapping create. Exact
manually verified recovery and stable-scope intent-before-publication still work.
The 17 focused controller cases and full 65-test Jest coverage run pass, as do
110 swap tests, both lint gates, build and all 12 manifest files.

This is another narrow C-7 containment, not host-bound mapping dispatch. Async
adapter reads and the final scope-check-to-dispatch race remain unbound; authoritative
CAS/receipts, settings isolation and one-shot invocation remain upstream requirements.
Funding/deployment gates stay closed, no dependencies change and no real financial
transport is used. C-1/C-2/C-7 and supported-wallet acceptance remain open.

**Code:** `src/swap/controller.js:162-180`; `src/swap/nexus.js` secure mutation boundary;
`src/swap/runtime.js:48-68`.

`submitNexus` verifies scope, awaits asynchronous funding validation, commits `submission_unknown`,
calls `nexus.submitDebit`, and only then verifies scope again. The fresh production-controller probe
changes the active genesis from `profile-A` to `profile-B` inside validation. The mocked debit is
called once while `profile-B` is active; the post-call check then rejects, retaining
`submission_unknown` without the returned txid. Funding is currently disabled and no real wallet
profile behavior or transfer was exercised.

A DEX scope reread immediately after validation is necessary but cannot close the final
check-to-dispatch race. The host must bind the committed intent operation, exact endpoint/parameters,
PIN prompt, dispatch context, and one durable invocation claim. A duplicate/restarted caller or a
fresh competing invocation ID for the same intent must observe the existing returned/unknown result
without another dispatch.

**Exit:** implement `docs/HOST_STORAGE_CONTRACT.md` in the wallet/SDK and consume it in DEX. Collect
profile changes during validation, between commit and dispatch, and during dispatch using two real
controllers plus a revisioned fake host. Require zero wrong-context calls, at most one mocked remote
attempt, immutable first identity, and restart-stable returned/unknown invocation receipts.

### Design context — accountability evidence is additive, not authorization

Namespace attestations, bonds, challenge history and risk signals may be displayed as inspectable
provider evidence, but must not become opaque endorsement badges, settlement proof, or a
Distordia-controlled execution gate. Preserve exact issuer/namespace, source, revision and expiry
and label observed, inferred and attested claims separately. This future read-only work does not
lower C-1 through C-8, establish provider solvency, or justify a deployment acceptance record.

### C-8 — Service-side safety gates also block client activation

The October 2 swapService review accepts four repairs now published through
`7b2d1c4e3c9d3b2f006a083f9372cfadf80830fc`. Restored sources with terminal conflicts, retained
capacity intent, retained debit metadata, or retained ordinary disposition rows are held with full
principal/evidence, zero mocked transport and atomic rollback. Younger valid work progresses in the
applicable scenarios. These repairs supersede earlier present-tense claims that those four restored
source families remained replayable.

**Historical October 2 comparison only:** the then-separately staged sealed-custody candidate passed
947 tests plus focused recovery/custody gates. The artifact omissions below describe that snapshot,
not the current upstream source:

- executable attestation covers `src/*.py` and `requirements.txt` but omits the root
  `swapService.py` entrypoint, interpreter and installed package artifacts, so pre-admission code can
  change without changing the fingerprint;
- heartbeat validation checks only three expected fields and accepted a fixture with different
  address, owner, provider, token register and vault, so it is not an exact asset identity contract;
- chain admission reads genesis identities but does not establish Solana health/root freshness or
  Nexus sync, mode, network and tip freshness before mutable startup;
- supported witness bootstrap/restore evidence, malformed-capacity starvation repair,
  evidence-bound hold resolution, provider-v2, receipts and live fault acceptance remain open.

The September 22 policy/receipt probes and October 2 comparison remain dated historical evidence.
The separate current portfolio/upstream review identifies published swapService
`2c4ed319d251836f01dfb83de68da71b1c6c6a23`, with 1,522 tests plus 77 subtests and finite
in-process fingerprints covering the root, interpreter, native and selected installed wrappers.
External pre-execution artifact authority, coherent restore, exact service/node freshness, capacity
progress, witness/hold operations and target acceptance remain open. See the current
[upstream dependency contract](SWAP_SERVICE_DEVELOPMENT_PLAN.md#upstream-release-dependencies).
This is qualified portfolio/upstream evidence, not DEX independent inspection or acceptance of
swapService. A corrected DEX cannot substitute for those backend exits; no real-funds activation is
authorized here.

## Dependency security — assessed, not remediated

The September 22 `npm audit --json` evidence returned **36 findings: 4 low, 14 moderate, 16 high, 2 critical**.
The two critical package paths (`shell-quote`, `websocket-driver`) resolve through
`webpack-dev-server`, not a demonstrated deployed bridge exploit. `bigint-buffer` is in the SPL-token
dependency path; its package has a browser implementation distinct from its native Node path.
Audit severity does not by itself establish reachability in the browser bundle.

No exploit or arbitrary code execution was demonstrated. Dependency updates remain explicitly
deferred for Nexus Interface compatibility; no install, forced audit fix or version changes ran.
Keep development servers away from untrusted networks, and perform compatibility-tested dependency
and bundled-code reachability review before release.

## Executed verification and artifacts

| Check | Exact-head result |
|---|---|
| Source identity/range | Remote `master` and detached source = `7a28fcdd97710901e4317fb62d4ffc268b8743ca`; base resolves to `052b9ab56e37ba1f4162f7be2df759ee0f9380f3`; five commits; 10 changed paths. The pre-edit tree was clean and detached. |
| Jest collection/full run | `--listTests` collected **7 suites**. `npm test -- --ci --coverage --runInBand` passed **7/7 suites, 65/65 tests**. It emitted three Redux `swapJournal` errors, one expected no-session warning and stale Browserslist data. |
| Focused fault/scope tests | `configureStore` + persistence + controller: **3/3 suites, 27/27 tests**. Real DEX coordinators/stores/controllers; host storage, wallet and chain boundaries mocked. |
| Node swap collection/full run | `npm run test:swap` passed **110/110 reported tests**. Focused `test/swap/persistence.test.cjs` + `controller.test.cjs` passed **24/24**. |
| Lint | `npm run lint:swap` passed with zero warnings. `npm run lint` passed with **0 errors / 21 warnings**. |
| Build | `npm run build` succeeded: app 1.23 MiB and signer 567 KiB, with **3** Webpack performance warnings. |
| Dependencies | Node 22.23.2/npm 10.9.8; copied existing dependency tree, including `nexus-module` 1.1.11 and Webpack 5.99.9. `npm ls --depth=0` passed. No install, upgrade or audit fix. CI remains Node 20. |
| Manifest gate | The CI-shaped inline command was blocked by the execution security wrapper before execution. All 12 declared files were visible in the pre-run repository inventory, but the maintained command is **not claimed passed**. |
| Runtime controls | Actual caller inspection confirms production `configureStore` passes no journal writer; `StablecoinSwap` calls `submitNexus` and `repairMapping`; runtime validation performs asynchronous provider/account/vault reads; mapping publication performs asynchronous source/preflight reads before `secureApiCall`. |
| External boundaries | No NexusInterface/swapService repository inspection, target-wallet run, remote CI refresh, live node/RPC/service/signer/chain call, funds movement, deployment, or release approval. |

The September 22 observations remain historical evidence in this evaluation. Their local-only raw
reports, manifests and diagnostic scripts are excluded from this publication candidate; they are
not new collected regression tests. Reviewer severity labels are scoped/corrected by this
consolidated evaluation rather than silently rewriting the historical findings.

## Prioritized next coding and acceptance matrix

The detailed objective/evidence/vision/path/authority matrices are in the maintained development
plan. The current order is:

| Priority | Owner and production boundary | Executable exit |
|---|---|---|
| H1 | **NexusInterface/SDK:** host revision/CAS, durable storage-operation receipts, settings/journal isolation, context-bound PIN/dispatch and one durable invocation claim per committed intent. | Independent WebViews/processes race same/different jobs and settings; inject commit-lost acknowledgement, disk/capacity fault, context switch during dispatch, repeated/fresh invocation IDs and process death. One revision order, no lost update, no wrong-context dispatch, at most one remote attempt, and exact third-context restart readback. Installed-wallet evidence is mandatory. |
| D1 | **DEX:** `configureStore`, persistence, jobs, runtime and reducer projection consume H1. | Revisioned-host default tests cover conflict recomputation, operation readback, stale legacy writer, unknown commit, malformed receipts, immutable first identity and restart holds. Redux receives only `ui/settings/nexus`; host envelope remains intact. Full offline gate passes without weakening current containment. |
| D2+H2 | **DEX callers + host handoff:** migrate debit and mapping create from plain `secureApiCall` to the committed-intent one-shot operation. | Scope switches after validation/intent, during mapping preflight/PIN/dispatch, duplicate controllers and crash-after-acceptance yield no wrong-context call, at most one attempt and restart-stable returned/unknown receipts. No automatic resend. |
| U1 | **DEX UI/signing; host for global attempt authority:** rendered component and external signer recovery. | DOM-driven discovery/blocking/recovery/double-activation/timer tests plus isolated namespace, launch-before-attempt, cleared-state and explicit-consent cases. Source/AST evidence and browser-local locks are insufficient. |
| S1+R1 | **swapService/operator for terms/custody; DEX for parsing/evidence/deployment; named humans for release.** | Shared below/exact/above max/dust/min/finality fixtures, receipt/disposition and restart faults, exact supported-wallet/node/service/provider revisions, isolated non-production two-direction readback, then explicit human approval of one deployment entry. |

Every batch advances O1/O4 for an explicitly unvalidated non-Atlas wallet hypothesis, preserves the
vision outcome of user-wallet authorization and inspectable settlement without module key custody,
and keeps provider custody explicit. Mocks establish DEX logic but cannot close H1, supported-wallet,
service or target-network acceptance. No batch delegates key use, custody, deployment acceptance or
release authority to the module or an automation agent.

This review changes documentation/evidence only. Nothing was staged, committed, pushed, deployed or
sent on-chain. See the updated [development plan](SWAP_SERVICE_DEVELOPMENT_PLAN.md).
