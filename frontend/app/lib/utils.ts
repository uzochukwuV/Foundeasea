// Formatting utilities for contract data

import { formatUnits, formatEther } from "ethers";
import type { IdeaStatus, MilestoneStatus, GateType, DecisionType } from "./contracts/types";

// ============================================
// Token Formatting
// ============================================

const USDY_DECIMALS = 6;

export function formatUSDY(amount: bigint | number | string | undefined | null, decimals: number = USDY_DECIMALS): string {
  if (amount === undefined || amount === null) return "0";
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return "0";
  return formatUnits(BigInt(num), decimals);
}

export function formatToken(amount: bigint | undefined | null, decimals: number = 18): string {
  if (amount === undefined || amount === null) return "0";
  return formatUnits(amount, decimals);
}

export function parseUSDY(amount: string | number, decimals: number = USDY_DECIMALS): bigint {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return BigInt(0);
  return formatUnits(num, decimals).includes(".")
    ? (formatUnits(num, decimals) as any)
    : BigInt(Math.floor(num * 10 ** decimals));
}

export function formatUSDYShort(amount: bigint | undefined | null): string {
  if (!amount) return "$0";
  const value = Number(formatUnits(amount, USDY_DECIMALS));
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

// ============================================
// Percentage Formatting
// ============================================

export function formatPercentage(value: bigint | number, decimals = 2): string {
  const num = typeof value === "bigint" ? Number(value) : value;
  if (isNaN(num)) return "0%";
  return `${(num / 100).toFixed(decimals)}%`;
}

export function formatBps(bps: bigint | number, decimals = 2): string {
  const num = typeof bps === "bigint" ? Number(bps) : bps;
  if (isNaN(num)) return "0%";
  return `${(num / 10000).toFixed(decimals)}%`;
}

export function formatProgress(raised: bigint, target: bigint): number {
  if (!target || target === BigInt(0)) return 0;
  const raisedNum = typeof raised === "bigint" ? Number(raised) : raised;
  const targetNum = typeof target === "bigint" ? Number(target) : target;
  return Math.round((raisedNum / targetNum) * 100);
}

// ============================================
// Address Formatting
// ============================================

export function shortenAddress(address: string | undefined | null, chars: number = 4): string {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function checksumAddress(address: string): string {
  // Basic checksum - in production use ethers utils
  return address;
}

// ============================================
// Date/Time Formatting
// ============================================

export function formatTimestamp(timestamp: bigint | number | undefined | null): string {
  if (!timestamp) return "";
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDate(date: Date | undefined | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(timestamp: bigint | number | undefined | null): string {
  if (!timestamp) return "";
  const now = Date.now();
  const then = Number(timestamp) * 1000;
  const diff = now - then;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export function formatDeadline(deadline: bigint | number | undefined | null): string {
  if (!deadline) return "No deadline";
  const now = Date.now();
  const deadlineMs = Number(deadline) * 1000;
  const diff = deadlineMs - now;
  
  if (diff <= 0) return "Expired";
  
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return "Less than 1h left";
}

// ============================================
// Status Labels
// ============================================

export function getIdeaStatusLabel(status: IdeaStatus | number): string {
  const labels: Record<number, string> = {
    0: "Pending",
    1: "Approved",
    2: "Rejected",
    3: "Abandoned",
    4: "Funding",
    5: "Active",
    6: "Completed",
    7: "Failed",
  };
  return labels[Number(status)] || "Unknown";
}

export function getIdeaStatusColor(status: IdeaStatus | number): string {
  const colors: Record<number, string> = {
    0: "text-yellow-600 bg-yellow-50",
    1: "text-green-600 bg-green-50",
    2: "text-red-600 bg-red-50",
    3: "text-gray-600 bg-gray-50",
    4: "text-blue-600 bg-blue-50",
    5: "text-green-600 bg-green-50",
    6: "text-green-600 bg-green-50",
    7: "text-red-600 bg-red-50",
  };
  return colors[Number(status)] || "text-gray-600 bg-gray-50";
}

export function getMilestoneStatusLabel(status: MilestoneStatus | number): string {
  const labels: Record<number, string> = {
    0: "Pending",
    1: "Submitted",
    2: "Validated",
    3: "Released",
    4: "Disputed",
  };
  return labels[Number(status)] || "Unknown";
}

export function getGateTypeLabel(gateType: GateType | number): string {
  const labels: Record<number, string> = {
    0: "Open",
    1: "Whitelist",
    2: "Min Hold",
    3: "DAO Curated",
  };
  return labels[Number(gateType)] || "Unknown";
}

export function getDecisionTypeLabel(type: DecisionType | number): string {
  const labels: Record<number, string> = {
    0: "Idea Approved",
    1: "Idea Rejected",
    2: "Idea Ranked",
    3: "Builder Ranked",
    4: "MVP Validated",
    5: "Milestone Validated",
    6: "DAO Vote",
    7: "Revenue Advice",
  };
  return labels[Number(type)] || "Unknown";
}

// ============================================
// Number Formatting
// ============================================

export function formatNumber(value: number | bigint | string | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null) return "0";
  const num = typeof value === "bigint" ? Number(value) : typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(decimals)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
  return num.toFixed(decimals);
}

export function formatCompact(value: number | bigint | undefined | null): string {
  if (value === undefined || value === null) return "0";
  const num = typeof value === "bigint" ? Number(value) : value;
  if (isNaN(num)) return "0";
  
  if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toFixed(0);
}

// ============================================
// Validation
// ============================================

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isZeroAddress(address: string): boolean {
  return /^0x0+$/.test(address);
}

// ============================================
// Class Name Helper
// ============================================

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
