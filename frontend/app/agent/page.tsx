import Link from "next/link";
import { AppShell } from "../components/AppShell";
import { Activity, Brain, ChartLineUp, Gauge, ShieldCheck } from "../components/icons";
import { MiniBars, PageIntro, StatCard, StatusChip, VerifyRow } from "../components/uiBits";
import { serverApi } from "../lib/api";

export const dynamic = "force-dynamic";

type AgentData = {
  agent: { name: string; modelId: string; createdAt: string; totalDecisions: number; averageConfidence: number; uptime: string };
  decisions: Array<{ id: string; ideaId: string; decisionType: string; confidence: number; inputHash: string; outputHash: string; summary: string }>;
  breakdown: Record<string, number>;
  anomalies: Array<{ id: string; summary: string; severity: string }>;
};

export default async function AgentMonitorPage() {
  const data = await serverApi<AgentData>("/api/agent/monitor");
  const breakdownValues = Object.values(data.breakdown);

  return (
    <AppShell>
      <PageIntro eyebrow="AI Agent Monitor" title="Make the AI feel verifiable, not mysterious." body="A public transparency report for AgentIdentity decisions: confidence, hashes, plain-English reasoning, overrides, and decision distribution." />
      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-24 md:px-8 lg:grid-cols-[1fr_360px]" data-testid="agent-monitor-grid">
        <div className="space-y-6" data-testid="agent-main-column">
          <div className="stone-card p-6" data-testid="agent-identity-card"><Brain color="var(--color-sky-blue)" /><h2 className="mt-3 text-[32px] font-semibold tracking-[-1px]" data-testid="agent-name">{data.agent.name}</h2><p className="mt-2 text-[15px]" data-testid="agent-model-id">Model: {data.agent.modelId}</p><div className="mt-5 grid gap-4 md:grid-cols-4"><StatCard label="Decisions" value={data.agent.totalDecisions.toLocaleString()} detail="all-time" icon={<Activity color="var(--color-ember-orange)" />} testId="agent-decisions-stat" /><StatCard label="Confidence" value={`${data.agent.averageConfidence}%`} detail="average" icon={<Gauge color="var(--color-meadow-green)" />} testId="agent-confidence-stat" /><StatCard label="Uptime" value={data.agent.uptime} detail="monitoring" icon={<ShieldCheck color="var(--color-sky-blue)" />} testId="agent-uptime-stat" /><StatCard label="Created" value={data.agent.createdAt} detail="identity start" testId="agent-created-stat" /></div></div>

          <div className="stone-card p-6" data-testid="decision-feed-card"><h2 className="text-[23px] font-semibold">Decision feed</h2><div className="mt-5 space-y-4">{data.decisions.map((decision) => <div key={decision.id} className="rounded-[10px] bg-[var(--color-parchment-card)] p-5" data-testid={`decision-${decision.id}`}><div className="flex flex-wrap items-center justify-between gap-3"><StatusChip label={decision.decisionType} testId={`decision-type-${decision.id}`} /><Link href={`/ideas/${decision.ideaId}?tab=ai-logs`} className="orange-link text-[14px] font-semibold" data-testid={`decision-idea-link-${decision.id}`}>{decision.ideaId}</Link></div><div className="mt-3 text-[28px] font-semibold" data-testid={`decision-confidence-${decision.id}`}>{decision.confidence}%</div><p className="mt-2 text-[15px] leading-[1.55]" data-testid={`decision-summary-${decision.id}`}>{decision.summary}</p><div className="mt-4 grid gap-2 md:grid-cols-2"><VerifyRow label="Input" value={decision.inputHash} testId={`decision-input-${decision.id}`} /><VerifyRow label="Output" value={decision.outputHash} testId={`decision-output-${decision.id}`} /></div></div>)}</div></div>
        </div>
        <aside className="space-y-6" data-testid="agent-sidebar">
          <div className="stone-card p-6" data-testid="decision-breakdown-card"><ChartLineUp color="var(--color-ember-orange)" /><h2 className="mt-3 text-[23px] font-semibold">Decision type breakdown</h2><div className="mt-5 rounded-[12px] bg-[var(--color-parchment-card)] p-4"><MiniBars values={breakdownValues} testId="decision-breakdown-chart" /></div>{Object.entries(data.breakdown).map(([type, count]) => <div key={type} className="mt-3 flex justify-between rounded-[10px] bg-[var(--color-parchment-card)] p-3" data-testid={`breakdown-row-${type.toLowerCase()}`}><span>{type}</span><span>{count}</span></div>)}</div>
          <div className="stone-card p-6" data-testid="verification-guide-card"><ShieldCheck color="var(--color-meadow-green)" /><h2 className="mt-3 text-[23px] font-semibold">Verification guide</h2><p className="mt-2 text-[15px] leading-[1.55]">Open any decision, compare input/output hashes against IPFS, then follow the linked idea to see the visible product impact.</p></div>
          <div className="stone-card p-6" data-testid="anomaly-log-card"><h2 className="text-[23px] font-semibold">Anomaly log</h2>{data.anomalies.map((item) => <div key={item.id} className="mt-4 rounded-[10px] bg-[var(--color-parchment-card)] p-4" data-testid={`anomaly-${item.id}`}><StatusChip label={item.severity} tone="warn" testId={`anomaly-severity-${item.id}`} /><p className="mt-2 text-[15px]">{item.summary}</p></div>)}</div>
        </aside>
      </section>
    </AppShell>
  );
}