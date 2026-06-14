# FounderSea

> **Democratizing Innovation Funding Through AI-Powered Idea Markets on Mantle**

![Foundry](https://img.shields.io/badge/Built%20with-Foundry-ff9b00?style=for-the-badge)
![Solidity](https://img.shields.io/badge/Solidity-0.8.x-success?style=for-the-badge)
![Mantle](https://img.shields.io/badge/Chain-Mantle%20Sepolia-1BA3F8?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=for-the-badge)

---

## 🎯 What is FounderSea?

FounderSea is a **decentralized innovation funding protocol** that enables anyone to propose, fund, and build ideas using cryptocurrency — while an **AI agent acts as an autonomous judge and validator** throughout the entire lifecycle.

Think of it as:

- **Kickstarter meets the stock market** — Ideas are tokenized as NFTs with bonding curve pricing
- **Gitcoin Grants meets autonomous AI** — An AI agent scores, validates milestones, and releases funds
- **A new model for venture capital** — Everyone can invest, not just accredited investors

### Core Innovation

Instead of a centralized team deciding which ideas get funded, FounderSea uses:

1. **Bonding Curve Tokens** — Idea tokens follow a bonding curve (1x→2x as funding fills), creating fair price discovery
2. **AI-Gated Fund Releases** — Milestone payments only unlock when the AI agent validates work with ≥75% confidence
3. **On-Chain Decision Audit Trail** — Every AI decision is recorded permanently via AgentIdentity NFTs

---

## 🌐 Why Mantle Blockchain?

Mantle is the ideal home for FounderSea because of its unique positioning:

### Technical Advantages

| Feature | Benefit for FounderSea |
|---------|----------------------|
| **Low Gas Fees (<$0.01)** | Enables micro-transactions for funding rounds |
| **Ethereum L2 Security** | Inherits Ethereum's security guarantees |
| **MIP Token Integration** | Native USDY stablecoin for fundraising |
| **Fast Finality (2s)** | Better UX for funding confirmations |

### Strategic Fit

- **Growing Ecosystem** — Mantle is building DeFi infrastructure that FounderSea extends into innovation funding
- **EAI Integration** — Mantle's AI infrastructure aligns with our AI-gated fund release model
- **Developer Momentum** — Active grants program attracts builders who are FounderSea's target users

### Why Not Ethereum Mainnet?

Ethereum L1 gas fees ($5-50 per transaction) would make:
- Small investments economically unfeasible
- Milestone-based payments too expensive
- Idea token trading prohibitively costly

---

## 🛠️ Why We Built FounderSea

### The Problem

Traditional innovation funding has three fundamental flaws:

**1. Centralized Gatekeeping**
- Angel investors and VCs control 95% of early-stage funding
- Good ideas die because founders lack "warm intros"
- Geographic and demographic biases persist

**2. No Accountability for Fund Managers**
- VCs receive carry without proportional downside risk
- Limited transparency on decision-making
- Founders have no recourse when investors underperform

**3. Misaligned Incentives in Crowdfunding**
- Kickstarters take 5% but have no skin in the game post-campaign
- No validation that projects deliver on promises
- Reward tiers create complexity without real upside

### Our Solution

FounderSea creates a **trustless, autonomous funding layer** where:

- **Anyone can propose** — 500 USDY stake (refundable if idea approved)
- **Anyone can fund** — Micro-investments with bonding curve pricing
- **AI validates** — Removes human bias from milestone approval
- **Everyone benefits** — Token holders share in idea success via revenue distribution

---

## 👥 Who is FounderSea For?

### For **Creators & Founders**

- Test idea viability before building full product
- Access global capital without VC networks
- Retain more ownership (no equity dilution in token model)
- Build credibility through AI-scored proposals

### For **Investors & Backers**

- Early access to promising ideas
- Fair pricing via bonding curves (no front-running)
- Revenue sharing when ideas succeed
- Fully transparent on-chain track record

### For **Builders & Freelancers**

- Compete for milestone prizes
- Build reputation on-chain
- Get paid automatically when AI validates work
- Access to pre-vetted project pipelines

### For **AI Agents**

- Earn fees for validation services
- Build permanent decision track record
- Execute fund releases autonomously
- Scale validation across unlimited ideas

---

## 🔄 Complete User Flow

### Stage 1: Idea Submission

```
1. User connects wallet (MetaMask/WalletConnect)
2. Submits idea with:
   - Title & description (IPFS hash)
   - Target raise amount
   - Soft cap / hard cap
   - Funding deadline
   - Builder allocation %
3. Deposits 500 USDY stake
4. AI agent evaluates idea:
   - Scores feasibility (0-100)
   - Records decision on-chain
5. If approved → status changes to FUNDING
```

### Stage 2: Funding Round

```
1. Investors browse approved ideas
2. Review AI scores, milestones, team
3. Deposit USDY into FundingPool
   - Tokens minted via bonding curve
   - Price: 1x at start → 2x at hard cap
4. Token holders can:
   - Trade on secondary marketplace
   - Claim revenue when ideas monetize
```

### Stage 3: Builder Selection

```
1. Creator reviews funding results
2. Assigns builder via on-chain proposal
3. Sets milestones with deadlines
4. Builder accepts and begins work
```

### Stage 4: Milestone Execution

```
1. Builder submits milestone proof
2. AI agent validates submission:
   - Reviews evidence
   - Assigns confidence score
3. If confidence ≥ 75%:
   - Funds automatically released
   - Builder gets paid in USDY
4. If confidence < 50%:
   - Milestone rejected
   - Builder can resubmit
```

### Stage 5: Revenue Distribution

```
1. When idea generates revenue (grants, sales, etc.)
2. Revenue source notifies IdeaToken contract
3. Token holders claim proportional share
4. Builder receives allocation per agreement
```

### Stage 6: Governance (Optional)

```
1. Major decisions go to token holders
2. Holders can delegate votes to AI agent
3. AI casts weighted votes on behalf
4. Results executed on-chain
```

---

## 🤖 AI Agent Integration

The AI agent is the **core differentiator** of FounderSea. Here's how it works:

### AI Agent Responsibilities

| Function | Description | Confidence Threshold |
|----------|-------------|---------------------|
| **Idea Scoring** | Evaluate feasibility, market, team | N/A (pass/fail) |
| **Milestone Validation** | Verify work completion | ≥50% to validate |
| **Fund Release** | Unlock milestone payments | ≥75% to release |
| **Decision Recording** | Permanent audit trail | N/A |
| **DAO Voting** | Cast delegated votes | Configurable |

### How AI Integration Works

```solidity
// Example: AI approves an idea
contract IdeaFactory {
    address public aiAgent;
    
    function aiApproveIdea(uint256 ideaId, uint256 score, string memory reasonHash) external {
        require(msg.sender == aiAgent, "Only AI agent");
        require(ideas[ideaId].status == IdeaStatus.PENDING);
        
        ideas[ideaId].status = IdeaStatus.APPROVED;
        ideas[ideaId].aiScore = score;
        ideas[ideaId].approvalReasonHash = reasonHash;
        
        emit IdeaApprovedByAI(ideaId, score);
    }
}
```

### AI Agent Identity (AgentIdentity NFT)

Every AI decision is recorded on-chain with:

- **Decision Type** — IDEA_APPROVE, MILESTONE_VALIDATE, FUND_RELEASE
- **Confidence Score** — How sure the AI was (0-100%)
- **Reason Hash** — IPFS link to full reasoning
- **Timestamp** — When decision was made

This creates **radical transparency** in how funding decisions are made.

---

## 🏗️ Project Architecture

### Smart Contracts (Solidity)

```
src/contracts/
├── IdeaFactory.sol          # Central hub, creates ideas
├── FundingPool.sol          # Fundraising with bonding curve
├── IdeaToken.sol            # ERC20 token for idea ownership
├── FundingPoolFactory.sol   # Deploys FundingPool instances
├── IdeaTokenFactory.sol     # Deploys IdeaToken instances
├── FundingGate.sol          # Access control (whitelist/KYC)
├── BuilderAgreement.sol     # Multi-party milestone agreements
├── DAOVoting.sol            # On-chain governance
├── IdeaMarketplace.sol      # Secondary token trading
└── AgentIdentity.sol       # AI agent identity NFTs
```

### Frontend (Next.js 16)

```
frontend/
├── app/
│   ├── page.tsx             # Landing page
│   ├── create/              # Submit new idea
│   ├── discover/            # Browse ideas
│   ├── ideas/[id]/          # Idea detail page
│   ├── portfolio/           # User positions
│   ├── chair/[ideaId]/       # Governance interface
│   └── flow/                # How it works
└── lib/
    ├── contracts/           # ABI exports & view functions
    ├── hooks.ts             # React hooks for contract interaction
    └── utils.ts             # Formatting utilities
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm
- MetaMask or WalletConnect wallet
- Mantle Sepolia testnet ETH
- Mantle Sepolia USDY (for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/foundersea.git
cd foundersea

# Install contract dependencies
forge install

# Install frontend dependencies
cd frontend && npm install
```

### Running Locally

```bash
# Start local Mantle node (Anvil)
anvil

# Deploy contracts to local network
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key 0x...

# Start frontend
cd frontend && npm run dev
```

### Deploying to Mantle Sepolia

```bash
# Deploy contracts
forge script script/DeployComplete.s.sol \
  --rpc-url $MANTLE_SEPOLIA_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast

# Update frontend .env.local with contract addresses
```

---

## 📋 Next Steps & Roadmap

### Phase 1: MVP (Current) ✅

- [x] Core contract deployment
- [x] Idea creation flow
- [x] Funding with bonding curve
- [x] AI milestone validation
- [x] Basic frontend

### Phase 2: Enhanced Features (Q3 2026)

- [ ] **Reputation System** — On-chain builder/creator scores
- [ ] **Multi-Chain Support** — Expand to Base, Optimism
- [ ] **IPFS Integration** — Full decentralized metadata
- [ ] **Analytics Dashboard** — Real-time protocol metrics

### Phase 3: Ecosystem Growth (Q4 2026)

- [ ] **AI Agent Marketplace** — Multiple competing AI validators
- [ ] **Token Lockdrop** — Reward early supporters
- [ ] **Grants Program** — Protocol treasury funding
- [ ] **Legal Wrapper** — DAO with legal entity

### Phase 4: Full Decentralization (2027)

- [ ] **Protocol DAO** — Token holders govern all parameters
- [ ] **Multi-Sig Timelock** — Security multi-sig for upgrades
- [ ] **Bug Bounty** — Security researcher incentives
- [ ] **Formal Verification** — Mathematically proven contract safety

---

## 🔐 Security Considerations

- **AI Agent permissions** require proper initialization (see CONTRACT_FLOW_ANALYSIS.md)
- **Bonding curve math** has been audited for precision errors
- **Reentrancy guards** on all fund-moving functions
- **Pausability** built into core contracts for emergencies
- **Time-locks** on critical parameter changes

---

## 📚 Additional Resources

- [Architecture Deep Dive](./PLAN.md)
- [Contract Flow Analysis](./CONTRACT_FLOW_ANALYSIS.md)
- [Deployment Guide](./DEPLOYMENT_INIT_GUIDE.md)
- [E2E Testing Guide](./E2E_TEST_GUIDE.md)
- [Backend Implementation](./BACKEND_IMPLEMENTATION_PLAN.md)

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit PRs.

## 📄 License

MIT License — see LICENSE file for details.

---

## 🔗 Links

- **Website**: https://foundersea.xyz
- **Documentation**: https://docs.foundersea.xyz
- **Discord**: https://discord.gg/foundersea
- **Twitter**: https://twitter.com/foundersea_ai

---

**Built with ❤️ on Mantle**
