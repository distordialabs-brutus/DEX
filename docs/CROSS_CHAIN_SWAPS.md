# Cross-chain swaps: implementation and operating boundary

The **Cross-chain swaps** tab replaces the old single-provider prototype. It is separate from the native Nexus order book. These are **operator-custodied transfers, not atomic or trustless swaps**.

## Current release status

**Implemented client and opt-in service receipt protocol; funding is not release-enabled.** Discovery, provider inspection, and exact quotes work without an accepted funding deployment. Current Nexus Interface has additional authoritative-storage and context-bound-mutation capability blockers described below. No live transfers, production activation, wallet installation, commits, or pushes are part of this change.

`src/swap/deployment.js` deliberately has an empty `ACCEPTED_DEPLOYMENTS` array. Do not populate it merely because offline tests pass. The [2026-10-02 DEX review](../DEVELOPMENT_REVIEW_2026-10-02.md) confirms that the requested `94d82a7` baseline is still current and freshly reproduces the client persistence, Redux hydration, signer-isolation and rendered-test gaps. It also proves at the mocked production-controller boundary that an active-profile change during asynchronous funding validation reaches `submitDebit` before the existing post-call scope check holds the job as unknown. The [authoritative host storage and mutation-handoff contract](HOST_STORAGE_CONTRACT.md) is the normative repair boundary. The [cross-repository evaluation](../SWAP_SERVICE_EVALUATION.md) incorporates the October 2 swapService review: four published restore repairs are accepted, while the staged sealed-custody candidate remains blocked on complete executable attestation, exact heartbeat identity and node freshness/readiness. Older September 22 service-policy/receipt evidence remains historical.

## Why a custom Solana wallet is unnecessary

An ordinary wallet **Send** form and a wallet's **dApp signing API** are different interfaces. A missing memo field in the former does not prevent the latter from signing a transaction containing an SPL Token transfer and a memo instruction.

| Alternative | Decision |
|---|---|
| Injected Phantom / Solflare dApp signing | Implemented. DEX constructs `TransferChecked` and the exact memo together; the external wallet retains keys and prompts for approval. |
| Bundled external-browser signer | Implemented fallback for Nexus Electron WebViews, which may not expose browser extensions. DEX opens its bundled `dist/solana-sign.html` in the user's browser. No remote signing website is selected by the provider. |
| Solana Pay transfer URI | Researched, pure URI helper tested, **not enabled as a funding shortcut**. It requires the vault to equal the owner's associated token account, correct mint, memo support and mainnet policy. A normal URI does not safely select devnet/testnet. |
| Wallet-specific mobile deep links / remote wallet connectors | Possible future integrations; would require separate connection/session/security and wallet acceptance work. Not silently substituted. |
| Private-key import or embedded custodial Solana wallet | Not added. It would create unnecessary key storage, backup, signing and custody liabilities. |

References: [Phantom transaction signing](https://docs.phantom.com/solana/sending-a-transaction), [Solana Pay specification](https://docs.solanapay.com/spec), [Solana SPL memo](https://www.solana-program.com/docs/memo).

### Current activation blockers

- Private per-window journal snapshots can defeat a shared Web Lock and submit the same Nexus
  job twice under an accepted deployment; a lost acknowledgement followed by settings save can
  erase a committed journal update. September 23 reruns reproduced both paths with real
  controllers/coordinators and mocked boundaries. Implement authoritative revisioned persistence,
  not just a promise wrapper.
- Versioned storage alone does not bind a later wallet mutation to the committed profile. The
  current `secureApiCall(endpoint, params)` bridge carries no storage context, intent operation or
  one-shot invocation identity. A mocked controller probe switches profile during funding
  validation, observes one debit call under the changed scope, then reaches the post-call scope
  rejection. Add an immediate DEX scope reread and a host-bound one-shot mutation; the former alone
  cannot close a switch racing dispatch.
- Redux hydration currently admits `swapJournal` as an unknown root, emits three diagnostics in the
  collected configure-store suite and then discards that Redux key. Keep journal ownership in the
  persistence coordinator and hydrate Redux from reducer-owned roots only.
- No collected test mounts `StablecoinSwap`; the test titled “mounted component branch” parses
  source/AST. Add a Nexus-compatible rendered harness before treating UI wiring as accepted.
- Current v1 omits maximum inputs and Nexus input dust. Accepted client quotes can lead to a
  service refund/hold, or a skipped dust-state write under an allowed nondefault configuration.
- DEX requires receipts for Solana→Nexus, while service production admission rejects receipts
  enabled. This direction has no currently production-eligible end-to-end configuration.
- Existing browser-local attempt protection is not wallet-global. Failed browser launch can also
  leave an `awaiting_signature` job without a safe reopen/cancel route.

These are scoped activation defects/limits, not a claim that the shipped disabled-funding UI
already sends twice. See the evaluation for real-caller probes, prerequisites and repair exits.

### Signing companion

The URL fragment contains only allowlisted public job data: exact units, provider/token/vault identity, recipient, network, reference and expiry. It contains no PIN, session, seed phrase, private key or provider-supplied RPC URL. Public data still includes transaction/account privacy information; do not share the link unnecessarily.

The signer uses reviewed static RPC/network policy, checks mint/vault/source account ownership, balances, freeze state and decimals, and constructs a fresh transaction. It does not deserialize and sign an arbitrary supplied transaction. It rejects changed fragments and expired jobs. A per-job Web Lock and a verified local attempt record precede wallet submission. A timeout remains uncertain; there is no automatic retry. A stored signature is recovered on reload and can be copied back to DEX for finalized transfer verification.

This attempt protection is browser-origin-local, **not a global exactly-once guarantee across devices or cleared browser storage**. Never reopen an uncertain funding intent in another browser to try sending again.

## User flow on an accepted, compatible deployment

1. Select the Solana network and discover providers or enter an exact Nexus provider register address.
2. DEX re-reads the selected record and resolves actual token/custody accounts and decimals. It does not silently fall back to USDC, USDD or a fixed operator.
3. Choose direction, exact input text and owned Nexus token account. For Nexus-to-Solana, enter an existing SPL token account for the selected mint, not a wallet-owner address.
4. Review exact input, fee and output units, operator identity and custodial risk. Save the immutable job before funding.
5. Solana-to-Nexus: open the browser signer, approve in Phantom/Solflare, then return the signature. DEX verifies finalized transfer/memo evidence before waiting for output.
6. Nexus-to-Solana: approve the exact debit through the Nexus wallet's PIN dialog. DEX distinguishes the user's DEBIT from the provider's confirmed CREDIT. Routing publication binds the provider CREDIT transaction and the reviewed Solana destination.
7. Check payout evidence. Solana output requires the exact provider vault/mint, recipient, units and composite memo `nexus_txid:<provider-credit-txid>:<contract-id>`.
8. Nexus output is discovered through the source-signature receipt. DEX checks the provider-owned receipt, exact Nexus payout DEBIT and a sufficiently confirmed recipient CREDIT. A pending claim is not spendable completion: use the Nexus wallet's Receive/notification workflow and check again.

Every recovery operation is evidence-based. A bounded empty scan, a balance increase, a memo substring or a successful-looking status string is not settlement. Exported public evidence aids manual investigation; it is not authority to resend or mark a job complete.

## Required Nexus Interface storage capability

Source inspection of the installed `nexus-module` 1.1.11 boundary exposes only
`updateStorage(data)`, and the reviewed Nexus Interface behavior calls its module storage writer
without returning a durable versioned result. The current DEX symbol
`updateStorageAcknowledged(data)` is explicitly a placeholder gate; wrapping `updateStorage` in a
Promise would manufacture acknowledgement and remains unsafe.

The normative replacement is [the authoritative host storage and mutation-handoff
contract](HOST_STORAGE_CONTRACT.md), not an acknowledgement-only patch. The host must provide:

- authoritative `{contextId, revision, value}` reads shared by independent windows;
- atomic compare-and-swap of the complete intended value with an explicit operation ID;
- durable `committed`, `conflict`, or `outcome_unknown` results plus operation-result readback;
- idempotent same-operation/same-content replay and rejection of operation-ID content conflicts;
- crash-durable operation receipts, exact persisted-content hashes, context-switch rejection and
  pre-commit capacity/serialization failure;
- either CAS for every settings/journal writer or a separate journal namespace that legacy settings
  replacement cannot address;
- a context-bound mutating API that verifies the committed intent operation, durably permits one
  invocation claim per intent before dispatch, binds the PIN/API call to the same wallet
  profile/session, and returns only proven pre-dispatch rejection, a response, or `outcome_unknown`.

DEX must recompute pure transitions after conflicts, reconcile unknown commits before action,
reread scope after asynchronous validation, and invoke the wallet only through the context-bound
handoff after the exact `submission_unknown` intent commit is proven. After a wallet response, an
unrelated settings conflict may retry only the local identity write while the same uncertain job
remains unchanged; it may never repeat the wallet call. Unknown readback, invocation uncertainty,
changed job or competing identity remains an operator-visible hold.

A resolved false, missing method, missing Web Locks, storage failure, corrupt journal, ambiguous
operation receipt or context mismatch blocks financial mutation. Existing settings may retain their
legacy writer only if the host makes it impossible for that writer to replace the journal namespace.
Until this contract and its two-window/crash/restart matrix pass in the target wallet, current
wallets remain inspection-only for new swap jobs, even if an operator acceptance record were
configured. Existing public job data can still be inspected. See [Nexus Interface WebView handler
source](https://github.com/Nexusoft/NexusInterface/blob/master/src/shared/lib/modules/webview.js).

## Service receipt extension

The sibling `swapService` now has opt-in `NEXUS_SWAP_RECEIPTS_ENABLED` (default false). New recommended-v1 registrations can advertise the immutable optional field:

```text
receipt_schema=nexus-swap-receipt-v1
```

An existing registration without this creation-time field must be replaced deliberately; a heartbeat update does not invent immutable fields. No existing registration was updated during this work.

After exact confirmed Nexus payout evidence, the service atomically records an outbox obligation with terminal payout bookkeeping. Receipt publication does not authorize, retry, refund or modify money movement. Each asset create is durably claimed first and is never blindly repeated after timeout. Publication requires exact owner/field/address read-back.

The receipt is an `assets/create/asset` JSON schema with all data fields immutable (`mutable: false`). Built-in Nexus `owner` is never supplied as a custom field. It binds:

- `distordiaType=nexusSwapReceipt`, `schema=nexus-swap-receipt-v1`;
- full `source_signature`, `solana_mint`, `solana_vault`;
- `nexus_token`, `nexus_account`;
- `output_txid`, canonical `output_contract_id`, integer `output_units`, and the service's actual `reference`.

The sequential reference alone cannot identify the originating Solana transfer; the full-signature receipt provides that link. See the sibling service's `ASSET_STANDARD.md` and `src/swap_receipts.py`.

## Architecture

| Module | Responsibility |
|---|---|
| `providers.js` | Bounded discovery, recommended-v1 validation, address read-back, liveness and immutable term comparison. Unsupported/explicit future schemas fail closed. |
| `money.js` | BigInt unit parsing, decimal conversion, fee/minimum calculation and deterministic rounding. No floating-point funding arithmetic. |
| `nexus.js` | Real Nexus API payloads and exact source, routing, receipt, DEBIT/CREDIT proof. |
| `solana.js` | Installed SDK transaction construction, classic SPL account validation and finalized transfer/memo proof. |
| `jobs.js`, `controller.js` | Scoped immutable journal, serialized intent-first state transitions and no-resubmit recovery. |
| `persistence.js`, `configureStore.js` | Current per-instance coordinator: acknowledged financial writes and legacy settings saves. It does not satisfy `docs/HOST_STORAGE_CONTRACT.md`; revision/CAS, operation readback, uncertain-write preservation and context-bound one-shot mutation remain absent. |
| `runtime.js` | Adapter composition, fresh scope/provider/pair/quote validation and public signing handoff. |
| `deployment.js` | Static network/genesis allowlist and per-deployment acceptance/dust gates. Never loaded from provider-controlled data. |
| `signingPage.js`, `dist/solana-sign.html` | Non-custodial external-browser signing surface. |
| `stablecoinSwap.js` | Provider selection, review, wallet handoff, job history and recovery controls. |

Normal progress:

```text
Solana → Nexus: draft → awaiting_signature → awaiting_payout → completed
Nexus → Solana: draft → submission_unknown → debit_submitted
                    → awaiting_service_credit → mapping_unknown → awaiting_payout → completed
```

Unknown states are durable holds, not failures/refunds. Only drafts can be cancelled. Default Nexus finality is six confirmations and is frozen before funding; a stronger job policy is not lowered on resume.

## Verification and release checklist

Local commands (Node with built-in test runner/Web Crypto; development verified on the installed Node toolchain):

```bash
npm ci
npm run test:all             # Required combined gate: native DEX and swap suites
npm test -- --ci --runInBand  # Native DEX Jest regressions (individual suite)
npm run test:swap            # Node test runner: swap safety and integration regressions
npm run lint                # Whole application; inherited warnings are non-blocking
npm run lint:swap           # Swap code: zero warnings allowed
npm run build               # Main module and external-browser signer bundles
```

Both suites are required. GitHub CI runs them on Node 20, runs both lint gates, builds both bundles, checks every `nxs_package.json` file, and uploads the assembled module files. `npm test` retains master's Jest entrypoint; `npm run test:swap` retains the feature branch's independent swap suite. Full-repository lint debt is reported separately; dependency upgrades remain deferred for Nexus Interface compatibility.

Before enabling any exact deployment:

- [ ] Implement and validate authoritative revisioned/CAS storage plus context-bound one-shot mutation in the target Nexus wallet, including independent windows, uncertain acknowledgement/readback, settings writers, duplicate/restarted invocations, profile switches racing dispatch, restart/crash and size-limit failures.
- [ ] Add a default-collected rendered `StablecoinSwap({ runtimeOverride })` suite; source/AST navigation checks are not rendering acceptance.
- [ ] Verify installed module serving/open-in-browser URLs, browser wallet injection, supported Web Locks, and persisted origins.
- [ ] Exercise both directions on actual Nexus testnet and Solana devnet/testnet with configured tokens, all fees, minima/dust and sufficient liquidity.
- [ ] Verify API list/filter/pagination shapes, built-in owner exposure, DEBIT/CREDIT linkage and immutable JSON asset creation on the target node.
- [ ] Exercise wallet rejection, timeout-after-acceptance, restart, direct recovery and no duplicate submission at each financial boundary.
- [ ] Verify source-bound receipt publication, exact output and spendable Nexus claim, not just provider submission.
- [ ] Resolve remaining service production blockers and perform independent review of the exact release candidate.
- [ ] Add an acceptance record pinning provider address/owner, token/custody accounts, both networks, allowed directions, output dust floors and an actual evidence document. Rebuild both bundles together.
- [ ] Verify every manifest entry exists in the assembled module and test installation. A bundle or ZIP is not Nexus open-source-policy verification.

Do not test these boundaries with production user funds. The live release checklist remains unfulfilled by the offline fixtures.
