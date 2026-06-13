import Link from "next/link";
import { AppShell } from "../components/AppShell";
import { Activity, Coins, DownloadSimple, ShieldCheck, TrendUp } from "../components/icons";
import { DisabledTxButton, MiniBars, PageIntro, StatCard, money } from "../components/uiBits";
import { serverApi } from "../lib/api";

export const dynamic = "force-dynamic";

type Portfolio = {
  totalHoldingsUsd: number;
  claimableUsdy: number;
  earnedToday: number;
  earnedThisMonth: number;
  revenueSeries: Array<{ month: string; revenue: number; earned: number }>;
  holdings: Array<{ ideaId: string; title: string; tokens: number; ownershipBps: number; claimableUsdy: number }>;
  milestones: Array<{ id: string; ideaId: string; label: string; deadline?: string; status: string; amount: number; confidence: number }>;
  liveEvents: string[];
};

export default async function PortfolioPage() {
  const data = await serverApi<Portfolio>("/api/investors/portfolio");
  const activity = ["Invested 100 USDY into Revenue Radar", "Claimed 318.44 USDY from Milestone Escrow", "Signaled Validator Jury with 25 USDY", "Bid on Revenue Radar Chair"];

  return (
    <AppShell>
      <PageIntro eyebrow="Allocator dashboard" title="Your portfolio should feel managed, not buried in contracts." body="A private-feeling dashboard for positions, claimable revenue, upcoming milestones, and tax-friendly activity history." />
      <section className="mx-auto max-w-[1200px] px-4 pb-24 md:px-8" data-testid="portfolio-page">
        <div className="grid gap-4 md:grid-cols-4" data-testid="portfolio-top-stats">
          <StatCard label="Portfolio value" value={money(data.totalHoldingsUsd)} detail="current mark-to-market" icon={<ShieldCheck color="var(--color-sky-blue)" />} testId="portfolio-value-stat" />
          <StatCard label="Claimable" value={money(data.claimableUsdy, 2)} detail="pending revenue" icon={<Coins color="var(--color-sunburst-yellow)" />} testId="claimable-revenue-stat" />
          <StatCard label="Earned today" value={money(data.earnedToday, 2)} detail="daily digest number" icon={<TrendUp color="var(--color-meadow-green)" />} testId="earned-today-dashboard-stat" />
          <StatCard label="This month" value={money(data.earnedThisMonth, 2)} detail="realized revenue" icon={<Activity color="var(--color-ember-orange)" />} testId="earned-month-stat" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]" data-testid="portfolio-content-grid">
          <div className="space-y-6" data-testid="portfolio-left-column">
            <div className="stone-card p-6" data-testid="index-vault-panel">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-[23px] font-semibold">Index Vault</h2><DisabledTxButton label="Claim All" testId="claim-all-button" /></div>
              <div className="mt-5 grid gap-4 md:grid-cols-3"><StatCard label="$FSIDX" value="12,840" detail="vault balance" testId="fsidx-balance-stat" /><StatCard label="Last rebalance" value="2 days" detail="allocation refreshed" testId="last-rebalance-stat" /><StatCard label="Projected yield" value="7.8%" detail="monthly projection" testId="projected-yield-stat" /></div>
              <div className="mt-5 rounded-[12px] bg-[var(--color-parchment-card)] p-4"><MiniBars values={[52, 24, 14, 10]} testId="vault-allocation-chart" /></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2" data-testid="portfolio-position-cards">
              {data.holdings.map((holding) => <Link key={holding.ideaId} href={`/ideas/${holding.ideaId}`} className="stone-card block p-6" data-testid={`position-card-${holding.ideaId}`}><div className="text-[13px] text-[var(--color-ash)]">IdeaToken position</div><h3 className="mt-2 text-[23px] font-semibold" data-testid={`position-title-${holding.ideaId}`}>{holding.title}</h3><div className="mt-4 grid grid-cols-2 gap-3 text-[14px]"><div data-testid={`position-tokens-${holding.ideaId}`}><span className="block text-[var(--color-ash)]">Tokens</span>{holding.tokens.toLocaleString()}</div><div data-testid={`position-claimable-${holding.ideaId}`}><span className="block text-[var(--color-ash)]">Claimable</span>{money(holding.claimableUsdy, 2)}</div><div data-testid={`position-ownership-${holding.ideaId}`}><span className="block text-[var(--color-ash)]">Share</span>{holding.ownershipBps / 100}%</div><div><span className="block text-[var(--color-ash)]">Next</span>Milestone</div></div></Link>)}
            </div>

            <div className="stone-card p-6" data-testid="portfolio-activity-card"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-[23px] font-semibold">Activity history</h2><a href="/api/investors/tax-report.csv" className="pill-light flex h-10 items-center gap-2 px-4 text-[14px] font-semibold" data-testid="portfolio-export-csv-link"><DownloadSimple size={16} /> Export CSV</a></div>{activity.map((item, index) => <div key={item} className="mt-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`activity-row-${index}`}>{item}</div>)}</div>
          </div>

          <aside className="space-y-6" data-testid="portfolio-right-column">
            <div className="stone-card p-6" data-testid="portfolio-revenue-chart-card"><h2 className="text-[23px] font-semibold">Revenue flow</h2><div className="mt-5 rounded-[12px] bg-[var(--color-parchment-card)] p-4"><MiniBars values={data.revenueSeries.map((item) => item.earned)} color="var(--color-meadow-green)" testId="portfolio-revenue-chart" /></div></div>
            <div className="stone-card p-6" data-testid="portfolio-live-events-card"><h2 className="text-[23px] font-semibold">Live updates</h2>{data.liveEvents.map((event, index) => <div key={event} className="mt-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-[14px]" data-testid={`portfolio-live-event-${index}`}>{event}</div>)}</div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}