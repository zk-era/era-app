# ERA Protocol Integration Guide

**Reduce your users' gas costs by 60-90% with a simple API integration.**

---

## Why Integrate ERA?

ERA Protocol is **Ethereum public infrastructure** that enables any dApp to offer batched transaction settlement. No bridging, no L2 migration, no liquidity fragmentation.

### Key Benefits

- **60-90% Gas Savings:** Proven on Sepolia with real transactions
- **Zero Bridging:** Settlement happens directly on L1
- **Non-Custodial:** Users maintain full control of funds
- **EIP-712 Signatures:** Standard wallet signing (MetaMask, Coinbase, etc.)
- **Drop-in Integration:** Add to existing dApps without architectural changes

### Use Cases

| Use Case | Example Integration | Gas Savings |
|----------|---------------------|-------------|
| **Wallets** | Offer "Batch Mode" toggle for sends | 60-92% |
| **DEX Aggregators** | Batch swaps for multiple users | 78-96% |
| **DeFi Protocols** | Batch deposits/withdrawals | 60-90% |
| **NFT Marketplaces** | Batch minting/transfers | 60-90% |
| **Payment Apps** | Batch payment settlements | 60-92% |

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Signs Intent (EIP-712, no gas paid)               │
│    • Your dApp collects signature via wallet               │
│    • User approves token transfer (one-time)               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓ POST /api/poc/submit
┌─────────────────────────────────────────────────────────────┐
│ 2. ERA Aggregates Transactions                             │
│    • Backend queues transaction                            │
│    • Waits for batch size (20/50/100) or timeout          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓ 6-30 seconds
┌─────────────────────────────────────────────────────────────┐
│ 3. zkSTARK Proof Generated                                 │
│    • Custom FRI prover validates batch correctness         │
│    • Proof is constant size (~150KB)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓ Single L1 Transaction
┌─────────────────────────────────────────────────────────────┐
│ 4. Batch Settles on Ethereum L1                            │
│    • All transactions execute atomically                   │
│    • Users pay only their share of batch cost              │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start (Testnet)

### 1. Install Dependencies

```bash
npm install viem wagmi @rainbow-me/rainbowkit
# ERA SDK coming soon: npm install @era-protocol/sdk
```

### 2. Collect EIP-712 Signature

```typescript
import { useWalletClient } from 'wagmi';

// EIP-712 domain for ERA Protocol (Sepolia)
const domain = {
  name: 'ERA Protocol',
  version: '1',
  chainId: 11155111,
  verifyingContract: '0xDb41E9279D4c1BFc3ED90D2B1f0dbc4C4ba08c83'
};

// Transfer intent type
const types = {
  TransferIntent: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
};

// Get user signature
const { data: walletClient } = useWalletClient();

const signature = await walletClient.signTypedData({
  domain,
  types,
  primaryType: 'TransferIntent',
  message: {
    from: userAddress,
    to: recipientAddress,
    token: USDC_ADDRESS, // Sepolia USDC
    amount: '1000000', // 1 USDC (6 decimals)
    nonce: await fetchUserNonce(userAddress),
    deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  }
});
```

### 3. Submit to ERA Backend

```typescript
const ERA_API_URL = 'https://era-backend.railway.app';

// Submit transaction
const response = await fetch(`${ERA_API_URL}/api/poc/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: userAddress,
    to: recipientAddress,
    token: USDC_ADDRESS,
    amount: '1000000',
    signature,
    chainId: 11155111,
    nonce: userNonce,
    deadline: deadline,
    batchSize: 20 // User chooses: 20, 50, or 100
  })
});

const { jobId } = await response.json();
```

### 4. Poll for Settlement

```typescript
// Poll every 2 seconds
const pollInterval = setInterval(async () => {
  const statusResponse = await fetch(
    `${ERA_API_URL}/api/poc/status/${jobId}`
  );
  const status = await statusResponse.json();

  if (status.status === 'completed') {
    clearInterval(pollInterval);
    
    console.log('✅ Transaction settled!');
    console.log(`Gas used: ${status.result.gasComparison.eraGas}`);
    console.log(`Savings: ${status.result.gasComparison.savingsPercent}%`);
    console.log(`Tx hash: ${status.result.settlementTxHash}`);
    
    // Show success to user
    showSuccessNotification(status.result);
  } else if (status.status === 'failed') {
    clearInterval(pollInterval);
    console.error('❌ Transaction failed:', status.error);
  } else {
    console.log(`⏳ ${status.currentPhase} (${status.progress}%)`);
  }
}, 2000);
```

---

## Token Approval (One-Time Setup)

Users must approve ERA settlement contract to transfer tokens on their behalf:

```typescript
import { erc20ABI } from 'wagmi';

const ERA_SETTLEMENT = '0xDb41E9279D4c1BFc3ED90D2B1f0dbc4C4ba08c83';

// Check current allowance
const allowance = await publicClient.readContract({
  address: USDC_ADDRESS,
  abi: erc20ABI,
  functionName: 'allowance',
  args: [userAddress, ERA_SETTLEMENT]
});

// If allowance insufficient, request approval
if (allowance < amount) {
  const { hash } = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: erc20ABI,
    functionName: 'approve',
    args: [ERA_SETTLEMENT, BigInt('0xffffffffffffffffffffffffffffffff')] // Max approval
  });
  
  await publicClient.waitForTransactionReceipt({ hash });
}
```

---

## Swap Integration

For Uniswap/DEX integrations, use `SwapIntent` instead of `TransferIntent`:

```typescript
const swapTypes = {
  SwapIntent: [
    { name: 'from', type: 'address' },
    { name: 'tokenIn', type: 'address' },
    { name: 'tokenOut', type: 'address' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'minAmountOut', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
};

const signature = await walletClient.signTypedData({
  domain,
  types: swapTypes,
  primaryType: 'SwapIntent',
  message: {
    from: userAddress,
    tokenIn: USDC_ADDRESS,
    tokenOut: WETH_ADDRESS,
    amountIn: '1000000', // 1 USDC
    minAmountOut: '300000000000000', // Min WETH (slippage protection)
    nonce: userNonce,
    deadline: deadline
  }
});
```

---

## Testnet Resources

### Sepolia Contracts

| Contract | Address | Etherscan |
|----------|---------|-----------|
| **ERASettlement** | `0xDb41E9279D4c1BFc3ED90D2B1f0dbc4C4ba08c83` | [View](https://sepolia.etherscan.io/address/0xDb41E9279D4c1BFc3ED90D2B1f0dbc4C4ba08c83) |
| **ERAVerifier** | `0xDcac7bd52Ea8ECA2b3941E414153A209508B546f` | [View](https://sepolia.etherscan.io/address/0xDcac7bd52Ea8ECA2b3941E414153A209508B546f) |

### Supported Tokens (Sepolia)

| Token | Address | Decimals |
|-------|---------|----------|
| **USDC** | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | 6 |
| **EURC** | `0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4` | 6 |
| **WETH** | `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` | 18 |

### Get Testnet Tokens

1. **Sepolia ETH:** [sepoliafaucet.com](https://sepoliafaucet.com/)
2. **Test Tokens:** Use our reference app at `era-app` (coming soon)

---

## API Reference

For complete API documentation, see [API_REFERENCE.md](API_REFERENCE.md).

**Key Endpoints:**
- `POST /api/poc/submit` - Submit signed transaction intent
- `GET /api/poc/status/:jobId` - Poll job status
- `GET /api/poc/nonce/:address` - Get current nonce for address

---

## Integration Examples

### Full Reference Implementation

See our Next.js app for a complete working example:
- **GitHub:** [github.com/deusexakira/era-app](https://github.com/deusexakira/era-app)
- **Live Demo:** Coming soon

**Key Files:**
- `lib/api/era.ts` - API client
- `lib/hooks/useERATransfer.ts` - React hook for transfers
- `components/TransferForm.tsx` - Complete UI flow

---

## Error Handling

### Common Errors

**`Insufficient allowance`**
```typescript
// User needs to approve ERA settlement contract
await approveToken(userAddress, tokenAddress);
```

**`Nonce too low`**
```typescript
// Fetch latest nonce from ERA backend
const latestNonce = await fetchUserNonce(userAddress);
```

**`Deadline expired`**
```typescript
// Signature expired, request new signature with future deadline
const newDeadline = Math.floor(Date.now() / 1000) + 3600;
```

**`Unsupported token`**
```typescript
// Only USDC, EURC, WETH supported on testnet
// Mainnet will support expanded token whitelist
```

---

## Gas Savings Breakdown

### Transfer Transactions (ERC20)

| Batch Size | Direct L1 Gas | ERA Gas Per User | Savings |
|------------|---------------|------------------|---------|
| **20** | 45,059 | 18,594 | **58.7%** |
| **50** | 45,059 | 7,296 | **83.8%** |
| **100** | 45,059 | 3,577 | **92.1%** |

### Swap Transactions (Uniswap V2)

| Batch Size | Direct L1 Gas | ERA Gas Per User | Savings |
|------------|---------------|------------------|---------|
| **20** | 101,538 | 21,845 | **78.5%** |
| **50** | 101,538 | 8,877 | **91.3%** |
| **100** | 101,538 | 4,509 | **95.6%** |

**Source:** [GAS_SAVINGS_ANALYSIS.md](../GAS_SAVINGS_ANALYSIS.md)

---

## Batch Size Selection

### How to Choose

| Batch Size | Gas Savings | Best For |
|------------|-------------|----------|
| **20** | 60-78% | Lower latency, faster batch fill |
| **50** | 84-91% | Balanced (default recommendation) |
| **100** | 92-96% | Maximum savings |

**Trade-off:** Larger batches = higher savings but require more transactions to fill. With high-volume partners (DEXs, CEXs, wallets), even batch 100 can fill in seconds. With low volume, batch 20 fills faster.

**User Experience Tip:** Let users choose based on gas savings:
- "Save 60%" vs "Save 85%" vs "Save 92%"

---

## Security Considerations

### EIP-712 Signature Security

✅ **Non-custodial:** Signatures authorize specific actions only  
✅ **Deadline enforcement:** Signatures expire after deadline  
✅ **Nonce management:** Prevents replay attacks  
✅ **Token approval required:** Users maintain control  

### What Users Authorize

When signing, users authorize:
- ✅ Specific token transfer (exact amount, recipient)
- ✅ Time-bound execution (deadline parameter)
- ✅ One-time settlement (nonce prevents reuse)

Users do NOT authorize:
- ❌ Unlimited access to wallet
- ❌ Future transactions without signatures
- ❌ Changes to transaction parameters

---

## Mainnet Readiness

**Current Status: Testnet POC Only**

Before mainnet integration:
- [ ] Complete security audit (planned with EF grant funding)
- [ ] Implement multi-operator decentralization
- [ ] Increase security bits to 80+ (currently 69.5-76.3)
- [ ] Bug bounty program
- [ ] Formal verification of smart contracts

**Timeline:** Mainnet launch estimated Q4 2026 (pending audit + EF guidance)

**Stay Updated:**
- **Discord:** [discord.gg/eraprotocol](https://discord.gg/eraprotocol)
- **Twitter:** [@ERAProtocol](https://twitter.com/ERAProtocol)
- **GitHub:** [github.com/deusexakira/era-app](https://github.com/deusexakira/era-app)

---

## Support & Contribution

### Get Help

- **Discord:** [Join our community](https://discord.gg/eraprotocol)
- **GitHub Issues:** [Report bugs or request features](https://github.com/deusexakira/era-app/issues)
- **Email:** developers@eraprotocol.xyz (coming soon)

### Contribute

ERA Protocol is open source (MIT License). We welcome:
- 🐛 Bug reports and fixes
- 💡 Feature suggestions
- 📖 Documentation improvements
- 🔧 Integration examples
- 🧪 Test coverage

**See:** [CONTRIBUTING.md](../../CONTRIBUTING.md) (coming soon)

---

## License

ERA Protocol is MIT licensed. Integrate freely, commercially or non-commercially.

---

**Built with ❤️ for the Ethereum developer community**

*Questions? Join our Discord or open a GitHub issue.*
