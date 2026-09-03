# ARCHITECTURE.md

## Overview
The DEX module is a React/Redux application that integrates with the Nexus Wallet to provide a decentralized exchange experience.

## State Management
- **Redux** is used for global state.
- Key slices:
  - `ui.activeTab` – current navigation tab
  - `ui.market` – market data (order book, pairs, trades)
  - `ui.nft` – NFT marketplace data
  - `settings` – user settings (timespan, etc.)
  - `nexus` – wallet data from the Nexus module

## Data Flow
1. UI components dispatch actions (e.g., `fetchMarketData()`).
2. Action creators call API utilities (`apiCache.js`, `nexus-module`).
3. Reducers update state based on action types.
4. Components subscribe to state via `useSelector` and re‑render when relevant data changes.

## Component Hierarchy
- `App` (root)
  - Active tabs: Overview, Trade, Chart, MarketDepth, Markets, Portfolio, and NFT Marketplace (`NFTArt` state key).
  - `StablecoinSwap` is imported but its tab and rendered route are currently commented out in `src/App/Main.js`.
  - Each tab contains presentational and container components.
- Shared reusable components live under `src/components/`.
- App-shell-only components may live under `src/App/components/`, but this boundary must be explicit; the current ErrorBoundary relocation is uncommitted and incomplete in Git.
- `VirtualizedTable` is **not implemented in the active repository**. A previous recovery checkout contained unintegrated WIP, but that checkout is no longer present under `/home/brutus/github` and is not an implementation source.

> Current implementation status and verification results: [`DEVELOPMENT_REVIEW_2026-09-03.md`](DEVELOPMENT_REVIEW_2026-09-03.md). No source or gate status changed after the 2026-09-02 review.

## Integration with Nexus Wallet
- The module reads wallet data from the `nexus` slice (provided by the Nexus Wallet Redux module).
- Transactions are initiated via `secureApiCall` which triggers the wallet’s PIN prompt.
- On‑chain events are monitored via polling (`fetchMarketData` every 15 seconds) and Redux updates.

## Build System
- Webpack with Babel (`webpack.config.babel.js`, `webpack-dev.config.babel.js`).
- Production build: `npm run build`.
- Development server: `npm run dev`.
- ESLint is exposed as `npm run lint`, but it is not a green gate as of the current review.
- A Jest configuration and one test file exist, but `package.json` has no runnable `test` script.