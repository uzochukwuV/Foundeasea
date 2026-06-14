"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import { Brain, Coins, Gauge, Medal, ShieldCheck, TrendUp, UsersThree, AlertCircle, Check, Loader2 } from "../../components/icons";
import { DisabledTxButton, InternalLink, MiniBars, PageIntro, StatCard, StatusChip, VerifyRow } from "../../components/uiBits";
import { useContract } from "../../lib/contracts/provider";
import {
  useIdea,
  useFundingPool,
  useFundingProgress,
  useMilestones,
  useIdeaToken,
  useTokenBalance,
  useClaimableRevenue,
  useCanFund,
  useAgentDecisionsForSubject,
  useInvest,
  useSubmitMilestone,
  useClaimRevenue,
  type Idea,
  type FundingPoolState,
  type Milestone,
  type IdeaTokenState,
} from "../../lib/hooks";
import { formatUSDYShort, formatProgress, getIdeaStatusLabel, getMilestoneStatusLabel, shortenAddress, formatTimestamp, formatDeadline } from "../../lib/utils";
import { formatUnits, parseUnits } from "ethers";
import { IdeaStatus, MilestoneStatus } from "../../lib/contracts/types";

export const dynamic = "force-dynamic";

const USDY_DECIMALS = 6;

// Seed data types
type SeedIdeaDetail = {
  idea: { 
    id: string; 
    title: string; 
    oneLiner: string; 
    category: string; 
    stage: string; 
    targetRaise: number; 
    funded: number; 
    aiConfidence: number; 
    currentPrice: number; 
    convictionTrend: string; 
    builderReputation: number; 
    investorCount: number 
  };
  overview: { 
    approvalSummary: string; 
    targetMarket: string; 
    roadmap: string[]; 
    comments: Array<{ author: string; text: string }> 
  };
  milestones: Array<{ 
    id: string; 
    label: string; 
    status: string; 
    amount: number; 
    confidence: number; 
    deadline: string; 
    note: string; 
    ipfs: string 
  }>;
  token: { 
    prices: number[]; 
    orderBook: Array<{ side: string; price: number; amount: number }>; 
    trades: Array<{ wallet: string; amount: number; price: number }>; 
    distribution: Record<string, number> 
  };
  aiLogs: Array<{ 
    id: string; 
    decisionType: string; 
    confidence: number; 
    inputHash: string; 
    outputHash: string; 
    summary: string 
  }>;
  investors: Array<{ 
    wallet: string; 
    held: number; 
    supplyPercent: number; 
    entryPrice: number; 
    unrealizedPnl: number; 
    signalOnly: boolean 
  }>;
  chair: { holder: string; paid: number; listed: boolean; acquiredAt: string };
  builder: { 
    address: string; 
    name: string; 
    role: string; 
    milestonesDelivered: number; 
    averageAiConfidence: number; 
    revenueGenerated: number; 
    badges: string[] 
  };
};

const tabs = ["overview", "milestones", "token", "ai-logs", "investors"];

// Investment Widget Component
function InvestmentWidget({ 
  fundingPool, 
  progress 
}: { 
  fundingPool: FundingPoolState | null; 
  progress: { raised: bigint; softCap: bigint; hardCap: bigint; percentage: number; softCapMet: boolean } | null;
}) {
  const { wallet, addresses } = useContract();
  const { loading: investLoading, invest } = useInvest();
  const [amount, setAmount] = useState("100");
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleInvest = async () => {
    if (!fundingPool) return;
    try {
      const result = await invest(fundingPool.factory, parseUnits(amount, USDY_DECIMALS));
      setTxHash(result.hash);
    } catch (err) {
      console.error(err);
    }
  };

  if (!progress || progress.softCapMet === false) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
        <AlertCircle size={16} className="inline mr-2" />
        Funding not yet active. Waiting for soft cap to be met.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[10px] bg-[var(--color-parchment-card)] p-4">
      <label className="text-[13px] text-[var(--color-ash)]" htmlFor="amount-input">Amount (USDY)</label>
      <input
        id="amount-input"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mt-2 w-full rounded-[10px] border border-[var(--color-stone-border)] bg-white p-3"
        placeholder="100"
      />
      <div className="mt-3 text-[14px]">
        <p>Estimated tokens: ~{amount || "0"}</p>
        <p className="text-[var(--color-ash)]">Price varies by bonding curve</p>
      </div>
      
      {txHash && (
        <div className="mt-3 rounded-lg bg-green-50 p-2 text-xs text-green-700">
          <Check size={14} className="inline mr-1" />
          <a href={`https://sepolia.mantlescan.xyz/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            Transaction successful
          </a>
        </div>
      )}

      <button
        onClick={handleInvest}
        disabled={investLoading || !wallet.isConnected}
        className="pill-dark mt-3 w-full py-2 text-sm disabled:opacity-50"
      >
        {investLoading ? <><Loader2 size={14} className="inline animate-spin mr-2" />Investing...</> : "Invest"}
      </button>
    </div>
  );
}

// Milestone Card Component
function MilestoneCard({ 
  milestone, 
  index, 
  poolAddress,
  isBuilder 
}: { 
  milestone: Milestone | null; 
  index: number;
  poolAddress: string | undefined;
  isBuilder: boolean;
}) {
  const { wallet } = useContract();
  const { loading: submitLoading, submitMilestone } = useSubmitMilestone();
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!milestone) return null;

  const handleSubmit = async () => {
    if (!poolAddress) return;
    try {
      const result = await submitMilestone(poolAddress, index);
      setTxHash(result.hash);
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = milestone.status === MilestoneStatus.RELEASED 
    ? "text-green-600 bg-green-50" 
    : milestone.status === MilestoneStatus.VALIDATED 
    ? "text-blue-600 bg-blue-50"
    : milestone.status === MilestoneStatus.SUBMITTED
    ? "text-yellow-600 bg-yellow-50"
    : "text-gray-600 bg-gray-50";

  return (
    <div className="stone-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
            {getMilestoneStatusLabel(milestone.status)}
          </span>
          <h3 className="mt-3 text-[23px] font-semibold">Milestone {index + 1}</h3>
          <p className="mt-2 text-[15px] text-[var(--color-graphite)]">
            Amount: {formatUnits(milestone.amount, USDY_DECIMALS)} USDY
          </p>
          <p className="text-[15px] text-[var(--color-graphite)]">
            Deadline: {formatDeadline(milestone.deadline)}
          </p>
          {milestone.aiConfidence > 0 && (
            <p className="mt-2 text-[15px] text-[var(--color-graphite)]">
              AI Confidence: {Number(milestone.aiConfidence)}%
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-[28px] font-semibold">{Number(milestone.aiConfidence)}%</div>
          <div className="text-[13px] text-[var(--color-ash)]">AI confidence</div>
        </div>
      </div>

      {txHash && (
        <div className="mt-3 rounded-lg bg-green-50 p-2 text-xs text-green-700">
          <Check size={14} className="inline mr-1" />
          <a href={`https://sepolia.mantlescan.xyz/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            Transaction submitted
          </a>
        </div>
      )}

      {isBuilder && milestone.status === MilestoneStatus.PENDING && wallet.address && (
        <button
          onClick={handleSubmit}
          disabled={submitLoading}
          className="pill-dark mt-4 py-2 text-sm"
        >
          {submitLoading ? "Submitting..." : "Submit for Review"}
        </button>
      )}
    </div>
  );
}

// Main Component
export default function IdeaDetailClient({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>; 
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { id } = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : { tab: undefined };
  const activeTabFromUrl = resolvedSearchParams?.tab || "overview";
  const ideaId = parseInt(id);
  
  const { wallet, addresses } = useContract();
  const [seedData, setSeedData] = useState<SeedIdeaDetail | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Contract data
  const { data: contractIdea, loading: ideaLoading } = useIdea(ideaId);
  const { data: fundingPool } = useFundingPool(contractIdea?.fundingPool);
  const { data: progress } = useFundingProgress(contractIdea?.fundingPool);
  const { data: milestones } = useMilestones(contractIdea?.fundingPool);
  const { data: ideaToken } = useIdeaToken(contractIdea?.ideaToken);
  const { data: userTokenBalance } = useTokenBalance(contractIdea?.ideaToken, wallet.address || undefined);
  const { data: claimableRevenue } = useClaimableRevenue(contractIdea?.ideaToken, wallet.address || undefined);
  const { data: canFund } = useCanFund(contractIdea?.fundingPool, wallet.address || undefined);
  const { data: aiDecisions } = useAgentDecisionsForSubject(ideaId);

  // Fetch seed data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { serverApi } = await import("../../lib/api");
        const apiData = await serverApi<SeedIdeaDetail>(`/api/ideas/${id}`);
        setSeedData(apiData);
      } catch (err) {
        console.error("Error loading seed data:", err);
      }
    };
    loadData();
    setActiveTab(activeTabFromUrl);
  }, [id, activeTabFromUrl]);

  // Use contract data if available
  const useContractData = addresses.ideaFactory && contractIdea && !ideaLoading;
  const pageData = useContractData ? {
    idea: {
      id: id,
      title: `Idea #${ideaId}`,
      oneLiner: contractIdea?.approvalReasonHash || "On-chain idea",
      category: getIdeaStatusLabel(contractIdea?.status || 0),
      stage: contractIdea?.status === IdeaStatus.APPROVED ? "approved" : contractIdea?.status === IdeaStatus.FUNDING ? "funding" : "pending",
      targetRaise: Number(fundingPool?.hardCap || 0),
      funded: Number(progress?.raised || 0),
      aiConfidence: Number(contractIdea?.aiScore || 0),
      currentPrice: 1,
      convictionTrend: "stable",
      builderReputation: 0,
      investorCount: 0,
    },
    overview: seedData?.overview || {
      approvalSummary: "This idea has been approved by the AI agent with a score of " + (contractIdea?.aiScore || 0) + ".",
      targetMarket: "Market data from contract",
      roadmap: milestones?.map((_, i) => `Milestone ${i + 1}`) || [],
      comments: [],
    },
    milestones: milestones?.map((m, i) => ({
      id: `contract-${i}`,
      label: `Milestone ${i + 1}`,
      status: getMilestoneStatusLabel(m.status).toLowerCase(),
      amount: Number(formatUnits(m.amount, USDY_DECIMALS)),
      confidence: Number(m.aiConfidence),
      deadline: formatDeadline(m.deadline),
      note: "Milestone details stored on-chain",
      ipfs: m.validationIpfsHash,
    })) || [],
    token: seedData?.token || { prices: [], orderBook: [], trades: [], distribution: {} },
    aiLogs: aiDecisions?.map((d, i) => ({
      id: `decision-${i}`,
      decisionType: `Decision Type ${d.decisionType}`,
      confidence: Number(d.confidence),
      inputHash: d.inputHash,
      outputHash: d.outputHash,
      summary: `AI made a decision with ${d.confidence}% confidence`,
    })) || [],
    investors: seedData?.investors || [],
    chair: seedData?.chair || { holder: "0x...", paid: 0, listed: false, acquiredAt: "" },
    builder: seedData?.builder || { address: fundingPool?.builder || "0x...", name: "TBD", role: "Builder", milestonesDelivered: 0, averageAiConfidence: 0, revenueGenerated: 0, badges: [] },
  } : seedData;

  if (!pageData) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-[var(--color-ember-orange)]" />
        </div>
      </AppShell>
    );
  }

  const funded = Math.round((pageData.idea.funded / pageData.idea.targetRaise) * 100);

  return (
    <AppShell>
      {/* Sticky Header */}
      <section className="sticky top-[65px] z-20 border-y border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] px-4 py-4 md:px-8" data-testid="idea-sticky-header">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip 
                label={pageData.idea.category} 
                tone={
                  pageData.idea.stage === "approved" ? "good" :
                  pageData.idea.stage === "rejected" ? "bad" :
                  pageData.idea.stage === "funding" ? "warn" : "neutral"
                }
                testId="idea-category-chip" 
              />
              <StatusChip 
                label={`${pageData.idea.aiConfidence} conviction`} 
                tone="good" 
                testId="idea-conviction-chip" 
              />
              {useContractData && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Live Contract Data
                </span>
              )}
            </div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.8px] text-[var(--color-charcoal-primary)]" data-testid="idea-header-title">{pageData.idea.title}</h1>
            <p className="text-[14px] text-[var(--color-graphite)]" data-testid="idea-header-tagline">{pageData.idea.oneLiner}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3" data-testid="idea-header-actions">
            <div className="rounded-full bg-white px-4 py-2 text-[14px] font-semibold" data-testid="idea-current-price">
              ~1 USDY per token
            </div>
            {useContractData && progress?.softCapMet ? (
              <Link href="#invest" className="pill-dark px-4 py-2">
                Invest
              </Link>
            ) : (
              <DisabledTxButton label="Invest" testId="idea-invest-button" />
            )}
            <DisabledTxButton label="Signal" testId="idea-signal-button" />
          </div>
        </div>
      </section>

      <PageIntro eyebrow="Product page" title="Everything an investor, builder, or creator needs in one focused product view." body="Tabs keep the full venture story organized: pitch, milestones, token surface, AI decisions, and investor social proof." />

      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-24 md:px-8 lg:grid-cols-[1fr_340px]" data-testid="idea-page-grid">
        <div data-testid="idea-main-column">
          <div className="mb-5 flex flex-wrap gap-2" data-testid="idea-tab-nav">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${activeTab === tab ? "pill-dark" : "pill-light"} h-10 px-4 py-2 text-[14px] font-medium`}
                data-testid={`idea-tab-${tab}`}
              >
                {tab.replace("-", " ")}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-5" data-testid="overview-tab-panel">
              <div className="stone-card p-6" data-testid="approval-summary-card">
                <Brain className="text-[var(--color-sky-blue)]" />
                <h2 className="mt-4 text-[23px] font-semibold" data-testid="approval-title">AI approval summary</h2>
                <p className="mt-3 text-[15px] leading-[1.55]" data-testid="approval-summary-text">{pageData.overview.approvalSummary}</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <StatCard label="Target market" value="Vertical SaaS" detail={pageData.overview.targetMarket} icon={<UsersThree color="var(--color-ember-orange)" />} testId="target-market-stat" />
                <StatCard 
                  label="Funding" 
                  value={`${funded}%`} 
                  detail={`${formatUSDYShort(BigInt(pageData.idea.funded * 1e6))} raised of ${formatUSDYShort(BigInt(pageData.idea.targetRaise * 1e6))}`} 
                  icon={<Coins color="var(--color-sunburst-yellow)" />} 
                  testId="funding-stat" 
                />
              </div>
              {progress && (
                <div className="stone-card p-6">
                  <h3 className="text-[18px] font-semibold">Funding Progress (Contract)</h3>
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Raised</span>
                      <span>{progress.percentage}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-[var(--color-meadow-green)]"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-[var(--color-ash)]">
                      <span>{formatUSDYShort(progress.raised)} USDY</span>
                      <span>Goal: {formatUSDYShort(progress.softCap)} - {formatUSDYShort(progress.hardCap)} USDY</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="stone-card p-6" data-testid="roadmap-card">
                <h2 className="text-[23px] font-semibold" data-testid="roadmap-title">Roadmap</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {pageData.overview.roadmap.map((item, index) => (
                    <div key={index} className="rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`roadmap-item-${index}`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="stone-card p-6" data-testid="comments-card">
                <h2 className="text-[23px] font-semibold" data-testid="comments-title">Signal staker questions</h2>
                {pageData.overview.comments.map((comment, index) => (
                  <div key={index} className="mt-4 rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`comment-${index}`}>
                    <strong>{comment.author}</strong>
                    <p>{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "milestones" && (
            <div className="space-y-4" data-testid="milestones-tab-panel">
              {useContractData && milestones ? (
                milestones.map((milestone, index) => (
                  <MilestoneCard
                    key={index}
                    milestone={milestone}
                    index={index}
                    poolAddress={contractIdea?.fundingPool}
                    isBuilder={wallet.address === fundingPool?.builder}
                  />
                ))
              ) : (
                pageData.milestones.map((milestone) => (
                  <Link key={milestone.id} href={`/milestones/${milestone.id}`} className="stone-card block p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <StatusChip 
                          label={milestone.status} 
                          tone={milestone.status === "released" || milestone.status === "validated" ? "good" : "warn"} 
                          testId={`milestone-status-${milestone.id}`} 
                        />
                        <h2 className="mt-3 text-[23px] font-semibold">{milestone.label}</h2>
                        <p className="mt-2 text-[15px]">{milestone.note}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[28px] font-semibold">{milestone.confidence}%</div>
                        <div className="text-[13px] text-[var(--color-ash)]">AI confidence</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === "token" && (
            <div className="space-y-5" data-testid="token-tab-panel">
              <div className="stone-card p-6">
                <h2 className="text-[23px] font-semibold">Your Position</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-[var(--color-parchment-card)] p-4">
                    <p className="text-sm text-[var(--color-ash)]">Token Balance</p>
                    <p className="text-2xl font-bold">
                      {userTokenBalance ? formatUnits(userTokenBalance, 18) : "0"} tokens
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm text-green-700">Claimable Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {claimableRevenue ? formatUSDYShort(claimableRevenue) : "$0"}
                    </p>
                  </div>
                </div>
                {claimableRevenue && claimableRevenue > BigInt(0) && (
                  <button className="pill-dark mt-4 py-2 text-sm">
                    Claim Revenue
                  </button>
                )}
              </div>
              <div className="stone-card p-6">
                <h2 className="text-[23px] font-semibold" data-testid="price-chart-title">TWAP price chart</h2>
                <div className="mt-5 rounded-[12px] bg-[var(--color-parchment-card)] p-5">
                  <MiniBars values={pageData.token.prices.map((price) => Math.round(price * 100))} color="var(--color-meadow-green)" testId="token-price-chart" />
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="stone-card p-6" data-testid="order-book-card">
                  <h2 className="text-[23px] font-semibold">Order book</h2>
                  {pageData.token.orderBook.map((order, index) => (
                    <div key={index} className="mt-3 flex justify-between rounded-[10px] bg-[var(--color-parchment-card)] p-3">
                      <span>{order.side}</span>
                      <span>${order.price.toFixed(2)} · {order.amount}</span>
                    </div>
                  ))}
                </div>
                <div className="stone-card p-6" data-testid="recent-trades-card">
                  <h2 className="text-[23px] font-semibold">Recent trades</h2>
                  {pageData.token.trades.map((trade, index) => (
                    <div key={index} className="mt-3 flex justify-between rounded-[10px] bg-[var(--color-parchment-card)] p-3">
                      <span>{trade.wallet}</span>
                      <span>{trade.amount} @ ${trade.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <DisabledTxButton label="Buy / Sell" testId="token-buy-sell-widget" />
            </div>
          )}

          {activeTab === "ai-logs" && (
            <div className="grid gap-4" data-testid="ai-logs-tab-panel">
              <div className="stone-card flex flex-wrap items-center justify-between gap-4 p-6" data-testid="global-agent-monitor-callout">
                <div>
                  <h2 className="text-[23px] font-semibold">Global AgentIdentity transparency</h2>
                  <p className="mt-2 text-[15px]">Review every protocol-level decision, confidence trend, and anomaly.</p>
                </div>
                <Link href="/agent" className="pill-dark h-11 px-5 py-3 text-[14px] font-semibold">Open AI Monitor</Link>
              </div>
              {pageData.aiLogs.map((log) => (
                <div key={log.id} className="stone-card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusChip label={log.decisionType} testId={`ai-log-type-${log.id}`} />
                    <div className="text-[28px] font-semibold">{log.confidence}%</div>
                  </div>
                  <p className="mt-4 text-[15px] leading-[1.55]">{log.summary}</p>
                  <div className="mt-4 grid gap-3">
                    <VerifyRow label="Input hash" value={log.inputHash} testId={`ai-log-input-${log.id}`} />
                    <VerifyRow label="Output hash" value={log.outputHash} testId={`ai-log-output-${log.id}`} />
                  </div>
                </div>
              ))}
              {pageData.aiLogs.length === 0 && (
                <div className="rounded-lg bg-gray-50 p-6 text-center text-[var(--color-graphite)]">
                  No AI decisions recorded for this idea yet.
                </div>
              )}
            </div>
          )}

          {activeTab === "investors" && (
            <div className="stone-card overflow-hidden" data-testid="investors-tab-panel">
              <div className="grid grid-cols-5 gap-3 bg-[var(--color-parchment-card)] p-4 text-[13px] font-semibold">
                <span>Wallet</span>
                <span>Held</span>
                <span>Supply</span>
                <span>Entry</span>
                <span>P&L</span>
              </div>
              {pageData.investors.map((investor, index) => (
                <div key={index} className="grid grid-cols-5 gap-3 border-t border-[var(--color-stone-surface)] p-4 text-[14px]">
                  <span>{investor.wallet}</span>
                  <span>{investor.signalOnly ? "Signal only" : investor.held}</span>
                  <span>{investor.supplyPercent}%</span>
                  <span>{investor.entryPrice ? `$${investor.entryPrice.toFixed(2)}` : "—"}</span>
                  <span>{investor.unrealizedPnl ? `$${investor.unrealizedPnl}` : "pending"}</span>
                </div>
              ))}
              {pageData.investors.length === 0 && (
                <div className="p-6 text-center text-[var(--color-graphite)]">
                  No investors yet. Be the first to invest!
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-5" data-testid="idea-sidebar">
          {/* Chair Panel */}
          <div className="stone-card p-6" data-testid="chair-panel">
            <h2 className="text-[23px] font-semibold">Operating Chair</h2>
            <p className="mt-3 text-[15px]">Holder {pageData.chair.holder}, paid ${(pageData.chair.paid / 1e6).toFixed(0)}.</p>
            <InternalLink href={`/chair/${id}`} testId="chair-auction-link">Bid on Chair</InternalLink>
          </div>

          {/* Builder Card */}
          <div className="stone-card p-6" data-testid="builder-card">
            <h2 className="text-[23px] font-semibold">Builder</h2>
            <p className="mt-2 font-semibold">{pageData.builder.name}</p>
            <p className="text-[15px]">{pageData.builder.role}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard label="Shipped" value={`${pageData.builder.milestonesDelivered}`} detail="career milestones" icon={<Medal color="var(--color-sunburst-yellow)" />} testId="builder-shipped-stat" />
              <StatCard label="AI avg" value={`${pageData.builder.averageAiConfidence}%`} detail="validation score" icon={<Gauge color="var(--color-sky-blue)" />} testId="builder-ai-stat" />
            </div>
            <InternalLink href={`/builders/${encodeURIComponent(pageData.builder.address)}`} testId="builder-profile-link">View builder profile</InternalLink>
          </div>

          {/* Investment Widget */}
          {useContractData && (
            <div className="stone-card p-6" id="invest" data-testid="investment-widget">
              <h2 className="text-[23px] font-semibold">Investment widget</h2>
              <InvestmentWidget fundingPool={fundingPool} progress={progress} />
              {!wallet.isConnected && (
                <p className="mt-3 text-center text-sm text-[var(--color-graphite)]">
                  Connect wallet to invest
                </p>
              )}
              {wallet.isConnected && !canFund && (
                <p className="mt-3 text-center text-sm text-yellow-700">
                  You are not eligible to fund this idea (gate restrictions)
                </p>
              )}
            </div>
          )}

          {/* Seed Investment Widget */}
          {!useContractData && (
            <div className="stone-card p-6" data-testid="investment-widget">
              <h2 className="text-[23px] font-semibold">Investment widget</h2>
              <div className="mt-4 rounded-[10px] bg-[var(--color-parchment-card)] p-4">
                <label className="text-[13px] text-[var(--color-ash)]" htmlFor="seed-amount-input">Amount</label>
                <input id="seed-amount-input" value="100 USDY" readOnly className="mt-2 w-full rounded-[10px] border-0 bg-white p-3" data-testid="investment-amount-input" />
                <div className="mt-3 text-[14px]" data-testid="investment-preview">Estimated tokens: 54.3 · Share: 0.02%</div>
              </div>
              <DisabledTxButton label="Invest" testId="sidebar-invest-button" />
            </div>
          )}

          {/* Contract Status */}
          <div className="stone-card p-6" data-testid="contract-read-card">
            <ShieldCheck color="var(--color-meadow-green)" />
            <p className="mt-3 text-[15px]">
              {useContractData 
                ? "Live data from smart contracts. Write actions enabled for connected wallet."
                : "Configure contract addresses in .env.local to enable live data."
              }
            </p>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
