import DashboardLayout from "../components/DashboardLayout";
import MarketplaceClient from "./MarketplaceClient";

export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  return (
    <DashboardLayout>
      <MarketplaceClient />
    </DashboardLayout>
  );
}
