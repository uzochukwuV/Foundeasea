"use client";

import { useState, useCallback } from "react";
import { AppShell } from "../components/AppShell";
import { WalletConnect } from "../components/WalletConnect";
import { 
  Plus, 
  Check, 
  X, 
  Clock, 
  Users, 
  Wallet, 
  Trophy,
  GraduationCap,
  Vote,
  ShoppingCart,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkle
} from "../components/icons";
import { useContract } from "../lib/contracts/provider";
import { IdeaStatus, MilestoneStatus, GateType } from "../lib/contracts/types";
import { getCategoryFromStatus, getStageFromStatus } from "../lib/contracts/views";
import {
  useDiscoveryIdeas,
  useIdea,
  useFundingPool,
  useFundingProgress,
  useMilestones,
  useTokenBalance,
  useClaimableRevenue,
  useUserUSDYBalance,
  useTokenAllowance,
  useAgentDecisionsForSubject,
  useCreateIdea,
  useInvest,
  useSubmitMilestone,
  useClaimRevenue,
  useRefund,
  useAbandonIdea,
  useDelegateToAI,
  useVote,
  type DiscoveryIdea,
  type Idea,
  type FundingPoolState,
  type Milestone,
} from "../lib/hooks";
import { formatUnits, parseUnits } from "ethers";

// ============================================
// Constants
// ============================================

const USDY_DECIMALS = 6;
const MIN_CREATOR_DEPOSIT = "500"; // 500 USDY

// ============================================
// Components
// ============================================

function StatusBadge({ status }: { status: IdeaStatus }) {
  const colors: Record<IdeaStatus, string> = {
    [IdeaStatus.PENDING]: "bg-yellow-100 text-yellow-800",
    [IdeaStatus.APPROVED]: "bg-green-100 text-green-800",
    [IdeaStatus.REJECTED]: "bg-red-100 text-red-800",
    [IdeaStatus.ABANDONED]: "bg-gray-100 text-gray-800",
    [IdeaStatus.FUNDING]: "bg-blue-100 text-blue-800",
    [IdeaStatus.ACTIVE]: "bg-green-100 text-green-800",
    [IdeaStatus.COMPLETED]: "bg-green-100 text-green-800",
    [IdeaStatus.FAILED]: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {getCategoryFromStatus(status)}
    </span>
  );
}

function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const labels: Record<MilestoneStatus, string> = {
    [MilestoneStatus.PENDING]: "Pending",
    [MilestoneStatus.SUBMITTED]: "Submitted",
    [MilestoneStatus.VALIDATED]: "Validated",
    [MilestoneStatus.RELEASED]: "Released",
    [MilestoneStatus.DISPUTED]: "Disputed",
  };
  
  const colors: Record<MilestoneStatus, string> = {
    [MilestoneStatus.PENDING]: "bg-gray-100 text-gray-800",
    [MilestoneStatus.SUBMITTED]: "bg-yellow-100 text-yellow-800",
    [MilestoneStatus.VALIDATED]: "bg-blue-100 text-blue-800",
    [MilestoneStatus.RELEASED]: "bg-green-100 text-green-800",
    [MilestoneStatus.DISPUTED]: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

function LoadingSpinner() {
  return <Loader2 className="h-5 w-5 animate-spin text-[var(--color-ember-orange)]" />;
}

function ErrorMessage({ error }: { error: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700">
      <AlertCircle size={18} />
      <span className="text-sm">{error}</span>
    </div>
  );
}

function SuccessMessage({ message, hash }: { message: string; hash?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700">
      <Check size={18} />
      <div>
        <span className="text-sm font-medium">{message}</span>
        {hash && (
          <a 
            href={`https://sepolia.mantlescan.xyz/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-xs underline"
          >
            View on explorer
          </a>
        )}
      </div>
    </div>
  );
}

// ============================================
// Stage Components
// ============================================

// Stage 0: Create Idea
function CreateIdeaStage({ onComplete }: { onComplete: (ideaId: number) => void }) {
  const { wallet, addresses } = useContract();
  const { loading, error, createIdea } = useCreateIdea();
  const { data: usdyBalance } = useUserUSDYBalance();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetRaise: "10000",
    softCap: "5000",
    hardCap: "20000",
    competitionPrizeBps: "1000",
    builderAllocBps: "10000",
  });
  
  const [txResult, setTxResult] = useState<{ message: string; hash?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const ipfsHash = `ipfs://${Date.now()}`; // Placeholder - in production, upload to IPFS first
      
      const result = await createIdea({
        metadataIpfsHash: ipfsHash,
        targetRaise: parseUnits(formData.targetRaise, USDY_DECIMALS),
        softCap: parseUnits(formData.softCap, USDY_DECIMALS),
        hardCap: parseUnits(formData.hardCap, USDY_DECIMALS),
        fundingDeadline: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
        competitionPrizeBps: BigInt(formData.competitionPrizeBps),
        builderAllocBps: BigInt(formData.builderAllocBps),
        gateType: GateType.OPEN,
        gateParams: "0x",
      });
      
      setTxResult({ message: "Idea created successfully!", hash: result.hash });
      
      // Extract ideaId from transaction receipt events
      // For demo, we'll use a placeholder
      setTimeout(() => onComplete(0), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const hasEnoughBalance = usdyBalance && usdyBalance >= parseUnits(MIN_CREATOR_DEPOSIT, USDY_DECIMALS);

  return (
    <div className="rounded-xl border border-[var(--color-stone-border)] bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ember-orange)] text-white">
          <Plus size={18} />
        </div>
        <h3 className="text-lg font-semibold">Stage 1: Create an Idea</h3>
      </div>
      
      <p className="mb-4 text-sm text-[var(--color-graphite)]">
        Deposit 500 USDY to submit your idea. It will be reviewed by our AI agent.
      </p>

      {txResult ? (
        <SuccessMessage message={txResult.message} hash={txResult.hash} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-stone-border)] px-3 py-2 text-sm focus:border-[var(--color-ember-orange)] focus:outline-none"
              placeholder="My Awesome Idea"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-stone-border)] px-3 py-2 text-sm focus:border-[var(--color-ember-orange)] focus:outline-none"
              placeholder="Describe your idea..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Target Raise</label>
              <input
                type="number"
                value={formData.targetRaise}
                onChange={(e) => setFormData({ ...formData, targetRaise: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-stone-border)] px-3 py-2 text-sm focus:border-[var(--color-ember-orange)] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Soft Cap</label>
              <input
                type="number"
                value={formData.softCap}
                onChange={(e) => setFormData({ ...formData, softCap: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-stone-border)] px-3 py-2 text-sm focus:border-[var(--color-ember-orange)] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Hard Cap</label>
              <input
                type="number"
                value={formData.hardCap}
                onChange={(e) => setFormData({ ...formData, hardCap: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-stone-border)] px-3 py-2 text-sm focus:border-[var(--color-ember-orange)] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <strong>Deposit Required:</strong> 500 USDY (refundable 90% if rejected)
            <br />
            <span className="text-xs">
              Your balance: {usdyBalance ? formatUnits(usdyBalance, USDY_DECIMALS) : "0"} USDY
            </span>
          </div>

          {!hasEnoughBalance && (
            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
              Insufficient USDY balance. Please get testnet USDY first.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !hasEnoughBalance || !wallet.isConnected}
            className="pill-dark flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : null}
            {loading ? "Creating..." : "Submit Idea (Deposit 500 USDY)"}
          </button>

          {!wallet.isConnected && (
            <p className="text-center text-xs text-[var(--color-graphite)]">
              Connect your wallet to create an idea
            </p>
          )}
        </form>
      )}
    </div>
  );
}

// Stage 1: Fund
function FundingStage({ ideaId }: { ideaId: number }) {
  const { wallet, addresses } = useContract();
  const { data: idea } = useIdea(ideaId);
  const { data: progress, refetch } = useFundingProgress(idea?.fundingPool);
  const { data: usdyBalance } = useUserUSDYBalance();
  const { loading, invest } = useInvest();
  
  const [amount, setAmount] = useState("100");
  const [txResult, setTxResult] = useState<{ message: string; hash?: string } | null>(null);

  const handleInvest = async () => {
    try {
      const result = await invest(
        idea!.fundingPool,
        parseUnits(amount, USDY_DECIMALS)
      );
      setTxResult({ message: "Investment successful!", hash: result.hash });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (!idea || !progress) {
    return <LoadingSpinner />;
  }

  return (
    <div className="rounded-xl border border-[var(--color-stone-border)] bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
          <Wallet size={18} />
        </div>
        <h3 className="text-lg font-semibold">Stage 2: Fund the Idea</h3>
      </div>

      {txResult ? (
        <SuccessMessage message={txResult.message} hash={txResult.hash} />
      ) : (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-[var(--color-graphite)]">Funding Progress</span>
              <span className="font-medium">{progress.percentage}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[var(--color-meadow-green)] transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-[var(--color-ash)]">
              <span>Raised: {formatUnits(progress.raised, USDY_DECIMALS)} USDY</span>
              <span>Goal: {formatUnits(progress.softCap, USDY_DECIMALS)} USDY</span>
            </div>
          </div>

          {/* Token Price Preview */}
          <div className="rounded-lg bg-[var(--color-parchment-card)] p-3">
            <p className="text-xs text-[var(--color-ash)]">Current Token Price</p>
            <p className="text-lg font-semibold">~{formatUnits(BigInt(1e6), 0)} USDY per token</p>
            <p className="text-xs text-[var(--color-graphite)]">Early investors get more tokens (1x-2x bonding curve)</p>
          </div>

          {/* Invest Input */}
          <div>
            <label className="mb-1 block text-sm font-medium">Investment Amount (USDY)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-stone-border)] px-3 py-2 text-sm focus:border-[var(--color-ember-orange)] focus:outline-none"
              min="1"
            />
            <p className="mt-1 text-xs text-[var(--color-graphite)]">
              Balance: {usdyBalance ? formatUnits(usdyBalance, USDY_DECIMALS) : "0"} USDY
            </p>
          </div>

          <button
            onClick={handleInvest}
            disabled={loading || !wallet.isConnected || !progress.softCapMet}
            className="pill-dark flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : null}
            {loading ? "Investing..." : "Invest USDY"}
          </button>

          {!progress.softCapMet && (
            <p className="text-center text-xs text-[var(--color-graphite)]">
              Funding not yet active (waiting for soft cap)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Stage 2: Milestones
function MilestonesStage({ ideaId }: { ideaId: number }) {
  const { wallet, addresses } = useContract();
  const { data: idea } = useIdea(ideaId);
  const { data: milestones, refetch } = useMilestones(idea?.fundingPool);
  const { loading, submitMilestone } = useSubmitMilestone();

  const handleSubmitMilestone = async (index: number) => {
    try {
      await submitMilestone(idea!.fundingPool, index);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (!idea) {
    return <LoadingSpinner />;
  }

  return (
    <div className="rounded-xl border border-[var(--color-stone-border)] bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
          <GraduationCap size={18} />
        </div>
        <h3 className="text-lg font-semibold">Stage 3: Milestones</h3>
      </div>

      {milestones && milestones.length > 0 ? (
        <div className="space-y-3">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Milestone {i + 1}</p>
                <p className="text-sm text-[var(--color-graphite)]">
                  {formatUnits(m.amount, USDY_DECIMALS)} USDY
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MilestoneStatusBadge status={m.status} />
                {m.status === MilestoneStatus.PENDING && wallet.address && (
                  <button
                    onClick={() => handleSubmitMilestone(i)}
                    disabled={loading}
                    className="rounded-lg bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? "..." : "Submit"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-graphite)]">No milestones defined yet.</p>
      )}

      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <strong>AI Validation:</strong> After submission, the AI agent validates your work.
        <br />Confidence ≥ 75 → Funds released automatically
        <br />Confidence 50-74 → Validated but funds held
      </div>
    </div>
  );
}

// Stage 3: Revenue
function RevenueStage({ ideaId }: { ideaId: number }) {
  const { wallet } = useContract();
  const { data: idea } = useIdea(ideaId);
  const { data: claimable, refetch } = useClaimableRevenue(idea?.ideaToken, wallet.address || undefined);
  const { data: tokenBalance } = useTokenBalance(idea?.ideaToken, wallet.address || undefined);
  const { loading, claimRevenue } = useClaimRevenue();

  const handleClaim = async () => {
    try {
      await claimRevenue(idea!.ideaToken);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (!idea) {
    return <LoadingSpinner />;
  }

  return (
    <div className="rounded-xl border border-[var(--color-stone-border)] bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
          <Trophy size={18} />
        </div>
        <h3 className="text-lg font-semibold">Stage 4: Revenue Share</h3>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-[var(--color-parchment-card)] p-4">
          <p className="text-sm text-[var(--color-ash)]">Your Token Balance</p>
          <p className="text-2xl font-bold">
            {tokenBalance ? formatUnits(tokenBalance, 18) : "0"} tokens
          </p>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">Claimable Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            {claimable ? formatUnits(claimable, USDY_DECIMALS) : "0"} USDY
          </p>
        </div>

        <button
          onClick={handleClaim}
          disabled={loading || !claimable || claimable === BigInt(0)}
          className="pill-dark flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
        >
          {loading ? <LoadingSpinner /> : null}
          {loading ? "Claiming..." : "Claim Revenue"}
        </button>
      </div>
    </div>
  );
}

// Stage 4: Governance
function GovernanceStage() {
  const { wallet } = useContract();
  const { loading: delegateLoading, delegate } = useDelegateToAI();
  const { loading: voteLoading, vote } = useVote();
  
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [proposals] = useState([
    { id: 0, title: "Fund expansion to Layer 2", votes: 15000, deadline: "2 days left" },
    { id: 1, title: "Add new AI evaluation criteria", votes: 8500, deadline: "5 days left" },
  ]);

  const handleDelegate = async () => {
    try {
      await delegate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (proposalId: number, support: boolean) => {
    try {
      await vote(proposalId, support);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-stone-border)] bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white">
          <Vote size={18} />
        </div>
        <h3 className="text-lg font-semibold">Stage 5: Governance</h3>
      </div>

      <div className="space-y-4">
        {/* Delegation */}
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium">Vote Delegation</p>
          <p className="mb-2 text-xs text-[var(--color-graphite)]">
            Delegate your voting power to the AI agent for automated decisions.
          </p>
          <button
            onClick={handleDelegate}
            disabled={delegateLoading || !wallet.isConnected}
            className="rounded-lg bg-purple-500 px-4 py-1.5 text-sm text-white hover:bg-purple-600 disabled:opacity-50"
          >
            {delegateLoading ? "Delegating..." : "Delegate to AI"}
          </button>
        </div>

        {/* Active Proposals */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Active Proposals</p>
          {proposals.map((p) => (
            <div key={p.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-[var(--color-ash)]">{p.deadline}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVote(p.id, true)}
                    disabled={voteLoading || !wallet.isConnected}
                    className="rounded-lg bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleVote(p.id, false)}
                    disabled={voteLoading || !wallet.isConnected}
                    className="rounded-lg bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    No
                  </button>
                </div>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                <div className="h-full w-1/2 rounded-full bg-purple-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stage 5: Marketplace
function MarketplaceStage({ ideaId }: { ideaId: number }) {
  const { wallet } = useContract();
  const { data: idea } = useIdea(ideaId);
  const { data: tokenBalance } = useTokenBalance(idea?.ideaToken, wallet.address || undefined);

  const [listingPrice, setListingPrice] = useState("1.5");

  return (
    <div className="rounded-xl border border-[var(--color-stone-border)] bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white">
          <ShoppingCart size={18} />
        </div>
        <h3 className="text-lg font-semibold">Stage 6: Secondary Market</h3>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-[var(--color-parchment-card)] p-3">
          <p className="text-xs text-[var(--color-ash)]">Your Token Balance</p>
          <p className="text-lg font-bold">
            {tokenBalance ? formatUnits(tokenBalance, 18) : "0"} tokens
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Listing Price (USDY per token)</label>
          <input
            type="number"
            value={listingPrice}
            onChange={(e) => setListingPrice(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-stone-border)] px-3 py-2 text-sm focus:border-[var(--color-ember-orange)] focus:outline-none"
          />
        </div>

        <button
          disabled={!wallet.isConnected || !tokenBalance || tokenBalance === BigInt(0)}
          className="pill-dark w-full py-2.5 text-sm disabled:opacity-50"
        >
          Create Listing
        </button>

        <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <strong>Marketplace Fee:</strong> 2.5% on every trade
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Flow Component
// ============================================

export default function ProtocolFlowPage() {
  const { wallet, connect } = useContract();
  const { data: ideas } = useDiscoveryIdeas();
  
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null);

  const stages = [
    { name: "Create Idea", icon: Plus, description: "Submit your idea with 500 USDY deposit" },
    { name: "AI Review", icon: Sparkle, description: "AI evaluates and approves/rejects" },
    { name: "Funding", icon: Wallet, description: "Invest in approved ideas" },
    { name: "Development", icon: GraduationCap, description: "Build milestones, get validated" },
    { name: "Revenue", icon: Trophy, description: "Earn from product success" },
    { name: "Governance", icon: Vote, description: "Participate in protocol decisions" },
    { name: "Marketplace", icon: ShoppingCart, description: "Trade idea tokens" },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">FounderSea Protocol Flow</h1>
          <p className="mt-2 text-[var(--color-graphite)]">
            Complete guide to creating, funding, and profiting from ideas on-chain
          </p>
        </div>

        {/* Wallet Status */}
        {!wallet.isConnected ? (
          <div className="mb-8 flex items-center justify-center gap-4 rounded-xl border border-[var(--color-stone-border)] bg-white p-6">
            <AlertCircle className="text-[var(--color-ember-orange)]" size={24} />
            <div>
              <p className="font-medium">Connect your wallet to interact with the protocol</p>
              <p className="text-sm text-[var(--color-graphite)]">Required: Mantle Sepolia network</p>
            </div>
            <button onClick={connect} className="pill-dark px-6">
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="mb-8 flex items-center justify-center gap-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <Check className="text-green-500" size={24} />
            <div>
              <p className="font-medium text-green-700">Wallet Connected</p>
              <p className="text-sm text-green-600">
                {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)} | Mantle Sepolia
              </p>
            </div>
          </div>
        )}

        {/* Stage Navigation */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {stages.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentStage(i)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all ${
                    currentStage === i
                      ? "border-[var(--color-ember-orange)] bg-[var(--color-ember-orange)]/5"
                      : "border-[var(--color-stone-border)] hover:border-[var(--color-ember-orange)]"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    currentStage === i
                      ? "bg-[var(--color-ember-orange)] text-white"
                      : "bg-gray-100"
                  }`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-medium">{stage.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Stage Detail */}
          <div>
            {currentStage === 0 && <CreateIdeaStage onComplete={(id) => { setSelectedIdeaId(id); setCurrentStage(2); }} />}
            {currentStage === 1 && (
              <div className="rounded-xl border border-[var(--color-stone-border)] bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white">
                    <Sparkle size={18} />
                  </div>
                  <h3 className="text-lg font-semibold">Stage 2: AI Review</h3>
                </div>
                <p className="text-sm text-[var(--color-graphite)]">
                  Your idea is being reviewed by our AI agent. This typically takes a few minutes.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <LoadingSpinner />
                  <span className="text-sm">AI analyzing idea...</span>
                </div>
              </div>
            )}
            {currentStage === 2 && <FundingStage ideaId={selectedIdeaId || 0} />}
            {currentStage === 3 && <MilestonesStage ideaId={selectedIdeaId || 0} />}
            {currentStage === 4 && <RevenueStage ideaId={selectedIdeaId || 0} />}
            {currentStage === 5 && <GovernanceStage />}
            {currentStage === 6 && <MarketplaceStage ideaId={selectedIdeaId || 0} />}
          </div>

          {/* Stage Description & Flow */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-stone-border)] bg-white p-6">
              <h3 className="mb-3 text-lg font-semibold">{stages[currentStage].name}</h3>
              <p className="text-sm text-[var(--color-graphite)]">{stages[currentStage].description}</p>
              
              <div className="mt-4 space-y-2 text-sm">
                <h4 className="font-medium">What happens at this stage:</h4>
                {currentStage === 0 && (
                  <ul className="list-inside list-disc space-y-1 text-[var(--color-graphite)]">
                    <li>Creator deposits 500 USDY (refundable 90%)</li>
                    <li>FundingPool & IdeaToken are deployed</li>
                    <li>Idea status becomes PENDING</li>
                    <li>AI agent receives the idea for review</li>
                  </ul>
                )}
                {currentStage === 1 && (
                  <ul className="list-inside list-disc space-y-1 text-[var(--color-graphite)]">
                    <li>AI scores the idea (0-100)</li>
                    <li>Score ≥ 50 → APPROVED</li>
                    <li>Score &lt; 50 → REJECTED (450 USDY refunded)</li>
                    <li>Decision recorded on-chain via AgentIdentity</li>
                  </ul>
                )}
                {currentStage === 2 && (
                  <ul className="list-inside list-disc space-y-1 text-[var(--color-graphite)]">
                    <li>Investors deposit USDY into FundingPool</li>
                    <li>IdeaTokens minted at bonding curve price</li>
                    <li>Early investors pay 1x, late investors up to 2x</li>
                    <li>Soft cap triggers creator to close funding</li>
                  </ul>
                )}
                {currentStage === 3 && (
                  <ul className="list-inside list-disc space-y-1 text-[var(--color-graphite)]">
                    <li>Builder assigned after funding closes</li>
                    <li>Milestones defined with amounts & deadlines</li>
                    <li>Builder submits work for each milestone</li>
                    <li>AI validates (confidence ≥ 75 = auto-release)</li>
                  </ul>
                )}
                {currentStage === 4 && (
                  <ul className="list-inside list-disc space-y-1 text-[var(--color-graphite)]">
                    <li>BuilderAgreement signs (3-of-3)</li>
                    <li>Revenue source wired to IdeaToken</li>
                    <li>Product earns revenue → notifyRevenue()</li>
                    <li>Token holders claim proportional share</li>
                  </ul>
                )}
                {currentStage === 5 && (
                  <ul className="list-inside list-disc space-y-1 text-[var(--color-graphite)]">
                    <li>Token holders delegate votes to AI</li>
                    <li>Proposals created for protocol changes</li>
                    <li>AI casts delegated votes with confidence</li>
                    <li>Majority decides after voting period</li>
                  </ul>
                )}
                {currentStage === 6 && (
                  <ul className="list-inside list-disc space-y-1 text-[var(--color-graphite)]">
                    <li>List IdeaTokens for sale</li>
                    <li>Place bids on tokens</li>
                    <li>2.5% protocol fee on trades</li>
                    <li>Settlement via EIP-712 for gas efficiency</li>
                  </ul>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl border border-[var(--color-stone-border)] bg-white p-4">
              <h4 className="mb-3 font-medium">Related Pages</h4>
              <div className="flex flex-wrap gap-2">
                <a href="/discover" className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs hover:bg-gray-200">
                  Discover Ideas
                </a>
                <a href="/create" className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs hover:bg-gray-200">
                  Create Idea
                </a>
                <a href="/portfolio" className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs hover:bg-gray-200">
                  My Portfolio
                </a>
                <a href="/agent" className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs hover:bg-gray-200">
                  AI Agent Monitor
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
