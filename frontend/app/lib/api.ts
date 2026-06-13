const backendUrl = process.env.BACKEND_INTERNAL_URL;

export const serverApi = async <T,>(path: string): Promise<T> => {
  if (!backendUrl) throw new Error("BACKEND_INTERNAL_URL is required");
  const response = await fetch(`${backendUrl}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`API failed: ${path}`);
  return response.json();
};