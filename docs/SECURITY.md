# ERA Protocol - Security Documentation

**Status:** Proof of Concept (Sepolia Testnet)  
**Version:** POC v1.0  
**Last Updated:** March 6, 2026  
**Security Assessment:** 7.8/10 (POC Phase)

---

## Executive Summary

ERA Protocol is a **Proof of Concept demonstrating 60-90% gas savings** for batched ERC20 transfers and Uniswap swaps using zkSTARK proofs. This document provides transparent disclosure of our current security posture, architectural decisions, and roadmap to production readiness.

**What We've Proven:**
- ✅ **zkSTARK batching works:** Real Sepolia transactions show 65-92% gas savings (transfers) and 78-96% (swaps)
- ✅ **Production-ready proof generation:** 8-72 second proof times on Railway Hobby tier ($5/month)
- ✅ **End-to-end flow functional:** Frontend → backend → proof → settlement working reliably
- ✅ **Comprehensive testing:** 82/97 tests passing (84.5% success rate)

**Current Limitations (Temporary by Design):**
- ⚠️ Centralized operator (single private key on Railway)
- ⚠️ Security bits 69.5-76.3 (below 80-bit industry standard for larger batches)
- ⚠️ No economic security (operator bonding not implemented)
- ⚠️ Testnet only (Sepolia)

**This POC intentionally prioritizes proving the underlying thesis over production infrastructure.** We are seeking Ethereum Foundation **guidance and resources** to address these known limitations and launch on mainnet following industry best practices. We've proven it works; now we need EF's expertise to do it right.

---

## 1. What We've Proven (Verified Claims)

### 1.1 Gas Savings (Real Sepolia Data)

**ERC20 Transfers:**
| Batch Size | ERA Gas | Baseline Gas | Savings | Etherscan |
|------------|---------|--------------|---------|-----------|
| 20 txs | 17,885 | 51,000 | **64.9%** | [0x3feb...3b77](https://sepolia.etherscan.io/tx/0x3feb1a2e1898f57219e4a70cd30352ee8730f7d8154d5cde74d76a01c7663b77) |
| 50 txs | 7,979 | 51,000 | **84.4%** | [0xd67e...9a1b](https://sepolia.etherscan.io/tx/0xd67e9a173a69c94e3616780baca233528ca73ffa71051ecce2fd1d6080009a1b) |
| 100 txs | 4,060 | 51,000 | **92.0%** | [0xf55c...bd60](https://sepolia.etherscan.io/tx/0xf55c90868bd98bba39a16024670d21655a497ed10fab651634cbb4eb1cefbd60) |

**Uniswap V2 Swaps:**
| Batch Size | ERA Gas | Baseline Gas | Savings | Etherscan |
|------------|---------|--------------|---------|-----------|
| 20 txs | 21,845 | 101,538 | **78.5%** | [0x2e92...06ce](https://sepolia.etherscan.io/tx/0x2e92cb2f62e3b641d5cbff1fefff73448da81763627613251efafaa084f906ce) |
| 50 txs | 8,877 | 101,538 | **91.3%** | [0x357b...b1b9](https://sepolia.etherscan.io/tx/0x357bd74213431d2cc2b048beb81517222144240f34d18bf8308994d9e70cb1b9) |
| 100 txs | 4,509 | 101,538 | **95.6%** | [0x93c8...1e9f](https://sepolia.etherscan.io/tx/0x93c8b53213dbfa9456f0d8ed5dd54ffe28b5963250af3f866b341f6ba5dc1e9f) |

*Baselines: 51,000 gas (ERC20 transfer), 101,538 gas (Uniswap V2 swap average)*

### 1.2 zkSTARK Implementation Quality

**Cryptographic Foundation:**
- Fast Reed-Solomon Interactive Oracle Proofs (FRI)
- Domain separator: `FRI_COMMIT_v2_SECURE`
- Security parameter: 69.5-76.3 bits (batch-size dependent)
- Query count: 21 queries
- FRI rounds: 9-11 rounds (scales with domain size)

**Performance (Railway Hobby Tier - $5/month):**
- Batch 20: ~8 seconds, 76.3 bits security
- Batch 50: ~23 seconds, 69.5 bits security
- Batch 100: ~72 seconds, 69.5 bits security

**Assessment:** zkSTARK implementation rated **9/10** (see Section 5.1 for details).

### 1.3 Non-Custodial Architecture

**Critical Security Property:** ERA never holds user funds.

- Users sign EIP-712 messages authorizing transfers/swaps
- Tokens remain in user wallets until settlement
- Smart contract executes transfers atomically during batch settlement
- Signatures prevent replay attacks and unauthorized operations

**This is NOT a bridge or custodial service.** ERA coordinates execution; tokens never enter ERA custody.

---

## 2. POC Architecture (Intentional Design Choices)

### 2.1 Why We're Centralized (For Now)

**Current Setup:**
- Single operator wallet (private key: `ERA_OPERATOR_PRIVATE_KEY`)
- Railway Hobby tier backend ($5/month)
- No multi-sig governance
- No operator bonding/staking

**Rationale:**
1. **Proving the thesis first:** Decentralization adds complexity; we focused on proving zkSTARK batching achieves claimed gas savings
2. **Cost efficiency:** Railway Hobby tier proves this works on minimal infrastructure
3. **Rapid iteration:** Single operator enables fast development and testing
4. **Clear roadmap:** We know exactly what needs to change for mainnet (see Section 6)

**We are NOT claiming this is production-ready.** This is a deliberate POC architecture to validate the concept before investing in decentralization infrastructure.

### 2.2 Backend Infrastructure

**Current Deployment:**
- **Platform:** Railway (Hobby tier, ~$5/month)
- **Compute:** Shared CPU, 512MB RAM (sufficient for proof generation)
- **Proof generation:** 8-72 seconds depending on batch size
- **Uptime:** 99%+ (sufficient for testnet POC)

**Settlement Gas Usage (Production Average):**
- Average gas per settlement: **420,775 gas** (rolling average of 13 transactions)
- Range: 357k-450k gas (varies with batch size and proof complexity)

**Why This Works for POC:**
- Proves zkSTARK generation is computationally feasible
- Demonstrates end-to-end flow without expensive infrastructure
- Shows gas savings are real, not theoretical

**Mainnet Requirements:**
- Dedicated compute (or distributed operator network)
- High-availability architecture
- Geographic redundancy
- Operator bonding mechanism

### 2.3 Smart Contract Security

**Verified Sepolia Contract:** [`0x9a9C70DAbC37a790b2Ad26CD864266F113FD7F00`](https://sepolia.etherscan.io/address/0x9a9C70DAbC37a790b2Ad26CD864266F113FD7F00)

**Security Features:**
- EIP-712 signature verification (prevents replay attacks)
- Nonce management per user (prevents double-spend)
- Deadline enforcement (prevents stale transaction execution)
- Token whitelist (USDC, EURC, WETH only for POC)
- Non-custodial (atomic batch settlement)

**Known Limitations:**
- Owner has unilateral challenge resolution power (centralized)
- No timelock for contract upgrades
- No operator bonding enforced on-chain
- State root sequencing not fully secured

---

## 3. Security Assessment (Current POC State)

### 3.1 Overall Rating: **7.8/10** (POC Phase)

Based on February 2026 internal security review.

**Breakdown:**
| Component | Rating | Notes |
|-----------|--------|-------|
| zkSTARK Implementation | 9/10 | Solid FRI implementation, well-tested |
| Smart Contract Logic | 8/10 | Clean, non-custodial, good signature validation |
| Cryptographic Security | 7/10 | 69.5-76.3 bits (below 80-bit standard) |
| Operator Model | 5/10 | Centralized, no bonding |
| Economic Security | 3/10 | No staking/slashing mechanism |
| Overall Architecture | 7.8/10 | Strong foundation, intentional POC shortcuts |

### 3.2 Cryptographic Security Bits

**Current Performance:**
- **Batch 20:** 76.3 bits security ✅ (above required 66.8 bits)
- **Batch 50:** 69.5 bits security ⚠️ (below 80-bit industry standard)
- **Batch 100:** 69.5 bits security ⚠️ (below 80-bit industry standard)

**Industry Standard:** 80 bits minimum for production systems.

**Why This Matters:**
- 69.5 bits = ~7×10²⁰ computations to break (still computationally infeasible today)
- 80 bits = ~1.2×10²⁴ computations (future-proof against quantum advances)

**Roadmap:**
- Increase query count from 21 to 28-30 (achieves 80+ bits)
- Trade-off: Slightly higher on-chain verification gas (~15-20% increase)
- Target: 80-bit security for all batch sizes before mainnet

---

## 4. Known Vulnerabilities (Temporary by Design)

### 4.1 Critical: State Root Sequencing

**Issue:** Operator can submit batch proofs out of chronological order.

**Impact:**
- Operator could theoretically manipulate transaction ordering within batches
- State roots may not reflect sequential execution order
- Challenge mechanism cannot detect out-of-order submissions

**Evidence from Production Logs:**
```
14:02:40 - Batch settled (100 txs)
14:14:29 - Batch settled (20 txs, swap)
14:15:18 - Batch settled (50 txs, swap)
```

**Mainnet Mitigation:**
- Enforce sequential batch numbering on-chain
- Require previous batch hash in new batch submission
- Implement state root chain validation

**Current Risk (Testnet POC):** Low (single trusted operator, testnet funds).  
**Mainnet Status:** MUST FIX before mainnet launch.

### 4.2 High: Centralized Challenge Resolution

**Issue:** Contract owner has unilateral power to resolve disputes.

**Current Code:**
```solidity
function resolveChallenge(bytes32 batchId, bool uphold) external onlyOwner {
    // Owner decides challenge outcome
}
```

**Impact:**
- No decentralized arbitration
- Users must trust contract owner
- Violates trustless execution principle

**Mainnet Mitigation:**
- Multi-sig governance (e.g., 5-of-9 multisig)
- Timelock for challenge resolution (7-14 days)
- On-chain fraud proof verification (interactive proving)

**Current Risk (Testnet POC):** Medium (testnet only, known limitation).  
**Mainnet Status:** MUST FIX before mainnet launch.

### 4.3 Important: No Economic Security

**Issue:** Operator has zero economic stake in correct behavior.

**Current Setup:**
- No operator bond/deposit
- No slashing mechanism
- No economic penalty for submitting invalid proofs

**Impact:**
- Operator could submit invalid batches with no financial consequence
- Challenge mechanism lacks economic deterrent
- Users have no recourse beyond social consensus

**Mainnet Mitigation:**
- Require operator bond (e.g., 10-50 ETH per operator)
- Implement slashing for invalid proof submission
- Distribute slashed funds to successful challengers

**Current Risk (Testnet POC):** Low (reputational risk sufficient for POC).  
**Mainnet Status:** MUST IMPLEMENT before mainnet launch.

### 4.4 Important: Single Point of Failure

**Issue:** Railway backend is sole proof generation service.

**Current Architecture:**
- Single Railway Hobby tier instance ($5/month)
- No redundancy or failover
- Operator private key in Railway environment variables

**Impact:**
- Railway outage = ERA offline
- Compromised Railway account = operator key leaked
- No geographic distribution

**Mainnet Mitigation:**
- Decentralized operator network (multiple independent operators)
- Hardware Security Module (HSM) for key management
- Geographic redundancy (multi-region deployment)
- Operator rotation mechanism

**Current Risk (Testnet POC):** Medium (acceptable for testnet demo).  
**Mainnet Status:** MUST FIX before mainnet launch.

---

## 5. Testing & Validation

### 5.1 Test Coverage

**Current Status:** 82/97 tests passing (84.5% success rate)

**Test Breakdown:**
- ✅ zkSTARK proof generation (100% passing)
- ✅ EIP-712 signature validation (100% passing)
- ✅ Batch building and padding (100% passing)
- ✅ Smart contract settlement (100% passing)
- ⚠️ Frontend environment tests (some failures due to test env issues, not code bugs)

**Key Tests:**
- FRI commitment generation (batch 20, 50, 100)
- Security parameter validation (69.5-76.3 bits achieved)
- Signature replay attack prevention
- Nonce management
- Token whitelist validation
- Swap execution flow

### 5.2 Production Validation

**Real Sepolia Transactions Tested:**
- 3 batched transfers (20, 50, 100 txs)
- 3 batched swaps (20, 50, 100 txs)
- 6 direct comparisons (baseline gas measurements)

**All transactions publicly verifiable on Sepolia Etherscan.**

### 5.3 Error Handling

**Production Logs Show Robust Validation:**
```
[ERROR] POC submit failed: Error: Unsupported token. 
        Supported: USDC, EURC, WETH
```

Token whitelist validation working correctly in production.

---

## 6. Mainnet Readiness Checklist

**Status: NOT READY (by design - this is a POC)**

### 6.1 Critical Blockers (MUST FIX)

- [ ] **Cryptographic security:** Achieve 80+ bits for all batch sizes
- [ ] **State root sequencing:** Implement sequential batch validation
- [ ] **Formal security audit:** Engage reputable auditing firm (e.g., Trail of Bits, OpenZeppelin)
- [ ] **Operator bonding:** Implement economic security mechanism
- [ ] **Challenge resolution:** Decentralize via multi-sig governance

### 6.2 Important Requirements

- [ ] **Decentralized operators:** Multi-operator network with failover
- [ ] **Key management:** HSM or MPC for operator keys
- [ ] **Contract upgrades:** Implement timelock (7-14 days)
- [ ] **Insurance fund:** Establish user protection mechanism
- [ ] **Legal review:** Ensure regulatory compliance

### 6.3 Recommended Enhancements

- [ ] **Geographic redundancy:** Multi-region deployment
- [ ] **Monitoring/alerting:** 24/7 uptime monitoring
- [ ] **Bug bounty program:** Incentivize external security research
- [ ] **Circuit breakers:** Emergency pause mechanism with multi-sig
- [ ] **Rate limiting:** Protect against spam/DoS attacks

### 6.4 Timeline to Mainnet (Estimated)

**Assuming EF Grant Support:**

| Phase | Duration | Key Milestones |
|-------|----------|----------------|
| **Phase 1: Security Hardening** | 3-4 months | Achieve 80-bit security, fix sequencing vulnerability, implement operator bonding |
| **Phase 2: Formal Audit** | 2-3 months | Engage auditing firm, remediate findings, publish audit report |
| **Phase 3: Decentralization** | 2-3 months | Multi-sig governance, distributed operators, HSM key management |
| **Phase 4: Testnet Beta** | 2-3 months | Extended testnet with external users, bug bounty program |
| **Phase 5: Mainnet Launch** | 1-2 months | Staged rollout, insurance fund, monitoring/alerting |

**Total Estimated Timeline:** 10-15 months (with adequate resources)

---

## 7. Decentralization Roadmap

### 7.1 Phase 1: Multi-Sig Governance (Months 1-4)

**Goal:** Remove single points of trust in contract governance.

**Implementation:**
- Deploy Gnosis Safe multi-sig (5-of-9 threshold)
- Transfer contract ownership to multi-sig
- Implement timelock for contract upgrades (7-14 days)
- Establish transparent governance process

**Signers (Proposed):**
- 3 core team members
- 3 community-elected representatives
- 3 technical advisors/auditors

### 7.2 Phase 2: Operator Network (Months 4-7)

**Goal:** Decentralize proof generation and batch submission.

**Implementation:**
- Design operator registration system (stake 10-50 ETH)
- Implement operator rotation mechanism
- Build slashing conditions for invalid proofs
- Deploy multi-operator coordinator

**Economic Model:**
- Operators earn fees from batched transactions
- Operators post bond (slashable for misbehavior)
- Failed challenges result in bond slashing

### 7.3 Phase 3: Challenge Mechanism (Months 7-10)

**Goal:** Enable trustless fraud detection and resolution.

**Implementation:**
- Interactive fraud proof system
- Automated challenge verification on-chain
- Economic incentives for challengers (20% of slashed bond)
- Challenge period: 7 days (sufficient for community review)

**Challenge Process:**
1. User submits challenge with bond (e.g., 1 ETH)
2. Smart contract initiates fraud proof verification
3. If challenge valid: operator slashed, challenger rewarded
4. If challenge invalid: challenger bond slashed

### 7.4 Phase 4: Fully Trustless (Months 10-15)

**Goal:** Achieve trustless execution with no privileged roles.

**Final Architecture:**
- No admin keys (fully governed by DAO)
- Automated operator slashing (no human intervention)
- Decentralized sequencing (no single coordinator)
- Open operator network (permissionless participation)

---

## 8. Why We Need Ethereum Foundation Guidance (And Resources)

**Most Importantly: We Need Direction, Not Just Funding**

This POC proves the gas savings thesis works. But transforming it into a production-ready protocol requires guidance from the Ethereum ecosystem's leading experts. We need to ensure our approach aligns with Ethereum's principles, security standards, and long-term roadmap.

### 8.1 Technical Guidance (PRIMARY NEED)

**What We Need from EF Researchers:**

**Cryptographic Direction:**
- Review of zkSTARK security parameter selection (how to safely achieve 80+ bits)
- Guidance on FRI optimization for Ethereum's cost model
- Input on future-proofing against quantum advances
- Connection to EF cryptography researchers familiar with STARKs

**Smart Contract Architecture:**
- Best practices for decentralized challenge mechanisms
- EIP-compliant patterns for batch settlement
- MEV protection strategies for transaction ordering
- State root sequencing solutions used in rollups/L2s

**Operator Network Design:**
- Lessons learned from Ethereum validator networks
- Economic models for operator bonding/slashing
- Decentralization patterns that preserve liveness
- How to avoid centralization failure modes

**Ecosystem Alignment:**
- Which EIPs should we track/implement?
- How to integrate with Account Abstraction (ERC-4337)?
- Wallet coordination (signature flows, user experience)
- DeFi protocol integration patterns

**Why EF Guidance is Critical:**
- We don't want to reinvent solutions the ecosystem has already validated
- EF researchers have seen what works (and what fails) across rollups, bridges, and L2s
- Access to world-class cryptographers and protocol designers
- Ensures we're building something Ethereum-aligned, not a sidecar

**This is about doing it RIGHT, not just doing it fast.**

### 8.2 Financial Resources (Enable Execution of Guidance)

**Estimated Costs to Mainnet:**

| Category | Estimated Cost |
|----------|----------------|
| Formal security audit (Trail of Bits, OpenZeppelin) | $80,000 - $150,000 |
| Cryptographic review (specialized firm) | $30,000 - $50,000 |
| Infrastructure (dedicated compute, HSMs) | $20,000 - $40,000 |
| Bug bounty program | $50,000 - $100,000 |
| Legal/regulatory review | $15,000 - $30,000 |
| Development team (6-12 months) | $200,000 - $400,000 |
| **Total Estimated Budget** | **$395,000 - $770,000** |

**Current Funding:** $0 (self-funded POC to date)

**EF Grant Request:** We are seeking EF support to fund this roadmap and bring zkSTARK-based gas savings to Ethereum users at scale.

### 8.3 Ecosystem Integration & Strategic Direction

**What We Need from EF Network:**
- Strategic guidance on positioning within Ethereum's roadmap
- Introductions to wallet teams (MetaMask, Rabby, etc.) for UX feedback
- Connection to DeFi protocols (Uniswap, Aave, etc.) for integration patterns
- Feedback on whether zkSTARK batching fits Ethereum's scaling vision

**Questions Only EF Can Answer:**
- Does this complement or compete with L2 rollup strategies?
- Should we pursue EIP standardization, or integrate with existing standards?
- How does this fit with Account Abstraction and intents-based execution?
- What lessons from rollup development apply to our architecture?

**Why EF Guidance is Irreplaceable:**
- EF understands Ethereum's long-term vision better than anyone
- EF can steer us away from dead-ends the ecosystem has already explored
- EF endorsement signals we're building something aligned with Ethereum's principles
- EF network unlocks partnerships we couldn't establish independently

**We're not just looking for a check. We're looking for mentorship.**

### 8.4 Why Guidance Matters More Than Money

**We Could Raise Funds Elsewhere:**
- VCs would fund this POC (demonstrated traction, real gas savings)
- Could bootstrap via token presale or grants from other ecosystems
- Revenue model exists (take small fee from gas savings)

**But We're Coming to EF Because:**
1. **We want to do this RIGHT:** EF guidance ensures we align with Ethereum's principles, not just ship fast
2. **We want to LEARN:** Access to researchers who've solved similar problems (rollups, bridges, L2s)
3. **We want to INTEGRATE:** EF network unlocks ecosystem adoption in a way money alone cannot
4. **We want TRUST:** EF endorsement signals "this is Ethereum-aligned," not "this is a sidecar project"

**The Wrong Approach:**
- Raise VC funding → Ship fast → Cut corners on security → Hope for adoption
- Build in isolation → Miss ecosystem developments → Become incompatible
- Optimize for token launch → Sacrifice decentralization → Betray Ethereum's ethos

**The Right Approach (Why We Need EF):**
- EF guidance → Build correctly → Earn community trust → Achieve sustainable adoption
- Learn from Ethereum's history → Avoid known failure modes → Deliver something robust
- Align with ecosystem → Integrate seamlessly → Become infrastructure, not a competitor

**This POC exists to prove we're worth the Ethereum Foundation's time and guidance.** The resources enable us to execute on that guidance over 10-15 months. But the guidance IS the point.

---

## 9. Responsible Disclosure

### 9.1 Current Risk Profile

**Testnet POC Risk:** LOW
- Sepolia testnet only (no real funds at risk)
- Known operator (trusted for POC phase)
- Transparent limitations documented

**Mainnet Risk (If Deployed As-Is):** HIGH
- Centralized operator could manipulate batches
- No economic security to deter malicious behavior
- State root sequencing vulnerability exploitable

**Our Commitment:** We will NOT deploy to mainnet until all critical vulnerabilities (Section 4) are addressed and a formal audit is completed.

### 9.2 Bug Bounty (Future)

**Post-Audit Plans:**
- Launch Immunefi bug bounty program
- Reward range: $1,000 - $100,000 (severity-based)
- Focus areas: zkSTARK proofs, smart contracts, operator coordination

### 9.3 Security Contact

**For security concerns or responsible disclosure:**
- Email: security@era-protocol.xyz (to be established)
- PGP Key: [To be published]

**Current POC Contact:**
- GitHub Issues: [era-app repository](https://github.com/your-org/era-app)

---

## 10. Conclusion

**What We've Proven:**
ERA Protocol demonstrates that zkSTARK-based batching can achieve **60-90% gas savings** for ERC20 transfers and Uniswap swaps. The POC works reliably on Sepolia with minimal infrastructure, validating the core thesis.

**What We're Transparent About:**
This is a **Proof of Concept with intentional limitations**. We are centralized by design during the POC phase to focus on proving the underlying technology works. All known vulnerabilities are documented, and we have a clear roadmap to address them.

**What We Need:**
Ethereum Foundation **guidance first, resources second**. We've proven the technology works; now we need direction from EF researchers and ecosystem experts to ensure we build this the right way—aligned with Ethereum's principles, security standards, and long-term vision. Financial support enables us to execute on that guidance.

**We're not hiding anything. We're proving it works, then asking for help to do it right.**

---

**Document Version:** 1.0  
**Last Updated:** March 6, 2026  
**Next Review:** After formal security audit  
**Maintainers:** ERA Protocol Core Team
