# DEX ↔ swapService bridge functionality and security evaluation

**DEX revalidated 2026-09-23.** DEX `416855d14ab605450bdf4ead92b66ded5e931330`
remains identical to the prior reviewed runtime and aligned with `origin/master`; there are no
intervening runtime/test/build/manifest/lockfile/CI changes. The swapService comparison remains the
September 22 snapshot at `85030c890fa6f3bb7db97e068e5cf80827d21b28`; it was not represented as a
fresh service review. See the full [September 23 DEX review](DEVELOPMENT_REVIEW_2026-09-23.md).

## Verdict

**The current client is an implemented, release-gated custodial bridge—not the old hardcoded
prototype—but it is not safe or functionally complete enough to enable funding.** Its navigation,
provider discovery, exact quotes, adapters, job controller and signing companion exist. The shipped
`ACCEPTED_DEPLOYMENTS=[]` blocks all funding. The required acknowledged wallet-storage extension
is also not supplied by this repository/installed module SDK. Keep both gates closed.

The highest-risk DEX defect remains **stale per-window journal state**: under a hypothetical
accepted deployment, two serialized controllers can submit the same job twice. The September 23
rerun reproduced two mocked debit calls and replacement of the first remote identity. It also
reproduced uncertain journal erasure through a later settings write. Other retained gaps concern
signer-context replay, unadvertised max/dust policy, and production receipt eligibility. These are
not demonstrations of theft or live transfers in the current build.

The [September 7 evaluation](SWAP_SERVICE_EVALUATION_2026-09-07_HISTORICAL.md) is archived unchanged.
Its disabled-tab, absent-mapping, floating-point quote and heuristic-completion findings describe the
old prototype, not current runtime. The [September 21 general review](DEVELOPMENT_REVIEW_2026-09-21.md)
remains historical regression evidence; this review supersedes its bridge-specific repair priority.

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

### C-7 — Service-side safety gates also block client activation

The [published September 23 sibling evaluation](https://github.com/distordialabs-brutus/swapService/blob/184f5d6a45ecd8f53ae37cfdd09e4b63092d1842/docs/EVALUATION.md), reviewing unchanged service runtime `85030c8`, documents:

- total DB/WAL loss can discard unsent frozen policy/cap intent and reinterpret a recovered deposit;
- failed registration validation is alert-only, and authoritative network/sync admission is incomplete;
- several Solana policy/evidence/conflict/unknown-submission holds lack audited resolution;
- provider-v2 is unwired and receipt enablement remains separately blocked.

The previous statements that the minimum classifier and typed cap holds are simply missing are
obsolete: they are implemented and tested with surviving database evidence. A corrected DEX cannot
substitute for backend recovery/admission repair. No real-funds activation is authorized here.

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
| `npm run test:all` (2026-09-23) | 5 Jest suites / **41 tests**, plus **110 Node swap tests** passed; Jest still emitted three `swapJournal` Redux diagnostics and one expected no-session warning |
| `npm run lint:swap` / `npm run lint` (2026-09-23) | Strict swap lint passed with zero warnings; repository gate passed with 0 errors / **21 warnings** |
| `npm run build` (2026-09-23) | Webpack 5.99.9 emitted 1.23 MiB app and 567 KiB signer bundles with 3 performance warnings |
| Manifest files (2026-09-23) | All **12** entries exist |
| Journal/controller probes (2026-09-23 rerun) | Serialized stale controllers made **2** mocked debit calls for one job; lost acknowledgement plus settings write erased `submission_unknown`; a stale second coordinator replaced `job-A` with `job-B` |
| Rendered-test dependency check (2026-09-23) | `react` resolves; `react-dom`, `react-dom/client`, Testing Library and `react-test-renderer` do not. Existing integration test parses source/AST and does not mount React |
| Ordinary-range service→DEX fixture (2026-09-22) | Real service v1 builder/memo/quote functions agree with client in both directions |
| Other September 22 mismatch/lifecycle probes | Reproduced isolated signer attempts, max/dust mismatch and receipt admission conflict; not rerun as a new service assessment on September 23 |
| Source identity | DEX `HEAD` = `origin/master` = `416855d`; runtime/test hashes are recorded in `docs/review_evidence/2026-09-23/runtime-sources.sha256`; the real Git index remained unchanged |
| Rendered host / live chains | **Not established**; no credentials, live wallet, RPC, service or chain operations used |

Two independent September 22 reviews, source manifests and diagnostic probes are retained locally
at `docs/review_evidence/2026-09-22/`; those local-only artifacts are excluded from this publication
candidate. They are offline diagnostics, not new collected regression tests. Reviewer severity
labels are scoped/corrected by this consolidated evaluation; the original reports are preserved
rather than silently edited. The September 23 DEX
continuity review is [separate dated evidence](DEVELOPMENT_REVIEW_2026-09-23.md), with reviewed
runtime/test hashes in
[`docs/review_evidence/2026-09-23/runtime-sources.sha256`](docs/review_evidence/2026-09-23/runtime-sources.sha256).

## Repair order

1. Keep funding disabled; repair C-1/C-2 together with a real authoritative storage protocol and
   default-collected controller/coordinator regressions. Require one remote call and preservation of
   both windows’ jobs/identities through uncertain acknowledgements and restart. Do not just
   implement a promise-shaped host method.
2. Split Redux hydration from journal ownership and require zero unknown-key diagnostics, then add
   a collected rendered-component suite that exercises the real `StablecoinSwap` interaction paths.
3. Resolve C-5 durable signing handoff and safe recovery alongside actual supported-wallet tests.
4. Repair service dust retention/configuration, publish complete max/dust/finality policy and enforce
   it in client quotes, funding rereads, deployment acceptance and signing (C-3/C-6).
5. Close the production receipt contradiction and backend recovery/admission/hold-resolution gates
   (C-4/C-7), then run both directions on explicitly authorized test networks.
6. Require exact candidate identities, renderer/wallet installation evidence, restart/crash/unknown
   outcomes, exact payout and disposition readbacks, and compatible dependencies before adding an
   accepted deployment. Retain all existing exact-evidence and no-blind-resubmit controls.

This review changes documentation/evidence only. Nothing was staged, committed, pushed, deployed
or sent on-chain. See the updated [development plan](SWAP_SERVICE_DEVELOPMENT_PLAN.md).
