import { menuItems } from "../data/menu";
import type { Recommendation } from "../types/menu";
import type { Selections } from "../types/preferences";
import { recommend } from "./recommend";

export interface SearchResult {
  results: Recommendation[];
  /** Short notice when the results are not from the AI (server or client fallback) */
  notice: string | null;
}

const CLIENT_TIMEOUT_MS = 15_000;
const FALLBACK_NOTICE = "AI sedang tidak tersedia, jadi ini rekomendasi otomatis berdasarkan pilihanmu.";

function local(selections: Selections, text: string): SearchResult {
  return { results: recommend(selections, text, menuItems), notice: FALLBACK_NOTICE };
}

/** Ask /api/recommend; any failure resolves to the local simulated recommendation. */
export async function fetchRecommendations(selections: Selections, text: string): Promise<SearchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chips: selections, text }),
      signal: controller.signal,
    });
    if (!res.ok) return local(selections, text);

    const data = (await res.json()) as { recommendations?: { id: string; reason: string }[]; fallback?: boolean };
    if (!Array.isArray(data.recommendations)) return local(selections, text);

    const results = data.recommendations.flatMap((r): Recommendation[] => {
      const item = menuItems.find((m) => m.id === r.id);
      return item ? [{ item, reason: r.reason, score: 0, match: 0 }] : [];
    });
    if (results.length !== data.recommendations.length) return local(selections, text);
    return { results, notice: data.fallback ? FALLBACK_NOTICE : null };
  } catch {
    return local(selections, text);
  } finally {
    clearTimeout(timer);
  }
}
