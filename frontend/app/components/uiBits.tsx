import Link from "next/link";
import type { ReactNode } from "react";
import { Alert, CheckCircle } from "./icons";

export const money = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits }).format(value);

export const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export const PageIntro = ({ eyebrow, title, body, action }: { eyebrow: string; title: string; body: string; action?: ReactNode }) => (
  <section className="mx-auto max-w-[1200px] px-4 pb-10 pt-14 md:px-8 md:pt-20" data-testid="page-intro">
    <div className="max-w-3xl">
      <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-ember-orange)]" data-testid="page-eyebrow">{eyebrow}</div>
      <h1 className="font-family mt-3 text-[44px] font-medium leading-[1.09] tracking-[-1.14px] text-[var(--color-midnight)] md:text-[68px] md:tracking-[-2.11px]" data-testid="page-title">{title}</h1>
      <p className="mt-5 max-w-[620px] text-[17px] leading-[1.58] tracking-[-0.22px] text-[var(--color-graphite)]" data-testid="page-body">{body}</p>
      {action ? <div className="mt-7" data-testid="page-action">{action}</div> : null}
    </div>
  </section>
);

export const StatCard = ({ label, value, detail, icon, testId }: { label: string; value: string; detail: string; icon?: ReactNode; testId: string }) => (
  <div className="stone-card p-6 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]" data-testid={testId}>
    <div className="mb-8 flex items-center justify-between text-[var(--color-ash)]" data-testid={`${testId}-label`}>
      <span className="text-xs uppercase tracking-[0.2em]">{label}</span>
      {icon}
    </div>
    <div className="text-[32px] font-semibold tracking-[-1.1px] text-[var(--color-midnight)]" data-testid={`${testId}-value`}>{value}</div>
    <p className="mt-2 text-[15px] leading-[1.47] text-[var(--color-graphite)]" data-testid={`${testId}-detail`}>{detail}</p>
  </div>
);

export const DisabledTxButton = ({ label, testId }: { label: string; testId: string }) => (
  <button type="button" disabled className="pill-light h-11 cursor-not-allowed px-5 text-[14px] font-semibold opacity-70" data-testid={testId}>
    {label} · reads enabled, writes pending
  </button>
);

export const StatusChip = ({ label, tone = "neutral", testId }: { label: string; tone?: "good" | "warn" | "bad" | "neutral"; testId: string }) => {
  const color = tone === "good" ? "var(--color-meadow-green)" : tone === "warn" ? "var(--color-deep-amber)" : tone === "bad" ? "var(--color-ember-orange)" : "var(--color-sky-blue)";
  return <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: `${color}18`, color }} data-testid={testId}>{label}</span>;
};

export const MiniBars = ({ values, color = "var(--color-sky-blue)", testId }: { values: number[]; color?: string; testId: string }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-28 items-end gap-2" data-testid={testId}>
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex-1 rounded-t-[8px]" style={{ height: `${Math.max(10, (value / max) * 112)}px`, background: color }} data-testid={`${testId}-bar-${index}`} />
      ))}
    </div>
  );
};

export const ProgressRing = ({ value, label, testId }: { value: number; label: string; testId: string }) => (
  <div className="relative grid h-20 w-20 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-sky-blue) ${value * 3.6}deg, var(--color-stone-surface) 0deg)` }} data-testid={testId}>
    <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-center">
      <span className="text-[16px] font-semibold text-[var(--color-midnight)]" data-testid={`${testId}-value`}>{value}</span>
    </div>
    <span className="sr-only">{label}</span>
  </div>
);

export const VerifyRow = ({ label, value, testId }: { label: string; value: string; testId: string }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-[var(--color-parchment-card)] p-3 text-[13px]" data-testid={testId}>
    <span className="text-[var(--color-ash)]">{label}</span>
    <span className="font-medium text-[var(--color-charcoal-primary)]">{value}</span>
  </div>
);

export const EmptyGuard = ({ ok, children, testId }: { ok: boolean; children: ReactNode; testId: string }) => (
  ok ? children : <div className="stone-card p-8 text-[15px] text-[var(--color-graphite)]" data-testid={testId}><Alert className="mb-3 text-[var(--color-ember-orange)]" /> Loading protocol data...</div>
);

export const InternalLink = ({ href, children, testId }: { href: string; children: ReactNode; testId: string }) => (
  <Link href={href} className="orange-link text-[14px] font-semibold" data-testid={testId}>{children}</Link>
);

export const SuccessLine = ({ children, testId }: { children: ReactNode; testId: string }) => (
  <div className="flex gap-3 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-[15px] leading-[1.47] text-[var(--color-graphite)]" data-testid={testId}>
    <CheckCircle className="mt-0.5 shrink-0 text-[var(--color-meadow-green)]" /> {children}
  </div>
);