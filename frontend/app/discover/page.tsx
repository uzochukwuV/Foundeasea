import DiscoverClient from "./DiscoverClient";
import DashboardLayout from "../components/DashboardLayout";

export const dynamic = "force-dynamic";

export default function DiscoveryPage() {
  return (
    <DashboardLayout>
      <DiscoverClient />
    </DashboardLayout>
  );
}