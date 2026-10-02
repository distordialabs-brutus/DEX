# Development and architecture review — 2026-10-02

## Scope and source identity

- DEX repository: `master` and `origin/master` at `94d82a7adf258dbb08fe3a62668373a1d8339d67`.
- Requested baseline: `94d82a7adf258dbb08fe3a62668373a1d8339d67`; `94d82a7..HEAD` is empty.
- Runtime source baseline: `416855d14ab605450bdf4ead92b66ded5e931330`.
- No runtime, test, dependency, lockfile, build, manifest or workflow path changed after that runtime baseline; the intervening tracked changes are maintained Markdown and SHA-256 evidence.
- Review execution was offline. No wallet, node, RPC, signer, service, credential, deployment, production mutation or funds-moving action was used.

This publication contains maintained architecture, evaluation, development, state-machine and their required host/operating-contract documentation only. Historical dated reviews remain historical evidence. Local raw diagnostic scripts and unpublished design context are not publication dependencies.

## Verdict

Funding must remain disabled. `src/swap/deployment.js` correctly keeps `ACCEPTED_DEPLOYMENTS` empty, and the current DEX/installed `nexus-module` 1.1.11/reviewed Nexus Interface boundary do not implement the required authoritative host journal or context-bound one-shot wallet mutation.

The accepted progress is design and executable acceptance definition, not runtime capability:

- authoritative versioned reads and compare-and-swap storage;
- durable operation receipts and closed `committed | conflict | outcome_unknown` results;
- operation readback for uncertain acknowledgement;
- settings/journal isolation;
- immutable first remote identity and local-only identity-write retry;
- context-bound, durably claimed one-shot wallet mutation tied to the committed intent; and
- a two-context crash/restart/profile-switch acceptance matrix.

## Current DEX findings

### High — stale per-window authority can duplicate a mocked Nexus submission

Each persistence coordinator hydrates one private snapshot. A shared Web Lock serializes callbacks but does not refresh host authority. Two production controllers/coordinators initialized from one draft produced two serialized windows, two mocked debit calls and replacement of the first remote identity. This requires hypothetical accepted funding and multiple approved writable contexts; no live transfer was performed.

### High — an uncertain journal commit can be erased

After a host-committed `submission_unknown` write lost its acknowledgement, a later legacy settings write from stale cached module data erased the journal. The same stale-snapshot boundary also lost one of two independently created jobs. This proves journal loss; the separate controller case proves duplicate mocked submission.

### High — committed intent is not bound to the wallet mutation context

`submitNexus` validates scope, awaits funding validation, commits `submission_unknown`, invokes the wallet and then checks scope again. A mocked production-controller case changed the active profile during validation. The debit adapter was called once under the changed scope; the post-call check rejected and retained the original job as `submission_unknown` without the returned identity.

A module-side reread before dispatch is necessary but cannot close the final check-to-dispatch race. The host must bind the committed intent, exact endpoint/parameters, approval prompt, dispatch context and one durable invocation claim.

### Other activation blockers

- Browser-local signer attempt authority is not global across isolated storage/lock namespaces.
- Recommended v1 does not publish directional input maxima or Nexus input dust.
- DEX requires `nexus-swap-receipt-v1` for Solana-to-Nexus completion while service production receipt admission remains unresolved.
- Redux initialization temporarily admits `swapJournal` despite owning only `ui`, `settings` and `nexus`, producing three diagnostics.
- No default-collected test mounts the real swap component; the current component checks inspect source/AST.
- No target-wallet storage, wallet profile binding, renderer installation, real node, service, RPC, external signer or chain behavior was established.
- Dependency/security upgrades remain deferred pending Nexus Interface compatibility.

## Current swapService comparison

The current comparison is the October 2 service review, not the September 22 snapshot.

Four restore repairs are published through swapService `origin/main` `7b2d1c4e3c9d3b2f006a083f9372cfadf80830fc` and accepted within their tested boundary. Restored sources with terminal conflicts, retained capacity intent, retained debit metadata, or retained ordinary disposition rows are held with full principal/evidence, zero mocked transport and atomic rollback. Younger valid work progresses where applicable.

The separately staged sealed-custody candidate reviewed at local service head `ee10b6e20dfe85f15347386adecb9dc99db55bb5` passed 947 tests but is not accepted for release:

- executable attestation omits the root `swapService.py` entrypoint, interpreter and installed package artifacts;
- heartbeat validation is not an exact address/owner/provider/token-register/vault identity contract;
- genesis-only reads do not establish Solana health/root freshness or Nexus sync/mode/network/tip freshness;
- witness bootstrap/restore evidence and independent operational controls remain incomplete;
- malformed capacity evidence can still starve younger valid frozen work; and
- receipt, provider-v2, evidence-bound disposition and live fault acceptance remain open.

Older September 22 cross-protocol observations remain historical evidence where they have not been superseded. They are not represented as a fresh service comparison.

## Offline verification

| Check | Result |
|---|---|
| Jest with coverage | PASS: 5 suites / 41 tests; three known Redux diagnostics and one expected no-session warning |
| Swap tests | PASS: 110/110 reported tests |
| Repository lint | PASS at configured threshold: 0 errors / 21 warnings |
| Strict swap lint | PASS: zero warnings/errors |
| Production build | PASS: both bundles emitted; three performance warnings |
| Module manifest | PASS: all 12 declared paths exist |
| Runtime-source manifest | PASS: 36/36 hashes match |
| Focused state-machine shard | PASS: 31/31 tests |
| Focused configure-store shard | PASS: 3/3 tests with the three known Redux diagnostics |
| Target-wallet/live-chain acceptance | NOT ESTABLISHED |

Green offline tests do not close the documented architecture exits. Exact-head remote CI was not refreshed by this documentation preparation.

## Required implementation order

1. Collect the two-window, uncertain-acknowledgement/settings and profile-switch failures as default-collected regressions around real controllers/coordinators and a revisioned fake host.
2. Implement the authoritative host journal and context-bound one-shot mutation together. Require one mocked remote call, preservation of independent jobs and identical restart state in a third context.
3. Project only reducer-owned roots into Redux and prove legacy settings writes cannot replace a newer or uncertain journal revision.
4. Add a compatibility-pinned rendered `StablecoinSwap({runtimeOverride})` suite in a separately reviewed dependency change.
5. Move signer attempt authority into a durable wallet-owned boundary with proven no-attempt recovery and no automatic resubmission.
6. Run the complete storage/invocation matrix in every supported Nexus Interface version with financial transport mocked.
7. Close service policy, attestation, heartbeat identity, node freshness/readiness, receipt and recovery/disposition exits before explicitly authorized non-production network acceptance.
8. Add an accepted deployment only after exact-candidate evidence satisfies every prior gate.

See [ARCHITECTURE.md](ARCHITECTURE.md), [SWAP_SERVICE_EVALUATION.md](SWAP_SERVICE_EVALUATION.md), [SWAP_SERVICE_DEVELOPMENT_PLAN.md](SWAP_SERVICE_DEVELOPMENT_PLAN.md), [docs/HOST_STORAGE_CONTRACT.md](docs/HOST_STORAGE_CONTRACT.md), [docs/CROSS_CHAIN_SWAPS.md](docs/CROSS_CHAIN_SWAPS.md), and [docs/STATE_MACHINES.md](docs/STATE_MACHINES.md) for the maintained contracts and detailed acceptance criteria.
