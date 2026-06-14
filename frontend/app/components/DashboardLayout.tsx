"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  GitBranch, 
  Compass, 
  Users, 
  Bot, 
  Coins, 
  ShoppingCart,
  Menu,
  X,
  Wallet
} from "./icons";
import { useState } from "react";

const navItems = [
  { href: "/discover", label: "Discover", icon: Compass, description: "Browse ideas" },
  { href: "/builders", label: "Builders", icon: Users, description: "View builders" },
  { href: "/agent", label: "AI Monitor", icon: Bot, description: "AI decisions" },
  { href: "/tokens", label: "Tokens", icon: Coins, description: "Your positions" },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingCart, description: "Trade tokens" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/5 bg-black/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border border-white/10 bg-white text-black">
            <GitBranch size={16} />
          </span>
          <span className="font-outfit text-lg font-semibold">FounderSea</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-zinc-400 hover:text-white"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-40 h-full w-72 border-r border-white/5 bg-[#0a0a0a] 
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
            <span className="grid h-10 w-10 place-items-center border border-white/10 bg-white text-black">
              <GitBranch size={18} />
            </span>
            <span className="font-outfit text-[18px] font-semibold tracking-tight">FounderSea</span>
          </div>

          {/* Network Status */}
          <div className="mx-4 mt-4 flex items-center gap-2 border border-white/10 bg-[#050505] px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-zinc-500">Mantle Sepolia</span>
          </div>

          {/* Navigation */}
          <nav className="mt-6 flex-1 px-4">
            <div className="mb-2 px-3 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
              Navigation
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                      ${isActive 
                        ? 'bg-[#0052FF]/10 text-[#0052FF]' 
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#0052FF]' : ''}`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className={`text-xs ${isActive ? 'text-[#0052FF]/70' : 'text-zinc-600'}`}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Wallet Connect */}
          <div className="border-t border-white/5 p-4">
            <Link
              href="/portfolio"
              className="flex items-center gap-3 rounded-lg bg-[#0052FF] px-4 py-3 font-medium text-sm text-white transition-all hover:bg-[#3377FF]"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72">
        {children}
      </main>
    </div>
  );
}
