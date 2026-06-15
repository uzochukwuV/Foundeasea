"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Brain, 
  Coins, 
  ShieldCheck, 
  TrendUp, 
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  ArrowRight,
  Vote,
  Target
} from "../../../components/icons";

interface IdeaProductData {
  idea: {
    ideaId: number;
    title: string;
    oneLiner: string;
    description: string;
    category: string;
    image: string;
    creator: string;
    status: number;
    statusText: string;
    aiScore: number;
    approvalReasonHash: string;
    stage: string;
    config: {
      targetRaise: number;
      softCap: number;
      hardCap: number;
      fundingDeadline: number;
      competitionPrizeBps: number;
      builderAllocBps: number;
    };
  };
  funding: {
    address: string;
    softCap: number;
    hardCap: number;
    raisedAmount: number;
    competitionPrizeBps: number;
    builderAssigned: boolean;
    fundingClosed: boolean;
    fundingToken: string;
    daoAddress: string;
    progressPercent: number;
  } | null;
  token: {
    address: string;
    name: string;
    symbol: string;
    totalSupply: number;
    owner: string;
  } | null;
  builder: {
    address: string;
    milestones: any[];
  } | null;
  milestones: any[];
  funders: any[];
  daoVoting: {
    address: string;
    proposals: any[];
    totalProposals: number;
  };
  metadata: {
    ipfsHash: string;
    gatewayUrl: string | null;
  };
}

const stageConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_REVIEW: { label: "Pending AI Review", color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
  FUNDING_OPEN: { label: "Funding Open", color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  FUNDING_FAILED: { label: "Funding Failed", color: "text-red-400", bgColor: "bg-red-400/10" },
  AWAITING_BUILDER: { label: "Awaiting Builder", color: "text-blue-400", bgColor: "bg-blue-400/10" },
  IN_DEVELOPMENT: { label: "In Development", color: "text-purple-400", bgColor: "bg-purple-400/10" },
  ACTIVE_WITH_DAO: { label: "Active with DAO", color: "text-indigo-400", bgColor: "bg-indigo-400/10" },
  COMPLETED: { label: "Completed", color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  REJECTED: { label: "Rejected", color: "text-red-400", bgColor: "bg-red-400/10" },
  ACTIVE: { label: "Active", color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  UNKNOWN: { label: "Unknown", color: "text-zinc-400", bgColor: "bg-zinc-400/10" },
};

function formatAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatUSDY(amount: number): string {
  return `$${formatNumber(amount)} USDY`;
}

export default function IdeaProductPage() {
  const params = useParams();
  const ideaId = params.id as string;
  
  const [data, setData] = useState<IdeaProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'funding' | 'milestones' | 'dao'>('overview');

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/ideas/${ideaId}/product`);
        if (!response.ok) throw new Error('Failed to fetch idea');
        const result = await response.json();
        setData(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (ideaId) {
      fetchData();
    }
  }, [ideaId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0052FF]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">Failed to load idea</h2>
          <p className="text-zinc-400">{error || 'Idea not found'}</p>
        </div>
      </div>
    );
  }

  const { idea, funding, token, builder, milestones, daoVoting, metadata } = data;
  const stage = stageConfig[idea.stage] || stageConfig.UNKNOWN;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${idea.status === 1 ? 'bg-emerald-400' : idea.status === 0 ? 'bg-yellow-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="font-mono text-sm text-zinc-500">IDEA #{idea.ideaId}</span>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 ${stage.bgColor}`}>
              <span className={`text-sm font-medium ${stage.color}`}>{stage.label}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Title & Description */}
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded bg-[#0052FF]/20 px-3 py-1 font-mono text-xs text-[#0052FF]">
                  {idea.category}
                </span>
                {token && (
                  <span className="rounded bg-white/10 px-3 py-1 font-mono text-xs text-white">
                    {token.symbol}
                  </span>
                )}
              </div>
              <h1 className="font-outfit text-4xl font-medium text-white lg:text-5xl">{idea.title}</h1>
              <p className="mt-3 text-lg text-zinc-400">{idea.oneLiner}</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {(['overview', 'funding', 'milestones', 'dao'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-[#0052FF] text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description */}
                <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                  <h3 className="mb-4 font-outfit text-lg font-medium text-white">Description</h3>
                  <p className="text-zinc-400 whitespace-pre-wrap">{idea.description || 'No description provided.'}</p>
                </div>

                {/* Metadata Links */}
                {metadata.gatewayUrl && (
                  <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                    <h3 className="mb-4 font-outfit text-lg font-medium text-white">Documentation</h3>
                    <a 
                      href={metadata.gatewayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#0052FF] hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      View IPFS Metadata
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* AI Score */}
                <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                  <h3 className="mb-4 font-outfit text-lg font-medium text-white">AI Evaluation</h3>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`text-5xl font-mono font-bold ${idea.aiScore >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {idea.aiScore}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">AI Score</div>
                    </div>
                    <div className="h-16 w-px bg-white/10" />
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-[#0052FF]" />
                        <span className="font-medium text-white">AI Agent Analysis</span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {idea.status === 1 
                          ? 'This idea has been approved by the AI agent for funding.'
                          : idea.status === 0 
                          ? 'Awaiting AI agent review.'
                          : 'Not approved by AI agent.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'funding' && (
              <div className="space-y-6">
                {funding ? (
                  <>
                    {/* Funding Progress */}
                    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                      <h3 className="mb-6 font-outfit text-lg font-medium text-white">Funding Progress</h3>
                      
                      <div className="mb-6">
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-zinc-400">Progress</span>
                          <span className="font-mono text-white">{funding.progressPercent.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-white/10">
                          <div 
                            className="h-full bg-gradient-to-r from-[#0052FF] to-emerald-400 transition-all"
                            style={{ width: `${funding.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-[#050505] p-4 text-center">
                          <div className="font-mono text-xl font-bold text-white">{formatUSDY(funding.raisedAmount)}</div>
                          <div className="mt-1 text-xs text-zinc-500">Raised</div>
                        </div>
                        <div className="rounded-lg bg-[#050505] p-4 text-center">
                          <div className="font-mono text-xl font-bold text-white">{formatUSDY(funding.softCap)}</div>
                          <div className="mt-1 text-xs text-zinc-500">Soft Cap</div>
                        </div>
                        <div className="rounded-lg bg-[#050505] p-4 text-center">
                          <div className="font-mono text-xl font-bold text-white">{formatUSDY(funding.hardCap)}</div>
                          <div className="mt-1 text-xs text-zinc-500">Hard Cap</div>
                        </div>
                      </div>

                      {funding.fundingClosed && (
                        <div className={`mt-4 rounded-lg p-4 ${funding.raisedAmount >= funding.softCap ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                          <p className={funding.raisedAmount >= funding.softCap ? 'text-emerald-400' : 'text-red-400'}>
                            {funding.raisedAmount >= funding.softCap ? '✓ Funding goal met!' : '✗ Funding goal not met'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Funding Token */}
                    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                      <h3 className="mb-4 font-outfit text-lg font-medium text-white">Funding Token</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0052FF]/10">
                            <Coins className="w-5 h-5 text-[#0052FF]" />
                          </div>
                          <div>
                            <p className="font-mono text-sm text-white">{formatAddress(funding.fundingToken)}</p>
                            <p className="text-sm text-zinc-500">USDY Token Address</p>
                          </div>
                        </div>
                        <a 
                          href={`https://sepolia.mantlescan.xyz/address/${funding.fundingToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#0052FF] hover:underline"
                        >
                          View on Explorer
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 text-center">
                    <Coins className="mx-auto mb-4 w-12 h-12 text-zinc-600" />
                    <p className="text-zinc-400">No funding pool has been created yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'milestones' && (
              <div className="space-y-6">
                {milestones.length > 0 ? (
                  <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              milestone.released ? 'bg-emerald-500/20 text-emerald-400' :
                              milestone.validated ? 'bg-blue-500/20 text-blue-400' :
                              'bg-zinc-500/20 text-zinc-400'
                            }`}>
                              {milestone.released ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <span className="text-sm font-bold">{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-white">Milestone {index + 1}</h4>
                              <p className="text-sm text-zinc-500">
                                {milestone.deadline ? new Date(milestone.deadline * 1000).toLocaleDateString() : 'No deadline'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-white">{formatUSDY(milestone.amount)}</p>
                            <p className={`text-xs ${
                              milestone.released ? 'text-emerald-400' :
                              milestone.validated ? 'text-blue-400' :
                              'text-zinc-500'
                            }`}>
                              {milestone.released ? 'Released' : milestone.validated ? 'Validated' : 'Pending'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 text-center">
                    <Target className="mx-auto mb-4 w-12 h-12 text-zinc-600" />
                    <p className="text-zinc-400">No milestones defined yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dao' && (
              <div className="space-y-6">
                {daoVoting.address && daoVoting.proposals.length > 0 ? (
                  <div className="space-y-4">
                    {daoVoting.proposals.map((proposal: any) => (
                      <div key={proposal.id} className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              proposal.status === 'EXECUTED' ? 'bg-emerald-500/20 text-emerald-400' :
                              proposal.status === 'ENDED' ? 'bg-zinc-500/20 text-zinc-400' :
                              'bg-[#0052FF]/20 text-[#0052FF]'
                            }`}>
                              <Vote className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{proposal.title}</h4>
                              <p className="text-sm text-zinc-500">Proposal #{proposal.id}</p>
                            </div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                            proposal.status === 'EXECUTED' ? 'bg-emerald-500/20 text-emerald-400' :
                            proposal.status === 'ENDED' ? 'bg-zinc-500/20 text-zinc-400' :
                            'bg-[#0052FF]/20 text-[#0052FF]'
                          }`}>
                            {proposal.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg bg-[#050505] p-3">
                            <p className="text-xs text-zinc-500">For Votes</p>
                            <p className="font-mono text-emerald-400">{formatNumber(proposal.forVotes)}</p>
                          </div>
                          <div className="rounded-lg bg-[#050505] p-3">
                            <p className="text-xs text-zinc-500">Against Votes</p>
                            <p className="font-mono text-red-400">{formatNumber(proposal.againstVotes)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 text-center">
                    <Vote className="mx-auto mb-4 w-12 h-12 text-zinc-600" />
                    <p className="text-zinc-400">No DAO proposals yet.</p>
                    {idea.status === 4 && !daoVoting.address && (
                      <p className="mt-2 text-sm text-zinc-500">DAO will be created once the project becomes active.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Creator & Builder */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <h3 className="mb-4 font-outfit text-lg font-medium text-white">Team</h3>
              
              <div className="mb-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Creator</p>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-400" />
                  <span className="font-mono text-sm text-white">{formatAddress(idea.creator)}</span>
                </div>
              </div>

              {builder ? (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Builder</p>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-sm text-white">{formatAddress(builder.address)}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-[#050505] p-3 text-center">
                  <p className="text-sm text-zinc-500">No builder assigned</p>
                </div>
              )}
            </div>

            {/* Idea Token */}
            {token && (
              <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                <h3 className="mb-4 font-outfit text-lg font-medium text-white">Idea Token</h3>
                
                <div className="mb-4 rounded-lg bg-[#050505] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">{token.name}</span>
                    <span className="font-mono text-[#0052FF]">{token.symbol}</span>
                  </div>
                  <div className="text-xs text-zinc-500">Total Supply: {formatNumber(token.totalSupply)}</div>
                </div>

                <a 
                  href={`https://sepolia.mantlescan.xyz/address/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white hover:bg-white/5"
                >
                  <Coins className="w-4 h-4" />
                  View Token Contract
                </a>
              </div>
            )}

            {/* Contract Addresses */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <h3 className="mb-4 font-outfit text-lg font-medium text-white">Contracts</h3>
              
              <div className="space-y-3">
                {funding && (
                  <div className="rounded-lg bg-[#050505] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">Funding Pool</p>
                    <p className="mt-1 break-all font-mono text-xs text-[#0052FF]">{funding.address}</p>
                  </div>
                )}
                {token && (
                  <div className="rounded-lg bg-[#050505] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">Idea Token</p>
                    <p className="mt-1 break-all font-mono text-xs text-[#0052FF]">{token.address}</p>
                  </div>
                )}
                {daoVoting.address && (
                  <div className="rounded-lg bg-[#050505] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">DAO Voting</p>
                    <p className="mt-1 break-all font-mono text-xs text-[#0052FF]">{daoVoting.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Funding Config */}
            {idea.config && (
              <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                <h3 className="mb-4 font-outfit text-lg font-medium text-white">Funding Config</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Target Raise</span>
                    <span className="font-mono text-white">{formatUSDY(idea.config.targetRaise)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Competition Prize</span>
                    <span className="font-mono text-white">{(idea.config.competitionPrizeBps / 100)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Builder Allocation</span>
                    <span className="font-mono text-white">{(idea.config.builderAllocBps / 100)}%</span>
                  </div>
                  {idea.config.fundingDeadline > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Funding Deadline</span>
                      <span className="font-mono text-white">
                        {new Date(idea.config.fundingDeadline * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}