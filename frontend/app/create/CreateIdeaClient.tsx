"use client";

import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { 
  Brain, 
  CheckCircle, 
  Coins, 
  ShieldCheck, 
  Sparkle,
  Lightning,
  FileText,
  Target,
  ArrowRight,
  Loader2,
  AlertCircle,
  Wallet
} from "../components/icons";
import { IDEA_FACTORY_ABI, MOCK_USDY_ABI } from "../lib/contracts/abis";

// Contract addresses
const IDEA_FACTORY_ADDRESS = "0x653993523D605EDE6AdBf021075cE11f0D7f1AE7";
const USDY_ADDRESS = "0x719238D4B4bD9c6F84a915e045A38362e32667B5";
const CHAIN_HEX = "0x138b"; // Mantle Sepolia
const CHAIN_ID = 5003;
const USDY_DECIMALS = 6;
const CREATOR_DEPOSIT_USDY = 500;

type ValidationResult = {
  validationId: string;
  approved: boolean;
  score: number;
  summary: string;
  feedback: string[];
  contractConfig: {
    metadataIpfsHash: string;
    targetRaise: string;
    softCap: string;
    hardCap: string;
    fundingDeadline: number;
    competitionPrizeBps: number;
    builderAllocBps: number;
    gateType: number;
    gateParams: string;
  };
};

export const CreateIdeaClient = () => {
  const [form, setForm] = useState({
    title: "Revenue Copilot for SaaS",
    oneLiner: "AI tracks usage, expansion signals, and revenue hooks so investors see outcomes faster.",
    description: "A revenue intelligence product for B2B SaaS companies. It connects Stripe, usage analytics, and customer lifecycle events to detect paid expansion opportunities, churn warnings, and revenue proof. Investors can see revenue flowing into the protocol dashboard while builders ship milestone-based features.",
    category: "SaaS",
    targetRaise: "850000",
    softCap: "250000",
    hardCap: "1000000",
    fundingDays: "30",
    competitionPrizeBps: "800",
    builderAllocBps: "2000",
    milestones: "Connect Stripe revenue hook\nShip investor revenue dashboard\nLaunch expansion alert engine",
  });
  const [wallet, setWallet] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [status, setStatus] = useState("Ready: AI validation must approve before onchain creation.");
  const [txHash, setTxHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const connectWallet = async () => {
    if (!window.ethereum) throw new Error("No injected EVM wallet found");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
    const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
    if (chainId.toLowerCase() !== CHAIN_HEX) {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
    }
    setWallet(accounts[0]);
    return accounts[0];
  };

  const validate = async () => {
    setIsLoading(true);
    setStatus("Running AI validation via backend...");
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        targetRaise: Number(form.targetRaise),
        softCap: Number(form.softCap),
        hardCap: Number(form.hardCap),
        fundingDays: Number(form.fundingDays),
      };
      
      const response = await fetch("/api/ideas/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error(await response.text());
      
      const result: ValidationResult = await response.json();
      setValidation(result);
      setStatus(result.approved 
        ? "AI approved! You can now create the idea onchain." 
        : "AI requires revision. Update the fields and validate again.");
      setCurrentStep(2);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Validation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const createOnchain = async () => {
    if (!validation?.approved) return;
    setIsLoading(true);
    try {
      setStatus("Connecting wallet...");
      const account = wallet || await connectWallet();
      if (!window.ethereum) throw new Error("No injected EVM wallet found");
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Check USDY balance
      const usdy = new Contract(USDY_ADDRESS, MOCK_USDY_ABI, signer);
      const balance = await usdy.balanceOf(account) as bigint;
      const requiredDeposit = BigInt(CREATOR_DEPOSIT_USDY) * BigInt(10) ** BigInt(USDY_DECIMALS);
      
      if (balance < requiredDeposit) {
        throw new Error(`Insufficient USDY balance. Need ${CREATOR_DEPOSIT_USDY} USDY, have ${Number(balance) / Number(10 ** USDY_DECIMALS)} USDY`);
      }
      
      setStatus("Approving 500 USDY deposit...");
      const approveTx = await usdy.approve(IDEA_FACTORY_ADDRESS, requiredDeposit);
      await approveTx.wait();
      
      // Create idea on factory
      const factory = new Contract(IDEA_FACTORY_ADDRESS, IDEA_FACTORY_ABI, signer);
      
      setStatus("Creating idea on IdeaFactory smart contract...");
      const configTuple = [
        validation.contractConfig.metadataIpfsHash,
        BigInt(validation.contractConfig.targetRaise) * BigInt(10 ** USDY_DECIMALS),
        BigInt(validation.contractConfig.softCap) * BigInt(10 ** USDY_DECIMALS),
        BigInt(validation.contractConfig.hardCap) * BigInt(10 ** USDY_DECIMALS),
        BigInt(validation.contractConfig.fundingDeadline),
        BigInt(validation.contractConfig.competitionPrizeBps),
        BigInt(validation.contractConfig.builderAllocBps),
        validation.contractConfig.gateType,
        validation.contractConfig.gateParams,
      ];
      
      const createTx = await factory.createIdea(configTuple);
      setTxHash(createTx.hash);
      const receipt = await createTx.wait();
      
      // Extract ideaId from event logs
      let ideaId = BigInt(0);
      for (const log of receipt.logs) {
        if (log.topics && log.topics.length > 0) {
          const topic0 = log.topics[0].toLowerCase();
          // Check for IdeaCreated event signature
          const eventSignature = '0x' + 'IdeaCreated'.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
          if (topic0 === eventSignature) {
            ideaId = BigInt(log.topics[1]);
            break;
          }
        }
      }
      
      setStatus(`Idea created onchain in block ${receipt.blockNumber}. Idea ID: ${ideaId}. AI will review and approve/reject.`);
      setCurrentStep(3);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Onchain creation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!wallet && window.ethereum) {
      await connectWallet();
    }
    await validate();
  };

  const handleCreate = async () => {
    if (!validation?.approved) return;
    await createOnchain();
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Create Idea</span>
          </div>
          <h1 className="font-outfit text-3xl font-medium tracking-tight text-white lg:text-4xl">Launch your venture onchain</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">Submit your idea for AI validation. Once approved, create it on-chain with a funding pool and token.</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center gap-2">
          {[
            { num: 1, label: "Details", icon: FileText },
            { num: 2, label: "AI Review", icon: Brain },
            { num: 3, label: "Deploy", icon: Lightning },
          ].map((step, idx) => (
            <div key={step.num} className="flex items-center">
              <div className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
                currentStep >= step.num 
                  ? "bg-[#0052FF]/10 text-[#0052FF]" 
                  : "bg-[#0a0a0a] text-zinc-500"
              }`}>
                <step.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              {idx < 2 && <ArrowRight className="mx-2 w-4 h-4 text-zinc-600" />}
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Idea Details Card */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0052FF]/10">
                  <FileText className="w-5 h-5 text-[#0052FF]" />
                </div>
                <div>
                  <h2 className="font-outfit text-xl font-medium text-white">Idea Details</h2>
                  <p className="text-sm text-zinc-500">Describe your venture concept</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Title</label>
                    <input 
                      value={form.title} 
                      onChange={(event) => update("title", event.target.value)} 
                      className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-[#0052FF]/50 focus:outline-none"
                      placeholder="Your idea name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Category</label>
                    <input 
                      value={form.category} 
                      onChange={(event) => update("category", event.target.value)} 
                      className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-[#0052FF]/50 focus:outline-none"
                      placeholder="SaaS, DeFi, Gaming..."
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">One Liner</label>
                  <input 
                    value={form.oneLiner} 
                    onChange={(event) => update("oneLiner", event.target.value)} 
                    className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-[#0052FF]/50 focus:outline-none"
                    placeholder="Brief summary of your idea"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Description</label>
                  <textarea 
                    value={form.description} 
                    onChange={(event) => update("description", event.target.value)} 
                    className="min-h-32 w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-[#0052FF]/50 focus:outline-none resize-none"
                    placeholder="Detailed description of your venture..."
                  />
                </div>
              </div>
            </div>

            {/* Economics Card */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-outfit text-xl font-medium text-white">Economics</h2>
                  <p className="text-sm text-zinc-500">Configure funding parameters</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Soft Cap (USDY)</label>
                    <input 
                      value={form.softCap} 
                      onChange={(event) => update("softCap", event.target.value)} 
                      className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-sm text-white focus:border-[#0052FF]/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Target Raise (USDY)</label>
                    <input 
                      value={form.targetRaise} 
                      onChange={(event) => update("targetRaise", event.target.value)} 
                      className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-sm text-white focus:border-[#0052FF]/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Hard Cap (USDY)</label>
                    <input 
                      value={form.hardCap} 
                      onChange={(event) => update("hardCap", event.target.value)} 
                      className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-sm text-white focus:border-[#0052FF]/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Funding Days</label>
                    <input 
                      value={form.fundingDays} 
                      onChange={(event) => update("fundingDays", event.target.value)} 
                      className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-sm text-white focus:border-[#0052FF]/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Competition Prize (bps)</label>
                    <input 
                      value={form.competitionPrizeBps} 
                      onChange={(event) => update("competitionPrizeBps", event.target.value)} 
                      className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-sm text-white focus:border-[#0052FF]/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Builder Alloc (bps)</label>
                    <input 
                      value={form.builderAllocBps} 
                      onChange={(event) => update("builderAllocBps", event.target.value)} 
                      className="w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-sm text-white focus:border-[#0052FF]/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Milestones (one per line)</label>
                  <textarea 
                    value={form.milestones} 
                    onChange={(event) => update("milestones", event.target.value)} 
                    className="min-h-28 w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-[#0052FF]/50 focus:outline-none resize-none"
                    placeholder="Milestone 1&#10;Milestone 2&#10;Milestone 3"
                  />
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  type="button" 
                  onClick={connectWallet} 
                  className="flex items-center gap-2 rounded-lg border border-white/20 bg-[#050505] px-5 py-3 text-sm font-medium text-white transition-all hover:border-white/40"
                >
                  <Wallet className="w-4 h-4" />
                  {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect wallet"}
                </button>
                
                <button 
                  type="button" 
                  onClick={validate} 
                  disabled={isLoading} 
                  className="flex items-center gap-2 rounded-lg bg-[#0052FF] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3377FF] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Run AI Validation
                    </>
                  )}
                </button>
                
                {validation?.approved && (
                  <button 
                    type="button" 
                    onClick={createOnchain} 
                    disabled={isLoading} 
                    className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Lightning className="w-4 h-4" />
                        Create on Chain
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {/* Status Message */}
              <div className={`mt-5 rounded-lg p-4 ${
                status.includes("approved") || status.includes("created") 
                  ? "bg-emerald-500/10 border border-emerald-500/30" 
                  : status.includes("rejected")
                  ? "bg-red-500/10 border border-red-500/30"
                  : "bg-[#050505] border border-white/10"
              }`}>
                <p className={`font-mono text-sm ${
                  status.includes("approved") || status.includes("created") 
                    ? "text-emerald-400" 
                    : status.includes("rejected")
                    ? "text-red-400"
                    : "text-zinc-400"
                }`}>{status}</p>
              </div>
              
              {txHash && (
                <div className="mt-4 rounded-lg bg-[#050505] border border-white/10 p-4">
                  <p className="font-mono text-xs text-zinc-500">Transaction Hash</p>
                  <a 
                    href={`https://sepolia.mantlescan.xyz/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 block font-mono text-sm text-[#0052FF] hover:underline break-all"
                  >
                    {txHash}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* AI Validation Result */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0052FF]/10">
                  <Brain className="w-5 h-5 text-[#0052FF]" />
                </div>
                <div>
                  <h2 className="font-outfit text-lg font-medium text-white">AI Validation</h2>
                  <p className="text-sm text-zinc-500">Analysis result</p>
                </div>
              </div>
              
              {validation ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-5xl font-mono font-bold ${
                      validation.approved ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {validation.score}%
                    </div>
                    <div className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                      validation.approved 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {validation.approved ? (
                        <>
                          <CheckCircle className="w-4 h-4" /> Approved
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" /> Needs Revision
                        </>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-zinc-400">{validation.summary}</p>
                  
                  <div className="space-y-2">
                    {validation.feedback.map((item, index) => (
                      <div key={index} className="flex items-start gap-2 rounded-lg bg-[#050505] p-3">
                        <CheckCircle className="mt-0.5 w-4 h-4 shrink-0 text-emerald-400" />
                        <span className="text-sm text-zinc-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0052FF]/10">
                    <Sparkle className="w-8 h-8 text-[#0052FF]" />
                  </div>
                  <p className="text-sm text-zinc-400">Run validation to get AI feedback on your idea</p>
                </div>
              )}
            </div>

            {/* Contract Info */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-outfit text-lg font-medium text-white">Smart Contract</h2>
                  <p className="text-sm text-zinc-500">Deployment target</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="rounded-lg bg-[#050505] p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">IdeaFactory</p>
                  <p className="mt-1 break-all font-mono text-xs text-[#0052FF]">
                    {IDEA_FACTORY_ADDRESS}
                  </p>
                </div>
                <div className="rounded-lg bg-[#050505] p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">USDY Token</p>
                  <p className="mt-1 break-all font-mono text-xs text-[#0052FF]">
                    {USDY_ADDRESS}
                  </p>
                </div>
                <div className="rounded-lg bg-[#050505] p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Creator Deposit</p>
                  <p className="mt-1 font-mono text-sm text-white">{CREATOR_DEPOSIT_USDY} USDY</p>
                </div>
                <div className="rounded-lg bg-[#050505] p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Network</p>
                  <p className="mt-1 font-mono text-sm text-white">Mantle Sepolia</p>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-outfit text-lg font-medium text-white">Preview</h2>
                <span className="rounded-full bg-[#0052FF]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#0052FF]">
                  {form.category}
                </span>
              </div>
              <h3 className="font-outfit text-xl font-medium text-white">{form.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{form.oneLiner}</p>
              
              {/* Mini Progress Bar */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-zinc-500">
                  <span>AI Confidence</span>
                  <span>{validation?.score || 0}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-[#0052FF] to-emerald-400 transition-all duration-500"
                    style={{ width: `${validation?.score || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};