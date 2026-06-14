import { CreateIdeaClient } from "./CreateIdeaClient";
import DashboardLayout from "../components/DashboardLayout";

export const dynamic = "force-dynamic";

export default async function CreateIdeaPage() {
  return (
    <DashboardLayout>
      <CreateIdeaClient />
    </DashboardLayout>
  );
}