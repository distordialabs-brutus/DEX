# DEX ↔ swapService bridge functionality and security evaluation

**DEX revalidated 2026-10-02.** DEX `master`, `origin/master`, requested baseline, and current source
are `94d82a7adf258dbb08fe3a62668373a1d8339d67`; `94d82a7..HEAD` is empty. The baseline is
documentation-only relative to runtime `416855d14ab605450bdf4ead92b66ded5e931330`, and the complete
36-file runtime-source manifest verifies byte-for-byte. There is no accepted coding progress after
the requested baseline. The current swapService comparison is the October 2 review of published
`origin/main` `7b2d1c4e3c9d3b2f006a083f9372cfadf80830fc` and the separately staged sealed-custody candidate
reviewed at local service head `ee10b6e20dfe85f15347386adecb9dc99db55bb5`. Older September 22
cross-protocol evidence is retained below as historical evidence, not presented as the fresh service
comparison.

## Verdict

**The current client is an implemented, release-gated custodial bridge—not the old hardcoded
prototype—but it is not safe or functionally complete enough to enable funding.** Its navigation,
provider discovery, exact quotes, adapters, job controller and signing companion exist. The shipped
`ACCEPTED_DEPLOYMENTS=[]` blocks all funding. The required acknowledged wallet-storage extension
is also not supplied by this repository/installed module SDK. Keep both gates closed.

The highest-risk DEX defects remain **stale per-window journal state and an unbound wallet mutation
context**. Under a hypothetical accepted deployment, two serialized controllers can submit the same
job twice, and a profile change during asynchronous validation can reach the mocked wallet call
before the controller's post-call scope check. The October 2 rerun reproduced two mocked debit calls
and replacement of the first remote identity, uncertain journal erasure through a later settings
write, last-writer loss across two independent jobs, and one mocked debit under the changed profile.
Other retained gaps concern signer-context replay, unadvertised max/dust policy, and production
receipt eligibility. These are not demonstrations of theft or live transfers in the current build.

Accepted progress is design/evidence only. The maintained host contract now specifies authoritative
revision/CAS storage, durable operation receipts, uncertain-acknowledgement reconciliation, settings
isolation, immutable first remote identity, and a separate context-bound one-shot invocation with a
two-context fault matrix. The current DEX, installed `nexus-module` 1.1.11, and reviewed Nexus
Interface boundary do not implement that contract. Funding remains correctly contained by
`ACCEPTED_DEPLOYMENTS=[]` and the missing acknowledged-storage capability.

The [September 7 evaluation](SWAP_SERVICE_EVALUATION_2026-09-07_HISTORICAL.md) is archived unchanged.
Its disabled-tab, absent-mapping, floating-point quote and heuristic-completion findings describe the
old prototype, not current runtime. Dated development reviews remain historical evidence; this
maintained evaluation is the current bridge-specific issue register and repair priority.

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
- Redux still warns about temporarily hydrating `swapJournal` into roots owned only by
  `ui/settings/nexus`. The coordinator retains the journal in this fixture; the warning alone is not
  data-loss proof. Correct the hydration projection after the higher-risk persistence protocol.
- Service holds/refunds do not have an end-to-end DEX disposition-verification/recovery UI. In
  particular, oversized Nexus principal can require operator intervention. No local timeout should
  be labelled refunded without attributable evidence.

### C-7 — High activation blocker: committed storage does not bind wallet mutation context

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

The separately staged sealed-custody candidate passed 947 tests plus focused recovery/custody gates,
but remains unaccepted for release:

- executable attestation covers `src/*.py` and `requirements.txt` but omits the root
  `swapService.py` entrypoint, interpreter and installed package artifacts, so pre-admission code can
  change without changing the fingerprint;
- heartbeat validation checks only three expected fields and accepted a fixture with different
  address, owner, provider, token register and vault, so it is not an exact asset identity contract;
- chain admission reads genesis identities but does not establish Solana health/root freshness or
  Nexus sync, mode, network and tip freshness before mutable startup;
- supported witness bootstrap/restore evidence, malformed-capacity starvation repair,
  evidence-bound hold resolution, provider-v2, receipts and live fault acceptance remain open.

The September 22 policy/receipt probes remain useful historical cross-protocol evidence and were not
silently discarded, but the October 2 review is the current service comparison. A corrected DEX
cannot substitute for these backend admission and operability exits. No real-funds activation is
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

| Check | Result |
|---|---|
| Configured tests (2026-10-02) | `npm test -- --ci --coverage --runInBand`: 5 Jest suites / **41 tests** passed; `npm run test:swap`: **110/110** reported Node tests passed. Jest still emitted three `swapJournal` Redux diagnostics and one expected no-session warning |
| Focused state-machine/store checks (2026-10-02) | **31/31** persistence/jobs/controller/integration tests and **3/3** configure-store tests passed. The configure-store shard emitted all three diagnostics; the two integration checks inspect source/AST and do not mount React |
| `npm run lint:swap` / `npm run lint` (2026-10-02) | Strict swap lint passed with zero warnings; repository gate passed with 0 errors / **21 warnings** |
| `npm run build` (2026-10-02) | Webpack 5.99.9 emitted 1,287,841-byte app and 580,804-byte signer bundles with 3 performance warnings |
| Manifest/runtime hashes (2026-10-02) | All **12** manifest entries exist; all **36/36** runtime-source hashes pass |
| Journal/controller probes (2026-10-02 rerun) | Serialized stale controllers made **2** mocked debit calls for one job; lost acknowledgement plus settings write erased `submission_unknown`; a stale second coordinator replaced `job-A` with `job-B`; profile changed during validation and the mocked wallet was called once under the changed scope |
| Signer/policy probes (2026-10-02 rerun) | Two isolated browser namespaces made **2** mocked signer submissions; synthetic accepted deployments still admit unadvertised max and Nexus dust-gap inputs; no wallet, RPC, persistence, service or funds were used |
| Exact-head CI | Not refreshed. The prior exact-head run is historical and does not replace the fresh local evidence |
| Current swapService review (2026-10-02) | Four published restore fixes accepted through `7b2d1c4`; staged sealed-custody candidate passed **947 tests** but remains blocked on complete executable attestation, exact heartbeat identity, chain freshness/readiness and operability/live acceptance |
| Ordinary-range service→DEX fixture (2026-09-22) | Real service v1 builder/memo/quote functions agree with client in both directions |
| Source identity | DEX `HEAD` = `origin/master` = requested baseline `94d82a7adf258dbb08fe3a62668373a1d8339d67`; no later commit or runtime path delta; real index tree remained `3348d861ba30f7d04d0e00e161420ffa5502102b` and nothing was staged |
| Rendered host / live chains | **Not established**; no credentials, live wallet, RPC, service or chain operations used |

The September 22 observations remain historical evidence in this evaluation. Their local-only raw
reports, manifests and diagnostic scripts are excluded from this publication candidate; they are
not new collected regression tests. Reviewer severity labels are scoped/corrected by this
consolidated evaluation rather than silently rewriting the historical findings.

## Repair order

1. **Collect failures:** move the retained two-window, lost-ack/settings and profile-switch probes
   into default-collected tests around two real controllers/coordinators and a revisioned fake host.
   Include independent jobs, acknowledgement loss/delay/rejection, crash boundaries, settings races,
   operation-ID replay/content conflict and competing invocation IDs.
2. **Implement C-1/C-2/C-7 together:** authoritative read/CAS/operation readback, pure conflict
   recomputation, settings isolation, context-bound one-shot mutation, immutable first identity and
   local-only identity-write retry. Exit requires one mocked remote call, both windows' jobs retained,
   and identical third-context restart state. A promise-shaped host method does not pass.
3. **Repair Redux projection:** persistence receives the untouched envelope; Redux receives only
   `ui/settings/nexus`. Make unexpected `console.error` fail the focused tests and prove no legacy
   settings writer can replace a newer or uncertain journal revision.
4. **Add rendered evidence:** pin only Nexus-compatible test renderer dependencies in a separately
   reviewed lockfile change; mount `StablecoinSwap({runtimeOverride})` and drive discovery, blocked
   funding, double activation, stale generations, scope changes, recovery actions and timer cleanup.
5. **Repair C-5 signing handoff:** use wallet-owned durable attempt authority; prove browser-launch
   no-attempt recovery and isolated-context behavior without automatic resubmission.
6. **Run target-wallet acceptance:** repeat the complete storage/invocation matrix in each supported
   Nexus Interface version with financial transport mocked and exact wallet/SDK/client revisions.
7. **Close C-3/C-4/C-6/C-8 across repositories:** publish/freeze complete service policy, retain dust,
   resolve receipt production admission and backend recovery/hold exits, then exercise both
   directions on explicitly authorized non-production networks.
8. **Control enablement:** require exact candidate identities, restart/crash/unknown outcomes, exact
   payout/disposition readback and compatible dependencies before adding an accepted deployment.
   Retain all existing exact-evidence and no-blind-resubmit controls.

This review changes documentation/evidence only. Nothing was staged, committed, pushed, deployed
or sent on-chain. See the updated [development plan](SWAP_SERVICE_DEVELOPMENT_PLAN.md).
