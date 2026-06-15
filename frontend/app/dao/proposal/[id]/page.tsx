"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Vote,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ArrowSquareOut,
  Users,
  Brain,
  TrendUp,
  X,
  Alert
} from "../../../components/icons";

interface ProposalData {
  proposal: {
    proposalId: number;
    ideaId: number;
    descriptionIpfsHash: string;
    votingDeadline: number;
    yesVotes: number;
    noVotes: number;
    aiYesVotes: number;
    aiNoVotes: number;
    executed: boolean;
    aiRecommendation: boolean;
    aiConfidence: number;
    created: boolean;
    snapshotBlock: number;
  };
  status: {
    yesVotes: number;
    noVotes: number;
    aiYesVotes: number;
    aiNoVotes: number;
    executed: boolean;
    votingActive: boolean;
  };
  userInfo?: {
    hasVoted: boolean;
    isDelegatedToAI: boolean;
    votingPower: number;
    canVote: boolean;
  };
  metadata?: {
    title: string;
    description: string;
    category: string;
    resources?: string[];
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toString();
}

function formatTimeRemaining(deadline: number): string {
  const now = Date.now() / 1000;
  const remaining = deadline - now;
  
  if (remaining <= 0) return "Ended";
  
  const days = Math.floor(remaining / (24 * 60 * 60));
  const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((remaining % (60 * 60)) / 60);
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

function getTimeStatus(deadline: number): 'active' | 'ending' | 'ended' {
  const now = Date.now() / 1000;
  const remaining = deadline - now;
  
  if (remaining <= 0) return 'ended';
  if (remaining < 24 * 60 * 60) return 'ending';
  return 'active';
}

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id as string;
  
  const [data, setData] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [delegating, setDelegating] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/dao/proposal/${proposalId}`);
        if (!response.ok) throw new Error('Failed to fetch proposal');
        const result = await response.json();
        
        // Fetch status
        const statusResponse = await fetch(`/api/dao/proposal/${proposalId}/status`);
        const statusResult = await statusResponse.json();
        
        // Fetch metadata if IPFS hash exists
        let metadata = null;
        if (result.data.descriptionIpfsHash?.startsWith('Qm')) {
          try {
            const metaResponse = await fetch(`https://ipfs.io/ipfs/${result.data.descriptionIpfsHash}`);
            if (metaResponse.ok) {
              metadata = await metaResponse.json();
            }
          } catch (e) {
            console.warn('Failed to fetch IPFS metadata');
          }
        }
        
        setData({
          proposal: result.data,
          status: statusResult.data,
          metadata,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (proposalId) {
      fetchData();
    }
  }, [proposalId]);

  const handleVote = async (support: boolean) => {
    setVoting(true);
    setTxHash(null);
    try {
      const response = await fetch(`/api/dao/proposal/${proposalId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ support }),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to vote');
      }
      
      const result = await response.json();
      setTxHash(result.data.transactionHash);
      
      // Refresh data
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVoting(false);
    }
  };

  const handleDelegate = async () => {
    setDelegating(true);
    try {
      const response = await fetch('/api/dao/delegate', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delegate');
      }
      
      // Refresh
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDelegating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0052FF]" />
      </div>
    );
  }

  if (error || !data?.proposal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">Proposal Not Found</h2>
          <p className="text-zinc-400">{error || 'The proposal does not exist'}</p>
          <a href="/ideas" className="mt-4 inline-flex items-center gap-2 text-[#0052FF] hover:underline">
            <ArrowSquareOut className="w-4 h-4" />
            Back to Ideas
          </a>
        </div>
      </div>
    );
  }

  const { proposal, status, metadata } = data;
  const totalYes = status.yesVotes + status.aiYesVotes;
  const totalNo = status.noVotes + status.aiNoVotes;
  const totalVotes = totalYes + totalNo;
  const yesPercent = totalVotes > 0 ? (totalYes / totalVotes) * 100 : 50;
  const timeStatus = getTimeStatus(proposal.votingDeadline);
  const isPassed = totalYes > totalNo;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href={`/ideas/${proposal.ideaId}/product`} className="text-zinc-400 hover:text-white">
                <ArrowSquareOut className="w-5 h-5" />
              </a>
              <div className={`h-3 w-3 rounded-full ${
                status.executed 
                  ? isPassed ? 'bg-emerald-400' : 'bg-red-400'
                  : timeStatus === 'active' ? 'bg-[#0052FF] animate-pulse'
                  : timeStatus === 'ending' ? 'bg-yellow-400' : 'bg-zinc-500'
              }`} />
              <span className="font-mono text-sm text-zinc-500">PROPOSAL #{proposal.proposalId}</span>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 ${
              status.executed 
                ? isPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                : timeStatus === 'active' ? 'bg-[#0052FF]/10 text-[#0052FF]'
                : timeStatus === 'ending' ? 'bg-yellow-500/10 text-yellow-400'
                : 'bg-zinc-500/10 text-zinc-400'
            }`}>
              {status.executed ? (
                isPassed ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />
              ) : timeStatus === 'active' ? (
                <Clock className="w-4 h-4" />
              ) : null}
              <span className="text-sm font-medium">
                {status.executed 
                  ? isPassed ? 'Passed' : 'Rejected'
                  : timeStatus === 'active' ? 'Voting Active'
                  : timeStatus === 'ending' ? 'Ending Soon'
                  : 'Voting Ended'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Proposal Title */}
        <div className="mb-8">
          <h1 className="font-outfit text-3xl font-medium text-white mb-2">
            {metadata?.title || `Proposal #${proposal.proposalId}`}
          </h1>
          <p className="text-zinc-400">
            {metadata?.description || 'No description provided for this proposal.'}
          </p>
          {proposal.descriptionIpfsHash && proposal.descriptionIpfsHash.startsWith('Qm') && (
            <a 
              href={`https://gateway.pinata.cloud/ipfs/${proposal.descriptionIpfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-[#0052FF] hover:underline"
            >
              View Full Proposal
              <ArrowSquareOut className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Voting Results */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-outfit text-lg font-medium text-white">Voting Results</h3>
                <span className="text-sm text-zinc-500">
                  {status.votingActive ? formatTimeRemaining(proposal.votingDeadline) : 'Voting ended'}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-emerald-400">For ({yesPercent.toFixed(1)}%)</span>
                  <span className="text-red-400">Against ({(100 - yesPercent).toFixed(1)}%)</span>
                </div>
                <div className="h-6 overflow-hidden rounded-full bg-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#0052FF] transition-all"
                    style={{ width: `${yesPercent}%` }}
                  />
                </div>
              </div>

              {/* Vote Counts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-[#050505] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <TrendUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-zinc-400">For</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-white">{formatNumber(totalYes)}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {status.yesVotes > 0 && `${formatNumber(status.yesVotes)} manual`}
                    {status.yesVotes > 0 && status.aiYesVotes > 0 && ' + '}
                    {status.aiYesVotes > 0 && `${formatNumber(status.aiYesVotes)} AI delegated`}
                  </p>
                </div>
                <div className="rounded-lg bg-[#050505] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <TrendUp className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-zinc-400">Against</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-white">{formatNumber(totalNo)}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {status.noVotes > 0 && `${formatNumber(status.noVotes)} manual`}
                    {status.noVotes > 0 && status.aiNoVotes > 0 && ' + '}
                    {status.aiNoVotes > 0 && `${formatNumber(status.aiNoVotes)} AI delegated`}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            {proposal.aiRecommendation && (
              <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0052FF]/10">
                    <Brain className="w-5 h-5 text-[#0052FF]" />
                  </div>
                  <div>
                    <h3 className="font-outfit text-lg font-medium text-white">AI Agent Recommendation</h3>
                    <p className="text-sm text-zinc-500">Confidence: {proposal.aiConfidence}%</p>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${
                  proposal.aiRecommendation ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {proposal.aiRecommendation ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>AI Recommends: YES</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>AI Recommends: NO</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Resources */}
            {metadata?.resources && metadata.resources.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                <h3 className="mb-4 font-outfit text-lg font-medium text-white">Resources</h3>
                <div className="space-y-2">
                  {metadata.resources.map((resource, i) => (
                    <a 
                      key={i}
                      href={resource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#0052FF] hover:underline"
                    >
                      <ArrowSquareOut className="w-4 h-4" />
                      {resource}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Voting Action */}
            {status.votingActive && (
              <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                <h3 className="mb-4 font-outfit text-lg font-medium text-white">Cast Your Vote</h3>
                
                {txHash && (
                  <div className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Vote submitted! 
                    <a 
                      href={`https://sepolia.mantlescan.xyz/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 underline"
                    >
                      View on explorer
                    </a>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => handleVote(true)}
                    disabled={voting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {voting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Vote Yes
                  </button>
                  <button
                    onClick={() => handleVote(false)}
                    disabled={voting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {voting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Vote No
                  </button>
                </div>
              </div>
            )}

            {/* AI Delegation */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0052FF]/10">
                  <Brain className="w-4 h-4 text-[#0052FF]" />
                </div>
                <h3 className="font-outfit text-lg font-medium text-white">AI Delegation</h3>
              </div>
              <p className="mb-4 text-sm text-zinc-400">
                Delegate your voting power to the AI agent. The AI will vote on your behalf based on its analysis.
              </p>
              
              {userAddress ? (
                <div className="space-y-3">
                  <button
                    onClick={handleDelegate}
                    disabled={delegating}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#0052FF] bg-[#0052FF]/10 px-4 py-3 font-medium text-[#0052FF] hover:bg-[#0052FF]/20 disabled:opacity-50"
                  >
                    {delegating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    Delegate to AI
                  </button>
                </div>
              ) : (
                <div className="rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-400">
                  Connect your wallet to vote or delegate
                </div>
              )}
            </div>

            {/* Proposal Info */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <h3 className="mb-4 font-outfit text-lg font-medium text-white">Proposal Details</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Idea ID</span>
                  <a href={`/ideas/${proposal.ideaId}/product`} className="text-[#0052FF] hover:underline">
                    #{proposal.ideaId}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Snapshot Block</span>
                  <span className="font-mono text-white">{proposal.snapshotBlock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Voting Deadline</span>
                  <span className="text-white">
                    {new Date(proposal.votingDeadline * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Status</span>
                  <span className={status.executed ? 'text-emerald-400' : 'text-[#0052FF]'}>
                    {status.executed ? 'Executed' : 'Pending Execution'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}