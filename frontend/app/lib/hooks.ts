// Custom hooks for smart contract interactions
// These hooks provide a clean interface to contract functions

"use client";

import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcProvider } from "ethers";
import { useContract } from "./contracts/provider";
import {
  // View functions
  getIdea,
  getIdeaStatus,
  isIdeaApproved,
  getCreatorIdeas,
  getAllIdeas,
  getFundingPoolState,
  checkSoftCapMet,
  getFundingProgress,
  getMilestone,
  getAllMilestones,
  getIdeaTokenState,
  getTokenBalance,
  getClaimableRevenue,
  getGateType,
  canFund,
  getGateInfo,
  getAgreement,
  getProposal,
  getProposalStatus,
  getDecisionsBySubject,
  getTotalDecisions,
  getAgentInfo,
  getTokenBalanceOf,
  getTokenAllowance,
  getDiscoveryIdeas,
  // Types
  type Idea,
  type FundingPoolState,
  type Milestone,
  type IdeaTokenState,
  type Agreement,
  type Proposal,
  type ProposalStatus,
  type DiscoveryIdea,
  type IdeaStatus,
  type MilestoneStatus,
  type GateType,
  type Decision,
  type AgentInfo,
} from "./contracts/views";
import {
  // Write functions
  createIdea as createIdeaWrite,
  deposit,
  depositWithApproval,
  submitMilestone,
  refund,
  abandonIdea,
  claimRevenue,
  delegateToAI,
  revokeDelegation,
  vote,
  createProposal,
  executeProposal,
  createListing,
  acceptListing,
  placeBid,
  acceptBid,
  createAgreement,
  builderSign,
  creatorSign,
  registerBuilderAgreement,
  assignBuilder,
  setGateType,
  type CreateIdeaParams,
  type TransactionError,
} from "./contracts/writes";
import { ERC20_ABI } from "./contracts/abis";
import { Contract } from "ethers";

// ============================================
// Hook Types
// ============================================

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseTxState {
  loading: boolean;
  error: Error | null;
  hash: string | null;
  clear: () => void;
}

// ============================================
// Base Hooks
// ============================================

function useAsync<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
): UseAsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

function useTx(): UseTxState & { execute: (fn: () => Promise<any>) => Promise<void> } {
  const [state, setState] = useState<UseTxState>({
    loading: false,
    error: null,
    hash: null,
    clear: () => {
      setState(prev => ({ ...prev, loading: false, error: null, hash: null }));
    },
  });

  const clear = useCallback(() => {
    setState({ loading: false, error: null, hash: null, clear: () => {} });
  }, []);

  const execute = useCallback(async (fn: () => Promise<any>) => {
    setState(prev => ({ ...prev, loading: true, error: null, hash: null }));
    try {
      const result = await fn();
      setState(prev => ({ ...prev, loading: false, error: null, hash: result?.hash || null }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
        hash: null,
      }));
    }
  }, []);

  return { ...state, execute, clear };
}

// ============================================
// IdeaFactory Hooks
// ============================================

export function useIdea(ideaId: number | string) {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.ideaFactory || !provider) return null;
      return getIdea(addresses.ideaFactory, provider, Number(ideaId));
    },
    [addresses.ideaFactory, provider, ideaId]
  );
}

export function useIdeaStatus(ideaId: number | string) {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.ideaFactory || !provider) return null;
      return getIdeaStatus(addresses.ideaFactory, provider, Number(ideaId));
    },
    [addresses.ideaFactory, provider, ideaId]
  );
}

export function useCreatorIdeas(creator?: string) {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.ideaFactory || !provider || !creator) return [];
      return getCreatorIdeas(addresses.ideaFactory, provider, creator);
    },
    [addresses.ideaFactory, provider, creator]
  );
}

export function useAllIdeas() {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.ideaFactory || !provider) return [];
      return getAllIdeas(addresses.ideaFactory, provider);
    },
    [addresses.ideaFactory, provider]
  );
}

export function useDiscoveryIdeas() {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.ideaFactory || !provider) return [];
      return getDiscoveryIdeas(addresses.ideaFactory, provider);
    },
    [addresses.ideaFactory, provider]
  );
}

// ============================================
// FundingPool Hooks
// ============================================

export function useFundingPool(poolAddress?: string) {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!poolAddress || !provider) return null;
      return getFundingPoolState(poolAddress, provider);
    },
    [poolAddress, provider]
  );
}

export function useFundingProgress(poolAddress?: string) {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!poolAddress || !provider) return null;
      return getFundingProgress(poolAddress, provider);
    },
    [poolAddress, provider]
  );
}

// ============================================
// Milestone Hooks
// ============================================

export function useMilestones(poolAddress?: string) {
  const { wallet } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!poolAddress || !provider) return [];
      return getAllMilestones(poolAddress, provider);
    },
    [poolAddress, provider]
  );
}

export function useMilestone(poolAddress?: string, index?: number) {
  const { wallet } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!poolAddress || !provider || index === undefined) return null;
      return getMilestone(poolAddress, provider, index);
    },
    [poolAddress, provider, index]
  );
}

// ============================================
// IdeaToken Hooks
// ============================================

export function useIdeaToken(tokenAddress?: string) {
  const { wallet } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!tokenAddress || !provider) return null;
      return getIdeaTokenState(tokenAddress, provider);
    },
    [tokenAddress, provider]
  );
}

export function useTokenBalance(tokenAddress?: string, account?: string) {
  const { wallet } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!tokenAddress || !provider || !account) return BigInt(0);
      return getTokenBalance(tokenAddress, provider, account);
    },
    [tokenAddress, provider, account]
  );
}

export function useClaimableRevenue(tokenAddress?: string, account?: string) {
  const { wallet } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!tokenAddress || !provider || !account) return BigInt(0);
      return getClaimableRevenue(tokenAddress, provider, account);
    },
    [tokenAddress, provider, account]
  );
}

// ============================================
// User Position Hooks
// ============================================

export function useUserUSDYBalance() {
  const { wallet, addresses, getUSDYBalance } = useContract();
  
  return useAsync(
    async () => {
      if (!wallet.address) return BigInt(0);
      return getUSDYBalance(wallet.address);
    },
    [wallet.address, addresses.usdy]
  );
}

export function useTokenAllowance(owner?: string, spender?: string) {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.usdy || !provider || !owner || !spender) return BigInt(0);
      return getTokenAllowance(addresses.usdy, provider, owner, spender);
    },
    [addresses.usdy, provider, owner, spender]
  );
}

// ============================================
// Gate Hooks
// ============================================

export function useGateType(poolAddress?: string) {
  const { wallet } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!poolAddress || !provider) return null;
      return getGateType(poolAddress, provider);
    },
    [poolAddress, provider]
  );
}

export function useCanFund(poolAddress?: string, investor?: string) {
  const { wallet } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!poolAddress || !provider || !investor) return false;
      return canFund(poolAddress, provider, investor);
    },
    [poolAddress, provider, investor]
  );
}

// ============================================
// Agreement Hooks
// ============================================

export function useAgreement(agreementAddress?: string, agreementId?: number) {
  const { wallet } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!agreementAddress || !provider || agreementId === undefined) return null;
      return getAgreement(agreementAddress, provider, agreementId);
    },
    [agreementAddress, provider, agreementId]
  );
}

// ============================================
// DAO Voting Hooks
// ============================================

export function useProposal(proposalId?: number) {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.daoVoting || !provider || proposalId === undefined) return null;
      return getProposal(addresses.daoVoting, provider, proposalId);
    },
    [addresses.daoVoting, provider, proposalId]
  );
}

export function useProposalStatus(proposalId?: number) {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.daoVoting || !provider || proposalId === undefined) return null;
      return getProposalStatus(addresses.daoVoting, provider, proposalId);
    },
    [addresses.daoVoting, provider, proposalId]
  );
}

export function useIsDelegatingToAI(holder?: string) {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.daoVoting || !provider || !holder) return false;
      const contract = new Contract(addresses.daoVoting, [
        "function delegatedToAI(address) view returns (bool)"
      ], provider);
      return contract.delegatedToAI(holder);
    },
    [addresses.daoVoting, provider, holder]
  );
}

// ============================================
// Agent Identity Hooks
// ============================================

export function useAgentInfo() {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.agentIdentity || !provider) return null;
      return getAgentInfo(addresses.agentIdentity, provider);
    },
    [addresses.agentIdentity, provider]
  );
}

export function useAgentDecisionsForSubject(subjectId?: number) {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.agentIdentity || !provider || subjectId === undefined) return [];
      return getDecisionsBySubject(addresses.agentIdentity, provider, subjectId);
    },
    [addresses.agentIdentity, provider, subjectId]
  );
}

export function useTotalAgentDecisions() {
  const { wallet, addresses } = useContract();
  const provider = wallet.provider;
  
  return useAsync(
    async () => {
      if (!addresses.agentIdentity || !provider) return 0;
      return getTotalDecisions(addresses.agentIdentity, provider);
    },
    [addresses.agentIdentity, provider]
  );
}

// ============================================
// Transaction Hooks
// ============================================

export function useCreateIdea() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const createIdea = useCallback(
    async (params: CreateIdeaParams) => {
      if (!wallet.signer || !addresses.ideaFactory || !addresses.usdy) {
        throw new Error("Wallet not connected or contracts not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        const { createIdeaFlow } = await import("./contracts/writes");
        result = await createIdeaFlow(
          wallet.signer!,
          addresses.ideaFactory,
          addresses.usdy,
          params,
          BigInt(500000000) // MIN_CREATOR_DEPOSIT = 500 * 1e6
        );
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, createIdea };
}

export function useInvest() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const invest = useCallback(
    async (poolAddress: string, amount: bigint) => {
      if (!wallet.signer || !addresses.usdy) {
        throw new Error("Wallet not connected or USDY not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await depositWithApproval(
          wallet.signer!,
          poolAddress,
          amount,
          addresses.usdy,
          BigInt(0) // Will check allowance internally
        );
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, invest };
}

export function useSubmitMilestone() {
  const { wallet } = useContract();
  const tx = useTx();

  const submitMilestoneFn = useCallback(
    async (poolAddress: string, index: number) => {
      if (!wallet.signer) {
        throw new Error("Wallet not connected");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await submitMilestone(wallet.signer!, poolAddress, index);
      });
      return result;
    },
    [wallet.signer, tx]
  );

  return { ...tx, submitMilestone: submitMilestoneFn };
}

export function useClaimRevenue() {
  const { wallet } = useContract();
  const tx = useTx();

  const claimRevenueFn = useCallback(
    async (tokenAddress: string) => {
      if (!wallet.signer) {
        throw new Error("Wallet not connected");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await claimRevenue(wallet.signer!, tokenAddress);
      });
      return result;
    },
    [wallet.signer, tx]
  );

  return { ...tx, claimRevenue: claimRevenueFn };
}

export function useRefund() {
  const { wallet } = useContract();
  const tx = useTx();

  const refundFn = useCallback(
    async (poolAddress: string) => {
      if (!wallet.signer) {
        throw new Error("Wallet not connected");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await refund(wallet.signer!, poolAddress);
      });
      return result;
    },
    [wallet.signer, tx]
  );

  return { ...tx, refund: refundFn };
}

export function useAbandonIdea() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const abandonIdeaFn = useCallback(
    async (ideaId: number) => {
      if (!wallet.signer || !addresses.ideaFactory) {
        throw new Error("Wallet not connected or factory not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await abandonIdea(wallet.signer!, addresses.ideaFactory, ideaId);
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, abandonIdea: abandonIdeaFn };
}

export function useDelegateToAI() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const delegate = useCallback(
    async () => {
      if (!wallet.signer || !addresses.daoVoting) {
        throw new Error("Wallet not connected or DAO not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await delegateToAI(wallet.signer!, addresses.daoVoting);
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, delegate };
}

export function useRevokeDelegation() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const revoke = useCallback(
    async () => {
      if (!wallet.signer || !addresses.daoVoting) {
        throw new Error("Wallet not connected or DAO not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await revokeDelegation(wallet.signer!, addresses.daoVoting);
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, revoke };
}

export function useVote() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const voteFn = useCallback(
    async (proposalId: number, support: boolean) => {
      if (!wallet.signer || !addresses.daoVoting) {
        throw new Error("Wallet not connected or DAO not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await vote(wallet.signer!, addresses.daoVoting, proposalId, support);
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, vote: voteFn };
}

export function useCreateProposal() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const createProposalFn = useCallback(
    async (ideaId: number, descriptionIpfsHash: string, customDuration?: bigint) => {
      if (!wallet.signer || !addresses.daoVoting) {
        throw new Error("Wallet not connected or DAO not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await createProposal(wallet.signer!, addresses.daoVoting, ideaId, descriptionIpfsHash, customDuration);
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, createProposal: createProposalFn };
}

export function useExecuteProposal() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const executeFn = useCallback(
    async (proposalId: number) => {
      if (!wallet.signer || !addresses.daoVoting) {
        throw new Error("Wallet not connected or DAO not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await executeProposal(wallet.signer!, addresses.daoVoting, proposalId);
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, execute: executeFn };
}

// ============================================
// Marketplace Hooks
// ============================================

export function useCreateListing() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const createListingFn = useCallback(
    async (
      ideaToken: string,
      amount: bigint,
      askPrice: bigint,
      expiry: number
    ) => {
      if (!wallet.signer || !addresses.ideaMarketplace) {
        throw new Error("Wallet not connected or marketplace not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await createListing(
          wallet.signer!,
          addresses.ideaMarketplace,
          ideaToken,
          amount,
          askPrice,
          expiry
        );
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, createListing: createListingFn };
}

export function useAcceptListing() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const acceptListingFn = useCallback(
    async (listingId: number) => {
      if (!wallet.signer || !addresses.ideaMarketplace) {
        throw new Error("Wallet not connected or marketplace not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await acceptListing(wallet.signer!, addresses.ideaMarketplace, listingId);
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, acceptListing: acceptListingFn };
}

export function usePlaceBid() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const placeBidFn = useCallback(
    async (
      ideaToken: string,
      amount: bigint,
      bidPrice: bigint,
      expiry: number
    ) => {
      if (!wallet.signer || !addresses.ideaMarketplace) {
        throw new Error("Wallet not connected or marketplace not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await placeBid(
          wallet.signer!,
          addresses.ideaMarketplace,
          ideaToken,
          amount,
          bidPrice,
          expiry
        );
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, placeBid: placeBidFn };
}

export function useAcceptBid() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const acceptBidFn = useCallback(
    async (bidId: number) => {
      if (!wallet.signer || !addresses.ideaMarketplace) {
        throw new Error("Wallet not connected or marketplace not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await acceptBid(wallet.signer!, addresses.ideaMarketplace, bidId);
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, acceptBid: acceptBidFn };
}

// ============================================
// Builder Agreement Hooks
// ============================================

export function useBuilderSign() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const builderSignFn = useCallback(
    async (agreementId: number, revenueSource: string) => {
      if (!wallet.signer || !addresses.builderAgreement) {
        throw new Error("Wallet not connected or agreement not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await builderSign(wallet.signer!, addresses.builderAgreement, agreementId, revenueSource);
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, builderSign: builderSignFn };
}

export function useCreatorSign() {
  const { wallet, addresses } = useContract();
  const tx = useTx();

  const creatorSignFn = useCallback(
    async (agreementId: number) => {
      if (!wallet.signer || !addresses.builderAgreement) {
        throw new Error("Wallet not connected or agreement not configured");
      }

      let result: any = null;
      await tx.execute(async () => {
        result = await creatorSign(wallet.signer!, addresses.builderAgreement, agreementId);
      });
      return result;
    },
    [wallet.signer, addresses, tx]
  );

  return { ...tx, creatorSign: creatorSignFn };
}

// ============================================
// Re-export types for convenience
// ============================================

export type { IdeaStatus, MilestoneStatus, GateType, DiscoveryIdea, Idea, FundingPoolState, Milestone, IdeaTokenState, Agreement, Proposal, ProposalStatus, Decision, AgentInfo };
