import Link from "next/link";
import type { ReactNode } from "react";
import { GitBranch } from "./icons";
import { WalletConnect } from "./WalletConnect";

const nav = [
  { label: "Discover", href: "/discover", testId: "nav-discover-link" },
  { label: "Portfolio", href: "/portfolio", testId: "nav-portfolio-link" },
  { label: "Create", href: "/create", testId: "nav-create-link" },
];

export const AppShell = ({ children }: { children: ReactNode }) => (
  <main className="paper-stage min-h-screen" data-testid="app-shell">
    <nav className="sticky top-0 z-40 bg-[var(--color-warm-canvas)] px-4 py-3 shadow-[var(--shadow-nav)] md:px-8" data-testid="top-navigation">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4">
        <Link href="/discover" className="group flex items-center gap-3" data-testid="brand-home-link">
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--color-sunburst-yellow)] text-[var(--color-midnight)] transition-transform duration-200 group-hover:-rotate-6" data-testid="brand-mark">
            <GitBranch size={20} />
          </span>
          <span>
            <span className="block text-[15px] font-semibold tracking-[-0.2px] text-[var(--color-charcoal-primary)]" data-testid="brand-name">FounderSea</span>
            <span className="block text-[12px] tracking-[-0.14px] text-[var(--color-ash)]" data-testid="brand-subtitle">Idea adventure market</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-[var(--color-charcoal-primary)]" data-testid="navigation-links">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 transition-colors duration-200 hover:bg-[var(--color-stone-surface)]" data-testid={item.testId}>
              {item.label}
            </Link>
          ))}
        </div>
        <WalletConnect />
      </div>
    </nav>
    {children}
  </main>
);