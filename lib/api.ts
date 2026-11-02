const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export interface FetchResultRequest {
  yearKey: string;
  rollNo: string;
}

export async function fetchResult(req: FetchResultRequest): Promise<any> {
  const res = await fetch(`${API_BASE}/api/result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function bulkStreamUrl(yearKey: string, startRoll: string, limit: number): string {
  const params = new URLSearchParams({ yearKey, startRoll, limit: String(limit) });
  return `${API_BASE}/api/bulk?${params.toString()}`;
}