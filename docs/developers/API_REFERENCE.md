# ERA Protocol API Reference

**Base URL (Testnet):** `https://era-backend.railway.app`

---

## Authentication

**Current (Testnet POC):** No API key required  
**Mainnet:** API keys will be required for rate limiting and abuse prevention

---

## Endpoints

### POST /api/poc/submit

Submit a signed transaction intent for batched processing.

**Request Body:**

```typescript
interface POCSubmitRequest {
  from: string;           // User address (0x...)
  to: string;             // Recipient address (0x...)
  token: string;          // ERC20 token address (0x...)
  amount: string;         // Amount in token's smallest unit (e.g., "1000000" for 1 USDC)
  signature: string;      // EIP-712 signature (0x...)
  chainId: number;        // 11155111 (Sepolia)
  nonce: number;          // User's current nonce (fetch from /api/poc/nonce/{address})
  deadline: number;       // Unix timestamp (seconds)
  batchSize: 20 | 50 | 100;  // Target batch size
}
```

**Example Request:**

```bash
curl -X POST https://era-backend.railway.app/api/poc/submit \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0xE46A1e0698590F760E5a7A379cBf0540bCd19F70",
    "to": "0xC734979fF89c8F46E3622599E87E3EABf8B18E3D",
    "token": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    "amount": "1000000",
    "signature": "0x5787fdd4c83c3e435743c0e0e2b3c8aa9f7c9d92f1c8e6a4b5d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e1b",
    "chainId": 11155111,
    "nonce": 15,
    "deadline": 1772810038,
    "batchSize": 20
  }'
```

**Success Response (200 OK):**

```json
{
  "jobId": "poc_mmeyly3v_f6hqjj",
  "status": "pending",
  "message": "Transaction submitted for batch processing",
  "estimatedCompletion": "2026-03-06T16:06:30Z"
}
```

**Error Responses:**

**400 Bad Request - Invalid Parameters**
```json
{
  "error": "Invalid request",
  "details": "Invalid signature format"
}
```

**400 Bad Request - Unsupported Token**
```json
{
  "error": "Unsupported token",
  "message": "Token 0x... not in whitelist. Supported: USDC, EURC, WETH",
  "supportedTokens": [
    "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
    "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"
  ]
}
```

**400 Bad Request - Insufficient Allowance**
```json
{
  "error": "Insufficient token allowance",
  "message": "User must approve ERA settlement contract",
  "requiredApproval": {
    "spender": "0xDb41E9279D4c1BFc3ED90D2B1f0dbc4C4ba08c83",
    "amount": "1000000"
  }
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "Failed to process transaction"
}
```

---

### GET /api/poc/status/:jobId

Poll job status and retrieve results when completed.

**URL Parameters:**
- `jobId` (string, required): Job ID returned from `/api/poc/submit`

**Example Request:**

```bash
curl https://era-backend.railway.app/api/poc/status/poc_mmeyly3v_f6hqjj
```

**Response - Pending:**

```json
{
  "jobId": "poc_mmeyly3v_f6hqjj",
  "status": "pending",
  "progress": 0,
  "message": "Transaction queued for batch processing",
  "estimatedCompletion": "2026-03-06T16:06:30Z"
}
```

**Response - Processing (Proof Generation):**

```json
{
  "jobId": "poc_mmeyly3v_f6hqjj",
  "status": "generating_proof",
  "progress": 60,
  "currentPhase": "fri_commitment",
  "message": "Generating zkSTARK proof...",
  "estimatedCompletion": "2026-03-06T16:06:30Z"
}
```

**Response - Completed:**

```json
{
  "jobId": "poc_mmeyly3v_f6hqjj",
  "status": "completed",
  "progress": 100,
  "message": "Transaction settled successfully",
  "result": {
    "batchId": "0x41fc11817a362d1d075c0c3e44697eb096d0b81c268b1ddb813c952e9e5fa1b9",
    "settlementTxHash": "0x3feb1a2e1898f57219e4a70cd30352ee8730f7d8154d5cde74d76a01c7663b77",
    "etherscanUrl": "https://sepolia.etherscan.io/tx/0x3feb1a2e1898f57219e4a70cd30352ee8730f7d8154d5cde74d76a01c7663b77",
    "blockNumber": 10397158,
    "gasComparison": {
      "directL1Gas": 45059,
      "eraGas": 18594,
      "savedGas": 26465,
      "savingsPercent": 58.7
    },
    "timing": {
      "paddingFetchMs": 305,
      "proofGenerationMs": 7983,
      "settlementMs": 12000,
      "totalMs": 20288
    },
    "proofMetadata": {
      "securityBits": 76.3,
      "domainSize": 2048,
      "queries": 21,
      "friRounds": 9
    }
    // proofMetadata notes:
    // securityBits: 76.3 at batch 20, 69.5 at batch 50/100.
    // Breaking this proof requires ~7×10²⁰ operations — hundreds of billions
    // of dollars of compute sustained over decades. Proportionate to assets
    // protected per settlement window (minutes to hours, not years).
    // Parameters reviewed against threat model prior to mainnet.
  }
}
```

**Response - Failed:**

```json
{
  "jobId": "poc_mmeyly3v_f6hqjj",
  "status": "failed",
  "progress": 0,
  "error": "Proof generation failed",
  "message": "zkSTARK proof generation encountered an error",
  "details": "Polynomial interpolation failed: degree exceeds domain size"
}
```

**Status Values:**

| Status | Description |
|--------|-------------|
| `pending` | Transaction queued, waiting for batch to fill |
| `generating_proof` | zkSTARK proof generation in progress |
| `submitting` | Proof generated, submitting to L1 |
| `completed` | Transaction settled on-chain successfully |
| `failed` | Transaction processing failed (see error) |

**Error Response (404 Not Found):**

```json
{
  "error": "Job not found",
  "message": "No job found with ID: poc_invalid_job"
}
```

---

### GET /api/poc/nonce/:address

Get the current nonce for an address (required for EIP-712 signature generation).

**URL Parameters:**
- `address` (string, required): Ethereum address (0x...)

**Example Request:**

```bash
curl https://era-backend.railway.app/api/poc/nonce/0xE46A1e0698590F760E5a7A379cBf0540bCd19F70
```

**Success Response (200 OK):**

```json
{
  "address": "0xE46A1e0698590F760E5a7A379cBf0540bCd19F70",
  "nonce": 15,
  "message": "Current nonce for address"
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Invalid address format",
  "message": "Address must be a valid Ethereum address (0x...)"
}
```

**Notes:**
- Nonce starts at 0 for new addresses
- Nonce increments with each successful settlement
- Always fetch latest nonce before generating signature
- Nonce prevents replay attacks (each signature can only be used once)

---

## EIP-712 Signature Format

### Transfer Intent Domain

```typescript
const domain = {
  name: 'ERA Protocol',
  version: '1',
  chainId: 11155111, // Sepolia
  verifyingContract: '0xDb41E9279D4c1BFc3ED90D2B1f0dbc4C4ba08c83' // ERASettlement
};
```

### Transfer Intent Types

```typescript
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
```

### Example Message

```typescript
const message = {
  from: '0xE46A1e0698590F760E5a7A379cBf0540bCd19F70',
  to: '0xC734979fF89c8F46E3622599E87E3EABf8B18E3D',
  token: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
  amount: '1000000', // 1 USDC (6 decimals)
  nonce: 15,
  deadline: 1772810038 // Unix timestamp (seconds)
};
```

### Swap Intent Types

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
```

---

## Rate Limits

**Testnet (Current):** No rate limits enforced (open for developer testing and integration)

**Mainnet (Future):**
- API key required for authentication
- Tiered rate limits based on usage tier
- Premium tier for high-volume integrations (DEXs, wallets, etc.)

**Rate limit details will be published closer to mainnet launch.**

---

## Webhooks (Coming Soon)

Instead of polling `/api/poc/status/:jobId`, you'll be able to register webhooks for real-time notifications:

```typescript
// Future API (not yet available)
POST /api/webhooks/register
{
  "url": "https://your-app.com/era-webhook",
  "events": ["batch.completed", "batch.failed"]
}
```

**Webhook Payload (Preview):**

```json
{
  "event": "batch.completed",
  "timestamp": "2026-03-06T16:06:45Z",
  "data": {
    "jobId": "poc_mmeyly3v_f6hqjj",
    "batchId": "0x41fc11...",
    "txHash": "0x3feb1a2e...",
    "gasSavings": 58.7
  }
}
```

---



## Error Codes Reference

| HTTP Code | Error | Description |
|-----------|-------|-------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid parameters or signature |
| 404 | Not Found | Job ID not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side processing error |
| 503 | Service Unavailable | Backend temporarily unavailable |

---

## Testing

### cURL Examples

**Submit Transfer:**

```bash
# 1. Get nonce
NONCE=$(curl -s https://era-backend.railway.app/api/poc/nonce/0xYourAddress | jq -r '.nonce')

# 2. Generate signature (use ethers.js or wagmi)
# See INTEGRATION_GUIDE.md for EIP-712 signing examples

# 3. Submit transaction
curl -X POST https://era-backend.railway.app/api/poc/submit \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0xYourAddress",
    "to": "0xRecipientAddress",
    "token": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    "amount": "1000000",
    "signature": "0xYourSignature",
    "chainId": 11155111,
    "nonce": '$NONCE',
    "deadline": '$(date -d '+1 hour' +%s)',
    "batchSize": 20
  }'

# 4. Poll status
JOB_ID="poc_mmeyly3v_f6hqjj"
while true; do
  STATUS=$(curl -s https://era-backend.railway.app/api/poc/status/$JOB_ID | jq -r '.status')
  echo "Status: $STATUS"
  [ "$STATUS" == "completed" ] && break
  [ "$STATUS" == "failed" ] && break
  sleep 2
done
```

---

## Support

- **Integration Questions:** [Discord](https://discord.gg/eraprotocol)
- **Bug Reports:** [GitHub Issues](https://github.com/deusexakira/era-app/issues)

---

## Changelog

### v1.0.0-testnet (Current)
- Initial testnet release (Sepolia)
- POST /api/poc/submit
- GET /api/poc/status/:jobId
- GET /api/poc/nonce/:address
- Support for USDC, EURC, WETH
- Batch sizes: 20, 50, 100

**Mainnet API will have breaking changes. Subscribe to updates:** [GitHub Releases](https://github.com/deusexakira/era-app/releases)

---

**Built with ❤️ for Ethereum developers**

*Questions? Join our [Discord](https://discord.gg/eraprotocol) or open a [GitHub Issue](https://github.com/deusexakira/era-app/issues).*
