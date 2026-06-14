import { serverApi } from "../lib/api";
import { CreateIdeaClient } from "./CreateIdeaClient";
import DashboardLayout from "../components/DashboardLayout";
import type { InterfaceAbi } from "ethers";
import { IDEA_FACTORY_ABI, ERC20_ABI } from "../lib/contracts/abis";

export const dynamic = "force-dynamic";

export default async function CreateIdeaPage() {
  // Use our pre-defined ABIs for type safety
  const factory = {
    chainId: 5003,
    chainHex: "0x138b",
    chainName: "Mantle Sepolia",
    ideaFactory: process.env.NEXT_PUBLIC_IDEA_FACTORY || "",
    usdy: process.env.NEXT_PUBLIC_USDY || "",
    creatorDepositUsdy: 500,
    creatorDepositBaseUnits: "500000000",
    ideaFactoryAbi: IDEA_FACTORY_ABI as InterfaceAbi,
    usdyAbi: ERC20_ABI as InterfaceAbi,
  };

  return (
    <DashboardLayout>
      <CreateIdeaClient factory={factory} />
    </DashboardLayout>
  );
}