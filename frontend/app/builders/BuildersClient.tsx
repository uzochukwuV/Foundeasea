"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Users, 
  Brain, 
  Coins, 
  Medal,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  Sparkle
} from "../components/icons";

type Builder = {
  address: string;
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
  location?: string;
  memberSince?: string;
  tier?: string;
  averageAiConfidence: number;
  milestonesDelivered: number;
  revenueGenerated: number;
  activeEngagements: number;
  skills: string[];
  badges: string[];
};

type BuilderListResponse = {
  builders: Builder[];
  total: number;
};

export default function BuildersClient() {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuilders = async () => {
      try {
        const response = await fetch("/api/builders");
        if (!response.ok) {
          // Fallback to mock data if API not available
          setBuilders(getMockBuilders());
        } else {
          const data: BuilderListResponse = await response.json();
          setBuilders(data.builders || []);
        }
      } catch (err) {
        // Use mock data on error
        setBuilders(getMockBuilders());
      } finally {
        setLoading(false);
      }
    };

    fetchBuilders();
  }, []);

  const filteredBuilders = builders.filter((builder) => {
    const query = searchQuery.toLowerCase();
    return (
      builder.name.toLowerCase().includes(query) ||
      builder.role?.toLowerCase().includes(query) ||
      builder.skills?.some((s) => s.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#0052FF]" />
          <p className="text-sm text-zinc-400">Loading builders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Builder Network</span>
          </div>
          <h1 className="font-outfit text-3xl font-medium tracking-tight text-white lg:text-4xl">Find exceptional builders</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Discover verified builders with proven track records. AI-validated milestones, revenue history, and reputation badges.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0052FF]/10">
                <Users className="w-5 h-5 text-[#0052FF]" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">{builders.length}</p>
                <p className="text-xs text-zinc-500">Active Builders</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Medal className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">
                  {Math.round(builders.reduce((acc, b) => acc + b.averageAiConfidence, 0) / (builders.length || 1))}%
                </p>
                <p className="text-xs text-zinc-500">Avg AI Score</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">
                  ${(builders.reduce((acc, b) => acc + b.revenueGenerated, 0) / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-zinc-500">Total Revenue</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">
                  {builders.reduce((acc, b) => acc + b.milestonesDelivered, 0)}
                </p>
                <p className="text-xs text-zinc-500">Milestones Done</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, role, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-white/10 bg-[#0a0a0a] py-3 pl-12 pr-4 font-mono text-sm text-white placeholder:text-zinc-500 focus:border-[#0052FF]/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Builders Grid */}
        {filteredBuilders.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredBuilders.map((builder) => (
              <BuilderCard key={builder.address} builder={builder} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#0a0a0a] py-20">
            <Users className="mb-4 w-12 h-12 text-zinc-600" />
            <h3 className="font-outfit text-lg font-medium text-white">No builders found</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {searchQuery ? `No results for "${searchQuery}"` : "No builders available yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function BuilderCard({ builder }: { builder: Builder }) {
  const tierColors: Record<string, string> = {
    elite: "bg-amber-500/10 text-amber-400",
    pro: "bg-[#0052FF]/10 text-[#0052FF]",
    verified: "bg-emerald-500/10 text-emerald-400",
    newcomer: "bg-zinc-500/10 text-zinc-400",
  };

  return (
    <Link 
      href={`/builders/${encodeURIComponent(builder.address)}`}
      className="group block rounded-xl border border-white/10 bg-[#0a0a0a] p-6 transition-all hover:border-[#0052FF]/50 hover:bg-[#0f0f0f]"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          {builder.avatar ? (
            <img 
              src={builder.avatar} 
              alt={builder.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0052FF] to-purple-500 text-xl font-bold text-white">
              {builder.name.charAt(0).toUpperCase()}
            </div>
          )}
          {builder.tier && (
            <span className={`absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${tierColors[builder.tier.toLowerCase()] || tierColors.newcomer}`}>
              {builder.tier}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-outfit text-lg font-medium text-white truncate group-hover:text-[#0052FF] transition-colors">
            {builder.name}
          </h3>
          <p className="text-sm text-zinc-400 truncate">{builder.role || "Builder"}</p>
          
          {/* Location & Member Since */}
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
            {builder.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {builder.location}
              </span>
            )}
            {builder.memberSince && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {builder.memberSince}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {builder.bio && (
        <p className="mt-4 line-clamp-2 text-sm text-zinc-400">
          {builder.bio}
        </p>
      )}

      {/* Stats */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#050505] p-3 text-center">
          <Brain className="mx-auto mb-1 w-4 h-4 text-[#0052FF]" />
          <p className="font-mono text-sm font-bold text-white">{builder.averageAiConfidence}%</p>
          <p className="text-[10px] text-zinc-500">AI Score</p>
        </div>
        <div className="rounded-lg bg-[#050505] p-3 text-center">
          <Medal className="mx-auto mb-1 w-4 h-4 text-amber-400" />
          <p className="font-mono text-sm font-bold text-white">{builder.milestonesDelivered}</p>
          <p className="text-[10px] text-zinc-500">Milestones</p>
        </div>
        <div className="rounded-lg bg-[#050505] p-3 text-center">
          <Coins className="mx-auto mb-1 w-4 h-4 text-emerald-400" />
          <p className="font-mono text-sm font-bold text-white">
            ${builder.revenueGenerated >= 1000 ? `${(builder.revenueGenerated / 1000).toFixed(0)}K` : builder.revenueGenerated}
          </p>
          <p className="text-[10px] text-zinc-500">Earned</p>
        </div>
      </div>

      {/* Skills */}
      {builder.skills && builder.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {builder.skills.slice(0, 4).map((skill) => (
            <span 
              key={skill} 
              className="rounded-full bg-white/5 px-2 py-1 font-mono text-[10px] text-zinc-400"
            >
              {skill}
            </span>
          ))}
          {builder.skills.length > 4 && (
            <span className="rounded-full bg-white/5 px-2 py-1 font-mono text-[10px] text-zinc-500">
              +{builder.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Badges */}
      {builder.badges && builder.badges.length > 0 && (
        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
          <Sparkle className="w-4 h-4 text-amber-400" />
          <div className="flex flex-wrap gap-1">
            {builder.badges.slice(0, 3).map((badge) => (
              <span 
                key={badge} 
                className="rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-400"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-xs text-zinc-500">
          {builder.activeEngagements} active engagement{builder.activeEngagements !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1 text-sm font-medium text-[#0052FF] opacity-0 transition-all group-hover:opacity-100">
          View Profile <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}

// Mock data for development
function getMockBuilders(): Builder[] {
  return [
    {
      address: "0x1234...abcd",
      name: "Alex Chen",
      role: "Full-Stack Developer",
      bio: "Building at the intersection of DeFi and consumer apps. Previously at Stripe, now focused on onchain revenue primitives.",
      location: "San Francisco",
      memberSince: "Jan 2024",
      tier: "elite",
      averageAiConfidence: 94,
      milestonesDelivered: 12,
      revenueGenerated: 45000,
      activeEngagements: 2,
      skills: ["Solidity", "React", "Node.js", "TypeScript", "PostgreSQL"],
      badges: ["Top Builder", "Fast Shipper", "High Conviction"],
    },
    {
      address: "0x5678...efgh",
      name: "Sarah Kim",
      role: "Protocol Engineer",
      bio: "Security-focused smart contract developer. Audited 50+ DeFi protocols. Passionate about making DeFi accessible.",
      location: "Seoul",
      memberSince: "Mar 2024",
      tier: "pro",
      averageAiConfidence: 88,
      milestonesDelivered: 8,
      revenueGenerated: 32000,
      activeEngagements: 1,
      skills: ["Rust", "Solidity", "Security Auditing", "ZK Proofs"],
      badges: ["Security Expert", "DeFi Native"],
    },
    {
      address: "0x9abc...ijkl",
      name: "Marcus Johnson",
      role: "Frontend Architect",
      bio: "Creating delightful user experiences for Web3. Specialist in wallet integration and real-time data visualization.",
      location: "Berlin",
      memberSince: "Feb 2024",
      tier: "verified",
      averageAiConfidence: 82,
      milestonesDelivered: 6,
      revenueGenerated: 18000,
      activeEngagements: 1,
      skills: ["Next.js", "TypeScript", "Web3.js", "D3.js", "Tailwind"],
      badges: ["UI/UX Pro"],
    },
    {
      address: "0xdef0...mnop",
      name: "Priya Patel",
      role: "Backend Developer",
      bio: "Building scalable infrastructure for Web3 indexing and analytics. Expert in subgraph development and API design.",
      location: "Mumbai",
      memberSince: "Apr 2024",
      tier: "verified",
      averageAiConfidence: 79,
      milestonesDelivered: 4,
      revenueGenerated: 12000,
      activeEngagements: 2,
      skills: ["GraphQL", "PostgreSQL", "Redis", "The Graph", "Docker"],
      badges: ["Data Wizard"],
    },
    {
      address: "0x1234...qrst",
      name: "David Lee",
      role: "Mobile Developer",
      bio: "Cross-platform mobile apps that bring Web3 to mainstream users. Focus on UX simplicity and security.",
      location: "Singapore",
      memberSince: "May 2024",
      tier: "newcomer",
      averageAiConfidence: 75,
      milestonesDelivered: 2,
      revenueGenerated: 5000,
      activeEngagements: 1,
      skills: ["React Native", "Flutter", "iOS", "Android", "WalletConnect"],
      badges: ["Mobile First"],
    },
    {
      address: "0x5678...uvwx",
      name: "Emma Wilson",
      role: "Product Designer",
      bio: "Designing the future of onchain interactions. Bridging complex protocol mechanics with intuitive interfaces.",
      location: "London",
      memberSince: "Jun 2024",
      tier: "newcomer",
      averageAiConfidence: 71,
      milestonesDelivered: 1,
      revenueGenerated: 3000,
      activeEngagements: 1,
      skills: ["Figma", "Design Systems", "User Research", "Prototyping"],
      badges: ["Design Thinker"],
    },
  ];
}