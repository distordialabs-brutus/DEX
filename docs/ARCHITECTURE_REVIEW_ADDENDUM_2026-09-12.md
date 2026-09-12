# DEX architecture and release addendum — 2026-09-12

## Scope and continuity

This addendum reviews `master` at `cae41704cdddfdd5ce360bceea76fbe8bf0651fe`, which matched `origin/master` at review start. The executable baseline remains merge commit `593ff0a517e5da78dbf37f723f9cdcc4219e7284`; the path delta from that commit to the reviewed head contains documentation only. No source, test, dependency, manifest, Webpack, or workflow change has landed since that runtime baseline.

`ARCHITECTURE.md` and `SWAP_SERVICE_DEVELOPMENT_PLAN.md` already contained uncommitted 2026-09-10 work, so this dated file records the new assessment without rewriting or staging those paths. The complete executed evidence is in [`DEVELOPMENT_REVIEW_2026-09-12.md`](../DEVELOPMENT_REVIEW_2026-09-12.md).

## Architecture status

The module has two distinct domains:

1. **Native Nexus DEX:** React/Redux views call Nexus through `nexus-module`; native order, execution, cancellation, and NFT mutations retain the wallet's `secureApiCall` confirmation boundary. Market response normalization is centralized in `src/utils/marketData.js`, but endpoint projections and polling remain distributed, and native monetary calculations still use JavaScript floating point.
2. **Cross-chain provider client:** `src/swap/*` separates discovery, exact-unit arithmetic, Nexus/Solana adapters, persisted jobs, orchestration, and static deployment policy. The implementation preserves intent before mutation, holds ambiguous submissions, scopes jobs to provider/network/profile identity, and requires attributable source and payout evidence.

Cross-chain funding remains intentionally unavailable. `src/swap/deployment.js` has an empty `ACCEPTED_DEPLOYMENTS` array, and `src/configureStore.js` requires the future `NEXUS.utilities.updateStorageAcknowledged` host capability for durable financial intent. Provider discovery and a passing offline suite do not satisfy target-wallet, live-node, service, or deployment acceptance.

## 2026-09-12 documentation correction

The maintained README previously described a working fixed USDC/USDD bridge, gave manual funding instructions and hard-coded terms, called the flow intermediary-free, and advertised an unused RPC environment override. That conflicted with the fail-closed implementation. The README now labels the surface inspection-only, identifies the provider as an intermediary, removes manual funding and fixed-identity guidance, and points to the release gates.

## Actionable next exits

1. **Remove the Redux hydration warning.** Split `swapJournal` from reducer-owned persisted state before calling `combineReducers`; keep the persistence coordinator's settings/journal ordering intact and add a warning-free regression.
2. **Mount the cross-chain page in tests.** Exercise discovery failure/partial states, consent invalidation, blocked storage/deployment, double activation, and recovery controls through rendered user interactions. Source/AST wiring checks are not substitutes.
3. **Prove the host boundary.** Add a supported Nexus Interface harness for acknowledged durable writes, restart/capacity/profile switching, Web Locks, and signer handoff. Do not wrap fire-and-forget storage in a resolved Promise.
4. **Run isolated acceptance.** Validate read-only provider discovery first, then both funding directions with non-production assets, accepted-but-lost responses, restart at every boundary, service outages, and exact final evidence. Only then add an evidence-pinned deployment entry.
5. **Reduce existing debt without blind upgrades.** Resolve 21 lint warnings and measure/code-split the 1.23 MiB app and 567 KiB signer. Dependency security upgrades remain a separate Nexus Interface compatibility workstream and were not attempted in this review.

## Verification boundary

On 2026-09-12, the unchanged working tree passed 5 Jest suites / 41 tests and 110 swap tests; strict swap lint passed, repository lint completed with 21 warnings, and Webpack built both bundles with three performance warnings. All 12 manifest-listed files existed after the build. These are offline current-worktree checks, not wallet/node acceptance. No wallet, node, profile/session, chain, or funds-moving action was performed.
