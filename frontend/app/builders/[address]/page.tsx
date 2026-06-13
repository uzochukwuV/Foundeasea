import { AppShell } from "../../components/AppShell";
import { Brain, Coins, Medal, ShieldCheck, UsersThree } from "../../components/icons";
import { DisabledTxButton, PageIntro, StatCard, StatusChip, compact, money } from "../../components/uiBits";
import { serverApi } from "../../lib/api";

export const dynamic = "force-dynamic";

type BuilderData = {
  builder: { address: string; name: string; role: string; milestonesDelivered: number; averageAiConfidence: number; revenueGenerated: number; disputesResolved: number; badges: string[] };
  tier: string;
  careerTimeline: Array<{ idea: string; role: string; completed: number; total: number; aiAverage: number; earned: number; outcome: string }>;
  skills: string[];
  testimonials: Array<{ from: string; text: string }>;
  stakeStatus: { stakedAllocation: number; activeEngagements: number };
};

export default async function BuilderProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const data = await serverApi<BuilderData>(`/api/builders/${decodeURIComponent(address)}`);

  return (
    <AppShell>
      <PageIntro eyebrow="Builder profile" title={`${data.builder.name} is building in public.`} body="An on-chain CV for proof of delivery, AI validation quality, revenue generated, and how much reputation is at stake." />
      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-24 md:px-8 lg:grid-cols-[1fr_340px]" data-testid="builder-profile-grid">
        <div className="space-y-5" data-testid="builder-main-column">
          <div className="stone-card p-6" data-testid="builder-header-card">
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative grid h-28 w-28 place-items-center rounded-[42%_58%_64%_36%/48%_34%_66%_52%] bg-[var(--color-sky-blue)]" data-testid="builder-avatar-blob"><div className="absolute left-[32%] top-[36%] h-2 w-2 rounded-full bg-black" /><div className="absolute right-[32%] top-[36%] h-2 w-2 rounded-full bg-black" /><div className="mt-6 h-3 w-7 rounded-b-full border-b-4 border-black" /></div>
              <div>
                <StatusChip label={data.tier} tone="good" testId="builder-tier-chip" />
                <h2 className="mt-3 text-[32px] font-semibold tracking-[-1px]" data-testid="builder-name">{data.builder.name}</h2>
                <p className="text-[15px] text-[var(--color-graphite)]" data-testid="builder-role">{data.builder.role}</p>
                <p className="mt-2 text-[13px] text-[var(--color-ash)]" data-testid="builder-address">{data.builder.address}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard label="Earned" value={money(data.builder.revenueGenerated)} detail="all protocol work" icon={<Coins color="var(--color-sunburst-yellow)" />} testId="builder-earned-stat" />
              <StatCard label="AI average" value={`${data.builder.averageAiConfidence}%`} detail="career validation score" icon={<Brain color="var(--color-sky-blue)" />} testId="builder-ai-average-stat" />
              <StatCard label="Active ideas" value={`${data.stakeStatus.activeEngagements}`} detail="current engagements" icon={<UsersThree color="var(--color-meadow-green)" />} testId="builder-active-ideas-stat" />
            </div>
          </div>

          <div className="stone-card p-6" data-testid="career-timeline-card">
            <h2 className="text-[23px] font-semibold" data-testid="career-timeline-title">Career timeline</h2>
            <div className="mt-5 space-y-4" data-testid="career-timeline-list">
              {data.careerTimeline.map((item, index) => (
                <div key={item.idea} className="rounded-[10px] bg-[var(--color-parchment-card)] p-5" data-testid={`career-item-${index}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><StatusChip label={item.outcome} tone={item.outcome === "completed" ? "good" : "neutral"} testId={`career-outcome-${index}`} /><h3 className="mt-3 text-[20px] font-semibold" data-testid={`career-idea-${index}`}>{item.idea}</h3><p className="text-[14px]" data-testid={`career-role-${index}`}>{item.role}</p></div><div className="text-right text-[14px]"><div data-testid={`career-progress-${index}`}>{item.completed}/{item.total} milestones</div><div data-testid={`career-earned-${index}`}>{compact(item.earned)} earned</div></div></div>
                  <div className="mt-4 h-3 rounded-full bg-white"><div className="h-full rounded-full bg-[var(--color-meadow-green)]" style={{ width: `${(item.completed / item.total) * 100}%` }} data-testid={`career-progress-bar-${index}`} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="stone-card p-6" data-testid="skill-signals-card">
            <h2 className="text-[23px] font-semibold">Skill signals</h2>
            <div className="mt-4 flex flex-wrap gap-2" data-testid="builder-skill-list">{data.skills.map((skill) => <span key={skill} className="rounded-full bg-[var(--color-parchment-card)] px-3 py-2 text-[14px]" data-testid={`builder-skill-${skill.toLowerCase().replaceAll(" ", "-")}`}>{skill}</span>)}</div>
          </div>
        </div>

        <aside className="space-y-5" data-testid="builder-sidebar">
          <div className="stone-card p-6" data-testid="stake-status-card"><ShieldCheck color="var(--color-meadow-green)" /><h2 className="mt-3 text-[23px] font-semibold">Stake status</h2><p className="mt-2 text-[15px]">{money(data.stakeStatus.stakedAllocation)} of IdeaToken allocation is staked as delivery collateral.</p><DisabledTxButton label="Hire this builder" testId="hire-builder-button" /></div>
          <div className="stone-card p-6" data-testid="builder-badges-card"><Medal color="var(--color-sunburst-yellow)" /><h2 className="mt-3 text-[23px] font-semibold">Badges</h2><div className="mt-4 flex flex-wrap gap-2">{data.builder.badges.map((badge) => <StatusChip key={badge} label={badge} testId={`builder-badge-${badge.toLowerCase().replaceAll(" ", "-")}`} />)}</div></div>
          <div className="stone-card p-6" data-testid="testimonials-card"><h2 className="text-[23px] font-semibold">Chair testimonials</h2>{data.testimonials.map((item, index) => <div key={index} className="mt-4 rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`testimonial-${index}`}><strong>{item.from}</strong><p>{item.text}</p></div>)}</div>
        </aside>
      </section>
    </AppShell>
  );
}