"use client";

import { useMemo, useState } from "react";
import { BrowserProvider, Contract, InterfaceAbi } from "ethers";
import { Brain, CheckCircle, Coins, ShieldCheck } from "../components/icons";
import { DisabledTxButton, MiniBars, PageIntro, StatCard, StatusChip, money } from "../components/uiBits";

type FactoryConfig = {
  chainId: number;
  chainHex: string;
  chainName: string;
  ideaFactory: string;
  usdy: string;
  creatorDepositUsdy: number;
  creatorDepositBaseUnits: string;
  ideaFactoryAbi: InterfaceAbi;
  usdyAbi: InterfaceAbi;
};

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
  factory: FactoryConfig;
};

const apiFetch = async <T,>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(path, { ...options, cache: "no-store" });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const CreateIdeaClient = ({ factory }: { factory: FactoryConfig }) => {
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

  const payload = useMemo(() => ({
    creator: wallet,
    title: form.title,
    oneLiner: form.oneLiner,
    description: form.description,
    category: form.category,
    targetRaise: Number(form.targetRaise),
    softCap: Number(form.softCap),
    hardCap: Number(form.hardCap),
    fundingDays: Number(form.fundingDays),
    competitionPrizeBps: Number(form.competitionPrizeBps),
    builderAllocBps: Number(form.builderAllocBps),
    gateType: 0,
    milestones: form.milestones.split("\n").map((item) => item.trim()).filter(Boolean),
  }), [form, wallet]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const connectWallet = async () => {
    if (!window.ethereum) throw new Error("No injected EVM wallet found");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
    const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
    if (chainId.toLowerCase() !== factory.chainHex) {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: factory.chainHex }] });
    }
    setWallet(accounts[0]);
    return accounts[0];
  };

  const validate = async () => {
    setIsLoading(true);
    setStatus("Running backend AI validation...");
    try {
      const result = await apiFetch<ValidationResult>("/api/ideas/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setValidation(result);
      setStatus(result.approved ? "AI approved. You can now approve USDY and create the idea onchain." : "AI rejected this draft. Update the fields and validate again.");
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
      const usdy = new Contract(validation.factory.usdy, validation.factory.usdyAbi, signer);
      const factoryContract = new Contract(validation.factory.ideaFactory, validation.factory.ideaFactoryAbi, signer);

      setStatus("Approving 500 USDY creator deposit...");
      const approveTx = await usdy.approve(validation.factory.ideaFactory, validation.factory.creatorDepositBaseUnits);
      await approveTx.wait();

      const configTuple = [
        validation.contractConfig.metadataIpfsHash,
        BigInt(validation.contractConfig.targetRaise),
        BigInt(validation.contractConfig.softCap),
        BigInt(validation.contractConfig.hardCap),
        BigInt(validation.contractConfig.fundingDeadline),
        BigInt(validation.contractConfig.competitionPrizeBps),
        BigInt(validation.contractConfig.builderAllocBps),
        validation.contractConfig.gateType,
        validation.contractConfig.gateParams,
      ];
      setStatus("Creating idea on IdeaFactory smart contract...");
      const createTx = await factoryContract.createIdea(configTuple);
      setTxHash(createTx.hash);
      const receipt = await createTx.wait();

      setStatus("Registering transaction with backend...");
      await apiFetch("/api/ideas/created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validationId: validation.validationId, txHash: createTx.hash, creator: account }),
      });
      setStatus(`Idea created onchain in block ${receipt.blockNumber}. Discover will include it after contract read refresh.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Onchain creation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageIntro eyebrow="Create idea" title="Validate with AI first. Create onchain only after approval." body="This flow now calls the backend AI validation endpoint, then uses your injected wallet to approve the USDY creator deposit and call IdeaFactory.createIdea on Mantle Sepolia." />
      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-24 md:px-8 lg:grid-cols-[1fr_380px]" data-testid="create-page-grid">
        <div className="space-y-6" data-testid="create-wizard-column">
          <div className="stone-card p-6" data-testid="pitch-step-card">
            <h2 className="text-[23px] font-semibold">Idea details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input value={form.title} onChange={(event) => update("title", event.target.value)} className="rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-idea-name-input" />
              <input value={form.category} onChange={(event) => update("category", event.target.value)} className="rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-category-input" />
            </div>
            <input value={form.oneLiner} onChange={(event) => update("oneLiner", event.target.value)} className="mt-4 w-full rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-oneliner-input" />
            <textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="mt-4 min-h-36 w-full rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-description-input" />
          </div>

          <div className="stone-card p-6" data-testid="economics-step-card">
            <h2 className="text-[23px] font-semibold">Economics and contract config</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <input value={form.softCap} onChange={(event) => update("softCap", event.target.value)} className="rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-softcap-input" />
              <input value={form.targetRaise} onChange={(event) => update("targetRaise", event.target.value)} className="rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-targetraise-input" />
              <input value={form.hardCap} onChange={(event) => update("hardCap", event.target.value)} className="rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-hardcap-input" />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <input value={form.fundingDays} onChange={(event) => update("fundingDays", event.target.value)} className="rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-funding-days-input" />
              <input value={form.competitionPrizeBps} onChange={(event) => update("competitionPrizeBps", event.target.value)} className="rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-prize-bps-input" />
              <input value={form.builderAllocBps} onChange={(event) => update("builderAllocBps", event.target.value)} className="rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-builder-bps-input" />
            </div>
            <textarea value={form.milestones} onChange={(event) => update("milestones", event.target.value)} className="mt-4 min-h-28 w-full rounded-[10px] border-0 bg-[var(--color-parchment-card)] p-3" data-testid="create-milestones-input" />
          </div>

          <div className="stone-card p-6" data-testid="create-action-card">
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={connectWallet} className="pill-light h-12 px-5 text-[15px] font-semibold" data-testid="create-connect-wallet-button">{wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect wallet"}</button>
              <button type="button" onClick={validate} disabled={isLoading} className="pill-dark h-12 px-5 text-[15px] font-semibold disabled:opacity-60" data-testid="validate-idea-button">Run AI validation</button>
              {validation?.approved ? <button type="button" onClick={createOnchain} disabled={isLoading} className="pill-dark h-12 px-5 text-[15px] font-semibold disabled:opacity-60" data-testid="create-onchain-button">Create onchain</button> : <DisabledTxButton label="Create onchain" testId="create-onchain-disabled-button" />}
            </div>
            <p className="mt-5 rounded-[10px] bg-[var(--color-parchment-card)] p-4 text-[15px]" data-testid="create-status-message">{status}</p>
            {txHash ? <p className="mt-3 text-[14px] text-[var(--color-graphite)]" data-testid="create-tx-hash">Tx: {txHash}</p> : null}
          </div>
        </div>

        <aside className="space-y-6" data-testid="create-preview-sidebar">
          <div className="stone-card p-6" data-testid="ai-validation-result-card">
            <Brain color="var(--color-sky-blue)" />
            <h2 className="mt-3 text-[23px] font-semibold">AI validation</h2>
            {validation ? <><div className="mt-4 text-[44px] font-semibold" data-testid="validation-score">{validation.score}%</div><StatusChip label={validation.approved ? "Approved" : "Needs revision"} tone={validation.approved ? "good" : "warn"} testId="validation-state-chip" /><p className="mt-4 text-[15px]">{validation.summary}</p>{validation.feedback.map((item, index) => <div key={item} className="mt-3 rounded-[10px] bg-[var(--color-parchment-card)] p-3 text-[14px]" data-testid={`validation-feedback-${index}`}><CheckCircle className="mr-2 inline text-[var(--color-meadow-green)]" />{item}</div>)}</> : <p className="mt-4 text-[15px]">Run validation to unlock the contract creation step.</p>}
          </div>
          <div className="stone-card p-6" data-testid="contract-config-card">
            <ShieldCheck color="var(--color-meadow-green)" /><h2 className="mt-3 text-[23px] font-semibold">Smart contract target</h2>
            <p className="mt-3 text-[14px] break-all" data-testid="factory-address">IdeaFactory: {factory.ideaFactory}</p>
            <p className="mt-2 text-[14px] break-all" data-testid="usdy-address">USDY: {factory.usdy}</p>
            <p className="mt-2 text-[14px]" data-testid="creator-deposit">Deposit: {factory.creatorDepositUsdy} USDY</p>
          </div>
          <div className="stone-card p-6" data-testid="discovery-preview-card"><div className="flex items-center justify-between"><StatusChip label={form.category} testId="preview-category-chip" /><StatusChip label="Live preview" testId="preview-state-chip" /></div><h2 className="mt-4 text-[23px] font-semibold">{form.title}</h2><p className="mt-3 text-[15px]">{form.oneLiner}</p><div className="mt-5 rounded-[12px] bg-[var(--color-parchment-card)] p-4"><MiniBars values={[12, 18, 32, 48, validation?.score || 61]} testId="preview-card-chart" /></div></div>
        </aside>
      </section>
    </>
  );
};