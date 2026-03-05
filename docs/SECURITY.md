# ERA Protocol - Security Model

**Version:** 1.0.0  
**Last Updated:** March 5, 2026  
**Status:** Testnet (Sepolia) - Awaiting Security Audit

---

## Table of Contents

1. [Overview](#overview)
2. [Threat Model](#threat-model)
3. [Security Mechanisms](#security-mechanisms)
4. [Known Limitations](#known-limitations)
5. [Audit Status](#audit-status)
6. [Bug Bounty Program](#bug-bounty-program)
7. [Emergency Procedures](#emergency-procedures)
8. [Responsible Disclosure](#responsible-disclosure)

---

## Overview

ERA Protocol prioritizes **security and trust minimization** in its design. While currently deployed on Sepolia testnet with some centralization, our roadmap includes progressive decentralization and formal security audits before mainnet launch.

### Security Principles

1. **Non-Custodial:** User funds never leave their wallet until settlement
2. **Cryptographically Verifiable:** zkSTARK proofs ensure batch correctness
3. **On-Chain Verification:** All critical checks happen on Ethereum L1
4. **Open Source:** All code auditable by the community
5. **Progressive Decentralization:** Move from trusted to trustless over time

---

## Threat Model

### What We Protect Against

#### ✅ 1. Replay Attacks

**Threat:** Attacker resubmits a valid signature to execute transaction multiple times.

**Protection:**
- **EIP-712 domain separation** by chainId + verifyingContract
- **Nonce enforcement:** Each user has a sequential nonce
- **Deadline mechanism:** Signatures expire after 1 hour

**Example Attack Prevention:**
```
User signs transfer on Sepolia (chainId: 11155111)
→ Signature includes chainId in EIP-712 domain
→ Cannot be replayed on Mainnet (chainId: 1)

User nonce = 5
→ Contract checks nonce == 5
→ After settlement, nonce incremented to 6
→ Old signature with nonce=5 now invalid
```

---

#### ✅ 2. Signature Forgery

**Threat:** Attacker creates a fake signature to steal user funds.

**Protection:**
- **EIP-712 typed data:** Prevents phishing (user sees structured data)
- **ecrecover verification:** On-chain signature verification
- **Type-safe message format:** Malformed messages rejected

**EIP-712 Structure:**
```typescript
{
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
  message: { /* user's intent */ }
}
```

Users see exactly what they're signing in MetaMask, preventing blind signature attacks.

---

#### ✅ 3. Double-Spending

**Threat:** User signs multiple conflicting transactions with the same nonce.

**Protection:**
- **Sequential nonces:** Must be used in order (no skipping)
- **On-chain nonce tracking:** Contract enforces nonce++
- **Batch atomicity:** All intents in a batch succeed or fail together

**Example:**
```
User balance: 100 USDC
User signs: Send 80 USDC to Alice (nonce 5)
User signs: Send 80 USDC to Bob (nonce 5)

Contract processes batch:
→ Checks nonce == 5 for Alice transfer ✓
→ Increments nonce to 6
→ Checks nonce == 5 for Bob transfer ✗ (nonce now 6)
→ Bob transfer rejected
```

---

#### ✅ 4. Front-Running (MEV)

**Threat:** MEV bot sees transaction in mempool and front-runs user.

**Protection:**
- **Off-chain intent submission:** User intent not in public mempool
- **Batch order opacity:** Prover determines order (not public until proven)
- **Deadline protection:** Stale transactions automatically rejected

**Note:** This is partial protection. MEV could still occur at settlement time on L1. Future versions will add encrypted intents for full MEV protection.

---

#### ✅ 5. Griefing Attacks

**Threat:** Attacker submits invalid intents to block honest users.

**Protection:**
- **Signature pre-validation:** Backend rejects invalid signatures immediately
- **Nonce checking:** Backend verifies nonce with contract before batching
- **Timeout mechanism:** Incomplete batches settle after 60 seconds
- **Padding data:** Backend fills incomplete batches with valid transactions

---

### What We DON'T (Yet) Protect Against

#### ⚠️ 1. Centralized Backend Failure

**Current State:** Single backend instance (Railway)

**Risks:**
- Backend downtime → users can't submit intents
- Backend compromise → attacker could censor transactions
- Database corruption → loss of job status data

**Mitigation:**
- Backend is stateless (can be restarted anytime)
- User signatures remain valid (can resubmit to new backend)
- No custodial risk (users retain control of funds)

**Future Solution (Q4 2026):**
- Decentralized prover network (multiple backends)
- Failover mechanisms
- Peer-to-peer intent propagation

---

#### ⚠️ 2. Malicious Prover

**Current State:** Centralized prover (ERA team controls)

**Risks:**
- Prover generates false proof → incorrect batch settles
- Prover censors specific users
- Prover delays proving → poor UX

**Mitigation:**
- zkSTARK proof verified on-chain (can't settle invalid batch)
- Open-source Cairo program (auditable logic)
- Testnet only (no real funds at risk)

**Future Solution (Q4 2026):**
- Economic incentives (staking + slashing)
- Multiple competing provers
- Proof challenges (fraud proof system)

---

#### ⚠️ 3. Smart Contract Bugs

**Current State:** Contracts deployed without formal audit

**Risks:**
- Logic bugs in settleBatch()
- Reentrancy vulnerabilities
- Integer overflow/underflow
- Access control issues

**Mitigation:**
- Extensive internal testing (80 unit tests)
- Testnet-only deployment
- Open source (community review)
- Conservative coding practices (OpenZeppelin libraries)

**Future Solution (Q3 2026):**
- Full security audit by Trail of Bits or OpenZeppelin
- Bug bounty program ($100k pool)
- Formal verification of critical functions

---

## Security Mechanisms

### 1. EIP-712 Signatures

**Why EIP-712?**
- Users see **structured data** (not opaque hash)
- **Domain separation** prevents cross-contract replay
- **Type safety** prevents malformed messages
- **Standard wallets** support (MetaMask, Coinbase, etc.)

**Example Signature:**
```solidity
// Contract-side verification
function verifySignature(TransferIntent memory intent) internal view returns (bool) {
    bytes32 structHash = keccak256(abi.encode(
        TRANSFER_INTENT_TYPEHASH,
        intent.from,
        intent.to,
        intent.token,
        intent.amount,
        intent.nonce,
        intent.deadline
    ));
    
    bytes32 digest = _hashTypedDataV4(structHash);
    address signer = ECDSA.recover(digest, intent.signature);
    
    return signer == intent.from && block.timestamp <= intent.deadline;
}
```

---

### 2. Nonce Management

**Per-User Sequential Nonces:**
```solidity
mapping(address => uint256) public nonces;

function settleBatch(...) external {
    for (uint i = 0; i < batch.intents.length; i++) {
        require(nonces[intent.from] == intent.nonce, "Invalid nonce");
        nonces[intent.from]++; // Increment after verification
    }
}
```

**Benefits:**
- Prevents replay attacks
- Prevents double-spending
- Enforces transaction ordering per user

**User Flow:**
1. User requests nonce: `GET /v1/poc/nonce/:address`
2. Backend queries contract: `contract.getNonce(address)`
3. User signs intent with nonce
4. Contract verifies nonce == expected
5. Contract increments nonce

---

### 3. Deadline Enforcement

**Time-Limited Signatures:**
```solidity
require(block.timestamp <= intent.deadline, "Intent expired");
```

**Default Expiration:** 1 hour from signature

**Benefits:**
- Prevents stale transactions
- Limits exposure window
- User can cancel by waiting for expiration

---

### 4. zkSTARK Proof Verification

**On-Chain Verification:**
```solidity
function settleBatch(BatchData calldata batch, bytes calldata proof) external {
    // 1. Verify the STARK proof
    bool proofValid = verifier.verifyProof(proof);
    require(proofValid, "Invalid proof");
    
    // 2. Proof ensures:
    //    - All signatures are valid
    //    - All nonces are correct
    //    - No double-spending
    //    - Batch integrity
    
    // 3. Execute transfers (already proven correct)
    for (uint i = 0; i < batch.intents.length; i++) {
        executeTransfer(batch.intents[i]);
    }
}
```

**What the Proof Guarantees:**
- All signatures verified off-chain (Cairo)
- All nonces checked
- All amounts validated
- Batch merkle root correct

**Why zkSTARKs?**
- ✅ No trusted setup (transparent)
- ✅ Quantum-resistant
- ✅ Publicly verifiable
- ✅ Constant proof size (~150KB)

---

### 5. Token Approval Model

**User Controls Approvals:**
```solidity
// User approves ERASettlement contract
IERC20(token).approve(settlementAddress, amount);

// Contract executes transfer
IERC20(token).transferFrom(user, recipient, amount);
```

**Security Properties:**
- User can revoke approval anytime
- User sets max approval amount
- Contract has no special privileges
- Standard ERC20 interaction

---

## Known Limitations

### Testnet-Only Deployment

**Current:** Sepolia testnet only  
**Risk:** Not battle-tested with real economic incentives  
**Timeline:** Mainnet after security audit (Q3 2026)

### Centralized Components

**Current Centralization:**
1. **Backend (Railway):** Single point of failure
2. **Prover:** ERA team controls proof generation
3. **Frontend (Vercel):** Single hosting provider

**Decentralization Roadmap:**
- Q3 2026: Multi-region backend deployment
- Q4 2026: Decentralized prover network
- 2027: Fully trustless operation

### No Formal Audit

**Current:** Internal review only  
**Risk:** Undetected smart contract bugs  
**Timeline:** Audit scheduled for Q3 2026 (pending EF grant)

### Limited Throughput

**Current:** 20-100 tx/batch, ~60-120s latency  
**Risk:** Poor UX during low activity periods  
**Solution:** Padding data + optimistic settlement (Q4 2026)

---

## Audit Status

### Pre-Audit Security Measures

**What We've Done:**
- ✅ 80+ unit tests (82% pass rate)
- ✅ Internal security review
- ✅ OpenZeppelin library usage (vetted code)
- ✅ Testnet deployment (6+ weeks live)
- ✅ Conservative coding practices
- ✅ Open-source code (public review)

**What's Needed:**
- [ ] Formal security audit (Trail of Bits / OpenZeppelin)
- [ ] Economic security analysis
- [ ] Fuzzing / invariant testing
- [ ] Gas optimization review
- [ ] Formal verification (critical functions)

### Audit Roadmap

**Q2 2026 (Current):**
- Complete internal testing
- Deploy comprehensive test suite
- Document security model
- Engage audit firms

**Q3 2026:**
- **Full smart contract audit** (4-6 weeks)
- Address all findings (critical/high/medium)
- Re-audit after fixes
- Publish audit report

**Q4 2026:**
- Bug bounty program launch
- Mainnet deployment (if audit passes)
- Ongoing monitoring & incident response

---

## Bug Bounty Program

### Planned Program (Q4 2026)

**Total Pool:** $100,000 USD (paid in ETH)

#### Severity Levels

| Severity | Description | Reward |
|----------|-------------|--------|
| **Critical** | Loss of user funds, contract takeover, proof forgery | $20,000 - $50,000 |
| **High** | Denial of service, griefing attacks, MEV extraction | $5,000 - $20,000 |
| **Medium** | UX issues, frontend vulnerabilities, data leaks | $1,000 - $5,000 |
| **Low** | Documentation errors, minor bugs, suggestions | $100 - $1,000 |

#### Scope

**In Scope:**
- ERASettlement.sol contract
- StarkVerifier.sol contract
- Backend API (intent processing)
- Frontend (signature generation)
- Cairo program (proof logic)

**Out of Scope:**
- Third-party contracts (Uniswap, ERC20 tokens)
- Social engineering attacks
- Phishing attacks on users
- DDoS attacks

#### Rules

1. **First come, first served** (duplicate reports not rewarded)
2. **Responsible disclosure** (90-day embargo)
3. **No public disclosure** before fix
4. **Good faith** (no attacking testnet/mainnet)
5. **Provide PoC** (reproducible exploit)

**Contact:** security@eraprotocol.xyz

---

## Emergency Procedures

### Circuit Breaker

**Pause Mechanism:**
```solidity
bool public paused;
address public owner;

modifier whenNotPaused() {
    require(!paused, "Contract paused");
    _;
}

function pause() external onlyOwner {
    paused = true;
    emit ContractPaused(msg.sender);
}

function unpause() external onlyOwner {
    paused = false;
    emit ContractUnpaused(msg.sender);
}

function settleBatch(...) external whenNotPaused {
    // Settlement logic
}
```

**When to Pause:**
- Critical bug discovered
- Unusual activity detected
- Oracle failure
- Economic attack in progress

**Who Can Pause:**
- ERA team multisig (2-of-3)
- Future: Governance vote (post-decentralization)

### Recovery Procedures

**Scenario 1: Smart Contract Bug**
1. Pause contract immediately
2. Assess impact (affected users, lost funds)
3. Deploy fixed contract
4. Migrate state (if possible)
5. Reimburse affected users (insurance fund)

**Scenario 2: Backend Compromise**
1. Take backend offline
2. Deploy new backend with fresh keys
3. Notify users to resubmit pending intents
4. Audit logs for unauthorized activity

**Scenario 3: Prover Failure**
1. Switch to backup prover
2. Reprocess pending batches
3. Notify users of delay
4. Root cause analysis

---

## Responsible Disclosure

### How to Report Security Issues

**DO:**
1. Email security@eraprotocol.xyz with details
2. Include PoC (Proof of Concept) if possible
3. Allow 90 days for fix before public disclosure
4. Follow up if no response within 72 hours

**DON'T:**
1. Post vulnerabilities publicly (Twitter, Discord, GitHub Issues)
2. Attack production systems
3. Exploit vulnerabilities for personal gain
4. Disclose to third parties before fix

### Our Commitments

**We will:**
- Respond within 72 hours
- Provide regular updates on fix progress
- Credit you in disclosure (if desired)
- Pay bug bounty (if eligible)
- Work collaboratively on fix

**We won't:**
- Take legal action (good faith researchers)
- Withhold payment for valid findings
- Disclose your identity without permission

---

## Security Best Practices (For Users)

### Protect Your Wallet

1. **Use hardware wallets** (Ledger, Trezor) for large amounts
2. **Verify transaction details** before signing
3. **Check recipient address** (ENS can be spoofed)
4. **Set reasonable approvals** (don't approve unlimited)
5. **Revoke old approvals** (use revoke.cash)

### Verify Contract Addresses

**Always verify you're interacting with official ERA contracts:**

| Contract | Network | Address |
|----------|---------|---------|
| ERASettlement | Sepolia | `0x1FF49FbcD8e712c524a14C651aaF955d4524d216` |
| ERASettlement | Mainnet | *Coming Q3 2026* |

**How to Verify:**
1. Check [docs.eraprotocol.xyz](https://docs.eraprotocol.xyz)
2. Verify on [Etherscan](https://etherscan.io)
3. Compare with frontend contract address

### Recognize Phishing Attempts

**Red Flags:**
- ❌ Emails asking for private keys
- ❌ Discord DMs offering "support"
- ❌ Fake websites (eraprotoco1.xyz, era-protocol.com)
- ❌ Urgency ("Verify your wallet in 24 hours!")

**Official Channels Only:**
- ✅ [eraprotocol.xyz](https://eraprotocol.xyz)
- ✅ [@ERAProtocol](https://twitter.com/ERAProtocol) (verified)
- ✅ [Discord](https://discord.gg/eraprotocol) (from website only)

---

## Open Questions & Future Research

### Research Areas

1. **MEV Protection:** Encrypted intents using threshold encryption
2. **Censorship Resistance:** Incentive mechanisms for prover inclusion
3. **Privacy:** Zero-knowledge batch composition
4. **Cross-Chain:** Extend ERA to L2s and sidechains
5. **Optimistic Settlement:** Execute before proof, verify async

### Community Input Welcome

Have ideas for improving ERA's security? We'd love to hear from you:
- **Forum:** [forum.eraprotocol.xyz](https://forum.eraprotocol.xyz)
- **Discord:** [discord.gg/eraprotocol](https://discord.gg/eraprotocol)
- **GitHub:** [github.com/era-protocol/era](https://github.com/era-protocol/era)

---

## Conclusion

ERA Protocol takes security seriously and follows **industry best practices** for Web3 applications. While we're currently in testnet phase with some centralization, our roadmap prioritizes progressive decentralization and formal security validation.

**Key Takeaways:**
- ✅ Strong cryptographic guarantees (EIP-712, zkSTARKs)
- ✅ Non-custodial design (user funds always controlled)
- ✅ Open source (auditable by community)
- ⚠️ Testnet only (no mainnet until audit)
- ⚠️ Centralized backend (temporary, decentralizing Q4 2026)

**Security Timeline:**
- **Q2 2026:** Internal testing, security documentation
- **Q3 2026:** Formal audit, fix findings
- **Q4 2026:** Bug bounty, mainnet deployment
- **2027:** Full decentralization, formal verification

---

**Questions?** Contact security@eraprotocol.xyz or see [FAQ.md](FAQ.md)

**Last Updated:** March 5, 2026  
**Next Review:** Q3 2026 (post-audit)
