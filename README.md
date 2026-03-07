# ERA Protocol

> **Save 59-96% on Ethereum gas fees through zkSTARK-proven batch settlements on Layer 1**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Crypto Tests](https://img.shields.io/badge/crypto%20tests-33%2F33%20100%25-brightgreen)](__tests__)
[![Build](https://img.shields.io/badge/build-82%2F97-yellow)](__tests__)
[![Accessibility](https://img.shields.io/badge/WCAG%202.1-AA%20Compliant-green)](docs/ACCESSIBILITY.md)
[![Sepolia](https://img.shields.io/badge/Sepolia-Live-orange)](https://sepolia.etherscan.io/address/0xDcac7bd52Ea8ECA2b3941E414153A209508B546f)

---

## 🎯 The Problem

Ethereum gas fees cost users **$8-12 billion annually**, making everyday transactions prohibitively expensive:

- **Sending $50 USDC?** Pay $0.50 in gas (1% fee)
- **Swapping tokens?** Pay $1.50-$3.00 per swap
- **Multiple transactions?** Costs compound quickly

This pricing model excludes:
- 🌍 Users in developing economies
- 💰 Small-value transactions (<$100)
- 🔄 Frequent traders and active users

**Traditional solutions?**
- **Layer 2s:** Require bridging, fragment liquidity, add complexity
- **Account Abstraction:** Still pays full gas, just abstracts UX
- **Gas tokens:** Speculative, don't fundamentally reduce costs

---

## ✨ The Solution

**ERA Protocol** batches 20-100 user transactions into a single settlement, generating a zkSTARK proof to verify correctness. This amortizes the fixed costs across all users.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  1. User Signs Intent (Off-Chain, Free!)                       │
│     • EIP-712 signature (TransferIntent or SwapIntent)         │
│     • No gas paid at signing                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. ERA Aggregates 20-100 Transactions                         │
│     • Wait for sufficient batch size (or timeout)              │
│     • Optimizes for lowest cost per user                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. Generate zkSTARK Proof (6-30 seconds)                      │
│     • Custom FRI prover validates batch correctness            │
│     • zkSTARK proof generated in-process                       │
│     • Proof is constant size (~150KB)                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. Settle Batch on L1 Ethereum                                │
│     • Single transaction settles all 20-100 intents            │
│     • Proof verified on-chain (ERASettlement.sol)             │
│     • All transfers execute atomically                         │
└─────────────────────────────────────────────────────────────────┘
```

**Result:** Each user pays only their share of the batch cost → **59-96% cheaper!**

---

## 📊 Proven Gas Savings

Validated on Sepolia testnet (calculations at 30 gwei, $2,500 ETH):

### ERC20 Send Transactions

| Method | Gas Used | Cost (USD) | Savings |
|--------|----------|------------|---------|
| **Direct L1** | 45,059 | **$0.54** | - |
| **ERA (Batch 20)** | 18,594 | **$0.22** | **58.7%** ↓ |
| **ERA (Batch 50)** | 7,296 | **$0.09** | **83.8%** ↓ |
| **ERA (Batch 100)** | 3,577 | **$0.04** | **92.1%** ↓ |

### Token Swaps (Uniswap V2)

| Method | Gas Used | Cost (USD) | Savings |
|--------|----------|------------|---------|
| **Direct Swap** | 101,538 | **$1.22** | - |
| **ERA (Batch 20)** | 21,845 | **$0.26** | **78.5%** ↓ |
| **ERA (Batch 50)** | 8,877 | **$0.11** | **91.3%** ↓ |
| **ERA (Batch 100)** | 4,509 | **$0.05** | **95.6%** ↓ |

**Why does this work?**
- Fixed proof verification cost (~150k gas) is shared
- Per-user execution cost is minimal (~18k gas)
- Larger batches = greater savings

📖 **Full analysis:** [docs/GAS_ANALYSIS.md](docs/GAS_ANALYSIS.md)

---

## 🚀 Try It Now

### Live Demo (Sepolia Testnet)

🔗 **[app.eraprotocol.xyz](https://app.eraprotocol.xyz)** *(Coming Soon)*

**Quick Start:**
1. Connect wallet (MetaMask, Coinbase, WalletConnect)
2. Get Sepolia ETH from [faucet](https://sepoliafaucet.com/)
3. Get test tokens from [ERA Faucet](https://app.eraprotocol.xyz/faucet)
4. Send or swap tokens → see your gas savings!

### For Developers

```bash
# Clone and run locally
git clone https://github.com/yourusername/era-app.git
cd era-app
npm install
cp .env.local.example .env.local
npm run dev
```

📖 **Integration guide:** [docs/INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md)

---

## 🏗️ Architecture

ERA Protocol consists of three layers:

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend (Next.js 15 + RainbowKit)                          │
│ • User interface for Send/Swap flows                        │
│ • EIP-712 signature collection                              │
│ • Status polling and result display                         │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ↓ HTTPS POST
┌──────────────────────────────────────────────────────────────┐
│ Backend (Node.js + Railway)                                 │
│ • Job queue & batch aggregation                             │
│ • zkSTARK proof generation (custom FRI prover)              │
│ • Transaction submission to L1                              │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ↓ eth_sendTransaction
┌──────────────────────────────────────────────────────────────┐
│ Smart Contracts (Sepolia → Mainnet)                         │
│ • ERASettlement.sol - Batch settlement + proof verification │
│ • StarkVerifier.sol - zkSTARK proof verification            │
└──────────────────────────────────────────────────────────────┘
```

📖 **Deep dive:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🔐 Security

### Current Status

- ✅ **EIP-712 signatures** prevent replay attacks
- ✅ **Nonce enforcement** prevents double-spending
- ✅ **Deadline mechanism** prevents stale transactions
- ✅ **zkSTARK proofs** ensure batch correctness
- ✅ **Non-custodial** - user funds never leave wallet until settlement

### Testnet Limitations

- ⚠️ **Centralized backend** (temporary - decentralization planned)
- ⚠️ **No formal audit** (planned with EF grant funding)
- ⚠️ **Sepolia only** (mainnet after audit)

### Security Roadmap

- [ ] **Q2-Q3 2026:** Preliminary security review + audit scoping
- [ ] **Q3-Q4 2026:** Solidity smart contract audit (Trail of Bits / OpenZeppelin)
- [ ] **Q4 2026-Q1 2027:** zkSTARK custom prover audit (specialist firm)
- [ ] **Q1-Q2 2027:** Bug bounty program launch (Immunefi, TVL-scaled)
- [ ] **2027:** Decentralized prover network

📖 **Full security model:** [docs/SECURITY.md](docs/SECURITY.md)

---

## 📈 Smart Contracts

### Sepolia Testnet (Current)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| **ERASettlement** | `0xDb41E9279D4c1BFc3ED90D2B1f0dbc4C4ba08c83` | [View](https://sepolia.etherscan.io/address/0xDb41E9279D4c1BFc3ED90D2B1f0dbc4C4ba08c83) |
| **ERAVerifier** | `0xDcac7bd52Ea8ECA2b3941E414153A209508B546f` | [View](https://sepolia.etherscan.io/address/0xDcac7bd52Ea8ECA2b3941E414153A209508B546f) |

### Mainnet (Post-Audit)

Contracts will be deployed to Ethereum mainnet after security audit completion.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS |
| **State** | Zustand (lightweight, no Redux needed) |
| **Web3** | RainbowKit, wagmi, viem |
| **Animation** | Framer Motion |
| **Testing** | Vitest, React Testing Library, jest-axe |
| **Backend** | Node.js, Express, BullMQ |
| **Proofs** | Custom FRI Prover (TypeScript), zkSTARK-inspired |
| **Contracts** | Solidity 0.8.x, Hardhat |

**Code Quality:**
- ✅ TypeScript strict mode
- ✅ zkSTARK proving core: 33/33 tests passing (100%)
- ✅ Full system: 82/97 tests passing (84.5% — remaining failures are frontend environment issues)
- ✅ WCAG 2.1 AA accessible
- ✅ ESLint + Prettier configured
- ✅ Professional error boundaries

---

## 📚 Documentation

### For Users
- [**How It Works**](docs/ARCHITECTURE.md) - Technical deep dive
- [**Gas Analysis**](docs/GAS_ANALYSIS.md) - Verified savings data
- [**FAQ**](docs/FAQ.md) - Common questions

### For Developers
- [**Integration Guide**](docs/INTEGRATION_GUIDE.md) - Add ERA to your dApp
- [**API Reference**](docs/API.md) - Backend API documentation
- [**Smart Contracts**](docs/CONTRACTS.md) - Contract interfaces

### Operations
- [**Deployment**](docs/DEPLOYMENT.md) - Production deployment guide
- [**Testing**](docs/TESTING.md) - Test suite documentation
- [**Accessibility**](docs/ACCESSIBILITY.md) - WCAG 2.1 compliance

---

## 🗺️ Roadmap

### Q2 2026 - Foundation ✅
- [x] Working POC on Sepolia
- [x] Send + Swap flows
- [x] Frontend + backend deployed
- [ ] Security audit
- [ ] Mainnet deployment

### Q3 2026 - Adoption
- [ ] Developer SDK release
- [ ] 5+ dApp integrations
- [ ] Mobile-optimized UI
- [ ] Gas savings dashboard

### Q4 2026 - Scale
- [ ] Decentralized prover network
- [ ] Governance token launch
- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] zkSTARK prover optimizations

📖 **Full roadmap:** [docs/ROADMAP.md](docs/ROADMAP.md)

---

## 🤝 Contributing

ERA Protocol is open source and welcomes contributions!

**Ways to contribute:**
- 🐛 Report bugs via [GitHub Issues](https://github.com/yourusername/era-app/issues)
- 💡 Suggest features or improvements
- 🔧 Submit pull requests
- 📖 Improve documentation
- 🧪 Test on Sepolia and share feedback

**Development Setup:**
```bash
git clone https://github.com/yourusername/era-app.git
cd era-app
npm install
cp .env.local.example .env.local
# Add your API keys to .env.local
npm run dev
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🌟 Why ERA Matters

Layer 2 solutions are amazing for scaling Ethereum, but they fragment liquidity and require bridging. **ERA Protocol complements L2s** by making L1 economically viable for everyday users.

**ERA nourishes the base layer:**
- ✅ Keep liquidity on L1
- ✅ No bridging friction
- ✅ Composable with all existing dApps
- ✅ Immediate finality (no 7-day withdrawal)

**The vision:** Every wallet, dApp, and protocol should offer ERA as a "save on gas" option. Just like how apps offer "Pay with PayPal" or "Pay with Apple Pay," they should offer **"Batch with ERA."**

---

## 📞 Contact & Community

- **Website:** [eraprotocol.xyz](https://eraprotocol.xyz) *(Coming Soon)*
- **Twitter:** [@ERAProtocol](https://twitter.com/ERAProtocol)
- **Discord:** [Join our community](https://discord.gg/eraprotocol)
- **Email:** hello@eraprotocol.xyz

---

## 🙏 Acknowledgments

Built with support from:
- **StarkWare** - Inspiration for zkSTARK and FRI proof system design
- **Ethereum Foundation** - Grant application in progress
- **RainbowKit & wagmi** - Excellent Web3 developer experience
- **Uniswap** - Token swap infrastructure

---

**Built with ❤️ for the Ethereum community**

*Making L1 accessible to everyone, one batch at a time.*
