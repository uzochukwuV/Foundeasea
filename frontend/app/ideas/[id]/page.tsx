import IdeaDetailClient from "./IdeaDetailClient";

export const dynamic = "force-dynamic";

export default function IdeaPage() {
  return <IdeaDetailClient params={Promise.resolve({ id: "0" })} />;
}