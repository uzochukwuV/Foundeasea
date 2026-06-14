import { AppShell } from "../components/AppShell";
import { serverApi } from "../lib/api";
import { CreateIdeaClient } from "./CreateIdeaClient";

export const dynamic = "force-dynamic";

export default async function CreateIdeaPage() {
  const factory = await serverApi<{
    chainId: number;
    chainHex: string;
    chainName: string;
    ideaFactory: string;
    usdy: string;
    creatorDepositUsdy: number;
    creatorDepositBaseUnits: string;
    ideaFactoryAbi: unknown[];
    usdyAbi: unknown[];
  }>("/api/contracts/idea-factory");

  return (
    <AppShell>
      <CreateIdeaClient factory={factory} />
    </AppShell>
  );
}