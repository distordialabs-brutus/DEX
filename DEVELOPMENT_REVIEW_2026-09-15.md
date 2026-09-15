# Development and architecture review — 2026-09-15

## Scope and verdict

Initial inventory observed clean `master` at `51c8924` (`chore: update development files`, September 14), after the September 12 review commit. The delegated detailed Git inspection was approval-blocked and was not rerouted. Consequently this review does not infer an executable repair from the batch commit or claim a complete commit-diff audit. Independent permitted source reads, hashes and offline gates below establish the inspected current-worktree boundary.

**Native DEX offline gates pass with known debt; cross-chain funding remains correctly disabled and is not release-ready.** All eight principal files listed in the September 12 hash table (package, lockfile, manifest, deployment, persistence, store, reducer and controller) match that table exactly. No repair is established in those paths. No dependency upgrade, wallet interaction, signer action or live-chain call was performed.

## Fresh evidence

| Gate | Result |
|---|---|
| `npm run test:all` | PASS: 5 Jest suites / 41 tests; 110 swap tests; no failures |
| `npm run lint` | PASS with debt: 0 errors, 21 warnings |
| `npm run lint:swap` | PASS |
| `npm run build` | PASS: Webpack 5.99.9; app 1.23 MiB, signer 567 KiB; 3 performance warnings |
| Listed package-file existence | PASS: all 12 entries exist; not wallet-install acceptance |
| Principal runtime/config hash comparison | PASS: eight inspected files identical to September 12 table |
| Clean dependency install / mounted wallet / live service | NOT RUN |

Logs: `/tmp/dex-sept15-{tests,lint,swaplint,build}.log`. Existing installed dependencies were used, without upgrades.

## Architecture and coder handoff

1. **P1, unchanged: hydration mixes persistence domains.** `src/reducers/index.js:43-51` merges `storageData` into reducer state, including the financial journal not owned by `combineReducers`. The test log reproduced three `Unexpected key "swapJournal"` diagnostics. Project only `ui`, `settings`, and `nexus` into Redux hydration; keep the journal exclusively in the serialized persistence coordinator. Preserve default merging and optimistic-state exclusion. Add an INITIALIZE → unrelated dispatch → settings update regression asserting zero console warnings and unchanged recovered journal bytes.
2. **Release gate, unchanged: host durability and accepted deployment are unproved.** `src/swap/deployment.js:9-20` has an empty acceptance registry; acknowledged storage remains required. Do not populate it or emulate acknowledgement with the fire-and-forget wallet API. Mount the real swap page, cover disabled actions, profile/network changes, rejected writes, signer return, restart and pending outcome without duplicate send; then run isolated supported-wallet/service acceptance.
3. **Cross-repository dependency updated:** the September 15 swapService review found that chain-only disposition recovery can misclassify underpayment as fee and that Solana-source minimum policy is not enforced after ingestion. Those service exits must pass before accepting any deployment. Provider-v2 builder work is not end-to-end registration/recovery support; maintain explicit adapters and inspect-only behavior for unsupported terms.
4. **P2, unchanged:** lint warnings include hook dependencies in overview/charts/trade form. Fix stale-value behavior with focused interaction regressions rather than suppressing rules. Keep dependency/security upgrades deferred to a separately compatibility-tested Nexus Interface batch.

## Exit order

Hydration regression → mounted interaction gate → actual acknowledged wallet persistence → service financial-safety repairs → exact deployment/test-network evidence. Preserve both funding gates throughout. The build and offline test totals alone do not approve funding.
