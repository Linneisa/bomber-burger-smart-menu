import type { MenuItem, Recommendation } from "../types/menu.js";
import type { Selections } from "../types/preferences.js";
import { avoidTier, isLargePortion, isSpicy } from "../data/menuModel.js";

export interface Criteria {
  protein?: "beef" | "chicken";
  wantsPedas?: boolean;   // true = want spicy; false = want NOT spicy; undefined = no preference
  wantsManis: boolean;
  wantsGurih: boolean;
  wantsSmoky: boolean;
  porsi?: "ringan" | "normal" | "besar";
  situasi?: "sendiri" | "berdua" | "cepat";
  avoid: Set<string>;
  // TODO: apply budget filter once price_idr is populated in the JSON
}

// Negation, then up to two filler words ("nggak terlalu pedas", "nggak suka pedas", "tidak mau yang pedas")
const NO_SPICY = new RegExp(
  "\\b(?:nggak|ngga|gak|ga|enggak|ndak|tidak|kurang|jangan)\\s+" +
    "(?:(?:terlalu|begitu|suka|mau|bisa|doyan|kuat|tahan|pakai|pake|yang)\\s+){0,2}pedas" +
    "|\\b(?:tanpa|anti|non)[\\s-]*pedas"
);

/** True if the customer's free text says they don't want spicy food. */
export function textAvoidsSpicy(rawText: string): boolean {
  return NO_SPICY.test(rawText.toLowerCase());
}

export function buildCriteria(sel: Selections, rawText: string): Criteria {
  const t = rawText.toLowerCase();

  let protein = sel.protein[0] as "beef" | "chicken" | undefined;
  if (!protein) {
    if (/ayam|chicken/.test(t)) protein = "chicken";
    else if (/daging|beef|sapi/.test(t)) protein = "beef";
  }

  let wantsPedas: boolean | undefined;
  if (sel.rasa.includes("pedas")) wantsPedas = true;
  else if (sel.rasa.includes("tidak-pedas")) wantsPedas = false;
  else if (textAvoidsSpicy(t)) wantsPedas = false;
  else if (/pedas|spicy/.test(t)) wantsPedas = true;

  const wantsManis =
    sel.rasa.includes("manis") || /manis|sweet/.test(t);
  const wantsGurih =
    sel.rasa.includes("gurih") || /gurih|savory/.test(t);
  const wantsSmoky = /smoky|smoked|bbq|barbe?cue|barbeque|asap/.test(t);

  let porsi = sel.porsi[0] as Criteria["porsi"];
  if (!porsi) {
    if (/lapar|laper|kenyang|banyak/.test(t)) porsi = "besar";
    else if (/ringan|sedikit|diet|camilan|ngemil/.test(t)) porsi = "ringan";
  }

  let situasi = sel.situasi[0] as Criteria["situasi"];
  if (!situasi) {
    if (/berdua|pacar|teman|sharing|bagi|rame/.test(t)) situasi = "berdua";
    else if (/cepat|buru|kilat/.test(t)) situasi = "cepat";
  }

  return { protein, wantsPedas, wantsManis, wantsGurih, wantsSmoky, porsi, situasi, avoid: deriveAvoid(sel, rawText) };
}

/** Avoid chips plus free-text allergen hints ("nggak suka keju", "alergi bawang"). */
export function deriveAvoid(sel: Selections, rawText: string): Set<string> {
  const t = rawText.toLowerCase();
  const avoid = new Set<string>(sel.hindari);
  if (/\bkeju\b|cheese/.test(t) && /nggak|ngga|gak|ga|enggak|tidak|tanpa|anti|alergi/.test(t)) avoid.add("keju");
  if (/bawang/.test(t) && /nggak|ngga|gak|ga|enggak|tidak|tanpa|anti|alergi/.test(t)) avoid.add("bawang");
  return avoid;
}

/** "Tidak terlalu pedas" chip or "nggak pedas" text, unless the "pedas" chip contradicts it. */
export function excludesSpicy(sel: Selections, rawText: string): boolean {
  if (sel.rasa.includes("pedas")) return false;
  return sel.rasa.includes("tidak-pedas") || textAvoidsSpicy(rawText);
}

/**
 * Hard filters shared by the API and the local engine, split by how sure the avoid filter is.
 * tier1: ingredients complete and proven free of every avoided ingredient (all items when no avoid).
 * tier2: ingredients unknown but not proven to contain one; only to fill up when tier1 < 3.
 * Items proven to contain an avoided ingredient, and spicy items under "nggak pedas", are in neither.
 */
export function candidateTiers(
  sel: Selections,
  rawText: string,
  menuItems: MenuItem[]
): { tier1: MenuItem[]; tier2: MenuItem[] } {
  const avoid = deriveAvoid(sel, rawText);
  const noSpicy = excludesSpicy(sel, rawText);
  const allowed = menuItems.filter((m) => !(noSpicy && isSpicy(m)));
  return {
    tier1: allowed.filter((m) => avoidTier(m, avoid) === 1),
    tier2: allowed.filter((m) => avoidTier(m, avoid) === 2),
  };
}

const SAUCE = /saus|sauce|thousand island/i;

/** Data-only description: category, main ingredients (or contents), taste profile and spicy flag. */
export function dataReason(m: MenuItem): string {
  if (m.type === "side") return m.description ?? `${m.name} adalah side dish.`;
  const parts: string[] = [];
  if (m.items?.length) {
    parts.push(`${m.type === "bomber_shake" ? "Sharing tray" : "Paket"} ini berisi ${m.items.join(", ")}.`);
    if (m.spicyComponent) parts.push("Ada menu yang ditandai pedas di dalamnya.");
    return parts.join(" ");
  }
  const clean = m.ingredients.map((i) => i.replace(/\s*\(.*?\)/g, ""));
  const main = [...clean.filter((i) => !SAUCE.test(i)).slice(0, 2), ...clean.filter((i) => SAUCE.test(i)).slice(0, 1)];
  parts.push(`Burger ${m.protein === "beef" ? "beef" : "ayam"} dengan ${main.join(", ")}.`);
  if (m.taste_draft.length) parts.push(`Profil rasanya: ${m.taste_draft.join(", ")}.`);
  if (m.spicy) parts.push("Menu ini ditandai pedas.");
  return parts.join(" ");
}

function scoreItem(item: MenuItem, c: Criteria): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Protein match
  if (c.protein) {
    if (item.protein === c.protein) {
      score += 4;
      reasons.push(c.protein === "beef" ? "pakai daging sapi sesuai pilihanmu" : "pakai ayam sesuai pilihanmu");
    } else if (item.protein !== "none") {
      score -= 4;
    }
  }

  // Spicy preference
  if (c.wantsPedas === true) {
    if (isSpicy(item)) {
      score += 3;
      reasons.push("level pedasnya pas buat yang doyan pedas");
    } else {
      score -= 2;
    }
  } else if (c.wantsPedas === false) {
    if (!isSpicy(item)) {
      score += 3;
      reasons.push("nggak pedas, aman buat kamu");
    } else {
      score -= 3;
    }
  }

  // Manis
  if (c.wantsManis && item.taste_draft.some((t) => t.includes("manis"))) {
    score += 2;
    reasons.push("punya rasa manis yang kamu cari");
  }

  // Smoky / BBQ
  if (c.wantsSmoky) {
    if (item.taste_draft.some((t) => t.includes("smoky"))) {
      score += 2;
      reasons.push("ada rasa smoky BBQ yang kamu cari");
    } else if (item.items?.some((i) => /bbq/i.test(i))) {
      score += 1;
      reasons.push("berisi burger BBQ");
    }
  }

  // Gurih
  if (c.wantsGurih && item.taste_draft.some((t) => t.includes("gurih"))) {
    score += 2;
    reasons.push("profil rasanya gurih sesuai yang kamu cari");
  }

  // Porsi
  if (c.porsi === "ringan") {
    if (item.type === "side" || item.patty_count === 1) {
      score += 2;
      reasons.push(item.type === "side" ? "berupa side dish, bukan paket" : "pakai satu patty");
    } else if (item.patty_count === 2 || item.type === "set" || item.type === "bomber_shake") {
      score -= 2;
    }
  } else if (c.porsi === "normal") {
    if (item.type === "beef_burger" || item.type === "chicken_burger") {
      score += 2;
      reasons.push("porsinya pas, sesuai yang kamu pilih");
    }
  } else if (c.porsi === "besar") {
    if (isLargePortion(item)) {
      score += 4;
      reasons.push(item.patty_count === 2 ? "porsinya besar dengan double patty" : "porsinya besar");
    } else if (item.type === "set") {
      score += 3;
      reasons.push("paket lengkap, cocok buat porsi besar");
    } else if (item.type === "bomber_shake") {
      // Sharing tray: fine for two, but not the pick for a single hungry eater
      score += c.situasi === "berdua" ? 2 : -3;
    }
  }

  // Situasi
  if (c.situasi === "berdua") {
    if (item.type === "set" || item.type === "bomber_shake") {
      score += 4;
      reasons.push("cocok dinikmati berdua");
    }
  } else if (c.situasi === "sendiri") {
    if (item.type === "beef_burger" || item.type === "chicken_burger") {
      score += 2;
      reasons.push("pas untuk dinikmati sendiri");
    } else if (item.id === "set_a" || item.id === "set_b") {
      score += 1;
    }
  } else if (c.situasi === "cepat") {
    if (item.type === "beef_burger" || item.type === "chicken_burger") {
      score += 2;
      reasons.push("cukup satu burger, bukan paket");
    } else if (item.type === "set" || item.type === "bomber_shake") {
      score -= 1;
    }
  }

  return { score, reasons };
}

/** Matched preferences (if any) followed by what the menu data says about the item. */
function writeReason(reasons: string[], item: MenuItem): string {
  const kept = reasons.slice(0, 2);
  const matched = kept.length ? `Cocok karena ${kept.join(" dan ")}. ` : "";
  return matched + dataReason(item);
}

export function hasAnyPreference(selections: Selections, text: string): boolean {
  return Object.values(selections).some((v) => v.length > 0) || text.trim().length > 0;
}

export function recommend(selections: Selections, text: string, menuItems: MenuItem[]): Recommendation[] {
  const criteria = buildCriteria(selections, text);
  const rank = (items: MenuItem[], unverified: boolean): Recommendation[] => {
    const scored = items
      .map((item): Recommendation => {
        const result = scoreItem(item, criteria);
        return {
          item,
          score: result.score,
          match: Math.round(Math.max(62, Math.min(98, 70 + result.score * 2.5))),
          reason: writeReason(result.reasons, item),
          ...(unverified && { unverified: true }),
        };
      })
      .sort((a, b) => b.score - a.score);
    const mains = scored.filter((r) => r.item.type !== "side");
    const sides = scored.filter((r) => r.item.type === "side");
    return [...mains, ...sides];
  };

  const { tier1, tier2 } = candidateTiers(selections, text, menuItems);
  const verified = rank(tier1, false);
  if (verified.length >= 3) return verified.slice(0, 3);
  return [...verified, ...rank(tier2, true)].slice(0, 3);
}
