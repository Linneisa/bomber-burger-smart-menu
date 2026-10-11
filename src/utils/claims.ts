/*
 * Checks reasons for claims the menu data does not back up, and decides when to regenerate or
 * fall back to a data-only template. Pure (no API calls) so it can be unit tested.
 */
import type { MenuItem } from "../types/menu.js";
import { dataReason } from "./recommend.js";

export interface ReasonRec {
  id: string;
  reason: string;
}

// Portion, speed and intensity words that are only allowed when the item's own data contains them
const UNSUPPORTED_CLAIMS = [
  /\bcepat\b/i,
  /\bsimpel\b/i,
  /\bpraktis\b/i,
  /\bringan\b/i,
  /\bporsi kecil\b/i,
  /\btidak terlalu kuat\b/i,
  /\bkuat\b/i,
  /\bsederhana\b/i,
  /\bseimbang\b/i,
];
const INGREDIENT_WORDS = "bawang|keju|tomat|pickle|nanas";
// "tidak ada keju", "tanpa bawang", "tidak mengandung keju", "aman dari bawang", "keju-nya tidak ada"
const ABSENCE_CLAIM = new RegExp(
  `\\b(?:tidak ada|nggak ada|gak ada|tanpa|bebas|tidak mengandung|tidak menyebutkan|tidak pakai|nggak pakai|aman dari)\\s+(?:\\S+\\s+){0,2}?(${INGREDIENT_WORDS})\\b` +
    `|\\b(${INGREDIENT_WORDS})(?:-?nya)?\\s+(?:\\S+\\s+){0,2}?(?:tidak ada|nggak ada|gak ada)\\b`,
  "gi"
);

function itemDataText(m: MenuItem): string {
  return [m.name, ...m.ingredients, ...m.taste_draft, ...(m.items ?? []), m.description ?? ""].join(" ").toLowerCase();
}

/** Phrases in the reason that the item's data does not back up; empty if the reason is clean. */
export function claimViolations(reason: string, item: MenuItem): string[] {
  const data = itemDataText(item);
  const found: string[] = [];
  for (const pattern of UNSUPPORTED_CLAIMS) {
    const match = reason.match(pattern);
    // "tidak terlalu kuat" already covers its own "kuat"
    if (match && !pattern.test(data) && !found.some((f) => f.toLowerCase().includes(match[0].toLowerCase()))) {
      found.push(match[0]);
    }
  }
  for (const match of reason.matchAll(ABSENCE_CLAIM)) {
    const ingredient = (match[1] ?? match[2]).toLowerCase();
    const provable = item.avoidData.complete && !item.avoidData.contains.includes(ingredient);
    if (!provable) found.push(match[0]);
  }
  return found;
}

export interface EnforceResult<R extends ReasonRec> {
  recs: R[];
  regenerated: boolean;
  /** Number of reasons replaced by the data-only template */
  templated: number;
}

/**
 * Clean first answer: kept. Otherwise regenerate once (given the offending phrases); whatever is
 * still unsupported after that has its reason replaced by dataReason(). A failed or invalid
 * regeneration (null or throw) keeps the first answer and templates it.
 */
export async function enforceClaims<R extends ReasonRec>(
  first: R[],
  itemsById: ReadonlyMap<string, MenuItem>,
  regenerate: (violations: string[]) => Promise<R[] | null>
): Promise<EnforceResult<R>> {
  const violationsOf = (recs: R[]) => recs.flatMap((r) => claimViolations(r.reason, itemsById.get(r.id)!));
  const firstViolations = violationsOf(first);
  if (!firstViolations.length) return { recs: first, regenerated: false, templated: 0 };

  let second: R[] | null = null;
  try {
    second = await regenerate([...new Set(firstViolations)]);
  } catch {
    // keep the first answer and patch it below
  }
  let templated = 0;
  const recs = (second ?? first).map((r) => {
    const item = itemsById.get(r.id)!;
    if (!claimViolations(r.reason, item).length) return r;
    templated++;
    return { ...r, reason: dataReason(item) };
  });
  return { recs, regenerated: true, templated };
}
