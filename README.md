# ERA Protocol - Marketing Website & Swap Interface

> **Save up to 77% on Ethereum gas fees with zkSTARK-powered Layer 1 scaling**

## 🎯 What is This?

This is the **marketing website and user-facing swap interface** for the ERA Protocol. It showcases:

- ✅ **Real-time Uniswap price quotes** via official API
- ✅ **ERA Protocol gas savings comparison** (77%+ cheaper)
- ✅ **Beautiful, animated swap interface** with Framer Motion
- ✅ **Production-ready Next.js 15 architecture**
- ✅ **Full TypeScript type safety**

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.local.example .env.local

# 3. Add your Uniswap API key to .env.local
# Get one at: https://dashboard.uniswap.org/

# 4. Start development server
npm run dev

# 5. Open the swap page
open http://localhost:3000/swap
```

📖 **Full setup guide:** See [SETUP.md](./SETUP.md)

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `app/swap/page.tsx` | Swap page route |
| `components/SwapInterface.tsx` | Main swap UI |
| `lib/services/uniswap.service.ts` | Uniswap API client |
| `lib/hooks/useSwapQuote.ts` | React hook for quotes |
| `lib/types/swap.ts` | TypeScript types |
| `.env.local` | Environment variables (create this!) |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────┐
│  era-app (This Repository)             │
│  ┌─────────────────────────────────┐   │
│  │  Next.js Frontend               │   │
│  │  • Swap Interface UI            │   │
│  │  • Uniswap API Integration      │   │
│  │  • Savings Calculator           │   │
│  └─────────────────────────────────┘   │
│            ↓                            │
│     GET /quote (Uniswap API)            │
│            ↓                            │
│  Show: "Uniswap: $48.75"                │
│        "ERA: $1.08" (77% cheaper!)      │
│            ↓                            │
│  [User confirms swap]                   │
│            ↓                            │
│  POST /v1/swaps (ERA Backend) ─────────┼──→ Era Protocol
└─────────────────────────────────────────┘    (Batching & Proofs)
```

---

## 🎨 Features

### ✅ Real-time Quote Fetching
- Debounced API calls (500ms)
- Loading states
- Error handling

### ✅ ERA Savings Comparison
Based on verified testnet results:
- **Batch of 20:** 77.5% cheaper
- **Batch of 50:** 90.7% cheaper  
- **Batch of 100:** 95.3% cheaper

### ✅ Beautiful Animations
- Framer Motion transitions
- NumberFlow for smooth value changes
- Responsive design

---

## 🔗 Integration Points

### 1. Uniswap API (Implemented ✅)
```typescript
POST https://trade-api.gateway.uniswap.org/v1/quote
```

### 2. ERA Backend API (Ready for Integration)
```typescript
POST http://localhost:3000/v1/swaps
```

See [ERA Protocol Backend](../era/README.md) for backend details.

---

## 📊 Cost Comparison Example

**Swapping 1 ETH → AAVE:**

| Method | Gas Cost | Total Cost | Savings |
|--------|----------|------------|---------|
| Uniswap Direct | $48.75 | $48.75 | - |
| **ERA Protocol** | **$1.08** | **$1.08** | **$47.67 (97.8%)** |

*Based on 30 gwei gas price, $2,500 ETH*

---

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **API:** Uniswap Trading API
- **Fonts:** Open Runde (custom)

---

## 📚 Documentation

- [**SETUP.md**](./SETUP.md) - Complete setup guide
- [**ERA Protocol Backend**](../era/README.md) - Backend documentation
- [**Uniswap API Docs**](https://api-docs.uniswap.org/) - API reference

---

## 🧪 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run typecheck
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

**Environment Variables to Set:**
- `NEXT_PUBLIC_UNISWAP_API_KEY`
- `NEXT_PUBLIC_ERA_API_URL`
- `NEXT_PUBLIC_ERA_API_TOKEN`

---

## 🎯 Roadmap

- [x] Next.js setup with best practices
- [x] Uniswap API integration
- [x] Swap interface UI
- [x] ERA savings calculator
- [ ] Wallet connection (MetaMask)
- [ ] ERA backend integration
- [ ] Transaction status tracking
- [ ] Multi-token support

---

## 📄 License

MIT

---

**Built with industry best practices:**
- ✅ Service layer pattern
- ✅ Custom React hooks
- ✅ Type safety throughout
- ✅ Environment configuration
- ✅ Error handling
- ✅ Debouncing & optimization

---

**Questions?** Check [SETUP.md](./SETUP.md) or the [ERA Protocol Backend](../era/README.md)
