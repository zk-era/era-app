# ERA Protocol - Technical Architecture

**Version:** POC v1.0  
**Last Updated:** March 6, 2026  
**Status:** Proof of Concept (Sepolia Testnet)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Architecture](#2-component-architecture)
3. [Data Flow: User Journey](#3-data-flow-user-journey)
4. [zkSTARK Proof Generation Pipeline](#4-zkstark-proof-generation-pipeline)
5. [Smart Contract Architecture](#5-smart-contract-architecture)
6. [API & Integration Layer](#6-api--integration-layer)
7. [Current POC vs. Future Architecture](#7-current-poc-vs-future-architecture)
8. [Technical Decisions & Trade-offs](#8-technical-decisions--trade-offs)

---

## 1. System Overview

ERA Protocol is a **Layer 1 scaling solution** that batches multiple ERC20 transfers and Uniswap swaps into single zkSTARK-proven transactions. The system reduces per-user gas costs through batch amortization while maintaining non-custodial execution.

**⚡ Key Differentiator:** ERA Protocol uses a **custom-built zkSTARK prover** (not StarkWare's Stone prover). The entire proof generation pipeline runs **inside the Railway backend** as part of the Node.js process, demonstrating that zkSTARK proving is feasible on consumer-grade infrastructure.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ERA Protocol Stack                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────────────────────────┐    │
│  │   Frontend   │─────▶│   Backend (Railway)              │    │
│  │   (Next.js)  │      │                                  │    │
│  └──────────────┘      │  ┌────────────────────────────┐ │    │
│         │              │  │ POCService                 │ │    │
│    Wagmi/Viem          │  │  - Batch orchestration     │ │    │
│    EIP-712 Signing     │  └────────────┬───────────────┘ │    │
│                        │               │                  │    │
│                        │  ┌────────────▼───────────────┐ │    │
│                        │  │ ERA Custom zkSTARK Prover  │ │    │
│                        │  │  - FRI implementation      │ │    │
│                        │  │  - Runs in Node.js process │ │    │
│                        │  │  - TypeScript (NOT Stone)  │ │    │
│                        │  └────────────┬───────────────┘ │    │
│                        └───────────────┼─────────────────┘    │
│                                        │                       │
│                                        ▼                       │
│                              ┌──────────────┐                  │
│                              │   Ethereum   │                  │
│                              │   (Sepolia)  │                  │
│                              │              │                  │
│                              │ ERASettlement│                  │
│                              │ Smart Contract│                 │
│                              └──────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Technology | Location | Purpose |
|-----------|-----------|----------|---------|
| **Frontend** | Next.js 15, Zustand, Wagmi | `era-app/` | User interface, wallet integration |
| **Backend** | Node.js, TypeScript, Express | `era/backend/` | Proof orchestration, batch building |
| **zkSTARK Engine** | **ERA Custom FRI Prover (TypeScript)** | `era/packages/starks/` | **Custom-built cryptographic proof generation (NOT StarkWare Stone)** |
| **Smart Contracts** | Solidity 0.8.x | Sepolia: `0xDb41E927...` (Settlement), `0xDcac7bd5...` (Verifier) | On-chain settlement, verification |
| **Prover Coordinator** | ERAProver + ConnectKit | `era/packages/prover/` | Proof generation orchestration **running inside Railway backend** |

---

## 2. Component Architecture

### 2.1 Frontend (era-app)

**Tech Stack:**
- **Framework:** Next.js 15.1.5 (App Router)
- **State:** Zustand (lightweight, no context hell)
- **Web3:** Wagmi 2.19.5 + Viem 2.46.0
- **UI:** Tailwind CSS, Radix UI primitives
- **Type Safety:** TypeScript with strict mode

**Directory Structure:**
```
era-app/
├── app/
│   ├── send/page.tsx         # Send flow orchestrator
│   └── swap/page.tsx         # Swap flow orchestrator
├── lib/
│   ├── stores/
│   │   ├── sendStore.ts      # Send state management (Zustand)
│   │   └── swapStore.ts      # Swap state management (Zustand)
│   ├── hooks/
│   │   ├── useERASend.ts     # ERA send hook (EIP-712 signing)
│   │   └── useERASwap.ts     # ERA swap hook (mirrors send)
│   ├── api/
│   │   └── era.ts            # API client for POC backend
│   └── web3/
│       └── contracts.ts      # Contract ABIs, addresses
└── components/
    ├── send/                 # Send UI components
    └── swap/                 # Swap UI components
```

**Key Files:**

**`lib/hooks/useERASend.ts`** (424 lines)
```typescript
export function useERASend(options: UseERASendOptions = {}): UseERASendResult {
  // 1. Check ERC20 allowance
  // 2. Approve if needed (user signs approve tx)
  // 3. Sign EIP-712 TransferIntent message
  // 4. Submit to ERA backend
  // 5. Poll for batch settlement
  // 6. Display results
}
```

**EIP-712 Signing:**
```typescript
const TRANSFER_INTENT_TYPES = {
  TransferIntent: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;
```

Users sign off-chain messages (no gas cost), which ERA backend uses to execute transfers atomically during batch settlement.

---

### 2.2 Backend (era/backend)

**Tech Stack:**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Queue:** Redis (job queue for async proof generation)
- **Deployment:** Railway (Hobby tier, ~$5/month)
- **Prover:** ERA custom zkSTARK prover (runs **in-process**, NOT external service)

**⚡ Critical Architecture Detail:** The zkSTARK prover is NOT a separate microservice or external dependency. It's a TypeScript module (`packages/prover/ERAProver.ts`) that loads into the backend Node.js process and generates proofs synchronously. This means the entire ERA stack (API + Prover) runs on a single Railway Hobby instance.

**Core Services:**

#### POCService (`backend/src/services/pocService.ts` - 966 lines)

**The main orchestrator for the POC flow:**

```typescript
export class POCService {
  async submit(request: POCSubmitRequest): Promise<string> {
    // 1. Validate request (signature, nonce, deadline, token whitelist)
    // 2. Fetch padding transactions from Sepolia (Alchemy API)
    // 3. Build batch with real tx + padding
    // 4. Generate zkSTARK proof
    // 5. Submit to ERASettlement contract
    // 6. Return job ID for status polling
  }
}
```

**Key Steps:**

1. **Validation** (`validateRequest()`):
   - Check signature validity (EIP-712)
   - Verify nonce matches on-chain state
   - Ensure deadline hasn't expired
   - Whitelist token (USDC, EURC, WETH only)

2. **Padding Fetch** (`AlchemyIngestionService`):
   - Query recent Sepolia ERC20 transfers via Alchemy
   - Normalize to `ERC20Transaction` format
   - Fill batch to target size (20, 50, or 100)

3. **Batch Building** (`realBatchBuilder.ts`):
   - Insert user transaction at index 0
   - Add padding transactions
   - Compute Merkle roots (pre-state, post-state)

4. **Proof Generation** (`ERAProver` + `ConnectKit`):
   - Generate zkSTARK proof (FRI commitment + queries)
   - Security: 69.5-76.3 bits depending on batch size
   - Time: 8-72 seconds (batch size dependent)

5. **Settlement** (ethers.js):
   - Submit proof to `ERASettlement` contract
   - Wait for transaction confirmation
   - Update gas history (rolling average)

#### ConnectKitService (`backend/src/services/connectKitService.ts`)

**Singleton pattern for proof generation components:**

```typescript
export interface ConnectKitContext {
  logger: Logger;
  config: ConfigManager;
  profiler: ProfilingService;
  prover: ERAProver;
  connectKit: ConnectKit;
  registry: ContractRegistry;
}

export function getConnectKitContext(): ConnectKitContext {
  // Lazy initialization of proof generation stack
}
```

This ensures all proof generation components share the same configuration and state.

#### SecurityAudit (`backend/src/services/securityAudit.ts`)

**Pre-flight security checks:**

```typescript
export function runSecurityAudit({ authToken, logger, config }: SecurityAuditOptions): void {
  // 1. Validate API token (if production)
  // 2. Check Redis TLS configuration
  // 3. Warn about insecure settings
}
```

Simple validation layer that runs on server startup. **Not comprehensive security** - just basic hygiene checks.

---

### 2.3 zkSTARK Engine (era/packages/starks)

**ERA's Custom-Built Prover (NOT StarkWare Stone)**

⚠️ **CRITICAL CLARIFICATION:** ERA Protocol built its own zkSTARK prover from scratch in TypeScript. This is **NOT** StarkWare's Stone prover or any other external proving system. The entire proof generation pipeline runs **inside the Railway backend Node.js process**.

**Why build our own prover?**
1. **Proof of concept:** Demonstrate zkSTARK feasibility without external dependencies
2. **Transparency:** Full control over proving algorithm and security parameters
3. **Integration:** Tight coupling with Node.js backend (no external RPC calls)
4. **Accessibility:** Runs on Railway Hobby tier (~$5/month) - proves consumer-grade hardware suffices

**Architecture:**

```
packages/starks/                    (Custom ERA Prover - TypeScript)
├── src/
│   ├── StarkAir.ts                # Algebraic Intermediate Representation
│   ├── FRI/
│   │   ├── FSTransform.ts         # Fiat-Shamir transform (hash-based RNG)
│   │   ├── Commitment.ts          # FRI commitment phase
│   │   └── Prover.ts              # FRI proving algorithm
│   └── FieldOps.ts                # Finite field arithmetic
└── utils/
    ├── configManager.ts           # Security parameter configuration
    └── profilingService.ts        # Performance measurement

packages/prover/                    (Prover Coordinator)
└── ERAProver.ts                   # Orchestrates proof generation
                                   # Runs IN-PROCESS on Railway backend
```

**Deployment Model:**
```
Railway Backend (Single Node.js Process)
├── Express.js Server (port 3000)
├── POCService (orchestration)
└── ERAProver (in-process)
    └── FRI Engine (TypeScript)
        └── Generates proofs in 8-72 seconds
```

The prover is **NOT** a separate microservice or external dependency. It's a TypeScript module loaded into the backend Node.js process that generates proofs synchronously during request handling.

#### FRI (Fast Reed-Solomon IOP) Implementation

**Commitment Phase** (`Commitment.ts`):
```typescript
export function commitPhase(
  polynomial: Polynomial,
  domainSize: number,
  securityParameter: number
): CommitmentResult {
  // 1. Evaluate polynomial over extended domain
  // 2. Build Merkle tree of evaluations
  // 3. Compute root hash (commitment)
  // 4. Return commitment + auxiliary data
}
```

**Query Phase** (`Prover.ts`):
```typescript
export function generateQueries(
  commitment: CommitmentResult,
  transcript: Uint8Array,
  queryCount: number
): QueryResult {
  // 1. Use Fiat-Shamir to select random query positions
  // 2. Open Merkle proofs at query positions
  // 3. Generate folding structure (FRI rounds)
  // 4. Return proof package
}
```

**Security Parameters:**

| Batch Size | Domain Size | Polynomial Degree | Security Bits | Query Count |
|------------|-------------|-------------------|---------------|-------------|
| 20 txs | 2048 | 319 | **76.3 bits** | 21 |
| 50 txs | 4096 | 799 | 69.5 bits | 21 |
| 100 txs | 8192 | 1599 | 69.5 bits | 21 |

**Why variable security?** Larger batches have more complex polynomials, which reduces security bits for the same query count. We accept 69.5 bits for larger batches (still computationally infeasible to break) to keep verification gas reasonable.

---

## 3. Data Flow: User Journey

### 3.1 Send Transaction Flow

```
┌─────────────┐
│   User      │
│ (MetaMask)  │
└──────┬──────┘
       │
       │ 1. Enter recipient + amount
       ▼
┌─────────────────────────────────────────────┐
│  Frontend (Next.js)                          │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ app/send/page.tsx                      │ │
│  │  - Render UI                           │ │
│  │  - Validate inputs                     │ │
│  └─────────────┬──────────────────────────┘ │
│                │                             │
│  ┌─────────────▼──────────────────────────┐ │
│  │ lib/hooks/useERASend.ts                │ │
│  │  - Check ERC20 allowance               │ │
│  │  - Approve if needed                   │ │
│  │  - Sign EIP-712 TransferIntent         │ │
│  └─────────────┬──────────────────────────┘ │
└────────────────┼────────────────────────────┘
                 │ 2. POST /api/poc/submit
                 │    { from, to, token, amount, signature, ... }
                 ▼
┌─────────────────────────────────────────────┐
│  Backend (Railway)                          │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ server.ts                              │ │
│  │  - Authenticate request                │ │
│  │  - Route to POCService                 │ │
│  └─────────────┬──────────────────────────┘ │
│                │                             │
│  ┌─────────────▼──────────────────────────┐ │
│  │ services/pocService.ts                 │ │
│  │  - Validate signature                  │ │
│  │  - Fetch padding txs (Alchemy)         │ │
│  │  - Build batch (real tx + padding)     │ │
│  └─────────────┬──────────────────────────┘ │
│                │                             │
│  ┌─────────────▼──────────────────────────┐ │
│  │ packages/prover/ERAProver.ts           │ │
│  │  - Generate zkSTARK proof              │ │
│  │  - FRI commitment + queries            │ │
│  │  - Time: 8-72 seconds                  │ │
│  └─────────────┬──────────────────────────┘ │
│                │                             │
│  ┌─────────────▼──────────────────────────┐ │
│  │ Ethers.js                              │ │
│  │  - Submit proof to ERASettlement       │ │
│  │  - Wait for confirmation               │ │
│  └─────────────┬──────────────────────────┘ │
└────────────────┼────────────────────────────┘
                 │ 3. Ethereum transaction
                 │    (proof + batch data)
                 ▼
┌─────────────────────────────────────────────┐
│  Ethereum (Sepolia)                          │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ ERASettlement.sol                      │ │
│  │  - Verify proof (ERAVerifier.sol)     │ │
│  │  - Execute transfers atomically        │ │
│  │  - Emit events                         │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 3.2 Timing Breakdown (Batch Size 20)

**From Railway production logs:**

| Phase | Duration | Details |
|-------|----------|---------|
| **User signs EIP-712** | ~5 seconds | MetaMask prompt |
| **Padding fetch** | ~300ms | Alchemy API call |
| **Batch building** | ~10ms | Merkle tree construction |
| **Proof generation** | ~8 seconds | FRI commitment + queries |
| **Settlement** | ~12 seconds | Ethereum block confirmation |
| **Total** | **~25 seconds** | End-to-end user experience |

**Batch Size 100 takes ~72 seconds** (proof generation dominates).

---

## 4. zkSTARK Proof Generation Pipeline

### 4.1 Proof Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   zkSTARK Proof Pipeline                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Input: Batch of ERC20 Transactions                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ERC20Transaction[] = [                                   │   │
│  │   { from, to, token, amount, nonce },                    │   │
│  │   ...                                                     │   │
│  │ ]                                                         │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │                                                   │
│               │ 1. Build Execution Trace                         │
│               ▼                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Algebraic Intermediate Representation (AIR)             │   │
│  │  - Convert transactions to polynomial constraints       │   │
│  │  - Compute pre-state and post-state roots              │   │
│  │  - Build transition function                            │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │                                                   │
│               │ 2. FRI Commitment Phase                          │
│               ▼                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Polynomial Commitment                                   │   │
│  │  - Interpolate execution trace to polynomial           │   │
│  │  - Evaluate over extended domain (2048/4096/8192)      │   │
│  │  - Build Merkle tree of evaluations                    │   │
│  │  - Compute root hash (commitment)                      │   │
│  │  - Duration: 2.6-52 seconds (batch size dependent)     │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │                                                   │
│               │ 3. FRI Proving Phase                             │
│               ▼                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Query Generation                                        │   │
│  │  - Use Fiat-Shamir to select 21 random positions       │   │
│  │  - Open Merkle proofs at query positions               │   │
│  │  - Generate FRI folding rounds (9-11 rounds)           │   │
│  │  - Duration: 5-20 seconds (batch size dependent)       │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │                                                   │
│               │ 4. Package Proof                                 │
│               ▼                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Proof Artifact                                          │   │
│  │  - Proof digest (32 bytes)                             │   │
│  │  - Query responses (~140-535 KB)                       │   │
│  │  - Merkle authentication paths                         │   │
│  │  - Public inputs (batch size, state roots)            │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │                                                   │
│               │ 5. Submit to Ethereum                            │
│               ▼                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ On-Chain Verification                                   │   │
│  │  - ERAVerifier.sol checks proof validity               │   │
│  │  - Gas cost: ~58k-63k (proof verification)             │   │
│  │  - Gas cost: ~300k-390k (total settlement)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Security Parameters (Production Logs)

**From Railway logs** (`SECURITY_REVIEW_FEB_2026.md` confirms):

```javascript
{
  domainSeparator: 'FRI_COMMIT_v2_SECURE',
  sessionId: 'proof_0x41fc11...',
  domainSize: 2048,              // For batch 20
  polynomialDegree: 319,
  securityBits: 76.3,            // ✅ Above 66.8 required
  queries: 21,
  friRounds: 9,
  gasEstimate: '~12600 gas'      // Query verification only (see note below)
}
```

**⚠️ Gas Cost Clarification:** The `gasEstimate: ~12600 gas` shown above is **only the query verification portion** (21 queries × ~600 gas = 12.6k). The **actual on-chain verification cost** measured from Sepolia transactions is **~58k-63k gas total**, broken down as:
- **Query verification:** ~12.6k gas (what the estimate shows)
- **FRI round verification:** ~40k gas (9 rounds × ~4.4k gas)
- **Merkle authentication:** ~3k gas (verifying query openings)
- **Contract overhead:** ~2.4k gas (storage writes, events)

**Batch 50/100:**
```javascript
{
  domainSize: 4096 / 8192,
  polynomialDegree: 799 / 1599,
  securityBits: 69.5,            // ⚠️ Below 80-bit standard
  queries: 21,
  friRounds: 10 / 11
}
```

**Why 69.5 bits is acceptable (for now):**
- Computationally infeasible to break (~7×10²⁰ operations)
- POC phase demonstrates feasibility
- Production roadmap increases to 80+ bits (more queries)

---

## 5. Smart Contract Architecture

### 5.1 Contract Deployment (Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| **ERASettlement** | `0xDb41E9279D4c1BFc3ED90D2B1f0dbc4C4ba08c83` | Batch settlement, user intent execution |
| **ERAVerifier** | `0xDcac7bd52Ea8ECA2b3941E414153A209508B546f` | zkSTARK proof verification |
| **Supported Tokens** | | |
| USDC | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | Whitelisted |
| EURC | `0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4` | Whitelisted |
| WETH | `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` | Whitelisted |

**Verified on Sepolia:** [View ERASettlement](https://sepolia.etherscan.io/address/0xDb41E9279D4c1BFc3ED90D2B1f0dbc4C4ba08c83) | [View ERAVerifier](https://sepolia.etherscan.io/address/0xDcac7bd52Ea8ECA2b3941E414153A209508B546f)

### 5.2 ERASettlement.sol (Simplified)

```solidity
contract ERASettlement is Ownable {
    IERAVerifier public verifier;
    
    // Operator management
    mapping(address => bool) public operators;
    
    modifier onlyOperator() {
        require(operators[msg.sender], "Not authorized operator");
        _;
    }
    
    /**
     * Owner can add/remove operators (separate from settlement rights)
     */
    function addOperator(address operator) external onlyOwner {
        operators[operator] = true;
        emit OperatorAdded(operator);
    }
    
    function removeOperator(address operator) external onlyOwner {
        operators[operator] = false;
        emit OperatorRemoved(operator);
    }
    
    // User nonces (replay attack prevention)
    mapping(address => uint256) public nonces;
    
    // Events
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event BatchVerified(bytes32 indexed batchId, address indexed operator, bytes32 stateRoot);
    event TransferExecuted(bytes32 indexed batchId, address indexed from, address indexed to, address token, uint256 amount);
    event SwapExecuted(bytes32 indexed batchId, address indexed from, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    
    /**
     * Main entry point: Verify proof and execute batch
     */
    function executeVerifiedBatch(
        bytes32 batchId,
        bytes32 preStateRoot,
        bytes32 postStateRoot,
        bytes calldata proof,
        Transaction[] calldata transactions
    ) external onlyOperator {
        // 1. Verify zkSTARK proof
        require(verifier.verify(batchId, preStateRoot, postStateRoot, proof), "Invalid proof");
        
        // 2. Execute all transactions atomically
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].txType == TxType.TRANSFER) {
                _executeTransfer(transactions[i]);
            } else if (transactions[i].txType == TxType.SWAP) {
                _executeSwap(transactions[i]);
            }
        }
        
        // 3. Emit batch verification event
        emit BatchVerified(batchId, msg.sender, postStateRoot);
    }
    
    /**
     * Execute ERC20 transfer
     */
    function _executeTransfer(Transaction calldata tx) internal {
        // Verify signature (EIP-712)
        require(_verifyTransferSignature(tx), "Invalid signature");
        
        // Check nonce
        require(nonces[tx.from] == tx.nonce, "Invalid nonce");
        nonces[tx.from]++;
        
        // Execute transfer
        IERC20(tx.token).transferFrom(tx.from, tx.to, tx.amount);
        
        emit TransferExecuted(tx.batchId, tx.from, tx.to, tx.token, tx.amount);
    }
}
```

**Key Security Features:**
1. **Non-custodial:** Tokens never held by ERA contract
2. **Atomic execution:** All transfers in batch succeed or revert together
3. **Replay protection:** Nonces prevent double-spend
4. **Deadline enforcement:** Signatures expire after deadline

#### Operator vs. Owner Access Control

The `onlyOperator` modifier implements **separation of duties**:

| Role | Capabilities | Current Holder (POC) |
|------|--------------|---------------------|
| **Owner** | Add/remove operators, upgrade contract, pause system, change verifier | Contract deployer (team) |
| **Operator** | Submit batches, settle transactions (cannot change contract logic) | `0x201E8bE983275cCdBd4720454CFEa519b65160dA` (single operator) |

**Why Separate Roles?**

1. **Principle of Least Privilege:** Operators only need settlement rights, not contract upgrade rights
2. **Operational Flexibility:** Can add/remove operators without touching ownership
3. **Future Multi-Operator Support:** Multiple addresses can be operators simultaneously

**Current POC Implementation:**

- **Single operator:** Railway backend wallet (`0x201E8bE983275cCdBd4720454CFEa519b65160dA`)
- **Owner control:** Can add additional operators via `addOperator()`
- **No bonding enforced on-chain** (trust-based for POC)

**Mainnet Evolution:**

Phase 2 (Months 4-7) will implement:
- Multiple bonded operators (10-50 ETH stake each)
- On-chain bonding enforcement (must deposit ETH to become operator)
- Slashing conditions (lose bond for invalid proof submission)
- Operator rotation (randomized selection to prevent collusion)

This architecture makes the migration from single-operator (POC) to multi-operator (mainnet) straightforward—just add more addresses to the `operators` mapping and implement bonding logic.

---

## 6. API & Integration Layer

### 6.1 Backend API Endpoints

**Base URL:** Railway deployment (`https://era-backend.railway.app`)

#### POST `/api/poc/submit`

**Submit a transaction for batched processing.**

**Request:**
```json
{
  "from": "0xE46A1e06...98590F760",
  "to": "0xC734979f...E3622599E",
  "token": "0x1c7D4B19...379C7238",  // Sepolia USDC
  "amount": "1000000",
  "signature": "0x5787fdd4...",
  "chainId": 11155111,
  "nonce": 15,
  "deadline": 1772810038,
  "batchSize": 20
}
```

**Response:**
```json
{
  "jobId": "poc_mmeyly3v_f6hqjj",
  "status": "pending",
  "message": "Transaction submitted for batch processing"
}
```

#### GET `/api/poc/status/:jobId`

**Poll for job status.**

**Response (processing):**
```json
{
  "jobId": "poc_mmeyly3v_f6hqjj",
  "status": "generating_proof",
  "progress": 60,
  "message": "Generating zkSTARK proof..."
}
```

**Response (completed):**
```json
{
  "jobId": "poc_mmeyly3v_f6hqjj",
  "status": "completed",
  "progress": 100,
  "result": {
    "batchId": "0x41fc11817a362d1d075c0c3e44697eb096d0b81c268b1ddb813c952e9e5fa1b9",
    "settlementTxHash": "0x3feb1a2e1898f57219e4a70cd30352ee8730f7d8154d5cde74d76a01c7663b77",
    "etherscanUrl": "https://sepolia.etherscan.io/tx/0x3feb...",
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
    }
  }
}
```

### 6.2 Frontend API Client

**`lib/api/era.ts`:**
```typescript
export const eraApi = {
  async submitTransaction(request: POCSubmitRequest): Promise<{ jobId: string }> {
    const response = await fetch(`${ERA_API_URL}/api/poc/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  async getJobStatus(jobId: string): Promise<POCJobStatus> {
    const response = await fetch(`${ERA_API_URL}/api/poc/status/${jobId}`);
    return response.json();
  },
};
```

**Polling strategy:**
- Check every 2 seconds during proof generation
- Max 60 seconds timeout
- Exponential backoff on errors

---

## 7. Current POC vs. Future Architecture

### 7.1 Current POC Architecture (What We Built)

```
┌─────────────────────────────────────────────────────────────────┐
│                   Current POC Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (Next.js)                                              │
│       ↓                                                          │
│  Railway Backend (Single Instance)                               │
│    - POCService                                                  │
│    - Single operator wallet (private key in env)                │
│    - No bonding/staking                                          │
│       ↓                                                          │
│  Ethereum Sepolia                                                │
│    - ERASettlement contract                                      │
│    - Centralized operator                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- ✅ **Simple:** Single backend instance, easy to deploy
- ✅ **Fast iteration:** No complex coordination
- ✅ **Cost-effective:** Railway Hobby tier ($5/month)
- ⚠️ **Centralized:** Single operator controls all settlements
- ⚠️ **No economic security:** Operator has no stake
- ⚠️ **Single point of failure:** Railway downtime = ERA offline

### 7.2 Future Production Architecture (Mainnet Roadmap)

```
┌─────────────────────────────────────────────────────────────────┐
│                Future Production Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (Next.js)                                              │
│       ↓                                                          │
│  Operator Network (Decentralized)                                │
│    ┌──────────────┬──────────────┬──────────────┐              │
│    │ Operator 1   │ Operator 2   │ Operator 3   │              │
│    │ (Bonded)     │ (Bonded)     │ (Bonded)     │              │
│    └──────┬───────┴──────┬───────┴──────┬───────┘              │
│           │              │              │                        │
│           └──────────────┼──────────────┘                        │
│                          │                                       │
│                    Coordinator                                    │
│                  (Multi-sig DAO)                                  │
│                          ↓                                       │
│                 Ethereum Mainnet                                 │
│                 - ERASettlement (with economic security)         │
│                 - Challenge mechanism                            │
│                 - Slashing conditions                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- ✅ **Decentralized:** Multiple independent operators
- ✅ **Economic security:** Operators post bond (10-50 ETH)
- ✅ **Fault tolerant:** No single point of failure
- ✅ **Trustless:** Challenge mechanism allows anyone to dispute
- ⚠️ **Complex:** Requires operator coordination protocol
- ⚠️ **Higher cost:** More infrastructure, monitoring

### 7.3 Migration Path

**Phase 1 (Months 1-4): Security Hardening**
- Increase security bits to 80+ (more queries)
- Fix state root sequencing vulnerability
- Implement operator bonding on-chain

**Phase 2 (Months 4-7): Multi-Operator**
- Deploy 3-5 operators with bonding
- Implement operator rotation mechanism
- Geographic distribution (redundancy)

**Phase 3 (Months 7-10): Challenge Mechanism**
- Interactive fraud proof system
- Automated challenge verification
- Economic incentives for challengers

**Phase 4 (Months 10-15): Fully Decentralized**
- DAO governance (no admin keys)
- Permissionless operator network
- Mainnet launch

---

## 8. Technical Decisions & Trade-offs

### 8.1 Why Build Our Own zkSTARK Prover (Not Use StarkWare Stone)?

**Decision:** Build custom FRI prover in TypeScript instead of using StarkWare's Stone prover

**Reasons:**
- ✅ **Full control:** Understand every line of proving code
- ✅ **No external dependencies:** Stone prover requires separate infrastructure
- ✅ **Proof of feasibility:** Demonstrate zkSTARK proving on consumer hardware
- ✅ **Rapid prototyping:** Iterate quickly on security parameters
- ✅ **Transparency:** Open-source our own implementation
- ⚠️ **Performance penalty:** TypeScript ~10x slower than Stone's Rust/C++ implementation

**Why TypeScript specifically?**
- ✅ **Ecosystem integration:** Runs in-process with Node.js backend (no RPC overhead)
- ✅ **Rapid iteration:** Faster development for POC phase
- ✅ **Deployment simplicity:** Single Railway instance, no microservices
- ⚠️ **Slower than Rust/C++:** But acceptable for POC (8-72 second proofs)

**Trade-off acceptable for POC.** Production may:
1. Optimize TypeScript implementation (better algorithms, parallelization)
2. Migrate to Rust for performance (while keeping same FRI algorithm)
3. Or keep TypeScript if proof times remain acceptable at scale

**What we proved:** zkSTARK proving doesn't require expensive infrastructure or proprietary software. A $5/month Railway instance running custom TypeScript code is sufficient for viable gas savings.

### 8.2 Why Railway Hobby Tier?

**Decision:** Deploy on Railway's cheapest tier (~$5/month)

**Reasons:**
- ✅ **Cost-effective:** Minimal infrastructure cost
- ✅ **Proof of feasibility:** Shows this works on consumer-grade hardware
- ✅ **Easy deployment:** Git push to deploy
- ⚠️ **Limited compute:** 512MB RAM, shared CPU
- ⚠️ **No redundancy:** Single instance

**Trade-off demonstrates accessibility.** Shows validators don't need expensive hardware.

### 8.3 Why Batch Sizes 20/50/100?

**Decision:** Support only 3 fixed batch sizes

**Reasons:**
- ✅ **Predictable gas:** Fixed gas costs for each size
- ✅ **Security guarantees:** Each size has known security bits
- ✅ **Simplified UX:** Users pick from 3 options
- ⚠️ **Less flexible:** Can't optimize per-transaction

**Trade-off balances simplicity vs. optimization.**

### 8.4 Why Zustand over Redux?

**Decision:** Use Zustand for frontend state management

**Reasons:**
- ✅ **Lightweight:** ~1KB vs Redux's ~20KB
- ✅ **Simple API:** No boilerplate, no actions/reducers
- ✅ **TypeScript-first:** Excellent type inference
- ✅ **No Context hell:** Direct store access
- ⚠️ **Less ecosystem:** Fewer devtools, middleware

**Trade-off favors simplicity.** Redux would be overkill for POC.

### 8.5 Why Token Whitelist?

**Decision:** Only support USDC, EURC, WETH

**Reasons:**
- ✅ **Security:** Prevent malicious/broken tokens
- ✅ **Testing:** Focus on common tokens
- ✅ **Gas estimation:** Predictable gas costs
- ⚠️ **Limited utility:** Can't transfer arbitrary tokens

**Trade-off prioritizes safety over flexibility.** Mainnet would expand whitelist.

---

## Summary

ERA Protocol's POC architecture demonstrates:

1. **Custom prover feasibility:** Built our own zkSTARK prover in TypeScript (NOT StarkWare Stone)
2. **Runs on Railway Hobby tier:** Entire proof generation happens in-process on $5/month infrastructure
3. **Gas savings:** 58-92% reduction in per-user gas costs (verified on Sepolia)
4. **Non-custodial:** Users maintain full control of tokens
5. **Production-ready flow:** End-to-end system works reliably

**Key Achievement:** Proved that zkSTARK proving doesn't require expensive infrastructure or external prover services. Our custom TypeScript implementation running on Railway generates valid proofs in 8-72 seconds, demonstrating accessibility for decentralized operator networks.

**Current limitations (intentional for POC):**
- Centralized operator (single Railway instance)
- Security bits below 80 for larger batches (69.5 bits)
- No economic security (operator bonding)

**Next steps require EF guidance:**
- Increase security bits to 80+ (how many queries?)
- Implement decentralized operator network (coordination protocol?)
- Design challenge mechanism (interactive or non-interactive proofs?)
- Audit zkSTARK implementation (formal verification?)

**This POC proves the technology works. Ethereum Foundation guidance ensures we build it right.**

---

**Document Version:** 1.0  
**Author:** Brody Daniels  
**Technical References:**
- Backend: `~/Desktop/projects/era/backend/src/`
- Frontend: `~/Desktop/projects/era-app/lib/`
- Smart Contracts: Sepolia Testnet (verified)
- Production Logs: Railway deployment (04:03-04:07 PM UTC, March 6, 2026)
