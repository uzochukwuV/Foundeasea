import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import { Coins, ShieldCheck, TrendUp, UsersThree } from "../../components/icons";
import { DisabledTxButton, PageIntro, StatCard, StatusChip, money } from "../../components/uiBits";
import { serverApi } from "../../lib/api";

export const dynamic = "force-dynamic";

type ChairData = {
  idea: { id: string; title: string; oneLiner: string; aiConfidence: number; builderReputation: number };
  rights: string[];
  currentHolder: string;
  history: Array<{ buyer: string; price: number; date: string }>;
  auction: { highestBid: number; endsIn: string; minimumBid: number };
  health: { milestoneProgress: string; builderReputation: number; convictionTrend: string };
};

export default async function ChairPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  const data = await serverApi<ChairData>(`/api/chair/${ideaId}`);

  return (
    <AppShell>
      <PageIntro eyebrow="Chair auction" title={`Operate ${data.idea.title}.`} body="The Operating Chair is a strategic leadership role, not just a DeFi widget. This page keeps the decision focused and high-context." action={<Link href={`/ideas/${data.idea.id}`} className="pill-light inline-flex h-12 items-center px-5 text-[15px] font-semibold" data-testid="chair-back-to-idea-link">Back to product page</Link>} />
      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-24 md:px-8 lg:grid-cols-[1fr_420px]" data-testid="chair-page-grid">
        <div className="space-y-6" data-testid="chair-left-column">
          <div className="stone-card p-6" data-testid="chair-meaning-card"><StatusChip label="Operating Chair" testId="chair-role-chip" /><h2 className="mt-4 text-[32px] font-semibold tracking-[-1px]">You set direction. Builders execute.</h2><p className="mt-3 text-[15px] leading-[1.55]">Chair ownership bridges on-chain capital with real-world operating leadership: governance weight, strategic scope, builder performance review, and public leadership credit.</p></div>
          <div className="stone-card p-6" data-testid="chair-rights-card"><h2 className="text-[23px] font-semibold">What you are buying</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{data.rights.map((right, index) => <div key={right} className="rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`chair-right-${index}`}><ShieldCheck className="mb-2 text-[var(--color-meadow-green)]" />{right}</div>)}</div></div>
          <div className="stone-card p-6" data-testid="chair-history-card"><h2 className="text-[23px] font-semibold">Transfer history</h2>{data.history.map((row, index) => <div key={`${row.buyer}-${index}`} className="mt-3 grid grid-cols-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-[14px]" data-testid={`chair-history-row-${index}`}><span>{row.buyer}</span><span>{money(row.price)}</span><span>{row.date}</span></div>)}</div>
        </div>
        <aside className="space-y-6" data-testid="chair-right-column">
          <div className="stone-card p-6" data-testid="auction-panel"><div className="flex items-center gap-2 text-[var(--color-ember-orange)]"><Coins /> Auction</div><h2 className="mt-4 text-[32px] font-semibold" data-testid="auction-highest-bid">{money(data.auction.highestBid)}</h2><p className="text-[15px]" data-testid="auction-countdown">Ends in {data.auction.endsIn}</p><div className="mt-5 rounded-[10px] bg-[var(--color-parchment-card)] p-4"><label htmlFor="chair-bid-input" className="text-[13px] text-[var(--color-ash)]">Your bid</label><input id="chair-bid-input" readOnly value={`${data.auction.minimumBid} USDY minimum`} className="mt-2 w-full rounded-[10px] border-0 bg-white p-3" data-testid="chair-bid-input" /></div><DisabledTxButton label="Place bid" testId="place-chair-bid-button" /><p className="mt-4 text-[14px] leading-[1.55] text-[var(--color-graphite)]" data-testid="win-explainer">If you win, onboarding includes builder intro, workspace access, and your first governance vote.</p></div>
          <div className="stone-card p-6" data-testid="idea-health-summary"><h2 className="text-[23px] font-semibold">Idea health summary</h2><div className="mt-4 grid gap-3"><StatCard label="Milestones" value={data.health.milestoneProgress} detail="progress so far" icon={<TrendUp color="var(--color-meadow-green)" />} testId="chair-milestone-health-stat" /><StatCard label="Builder rep" value={`${data.health.builderReputation}`} detail="current operator quality" icon={<UsersThree color="var(--color-sky-blue)" />} testId="chair-builder-health-stat" /><StatCard label="Conviction" value={data.health.convictionTrend} detail="weekly trend" icon={<ShieldCheck color="var(--color-sunburst-yellow)" />} testId="chair-conviction-health-stat" /></div></div>
          <div className="stone-card p-6" data-testid="current-chair-card"><h2 className="text-[23px] font-semibold">Current holder</h2><p className="mt-2 text-[15px]">{data.currentHolder}</p></div>
        </aside>
      </section>
    </AppShell>
  );
}