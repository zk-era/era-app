# ERA Protocol - Integration Guide

**Version:** 1.0.0  
**Last Updated:** March 5, 2026  
**Target Audience:** Developers integrating ERA into dApps

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Basic Integration](#basic-integration)
4. [Send Flow Integration](#send-flow-integration)
5. [Swap Flow Integration](#swap-flow-integration)
6. [Status Polling](#status-polling)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Example Integrations](#example-integrations)

---

## Quick Start

Add ERA to your dApp in **3 steps**:

1. **Sign an intent** (EIP-712, off-chain, free)
2. **Submit to ERA** (POST to backend API)
3. **Poll for result** (GET status endpoint)

**Result:** Your users save 60-77% on gas! 🎉

---

## Installation

### Prerequisites

```bash
# Required
- Node.js 18+
- ethers.js v6 or viem v2
- User's wallet (MetaMask, Coinbase, etc.)

# Optional
- @rainbow-me/rainbowkit (wallet connection)
- wagmi (React hooks for Ethereum)
```

### Install Dependencies

```bash
npm install ethers@6
# or
npm install viem@2
```

**Note:** ERA SDK coming Q3 2026 (`@era-protocol/sdk`)

---

## Basic Integration

### 1. Get User's Nonce

Before signing, fetch the user's current nonce from the contract:

```typescript
import { ethers } from 'ethers'

const ERA_API_URL = 'https://erabackend-production.up.railway.app'

async function getNonce(userAddress: string): Promise<number> {
  const response = await fetch(`${ERA_API_URL}/v1/poc/nonce/${userAddress}`)
  const data = await response.json()
  return data.nonce
}
```

---

### 2. Generate EIP-712 Signature

**Using ethers.js v6:**

```typescript
import { ethers } from 'ethers'

const EIP712_DOMAIN = {
  name: 'ERA Protocol',
  version: '1',
  chainId: 11155111, // Sepolia
  verifyingContract: '0x1FF49FbcD8e712c524a14C651aaF955d4524d216'
}

const TRANSFER_INTENT_TYPES = {
  TransferIntent: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ]
}

async function signTransferIntent(
  signer: ethers.Signer,
  to: string,
  token: string,
  amount: bigint
): Promise<string> {
  const from = await signer.getAddress()
  const nonce = await getNonce(from)
  const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour

  const message = {
    from,
    to,
    token,
    amount,
    nonce: BigInt(nonce),
    deadline: BigInt(deadline)
  }

  // Sign with EIP-712
  const signature = await signer.signTypedData(
    EIP712_DOMAIN,
    TRANSFER_INTENT_TYPES,
    message
  )

  return signature
}
```

**Using viem:**

```typescript
import { signTypedData } from 'viem/accounts'
import { parseUnits } from 'viem'

async function signTransferIntent(
  walletClient: any,
  to: string,
  token: string,
  amount: string
) {
  const [from] = await walletClient.getAddresses()
  const nonce = await getNonce(from)
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)

  const signature = await walletClient.signTypedData({
    domain: {
      name: 'ERA Protocol',
      version: '1',
      chainId: 11155111,
      verifyingContract: '0x1FF49FbcD8e712c524a14C651aaF955d4524d216'
    },
    types: {
      TransferIntent: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ]
    },
    primaryType: 'TransferIntent',
    message: {
      from,
      to,
      token,
      amount: parseUnits(amount, 6), // USDC has 6 decimals
      nonce: BigInt(nonce),
      deadline
    }
  })

  return signature
}
```

---

### 3. Submit to ERA Backend

```typescript
interface SubmitIntentRequest {
  from: string
  to: string
  token: string
  amount: string
  signature: string
  chainId: number
  nonce: number
  deadline: number
  batchSize: 20 | 50 | 100 // User preference
}

interface SubmitIntentResponse {
  jobId: string
  status: 'pending'
  pollUrl: string
}

async function submitIntent(intent: SubmitIntentRequest): Promise<string> {
  const response = await fetch(`${ERA_API_URL}/v1/poc/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(intent)
  })

  if (!response.ok) {
    throw new Error(`Failed to submit: ${response.statusText}`)
  }

  const data: SubmitIntentResponse = await response.json()
  return data.jobId
}
```

---

### 4. Poll for Status

```typescript
interface JobStatus {
  status: 'pending' | 'building_batch' | 'generating_proof' | 'settling' | 'completed' | 'failed'
  progress: number // 0-100
  result?: {
    settlementTxHash: string
    etherscanUrl: string
    gasComparison: {
      directL1Gas: number
      eraGas: number
      savedGas: number
      savingsPercent: number
      directL1CostUsd: string
      eraCostUsd: string
      savedUsd: string
    }
  }
  error?: string
}

async function pollStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${ERA_API_URL}/v1/poc/status/${jobId}`)
  const data: JobStatus = await response.json()
  return data
}

// Poll every 2 seconds until completed
async function waitForCompletion(jobId: string): Promise<JobStatus> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await pollStatus(jobId)
        
        if (status.status === 'completed') {
          clearInterval(interval)
          resolve(status)
        } else if (status.status === 'failed') {
          clearInterval(interval)
          reject(new Error(status.error || 'Transaction failed'))
        }
      } catch (error) {
        clearInterval(interval)
        reject(error)
      }
    }, 2000)
  })
}
```

---

## Send Flow Integration

### Complete Example: Send USDC via ERA

```typescript
import { ethers } from 'ethers'

const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Sepolia USDC

async function sendUSDCviaERA(
  signer: ethers.Signer,
  recipientAddress: string,
  amountUSD: string
) {
  try {
    // 1. Get user address
    const from = await signer.getAddress()
    
    // 2. Parse amount (USDC has 6 decimals)
    const amount = ethers.parseUnits(amountUSD, 6)
    
    // 3. Get nonce
    const nonce = await getNonce(from)
    const deadline = Math.floor(Date.now() / 1000) + 3600
    
    // 4. Sign EIP-712 intent
    const signature = await signer.signTypedData(
      {
        name: 'ERA Protocol',
        version: '1',
        chainId: 11155111,
        verifyingContract: '0x1FF49FbcD8e712c524a14C651aaF955d4524d216'
      },
      {
        TransferIntent: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ]
      },
      {
        from,
        to: recipientAddress,
        token: USDC_ADDRESS,
        amount: amount.toString(),
        nonce: BigInt(nonce),
        deadline: BigInt(deadline)
      }
    )
    
    // 5. Submit to ERA
    const jobId = await submitIntent({
      from,
      to: recipientAddress,
      token: USDC_ADDRESS,
      amount: amount.toString(),
      signature,
      chainId: 11155111,
      nonce,
      deadline,
      batchSize: 20
    })
    
    console.log(`Transaction submitted! Job ID: ${jobId}`)
    
    // 6. Wait for completion
    const result = await waitForCompletion(jobId)
    
    console.log(`Transaction complete!`)
    console.log(`Etherscan: ${result.result?.etherscanUrl}`)
    console.log(`Gas saved: ${result.result?.gasComparison.savingsPercent}%`)
    console.log(`USD saved: $${result.result?.gasComparison.savedUsd}`)
    
    return result
  } catch (error) {
    console.error('Send failed:', error)
    throw error
  }
}

// Usage
const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()

await sendUSDCviaERA(
  signer,
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // vitalik.eth
  '50.00' // $50 USDC
)
```

---

## Swap Flow Integration

### Complete Example: Swap USDC → WETH via ERA

```typescript
const SWAP_INTENT_TYPES = {
  SwapIntent: [
    { name: 'from', type: 'address' },
    { name: 'tokenIn', type: 'address' },
    { name: 'tokenOut', type: 'address' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'amountOutMin', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ]
}

async function swapViaERA(
  signer: ethers.Signer,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  amountOutMin: string
) {
  try {
    const from = await signer.getAddress()
    const nonce = await getNonce(from)
    const deadline = Math.floor(Date.now() / 1000) + 3600
    
    const amountInBigInt = ethers.parseUnits(amountIn, 6) // USDC decimals
    const amountOutMinBigInt = ethers.parseUnits(amountOutMin, 18) // WETH decimals
    
    // Sign swap intent
    const signature = await signer.signTypedData(
      {
        name: 'ERA Protocol',
        version: '1',
        chainId: 11155111,
        verifyingContract: '0x1FF49FbcD8e712c524a14C651aaF955d4524d216'
      },
      SWAP_INTENT_TYPES,
      {
        from,
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountInBigInt.toString(),
        amountOutMin: amountOutMinBigInt.toString(),
        nonce: BigInt(nonce),
        deadline: BigInt(deadline)
      }
    )
    
    // Submit swap intent
    const response = await fetch(`${ERA_API_URL}/v1/poc/submit-swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountInBigInt.toString(),
        amountOutMin: amountOutMinBigInt.toString(),
        signature,
        chainId: 11155111,
        nonce,
        deadline,
        batchSize: 20
      })
    })
    
    const { jobId } = await response.json()
    const result = await waitForCompletion(jobId)
    
    console.log(`Swap complete! Saved ${result.result?.gasComparison.savingsPercent}%`)
    return result
  } catch (error) {
    console.error('Swap failed:', error)
    throw error
  }
}
```

---

## Status Polling

### Advanced Polling with Progress Updates

```typescript
type StatusCallback = (status: JobStatus) => void

async function pollWithUpdates(
  jobId: string,
  onStatusUpdate: StatusCallback
): Promise<JobStatus> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await pollStatus(jobId)
        
        // Call callback with latest status
        onStatusUpdate(status)
        
        if (status.status === 'completed') {
          clearInterval(interval)
          resolve(status)
        } else if (status.status === 'failed') {
          clearInterval(interval)
          reject(new Error(status.error || 'Unknown error'))
        }
      } catch (error) {
        clearInterval(interval)
        reject(error)
      }
    }, 2000)
    
    // Timeout after 3 minutes
    setTimeout(() => {
      clearInterval(interval)
      reject(new Error('Timeout: Transaction took too long'))
    }, 180000)
  })
}

// Usage with React
function SendComponent() {
  const [status, setStatus] = useState<JobStatus | null>(null)
  
  const handleSend = async () => {
    const jobId = await submitIntent(/* ... */)
    
    const result = await pollWithUpdates(jobId, (newStatus) => {
      setStatus(newStatus)
      
      // Update UI based on status
      switch (newStatus.status) {
        case 'pending':
          console.log('Waiting for batch...')
          break
        case 'building_batch':
          console.log('Building batch...')
          break
        case 'generating_proof':
          console.log('Generating proof...')
          break
        case 'settling':
          console.log('Settling on L1...')
          break
      }
    })
    
    console.log('Done!', result)
  }
  
  return (
    <div>
      <button onClick={handleSend}>Send</button>
      {status && <p>Status: {status.status} ({status.progress}%)</p>}
    </div>
  )
}
```

---

## Error Handling

### Common Errors and Solutions

```typescript
async function submitWithErrorHandling(intent: SubmitIntentRequest) {
  try {
    const jobId = await submitIntent(intent)
    return jobId
  } catch (error: any) {
    // Parse error response
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          throw new Error(`Invalid intent: ${data.message}`)
        case 401:
          throw new Error('Signature verification failed')
        case 409:
          throw new Error('Nonce already used (transaction already submitted)')
        case 429:
          throw new Error('Rate limit exceeded, try again in a moment')
        case 500:
          throw new Error('Backend error, please try again')
        default:
          throw new Error(`Unknown error: ${data.message}`)
      }
    }
    
    // Network errors
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Cannot reach ERA backend')
    }
    
    throw error
  }
}

// User-facing error messages
const ERROR_MESSAGES: Record<string, string> = {
  'signature_invalid': 'Signature verification failed. Please try again.',
  'nonce_mismatch': 'Transaction already submitted or nonce out of sync.',
  'insufficient_balance': 'Insufficient token balance.',
  'token_not_approved': 'Please approve ERA to spend your tokens first.',
  'deadline_expired': 'Transaction expired. Please create a new one.',
  'batch_failed': 'Batch settlement failed. Your funds are safe.',
}

function getUserFriendlyError(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || 'An unknown error occurred. Please try again.'
}
```

---

## Best Practices

### 1. Token Approvals

Before users can send tokens via ERA, they must approve the ERASettlement contract:

```typescript
import { ethers } from 'ethers'

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
]

async function ensureApproval(
  signer: ethers.Signer,
  tokenAddress: string,
  amount: bigint
) {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer)
  const userAddress = await signer.getAddress()
  const settlementAddress = '0x1FF49FbcD8e712c524a14C651aaF955d4524d216'
  
  // Check current allowance
  const allowance = await token.allowance(userAddress, settlementAddress)
  
  if (allowance < amount) {
    console.log('Requesting token approval...')
    const tx = await token.approve(settlementAddress, amount)
    await tx.wait()
    console.log('Approval granted!')
  }
}
```

---

### 2. Nonce Management

**Always fetch fresh nonces before signing:**

```typescript
// ❌ BAD: Reusing old nonce
const nonce = 5
const signature1 = await sign({ ..., nonce })
const signature2 = await sign({ ..., nonce }) // WRONG!

// ✅ GOOD: Fetch fresh nonce each time
const nonce1 = await getNonce(userAddress)
const signature1 = await sign({ ..., nonce: nonce1 })

const nonce2 = await getNonce(userAddress) // Will be nonce1 + 1 after first settles
const signature2 = await sign({ ..., nonce: nonce2 })
```

---

### 3. Gas Estimates

Show users expected gas savings before submission:

```typescript
async function getGasEstimate(
  tokenAddress: string,
  batchSize: number
): Promise<{ directCost: string, eraCost: string, savings: string }> {
  const response = await fetch(`${ERA_API_URL}/v1/poc/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenAddress, batchSize })
  })
  
  const data = await response.json()
  
  return {
    directCost: data.directL1CostUsd,
    eraCost: data.eraCostUsd,
    savings: data.savingsPercent
  }
}

// Show in UI
const estimate = await getGasEstimate(USDC_ADDRESS, 20)
console.log(`Direct L1: $${estimate.directCost}`)
console.log(`With ERA: $${estimate.eraCost} (Save ${estimate.savings}%)`)
```

---

### 4. Batch Size Selection

Let users choose batch size vs wait time:

```typescript
const BATCH_OPTIONS = [
  { size: 20, savings: '65%', waitTime: '~60s', label: 'Fast' },
  { size: 50, savings: '85%', waitTime: '~90s', label: 'Balanced' },
  { size: 100, savings: '93%', waitTime: '~120s', label: 'Max Savings' }
]

function BatchSizeSelector({ onChange }: { onChange: (size: number) => void }) {
  return (
    <div>
      {BATCH_OPTIONS.map(option => (
        <button key={option.size} onClick={() => onChange(option.size)}>
          {option.label} - Save {option.savings} (Wait {option.waitTime})
        </button>
      ))}
    </div>
  )
}
```

---

## Example Integrations

### 1. Wallet Integration

```typescript
// Add "Send via ERA" option in wallet
class ERASendProvider {
  async send(to: string, token: string, amount: string) {
    const signer = await this.getSigner()
    
    // Show gas comparison
    const estimate = await getGasEstimate(token, 20)
    const userConfirmed = await this.showConfirmDialog({
      message: `Send ${amount} to ${to}`,
      directCost: estimate.directCost,
      eraCost: estimate.eraCost,
      savings: estimate.savings
    })
    
    if (!userConfirmed) return
    
    // Execute via ERA
    const result = await sendUSDCviaERA(signer, to, amount)
    
    // Show success notification
    this.showSuccess({
      txHash: result.result?.settlementTxHash,
      savedUsd: result.result?.gasComparison.savedUsd
    })
  }
}
```

---

### 2. Payroll dApp

```typescript
// Batch payroll payments via ERA
async function processPayroll(employees: Employee[]) {
  const signer = await getSigner()
  const jobIds: string[] = []
  
  // Submit all employee payments
  for (const employee of employees) {
    const jobId = await submitIntent({
      from: await signer.getAddress(),
      to: employee.walletAddress,
      token: USDC_ADDRESS,
      amount: ethers.parseUnits(employee.salary, 6).toString(),
      signature: await signTransferIntent(signer, employee.walletAddress, USDC_ADDRESS, employee.salary),
      chainId: 11155111,
      nonce: await getNonce(await signer.getAddress()),
      deadline: Math.floor(Date.now() / 1000) + 3600,
      batchSize: 50 // Large batch for max savings
    })
    
    jobIds.push(jobId)
  }
  
  // Wait for all to complete
  const results = await Promise.all(jobIds.map(waitForCompletion))
  
  const totalSaved = results.reduce((sum, r) => 
    sum + parseFloat(r.result?.gasComparison.savedUsd || '0'), 0
  )
  
  console.log(`Payroll complete! Total saved: $${totalSaved.toFixed(2)}`)
}
```

---

### 3. DEX Integration

```typescript
// Add "Trade via ERA" option
async function tradeWithERA(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  slippage: number
) {
  // Get quote from Uniswap
  const quote = await getUniswapQuote(tokenIn, tokenOut, amountIn)
  const amountOutMin = quote.amountOut * (1 - slippage / 100)
  
  // Show savings
  const directGas = 150000 // Standard Uniswap swap
  const eraGas = 40500 // ERA batch of 20
  const savingsPercent = ((directGas - eraGas) / directGas * 100).toFixed(0)
  
  console.log(`Save ${savingsPercent}% on gas with ERA!`)
  
  // Execute swap
  const signer = await getSigner()
  const result = await swapViaERA(signer, tokenIn, tokenOut, amountIn, amountOutMin.toString())
  
  return result
}
```

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/poc/submit` | Submit send intent |
| `POST` | `/v1/poc/submit-swap` | Submit swap intent |
| `GET` | `/v1/poc/status/:jobId` | Get job status |
| `GET` | `/v1/poc/nonce/:address` | Get user's nonce |
| `POST` | `/v1/poc/estimate` | Get gas cost estimate |
| `GET` | `/v1/poc/info` | Get protocol info |

### Contract Addresses

| Contract | Network | Address |
|----------|---------|---------|
| ERASettlement | Sepolia | `0x1FF49FbcD8e712c524a14C651aaF955d4524d216` |
| ERASettlement | Mainnet | *Coming Q3 2026* |

### Supported Tokens (Sepolia)

| Token | Address |
|-------|---------|
| USDC | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| WETH | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` |
| EURC | `0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4` |
| PYUSD | `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9` |

---

## Next Steps

1. **Read [ARCHITECTURE.md](ARCHITECTURE.md)** - Understand how ERA works
2. **Test on Sepolia** - Deploy to testnet first
3. **Join Discord** - Ask questions, share feedback
4. **Wait for SDK** - Full SDK coming Q3 2026

---

**Need Help?**
- **Discord:** [discord.gg/eraprotocol](https://discord.gg/eraprotocol)
- **Email:** developers@eraprotocol.xyz
- **Docs:** [docs.eraprotocol.xyz](https://docs.eraprotocol.xyz)

**Happy Building! 🚀**
