import type { MenuItem, Recommendation } from "../types/menu.js";
import type { Selections } from "../types/preferences.js";
import { passesAvoid } from "../data/menuModel.js";

interface Criteria {
  protein?: "beef" | "chicken";
  wantsPedas?: boolean;   // true = want spicy; false = want NOT spicy; undefined = no preference
  wantsManis: boolean;
  wantsGurih: boolean;
  porsi?: "ringan" | "normal" | "besar";
  situasi?: "sendiri" | "berdua" | "cepat";
  avoid: Set<string>;
  // TODO: apply budget filter once price_idr is populated in the JSON
}

const NEG = "(?:nggak|ngga|gak|ga|enggak|tidak|kurang|jangan)\\s+(?:terlalu\\s+|begitu\\s+)?";

function buildCriteria(sel: Selections, rawText: string): Criteria {
  const t = rawText.toLowerCase();

  let protein = sel.protein[0] as "beef" | "chicken" | undefined;
  if (!protein) {
    if (/ayam|chicken/.test(t)) protein = "chicken";
    else if (/daging|beef|sapi/.test(t)) protein = "beef";
  }

  let wantsPedas: boolean | undefined;
  if (sel.rasa.includes("pedas")) wantsPedas = true;
  else if (sel.rasa.includes("tidak-pedas")) wantsPedas = false;
  else if (new RegExp(`${NEG}pedas`).test(t)) wantsPedas = false;
  else if (/pedas|spicy/.test(t)) wantsPedas = true;

  const wantsManis =
    sel.rasa.includes("manis") || /manis|sweet/.test(t);
  const wantsGurih =
    sel.rasa.includes("gurih") || /gurih|savory/.test(t);

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

  return { protein, wantsPedas, wantsManis, wantsGurih, porsi, situasi, avoid: deriveAvoid(sel, rawText) };
}

/** Avoid chips plus free-text allergen hints ("nggak suka keju"). */
export function deriveAvoid(sel: Selections, rawText: string): Set<string> {
  const t = rawText.toLowerCase();
  const avoid = new Set<string>(sel.hindari);
  if (/\bkeju\b|cheese/.test(t) && /nggak|ngga|gak|ga|enggak|tidak|tanpa|anti/.test(t)) avoid.add("keju");
  if (/bawang/.test(t) && /nggak|ngga|gak|ga|enggak|tidak|tanpa|anti/.test(t)) avoid.add("bawang");
  return avoid;
}

function scoreItem(
  item: MenuItem,
  c: Criteria
): { score: number; reasons: string[] } | null {
  // Hard exclude: avoid list (items with unknown ingredient data are excluded too)
  if (!passesAvoid(item, c.avoid)) return null;

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
    if (item.spicy) {
      score += 3;
      reasons.push("level pedasnya pas buat yang doyan pedas");
    } else {
      score -= 2;
    }
  } else if (c.wantsPedas === false) {
    if (!item.spicy) {
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

  // Gurih
  if (c.wantsGurih && item.taste_draft.some((t) => t.includes("gurih"))) {
    score += 2;
    reasons.push("profil rasanya gurih sesuai yang kamu cari");
  }

  // Porsi
  if (c.porsi === "ringan") {
    if (item.type === "side" || item.patty_count === 1) {
      score += 2;
      reasons.push("porsinya ringan, nggak bikin begah");
    } else if (item.patty_count === 2 || item.type === "set" || item.type === "bomber_shake") {
      score -= 2;
    }
  } else if (c.porsi === "normal") {
    if (item.type === "beef_burger" || item.type === "chicken_burger") {
      score += 2;
      reasons.push("porsinya pas, sesuai yang kamu pilih");
    }
  } else if (c.porsi === "besar") {
    if (item.id === "double_beef") {
      score += 4;
      reasons.push("porsinya besar dengan double patty beef");
    } else if (item.type === "set") {
      score += 3;
      reasons.push("paket lengkap, cocok buat porsi besar");
    } else if (item.type === "bomber_shake") {
      score += 2;
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
      reasons.push("satu burger, lebih cepat disiapkan");
    } else if (item.type === "set" || item.type === "bomber_shake") {
      score -= 1;
    }
  }

  return { score, reasons };
}

function writeReason(reasons: string[]): string {
  const kept = reasons.slice(0, 3);
  if (!kept.length) {
    // No specific criterion matched — state only what the data confirms (no quality claims)
    return `Menu ini lolos semua filter yang kamu pilih.`;
  }
  if (kept.length === 1) return `Cocok karena ${kept[0]}.`;
  const last = kept.pop()!;
  return `Cocok karena ${kept.join(", ")}. Ditambah ${last}.`;
}

export function hasAnyPreference(selections: Selections, text: string): boolean {
  return Object.values(selections).some((v) => v.length > 0) || text.trim().length > 0;
}

export function recommend(selections: Selections, text: string, menuItems: MenuItem[]): Recommendation[] {
  const criteria = buildCriteria(selections, text);
  const scored = menuItems
    .map((item): Recommendation | null => {
      const result = scoreItem(item, criteria);
      if (!result) return null;
      return {
        item,
        score: result.score,
        match: Math.round(Math.max(62, Math.min(98, 70 + result.score * 2.5))),
        reason: writeReason(result.reasons),
      };
    })
    .filter((r): r is Recommendation => r !== null)
    .sort((a, b) => b.score - a.score);

  const mains = scored.filter((r) => r.item.type !== "side");
  const sides = scored.filter((r) => r.item.type === "side");
  return [...mains, ...sides].slice(0, 3);
}
