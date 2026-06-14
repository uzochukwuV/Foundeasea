"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "../components/AppShell";
import { Activity, Coins, DownloadSimple, ShieldCheck, TrendUp, Loader2, Check } from "../components/icons";
import { DisabledTxButton, MiniBars, PageIntro, StatCard } from "../components/uiBits";
import { useContract } from "../lib/contracts/provider";
import {
  useDiscoveryIdeas,
  useTokenBalance,
  useClaimableRevenue,
  useUserUSDYBalance,
  useClaimRevenue,
  type DiscoveryIdea,
} from "../lib/hooks";
import { formatUSDYShort, formatProgress, getIdeaStatusLabel } from "../lib/utils";
import { formatUnits } from "ethers";

export const dynamic = "force-dynamic";

// Seed data type
type SeedPortfolio = {
  totalHoldingsUsd: number;
  claimableUsdy: number;
  earnedToday: number;
  earnedThisMonth: number;
  revenueSeries: Array<{ month: string; revenue: number; earned: number }>;
  holdings: Array<{ ideaId: string; title: string; tokens: number; ownershipBps: number; claimableUsdy: number }>;
  milestones: Array<{ id: string; ideaId: string; label: string; deadline?: string; status: string; amount: number; confidence: number }>;
  liveEvents: string[];
};

// Position Card Component
function PositionCard({ 
  idea, 
  tokenBalance,
  claimable
}: { 
  idea: DiscoveryIdea; 
  tokenBalance: bigint;
  claimable: bigint;
}) {
  const supply = idea.hardCap ? Number(idea.hardCap) : 0;
  const ownership = supply > 0 ? (Number(tokenBalance) / supply * 10000).toFixed(2) : "0.00";

  return (
    <Link href={`/ideas/${idea.id}`} className="stone-card block p-6">
      <div className="text-[13px] text-[var(--color-ash)]">IdeaToken position</div>
      <h3 className="mt-2 text-[23px] font-semibold">Idea #{idea.id}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 text-[14px]">
        <div>
          <span className="block text-[var(--color-ash)]">Tokens</span>
          {formatUnits(tokenBalance, 18).slice(0, 8)}
        </div>
        <div>
          <span className="block text-[var(--color-ash)]">Claimable</span>
          {formatUSDYShort(claimable)}
        </div>
        <div>
          <span className="block text-[var(--color-ash)]">Share</span>
          {ownership}%
        </div>
        <div>
          <span className="block text-[var(--color-ash)]">Status</span>
          {getIdeaStatusLabel(idea.status)}
        </div>
      </div>
    </Link>
  );
}

// Claim All Button Component
function ClaimAllButton({ 
  ideas, 
  claimables,
  onClaimAll
}: { 
  ideas: DiscoveryIdea[];
  claimables: Map<string, bigint>;
  onClaimAll: () => void;
}) {
  const totalClaimable = Array.from(claimables.values()).reduce((sum, val) => sum + val, BigInt(0));
  const hasClaimable = totalClaimable > BigInt(0);

  return (
    <button
      onClick={onClaimAll}
      disabled={!hasClaimable}
      className="pill-dark flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
    >
      {hasClaimable ? (
        <>
          <Coins size={16} />
          Claim All ({formatUSDYShort(totalClaimable)})
        </>
      ) : (
        <>
          <Check size={16} />
          All Claimed
        </>
      )}
    </button>
  );
}

export default function PortfolioClient() {
  const { wallet, addresses } = useContract();
  const [seedData, setSeedData] = useState<SeedPortfolio | null>(null);
  const [claimables, setClaimables] = useState<Map<string, bigint>>(new Map());
  const [claimingIdeaId, setClaimingIdeaId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Get all ideas from contract
  const { data: discoveryIdeas, loading: ideasLoading } = useDiscoveryIdeas();
  
  // Get user's USDY balance
  const { data: usdyBalance } = useUserUSDYBalance();
  
  // Claim revenue hook
  const { loading: claimLoading, claimRevenue } = useClaimRevenue();

  // Fetch seed data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { serverApi } = await import("../lib/api");
        const data = await serverApi<SeedPortfolio>("/api/investors/portfolio");
        setSeedData(data);
      } catch (err) {
        console.error("Error loading seed data:", err);
      }
    };
    loadData();
  }, []);

  // Calculate claimable revenue for each idea
  useEffect(() => {
    const calculateClaimables = async () => {
      if (!discoveryIdeas || !wallet.address) return;
      
      const claimableMap = new Map<string, bigint>();
      
      for (const idea of discoveryIdeas) {
        if (idea.ideaToken) {
          try {
            const { getClaimableRevenue } = await import("../lib/contracts/views");
            const { JsonRpcProvider } = await import("ethers");
            
            // Use provider from window if available
            const provider = wallet.provider;
            if (provider) {
              const claimable = await getClaimableRevenue(idea.ideaToken, provider, wallet.address);
              if (claimable > BigInt(0)) {
                claimableMap.set(idea.id, claimable);
              }
            }
          } catch (err) {
            console.error(`Error getting claimable for ${idea.id}:`, err);
          }
        }
      }
      
      setClaimables(claimableMap);
    };

    calculateClaimables();
  }, [discoveryIdeas, wallet.address, wallet.provider]);

  // Handle claim for single idea
  const handleClaimSingle = async (ideaId: string, tokenAddress: string) => {
    setClaimingIdeaId(ideaId);
    try {
      const result = await claimRevenue(tokenAddress);
      setTxHash(result.hash);
      // Refresh claimables
      setClaimables(prev => {
        const next = new Map(prev);
        next.delete(ideaId);
        return next;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingIdeaId(null);
    }
  };

  // Handle claim all
  const handleClaimAll = async () => {
    for (const [ideaId, claimable] of claimables.entries()) {
      const idea = discoveryIdeas?.find(i => i.id === ideaId);
      if (idea?.ideaToken) {
        await handleClaimSingle(ideaId, idea.ideaToken);
      }
    }
  };

  // Calculate totals from contract data
  const totalClaimable = Array.from(claimables.values()).reduce((sum, val) => sum + val, BigInt(0));
  const useContractData = addresses.ideaFactory && discoveryIdeas && discoveryIdeas.length > 0;

  const data = seedData || {
    totalHoldingsUsd: 0,
    claimableUsdy: Number(formatUnits(totalClaimable, 6)),
    earnedToday: 0,
    earnedThisMonth: 0,
    revenueSeries: [],
    holdings: [],
    milestones: [],
    liveEvents: [],
  };

  const activity = [
    "Connected wallet to view portfolio",
    "Portfolio synced with smart contracts",
  ];

  return (
    <AppShell>
      <PageIntro 
        eyebrow="Allocator dashboard" 
        title="Your portfolio should feel managed, not buried in contracts." 
        body="A private-feeling dashboard for positions, claimable revenue, upcoming milestones, and tax-friendly activity history." 
      />
      
      {/* Wallet Status Banner */}
      {wallet.isConnected ? (
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 mb-4">
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
            <Check size={16} />
            <span>Wallet connected: {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)} | </span>
            <span>Balance: {usdyBalance ? formatUSDYShort(usdyBalance) : "0"} USDY</span>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 mb-4">
          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
            Connect your wallet to view on-chain positions
          </div>
        </div>
      )}

      <section className="mx-auto max-w-[1200px] px-4 pb-24 md:px-8" data-testid="portfolio-page">
        <div className="grid gap-4 md:grid-cols-4" data-testid="portfolio-top-stats">
          <StatCard 
            label="Portfolio value" 
            value={useContractData ? `$${(Number(totalClaimable) / 1e6 + Number(usdyBalance || 0) / 1e6).toFixed(2)}` : `$${data.totalHoldingsUsd.toFixed(2)}`} 
            detail="current mark-to-market" 
            icon={<ShieldCheck color="var(--color-sky-blue)" />} 
            testId="portfolio-value-stat" 
          />
          <StatCard 
            label="Claimable" 
            value={formatUSDYShort(totalClaimable)} 
            detail="pending revenue" 
            icon={<Coins color="var(--color-sunburst-yellow)" />} 
            testId="claimable-revenue-stat" 
          />
          <StatCard 
            label="Earned today" 
            value={`$${data.earnedToday.toFixed(2)}`} 
            detail="daily digest number" 
            icon={<TrendUp color="var(--color-meadow-green)" />} 
            testId="earned-today-dashboard-stat" 
          />
          <StatCard 
            label="This month" 
            value={`$${data.earnedThisMonth.toFixed(2)}`} 
            detail="realized revenue" 
            icon={<Activity color="var(--color-ember-orange)" />} 
            testId="earned-month-stat" 
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]" data-testid="portfolio-content-grid">
          <div className="space-y-6" data-testid="portfolio-left-column">
            <div className="stone-card p-6" data-testid="index-vault-panel">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[23px] font-semibold">Index Vault</h2>
                <ClaimAllButton 
                  ideas={discoveryIdeas || []} 
                  claimables={claimables}
                  onClaimAll={handleClaimAll}
                />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <StatCard label="$FSIDX" value="—" detail="vault balance" testId="fsidx-balance-stat" />
                <StatCard label="Last rebalance" value="—" detail="allocation refreshed" testId="last-rebalance-stat" />
                <StatCard label="Projected yield" value="—" detail="monthly projection" testId="projected-yield-stat" />
              </div>
              <div className="mt-5 rounded-[12px] bg-[var(--color-parchment-card)] p-4">
                <MiniBars values={[0]} testId="vault-allocation-chart" />
              </div>
            </div>

            {/* Contract Positions */}
            {useContractData && wallet.isConnected ? (
              <div data-testid="portfolio-position-cards">
                <h3 className="mb-4 text-lg font-semibold">Your On-Chain Positions</h3>
                {ideasLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-[var(--color-ember-orange)]" />
                  </div>
                ) : discoveryIdeas && discoveryIdeas.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {discoveryIdeas.map((idea) => (
                      <PositionCard
                        key={idea.id}
                        idea={idea}
                        tokenBalance={BigInt(0)} // Would need individual token balance lookup
                        claimable={claimables.get(idea.id) || BigInt(0)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 p-6 text-center text-[var(--color-graphite)]">
                    No positions found. Invest in ideas to see them here.
                  </div>
                )}
              </div>
            ) : (
              /* Seed Positions */
              <div className="grid gap-4 md:grid-cols-2" data-testid="portfolio-position-cards">
                {data.holdings.map((holding) => (
                  <Link key={holding.ideaId} href={`/ideas/${holding.ideaId}`} className="stone-card block p-6">
                    <div className="text-[13px] text-[var(--color-ash)]">IdeaToken position</div>
                    <h3 className="mt-2 text-[23px] font-semibold">{holding.title}</h3>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-[14px]">
                      <div>
                        <span className="block text-[var(--color-ash)]">Tokens</span>
                        {holding.tokens.toLocaleString()}
                      </div>
                      <div>
                        <span className="block text-[var(--color-ash)]">Claimable</span>
                        ${holding.claimableUsdy.toFixed(2)}
                      </div>
                      <div>
                        <span className="block text-[var(--color-ash)]">Share</span>
                        {(holding.ownershipBps / 100).toFixed(2)}%
                      </div>
                      <div>
                        <span className="block text-[var(--color-ash)]">Next</span>
                        Milestone
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="stone-card p-6" data-testid="portfolio-activity-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[23px] font-semibold">Activity history</h2>
                <a href="/api/investors/tax-report.csv" className="pill-light flex h-10 items-center gap-2 px-4 text-[14px] font-semibold">
                  <DownloadSimple size={16} /> Export CSV
                </a>
              </div>
              {activity.map((item, index) => (
                <div key={index} className="mt-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6" data-testid="portfolio-right-column">
            <div className="stone-card p-6" data-testid="portfolio-revenue-chart-card">
              <h2 className="text-[23px] font-semibold">Revenue flow</h2>
              <div className="mt-5 rounded-[12px] bg-[var(--color-parchment-card)] p-4">
                <MiniBars 
                  values={data.revenueSeries.map((item) => item.earned)} 
                  color="var(--color-meadow-green)" 
                  testId="portfolio-revenue-chart" 
                />
              </div>
            </div>
            <div className="stone-card p-6" data-testid="portfolio-live-events-card">
              <h2 className="text-[23px] font-semibold">Live updates</h2>
              {data.liveEvents.map((event, index) => (
                <div key={index} className="mt-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-[14px]">
                  {event}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
