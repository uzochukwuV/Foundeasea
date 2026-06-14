"use client";

import { useEffect, useState } from "react";
import { Alert, CheckCircle, Wallet } from "./icons";

// Window.ethereum type is declared in wallet.tsx

const MANTLE_SEPOLIA_HEX = "0x138b";
const MANTLE_SEPOLIA_DECIMAL = 5003;

const shorten = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

export const WalletConnect = () => {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [status, setStatus] = useState("Ready for Mantle Sepolia");
  const [isOpen, setIsOpen] = useState(false);

  const isSupportedChain = chainId.toLowerCase() === MANTLE_SEPOLIA_HEX;

  const loadExisting = async () => {
    if (!window.ethereum) return;
    const [accounts, currentChain] = await Promise.all([
      window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>,
      window.ethereum.request({ method: "eth_chainId" }) as Promise<string>,
    ]);
    setAddress(accounts?.[0] || "");
    setChainId(currentChain || "");
  };

  useEffect(() => {
    loadExisting().catch(() => undefined);
    const onAccounts = (accounts: unknown) => setAddress(Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : "");
    const onChain = (nextChainId: unknown) => setChainId(typeof nextChainId === "string" ? nextChainId : "");
    window.ethereum?.on?.("accountsChanged", onAccounts);
    window.ethereum?.on?.("chainChanged", onChain);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAccounts);
      window.ethereum?.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const switchToMantle = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: MANTLE_SEPOLIA_HEX }] });
      setChainId(MANTLE_SEPOLIA_HEX);
      setStatus("Connected to Mantle Sepolia");
    } catch (error: unknown) {
      const maybe = error as { code?: number };
      if (maybe.code === 4902) {
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
        setChainId(MANTLE_SEPOLIA_HEX);
      } else {
        setStatus("Switch to Mantle Sepolia to continue");
      }
    }
  };

  const connect = async () => {
    if (!window.ethereum) {
      setStatus("No browser wallet found. Install MetaMask or another injected EVM wallet.");
      setIsOpen(true);
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      const nextChain = await window.ethereum.request({ method: "eth_chainId" }) as string;
      setAddress(accounts?.[0] || "");
      setChainId(nextChain || "");
      setIsOpen(true);
      if ((nextChain || "").toLowerCase() !== MANTLE_SEPOLIA_HEX) {
        setStatus("Connected wallet. Switch to Mantle Sepolia to read protocol state.");
        await switchToMantle();
      } else {
        setStatus("Connected to Mantle Sepolia");
      }
    } catch {
      setStatus("Wallet connection was rejected");
      setIsOpen(true);
    }
  };

  const disconnect = () => {
    setAddress("");
    setChainId("");
    setStatus("Disconnected locally. Reconnect whenever you are ready.");
  };

  return (
    <div className="relative" data-testid="wallet-connect-root">
      <button
        type="button"
        onClick={address ? () => setIsOpen((value) => !value) : connect}
        className="pill-dark flex h-10 items-center gap-2 px-4 text-[14px] font-semibold transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-charcoal-primary)]"
        data-testid="connect-wallet-button"
      >
        <Wallet size={18} />
        {address ? shorten(address) : "Connect Wallet"}
      </button>

      {isOpen && (
        <div className="stone-card absolute right-0 top-12 z-50 w-[320px] p-5 text-left" data-testid="wallet-popover">
          <div className="flex items-start gap-3">
            {address && isSupportedChain ? <CheckCircle className="mt-0.5 text-[var(--color-meadow-green)]" /> : <Alert className="mt-0.5 text-[var(--color-ember-orange)]" />}
            <div>
              <div className="text-[15px] font-semibold text-[var(--color-charcoal-primary)]" data-testid="wallet-status-title">
                {address ? "Wallet connected" : "Wallet not connected"}
              </div>
              <p className="mt-1 text-[13px] leading-[1.45] text-[var(--color-graphite)]" data-testid="wallet-status-message">{status}</p>
            </div>
          </div>
          <div className="mt-4 rounded-[10px] bg-[var(--color-parchment-card)] p-3 text-[13px]" data-testid="wallet-details">
            <div data-testid="wallet-address-row">Address: {address ? shorten(address) : "—"}</div>
            <div className="mt-1" data-testid="wallet-chain-row">Chain: {chainId ? `${parseInt(chainId, 16)}${isSupportedChain ? " Mantle Sepolia" : " unsupported"}` : "—"}</div>
            <div className="mt-1" data-testid="wallet-required-chain-row">Required: {MANTLE_SEPOLIA_DECIMAL} Mantle Sepolia</div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {address && !isSupportedChain && (
              <button type="button" onClick={switchToMantle} className="pill-dark h-10 px-4 text-[13px] font-semibold" data-testid="switch-mantle-button">Switch chain</button>
            )}
            {address ? (
              <button type="button" onClick={disconnect} className="pill-light h-10 px-4 text-[13px] font-medium" data-testid="disconnect-wallet-button">Disconnect</button>
            ) : (
              <button type="button" onClick={connect} className="pill-dark h-10 px-4 text-[13px] font-semibold" data-testid="wallet-popover-connect-button">Connect</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};