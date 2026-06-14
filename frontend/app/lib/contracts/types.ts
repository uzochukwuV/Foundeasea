// TypeScript types for all FounderSea smart contracts

import type { BigNumberish, BytesLike, Overrides } from 'ethers';

// ============================================
// Enums
// ============================================

export enum IdeaStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  ABANDONED = 3,
  FUNDING = 4,
  ACTIVE = 5,
  COMPLETED = 6,
  FAILED = 7
}

export enum MilestoneStatus {
  PENDING = 0,
  SUBMITTED = 1,
  VALIDATED = 2,
  RELEASED = 3,
  DISPUTED = 4
}

export enum GateType {
  OPEN = 0,
  WHITELIST = 1,
  MIN_HOLD = 2,
  DAO_CURATED = 3
}

export enum DecisionType {
  IDEA_APPROVE = 0,
  IDEA_REJECT = 1,
  IDEA_RANK = 2,
  BUILDER_RANK = 3,
  MVP_VALIDATE = 4,
  MILESTONE_VALIDATE = 5,
  DAO_VOTE = 6,
  REVENUE_ADVICE = 7
}

// ============================================
// IdeaFactory Types
// ============================================

export interface IdeaConfig {
  metadataIpfsHash: string;
  targetRaise: BigNumberish;
  softCap: BigNumberish;
  hardCap: BigNumberish;
  fundingDeadline: BigNumberish;
  competitionPrizeBps: BigNumberish;
  builderAllocBps: BigNumberish;
  gateType: GateType;
  gateParams: BytesLike;
}

export interface Idea {
  creator: string;
  ideaToken: string;
  fundingPool: string;
  fundingGate: string;
  status: IdeaStatus;
  aiScore: bigint;
  approvalReasonHash: string;
}

export interface IdeaDetails extends Idea {
  ideaId: number;
  config: IdeaConfig;
}

// ============================================
// FundingPool Types
// ============================================

export interface CompetitorPayout {
  builder: string;
  amount: bigint;
  released: boolean;
  aiConfidence: bigint;
  validationIpfsHash: string;
}

export interface Milestone {
  amount: bigint;
  deadline: bigint;
  status: MilestoneStatus;
  aiConfidence: bigint;
  validationIpfsHash: string;
}

export interface FundingPoolState {
  fundingToken: string;
  ideaToken: string;
  gate: string;
  aiAgent: string;
  dao: string;
  builder: string;
  factory: string;
  softCap: bigint;
  hardCap: bigint;
  raisedAmount: bigint;
  competitionPrizeBps: bigint;
  fundingClosed: boolean;
  builderAssigned: boolean;
  competitorsSet: boolean;
}

// ============================================
// IdeaToken Types
// ============================================

export interface IdeaTokenState {
  usdy: string;
  fundingPool: string;
  revenueSource: string;
  ideaCreator: string;
  builderAllocBps: bigint;
  assignedBuilder: string;
  builderAllocMinted: boolean;
  revenuePerTokenStored: bigint;
  revenueDistributor: string;
  factory: string;
}

// ============================================
// BuilderAgreement Types
// ============================================

export interface Agreement {
  ideaId: bigint;
  ideaToken: string;
  factory: string;
  builders: string[];
  agreementIpfsHash: string;
  revenueSource: string;
  creatorSigned: boolean;
  builderSigned: boolean;
  daoSigned: boolean;
  signedAt: bigint;
  active: boolean;
}

// ============================================
// DAO Voting Types
// ============================================

export interface Proposal {
  ideaId: bigint;
  descriptionIpfsHash: string;
  votingDeadline: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  aiYesVotes: bigint;
  aiNoVotes: bigint;
  executed: boolean;
  aiRecommendation: boolean;
  aiConfidence: bigint;
  created: boolean;
  snapshotBlock: bigint;
}

export interface ProposalStatus {
  yesVotes: bigint;
  noVotes: bigint;
  aiYesVotes: bigint;
  aiNoVotes: bigint;
  executed: boolean;
  votingActive: boolean;
}

// ============================================
// AgentIdentity Types
// ============================================

export interface Decision {
  timestamp: bigint;
  decisionType: DecisionType;
  subjectId: bigint;
  inputHash: string;
  outputHash: string;
  confidence: bigint;
  reasoningIpfsHash: string;
}

export interface AgentInfo {
  agentId: bigint;
  agentName: string;
  modelId: string;
  creationTime: bigint;
  aiAgent: string;
}

// ============================================
// Marketplace Types
// ============================================

export interface Listing {
  seller: string;
  ideaToken: string;
  amount: bigint;
  askPricePerToken: bigint;
  expiry: bigint;
  active: boolean;
  requiredHoldToken: string;
  requiredHoldAmount: bigint;
}

export interface Bid {
  bidder: string;
  ideaToken: string;
  amount: bigint;
  bidPricePerToken: bigint;
  expiry: bigint;
  active: boolean;
}

// ============================================
// Event Types
// ============================================

export interface IdeaCreatedEvent {
  ideaId: bigint;
  creator: string;
  ideaToken: string;
  fundingPool: string;
}

export interface IdeaApprovedEvent {
  ideaId: bigint;
  score: bigint;
}

export interface DepositEvent {
  investor: string;
  amount: bigint;
  tokensMinted: bigint;
}

export interface FundingClosedEvent {
  softCapMet: boolean;
}

export interface MilestoneEvent {
  index: bigint;
  amount: bigint;
}

export interface BuilderAssignedEvent {
  builder: string;
}

export interface VoteEvent {
  proposalId: bigint;
  voter?: string;
  support: boolean;
  power: bigint;
}

// ============================================
// Contract Addresses (configure per environment)
// ============================================

export interface ContractAddresses {
  ideaFactory: string;
  fundingPoolFactory: string;
  ideaTokenFactory: string;
  fundingGate: string;
  builderAgreement: string;
  daoVoting: string;
  ideaMarketplace: string;
  agentIdentity: string;
  usdy: string;
}

// ============================================
// Helper Types
// ============================================

export interface UserPosition {
  ideaTokenBalance: bigint;
  usdyBalance: bigint;
  usdyAllowance: bigint;
  delegatingToAI: boolean;
  delegatedPower: bigint;
}

export interface InvestmentPosition {
  ideaId: number;
  ideaTokenAmount: bigint;
  usdyInvested: bigint;
  currentValue: bigint;
  claimableRevenue: bigint;
}

export interface DiscoveryIdea {
  id: string;
  title: string;
  oneLiner: string;
  category: string;
  stage: string;
  status: IdeaStatus;
  targetRaise: bigint;
  funded: bigint;
  softCap: bigint;
  hardCap: bigint;
  aiScore: bigint;
  creator: string;
  fundingPool: string;
  ideaToken: string;
  trending24hRaise?: bigint;
  fundingVelocity?: bigint[];
  investorCount?: number;
  builderReputation?: number;
  socialProof?: string;
}

// Transaction options
export interface TxOptions {
  overrides?: Overrides;
  value?: bigint;
}
