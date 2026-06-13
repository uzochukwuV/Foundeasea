import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import { Brain, Coins, Gauge, Medal, ShieldCheck, TrendUp, UsersThree } from "../../components/icons";
import { DisabledTxButton, InternalLink, MiniBars, PageIntro, StatCard, StatusChip, VerifyRow, money } from "../../components/uiBits";
import { serverApi } from "../../lib/api";

export const dynamic = "force-dynamic";

type IdeaDetail = {
  idea: { id: string; title: string; oneLiner: string; category: string; stage: string; targetRaise: number; funded: number; aiConfidence: number; currentPrice: number; convictionTrend: string; builderReputation: number; investorCount: number };
  overview: { approvalSummary: string; targetMarket: string; roadmap: string[]; comments: Array<{ author: string; text: string }> };
  milestones: Array<{ id: string; label: string; status: string; amount: number; confidence: number; deadline: string; note: string; ipfs: string }>;
  token: { prices: number[]; orderBook: Array<{ side: string; price: number; amount: number }>; trades: Array<{ wallet: string; amount: number; price: number }>; distribution: Record<string, number> };
  aiLogs: Array<{ id: string; decisionType: string; confidence: number; inputHash: string; outputHash: string; summary: string }>;
  investors: Array<{ wallet: string; held: number; supplyPercent: number; entryPrice: number; unrealizedPnl: number; signalOnly: boolean }>;
  chair: { holder: string; paid: number; listed: boolean; acquiredAt: string };
  builder: { address: string; name: string; role: string; milestonesDelivered: number; averageAiConfidence: number; revenueGenerated: number; badges: string[] };
};

const tabs = ["overview", "milestones", "token", "ai-logs", "investors"];

export default async function IdeaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const activeTab = tabs.includes(query?.tab || "") ? query?.tab || "overview" : "overview";
  const data = await serverApi<IdeaDetail>(`/api/ideas/${id}`);
  const funded = Math.round((data.idea.funded / data.idea.targetRaise) * 100);

  return (
    <AppShell>
      <section className="sticky top-[65px] z-20 border-y border-[var(--color-stone-surface)] bg-[var(--color-warm-canvas)] px-4 py-4 md:px-8" data-testid="idea-sticky-header">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2" data-testid="idea-header-meta"><StatusChip label={data.idea.category} testId="idea-category-chip" /><StatusChip label={`${data.idea.aiConfidence} conviction ${data.idea.convictionTrend}`} tone="good" testId="idea-conviction-chip" /></div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.8px] text-[var(--color-charcoal-primary)]" data-testid="idea-header-title">{data.idea.title}</h1>
            <p className="text-[14px] text-[var(--color-graphite)]" data-testid="idea-header-tagline">{data.idea.oneLiner}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3" data-testid="idea-header-actions">
            <div className="rounded-full bg-white px-4 py-2 text-[14px] font-semibold" data-testid="idea-current-price">{money(data.idea.currentPrice, 2)} USDY</div>
            <DisabledTxButton label="Invest" testId="idea-invest-button" />
            <DisabledTxButton label="Signal" testId="idea-signal-button" />
          </div>
        </div>
      </section>

      <PageIntro eyebrow="Product page" title="Everything an investor, builder, or creator needs in one focused product view." body="Tabs keep the full venture story organized: pitch, milestones, token surface, AI decisions, and investor social proof." />

      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-24 md:px-8 lg:grid-cols-[1fr_340px]" data-testid="idea-page-grid">
        <div data-testid="idea-main-column">
          <div className="mb-5 flex flex-wrap gap-2" data-testid="idea-tab-nav">
            {tabs.map((tab) => (
              <Link key={tab} href={`/ideas/${id}?tab=${tab}`} className={`${activeTab === tab ? "pill-dark" : "pill-light"} h-10 px-4 py-2 text-[14px] font-medium`} data-testid={`idea-tab-${tab}`}>{tab.replace("-", " ")}</Link>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-5" data-testid="overview-tab-panel">
              <div className="stone-card p-6" data-testid="approval-summary-card"><Brain className="text-[var(--color-sky-blue)]" /><h2 className="mt-4 text-[23px] font-semibold" data-testid="approval-title">AI approval summary</h2><p className="mt-3 text-[15px] leading-[1.55]" data-testid="approval-summary-text">{data.overview.approvalSummary}</p></div>
              <div className="grid gap-5 md:grid-cols-2">
                <StatCard label="Target market" value="Vertical SaaS" detail={data.overview.targetMarket} icon={<UsersThree color="var(--color-ember-orange)" />} testId="target-market-stat" />
                <StatCard label="Funding" value={`${funded}%`} detail={`${money(data.idea.funded)} raised of ${money(data.idea.targetRaise)}`} icon={<Coins color="var(--color-sunburst-yellow)" />} testId="funding-stat" />
              </div>
              <div className="stone-card p-6" data-testid="roadmap-card"><h2 className="text-[23px] font-semibold" data-testid="roadmap-title">Roadmap</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{data.overview.roadmap.map((item, index) => <div key={item} className="rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`roadmap-item-${index}`}>{item}</div>)}</div></div>
              <div className="stone-card p-6" data-testid="comments-card"><h2 className="text-[23px] font-semibold" data-testid="comments-title">Signal staker questions</h2>{data.overview.comments.map((comment, index) => <div key={comment.author} className="mt-4 rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`comment-${index}`}><strong>{comment.author}</strong><p>{comment.text}</p></div>)}</div>
            </div>
          )}

          {activeTab === "milestones" && <div className="grid gap-4" data-testid="milestones-tab-panel">{data.milestones.map((milestone) => <Link key={milestone.id} href={`/milestones/${milestone.id}`} className="stone-card block p-6" data-testid={`milestone-card-${milestone.id}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><StatusChip label={milestone.status} tone={milestone.status === "released" || milestone.status === "validated" ? "good" : "warn"} testId={`milestone-status-${milestone.id}`} /><h2 className="mt-3 text-[23px] font-semibold" data-testid={`milestone-title-${milestone.id}`}>{milestone.label}</h2><p className="mt-2 text-[15px]" data-testid={`milestone-note-${milestone.id}`}>{milestone.note}</p></div><div className="text-right"><div className="text-[28px] font-semibold" data-testid={`milestone-confidence-${milestone.id}`}>{milestone.confidence}%</div><div className="text-[13px] text-[var(--color-ash)]">AI confidence</div></div></div></Link>)}</div>}

          {activeTab === "token" && <div className="space-y-5" data-testid="token-tab-panel"><div className="stone-card p-6"><h2 className="text-[23px] font-semibold" data-testid="price-chart-title">TWAP price chart</h2><div className="mt-5 rounded-[12px] bg-[var(--color-parchment-card)] p-5"><MiniBars values={data.token.prices.map((price) => Math.round(price * 100))} color="var(--color-meadow-green)" testId="token-price-chart" /></div></div><div className="grid gap-5 md:grid-cols-2"><div className="stone-card p-6" data-testid="order-book-card"><h2 className="text-[23px] font-semibold">Order book</h2>{data.token.orderBook.map((order, index) => <div key={index} className="mt-3 flex justify-between rounded-[10px] bg-[var(--color-parchment-card)] p-3" data-testid={`order-row-${index}`}><span>{order.side}</span><span>{money(order.price, 2)} · {order.amount}</span></div>)}</div><div className="stone-card p-6" data-testid="recent-trades-card"><h2 className="text-[23px] font-semibold">Recent trades</h2>{data.token.trades.map((trade, index) => <div key={index} className="mt-3 flex justify-between rounded-[10px] bg-[var(--color-parchment-card)] p-3" data-testid={`trade-row-${index}`}><span>{trade.wallet}</span><span>{trade.amount} @ {money(trade.price, 2)}</span></div>)}</div></div><DisabledTxButton label="Buy / Sell" testId="token-buy-sell-widget" /></div>}

          {activeTab === "ai-logs" && <div className="grid gap-4" data-testid="ai-logs-tab-panel"><div className="stone-card flex flex-wrap items-center justify-between gap-4 p-6" data-testid="global-agent-monitor-callout"><div><h2 className="text-[23px] font-semibold">Global AgentIdentity transparency</h2><p className="mt-2 text-[15px]">Review every protocol-level decision, confidence trend, and anomaly.</p></div><Link href="/agent" className="pill-dark h-11 px-5 py-3 text-[14px] font-semibold" data-testid="global-agent-monitor-link">Open AI Monitor</Link></div>{data.aiLogs.map((log) => <div key={log.id} className="stone-card p-6" data-testid={`ai-log-${log.id}`}><div className="flex flex-wrap items-center justify-between gap-3"><StatusChip label={log.decisionType} testId={`ai-log-type-${log.id}`} /><div className="text-[28px] font-semibold" data-testid={`ai-log-confidence-${log.id}`}>{log.confidence}%</div></div><p className="mt-4 text-[15px] leading-[1.55]" data-testid={`ai-log-summary-${log.id}`}>{log.summary}</p><div className="mt-4 grid gap-3"><VerifyRow label="Input hash" value={log.inputHash} testId={`ai-log-input-${log.id}`} /><VerifyRow label="Output hash" value={log.outputHash} testId={`ai-log-output-${log.id}`} /></div></div>)}</div>}

          {activeTab === "investors" && <div className="stone-card overflow-hidden" data-testid="investors-tab-panel"><div className="grid grid-cols-5 gap-3 bg-[var(--color-parchment-card)] p-4 text-[13px] font-semibold"><span>Wallet</span><span>Held</span><span>Supply</span><span>Entry</span><span>P&L</span></div>{data.investors.map((investor, index) => <div key={investor.wallet} className="grid grid-cols-5 gap-3 border-t border-[var(--color-stone-surface)] p-4 text-[14px]" data-testid={`investor-row-${index}`}><span>{investor.wallet}</span><span>{investor.signalOnly ? "Signal only" : investor.held}</span><span>{investor.supplyPercent}%</span><span>{investor.entryPrice ? money(investor.entryPrice, 2) : "—"}</span><span>{investor.unrealizedPnl ? money(investor.unrealizedPnl) : "pending"}</span></div>)}</div>}
        </div>

        <aside className="space-y-5" data-testid="idea-sidebar">
          <div className="stone-card p-6" data-testid="chair-panel"><h2 className="text-[23px] font-semibold">Operating Chair</h2><p className="mt-3 text-[15px]">Holder {data.chair.holder}, paid {money(data.chair.paid)}.</p><InternalLink href={`/chair/${id}`} testId="chair-auction-link">Bid on Chair</InternalLink></div>
          <div className="stone-card p-6" data-testid="builder-card"><h2 className="text-[23px] font-semibold">Builder</h2><p className="mt-2 font-semibold">{data.builder.name}</p><p className="text-[15px]">{data.builder.role}</p><div className="mt-4 grid grid-cols-2 gap-3"><StatCard label="Shipped" value={`${data.builder.milestonesDelivered}`} detail="career milestones" icon={<Medal color="var(--color-sunburst-yellow)" />} testId="builder-shipped-stat" /><StatCard label="AI avg" value={`${data.builder.averageAiConfidence}%`} detail="validation score" icon={<Gauge color="var(--color-sky-blue)" />} testId="builder-ai-stat" /></div><InternalLink href={`/builders/${encodeURIComponent(data.builder.address)}`} testId="builder-profile-link">View builder profile</InternalLink></div>
          <div className="stone-card p-6" data-testid="investment-widget"><h2 className="text-[23px] font-semibold">Investment widget</h2><div className="mt-4 rounded-[10px] bg-[var(--color-parchment-card)] p-4"><label className="text-[13px] text-[var(--color-ash)]" htmlFor="amount-input">Amount</label><input id="amount-input" value="100 USDY" readOnly className="mt-2 w-full rounded-[10px] border-0 bg-white p-3" data-testid="investment-amount-input" /><div className="mt-3 text-[14px]" data-testid="investment-preview">Estimated tokens: 54.3 · Share: 0.02%</div></div><DisabledTxButton label="Invest" testId="sidebar-invest-button" /></div>
          <div className="stone-card p-6" data-testid="contract-read-card"><ShieldCheck color="var(--color-meadow-green)" /><p className="mt-3 text-[15px]">Contract read status comes from backend `.env`; write actions remain disabled until confirmed.</p></div>
        </aside>
      </section>
    </AppShell>
  );
}