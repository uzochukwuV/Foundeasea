import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import { Activity, Brain, Coins, ShieldCheck, UsersThree } from "../../components/icons";
import { DisabledTxButton, PageIntro, ProgressRing, StatCard, StatusChip, VerifyRow, money } from "../../components/uiBits";
import { serverApi } from "../../lib/api";

export const dynamic = "force-dynamic";

type MilestoneData = {
  milestone: { id: string; ideaId: string; label: string; status: string; amount: number; confidence: number; deadline: string; note: string; ipfs: string };
  idea: { id: string; title: string; oneLiner: string; aiConfidence: number };
  buildLog: Array<{ type: string; author: string; text: string; link: string }>;
  chairThread: Array<{ author: string; text: string }>;
  validation: { summary: string; releaseStatus: string };
  investorSnapshot: { holdersAtSubmission: number; priceAtSubmission: number; currentPrice: number; newCohort: Array<{ wallet: string; held: number; supplyPercent: number }> };
};

export default async function MilestonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await serverApi<MilestoneData>(`/api/milestones/${id}`);

  return (
    <AppShell>
      <PageIntro eyebrow="Milestone deep dive" title={data.milestone.label} body="A builder-readable and investor-readable source of truth for what was shipped, how AI validated it, and what it means for holders." action={<Link href={`/ideas/${data.idea.id}?tab=milestones`} className="pill-light inline-flex h-12 items-center px-5 text-[15px] font-semibold" data-testid="back-to-idea-link">Back to idea</Link>} />
      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-24 md:px-8 lg:grid-cols-[1fr_360px]" data-testid="milestone-page-grid">
        <div className="space-y-5" data-testid="milestone-build-log-column">
          <div className="stone-card p-6" data-testid="milestone-identity-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <StatusChip label={data.milestone.status} tone={data.milestone.status === "released" || data.milestone.status === "validated" ? "good" : "warn"} testId="milestone-status-chip" />
                <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.8px]" data-testid="milestone-idea-title">{data.idea.title}</h2>
                <p className="mt-2 text-[15px] text-[var(--color-graphite)]" data-testid="milestone-idea-tagline">{data.idea.oneLiner}</p>
              </div>
              <div className="text-right" data-testid="milestone-deadline-box"><div className="text-[13px] text-[var(--color-ash)]">Deadline</div><div className="text-[23px] font-semibold">{data.milestone.deadline}</div></div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <StatCard label="Locked" value={money(data.milestone.amount)} detail="milestone amount" icon={<Coins color="var(--color-sunburst-yellow)" />} testId="locked-amount-stat" />
              <StatCard label="Holders then" value={`${data.investorSnapshot.holdersAtSubmission}`} detail="snapshot cohort" icon={<UsersThree color="var(--color-sky-blue)" />} testId="holders-snapshot-stat" />
              <StatCard label="Token move" value={`${money(data.investorSnapshot.priceAtSubmission, 2)} → ${money(data.investorSnapshot.currentPrice, 2)}`} detail="submission vs now" icon={<Activity color="var(--color-meadow-green)" />} testId="price-move-stat" />
            </div>
          </div>

          <div className="stone-card p-6" data-testid="build-log-card">
            <h2 className="text-[23px] font-semibold" data-testid="build-log-title">Build log</h2>
            <div className="mt-5 space-y-3" data-testid="build-log-list">
              {data.buildLog.map((item, index) => (
                <div key={`${item.type}-${index}`} className="rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`build-log-item-${index}`}>
                  <div className="flex flex-wrap justify-between gap-2"><strong>{item.author}</strong><StatusChip label={item.type} testId={`build-log-type-${index}`} /></div>
                  <p className="mt-2 text-[15px] leading-[1.5]" data-testid={`build-log-text-${index}`}>{item.text}</p>
                  <VerifyRow label="Artifact" value={item.link} testId={`build-log-link-${index}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="stone-card p-6" data-testid="chair-thread-card">
            <h2 className="text-[23px] font-semibold" data-testid="chair-thread-title">Chair / builder thread</h2>
            {data.chairThread.map((item, index) => <div key={index} className="mt-4 rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`chair-thread-item-${index}`}><strong>{item.author}</strong><p>{item.text}</p></div>)}
          </div>
        </div>

        <aside className="space-y-5" data-testid="milestone-validation-sidebar">
          <div className="stone-card p-6 text-center" data-testid="validation-panel">
            <div className="mx-auto w-fit"><ProgressRing value={data.milestone.confidence} label="AI confidence" testId="milestone-confidence-gauge" /></div>
            <h2 className="mt-5 text-[23px] font-semibold" data-testid="validation-title">AI validation</h2>
            <p className="mt-3 text-[15px] leading-[1.55] text-[var(--color-graphite)]" data-testid="validation-summary">{data.validation.summary}</p>
            <div className="mt-5 grid gap-3"><VerifyRow label="Input" value={data.milestone.ipfs} testId="validation-input-hash" /><VerifyRow label="Output" value={`${data.milestone.ipfs}/reasoning`} testId="validation-output-hash" /></div>
          </div>
          <div className="stone-card p-6" data-testid="release-status-card"><ShieldCheck color="var(--color-meadow-green)" /><h2 className="mt-3 text-[23px] font-semibold">Release status</h2><p className="mt-2 text-[15px]">{data.validation.releaseStatus}</p><DisabledTxButton label="DAO vote" testId="dao-vote-disabled-button" /></div>
          <div className="stone-card p-6" data-testid="investor-snapshot-card"><Brain color="var(--color-sky-blue)" /><h2 className="mt-3 text-[23px] font-semibold">Bought on conviction cohort</h2>{data.investorSnapshot.newCohort.map((item, index) => <div key={item.wallet} className="mt-3 flex justify-between rounded-[10px] bg-[var(--color-parchment-card)] p-3" data-testid={`snapshot-investor-${index}`}><span>{item.wallet}</span><span>{item.held} tokens</span></div>)}</div>
        </aside>
      </section>
    </AppShell>
  );
}