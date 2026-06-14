// View function helpers for all FounderSea contracts
// These are read-only functions that don't require wallet connection

import { Contract } from "ethers";
import { IDEA_FACTORY_ABI, FUNDING_POOL_ABI, IDEA_TOKEN_ABI, FUNDING_GATE_ABI, BUILDER_AGREEMENT_ABI, DAO_VOTING_ABI, IDEA_MARKETPLACE_ABI, AGENT_IDENTITY_ABI, ERC20_ABI } from "./abis";
import { 
  IdeaStatus,
  MilestoneStatus,
  GateType,
} from "./types";
import type { 
  Idea, 
  IdeaDetails, 
  FundingPoolState, 
  Milestone, 
  CompetitorPayout, 
  IdeaTokenState, 
  Agreement, 
  Proposal, 
  ProposalStatus,
  Decision,
  AgentInfo,
  Listing,
  Bid,
  DiscoveryIdea
} from "./types";

// ============================================
// IdeaFactory View Functions
// ============================================

export async function getIdeaCount(factoryAddress: string, provider: any): Promise<number> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, provider);
  return await contract.nextIdeaId();
}

export async function getIdea(factoryAddress: string, provider: any, ideaId: number): Promise<Idea> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, provider);
  const result = await contract.getIdea(ideaId);
  return {
    creator: result[0],
    ideaToken: result[1],
    fundingPool: result[2],
    fundingGate: result[3],
    status: Number(result[4]) as IdeaStatus,
    aiScore: result[5],
    approvalReasonHash: result[6],
  };
}

export async function getIdeaStatus(factoryAddress: string, provider: any, ideaId: number): Promise<IdeaStatus> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, provider);
  return Number(await contract.getIdeaStatus(ideaId)) as IdeaStatus;
}

export async function isIdeaApproved(factoryAddress: string, provider: any, ideaId: number): Promise<boolean> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, provider);
  return await contract.isIdeaApproved(ideaId);
}

export async function getCreatorIdeas(factoryAddress: string, provider: any, creator: string): Promise<number[]> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, provider);
  return await contract.getCreatorIdeas(creator);
}

export async function getAllIdeas(factoryAddress: string, provider: any): Promise<IdeaDetails[]> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, provider);
  const count = await contract.nextIdeaId();
  const ideas: IdeaDetails[] = [];
  
  for (let i = 0; i < Number(count); i++) {
    try {
      const idea = await contract.getIdea(i);
      const config = await contract.ideas(i);
      ideas.push({
        ideaId: i,
        creator: idea[0],
        ideaToken: idea[1],
        fundingPool: idea[2],
        fundingGate: idea[3],
        status: Number(idea[4]) as IdeaStatus,
        aiScore: idea[5],
        approvalReasonHash: idea[6],
        config: {
          metadataIpfsHash: config.config.metadataIpfsHash,
          targetRaise: config.config.targetRaise,
          softCap: config.config.softCap,
          hardCap: config.config.hardCap,
          fundingDeadline: config.config.fundingDeadline,
          competitionPrizeBps: config.config.competitionPrizeBps,
          builderAllocBps: config.config.builderAllocBps,
          gateType: config.config.gateType,
          gateParams: config.config.gateParams,
        },
      });
    } catch {
      break;
    }
  }
  
  return ideas;
}

// ============================================
// FundingPool View Functions
// ============================================

export async function getFundingPoolState(poolAddress: string, provider: any): Promise<FundingPoolState> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, provider);
  const [
    fundingToken, ideaToken, gate, aiAgent, dao, builder, factory,
    softCap, hardCap, raisedAmount, competitionPrizeBps,
    fundingClosed, builderAssigned, competitorsSet
  ] = await Promise.all([
    contract.fundingToken(),
    contract.ideaToken(),
    contract.gate(),
    contract.aiAgent(),
    contract.dao(),
    contract.builder(),
    contract.factory(),
    contract.softCap(),
    contract.hardCap(),
    contract.raisedAmount(),
    contract.competitionPrizeBps(),
    contract.fundingClosed(),
    contract.builderAssigned(),
    contract.competitorsSet(),
  ]);
  
  return {
    fundingToken,
    ideaToken,
    gate,
    aiAgent,
    dao,
    builder,
    factory,
    softCap,
    hardCap,
    raisedAmount,
    competitionPrizeBps,
    fundingClosed,
    builderAssigned,
    competitorsSet,
  };
}

export async function checkSoftCapMet(poolAddress: string, provider: any): Promise<boolean> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, provider);
  return await contract.checkSoftCapMet();
}

export async function getTokenPrice(poolAddress: string, provider: any, amount: bigint): Promise<bigint> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, provider);
  return await contract.tokensForAmount(amount);
}

export async function getFundingProgress(poolAddress: string, provider: any): Promise<{
  raised: bigint;
  softCap: bigint;
  hardCap: bigint;
  percentage: number;
  softCapMet: boolean;
}> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, provider);
  const [raisedAmount, softCap, hardCap] = await Promise.all([
    contract.raisedAmount(),
    contract.softCap(),
    contract.hardCap(),
  ]);
  
  const percentage = Number(hardCap) > 0 
    ? Math.round((Number(raisedAmount) / Number(hardCap)) * 100)
    : 0;
  
  return {
    raised: raisedAmount,
    softCap,
    hardCap,
    percentage,
    softCapMet: raisedAmount >= softCap,
  };
}

// ============================================
// Milestone View Functions
// ============================================

export async function getMilestoneCount(poolAddress: string, provider: any): Promise<number> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, provider);
  return await contract.getMilestoneCount();
}

export async function getMilestone(poolAddress: string, provider: any, index: number): Promise<Milestone> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, provider);
  const result = await contract.milestones(index);
  return {
    amount: result[0],
    deadline: result[1],
    status: Number(result[2]) as MilestoneStatus,
    aiConfidence: result[3],
    validationIpfsHash: result[4],
  };
}

export async function getAllMilestones(poolAddress: string, provider: any): Promise<Milestone[]> {
  const count = await getMilestoneCount(poolAddress, provider);
  const milestones: Milestone[] = [];
  
  for (let i = 0; i < Number(count); i++) {
    try {
      const milestone = await getMilestone(poolAddress, provider, i);
      milestones.push(milestone);
    } catch {
      break;
    }
  }
  
  return milestones;
}

export async function getMilestoneStatus(poolAddress: string, provider: any, index: number): Promise<MilestoneStatus> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, provider);
  return Number(await contract.getMilestoneStatus(index)) as MilestoneStatus;
}

// ============================================
// Competitor Payout View Functions
// ============================================

export async function getCompetitorPayout(poolAddress: string, provider: any, slot: number): Promise<CompetitorPayout> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, provider);
  const result = await contract.competitorPayouts(slot);
  return {
    builder: result[0],
    amount: result[1],
    released: result[2],
    aiConfidence: result[3],
    validationIpfsHash: result[4],
  };
}

export async function getAllCompetitorPayouts(poolAddress: string, provider: any): Promise<CompetitorPayout[]> {
  const payouts: CompetitorPayout[] = [];
  for (let i = 0; i < 3; i++) {
    try {
      const payout = await getCompetitorPayout(poolAddress, provider, i);
      if (payout.builder !== "0x0000000000000000000000000000000000000000") {
        payouts.push(payout);
      }
    } catch {
      break;
    }
  }
  return payouts;
}

// ============================================
// IdeaToken View Functions
// ============================================

export async function getIdeaTokenState(tokenAddress: string, provider: any): Promise<IdeaTokenState> {
  const contract = new Contract(tokenAddress, IDEA_TOKEN_ABI, provider);
  const [
    usdy, fundingPool, revenueSource, ideaCreator, builderAllocBps,
    assignedBuilder, builderAllocMinted, revenuePerTokenStored, revenueDistributor, factory
  ] = await Promise.all([
    contract.USDY(),
    contract.fundingPool(),
    contract.revenueSource(),
    contract.ideaCreator(),
    contract.builderAllocBps(),
    contract.assignedBuilder(),
    contract.builderAllocMinted(),
    contract.revenuePerTokenStored(),
    contract.revenueDistributor(),
    contract.factory(),
  ]);
  
  return {
    usdy,
    fundingPool,
    revenueSource,
    ideaCreator,
    builderAllocBps,
    assignedBuilder,
    builderAllocMinted,
    revenuePerTokenStored,
    revenueDistributor,
    factory,
  };
}

export async function getTokenBalance(tokenAddress: string, provider: any, address: string): Promise<bigint> {
  const contract = new Contract(tokenAddress, IDEA_TOKEN_ABI, provider);
  return await contract.balanceOf(address);
}

export async function getTokenTotalSupply(tokenAddress: string, provider: any): Promise<bigint> {
  const contract = new Contract(tokenAddress, IDEA_TOKEN_ABI, provider);
  return await contract.totalSupply();
}

export async function getClaimableRevenue(tokenAddress: string, provider: any, address: string): Promise<bigint> {
  const contract = new Contract(tokenAddress, IDEA_TOKEN_ABI, provider);
  return await contract.earned(address);
}

// ============================================
// FundingGate View Functions
// ============================================

export async function getGateType(poolAddress: string, provider: any): Promise<GateType> {
  const state = await getFundingPoolState(poolAddress, provider);
  const gateContract = new Contract(state.gate, FUNDING_GATE_ABI, provider);
  return Number(await gateContract.gateType()) as GateType;
}

export async function canFund(poolAddress: string, provider: any, investor: string): Promise<boolean> {
  const state = await getFundingPoolState(poolAddress, provider);
  const gateContract = new Contract(state.gate, FUNDING_GATE_ABI, provider);
  return await gateContract.canFund(investor);
}

export async function getGateInfo(poolAddress: string, provider: any): Promise<{
  gateType: GateType;
  creator: string;
  dao: string;
  holdToken: string;
  minHoldAmount: bigint;
  daoApprover: string;
}> {
  const state = await getFundingPoolState(poolAddress, provider);
  const gateContract = new Contract(state.gate, FUNDING_GATE_ABI, provider);
  
  const [gateType, creator, dao, holdToken, minHoldAmount, daoApprover] = await Promise.all([
    gateContract.gateType(),
    gateContract.creator(),
    gateContract.dao(),
    gateContract.holdToken(),
    gateContract.minHoldAmount(),
    gateContract.daoApprover(),
  ]);
  
  return {
    gateType: Number(gateType) as GateType,
    creator,
    dao,
    holdToken,
    minHoldAmount,
    daoApprover,
  };
}

// ============================================
// BuilderAgreement View Functions
// ============================================

export async function getAgreement(
  agreementAddress: string, 
  provider: any, 
  agreementId: number
): Promise<Agreement> {
  const contract = new Contract(agreementAddress, BUILDER_AGREEMENT_ABI, provider);
  const result = await contract.agreements(agreementId);
  
  return {
    ideaId: result[0],
    ideaToken: result[1],
    factory: result[2],
    builders: result[3],
    agreementIpfsHash: result[4],
    revenueSource: result[5],
    creatorSigned: result[6],
    builderSigned: result[7],
    daoSigned: result[8],
    signedAt: result[9],
    active: result[10],
  };
}

export async function isAgreementFullySigned(
  agreementAddress: string, 
  provider: any, 
  agreementId: number
): Promise<boolean> {
  const contract = new Contract(agreementAddress, BUILDER_AGREEMENT_ABI, provider);
  return await contract.isFullySigned(agreementId);
}

export async function isAgreementActive(
  agreementAddress: string, 
  provider: any, 
  agreementId: number
): Promise<boolean> {
  const contract = new Contract(agreementAddress, BUILDER_AGREEMENT_ABI, provider);
  return await contract.isActive(agreementId);
}

export async function getBuilderAgreements(
  agreementAddress: string, 
  provider: any, 
  builder: string
): Promise<number[]> {
  const contract = new Contract(agreementAddress, BUILDER_AGREEMENT_ABI, provider);
  return await contract.getBuilderAgreements(builder);
}

// ============================================
// DAO Voting View Functions
// ============================================

export async function getProposal(
  votingAddress: string, 
  provider: any, 
  proposalId: number
): Promise<Proposal> {
  const contract = new Contract(votingAddress, DAO_VOTING_ABI, provider);
  const result = await contract.proposals(proposalId);
  
  return {
    ideaId: result[0],
    descriptionIpfsHash: result[1],
    votingDeadline: result[2],
    yesVotes: result[3],
    noVotes: result[4],
    aiYesVotes: result[5],
    aiNoVotes: result[6],
    executed: result[7],
    aiRecommendation: result[8],
    aiConfidence: result[9],
    created: result[10],
    snapshotBlock: result[11],
  };
}

export async function getProposalStatus(
  votingAddress: string, 
  provider: any, 
  proposalId: number
): Promise<ProposalStatus> {
  const contract = new Contract(votingAddress, DAO_VOTING_ABI, provider);
  const result = await contract.getProposalStatus(proposalId);
  
  return {
    yesVotes: result[0],
    noVotes: result[1],
    aiYesVotes: result[2],
    aiNoVotes: result[3],
    executed: result[4],
    votingActive: result[5],
  };
}

export async function hasVoted(
  votingAddress: string, 
  provider: any, 
  proposalId: number, 
  voter: string
): Promise<boolean> {
  const contract = new Contract(votingAddress, DAO_VOTING_ABI, provider);
  return await contract.hasVoted(proposalId, voter);
}

export async function isDelegatingToAI(
  votingAddress: string, 
  provider: any, 
  holder: string
): Promise<boolean> {
  const contract = new Contract(votingAddress, DAO_VOTING_ABI, provider);
  return await contract.delegatedToAI(holder);
}

export async function getVotingPower(
  votingAddress: string, 
  provider: any, 
  holder: string
): Promise<bigint> {
  const contract = new Contract(votingAddress, DAO_VOTING_ABI, provider);
  return await contract.totalDelegatedPower();
}

// ============================================
// Marketplace View Functions
// ============================================

export async function getListing(
  marketplaceAddress: string, 
  provider: any, 
  listingId: number
): Promise<Listing> {
  const contract = new Contract(marketplaceAddress, IDEA_MARKETPLACE_ABI, provider);
  const result = await contract.listings(listingId);
  
  return {
    seller: result[0],
    ideaToken: result[1],
    amount: result[2],
    askPricePerToken: result[3],
    expiry: result[4],
    active: result[5],
    requiredHoldToken: result[6],
    requiredHoldAmount: result[7],
  };
}

export async function getBid(
  marketplaceAddress: string, 
  provider: any, 
  bidId: number
): Promise<Bid> {
  const contract = new Contract(marketplaceAddress, IDEA_MARKETPLACE_ABI, provider);
  const result = await contract.bids(bidId);
  
  return {
    bidder: result[0],
    ideaToken: result[1],
    amount: result[2],
    bidPricePerToken: result[3],
    expiry: result[4],
    active: result[5],
  };
}

// ============================================
// AgentIdentity View Functions
// ============================================

export async function getAgentInfo(
  identityAddress: string, 
  provider: any
): Promise<AgentInfo> {
  const contract = new Contract(identityAddress, AGENT_IDENTITY_ABI, provider);
  const [agentId, agentName, modelId, creationTime, aiAgent] = await Promise.all([
    contract.agentId(),
    contract.agentName(),
    contract.modelId(),
    contract.creationTime(),
    contract.aiAgent(),
  ]);
  
  return {
    agentId,
    agentName,
    modelId,
    creationTime,
    aiAgent,
  };
}

export async function getDecision(
  identityAddress: string, 
  provider: any, 
  index: number
): Promise<Decision> {
  const contract = new Contract(identityAddress, AGENT_IDENTITY_ABI, provider);
  const result = await contract.getDecision(index);
  
  return {
    timestamp: result[0],
    decisionType: Number(result[1]),
    subjectId: result[2],
    inputHash: result[3],
    outputHash: result[4],
    confidence: result[5],
    reasoningIpfsHash: result[6],
  };
}

export async function getDecisionsBySubject(
  identityAddress: string, 
  provider: any, 
  subjectId: number
): Promise<Decision[]> {
  const contract = new Contract(identityAddress, AGENT_IDENTITY_ABI, provider);
  return await contract.getDecisionsBySubjectId(subjectId);
}

export async function getDecisionsByType(
  identityAddress: string, 
  provider: any, 
  decisionType: number
): Promise<Decision[]> {
  const contract = new Contract(identityAddress, AGENT_IDENTITY_ABI, provider);
  const indices = await contract.getDecisionsByType(decisionType);
  const decisions: Decision[] = [];
  
  for (const idx of indices) {
    const decision = await getDecision(identityAddress, provider, Number(idx));
    decisions.push(decision);
  }
  
  return decisions;
}

export async function getTotalDecisions(
  identityAddress: string, 
  provider: any
): Promise<number> {
  const contract = new Contract(identityAddress, AGENT_IDENTITY_ABI, provider);
  return await contract.totalDecisions();
}

// ============================================
// ERC20 Token View Functions
// ============================================

export async function getTokenBalanceOf(
  tokenAddress: string, 
  provider: any, 
  address: string
): Promise<bigint> {
  const contract = new Contract(tokenAddress, ERC20_ABI, provider);
  return await contract.balanceOf(address);
}

export async function getTokenAllowance(
  tokenAddress: string, 
  provider: any, 
  owner: string, 
  spender: string
): Promise<bigint> {
  const contract = new Contract(tokenAddress, ERC20_ABI, provider);
  return await contract.allowance(owner, spender);
}

// ============================================
// Combined Helper Functions
// ============================================

export async function getUserPositions(
  factoryAddress: string,
  poolAddress: string,
  tokenAddress: string,
  provider: any,
  userAddress: string
): Promise<{
  usdyBalance: bigint;
  ideaTokenBalance: bigint;
  claimableRevenue: bigint;
  fundingProgress: ReturnType<typeof getFundingProgress> extends Promise<infer T> ? T : never;
}> {
  const [usdyBalance, ideaTokenBalance, claimableRevenue, fundingProgress] = await Promise.all([
    getTokenBalanceOf(factoryAddress.split(",")[0] || "", provider, userAddress).catch(() => BigInt(0)),
    getTokenBalanceOf(tokenAddress, provider, userAddress),
    getClaimableRevenue(tokenAddress, provider, userAddress),
    getFundingProgress(poolAddress, provider),
  ]);
  
  // Get USDY balance from USDY contract
  const usdyContract = new Contract(factoryAddress, ERC20_ABI, provider);
  const actualUsdyBalance = await usdyContract.balanceOf(userAddress).catch(() => BigInt(0));
  
  return {
    usdyBalance: actualUsdyBalance,
    ideaTokenBalance,
    claimableRevenue,
    fundingProgress,
  };
}

export async function getDiscoveryIdeas(
  factoryAddress: string,
  provider: any
): Promise<DiscoveryIdea[]> {
  const ideas = await getAllIdeas(factoryAddress, provider);
  
  const discoveryIdeas: DiscoveryIdea[] = await Promise.all(
    ideas.map(async (idea) => {
      try {
        const progress = await getFundingProgress(idea.fundingPool, provider);
        return {
          id: idea.ideaId.toString(),
          title: `Idea #${idea.ideaId}`,
          oneLiner: idea.config.metadataIpfsHash || "No description available",
          category: getCategoryFromStatus(idea.status),
          stage: getStageFromStatus(idea.status),
          status: idea.status,
          targetRaise: BigInt(idea.config.targetRaise.toString()),
          funded: progress.raised,
          softCap: BigInt(idea.config.softCap.toString()),
          hardCap: BigInt(idea.config.hardCap.toString()),
          aiScore: BigInt(idea.aiScore.toString()),
          creator: idea.creator,
          fundingPool: idea.fundingPool,
          ideaToken: idea.ideaToken,
        };
      } catch {
        return {
          id: idea.ideaId.toString(),
          title: `Idea #${idea.ideaId}`,
          oneLiner: idea.config.metadataIpfsHash || "No description available",
          category: "Unknown",
          stage: "Unknown",
          status: idea.status,
          targetRaise: BigInt(idea.config.targetRaise.toString()),
          funded: BigInt(0),
          softCap: BigInt(idea.config.softCap.toString()),
          hardCap: BigInt(idea.config.hardCap.toString()),
          aiScore: BigInt(idea.aiScore.toString()),
          creator: idea.creator,
          fundingPool: idea.fundingPool,
          ideaToken: idea.ideaToken,
        };
      }
    })
  );
  
  return discoveryIdeas;
}

// ============================================
// Utility Functions
// ============================================

export function getCategoryFromStatus(status: IdeaStatus): string {
  switch (status) {
    case IdeaStatus.PENDING: return "Pending Review";
    case IdeaStatus.APPROVED: return "Approved";
    case IdeaStatus.REJECTED: return "Rejected";
    case IdeaStatus.ABANDONED: return "Abandoned";
    case IdeaStatus.FUNDING: return "Funding";
    case IdeaStatus.ACTIVE: return "Active";
    case IdeaStatus.COMPLETED: return "Completed";
    case IdeaStatus.FAILED: return "Failed";
    default: return "Unknown";
  }
}

export function getStageFromStatus(status: IdeaStatus): string {
  switch (status) {
    case IdeaStatus.PENDING: return "idea";
    case IdeaStatus.APPROVED: return "approved";
    case IdeaStatus.FUNDING: return "funding";
    case IdeaStatus.ACTIVE: return "active";
    case IdeaStatus.COMPLETED: return "completed";
    default: return "other";
  }
}

export function getStatusColor(status: IdeaStatus): string {
  switch (status) {
    case IdeaStatus.PENDING: return "yellow";
    case IdeaStatus.APPROVED: return "green";
    case IdeaStatus.REJECTED: return "red";
    case IdeaStatus.ABANDONED: return "gray";
    case IdeaStatus.FUNDING: return "blue";
    case IdeaStatus.ACTIVE: return "green";
    case IdeaStatus.COMPLETED: return "green";
    case IdeaStatus.FAILED: return "red";
    default: return "gray";
  }
}

// Re-export types for convenience
export { IdeaStatus, MilestoneStatus, GateType } from "./types";
export type {
  Idea,
  IdeaDetails,
  FundingPoolState,
  Milestone,
  CompetitorPayout,
  IdeaTokenState,
  Agreement,
  Proposal,
  ProposalStatus,
  Decision,
  AgentInfo,
  Listing,
  Bid,
  DiscoveryIdea,
} from "./types";
