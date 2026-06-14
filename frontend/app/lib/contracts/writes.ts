// Write function helpers for all FounderSea contracts
// These functions require wallet connection and create transactions

import { Contract, BrowserProvider, parseUnits, MaxUint256, Signer } from "ethers";
import { IDEA_FACTORY_ABI, FUNDING_POOL_ABI, IDEA_TOKEN_ABI, FUNDING_GATE_ABI, BUILDER_AGREEMENT_ABI, DAO_VOTING_ABI, IDEA_MARKETPLACE_ABI, ERC20_ABI } from "./abis";
import type { IdeaConfig, GateType, TxOptions } from "./types";

// ============================================
// Error Types
// ============================================

export class TransactionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public revertReason?: string
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

export class WalletNotConnectedError extends TransactionError {
  constructor() {
    super("Wallet not connected", "WALLET_NOT_CONNECTED");
    this.name = "WalletNotConnectedError";
  }
}

export class WrongChainError extends TransactionError {
  constructor() {
    super("Please switch to Mantle Sepolia", "WRONG_CHAIN");
    this.name = "WrongChainError";
  }
}

// ============================================
// Base Transaction Helper
// ============================================

async function sendTransaction<T extends Contract>(
  contract: T,
  method: string,
  args: any[],
  options?: TxOptions
): Promise<{ hash: string; wait: () => Promise<any> }> {
  try {
    const gasPrice = await contract.runner?.provider?.getFeeData();
    const tx = await (contract as any)[method](...args, {
      ...options?.overrides,
      value: options?.value || 0,
      gasPrice: gasPrice?.gasPrice,
    });
    
    return {
      hash: tx.hash,
      wait: async () => {
        const receipt = await tx.wait();
        return receipt;
      },
    };
  } catch (error: any) {
    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      throw new TransactionError("Transaction rejected by user", "USER_REJECTED");
    }
    throw new TransactionError(
      error.reason || error.message || "Transaction failed",
      error.code,
      error.reason
    );
  }
}

// ============================================
// Token Helpers
// ============================================

export async function approveToken(
  signer: Signer,
  tokenAddress: string,
  spender: string,
  amount: bigint = MaxUint256
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(tokenAddress, ERC20_ABI, signer);
  const tx = await contract.approve(spender, amount);
  
  return {
    hash: tx.hash,
    wait: async () => tx.wait(),
  };
}

export async function checkAndApproveToken(
  signer: Signer,
  tokenAddress: string,
  spender: string,
  amount: bigint,
  currentAllowance: bigint
): Promise<boolean> {
  if (currentAllowance < amount) {
    await approveToken(signer, tokenAddress, spender, amount);
    return true;
  }
  return false;
}

// ============================================
// IdeaFactory Write Functions
// ============================================

export async function setTreasury(
  signer: Signer,
  factoryAddress: string,
  treasury: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, signer);
  return sendTransaction(contract, "setTreasury", [treasury]);
}

export async function setAiAgent(
  signer: Signer,
  factoryAddress: string,
  aiAgent: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, signer);
  return sendTransaction(contract, "setAiAgent", [aiAgent]);
}

export async function setAgentIdentity(
  signer: Signer,
  factoryAddress: string,
  agentIdentity: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, signer);
  return sendTransaction(contract, "setAgentIdentity", [agentIdentity]);
}

export async function setFactories(
  signer: Signer,
  factoryAddress: string,
  fundingPoolFactory: string,
  ideaTokenFactory: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, signer);
  return sendTransaction(contract, "setFactories", [fundingPoolFactory, ideaTokenFactory]);
}

export async function createIdea(
  signer: Signer,
  factoryAddress: string,
  config: IdeaConfig
): Promise<{ hash: string; wait: () => Promise<any>; ideaId: number }> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, signer);
  
  // Convert gateType to number if it's an enum
  const gateTypeValue = typeof config.gateType === 'number' 
    ? config.gateType 
    : (config.gateType as unknown as number);
  
  const tx = await contract.createIdea({
    metadataIpfsHash: config.metadataIpfsHash,
    targetRaise: config.targetRaise,
    softCap: config.softCap,
    hardCap: config.hardCap,
    fundingDeadline: config.fundingDeadline,
    competitionPrizeBps: config.competitionPrizeBps,
    builderAllocBps: config.builderAllocBps,
    gateType: gateTypeValue,
    gateParams: config.gateParams,
  });
  
  const receipt = await tx.wait();
  
  // Extract ideaId from event
  let ideaId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "IdeaCreated") {
        ideaId = Number(parsed.args[0]);
        break;
      }
    } catch {
      continue;
    }
  }
  
  return {
    hash: tx.hash,
    wait: async () => receipt,
    ideaId,
  };
}

export async function abandonIdea(
  signer: Signer,
  factoryAddress: string,
  ideaId: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, signer);
  return sendTransaction(contract, "abandonIdea", [ideaId]);
}

export async function updateIdeaStatus(
  signer: Signer,
  factoryAddress: string,
  ideaId: number,
  newStatus: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, signer);
  return sendTransaction(contract, "updateIdeaStatus", [ideaId, newStatus]);
}

export async function registerBuilderAgreement(
  signer: Signer,
  factoryAddress: string,
  ideaId: number,
  agreement: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(factoryAddress, IDEA_FACTORY_ABI, signer);
  return sendTransaction(contract, "registerBuilderAgreement", [ideaId, agreement]);
}

// ============================================
// FundingPool Write Functions
// ============================================

export async function deposit(
  signer: Signer,
  poolAddress: string,
  amount: bigint
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, signer);
  return sendTransaction(contract, "deposit", [amount]);
}

export async function depositWithApproval(
  signer: Signer,
  poolAddress: string,
  amount: bigint,
  usdyAddress: string,
  currentAllowance: bigint
): Promise<{ hash: string; wait: () => Promise<any> }> {
  // First check and approve if needed
  await checkAndApproveToken(signer, usdyAddress, poolAddress, amount, currentAllowance);
  
  // Then deposit
  return deposit(signer, poolAddress, amount);
}

export async function closeFunding(
  signer: Signer,
  poolAddress: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, signer);
  return sendTransaction(contract, "closeFunding", []);
}

export async function setCompetitorPayouts(
  signer: Signer,
  poolAddress: string,
  builders: [string, string, string],
  amounts: [bigint, bigint, bigint]
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, signer);
  return sendTransaction(contract, "setCompetitorPayouts", [builders, amounts]);
}

export async function assignBuilder(
  signer: Signer,
  poolAddress: string,
  builder: string,
  milestoneAmounts: bigint[],
  milestoneDeadlines: bigint[]
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, signer);
  return sendTransaction(contract, "assignBuilder", [builder, milestoneAmounts, milestoneDeadlines]);
}

export async function submitMilestone(
  signer: Signer,
  poolAddress: string,
  index: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, signer);
  return sendTransaction(contract, "submitMilestone", [index]);
}

export async function refund(
  signer: Signer,
  poolAddress: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, signer);
  return sendTransaction(contract, "refund", []);
}

export async function addMilestones(
  signer: Signer,
  poolAddress: string,
  amounts: bigint[],
  deadlines: bigint[]
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(poolAddress, FUNDING_POOL_ABI, signer);
  return sendTransaction(contract, "addMilestones", [amounts, deadlines]);
}

// ============================================
// FundingGate Write Functions
// ============================================

export async function setGateType(
  signer: Signer,
  gateAddress: string,
  gateType: GateType,
  params: string = "0x"
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(gateAddress, FUNDING_GATE_ABI, signer);
  const gateTypeValue = typeof gateType === 'number' ? gateType : (gateType as unknown as number);
  return sendTransaction(contract, "setGateType", [gateTypeValue, params]);
}

export async function updateWhitelist(
  signer: Signer,
  gateAddress: string,
  addresses: string[],
  states: boolean[]
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(gateAddress, FUNDING_GATE_ABI, signer);
  return sendTransaction(contract, "updateWhitelist", [addresses, states]);
}

export async function daoApproveInvestor(
  signer: Signer,
  gateAddress: string,
  investor: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(gateAddress, FUNDING_GATE_ABI, signer);
  return sendTransaction(contract, "daoApproveInvestor", [investor]);
}

export async function setDaoApprover(
  signer: Signer,
  gateAddress: string,
  approver: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(gateAddress, FUNDING_GATE_ABI, signer);
  return sendTransaction(contract, "setDaoApprover", [approver]);
}

// ============================================
// BuilderAgreement Write Functions
// ============================================

export async function createAgreement(
  signer: Signer,
  agreementAddress: string,
  ideaId: number,
  ideaToken: string,
  factory: string,
  builders: string[],
  agreementIpfsHash: string
): Promise<{ hash: string; wait: () => Promise<any>; agreementId: number }> {
  const contract = new Contract(agreementAddress, BUILDER_AGREEMENT_ABI, signer);
  const tx = await contract.createAgreement(ideaId, ideaToken, factory, builders, agreementIpfsHash);
  
  const receipt = await tx.wait();
  
  let agreementId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "AgreementCreated") {
        agreementId = Number(parsed.args[0]);
        break;
      }
    } catch {
      continue;
    }
  }
  
  return {
    hash: tx.hash,
    wait: async () => receipt,
    agreementId,
  };
}

export async function builderSign(
  signer: Signer,
  agreementAddress: string,
  agreementId: number,
  revenueSource: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(agreementAddress, BUILDER_AGREEMENT_ABI, signer);
  return sendTransaction(contract, "builderSign", [agreementId, revenueSource]);
}

export async function creatorSign(
  signer: Signer,
  agreementAddress: string,
  agreementId: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(agreementAddress, BUILDER_AGREEMENT_ABI, signer);
  return sendTransaction(contract, "creatorSign", [agreementId]);
}

export async function daoSign(
  signer: Signer,
  agreementAddress: string,
  agreementId: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(agreementAddress, BUILDER_AGREEMENT_ABI, signer);
  return sendTransaction(contract, "daoSign", [agreementId]);
}

// ============================================
// DAO Voting Write Functions
// ============================================

export async function delegateToAI(
  signer: Signer,
  votingAddress: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(votingAddress, DAO_VOTING_ABI, signer);
  return sendTransaction(contract, "delegateToAI", []);
}

export async function revokeDelegation(
  signer: Signer,
  votingAddress: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(votingAddress, DAO_VOTING_ABI, signer);
  return sendTransaction(contract, "revokeDelegation", []);
}

export async function createProposal(
  signer: Signer,
  votingAddress: string,
  ideaId: number,
  descriptionIpfsHash: string,
  customDuration?: bigint
): Promise<{ hash: string; wait: () => Promise<any>; proposalId: number }> {
  const contract = new Contract(votingAddress, DAO_VOTING_ABI, signer);
  const tx = await contract.createProposal(
    ideaId, 
    descriptionIpfsHash, 
    customDuration || 0
  );
  
  const receipt = await tx.wait();
  
  let proposalId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "ProposalCreated") {
        proposalId = Number(parsed.args[0]);
        break;
      }
    } catch {
      continue;
    }
  }
  
  return {
    hash: tx.hash,
    wait: async () => receipt,
    proposalId,
  };
}

export async function vote(
  signer: Signer,
  votingAddress: string,
  proposalId: number,
  support: boolean
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(votingAddress, DAO_VOTING_ABI, signer);
  return sendTransaction(contract, "vote", [proposalId, support]);
}

export async function executeProposal(
  signer: Signer,
  votingAddress: string,
  proposalId: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(votingAddress, DAO_VOTING_ABI, signer);
  return sendTransaction(contract, "execute", [proposalId]);
}

// ============================================
// Marketplace Write Functions
// ============================================

export async function createListing(
  signer: Signer,
  marketplaceAddress: string,
  ideaToken: string,
  amount: bigint,
  askPrice: bigint, // in USDY with 6 decimals
  expiry: number,
  holdToken: string = "0x0000000000000000000000000000000000000000",
  holdAmount: bigint = BigInt(0)
): Promise<{ hash: string; wait: () => Promise<any>; listingId: number }> {
  const contract = new Contract(marketplaceAddress, IDEA_MARKETPLACE_ABI, signer);
  
  // First approve marketplace to spend tokens
  const tokenContract = new Contract(ideaToken, ERC20_ABI, signer);
  await tokenContract.approve(marketplaceAddress, amount);
  
  const tx = await contract.createListing(
    ideaToken,
    amount,
    askPrice,
    expiry,
    holdToken,
    holdAmount
  );
  
  const receipt = await tx.wait();
  
  let listingId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "ListingCreated") {
        listingId = Number(parsed.args[0]);
        break;
      }
    } catch {
      continue;
    }
  }
  
  return {
    hash: tx.hash,
    wait: async () => receipt,
    listingId,
  };
}

export async function acceptListing(
  signer: Signer,
  marketplaceAddress: string,
  listingId: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(marketplaceAddress, IDEA_MARKETPLACE_ABI, signer);
  return sendTransaction(contract, "acceptListing", [listingId]);
}

export async function placeBid(
  signer: Signer,
  marketplaceAddress: string,
  ideaToken: string,
  amount: bigint,
  bidPrice: bigint, // in USDY with 6 decimals
  expiry: number
): Promise<{ hash: string; wait: () => Promise<any>; bidId: number }> {
  const contract = new Contract(marketplaceAddress, IDEA_MARKETPLACE_ABI, signer);
  const tx = await contract.placeBid(ideaToken, amount, bidPrice, expiry);
  
  const receipt = await tx.wait();
  
  let bidId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "BidPlaced") {
        bidId = Number(parsed.args[0]);
        break;
      }
    } catch {
      continue;
    }
  }
  
  return {
    hash: tx.hash,
    wait: async () => receipt,
    bidId,
  };
}

export async function acceptBid(
  signer: Signer,
  marketplaceAddress: string,
  bidId: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(marketplaceAddress, IDEA_MARKETPLACE_ABI, signer);
  return sendTransaction(contract, "acceptBid", [bidId]);
}

export async function cancelListing(
  signer: Signer,
  marketplaceAddress: string,
  listingId: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(marketplaceAddress, IDEA_MARKETPLACE_ABI, signer);
  return sendTransaction(contract, "cancelListing", [listingId]);
}

export async function cancelBid(
  signer: Signer,
  marketplaceAddress: string,
  bidId: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const contract = new Contract(marketplaceAddress, IDEA_MARKETPLACE_ABI, signer);
  return sendTransaction(contract, "cancelBid", [bidId]);
}

// ============================================
// IdeaToken Write Functions
// ============================================

export async function claimRevenue(
  signer: Signer,
  tokenAddress: string
): Promise<{ hash: string; wait: () => Promise<any>; amount: bigint }> {
  const contract = new Contract(tokenAddress, IDEA_TOKEN_ABI, signer);
  const tx = await contract.claimRevenue();
  
  const receipt = await tx.wait();
  
  // Extract claimed amount from event or return 0
  let amount = BigInt(0);
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "Transfer" && parsed.args[2]) {
        // Transfer event from contract to user
        amount = parsed.args[2];
        break;
      }
    } catch {
      continue;
    }
  }
  
  return {
    hash: tx.hash,
    wait: async () => receipt,
    amount,
  };
}

// ============================================
// High-Level Transaction Builders
// ============================================

export interface CreateIdeaParams {
  metadataIpfsHash: string;
  targetRaise: bigint;
  softCap: bigint;
  hardCap: bigint;
  fundingDeadline: number;
  competitionPrizeBps: bigint;
  builderAllocBps: bigint;
  gateType: GateType;
  gateParams?: string;
}

export async function createIdeaFlow(
  signer: Signer,
  factoryAddress: string,
  usdyAddress: string,
  params: CreateIdeaParams,
  minDeposit: bigint
): Promise<{ hash: string; wait: () => Promise<any>; ideaId: number }> {
  // Step 1: Check and approve USDY for deposit
  const address = await signer.getAddress();
  const tokenContract = new Contract(usdyAddress, ERC20_ABI, signer);
  const currentAllowance = await tokenContract.allowance(address, factoryAddress);
  
  if (currentAllowance < minDeposit) {
    await tokenContract.approve(factoryAddress, minDeposit);
    // Wait for approval to be mined
    await signer.provider?.waitForTransaction(
      (await tokenContract.approve(factoryAddress, minDeposit)).hash
    );
  }
  
  // Step 2: Create the idea
  return createIdea(signer, factoryAddress, {
    ...params,
    gateParams: params.gateParams || "0x",
  });
}

export interface InvestParams {
  poolAddress: string;
  usdyAddress: string;
  amount: bigint; // Amount in USDY (6 decimals)
}

export async function investFlow(
  signer: Signer,
  params: InvestParams
): Promise<{ hash: string; wait: () => Promise<any>; tokensReceived: bigint }> {
  const { poolAddress, usdyAddress, amount } = params;
  
  // Step 1: Approve USDY
  const address = await signer.getAddress();
  const tokenContract = new Contract(usdyAddress, ERC20_ABI, signer);
  const currentAllowance = await tokenContract.allowance(address, poolAddress);
  
  if (currentAllowance < amount) {
    await tokenContract.approve(poolAddress, amount);
    await signer.provider?.waitForTransaction(
      (await tokenContract.approve(poolAddress, amount)).hash
    );
  }
  
  // Step 2: Deposit
  const poolContract = new Contract(poolAddress, FUNDING_POOL_ABI, signer);
  const tx = await poolContract.deposit(amount);
  const receipt = await tx.wait();
  
  // Extract tokens minted from event
  let tokensReceived = BigInt(0);
  for (const log of receipt.logs) {
    try {
      const parsed = poolContract.interface.parseLog(log);
      if (parsed?.name === "Deposit") {
        tokensReceived = parsed.args[2];
        break;
      }
    } catch {
      continue;
    }
  }
  
  return {
    hash: tx.hash,
    wait: async () => receipt,
    tokensReceived,
  };
}

export async function signAgreementFlow(
  signer: Signer,
  agreementAddress: string,
  agreementId: number,
  revenueSource: string,
  isBuilder: boolean
): Promise<{ hash: string; wait: () => Promise<any> }> {
  if (isBuilder) {
    return builderSign(signer, agreementAddress, agreementId, revenueSource);
  } else {
    return creatorSign(signer, agreementAddress, agreementId);
  }
}

export interface VoteParams {
  votingAddress: string;
  proposalId: number;
  support: boolean;
  delegateToAI?: boolean;
}

export async function voteFlow(
  signer: Signer,
  params: VoteParams
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const { votingAddress, proposalId, support } = params;
  
  // Check if user wants to delegate
  if (params.delegateToAI) {
    await delegateToAI(signer, votingAddress);
  }
  
  return vote(signer, votingAddress, proposalId, support);
}
