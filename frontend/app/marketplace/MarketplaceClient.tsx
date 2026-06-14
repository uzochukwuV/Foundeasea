"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Search, 
  Coins,
  TrendingUp,
  TrendingDown,
  Loader2,
  Plus,
  X,
  Shield,
  Clock,
  BarChart3
} from "lucide-react";

type IdeaToken = {
  id: string;
  address: string;
  name: string;
  symbol: string;
  ideaId: string;
  ideaTitle: string;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  floorPrice: number;
  marketCap: number;
  supply: number;
  holders: number;
  creator: string;
};

type Listing = {
  id: number;
  seller: string;
  ideaToken: string;
  ideaTitle: string;
  amount: number;
  askPricePerToken: number;
  totalValue: number;
  expiry: number;
  active: boolean;
};

type Bid = {
  id: number;
  bidder: string;
  ideaToken: string;
  ideaTitle: string;
  amount: number;
  bidPricePerToken: number;
  totalValue: number;
  expiry: number;
  active: boolean;
};

type MarketplaceData = {
  tokens: IdeaToken[];
  listings: Listing[];
  bids: Bid[];
  stats: {
    totalVolume: number;
    activeListings: number;
    activeBids: number;
    avgPrice: number;
  };
};

function formatUSD(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}K`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number): string {
  return `$${(value / 1e6).toFixed(4)}`;
}

export default function MarketplaceClient() {
  const [activeTab, setActiveTab] = useState<"discover" | "listings" | "bids" | "my-trades">("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlaceBidModal, setShowPlaceBidModal] = useState(false);
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);
  const [data, setData] = useState<MarketplaceData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/marketplace");
        if (!response.ok) throw new Error("API not available");
        const marketplaceData = await response.json();
        setData(marketplaceData);
      } catch {
        setData(getMockMarketplaceData());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTokens = data?.tokens.filter((token) =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.ideaTitle.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredListings = data?.listings.filter((listing) =>
    listing.active &&
    (selectedToken ? listing.ideaToken === selectedToken : true) &&
    (searchQuery === "" || listing.ideaTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const filteredBids = data?.bids.filter((bid) =>
    bid.active &&
    (selectedToken ? bid.ideaToken === selectedToken : true) &&
    (searchQuery === "" || bid.ideaTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#0052FF]" />
          <p className="text-sm text-zinc-400">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">P2P Trading</span>
          </div>
          <h1 className="font-outfit text-3xl font-medium tracking-tight text-white lg:text-4xl">Idea Token Marketplace</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Buy and sell IdeaTokens directly. Place bids, fulfill listings, and trade with other investors.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="24h Volume" value={formatUSD(data?.stats.totalVolume || 0)} color="#0052FF" />
          <StatCard icon={<ShoppingCart className="w-5 h-5" />} label="Active Listings" value={String(data?.stats.activeListings || 0)} color="emerald" />
          <StatCard icon={<Coins className="w-5 h-5" />} label="Active Bids" value={String(data?.stats.activeBids || 0)} color="amber" />
          <StatCard icon={<Shield className="w-5 h-5" />} label="Avg Floor" value={formatPrice(data?.stats.avgPrice || 0)} color="purple" />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {[
              { id: "discover", label: "Discover" },
              { id: "listings", label: "Listings" },
              { id: "bids", label: "Bids" },
              { id: "my-trades", label: "My Trades" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#0052FF] text-white"
                    : "border border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlaceBidModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#0052FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#3377FF]"
            >
              <Plus className="w-4 h-4" /> Place Bid
            </button>
            <button
              onClick={() => setShowCreateListingModal(true)}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/40"
            >
              <Plus className="w-4 h-4" /> Create Listing
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search tokens, listings, or bids..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-white/10 bg-[#0a0a0a] py-3 pl-12 pr-4 font-mono text-sm text-white placeholder:text-zinc-500 focus:border-[#0052FF]/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Content */}
        {activeTab === "discover" && (
          <section>
            <h2 className="mb-4 font-outfit text-lg font-medium text-white">Trending Tokens</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTokens.slice(0, 8).map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
          </section>
        )}

        {activeTab === "listings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-outfit text-lg font-medium text-white">Active Listings</h2>
              <span className="font-mono text-sm text-zinc-500">{filteredListings.length} listings</span>
            </div>
            {filteredListings.length > 0 ? (
              <div className="space-y-3">
                {filteredListings.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <EmptyState message="No active listings" />
            )}
          </div>
        )}

        {activeTab === "bids" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-outfit text-lg font-medium text-white">Active Bids</h2>
              <span className="font-mono text-sm text-zinc-500">{filteredBids.length} bids</span>
            </div>
            {filteredBids.length > 0 ? (
              <div className="space-y-3">
                {filteredBids.map((bid) => (
                  <BidRow key={bid.id} bid={bid} />
                ))}
              </div>
            ) : (
              <EmptyState message="No active bids" />
            )}
          </div>
        )}

        {activeTab === "my-trades" && (
          <div className="space-y-6">
            <h2 className="font-outfit text-lg font-medium text-white">My Trading History</h2>
            <EmptyState message="Connect wallet to view your trades" />
          </div>
        )}

        {/* Modals */}
        {showPlaceBidModal && (
          <PlaceBidModal 
            tokens={data?.tokens || []} 
            onClose={() => setShowPlaceBidModal(false)} 
          />
        )}

        {showCreateListingModal && (
          <CreateListingModal 
            tokens={data?.tokens || []} 
            onClose={() => setShowCreateListingModal(false)} 
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    "#0052FF": "bg-[#0052FF]/10 text-[#0052FF]",
    "emerald": "bg-emerald-500/10 text-emerald-400",
    "amber": "bg-amber-500/10 text-amber-400",
    "purple": "bg-purple-500/10 text-purple-400",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <p className="font-mono text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TokenCard({ token }: { token: IdeaToken }) {
  const priceChangeColor = token.priceChange24h >= 0 ? "text-emerald-400" : "text-red-400";
  const PriceChangeIcon = token.priceChange24h >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 transition-all hover:border-[#0052FF]/50">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0052FF] to-purple-500">
            <span className="text-sm font-bold text-white">{token.symbol.slice(0, 2)}</span>
          </div>
          <div>
            <h3 className="font-medium text-white">{token.symbol}</h3>
            <p className="text-xs text-zinc-500 truncate max-w-[120px]">{token.ideaTitle}</p>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xl font-bold text-white">{formatPrice(token.floorPrice)}</span>
          <span className={`flex items-center gap-1 font-mono text-sm ${priceChangeColor}`}>
            <PriceChangeIcon className="w-3 h-3" />
            {Math.abs(token.priceChange24h).toFixed(2)}%
          </span>
        </div>
        <p className="text-xs text-zinc-500">Floor Price</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-[#050505] p-2">
          <p className="text-zinc-500">24h Vol</p>
          <p className="font-mono font-medium text-white">{formatUSD(token.volume24h)}</p>
        </div>
        <div className="rounded bg-[#050505] p-2">
          <p className="text-zinc-500">Holders</p>
          <p className="font-mono font-medium text-white">{token.holders}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="rounded-lg bg-[#0052FF] py-2 text-xs font-medium text-white hover:bg-[#3377FF]">Buy</button>
        <button className="rounded-lg border border-white/20 py-2 text-xs font-medium text-white hover:border-white/40">Bid</button>
      </div>
    </div>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0052FF] to-purple-500">
          <Coins className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-white">{listing.ideaTitle}</h3>
          <p className="text-sm text-zinc-500">
            {listing.amount} tokens @ {formatPrice(listing.askPricePerToken)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-lg font-bold text-white">{formatUSD(listing.totalValue)}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            Expires {new Date(listing.expiry * 1000).toLocaleDateString()}
          </span>
          <button className="rounded-lg bg-[#0052FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#3377FF]">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

function BidRow({ bid }: { bid: Bid }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
          <Coins className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-white">{bid.ideaTitle}</h3>
          <p className="text-sm text-zinc-500">
            {bid.amount} tokens @ {formatPrice(bid.bidPricePerToken)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-lg font-bold text-white">{formatUSD(bid.totalValue)}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            Expires {new Date(bid.expiry * 1000).toLocaleDateString()}
          </span>
          <button className="rounded-lg border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20">
            Sell
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#0a0a0a] py-16">
      <ShoppingCart className="mb-4 w-12 h-12 text-zinc-600" />
      <h3 className="font-outfit text-lg font-medium text-white">{message}</h3>
      <p className="mt-2 text-sm text-zinc-400">Try adjusting your search or filters</p>
    </div>
  );
}

function PlaceBidModal({ tokens, onClose }: { tokens: IdeaToken[]; onClose: () => void }) {
  const [selectedToken, setSelectedToken] = useState("");
  const [amount, setAmount] = useState("");
  const [pricePerToken, setPricePerToken] = useState("");
  const [expiry, setExpiry] = useState("7");

  const totalValue = (parseFloat(amount) || 0) * (parseFloat(pricePerToken) || 0);
  const protocolFee = totalValue * 0.025;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-outfit text-xl font-medium text-white">Place a Bid</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-mono text-xs text-zinc-500 uppercase">Token</label>
            <select 
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 text-white"
            >
              <option value="">Select a token</option>
              {tokens.map((token) => (
                <option key={token.id} value={token.address}>
                  {token.symbol} - {token.ideaTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block font-mono text-xs text-zinc-500 uppercase">Amount (Tokens)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-white"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-xs text-zinc-500 uppercase">Bid Price (USDY)</label>
              <input
                type="number"
                value={pricePerToken}
                onChange={(e) => setPricePerToken(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-mono text-xs text-zinc-500 uppercase">Bid Expiry (Days)</label>
            <select 
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 text-white"
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>

          <div className="rounded-lg bg-[#050505] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Total Bid Value</span>
              <span className="font-mono text-white">{formatUSD(totalValue * 1e6)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-zinc-500">Protocol Fee (2.5%)</span>
              <span className="font-mono text-white">{formatUSD(protocolFee * 1e6)}</span>
            </div>
          </div>

          <button className="w-full rounded-lg bg-[#0052FF] py-3 font-medium text-white hover:bg-[#3377FF]">
            Place Bid
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateListingModal({ tokens, onClose }: { tokens: IdeaToken[]; onClose: () => void }) {
  const [selectedToken, setSelectedToken] = useState("");
  const [amount, setAmount] = useState("");
  const [pricePerToken, setPricePerToken] = useState("");
  const [expiry, setExpiry] = useState("7");

  const totalValue = (parseFloat(amount) || 0) * (parseFloat(pricePerToken) || 0);
  const protocolFee = totalValue * 0.025;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-outfit text-xl font-medium text-white">Create a Listing</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-mono text-xs text-zinc-500 uppercase">Token</label>
            <select 
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 text-white"
            >
              <option value="">Select a token</option>
              {tokens.map((token) => (
                <option key={token.id} value={token.address}>
                  {token.symbol} - {token.ideaTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block font-mono text-xs text-zinc-500 uppercase">Amount (Tokens)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-white"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-xs text-zinc-500 uppercase">Ask Price (USDY)</label>
              <input
                type="number"
                value={pricePerToken}
                onChange={(e) => setPricePerToken(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-mono text-xs text-zinc-500 uppercase">Listing Expiry (Days)</label>
            <select 
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 text-white"
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>

          <div className="rounded-lg bg-[#050505] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Total Listing Value</span>
              <span className="font-mono text-white">{formatUSD(totalValue * 1e6)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-zinc-500">Protocol Fee (2.5%)</span>
              <span className="font-mono text-white">{formatUSD(protocolFee * 1e6)}</span>
            </div>
          </div>

          <button className="w-full rounded-lg bg-[#0052FF] py-3 font-medium text-white hover:bg-[#3377FF]">
            Create Listing
          </button>
        </div>
      </div>
    </div>
  );
}

function getMockMarketplaceData(): MarketplaceData {
  const tokens: IdeaToken[] = [
    { id: "1", address: "0x1234", name: "FounderSea Idea 1", symbol: "FSID-1", ideaId: "1", ideaTitle: "Revenue Copilot for SaaS", currentPrice: 1.25 * 1e6, priceChange24h: 5.2, volume24h: 50000 * 1e6, floorPrice: 1.10 * 1e6, marketCap: 250000 * 1e6, supply: 1000000, holders: 42, creator: "0xabc" },
    { id: "2", address: "0x5678", name: "FounderSea Idea 2", symbol: "FSID-2", ideaId: "2", ideaTitle: "AI Writing Assistant", currentPrice: 0.85 * 1e6, priceChange24h: -2.1, volume24h: 35000 * 1e6, floorPrice: 0.80 * 1e6, marketCap: 180000 * 1e6, supply: 800000, holders: 28, creator: "0xdef" },
    { id: "3", address: "0x9abc", name: "FounderSea Idea 3", symbol: "FSID-3", ideaId: "3", ideaTitle: "DeFi Analytics Dashboard", currentPrice: 2.10 * 1e6, priceChange24h: 8.5, volume24h: 75000 * 1e6, floorPrice: 1.95 * 1e6, marketCap: 420000 * 1e6, supply: 1200000, holders: 67, creator: "0xghi" },
    { id: "4", address: "0xdef0", name: "FounderSea Idea 4", symbol: "FSID-4", ideaId: "4", ideaTitle: "NFT Marketplace Builder", currentPrice: 0.65 * 1e6, priceChange24h: 12.3, volume24h: 28000 * 1e6, floorPrice: 0.55 * 1e6, marketCap: 95000 * 1e6, supply: 600000, holders: 19, creator: "0xjkl" },
  ];

  const now = Math.floor(Date.now() / 1000);
  const day = 86400;

  const listings: Listing[] = [
    { id: 1, seller: "0xabc", ideaToken: tokens[0].address, ideaTitle: tokens[0].ideaTitle, amount: 100, askPricePerToken: 1.15 * 1e6, totalValue: 115 * 1e6, expiry: now + 3 * day, active: true },
    { id: 2, seller: "0xdef", ideaToken: tokens[1].address, ideaTitle: tokens[1].ideaTitle, amount: 250, askPricePerToken: 0.90 * 1e6, totalValue: 225 * 1e6, expiry: now + 5 * day, active: true },
    { id: 3, seller: "0xghi", ideaToken: tokens[2].address, ideaTitle: tokens[2].ideaTitle, amount: 50, askPricePerToken: 2.00 * 1e6, totalValue: 100 * 1e6, expiry: now + 7 * day, active: true },
  ];

  const bids: Bid[] = [
    { id: 1, bidder: "0x111", ideaToken: tokens[0].address, ideaTitle: tokens[0].ideaTitle, amount: 75, bidPricePerToken: 1.05 * 1e6, totalValue: 78.75 * 1e6, expiry: now + 2 * day, active: true },
    { id: 2, bidder: "0x222", ideaToken: tokens[1].address, ideaTitle: tokens[1].ideaTitle, amount: 150, bidPricePerToken: 0.75 * 1e6, totalValue: 112.5 * 1e6, expiry: now + 4 * day, active: true },
    { id: 3, bidder: "0x333", ideaToken: tokens[2].address, ideaTitle: tokens[2].ideaTitle, amount: 30, bidPricePerToken: 1.90 * 1e6, totalValue: 57 * 1e6, expiry: now + 6 * day, active: true },
  ];

  return {
    tokens,
    listings,
    bids,
    stats: { totalVolume: 485000 * 1e6, activeListings: listings.length, activeBids: bids.length, avgPrice: 1.25 * 1e6 },
  };
}