"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type IconProps = { size?: number; color?: string; weight?: string; className?: string };

const IconGlyph = ({ size = 18, color = "currentColor", className = "", children }: IconProps & { children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);

const Activity = (props: IconProps) => <IconGlyph {...props}><path d="M3 12h4l2-6 4 12 2-6h6" /></IconGlyph>;
const ArrowSquareOut = (props: IconProps) => <IconGlyph {...props}><path d="M14 4h6v6" /><path d="M10 14 20 4" /><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" /></IconGlyph>;
const Brain = (props: IconProps) => <IconGlyph {...props}><path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 5 2" /><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a3 3 0 0 1-5 2" /><path d="M12 5v14" /></IconGlyph>;
const ChartLineUp = (props: IconProps) => <IconGlyph {...props}><path d="M4 19h16" /><path d="M5 15l4-4 3 3 7-8" /></IconGlyph>;
const CheckCircle = (props: IconProps) => <IconGlyph {...props}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></IconGlyph>;
const Coins = (props: IconProps) => <IconGlyph {...props}><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" /></IconGlyph>;
const DownloadSimple = (props: IconProps) => <IconGlyph {...props}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></IconGlyph>;
const Funnel = (props: IconProps) => <IconGlyph {...props}><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></IconGlyph>;
const Gauge = (props: IconProps) => <IconGlyph {...props}><path d="M5 19a9 9 0 1 1 14 0" /><path d="m12 13 4-4" /></IconGlyph>;
const GitBranch = (props: IconProps) => <IconGlyph {...props}><circle cx="6" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><circle cx="6" cy="19" r="2" /><path d="M6 7v10" /><path d="M8 19h6a4 4 0 0 0 4-4V7" /></IconGlyph>;
const Lightning = (props: IconProps) => <IconGlyph {...props}><path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" /></IconGlyph>;
const Medal = (props: IconProps) => <IconGlyph {...props}><circle cx="12" cy="14" r="5" /><path d="M9 2h6l2 6-5 2-5-2 2-6Z" /></IconGlyph>;
const PlugsConnected = (props: IconProps) => <IconGlyph {...props}><path d="M8 7V3" /><path d="M16 7V3" /><path d="M6 7h12v4a6 6 0 0 1-12 0V7Z" /><path d="M12 17v4" /></IconGlyph>;
const ShieldCheck = (props: IconProps) => <IconGlyph {...props}><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" /><path d="m8.5 12 2 2 5-5" /></IconGlyph>;
const Sparkle = (props: IconProps) => <IconGlyph {...props}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></IconGlyph>;
const TrendUp = (props: IconProps) => <IconGlyph {...props}><path d="M4 17 10 11l4 4 6-8" /><path d="M14 7h6v6" /></IconGlyph>;
const UsersThree = (props: IconProps) => <IconGlyph {...props}><circle cx="12" cy="8" r="3" /><path d="M6 20a6 6 0 0 1 12 0" /><path d="M4 10a2 2 0 0 0 0 4" /><path d="M20 10a2 2 0 0 1 0 4" /></IconGlyph>;
const Wallet = (props: IconProps) => <IconGlyph {...props}><path d="M4 7h16v12H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h13" /><path d="M16 13h4" /></IconGlyph>;

type Idea = {
  id: string;
  title: string;
  oneLiner: string;
  category: string;
  stage: string;
  gateType: string;
  targetRaise: number;
  funded: number;
  aiConfidence: number;
  trending24hRaise: number;
  fundingVelocity: number[];
  investorCount: number;
  averageTicket: number;
  revenuePotential: string;
  builderReputation: number;
  socialProof: string;
  topBuilderMVPs: string[];
  riskLevel: string;
};

type Portfolio = {
  totalHoldingsUsd: number;
  claimableUsdy: number;
  earnedToday: number;
  earnedThisMonth: number;
  revenueSeries: Array<{ month: string; revenue: number; earned: number }>;
  holdings: Array<{ ideaId: string; title: string; tokens: number; ownershipBps: number; claimableUsdy: number }>;
  milestones: Array<{ ideaId: string; label: string; status: string; amount: number; confidence: number }>;
  liveEvents: string[];
};

type Builder = {
  address: string;
  name: string;
  role: string;
  github: string;
  twitter: string;
  portfolio: string;
  milestonesDelivered: number;
  averageAiConfidence: number;
  revenueGenerated: number;
  disputesResolved: number;
  badges: string[];
};

type Recommendation = {
  source: string;
  confidence: number;
  headline: string;
  summary: string;
  actions: string[];
  rankedIdeas: Array<{ ideaId: string; title: string; strategyScore: number; riskLevel: string }>;
};

type ReviewQueue = {
  pending: number;
  averageTurnaroundHours: number;
  viewerPosition: number;
  items: Array<{ ideaId: string; title: string; confidencePreview: number; status: string }>;
  feedbackSchema: Record<string, string>;
};

const apiFetch = async <T,>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(path, { ...options, cache: "no-store" });
  if (!response.ok) throw new Error(`Request failed: ${path}`);
  return response.json();
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const StatCard = ({
  label,
  value,
  detail,
  icon,
  testId,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  testId: string;
}) => (
  <div className="stone-card p-6 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]" data-testid={testId}>
    <div className="mb-8 flex items-center justify-between text-[var(--color-ash)]" data-testid={`${testId}-label`}>
      <span className="text-xs uppercase tracking-[0.2em]">{label}</span>
      {icon}
    </div>
    <div className="font-inter text-[32px] font-semibold tracking-[-1.1px] text-[var(--color-midnight)]" data-testid={`${testId}-value`}>{value}</div>
    <p className="mt-2 text-[15px] leading-[1.47] text-[var(--color-graphite)]" data-testid={`${testId}-detail`}>{detail}</p>
  </div>
);

const IdeaCard = ({ idea, selected, onSelect }: { idea: Idea; selected: boolean; onSelect: (id: string) => void }) => {
  const fundedPercent = Math.round((idea.funded / idea.targetRaise) * 100);
  return (
    <button
      type="button"
      onClick={() => onSelect(idea.id)}
      className={`stone-card w-full p-6 text-left transition-[box-shadow,transform,background-color] duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] ${selected ? "bg-[var(--color-parchment-card)] outline outline-2 outline-[var(--color-sky-blue)]" : ""}`}
      data-testid={`idea-card-${idea.id}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-ember-orange)]" data-testid={`idea-category-${idea.id}`}>{idea.category}</div>
          <h3 className="mt-3 font-inter text-[23px] font-semibold leading-[1.2] tracking-[-0.44px] text-[var(--color-charcoal-primary)]" data-testid={`idea-title-${idea.id}`}>{idea.title}</h3>
        </div>
        <span className="rounded-md bg-[var(--color-meadow-green)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-meadow-green)]" data-testid={`idea-confidence-${idea.id}`}>
          AI {idea.aiConfidence}%
        </span>
      </div>
      <p className="min-h-12 text-[15px] leading-[1.47] text-[var(--color-graphite)]" data-testid={`idea-oneliner-${idea.id}`}>{idea.oneLiner}</p>
      <div className="mt-5 h-3 rounded-full bg-[var(--color-stone-surface)]" data-testid={`idea-progress-track-${idea.id}`}>
        <div className="h-full rounded-full bg-[var(--color-sky-blue)]" style={{ width: `${Math.min(fundedPercent, 100)}%` }} data-testid={`idea-progress-bar-${idea.id}`} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-[var(--color-charcoal-primary)]">
        <div data-testid={`idea-funded-${idea.id}`}><span className="block text-[var(--color-ash)]">Funded</span>{fundedPercent}%</div>
        <div data-testid={`idea-velocity-${idea.id}`}><span className="block text-[var(--color-ash)]">24h</span>{money(idea.trending24hRaise)}</div>
        <div data-testid={`idea-investors-${idea.id}`}><span className="block text-[var(--color-ash)]">Backers</span>{idea.investorCount}</div>
      </div>
      <div className="mt-5 border-t border-[var(--color-stone-surface)] pt-4 text-xs text-[var(--color-ash)]" data-testid={`idea-social-proof-${idea.id}`}>{idea.socialProof}</div>
    </button>
  );
};

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [queue, setQueue] = useState<ReviewQueue | null>(null);
  const [selectedIdea, setSelectedIdea] = useState("idea-104");
  const [stage, setStage] = useState("all");
  const [sort, setSort] = useState("ai");
  const [walletConnected, setWalletConnected] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  useEffect(() => {
    apiFetch<{ data: Idea[] }>(`/api/ideas/feed?stage=${stage}&sort=${sort}`)
      .then((feed) => setIdeas(feed.data))
      .catch(() => undefined);
    apiFetch<Portfolio>("/api/investors/portfolio")
      .then(setPortfolio)
      .catch(() => undefined);
    apiFetch<{ data: Builder[] }>("/api/builders/profiles")
      .then((builderData) => setBuilders(builderData.data))
      .catch(() => undefined);
    apiFetch<ReviewQueue>("/api/ai/review-queue")
      .then(setQueue)
      .catch(() => undefined);
    apiFetch<Recommendation>("/api/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riskProfile: "balanced", ideaId: selectedIdea }),
    })
      .then(setRecommendation)
      .catch(() => undefined);
  }, [stage, sort, selectedIdea]);

  const activeIdea = useMemo(() => ideas.find((idea) => idea.id === selectedIdea) || ideas[0], [ideas, selectedIdea]);

  const refreshRecommendation = async () => {
    setLoadingRecommendation(true);
    try {
      const result = await apiFetch<Recommendation>("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskProfile: walletConnected ? "growth" : "balanced", ideaId: selectedIdea }),
      });
      setRecommendation(result);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  return (
    <main className="paper-stage min-h-screen" data-testid="foundersea-dashboard">
      <nav className="sticky top-0 z-30 bg-[var(--color-warm-canvas)] px-4 py-3 shadow-[var(--shadow-nav)] md:px-8" data-testid="top-navigation">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4">
          <a href="#discovery" className="group flex items-center gap-3" data-testid="brand-home-link">
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--color-sunburst-yellow)] text-[var(--color-midnight)] transition-transform duration-200 group-hover:-rotate-6" data-testid="brand-mark">
              <GitBranch size={20} weight="bold" />
            </span>
            <span>
              <span className="block text-[15px] font-semibold tracking-[-0.2px] text-[var(--color-charcoal-primary)]" data-testid="brand-name">FounderSea</span>
              <span className="block text-[12px] tracking-[-0.14px] text-[var(--color-ash)]" data-testid="brand-subtitle">Idea adventure market</span>
            </span>
          </a>
          <div className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-[var(--color-charcoal-primary)]" data-testid="navigation-links">
            {["Discovery", "Revenue", "Builders", "AI Queue"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="rounded-full px-3 py-2 transition-colors duration-200 hover:bg-[var(--color-stone-surface)]" data-testid={`nav-${item.toLowerCase().replace(" ", "-")}-link`}>
                {item}
              </a>
            ))}
          </div>
          <button type="button" onClick={() => setWalletConnected((value) => !value)} className="pill-dark flex h-10 items-center gap-2 px-4 text-[14px] font-semibold transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-charcoal-primary)]" data-testid="connect-wallet-button">
            <Wallet size={18} weight="bold" />
            {walletConnected ? "0xA91b...2fC4" : "Connect EVM Wallet"}
          </button>
        </div>
      </nav>

      <section className="relative mx-auto flex max-w-[1200px] flex-col items-center px-4 pb-20 pt-20 text-center md:px-8 md:pb-28 md:pt-28" data-testid="hero-section">
        <div className="blob floaty left-6 top-24 h-24 w-24 bg-[var(--color-ember-orange)]" data-testid="hero-orange-character"><span className="blob-smile" /><span className="mini-leg left" /><span className="mini-leg right" /></div>
        <div className="blob floaty right-10 top-28 h-28 w-28 bg-[var(--color-sky-blue)] [animation-delay:600ms]" data-testid="hero-blue-character"><span className="blob-smile" /><span className="mini-leg left" /><span className="mini-leg right" /></div>
        <div className="blob floaty bottom-12 left-[18%] h-20 w-20 bg-[var(--color-meadow-green)] [animation-delay:300ms]" data-testid="hero-green-character"><span className="blob-smile" /><span className="mini-leg left" /><span className="mini-leg right" /></div>
        <div className="blob floaty bottom-20 right-[20%] h-16 w-16 bg-[var(--color-sunburst-yellow)] [animation-delay:900ms]" data-testid="hero-yellow-character"><span className="blob-smile" /><span className="mini-leg left" /><span className="mini-leg right" /></div>

        <div className="reveal inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[var(--color-graphite)] shadow-[var(--shadow-subtle)]" data-testid="hero-eyebrow">
          <Brain size={16} color="var(--color-sky-blue)" weight="fill" /> AI-ranked funding, but friendlier
        </div>
        <h1 className="font-family reveal mt-8 max-w-4xl text-[44px] font-medium leading-[1.09] tracking-[-0.88px] text-[var(--color-charcoal-primary)] md:text-[68px] md:tracking-[-2.11px]" data-testid="hero-title">
          Make idea investing feel like a playful revenue adventure.
        </h1>
        <p className="reveal mt-6 max-w-[560px] text-[17px] leading-[1.58] tracking-[-0.22px] text-[var(--color-graphite)]" data-testid="hero-description">
          FounderSea turns AI confidence, builder proof, funding momentum, and claimable USDY into a warm marketplace investors and builders can understand at a glance.
        </p>
        <div className="reveal mt-8 flex flex-wrap justify-center gap-3" data-testid="hero-actions">
          <a href="#discovery" className="pill-dark flex h-12 items-center px-5 text-[15px] font-semibold transition-transform duration-200 hover:-translate-y-0.5" data-testid="explore-ideas-button">Explore ideas</a>
          <button type="button" onClick={refreshRecommendation} className="pill-light flex h-12 items-center gap-2 px-5 text-[15px] font-medium transition-transform duration-200 hover:-translate-y-0.5" data-testid="hero-refresh-recommendation-button">
            <Sparkle size={18} weight="bold" /> {loadingRecommendation ? "Thinking..." : "Ask AI strategy"}
          </button>
        </div>
        <div className="mt-14 grid w-full gap-4 md:grid-cols-3" data-testid="hero-metrics-row">
          <StatCard label="Visible revenue" value={portfolio ? money(portfolio.earnedThisMonth) : "$0"} detail="earned by portfolio this month" icon={<Coins size={20} color="var(--color-sunburst-yellow)" weight="fill" />} testId="hero-visible-revenue-stat" />
          <StatCard label="Review queue" value={queue ? `${queue.pending}` : "--"} detail="ideas pending AI review" icon={<Activity size={20} color="var(--color-sky-blue)" weight="fill" />} testId="hero-review-queue-stat" />
          <StatCard label="Avg SLA" value={queue ? `${queue.averageTurnaroundHours}h` : "--"} detail="public AI review turnaround" icon={<Lightning size={20} color="var(--color-ember-orange)" weight="fill" />} testId="hero-review-sla-stat" />
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-8" data-testid="ai-recommendation-section">
        <div className="stone-card grid overflow-hidden lg:grid-cols-[0.92fr_1.08fr]" data-testid="ai-recommendation-card">
          <div className="bg-black p-5 text-white md:p-8" data-testid="dark-phone-mockup-card">
            <div className="rounded-[24px] border border-white/10 bg-[#050505] p-5 shadow-[var(--shadow-lg)]" data-testid="phone-screen">
              <div className="mb-8 flex items-center justify-between text-white/60" data-testid="phone-header">
                <span className="text-[13px]">AI wallet brief</span><PlugsConnected size={20} />
              </div>
              <div className="text-left" data-testid="phone-content">
                <div className="text-[13px] text-white/60">Claimable USDY</div>
                <div className="mt-2 text-[44px] font-semibold tracking-[-1.14px]">${portfolio?.claimableUsdy.toLocaleString() || "0"}</div>
                <div className="mt-8 space-y-3">
                  {recommendation?.rankedIdeas.map((idea) => (
                    <div key={idea.ideaId} className="flex items-center justify-between rounded-[18px] bg-white/8 p-3" data-testid={`phone-ranked-idea-${idea.ideaId}`}>
                      <span className="text-[14px]">{idea.title}</span><span className="rounded-full bg-[var(--color-meadow-green)] px-2 py-1 text-[12px] text-black">{idea.strategyScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="p-8 md:p-10">
            <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-ember-orange)]" data-testid="ai-card-label">Strategy recommendation</div>
            <h2 className="font-family mt-4 text-[44px] font-medium leading-[1.09] tracking-[-1.14px] text-[var(--color-midnight)]" data-testid="ai-card-headline">{recommendation?.headline || "Loading recommendation"}</h2>
            <p className="mt-5 text-[17px] leading-[1.58] tracking-[-0.22px] text-[var(--color-graphite)]" data-testid="ai-summary-text">{recommendation?.summary}</p>
            <div className="mt-7 grid gap-3" data-testid="ai-actions-list">
              {recommendation?.actions.map((action, index) => (
                <div key={action} className="flex gap-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-[15px] leading-[1.47] text-[var(--color-graphite)]" data-testid={`ai-action-${index}`}>
                  <CheckCircle className="mt-0.5 shrink-0 text-[var(--color-meadow-green)]" size={18} weight="fill" /> {action}
                </div>
              ))}
            </div>
            <button type="button" onClick={refreshRecommendation} className="pill-dark mt-7 flex h-12 items-center gap-2 px-5 text-[15px] font-semibold transition-transform duration-200 hover:-translate-y-0.5" data-testid="refresh-ai-recommendation-button">
              <Sparkle size={18} weight="bold" /> {loadingRecommendation ? "Recomputing..." : "Refresh AI strategy"}
            </button>
          </div>
        </div>
      </section>

      <section id="discovery" className="mx-auto max-w-[1200px] px-4 py-16 md:px-8" data-testid="discovery-section">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-ember-orange)]" data-testid="discovery-label">Discovery feed</div>
            <h2 className="font-family mt-2 text-[44px] font-medium leading-[1.09] tracking-[-1.14px] text-[var(--color-midnight)]" data-testid="discovery-title">Momentum-ranked ideas</h2>
          </div>
          <div className="flex flex-wrap gap-2" data-testid="feed-controls">
            {["all", "funding", "active"].map((item) => (
              <button key={item} type="button" onClick={() => setStage(item)} className={`${stage === item ? "pill-dark" : "pill-light"} h-10 px-4 text-[14px] font-medium transition-transform duration-200 hover:-translate-y-0.5`} data-testid={`stage-filter-${item}-button`}>
                {item}
              </button>
            ))}
            <button type="button" onClick={() => setSort(sort === "ai" ? "velocity" : "ai")} className="pill-light flex h-10 items-center gap-2 px-4 text-[14px] font-medium transition-transform duration-200 hover:-translate-y-0.5" data-testid="sort-feed-button">
              <Funnel size={16} /> Sort: {sort === "ai" ? "AI" : "Velocity"}
            </button>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]" data-testid="discovery-grid">
          <div className="grid gap-4" data-testid="idea-card-list">
            {ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} selected={idea.id === selectedIdea} onSelect={setSelectedIdea} />)}
          </div>
          <div className="stone-card p-8" data-testid="selected-idea-analytics-panel">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-meadow-green)]" data-testid="selected-idea-stage">{activeIdea?.stage || "--"}</div>
                <h3 className="mt-2 text-[23px] font-semibold leading-[1.2] tracking-[-0.44px] text-[var(--color-charcoal-primary)]" data-testid="selected-idea-title">{activeIdea?.title || "Select an idea"}</h3>
              </div>
              <span className="rounded-md bg-[var(--color-stone-surface)] px-3 py-2 text-[12px] text-[var(--color-graphite)]" data-testid="selected-idea-gate">Gate: {activeIdea?.gateType}</span>
            </div>
            <div className="cream-panel h-72 min-w-0 p-4" data-testid="funding-velocity-chart">
              {activeIdea ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeIdea.fundingVelocity.map((value, index) => ({ day: `D${index + 1}`, value }))}>
                    <defs><linearGradient id="velocity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0090ff" stopOpacity={0.35}/><stop offset="95%" stopColor="#0090ff" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid stroke="#f2f0ed" vertical={false} />
                    <XAxis dataKey="day" stroke="#848281" tickLine={false} axisLine={false} />
                    <YAxis stroke="#848281" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#fff", border: "0", boxShadow: "var(--shadow-subtle)", color: "#343433" }} />
                    <Area type="monotone" dataKey="value" stroke="#0090ff" fill="url(#velocity)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-[15px] text-[var(--color-ash)]" data-testid="funding-chart-loading">Loading velocity...</div>}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3" data-testid="selected-idea-stats">
              <StatCard label="Target" value={activeIdea ? money(activeIdea.targetRaise) : "--"} detail="raise cap" icon={<Gauge size={18} color="var(--color-sky-blue)" />} testId="selected-target-stat" />
              <StatCard label="Avg ticket" value={activeIdea ? money(activeIdea.averageTicket) : "--"} detail="retail-friendly" icon={<UsersThree size={18} color="var(--color-ember-orange)" />} testId="selected-ticket-stat" />
              <StatCard label="Builder rep" value={activeIdea ? `${activeIdea.builderReputation}/100` : "--"} detail="profile signal" icon={<Medal size={18} color="var(--color-sunburst-yellow)" />} testId="selected-builder-rep-stat" />
            </div>
          </div>
        </div>
      </section>

      <section id="revenue" className="mx-auto max-w-[1200px] px-4 py-16 md:px-8" data-testid="revenue-section">
        <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="stone-card p-8" data-testid="portfolio-summary-card">
            <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-ember-orange)]" data-testid="portfolio-label">Investor portfolio</div>
            <h2 className="font-family mt-2 text-[44px] font-medium leading-[1.09] tracking-[-1.14px] text-[var(--color-midnight)]" data-testid="portfolio-title">Revenue made visible</h2>
            <div className="mt-8 grid gap-3">
              <StatCard label="Claimable USDY" value={portfolio ? `$${portfolio.claimableUsdy.toLocaleString()}` : "--"} detail="available to claim now" icon={<Coins size={18} color="var(--color-sunburst-yellow)" weight="fill" />} testId="claimable-usdy-stat" />
              <StatCard label="Earned today" value={portfolio ? `$${portfolio.earnedToday}` : "--"} detail="daily digest metric" icon={<TrendUp size={18} color="var(--color-meadow-green)" weight="fill" />} testId="earned-today-stat" />
              <StatCard label="Holdings" value={portfolio ? money(portfolio.totalHoldingsUsd) : "--"} detail="IdeaToken portfolio" icon={<ShieldCheck size={18} color="var(--color-sky-blue)" weight="fill" />} testId="portfolio-holdings-stat" />
            </div>
            <a href="/api/investors/tax-report.csv" className="pill-dark mt-6 flex h-12 items-center justify-center gap-2 px-5 text-[15px] font-semibold transition-transform duration-200 hover:-translate-y-0.5" data-testid="download-tax-report-link">
              <DownloadSimple size={18} /> Export tax CSV
            </a>
          </div>
          <div className="stone-card p-8" data-testid="revenue-chart-card">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-[23px] font-semibold tracking-[-0.44px] text-[var(--color-charcoal-primary)]" data-testid="revenue-chart-title">Monthly revenue flow</h3>
              <div className="text-[12px] uppercase tracking-[0.14em] text-[var(--color-ash)]" data-testid="revenue-chart-subtitle">Builder revenue → investor USDY</div>
            </div>
            <div className="cream-panel h-72 min-w-0 p-4" data-testid="monthly-revenue-chart">
              {portfolio ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portfolio.revenueSeries}>
                    <CartesianGrid stroke="#f2f0ed" vertical={false} />
                    <XAxis dataKey="month" stroke="#848281" tickLine={false} axisLine={false} />
                    <YAxis stroke="#848281" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#fff", border: "0", boxShadow: "var(--shadow-subtle)", color: "#343433" }} />
                    <Bar dataKey="revenue" fill="#0090ff" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="earned" fill="#00ca48" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-[15px] text-[var(--color-ash)]" data-testid="revenue-chart-loading">Loading revenue...</div>}
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3" data-testid="live-revenue-events">
              {portfolio?.liveEvents.map((event, index) => (
                <div key={event} className="rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-[15px] leading-[1.47] text-[var(--color-graphite)]" data-testid={`live-revenue-event-${index}`}>{event}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="builders" className="mx-auto max-w-[1200px] px-4 py-16 md:px-8" data-testid="builders-section">
        <div className="mb-10">
          <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-ember-orange)]" data-testid="builders-label">Builder profiles</div>
          <h2 className="font-family mt-2 text-[44px] font-medium leading-[1.09] tracking-[-1.14px] text-[var(--color-midnight)]" data-testid="builders-title">Reputation users can trust</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3" data-testid="builder-profile-grid">
          {builders.map((builder, index) => (
            <article key={builder.address} className="stone-card overflow-hidden transition-[box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]" data-testid={`builder-profile-card-${index}`}>
              <div className="cream-panel m-4 flex aspect-[16/9] items-center justify-center" data-testid={`builder-profile-illustration-${index}`}>
                <div className={`relative grid h-24 w-24 place-items-center rounded-[42%_58%_64%_36%/48%_34%_66%_52%] ${index === 0 ? "bg-[var(--color-sky-blue)]" : index === 1 ? "bg-[var(--color-ember-orange)]" : "bg-[var(--color-meadow-green)]"}`} data-testid={`builder-avatar-blob-${index}`}>
                  <div className="absolute left-[32%] top-[36%] h-2 w-2 rounded-full bg-black" /><div className="absolute right-[32%] top-[36%] h-2 w-2 rounded-full bg-black" /><div className="mt-6 h-3 w-7 rounded-b-full border-b-4 border-black" />
                </div>
              </div>
              <div className="p-6">
                <div className="text-[12px] text-[var(--color-ash)]" data-testid={`builder-address-${index}`}>{builder.address}</div>
                <h3 className="mt-2 text-[23px] font-semibold leading-[1.2] tracking-[-0.44px] text-[var(--color-charcoal-primary)]" data-testid={`builder-name-${index}`}>{builder.name}</h3>
                <p className="mt-1 text-[15px] text-[var(--color-graphite)]" data-testid={`builder-role-${index}`}>{builder.role}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-[14px] text-[var(--color-charcoal-primary)]" data-testid={`builder-stats-${index}`}>
                  <div data-testid={`builder-milestones-${index}`}><span className="block text-[var(--color-ash)]">Shipped</span>{builder.milestonesDelivered}</div>
                  <div data-testid={`builder-confidence-${index}`}><span className="block text-[var(--color-ash)]">AI avg</span>{builder.averageAiConfidence}%</div>
                  <div data-testid={`builder-revenue-${index}`}><span className="block text-[var(--color-ash)]">Revenue</span>{compact(builder.revenueGenerated)}</div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2" data-testid={`builder-badges-${index}`}>
                  {builder.badges.map((badge) => <span key={badge} className="rounded-md bg-[var(--color-stone-surface)] px-2 py-1 text-[12px] text-[var(--color-graphite)]" data-testid={`builder-badge-${index}-${badge.toLowerCase().replaceAll(" ", "-")}`}>{badge}</span>)}
                </div>
                <div className="mt-5 flex gap-2">
                  <a href={builder.github} className="pill-light flex h-10 w-10 items-center justify-center transition-transform duration-200 hover:-translate-y-0.5" data-testid={`builder-github-link-${index}`}><ArrowSquareOut size={17} /></a>
                  <a href={builder.portfolio} className="pill-light flex h-10 w-10 items-center justify-center transition-transform duration-200 hover:-translate-y-0.5" data-testid={`builder-portfolio-link-${index}`}><PlugsConnected size={17} /></a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="ai-queue" className="mx-auto max-w-[1200px] px-4 py-16 pb-24 md:px-8" data-testid="ai-queue-section">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="stone-card p-8" data-testid="ai-review-queue-card">
            <div className="flex items-center gap-3 text-[var(--color-sky-blue)]" data-testid="queue-card-label"><Brain size={22} weight="fill" /> Public AI review queue</div>
            <h2 className="font-family mt-4 text-[44px] font-medium leading-[1.09] tracking-[-1.14px] text-[var(--color-midnight)]" data-testid="queue-card-title">No more black box approvals.</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard label="Pending" value={queue ? `${queue.pending}` : "--"} detail="ideas in queue" icon={<Activity size={18} color="var(--color-sky-blue)" />} testId="queue-pending-stat" />
              <StatCard label="Your place" value={queue ? `#${queue.viewerPosition}` : "--"} detail="visible position" icon={<ChartLineUp size={18} color="var(--color-ember-orange)" />} testId="queue-position-stat" />
              <StatCard label="SLA" value={queue ? `${queue.averageTurnaroundHours}h` : "--"} detail="rolling average" icon={<Lightning size={18} color="var(--color-sunburst-yellow)" />} testId="queue-sla-stat" />
            </div>
            <div className="mt-6 space-y-3" data-testid="queue-items-list">
              {queue?.items.map((item) => (
                <div key={item.ideaId} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`queue-item-${item.ideaId}`}>
                  <div>
                    <div className="font-semibold text-[var(--color-charcoal-primary)]" data-testid={`queue-item-title-${item.ideaId}`}>{item.title}</div>
                    <div className="mt-1 text-[12px] uppercase tracking-[0.14em] text-[var(--color-ash)]" data-testid={`queue-item-status-${item.ideaId}`}>{item.status}</div>
                  </div>
                  <div className="text-[var(--color-sky-blue)]" data-testid={`queue-item-confidence-${item.ideaId}`}>{item.confidencePreview}% preview</div>
                </div>
              ))}
            </div>
          </div>
          <div className="stone-card p-8" data-testid="rejection-feedback-card">
            <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-ember-orange)]" data-testid="feedback-label">Structured feedback</div>
            <h2 className="font-family mt-2 text-[44px] font-medium leading-[1.09] tracking-[-1.14px] text-[var(--color-midnight)]" data-testid="feedback-title">Creators can iterate instead of churn.</h2>
            <div className="mt-8 space-y-4" data-testid="feedback-schema-list">
              {queue && Object.entries(queue.feedbackSchema).map(([key, value]) => (
                <div key={key} className="rounded-[10px] bg-[var(--color-parchment-card)] p-5" data-testid={`feedback-schema-${key}`}>
                  <div className="text-[12px] uppercase tracking-[0.14em] text-[var(--color-ash)]" data-testid={`feedback-schema-key-${key}`}>{key}</div>
                  <p className="mt-2 text-[15px] leading-[1.47] text-[var(--color-graphite)]" data-testid={`feedback-schema-value-${key}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}