# Nexus DEX Module

A Nexus Wallet module for native Nexus token trading and market data. The cross-chain surface is available for provider inspection and recovery only; new cross-chain funding is deliberately disabled pending release acceptance.

## ✨ Features

- **🚀 Market Fill Trading** - Quick one-click buy/sell with automatic best price matching
- **📊 Real-Time Market Data** - Live prices, order books, volumes, and market depth charts
- **📈 Advanced Trading** - Place limit orders (bid/ask) and execute specific orders from the book
- **🔄 Cross-Chain Inspection** - Discover providers, inspect terms, calculate quotes, and review recovery evidence while funding remains release-gated
- **🔒 Secure** - All transactions require PIN confirmation through the Nexus Wallet security model
- **📉 Charts & Analytics** - Candlestick charts, volume data, and market depth visualization

## 🎯 Quick Start

### Installation (Verified Release)

1. **Download Nexus Wallet** - Get the [latest version](https://github.com/Nexusoft/NexusInterface/releases/latest)
2. **Get the DEX Module** - Download latest "dex_module@x.y.z.zip" from our [releases page](https://github.com/AkstonCap/DEX/releases/latest)
3. **Install** - Open Nexus Wallet → Settings → Modules → Import the downloaded zip
4. **Start Trading** - The DEX icon will appear in your navigation bar

### Installation (Beta/Development Version)

For testing unreleased features:

1. Download the [latest source code](https://github.com/AkstonCap/DEX/releases/latest)
2. Unzip and open terminal in the folder
3. Run:
   ```bash
   npm install
   npm run build
   ```
4. Enable Developer Mode in Nexus Wallet (Settings → Application)
5. Drag the folder into Settings → Modules → "Add module"

## 📖 User Guide

### Getting Started with Trading

1. **Select a Market Pair** - Enter token names in the top-right corner (e.g., DIST and NXS)
2. **Click Refresh** - Updates all data for your selected pair
3. **Choose Trading Method**:
   - **Market Fill** (Default) - Simplest option for quick trades
   - **Bid/Ask** - Place limit orders at specific prices
   - **Execute** - Fill existing orders from the order book

### Market Fill Trading (Recommended for Beginners)

The easiest way to trade:

1. Select **Market Fill** (selected by default)
2. Choose **Buy** or **Sell**
3. Enter your **Max Payment Amount** (how much you want to spend)
4. Select your **payment** and **receiving accounts**
5. Click **Find Best Order & Execute**
6. Review the order details and confirm with your PIN

The system automatically finds the best available price within your budget and includes 10% price protection.

## 📱 Module Tabs

### 📊 Overview
- Quick view of current market metrics (price, 24h change, volume)
- Order book with best bids and asks
- Recent trades for the market pair
- Your active orders and trade history
- Auto-refresh every 10-60 seconds

### 💱 Trade
- **Market Fill** - Quick buy/sell with automatic price matching (recommended)
- **Bid/Ask** - Place custom limit orders at your desired price
- **Execute** - Fill specific orders from the order book
- View and cancel your open orders
- Real-time balance validation

### 📈 Charts
- Price history with candlestick or line charts
- Adjustable time spans (1h to 30 days)
- Volume overlays and interactive tooltips
- Synchronized with your selected market pair

### 📉 Market Depth
- Visual representation of order book liquidity
- Cumulative bid/ask depth chart
- Toggle between logarithmic and linear scales
- Identify support and resistance levels

### 🏪 Markets
- Browse all available tokens and their metrics
- Live prices, volumes, and market caps (vs NXS)
- Search and filter by token name
- One-click market pair selection

### 🔄 Cross-chain swaps — inspection only

The current module can discover known-schema service-provider records, inspect
their declared terms, calculate exact-unit quotes, and review persisted recovery
evidence. It is a **custodial provider workflow**, not an atomic swap.

New funding is intentionally unavailable. The runtime requires both an
evidence-pinned accepted deployment and acknowledged durable storage from the
host wallet; this repository currently has no accepted deployment. Do not send
funds manually using an address, memo, fee, minimum, mint, or token identity from
an older README or screenshot. Those values are provider- and deployment-specific
and must be revalidated by the runtime before authorization.

Release criteria and recovery boundaries are maintained in
[`docs/CROSS_CHAIN_SWAPS.md`](docs/CROSS_CHAIN_SWAPS.md) and the current
[development plan](SWAP_SERVICE_DEVELOPMENT_PLAN.md).

## 🔒 Security

Native Nexus transactions use the Nexus Wallet's confirmation boundary:
- PIN confirmation is requested for native Nexus mutations
- Nexus private keys are not exposed to the module
- Cross-chain providers are intermediaries; published provider records are not endorsements or proof of solvency
- Cross-chain funding stays disabled until the documented wallet, node, service, and deployment gates pass

Learn more: [Nexus Module Security Documentation](https://github.com/Nexusoft/NexusInterface/blob/master/docs/Modules/module-security.md)

## ⚠️ Important Notes

- **Token Requirements** - Currently only works with tokens that have global names
- **Market Pair Format** - Enter as BASE/QUOTE (e.g., DIST/NXS)
- **Cross-chain status** - Provider inspection is available; new funding is not release-enabled
- **Networks and assets** - Treat the identities displayed from validated deployment policy as authoritative; do not rely on hard-coded examples

## 🛠️ Cross-chain network policy

Cross-chain evidence queries use the static reviewed network policy in
`src/swap/deployment.js`. A `SOLANA_RPC_URL` environment override is not part of
the current module contract.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/AkstonCap/DEX/issues)
- **Nexus Community**: [Nexus Slack](https://nexus.io/community)

---

Made with ❤️ for the Nexus community
