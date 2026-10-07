# DEX — Distordia strategy and development alignment

[Repository vision](../vision.md) · [Architecture](../ARCHITECTURE.md) · [Authoritative development plan](../SWAP_SERVICE_DEVELOPMENT_PLAN.md)

## Authority tree and portable master summary

Master Distordia strategy and customer evidence → portfolio roadmap/recorded strategy decisions → repository vision → architecture → maintained development plan → tasks/code/collected tests/external evidence/human release.

The master project lives at `/home/brutus/projects/Distordia`: `README.md`, `PORTFOLIO_DEVELOPMENT_PLAN.md`, `Distordia_Labs_Business_Thesis_and_Strategy_v2.docx`, `Distordia_Customer_Problem_Atlas_v2.docx`, `staked-accountability-rails.md` and `infrastructure-buildout.md`. These local originals are not hosted in this repository. The portable summary is: software/UX becomes abundant; scarce value is open coordination, namespace-rooted accountable identity, reproducible verification, attributable settlement and explicit risk ownership. Distordia is a standard-setter, not an execution gatekeeper. Its non-custodial/no-underwriting destination is an intent, not proof that every current implementation meets it.

Portfolio objective IDs: **O1** open interoperability; **O2** namespace authority; **O3** reproducible verification/provenance; **O4** attributable settlement/bounded risk; **O5** externally validated reliance. Customer Atlas classes describe observed/analogical/obligation/reported evidence, not willingness to pay.

Higher-level documents govern intent; exact source and executed evidence govern status. Strategy claims about escrow, slash execution, regulatory status, verification tiers, reputation and adoption remain hypotheses until their own feasibility/evidence/human decisions exit. Unchallenged/finalized is not independently verified. Public chain history is reproducible, not exclusive proprietary data. Source rights and employment/IP clearance precede industrial validation/ingestion.

## Repository contract

- **Objectives:** O1 interoperable open interfaces; O4 attributable wallet settlement.
- **Customer evidence:** Wallet/exchange/bridge hypotheses outside the Atlas; no marine Class A demand claim.
- **Vision outcome:** User-wallet authorization and recoverable, independently inspectable settlement; no module custody. Native Nexus trading and provider-custodial cross-chain transfers stay visibly distinct.
- **Scope qualification:** **Current reviewed source (2026-10-07):** detached source `7a28fcdd97710901e4317fb62d4ffc268b8743ca` matched the verified `master` remote. Five commits are accepted only as DEX-local containment: production admits no financial-journal writer, one coordinator blocks later writes after a journal fault, and wallet/network scope is reread at three asynchronous boundaries. Seven Jest suites / 65 tests and 110 reported Node tests passed; the maintained inline manifest command was approval-blocked and was not rerouted. Authoritative host revision/CAS storage, durable operation receipts, context-bound one-shot debit/mapping invocation, rendered-wallet acceptance, independently accepted swapService evidence and target-network acceptance remain open; `ACCEPTED_DEPLOYMENTS` stays empty. The DEX review did not inspect NexusInterface or swapService, and this alignment adds no upstream or release acceptance.

## Batch-to-vision and dependency map

This map adds strategic traceability; the linked technical plan retains its exact production files, tests and acceptance matrices. These are desired exits, not new claims of passed gates.

| Coding batch | Distordia outcome | Owner / prerequisite boundary | Human authority and acceptance exit |
|---|---|---|---|
| Authoritative host intent and bound invocation | O4; prevent cross-window duplicate writes and journal loss | NexusInterface host; docs/HOST_STORAGE_CONTRACT.md; DEX coordinator/controller/Redux integration | Host owns acknowledged CAS, receipts and one-shot invocation per intent bound to wallet context. Real host/WebView/restart evidence required; module promises or Web Locks alone cannot close it. |
| Signer/service evidence and terms | O1/O4; immutable external intent and supported provider policy | DEX external signing, service policy fixtures and swapService deployment | Uncertain handoff/submission remains held; no settings write erases evidence; no parser substitutes for provider admission or solvency proof. |
| Rendered/host/chain acceptance | O4/O5; trustworthy UI only after underlying authority works | Real component tests then supported wallet and isolated target settlement | Keep accepted deployment list empty until exact candidate storage/service/chain exits and human release. Dependency upgrades remain separate compatibility-controlled work. |

## Required work-item record

Every material task/PR states its objective ID and vision outcome; Atlas segment/archetype/evidence class or explicit non-Atlas hypothesis; component owner and pinned dependencies; exact production paths; actor/delegation and human authority; positive/negative/boundary/concurrency/recovery tests with commands; external proof still required; and durable failure/hold behavior. Name a responsible human at kickoff; do not invent authority from an agent role or a mutable status.

Use exact local/remote source identities, distinguish candidate from published evidence, and retain independent approval/release gates. Builds, mocks and completed plans never authorize real funds or engineering release. Lower-level findings can require a master strategy decision but cannot silently redefine intent. No new repository, schedule, deployment or financial operation is authorized by this alignment.
