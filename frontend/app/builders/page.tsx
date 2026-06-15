import DashboardLayout from "../components/DashboardLayout";
import BuildersClient from "./BuildersClient";

export const dynamic = "force-dynamic";

export default function BuildersPage() {
  return (
    <DashboardLayout>
      <BuildersClient />
    </DashboardLayout>
  );
}
