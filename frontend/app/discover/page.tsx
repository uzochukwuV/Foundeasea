import Link from "next/link";
import { AppShell } from "../components/AppShell";
import { Activity, Brain, Lightning, Medal, TrendUp } from "../components/icons";
import { DisabledTxButton, MiniBars, PageIntro, ProgressRing, StatusChip, compact, money } from "../components/uiBits";
import { serverApi } from "../lib/api";

export const dynamic = "force-dynamic";

type Idea = {
  id: string;
  title: string;
  oneLiner: string;
  category: string;
  stage: string;
  targetRaise: number;
  funded: number;
  aiConfidence: number;
  trending24hRaise: number;
  fundingVelocity: number[];
  investorCount: number;
  builderReputation: number;
  socialProof: string;
};

type DiscoveryData = {
  filters: string[];
  leaderboard: Idea[];
  ideas: Idea[];
  liveEvents: Array<{ id: string; type: string; message: string; ideaId: string; time: string }>;
};

const filterToStage = (filter: string) => filter === "Milestone Hit" ? "active" : "all";

export default async function DiscoveryPage({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const params = await searchParams;
  const activeFilter = params?.filter || "All";
  const data = await serverApi<DiscoveryData>(`/api/discovery?stage=${filterToStage(activeFilter)}&sort=${activeFilter === "Trending" ? "velocity" : "ai"}`);

  return (
    <AppShell>
      <PageIntro
        eyebrow="Discovery feed"
        title="Find the ideas people are already moving toward."
        body="A Product Hunt + AngelList-style protocol surface where conviction, funding velocity, builder reputation, and recent protocol events decide what gets attention."
        action={<Link href="/create" className="pill-dark inline-flex h-12 items-center px-5 text-[15px] font-semibold" data-testid="create-idea-cta-link">Create an idea</Link>}
      />

      <section className="mx-auto max-w-[1200px] px-4 pb-8 md:px-8" data-testid="conviction-leaderboard-section">
        <div className="mb-4 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-ember-orange)]" data-testid="leaderboard-label"><Medal size={16} /> Conviction leaderboard</div>
        <div className="flex gap-4 overflow-x-auto pb-2" data-testid="leaderboard-strip">
          {data.leaderboard.map((idea, index) => (
            <Link key={idea.id} href={`/ideas/${idea.id}`} className="stone-card min-w-[250px] p-5 transition-transform duration-200 hover:-translate-y-1" data-testid={`leaderboard-card-${idea.id}`}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--color-ash)]" data-testid={`leaderboard-rank-${idea.id}`}>#{index + 1}</span>
                <span className="text-[13px] font-semibold text-[var(--color-meadow-green)]" data-testid={`leaderboard-score-${idea.id}`}>{idea.aiConfidence} conviction</span>
              </div>
              <div className="mt-3 text-[18px] font-semibold tracking-[-0.35px] text-[var(--color-charcoal-primary)]" data-testid={`leaderboard-title-${idea.id}`}>{idea.title}</div>
              <div className="mt-2 text-[13px] text-[var(--color-graphite)]" data-testid={`leaderboard-velocity-${idea.id}`}>{money(idea.trending24hRaise)} signal in 24h</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-24 md:px-8 lg:grid-cols-[1fr_320px]" data-testid="discovery-main-grid">
        <div data-testid="discovery-left-column">
          <div className="mb-6 flex flex-wrap gap-2" data-testid="discovery-filter-tabs">
            {data.filters.map((filter) => (
              <Link key={filter} href={`/discover?filter=${encodeURIComponent(filter)}`} className={`${activeFilter === filter ? "pill-dark" : "pill-light"} h-10 px-4 py-2 text-[14px] font-medium`} data-testid={`filter-tab-${filter.toLowerCase().replaceAll(" ", "-")}`}>
                {filter}
              </Link>
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-2" data-testid="idea-card-grid">
            {data.ideas.map((idea) => {
              const funded = Math.round((idea.funded / idea.targetRaise) * 100);
              return (
                <article key={idea.id} className="stone-card p-6" data-testid={`idea-card-${idea.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <StatusChip label={idea.category} testId={`idea-category-${idea.id}`} />
                      <Link href={`/ideas/${idea.id}`} className="mt-4 block text-[23px] font-semibold leading-[1.2] tracking-[-0.44px] text-[var(--color-charcoal-primary)]" data-testid={`idea-title-link-${idea.id}`}>{idea.title}</Link>
                    </div>
                    <ProgressRing value={idea.aiConfidence} label="Conviction score" testId={`idea-conviction-ring-${idea.id}`} />
                  </div>
                  <p className="mt-4 min-h-12 text-[15px] leading-[1.47] text-[var(--color-graphite)]" data-testid={`idea-tagline-${idea.id}`}>{idea.oneLiner}</p>
                  <div className="mt-5 rounded-[12px] bg-[var(--color-parchment-card)] p-4" data-testid={`idea-chart-${idea.id}`}>
                    <MiniBars values={idea.fundingVelocity} testId={`idea-velocity-chart-${idea.id}`} />
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-[14px]" data-testid={`idea-stats-${idea.id}`}>
                    <div data-testid={`idea-raised-${idea.id}`}><span className="block text-[var(--color-ash)]">Raised</span>{money(idea.funded)} / {compact(idea.targetRaise)}</div>
                    <div data-testid={`idea-funded-${idea.id}`}><span className="block text-[var(--color-ash)]">Ring</span>{funded}%</div>
                    <div data-testid={`idea-builder-rep-${idea.id}`}><span className="block text-[var(--color-ash)]">Builder</span>{idea.builderReputation}</div>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-stone-surface)] pt-4">
                    <div className="text-[13px] text-[var(--color-ash)]" data-testid={`idea-social-proof-${idea.id}`}>{idea.socialProof}</div>
                    <DisabledTxButton label="Signal $10" testId={`signal-button-${idea.id}`} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="stone-card h-fit p-6" data-testid="live-feed-panel">
          <div className="mb-5 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-ember-orange)]" data-testid="live-feed-title"><Activity size={16} /> Live protocol feed</div>
          <div className="space-y-4" data-testid="live-feed-list">
            {data.liveEvents.map((event) => (
              <Link key={event.id} href={`/ideas/${event.ideaId}`} className="block rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`live-event-${event.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <StatusChip label={event.type} tone={event.type === "milestone" ? "good" : "neutral"} testId={`live-event-type-${event.id}`} />
                  <span className="text-[12px] text-[var(--color-ash)]" data-testid={`live-event-time-${event.id}`}>{event.time}</span>
                </div>
                <p className="mt-3 text-[14px] leading-[1.45] text-[var(--color-graphite)]" data-testid={`live-event-message-${event.id}`}>{event.message}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6 rounded-[12px] bg-[var(--color-midnight)] p-5 text-white" data-testid="discovery-education-card">
            <Brain size={22} />
            <div className="mt-3 text-[18px] font-semibold" data-testid="education-title">What good looks like</div>
            <p className="mt-2 text-[14px] leading-[1.55] text-white/70" data-testid="education-body">High conviction combines AI confidence, signal velocity, and builder reputation — not hype alone.</p>
            <div className="mt-4 flex items-center gap-2 text-[13px] text-[var(--color-sunburst-yellow)]" data-testid="education-trend"><TrendUp size={16} /> Watch 24h signal growth</div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}