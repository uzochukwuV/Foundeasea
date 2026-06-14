"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { BrowserProvider, Contract, JsonRpcSigner, JsonRpcProvider, formatUnits, parseUnits } from "ethers";
import type { ContractAddresses } from "./types";

// ============================================
// Types
// ============================================

interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isCorrectChain: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
}

interface ContractContextValue {
  // Wallet state
  wallet: WalletState;
  
  // Connection functions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToMantleSepolia: () => Promise<void>;
  
  // Contract addresses (from env)
  addresses: ContractAddresses;
  
  // Helper functions
  getReadContract: <T extends Contract>(address: string, abi: readonly string[]) => T | null;
  getWriteContract: <T extends Contract>(address: string, abi: readonly string[]) => T | null;
  
  // Token helpers
  getUSDYBalance: (address: string) => Promise<bigint>;
  approveToken: (spender: string, amount: bigint) => Promise<void>;
  
  // Utility
  formatToken: (amount: bigint, decimals?: number) => string;
  parseToken: (amount: string, decimals?: number) => bigint;
  shortenAddress: (address: string) => string;
  isAddress: (address: string) => boolean;
}

// ============================================
// Constants
// ============================================

const MANTLE_SEPOLIA_HEX = "0x138b";
const MANTLE_SEPOLIA_DECIMAL = 5003;
const MANTLE_SEPOLIA_RPC = "https://rpc.sepolia.mantle.xyz";

// Default addresses (can be overridden via env)
const DEFAULT_ADDRESSES: ContractAddresses = {
  ideaFactory: process.env.NEXT_PUBLIC_IDEA_FACTORY || "",
  fundingPoolFactory: process.env.NEXT_PUBLIC_FUNDING_POOL_FACTORY || "",
  ideaTokenFactory: process.env.NEXT_PUBLIC_IDEA_TOKEN_FACTORY || "",
  fundingGate: process.env.NEXT_PUBLIC_FUNDING_GATE || "",
  builderAgreement: process.env.NEXT_PUBLIC_BUILDER_AGREEMENT || "",
  daoVoting: process.env.NEXT_PUBLIC_DAO_VOTING || "",
  ideaMarketplace: process.env.NEXT_PUBLIC_MARKETPLACE || "",
  agentIdentity: process.env.NEXT_PUBLIC_AGENT_IDENTITY || "",
  usdy: process.env.NEXT_PUBLIC_USDY || "",
};

// ============================================
// Context
// ============================================

const ContractContext = createContext<ContractContextValue | null>(null);

// ============================================
// Provider
// ============================================

export function ContractProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isCorrectChain: false,
    provider: null,
    signer: null,
  });

  const [addresses] = useState<ContractAddresses>(DEFAULT_ADDRESSES);

  // Load existing wallet state on mount
  useEffect(() => {
    const loadExisting = async () => {
      if (!window.ethereum) return;
      
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
        const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
        
        if (accounts.length > 0) {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          
          setWallet({
            address: accounts[0],
            chainId,
            isConnected: true,
            isCorrectChain: chainId.toLowerCase() === MANTLE_SEPOLIA_HEX,
            provider,
            signer,
          });
        }
      } catch (error) {
        console.error("Error loading wallet:", error);
      }
    };

    loadExisting();

    // Listen for account/chain changes
    if (window.ethereum) {
      const onAccountsChanged = (accounts: unknown) => {
        const accs = accounts as string[];
        if (accs.length === 0) {
          disconnect();
        } else {
          setWallet(prev => ({ ...prev, address: accs[0] }));
        }
      };

      const onChainChanged = (chainId: unknown) => {
        const cId = chainId as string;
        setWallet(prev => ({
          ...prev,
          chainId: cId,
          isCorrectChain: cId.toLowerCase() === MANTLE_SEPOLIA_HEX,
        }));
      };

      const ethereum = window.ethereum;
      if (ethereum) {
        (ethereum as any).on("accountsChanged", onAccountsChanged);
        (ethereum as any).on("chainChanged", onChainChanged);
      }

      return () => {
        ethereum?.removeListener?.("accountsChanged", onAccountsChanged);
        ethereum?.removeListener?.("chainChanged", onChainChanged);
      };
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another EVM wallet");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setWallet({
        address: accounts[0],
        chainId,
        isConnected: true,
        isCorrectChain: chainId.toLowerCase() === MANTLE_SEPOLIA_HEX,
        provider,
        signer,
      });

      // Auto-switch to Mantle Sepolia if needed
      if (chainId.toLowerCase() !== MANTLE_SEPOLIA_HEX) {
        await switchToMantleSepolia();
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      chainId: null,
      isConnected: false,
      isCorrectChain: false,
      provider: null,
      signer: null,
    });
  }, []);

  // Switch to Mantle Sepolia
  const switchToMantleSepolia = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MANTLE_SEPOLIA_HEX }],
      });
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: MANTLE_SEPOLIA_HEX,
            chainName: "Mantle Sepolia",
            nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
            blockExplorerUrls: ["https://sepolia.mantlescan.xyz"],
          }],
        });
      }
    }
  }, []);

  // Get read-only contract
  const getReadContract = useCallback(<T extends Contract>(
    address: string,
    abi: readonly string[]
  ): T | null => {
    if (!address || !wallet.provider) return null;
    try {
      return new Contract(address, abi, wallet.provider) as T;
    } catch {
      return null;
    }
  }, [wallet.provider]);

  // Get write contract
  const getWriteContract = useCallback(<T extends Contract>(
    address: string,
    abi: readonly string[]
  ): T | null => {
    if (!address || !wallet.signer) return null;
    try {
      return new Contract(address, abi, wallet.signer) as T;
    } catch {
      return null;
    }
  }, [wallet.signer]);

  // Get USDY balance
  const getUSDYBalance = useCallback(async (address: string): Promise<bigint> => {
    if (!addresses.usdy || !wallet.provider) return BigInt(0);
    try {
      const contract = new Contract(addresses.usdy, [
        "function balanceOf(address) view returns (uint256)"
      ], wallet.provider);
      return await contract.balanceOf(address);
    } catch {
      return BigInt(0);
    }
  }, [addresses.usdy, wallet.provider]);

  // Approve token spending
  const approveToken = useCallback(async (spender: string, amount: bigint): Promise<void> => {
    if (!addresses.usdy || !wallet.signer) {
      throw new Error("Wallet not connected or USDY not configured");
    }
    const contract = new Contract(addresses.usdy, [
      "function approve(address spender, uint256 amount) returns (bool)"
    ], wallet.signer);
    await contract.approve(spender, amount);
  }, [addresses.usdy, wallet.signer]);

  // Format token amount
  const formatToken = useCallback((amount: bigint, decimals: number = 6): string => {
    return formatUnits(amount, decimals);
  }, []);

  // Parse token amount
  const parseToken = useCallback((amount: string, decimals: number = 6): bigint => {
    return parseUnits(amount, decimals);
  }, []);

  // Shorten address
  const shortenAddress = useCallback((address: string): string => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Check if valid address
  const isAddress = useCallback((address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }, []);

  const value = useMemo(() => ({
    wallet,
    connect,
    disconnect,
    switchToMantleSepolia,
    addresses,
    getReadContract,
    getWriteContract,
    getUSDYBalance,
    approveToken,
    formatToken,
    parseToken,
    shortenAddress,
    isAddress,
  }), [
    wallet,
    connect,
    disconnect,
    switchToMantleSepolia,
    addresses,
    getReadContract,
    getWriteContract,
    getUSDYBalance,
    approveToken,
    formatToken,
    parseToken,
    shortenAddress,
    isAddress,
  ]);

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useContract() {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useContract must be used within ContractProvider");
  }
  return context;
}

// ============================================
// Hook for requiring wallet connection
// ============================================

export function useRequireWallet() {
  const { wallet, connect, switchToMantleSepolia } = useContract();

  const requireConnected = useCallback(async (): Promise<boolean> => {
    if (!wallet.isConnected) {
      await connect();
      return false;
    }
    if (!wallet.isCorrectChain) {
      await switchToMantleSepolia();
      return false;
    }
    return true;
  }, [wallet.isConnected, wallet.isCorrectChain, connect, switchToMantleSepolia]);

  return {
    ...wallet,
    requireConnected,
  };
}
