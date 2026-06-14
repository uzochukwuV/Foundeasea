"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { BrowserProvider, JsonRpcSigner, Contract, formatUnits, parseUnits } from "ethers";
import { NETWORKS, CHAIN_ADDRESSES, DEFAULT_CHAIN } from "./networks";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isConnected: boolean;
  isConnecting: boolean;
  selectedNetwork: string;
  error: string | null;
}

export interface WalletContextType extends WalletState {
  connect: (networkId?: string) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (networkId: string) => Promise<void>;
  getContract: (name: keyof typeof CHAIN_ADDRESSES.mantle_sepolia) => Contract | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    provider: null,
    signer: null,
    isConnected: false,
    isConnecting: false,
    selectedNetwork: DEFAULT_CHAIN,
    error: null,
  });

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
          if (accounts.length > 0) {
            const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            setState((prev) => ({
              ...prev,
              address: accounts[0],
              chainId: parseInt(chainId, 16),
              provider,
              signer,
              isConnected: true,
            }));
          }
        } catch (err) {
          console.error("Error checking connection:", err);
        }
      }
    };
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: unknown) => {
        const accs = accounts as string[];
        if (accs.length === 0) {
          setState((prev) => ({
            ...prev,
            address: null,
            isConnected: false,
            provider: null,
            signer: null,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            address: accs[0],
          }));
        }
      };

      const handleChainChanged = (chainId: unknown) => {
        const cId = parseInt(chainId as string, 16);
        setState((prev) => ({
          ...prev,
          chainId: cId,
        }));
        // Reload on chain change
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  const connect = useCallback(async (networkId?: string) => {
    if (!window.ethereum) {
      setState((prev) => ({ ...prev, error: "MetaMask not installed" }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const networkToUse = networkId || state.selectedNetwork;
      const network = NETWORKS[networkToUse];
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" }) as string;
      let currentChainId = parseInt(chainIdHex, 16);

      // Switch network if needed
      if (currentChainId !== network.chainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${network.chainId.toString(16)}` }],
          });
          currentChainId = network.chainId;
        } catch (switchError: unknown) {
          const err = switchError as { code?: number };
          // Chain not added, add it
          if (err.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${network.chainId.toString(16)}`,
                  chainName: network.name,
                  nativeCurrency: network.nativeCurrency,
                  rpcUrls: [network.rpcUrl],
                  blockExplorerUrls: [network.blockExplorer],
                },
              ],
            });
            currentChainId = network.chainId;
          } else {
            throw switchError;
          }
        }
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setState((prev) => ({
        ...prev,
        address: accounts[0],
        chainId: currentChainId,
        provider,
        signer,
        isConnected: true,
        isConnecting: false,
        selectedNetwork: networkToUse,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err instanceof Error ? err.message : "Failed to connect",
      }));
    }
  }, [state.selectedNetwork]);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      provider: null,
      signer: null,
      isConnected: false,
      isConnecting: false,
      selectedNetwork: DEFAULT_CHAIN,
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async (networkId: string) => {
    const network = NETWORKS[networkId];
    if (!network) return;

    setState((prev) => ({ ...prev, selectedNetwork: networkId }));

    if (window.ethereum && state.isConnected) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${network.chainId.toString(16)}` }],
        });
      } catch (err) {
        console.error("Error switching network:", err);
      }
    }
  }, [state.isConnected]);

  const getContract = useCallback((contractName: keyof typeof CHAIN_ADDRESSES.mantle_sepolia): Contract | null => {
    if (!state.signer || !state.provider) return null;
    
    const addresses = CHAIN_ADDRESSES[state.selectedNetwork as keyof typeof CHAIN_ADDRESSES];
    const address = addresses[contractName];
    
    if (!address) return null;
    
    // Import ABI dynamically to avoid circular dependencies
    // For now, return a basic contract instance
    // In production, you'd import the specific ABI
    return new Contract(address, [
      "function createIdea(string memory _title, string memory _description, string memory _ipfsHash, uint256 _targetRaise, uint256 _softCap, uint256 _hardCap, uint256 _deadline, uint256 _builderAllocBps) external returns (uint256)",
      "function getIdea(uint256 _ideaId) external view returns (tuple(address creator, string title, uint256 aiScore, uint256 status, uint256 funded, uint256 hardCap, address ideaToken))",
      "function ideaFactory() external view returns (address)",
    ], state.signer);
  }, [state.signer, state.provider, state.selectedNetwork]);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, switchNetwork, getContract }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
