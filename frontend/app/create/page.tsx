import { AppShell } from "../components/AppShell";
import { Brain, Coins, Funnel, ShieldCheck } from "../components/icons";
import { DisabledTxButton, MiniBars, PageIntro, StatCard, StatusChip, money } from "../components/uiBits";
import { serverApi } from "../lib/api";

export const dynamic = "force-dynamic";

type CreateConfig = { categories: string[]; gateTypes: string[]; deposit: { amount: number; asset: string; approvedCredit: string; rejectedRefund: string }; aiReviewEtaMinutes: number };

export default async function CreateIdeaPage() {
  const config = await serverApi<CreateConfig>("/api/create/config");
  const steps = ["The Pitch", "The Economics", "The Gate", "The Deposit", "Review"];

  return (
    <AppShell>
      <PageIntro eyebrow="Create idea" title="Launch submission should feel like a product launch, not a form fill." body="A five-step wizard previews how the idea appears in discovery, explains economics in plain English, and keeps write actions disabled until contract writes are confirmed." />
      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-24 md:px-8 lg:grid-cols-[1fr_360px]" data-testid="create-page-grid">
        <div className="space-y-6" data-testid="create-wizard-column">
          <div className="stone-card p-6" data-testid="wizard-progress-card"><div className="flex flex-wrap gap-2">{steps.map((step, index) => <StatusChip key={step} label={`${index + 1}. ${step}`} tone={index === 0 ? "good" : "neutral"} testId={`wizard-step-chip-${index}`} />)}</div><div className="mt-4 h-3 rounded-full bg-[var(--color-stone-surface)]"><div className="h-full w-1/5 rounded-full bg-[var(--color-meadow-green)]" data-testid="wizard-progress-bar" /></div></div>
          <div className="stone-card p-6" data-testid="pitch-step-card"><h2 className="text-[23px] font-semibold">Step 1 — The Pitch</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><div><label htmlFor="idea-name" className="text-[13px] text-[var(--color-ash)]">Idea name</label><input id="idea-name" readOnly value="Revenue Copilot for SaaS" className="mt-2 w-full rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-idea-name-input" /></div><div><label htmlFor="category" className="text-[13px] text-[var(--color-ash)]">Category</label><input id="category" readOnly value={config.categories[0]} className="mt-2 w-full rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-category-input" /></div></div><textarea readOnly value="AI tracks usage, expansion signals, and revenue hooks so investors see outcomes faster." className="mt-4 min-h-28 w-full rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-description-input" /></div>
          <div className="stone-card p-6" data-testid="economics-step-card"><h2 className="text-[23px] font-semibold">Step 2 — The Economics</h2><div className="mt-5 grid gap-4 md:grid-cols-3"><StatCard label="Target raise" value="$850K" detail="funding cap" icon={<Coins color="var(--color-sunburst-yellow)" />} testId="target-raise-preview" /><StatCard label="Builder allocation" value="20%" detail="36-month unlock" icon={<ShieldCheck color="var(--color-sky-blue)" />} testId="builder-allocation-preview" /><StatCard label="Prize pool" value="8%" detail="competition winners" icon={<Brain color="var(--color-ember-orange)" />} testId="prize-pool-preview" /></div><div className="mt-5 rounded-[12px] bg-[var(--color-parchment-card)] p-4"><MiniBars values={[55, 20, 17, 8]} testId="raise-distribution-chart" /></div></div>
          <div className="stone-card p-6" data-testid="gate-step-card"><h2 className="text-[23px] font-semibold">Step 3 — The Gate</h2><div className="mt-4 flex flex-wrap gap-2">{config.gateTypes.map((gate, index) => <StatusChip key={gate} label={gate} tone={index === 0 ? "good" : "neutral"} testId={`gate-type-${gate.toLowerCase().replaceAll(" ", "-")}`} />)}</div><p className="mt-4 text-[15px]">Open gate lets anyone invest or signal; whitelist, min hold, and DAO curated fields appear when selected.</p></div>
          <div className="stone-card p-6" data-testid="deposit-step-card"><h2 className="text-[23px] font-semibold">Step 4 — The Deposit</h2><div className="mt-5 grid gap-4 md:grid-cols-3"><StatCard label="Deposit" value={`${config.deposit.amount} ${config.deposit.asset}`} detail="required at submit" icon={<Coins color="var(--color-sunburst-yellow)" />} testId="deposit-amount-stat" /><StatCard label="Approved" value="Credited" detail={config.deposit.approvedCredit} testId="deposit-approved-stat" /><StatCard label="Rejected" value="90% back" detail={config.deposit.rejectedRefund} testId="deposit-rejected-stat" /></div></div>
          <div className="stone-card p-6" data-testid="review-step-card"><h2 className="text-[23px] font-semibold">Step 5 — Review</h2><p className="mt-3 text-[15px]">AI review starts after submission and usually finishes in ~{config.aiReviewEtaMinutes} minutes.</p><DisabledTxButton label="Submit idea" testId="submit-idea-disabled-button" /></div>
        </div>
        <aside className="space-y-6" data-testid="create-preview-sidebar">
          <div className="stone-card p-6" data-testid="discovery-preview-card"><div className="flex items-center justify-between"><StatusChip label="SaaS" testId="preview-category-chip" /><StatusChip label="Preview" testId="preview-state-chip" /></div><h2 className="mt-4 text-[23px] font-semibold">Revenue Copilot for SaaS</h2><p className="mt-3 text-[15px]">AI tracks expansion revenue so investors see money moving.</p><div className="mt-5 rounded-[12px] bg-[var(--color-parchment-card)] p-4"><MiniBars values={[12, 18, 32, 48, 61]} testId="preview-card-chart" /></div><DisabledTxButton label="Signal preview" testId="preview-signal-button" /></div>
          <div className="stone-card p-6" data-testid="ai-review-preview"><Funnel color="var(--color-ember-orange)" /><h2 className="mt-3 text-[23px] font-semibold">Live review state</h2><p className="mt-2 text-[15px]">After submit, this becomes a live confidence-building status screen instead of a blank pending message.</p></div>
        </aside>
      </section>
    </AppShell>
  );
}