import Link from "next/link";
import { ArrowSquareOut, Brain, ChartLineUp, GitBranch, ShieldCheck, TrendUp } from "./components/icons";

const partners = ["Mantle", "USDY", "AgentIdentity", "IdeaMarketplace", "DAO Voting", "BuilderAgreement", "IPFS", "TokenRouter"];
const products = [
  { title: "Idea Markets", label: "Capital Formation", body: "AI-ranked venture primitives where investors signal, fund, and track execution milestones onchain." },
  { title: "Revenue Rail", label: "Investor Transparency", body: "Portfolio dashboards expose claimable USDY, revenue events, milestone releases, and tax-ready activity." },
  { title: "Builder Reputation", label: "Execution Layer", body: "Every builder earns a portable record of milestones delivered, AI confidence, revenue generated, and dispute history." },
  { title: "AgentIdentity", label: "AI Governance", body: "A public decision ledger for approvals, milestone validation, DAO recommendations, and IPFS-verifiable reasoning." },
];
const insights = [
  "Making early-stage revenue visible is the retention layer for tokenized venture.",
  "Chair auctions turn passive holders into accountable operating leaders.",
  "AI confidence becomes useful when every decision is inspectable and overridable.",
];

export default function LandingPage() {
  return (
    <main className="enterprise-stage min-h-screen overflow-hidden" data-testid="enterprise-landing-page">
      <div className="border-b border-white/10 bg-[#050505]/80 px-6 py-3 text-center text-[13px] text-zinc-300 backdrop-blur-xl" data-testid="marketing-announcement-bar">
        FounderSea protocol architecture now supports app-grade idea discovery, AI validation, and revenue visibility.
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/60 px-6 py-4 backdrop-blur-xl md:px-12 lg:px-24" data-testid="marketing-navbar">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" data-testid="marketing-brand-link">
            <span className="grid h-10 w-10 place-items-center border border-white/15 bg-white text-black" data-testid="marketing-brand-mark"><GitBranch size={20} /></span>
            <span className="font-outfit text-[17px] font-semibold tracking-[-0.02em]" data-testid="marketing-brand-name">FounderSea</span>
          </Link>
          <div className="hidden items-center gap-8 text-[14px] text-zinc-300 md:flex" data-testid="marketing-nav-links">
            <a href="#products" className="transition-colors hover:text-white" data-testid="marketing-nav-products">Products</a>
            <a href="#resources" className="transition-colors hover:text-white" data-testid="marketing-nav-resources">Resources</a>
            <a href="#ecosystem" className="transition-colors hover:text-white" data-testid="marketing-nav-ecosystem">Ecosystem</a>
            <a href="#about" className="transition-colors hover:text-white" data-testid="marketing-nav-about">About</a>
          </div>
          <Link href="/discover" className="bg-[#0052FF] px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#3377FF]" data-testid="marketing-nav-launch-app">
            Launch App
          </Link>
        </div>
      </nav>

      <section className="enterprise-grid relative px-6 py-24 md:px-12 lg:px-24 lg:py-36" data-testid="marketing-hero-section">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_25%,rgba(0,82,255,0.22),transparent_32rem)]" />
        <div className="relative mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div data-testid="hero-copy-column">
            <div className="mb-8 inline-flex border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-[#3377FF]" data-testid="hero-eyebrow">
              Protocol for tokenized venture formation
            </div>
            <h1 className="font-outfit max-w-5xl text-5xl font-medium leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl" data-testid="hero-title">
              Institutional-grade startup finance, delivered onchain.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400" data-testid="hero-subtitle">
              FounderSea connects idea discovery, builder execution, AI validation, Chair governance, and revenue transparency into one protocol surface for investors and operators.
            </p>
            <div className="mt-10 flex flex-wrap gap-4" data-testid="hero-cta-row">
              <Link href="/discover" className="bg-[#0052FF] px-7 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-[#3377FF]" data-testid="hero-launch-app-button">Launch App</Link>
              <a href="#products" className="border border-white/15 px-7 py-4 text-[15px] font-semibold text-white transition-colors hover:border-white/40" data-testid="hero-explore-products-button">Explore Products</a>
            </div>
          </div>

          <div className="enterprise-card p-6 lg:p-8" data-testid="hero-data-terminal">
            <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4 text-sm text-zinc-400">
              <span data-testid="terminal-label">Protocol Snapshot</span>
              <span className="text-emerald-400" data-testid="terminal-status">Live / Mantle Sepolia</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2" data-testid="terminal-metric-grid">
              {["$48.2K Portfolio", "42 AI Reviews", "8 Core Modules", "5003 Chain ID"].map((metric) => (
                <div key={metric} className="border border-white/10 bg-black/40 p-5" data-testid={`terminal-metric-${metric.toLowerCase().replaceAll(" ", "-").replaceAll("$", "usd")}`}>
                  <div className="font-mono text-2xl text-white">{metric.split(" ")[0]}</div>
                  <div className="mt-2 text-sm text-zinc-500">{metric.split(" ").slice(1).join(" ")}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 border border-white/10 bg-[#07111F] p-5" data-testid="terminal-ai-log">
              <div className="mb-3 flex items-center gap-2 text-[#3377FF]"><Brain size={18} /> AgentIdentity Decision</div>
              <p className="text-sm leading-6 text-zinc-300">Revenue Radar leads with 91% AI confidence, strong funding velocity, and verifiable milestone history.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="ecosystem" className="border-y border-white/10 px-6 py-10 md:px-12 lg:px-24" data-testid="trust-strip-section">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6 font-mono text-xs uppercase tracking-[0.22em] text-zinc-500" data-testid="trust-strip-label">Protocol ecosystem</div>
          <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-4 lg:grid-cols-8" data-testid="partner-logo-grid">
            {partners.map((partner) => <div key={partner} className="bg-[#050505] px-4 py-6 text-center text-sm text-zinc-500 transition-colors hover:text-white" data-testid={`partner-${partner.toLowerCase().replaceAll(" ", "-")}`}>{partner}</div>)}
          </div>
        </div>
      </section>

      <section id="products" className="px-6 py-24 md:px-12 lg:px-24 lg:py-32" data-testid="product-suite-section">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-14 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div><div className="font-mono text-xs uppercase tracking-[0.22em] text-[#3377FF]" data-testid="products-eyebrow">Our Products</div><h2 className="font-outfit mt-4 text-4xl font-medium tracking-[-0.04em] text-white lg:text-5xl" data-testid="products-title">A new standard for tokenized startup finance.</h2></div>
            <p className="text-lg leading-8 text-zinc-400" data-testid="products-body">The product suite separates discovery, allocation, execution, governance, and verification — the same way enterprise financial products separate marketing, trading, compliance, and operations.</p>
          </div>
          <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4" data-testid="product-card-grid">
            {products.map((product) => <article key={product.title} className="bg-[#121212] p-8 transition-colors hover:bg-[#1E1E1E]" data-testid={`product-card-${product.title.toLowerCase().replaceAll(" ", "-")}`}><div className="font-mono text-xs uppercase tracking-[0.18em] text-[#3377FF]">{product.label}</div><h3 className="font-outfit mt-6 text-2xl font-medium text-white">{product.title}</h3><p className="mt-4 text-base leading-7 text-zinc-400">{product.body}</p><Link href="/discover" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white" data-testid={`product-link-${product.title.toLowerCase().replaceAll(" ", "-")}`}>Open in app <ArrowSquareOut size={15} /></Link></article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080808] px-6 py-20 md:px-12 lg:px-24" data-testid="metrics-section">
        <div className="mx-auto grid max-w-[1440px] gap-px border border-white/10 bg-white/10 md:grid-cols-4">
          {[{ k: "$850K", v: "Target raise surfaced" }, { k: "91%", v: "Top AI conviction" }, { k: "3", v: "Revenue-bearing positions" }, { k: "8", v: "App surfaces live" }].map((item) => <div key={item.v} className="bg-[#080808] p-8" data-testid={`metric-${item.v.toLowerCase().replaceAll(" ", "-")}`}><div className="font-mono text-4xl text-white">{item.k}</div><div className="mt-3 text-sm uppercase tracking-[0.16em] text-zinc-500">{item.v}</div></div>)}
        </div>
      </section>

      <section id="about" className="px-6 py-24 md:px-12 lg:px-24 lg:py-32" data-testid="institutional-grade-section">
        <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div><div className="font-mono text-xs uppercase tracking-[0.22em] text-[#3377FF]">Trust & Transparency</div><h2 className="font-outfit mt-4 text-4xl font-medium tracking-[-0.04em] text-white lg:text-5xl" data-testid="trust-title">Institutional discipline in all protocol flows.</h2><p className="mt-6 text-lg leading-8 text-zinc-400">Enterprise Web3 users need proof, controls, and auditability. FounderSea exposes the AI decision trail, role-based operating surfaces, disabled writes until confirmed, and environment-backed contract readiness.</p></div>
          <div className="grid gap-px border border-white/10 bg-white/10" data-testid="trust-checklist">
            {["Contract addresses loaded from protected backend environment", "AI decisions summarized with hashes and confidence", "Write transactions separated from read-only product surfaces", "Portfolio revenue and tax exports designed for allocator workflows", "DAO and Chair flows modeled as governance operations"].map((item, index) => <div key={item} className="flex gap-4 bg-[#121212] p-6" data-testid={`trust-item-${index}`}><ShieldCheck className="shrink-0 text-emerald-400" /><span className="text-zinc-300">{item}</span></div>)}
          </div>
        </div>
      </section>

      <section id="resources" className="px-6 pb-24 md:px-12 lg:px-24" data-testid="insights-section">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><div className="font-mono text-xs uppercase tracking-[0.22em] text-[#3377FF]">The FounderSea Perspective</div><h2 className="font-outfit mt-4 text-4xl font-medium tracking-[-0.04em] text-white" data-testid="insights-title">Insights & intelligence</h2></div><Link href="/agent" className="border border-white/15 px-5 py-3 text-sm font-semibold text-white" data-testid="explore-agent-link">Explore AI Monitor</Link></div>
          <div className="grid gap-6 md:grid-cols-3" data-testid="insight-card-grid">{insights.map((item, index) => <article key={item} className="enterprise-card min-h-52 p-7" data-testid={`insight-card-${index}`}><div className="mb-8 flex items-center justify-between text-zinc-500"><span className="font-mono text-xs">0{index + 1}</span><ChartLineUp size={18} /></div><h3 className="font-outfit text-xl font-medium leading-7 text-white">{item}</h3></article>)}</div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-14 md:px-12 lg:px-24" data-testid="marketing-footer">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div><div className="font-outfit text-xl font-semibold">FounderSea</div><p className="mt-4 max-w-md text-sm leading-6 text-zinc-500">A protocol interface for tokenized startup formation, AI validation, builder reputation, and revenue visibility.</p></div>
            <div><h4 className="font-semibold text-white">Products</h4><div className="mt-4 grid gap-3 text-sm text-zinc-500"><Link href="/discover">Discover</Link><Link href="/portfolio">Portfolio</Link><Link href="/create">Create</Link></div></div>
            <div><h4 className="font-semibold text-white">Resources</h4><div className="mt-4 grid gap-3 text-sm text-zinc-500"><Link href="/agent">AI Monitor</Link><Link href="/ideas/idea-104">Product Page</Link><Link href="/chair/idea-104">Chair Auction</Link></div></div>
            <div><h4 className="font-semibold text-white">Protocol</h4><div className="mt-4 grid gap-3 text-sm text-zinc-500"><span>Mantle Sepolia</span><span>USDY</span><span>AgentIdentity</span></div></div>
          </div>
          <div className="mt-14 border-t border-white/10 pt-8 text-xs leading-6 text-zinc-600" data-testid="marketing-disclaimer">
            Important information: FounderSea interface content is for product demonstration and protocol workflow design. Nothing on this page constitutes investment, legal, tax, or financial advice. Acquiring digital assets involves risk, including possible loss of principal. Eligibility, jurisdictional restrictions, contract availability, and final transaction behavior must be verified before enabling production writes.
          </div>
        </div>
      </footer>
    </main>
  );
}
