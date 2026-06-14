export type ChainId = number;

export interface Network {
  id: string;
  name: string;
  shortName: string;
  chainId: ChainId;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  color: string;
}

export const NETWORKS: Record<string, Network> = {
  mantle_sepolia: {
    id: "mantle_sepolia",
    name: "Mantle Sepolia",
    shortName: "Mantle",
    chainId: 5003,
    rpcUrl: process.env.NEXT_PUBLIC_MANTLE_SEPOLIA_RPC || "https://rpc.sepolia.mantle.xyz",
    blockExplorer: "https://sepolia.mantlescan.xyz",
    nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
    color: "#00A9F2",
  },
  arbitrum_sepolia: {
    id: "arbitrum_sepolia",
    name: "Arbitrum Sepolia",
    shortName: "Arbitrum",
    chainId: 421614,
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    color: "#28A0F0",
  },
  qie: {
    id: "qie",
    name: "QIE Testnet",
    shortName: "QIE",
    chainId: 35443,
    rpcUrl: process.env.NEXT_PUBLIC_QIE_RPC || "https://rpc.qie.network",
    blockExplorer: "https://testnet.qiescan.io",
    nativeCurrency: { name: "QIE", symbol: "QIE", decimals: 18 },
    color: "#7B3FE4",
  },
  base_sepolia: {
    id: "base_sepolia",
    name: "Base Sepolia",
    shortName: "Base",
    chainId: 84532,
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    color: "#0052FF",
  },
};

export const SUPPORTED_CHAIN_IDS = Object.values(NETWORKS).map((n) => n.chainId);

export function getNetworkByChainId(chainId: ChainId): Network | undefined {
  return Object.values(NETWORKS).find((n) => n.chainId === chainId);
}

export function getNetworkById(id: string): Network | undefined {
  return NETWORKS[id];
}

export const DEFAULT_CHAIN = process.env.NEXT_PUBLIC_DEFAULT_CHAIN || "mantle_sepolia";

export const CHAIN_ADDRESSES = {
  mantle_sepolia: {
    ideaFactory: process.env.NEXT_PUBLIC_IDEA_FACTORY_MANTLE_SEPOLIA || "",
    agentIdentity: process.env.NEXT_PUBLIC_AGENT_IDENTITY_MANTLE_SEPOLIA || "",
    daoVoting: process.env.NEXT_PUBLIC_DAO_VOTING_MANTLE_SEPOLIA || "",
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_MANTLE_SEPOLIA || "",
    fundingPoolFactory: process.env.NEXT_PUBLIC_FUNDING_POOL_FACTORY_MANTLE_SEPOLIA || "",
    ideaTokenFactory: process.env.NEXT_PUBLIC_IDEA_TOKEN_FACTORY_MANTLE_SEPOLIA || "",
    builderAgreement: process.env.NEXT_PUBLIC_BUILDER_AGREEMENT_MANTLE_SEPOLIA || "",
    usdy: process.env.NEXT_PUBLIC_USDY_MANTLE_SEPOLIA || "",
  },
  arbitrum_sepolia: {
    ideaFactory: process.env.NEXT_PUBLIC_IDEA_FACTORY_ARBITRUM_SEPOLIA || "",
    agentIdentity: process.env.NEXT_PUBLIC_AGENT_IDENTITY_ARBITRUM_SEPOLIA || "",
    daoVoting: process.env.NEXT_PUBLIC_DAO_VOTING_ARBITRUM_SEPOLIA || "",
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_ARBITRUM_SEPOLIA || "",
    fundingPoolFactory: process.env.NEXT_PUBLIC_FUNDING_POOL_FACTORY_ARBITRUM_SEPOLIA || "",
    ideaTokenFactory: process.env.NEXT_PUBLIC_IDEA_TOKEN_FACTORY_ARBITRUM_SEPOLIA || "",
    builderAgreement: process.env.NEXT_PUBLIC_BUILDER_AGREEMENT_ARBITRUM_SEPOLIA || "",
    usdy: process.env.NEXT_PUBLIC_USDY_ARBITRUM_SEPOLIA || "",
  },
  qie: {
    ideaFactory: process.env.NEXT_PUBLIC_IDEA_FACTORY_QIE || "",
    agentIdentity: process.env.NEXT_PUBLIC_AGENT_IDENTITY_QIE || "",
    daoVoting: process.env.NEXT_PUBLIC_DAO_VOTING_QIE || "",
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_QIE || "",
    fundingPoolFactory: process.env.NEXT_PUBLIC_FUNDING_POOL_FACTORY_QIE || "",
    ideaTokenFactory: process.env.NEXT_PUBLIC_IDEA_TOKEN_FACTORY_QIE || "",
    builderAgreement: process.env.NEXT_PUBLIC_BUILDER_AGREEMENT_QIE || "",
    usdy: process.env.NEXT_PUBLIC_USDY_QIE || "",
  },
  base_sepolia: {
    ideaFactory: process.env.NEXT_PUBLIC_IDEA_FACTORY_BASE_SEPOLIA || "",
    agentIdentity: process.env.NEXT_PUBLIC_AGENT_IDENTITY_BASE_SEPOLIA || "",
    daoVoting: process.env.NEXT_PUBLIC_DAO_VOTING_BASE_SEPOLIA || "",
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_BASE_SEPOLIA || "",
    fundingPoolFactory: process.env.NEXT_PUBLIC_FUNDING_POOL_FACTORY_BASE_SEPOLIA || "",
    ideaTokenFactory: process.env.NEXT_PUBLIC_IDEA_TOKEN_FACTORY_BASE_SEPOLIA || "",
    builderAgreement: process.env.NEXT_PUBLIC_BUILDER_AGREEMENT_BASE_SEPOLIA || "",
    usdy: process.env.NEXT_PUBLIC_USDY_BASE_SEPOLIA || "",
  },
};

export type ContractAddress = keyof typeof CHAIN_ADDRESSES.mantle_sepolia;
