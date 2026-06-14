"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, TrendUp, Brain, Users, Coins, ArrowRight, Activity, Lightning, Trophy } from "../components/icons";
import { useDiscoveryIdeas, type DiscoveryIdea } from "../lib/hooks";
import { IdeaStatus } from "../lib/contracts/types";
import { formatUSDYShort, formatProgress } from "../lib/utils";

const STATUS_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  [IdeaStatus.PENDING]: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending" },
  [IdeaStatus.APPROVED]: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Approved" },
  [IdeaStatus.REJECTED]: { bg: "bg-red-500/10", text: "text-red-400", label: "Rejected" },
  [IdeaStatus.FUNDING]: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Funding" },
  [IdeaStatus.ACTIVE]: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Active" },
  [IdeaStatus.COMPLETED]: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Completed" },
  [IdeaStatus.ABANDONED]: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Abandoned" },
  [IdeaStatus.FAILED]: { bg: "bg-red-500/10", text: "text-red-400", label: "Failed" },
};

const FILTERS = ["All", "Funding", "Active", "Approved", "Completed"];

function IdeaCard({ idea, rank }: { idea: DiscoveryIdea; rank?: number }) {
  const status = STATUS_COLORS[idea.status] || STATUS_COLORS[0];
  const progress = idea.hardCap && idea.hardCap > BigInt(0) ? formatProgress(idea.funded, idea.hardCap) : 0;

  return (
    <Link href={"/ideas/" + idea.id} className="group block border border-white/10 bg-[#0a0a0a] p-6 transition-all hover:border-[#0052FF]/50 hover:bg-[#0f0f0f]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-2">
            {rank && <span className="font-mono text-xs text-zinc-500">#{rank}</span>}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${status.bg} ${status.text}`}>{status.label}</span>
          </div>
          <h3 className="font-outfit text-xl font-medium text-white group-hover:text-[#0052FF]">{idea.title}</h3>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-[#0052FF]/10 px-4 py-2">
          <Brain className="mb-1 w-4 h-4 text-[#0052FF]" />
          <span className="font-mono text-lg font-bold text-white">{Number(idea.aiScore) || 0}%</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">AI Score</span>
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-zinc-400">{idea.oneLiner || "No description available"}</p>
      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">Token</div>
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-[#0052FF]" />
            <span className="font-mono text-sm text-white">{idea.ideaToken ? idea.ideaToken.slice(0, 4) + "..." + idea.ideaToken.slice(-4) : "—"}</span>
          </div>
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">Raised</div>
          <div className="font-mono text-sm text-white">{formatUSDYShort(idea.funded)}</div>
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">Progress</div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gradient-to-r from-[#0052FF] to-emerald-400" style={{ width: Math.min(progress, 100) + "%" }} />
            </div>
            <span className="font-mono text-xs text-zinc-400">{progress}%</span>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{idea.investorCount || 0} investors</span>
          <span className="flex items-center gap-1"><TrendUp className="w-3.5 h-3.5" />{idea.trending24hRaise ? "$" + (Number(idea.trending24hRaise) / 1000).toFixed(1) + "K/24h" : "—"}</span>
        </div>
        <span className="flex items-center gap-1 text-sm font-medium text-[#0052FF] opacity-0 transition-all group-hover:opacity-100">View <ArrowRight className="w-4 h-4" /></span>
      </div>
    </Link>
  );
}

function LeaderboardCard({ idea, rank }: { idea: DiscoveryIdea; rank: number }) {
  const progress = idea.hardCap && idea.hardCap > BigInt(0) ? formatProgress(idea.funded, idea.hardCap) : 0;
  const rankColors = rank === 1 ? "text-amber-400" : rank === 2 ? "text-zinc-300" : rank === 3 ? "text-amber-700" : "text-zinc-500";

  return (
    <Link href={"/ideas/" + idea.id} className="group flex-shrink-0 rounded-lg border border-white/10 bg-[#0a0a0a] p-5 transition-all hover:border-[#0052FF]/50 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-lg font-bold ${rankColors}`}>#{rank}</span>
          <Trophy className={`w-4 h-4 ${rank === 1 ? "text-amber-400" : "text-zinc-600"}`} />
        </div>
        <span className="font-mono text-sm font-semibold text-emerald-400">{Number(idea.aiScore) || 0}%</span>
      </div>
      <h4 className="mt-3 font-outfit text-base font-medium text-white">{idea.title}</h4>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-gradient-to-r from-[#0052FF] to-emerald-400" style={{ width: Math.min(progress, 100) + "%" }} />
        </div>
        <span className="font-mono text-xs text-zinc-500">{progress}%</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <span>{formatUSDYShort(idea.funded)} raised</span>
        <span>${(Number(idea.trending24hRaise || 0) / 1000).toFixed(1)}K/24h</span>
      </div>
    </Link>
  );
}

export default function DiscoverClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const { data: ideas, loading } = useDiscoveryIdeas();

  const filteredIdeas = (ideas || []).filter((idea: DiscoveryIdea) => {
    const matchesSearch = !searchQuery || idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || idea.oneLiner?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === "All") return matchesSearch;
    if (activeFilter === "Funding") return matchesSearch && idea.status === IdeaStatus.FUNDING;
    if (activeFilter === "Active") return matchesSearch && idea.status === IdeaStatus.ACTIVE;
    if (activeFilter === "Approved") return matchesSearch && idea.status === IdeaStatus.APPROVED;
    if (activeFilter === "Completed") return matchesSearch && idea.status === IdeaStatus.COMPLETED;
    return matchesSearch;
  });

  const leaderboard = [...(ideas || [])].sort((a, b) => Number(b.aiScore) - Number(a.aiScore)).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#0052FF]">Discovery Feed</div>
          <h1 className="font-outfit text-3xl font-medium tracking-tight text-white lg:text-4xl">Find the ideas people are moving toward.</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">Browse AI-scored ideas, track funding velocity, and discover promising ventures ready for investment.</p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-6 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-zinc-400">Live on Mantle Sepolia</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-zinc-500">Ideas: <span className="text-white font-mono">{ideas?.length || 0}</span></span>
          </div>
        </div>

        {leaderboard.length > 0 && (
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="font-outfit text-lg font-medium text-white">Top Conviction Leaderboard</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {leaderboard.map((idea, index) => <LeaderboardCard key={idea.id} idea={idea} rank={index + 1} />)}
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input type="text" placeholder="Search ideas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border border-white/10 bg-[#0a0a0a] py-3 pl-12 pr-4 font-mono text-sm text-white placeholder:text-zinc-500 focus:border-[#0052FF]/50 focus:outline-none" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {FILTERS.map((filter) => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeFilter === filter ? "bg-[#0052FF] text-white" : "border border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0052FF] border-t-transparent" />
          </div>
        ) : filteredIdeas.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredIdeas.map((idea, index) => <IdeaCard key={idea.id} idea={idea} rank={index + 1} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-[#0a0a0a] py-20">
            <Activity className="mb-4 w-12 h-12 text-zinc-600" />
            <h3 className="font-outfit text-lg font-medium text-white">No ideas found</h3>
            <p className="mt-2 text-sm text-zinc-400">{searchQuery ? 'No results for "' + searchQuery + '"' : "Be the first to submit an idea"}</p>
            <Link href="/create" className="mt-6 inline-flex items-center gap-2 bg-[#0052FF] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3377FF]">
              <Lightning className="w-4 h-4" /> Create an Idea
            </Link>
          </div>
        )}

        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-outfit text-lg font-medium text-white">Ready to launch your idea?</h3>
              <p className="mt-1 text-sm text-zinc-400">Join the protocol and start building your venture onchain.</p>
            </div>
            <Link href="/create" className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-white/40">
              Submit Your Idea
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
