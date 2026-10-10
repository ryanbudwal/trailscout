export interface Place {
  id: number;
  slug: string;
  name: string;
  area: string;
  description: string;
  duration_minutes: number;
  distance_km: number;
  difficulty: string;
  latitude: number;
  longitude: number;
  tags: string[];
  scene: string;
  source_url: string;
  recorded_at: string;
  similarity?: number;
  proximity_km?: number;
  reasons?: string[];
}
export interface Walk {
  id: string;
  place_id: number;
  name: string;
  minutes: number;
  completed_on: string;
  note: string;
}
export interface Meta {
  elapsed_ms: number;
  dimensions: number;
  metric: string;
  model: string;
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`/api${path}`, {
      ...init,
      credentials: "same-origin",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(
        typeof body.detail === "string"
          ? body.detail
          : `Request failed (${response.status}). Check your inputs and try again.`,
      );
    }
    return response.status === 204 ? (undefined as T) : await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw new Error("This is taking longer than expected. Please try again.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
