# Nexus DEX Module Vision

## Portfolio roadmap authority

The master Distordia project also owns `PORTFOLIO_DEVELOPMENT_PLAN.md` and its strategy-decision register. The full order is **master strategy/customer evidence → portfolio roadmap/decisions → this vision → architecture/development plan → tasks/code/tests/release evidence**. Read the [portable repository alignment](docs/DISTORDIA_ALIGNMENT.md) for objective, customer-evidence, ownership and dependency mapping. Master-source paths below are local workspace references, not promised GitHub links. This section adds portfolio sequencing; it does not certify the envisioned behavior or amend unresolved master strategy assumptions.

## Accountability venture context — not canonical authority

Local master-workspace context (not published by this repository): `Distordia/staked-accountability-rails.md` and `Distordia/infrastructure-buildout.md`. These are venture hypotheses and dependency-design context. They do not amend canonical strategy or prove enforceable collateral/slashing, non-custody, regulatory status, reputation, or adoption. [The repository alignment](docs/DISTORDIA_ALIGNMENT.md) carries the portable SD-002–SD-008 boundaries needed here; the local master register remains higher authority when doing portfolio work, but this publication does not require either local file. Feasibility, legal assessment and human decisions remain required.

## Purpose

The Nexus DEX module is a wallet-integrated interface for discovering markets, inspecting exchange evidence, and authorizing settlement on Nexus. It exists to make exchange activity more legible and accountable without becoming a custodian, an endorsement authority, or a gatekeeper to execution.

Distordia's premise is that software and UX become abundant while coordination, verification, identity, settlement, accountability, and risk remain scarce. This repository should therefore compete on trustworthy transaction boundaries and evidence—not on owning liquidity, users, or execution.

## Product direction

The module should:

- make native Nexus order books, market data, orders, and fills understandable and verifiable;
- preserve the Nexus Wallet confirmation boundary for every consequential native action;
- use exact asset, account, network, provider, and transaction identities rather than names or tickers as authority;
- keep keys and signing authority in user-controlled wallets and avoid custody wherever the underlying protocol permits;
- expose open, agent-readable records and evidence so independent clients can reproduce conclusions;
- consume namespace attestations and staked accountability records as evidence when available, without making Distordia approval a prerequisite for open execution; and
- distinguish observed, inferred, pending, unresolved, and finalized states instead of turning absence of evidence into success.

This is a Nexus module, not a new exchange operator. Native trades settle through Nexus market APIs. Cross-chain transfers are a separate provider-mediated workflow: providers take custody, publication is not endorsement, and the workflow is not an atomic or trustless swap. The module must show that distinction before authorization.

## Safety boundaries

1. **Human authority for consequential actions.** Automation may discover, normalize, quote, monitor, and propose. A person must explicitly approve orders, cancellations, debits, external-wallet signatures, and any future slash or dispute execution.
2. **No secret or fund custody by the module.** PINs, seeds, sessions, and private keys do not enter module persistence or public handoffs. The wallet or external signer remains the signing boundary.
3. **Evidence before claims.** Completion, refund, solvency, provider trust, and release readiness require attributable evidence. Timeouts, balance changes, status strings, or published provider records are insufficient.
4. **Fail closed under ambiguity.** Unknown network, asset, account, terms, persistence, submission, finality, or deployment state must block a new mutation or remain a durable unresolved state. It must not trigger automatic resubmission.
5. **Intent before mutation.** Financial workflows require an immutable, scope-bound intent recorded durably before funds can move, with exact integer units and enough identity to recover without guessing.
6. **Independent verification.** Normalization, quote math, state transitions, and settlement evidence should be deterministic and testable outside the UI. On-chain and wallet evidence outrank cached or provider-authored presentation data.
7. **Release gates are real boundaries.** Offline tests and successful builds are necessary, not proof of target-wallet or live-network behavior. Cross-chain funding remains disabled until the documented storage, deployment, service, wallet, and network acceptance gates pass.

The repository is not production-ready merely because a feature is visible, tests pass, or a bundle builds. Current capability and remaining blockers must stay explicit in maintained documentation.

## Distordia alignment

Distordia should be a standard-setter, not a gatekeeper. For this module that means:

- publish interoperable formats and deterministic verification rules at the edges;
- organize trust around accountable namespaces rather than isolated display names or assets;
- allow execution through the underlying open protocols without requiring Distordia permission;
- add attestations, bonds, challenge history, and risk signals as inspectable evidence rather than opaque badges;
- reserve human judgment for high-consequence or genuinely subjective decisions; and
- monetize or prioritize verification and risk reduction without obscuring who controls funds or bears counterparty risk.

## Decision hierarchy

Decisions in this repository follow this order:

1. **Canonical master strategy and customer evidence** — local master-workspace documents (not published by this repository): `Distordia/Distordia_Labs_Business_Thesis_and_Strategy_v2.docx` and `Distordia/Distordia_Customer_Problem_Atlas_v2.docx`. The local master `Distordia/PORTFOLIO_DEVELOPMENT_PLAN.md` records portfolio sequencing and explicit strategy decisions before this repository vision; [the repository alignment](docs/DISTORDIA_ALIGNMENT.md) carries the portable summary required to use this repository without those local-only files.
2. **This repository vision** — translates that strategy into the Nexus DEX module's purpose and non-negotiable boundaries.
3. **Architecture and development plans** — including [ARCHITECTURE.md](ARCHITECTURE.md), [Cross-chain swaps](docs/CROSS_CHAIN_SWAPS.md), and the [swapService client development plan](SWAP_SERVICE_DEVELOPMENT_PLAN.md); these define current design, sequencing, and acceptance evidence.
4. **Implementation records** — issues, pull requests, code, tests, builds, deployments, and dated reviews execute and demonstrate the higher-level decisions; they do not redefine them implicitly.

### Conflict resolution

A lower level yields to a higher level. If implementation or a plan conflicts with this vision, stop the conflicting work and update or replace the lower-level artifact explicitly. If this vision conflicts with canonical Distordia strategy, the canonical strategy controls and this file must be revised before the change proceeds.

Apparent conflicts among canonical sources must not be resolved by cherry-picking. Record the conflict, identify the affected decision, and obtain an explicit strategy decision. Until then, use the more restrictive safety boundary for consequential actions. Repository evidence may reveal that a strategy or design assumption is infeasible, but that evidence triggers a documented decision; it does not silently invert the hierarchy. Dated reviews describe observed states and never override maintained strategy, vision, or architecture.

## Development grounding checklist

Before merging or enabling a change, verify that it:

- [ ] names the Distordia objective and repo-level outcome it advances;
- [ ] preserves open execution and does not turn an attestation or namespace into an undisclosed gate;
- [ ] identifies who owns keys, holds funds, authorizes the action, and bears counterparty risk;
- [ ] uses immutable identities and exact monetary units at financial boundaries;
- [ ] keeps consequential actions behind explicit human approval;
- [ ] defines evidence for every success, completion, refund, trust, or readiness claim;
- [ ] fails closed and preserves recoverable state when persistence, submission, or finality is uncertain;
- [ ] includes deterministic regression coverage and separately names wallet, node, service, or live-network evidence still missing;
- [ ] updates the relevant architecture or plan when contracts, state machines, or release gates change; and
- [ ] avoids claiming production readiness until every documented acceptance gate is satisfied.
