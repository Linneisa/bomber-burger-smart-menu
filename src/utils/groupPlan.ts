/*
 * "Makan bersama" (3+ people): code, not the AI, builds 1–3 menu combinations whose total `serves`
 * covers the party with as little left over as possible, and works out the estimated total and
 * per-person price. Reasons come from a data-only template. Pure, so scripts/test-claims.ts tests it.
 * Relative imports use ".js" so the file also runs under tsx/Node ESM.
 */
import { PARTY_CHIP_SIZE, PARTY_MAX, ROMBONGAN_MIN, chipGroups } from "../data/preferenceChips.js";
import { confirmedTaste, isSpicy } from "../data/menuModel.js";
import type { MenuItem } from "../types/menu.js";
import type { Selections } from "../types/preferences.js";
import { absenceNote, buildCriteria, candidateTiers, cashierNote, itemScore, type Criteria } from "./recommend.js";

export type PlanKind = "nampan" | "set" | "satuan";

export const PLAN_KIND_LABEL: Record<PlanKind, string> = {
  nampan: "Nampan sharing",
  set: "Kombinasi set",
  satuan: "Burger satuan",
};

export interface PlanLine {
  item: MenuItem;
  qty: number;
  /** Ingredients not fully known for the active avoid list (Tier 2): ask the cashier */
  unverified: boolean;
}

export interface GroupPlan {
  id: PlanKind;
  kind: PlanKind;
  lines: PlanLine[];
  /** Sum of serves × qty; always >= party */
  serves: number;
  leftover: number;
  /** Exact sum of unit price × qty over priced lines */
  total: number;
  /** Lines without a price (not in the total) */
  unpriced: number;
  /** total / party rounded to the nearest Rp1.000 (shown with "±") */
  perPerson: number;
  unverified: boolean;
  reason: string;
}

export interface GroupResult {
  party: number;
  /** The customer asked for more than PARTY_MAX people; plans are for PARTY_MAX */
  overLimit: boolean;
  plans: GroupPlan[];
  /** Every plan has at least one unverified line */
  allUnverified: boolean;
  /** No plan: filters (chip labels) whose removal on its own would leave a plan */
  suggestions: string[];
}

/* ── Party size ──────────────────────────────────────────────────────── */

const BER_WORDS: Record<string, number> = {
  berdua: 2, bertiga: 3, berempat: 4, berlima: 5, berenam: 6, bertujuh: 7, berdelapan: 8, bersembilan: 9, bersepuluh: 10,
};
const NUMBER_WORDS: Record<string, number> = {
  dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10, sebelas: 11,
};
const PEOPLE_DIGITS = /\b(\d{1,3})\s*orang\b/;
const PEOPLE_WORDS = new RegExp(`\\b(${Object.keys(NUMBER_WORDS).join("|")})\\s+orang\\b`);
const PEOPLE_BER = new RegExp(`\\b(${Object.keys(BER_WORDS).join("|")})\\b`);

/**
 * Number of people: the "Jumlah orang" chip wins (Rombongan 5+ uses the stepper, 5–10); otherwise
 * the free text ("kami bertiga", "6 orang", "lima orang"); otherwise 1. Capped at PARTY_MAX.
 */
export function partySize(sel: Selections, rombongan: number, rawText: string): { size: number; overLimit: boolean } {
  const chip = sel.orang[0];
  if (chip === "rombongan") return { size: Math.min(PARTY_MAX, Math.max(ROMBONGAN_MIN, Math.round(rombongan))), overLimit: false };
  if (chip && PARTY_CHIP_SIZE[chip]) return { size: PARTY_CHIP_SIZE[chip], overLimit: false };

  const t = rawText.toLowerCase();
  const digits = t.match(PEOPLE_DIGITS)?.[1];
  const word = t.match(PEOPLE_WORDS)?.[1];
  const ber = t.match(PEOPLE_BER)?.[1];
  const n = digits ? Number(digits) : word ? NUMBER_WORDS[word] : ber ? BER_WORDS[ber] : 1;
  if (n < 1) return { size: 1, overLimit: false };
  return { size: Math.min(n, PARTY_MAX), overLimit: n > PARTY_MAX };
}

/* ── Combination search ──────────────────────────────────────────────── */

interface Unit {
  item: MenuItem;
  unverified: boolean;
  /** Soft preference score (protein, taste…) plus a small best-seller bonus */
  score: number;
}

interface Combo {
  counts: number[];
  serves: number;
  lines: number;
}

const MAX_LINES = 6;
const DEFAULT_CAP = 2;
/** Burgers considered per search: the best-scoring ones, so the search stays small */
const MAX_BURGERS = 8;

function kindOf(units: readonly Unit[], counts: readonly number[]): PlanKind {
  const used = units.filter((_, i) => counts[i] > 0);
  if (used.some((u) => u.item.type === "bomber_shake")) return "nampan";
  if (used.some((u) => u.item.type === "set")) return "set";
  return "satuan";
}

/** Every multiset (qty ≤ cap, ≤ MAX_LINES lines) whose serves reach the party; stops adding once reached. */
function enumerate(units: readonly Unit[], party: number, cap: number): Combo[] {
  const found: Combo[] = [];
  const counts = new Array<number>(units.length).fill(0);
  const walk = (i: number, serves: number, lines: number) => {
    if (serves >= party) {
      found.push({ counts: [...counts], serves, lines });
      return;
    }
    if (i === units.length) return;
    walk(i + 1, serves, lines);
    if (lines === MAX_LINES) return;
    for (let q = 1; q <= cap; q++) {
      counts[i] = q;
      const s = serves + q * units[i].item.serves;
      walk(i + 1, s, lines + 1);
      if (s >= party) break; // more of the same only adds leftover
    }
    counts[i] = 0;
  };
  walk(0, 0, 0);
  return found;
}

interface Scored {
  combo: Combo;
  kind: PlanKind;
  leftover: number;
  /** Serves covered by unverified lines */
  unverifiedServes: number;
  quality: number;
  /** Share of serves from the plan's defining type (trays for nampan, sets for set) */
  share: number;
  /** Serves from items whose contents are disputed (Set D, source_conflict): tie-break only */
  disputedServes: number;
  total: number;
  signature: string;
}

function scoreCombo(units: readonly Unit[], combo: Combo, party: number): Scored {
  let weighted = 0;
  let unverifiedServes = 0;
  let burgerLines = 0;
  let disputedServes = 0;
  const servesByType: Record<string, number> = {};
  let total = 0;
  const parts: string[] = [];
  combo.counts.forEach((q, i) => {
    if (!q) return;
    const u = units[i];
    weighted += q * u.item.serves * u.score;
    if (u.unverified) unverifiedServes += q * u.item.serves;
    if (u.item.type.endsWith("_burger")) burgerLines++;
    if (isDisputed(u.item)) disputedServes += q * u.item.serves;
    servesByType[u.item.type] = (servesByType[u.item.type] ?? 0) + q * u.item.serves;
    total += q * (u.item.price_idr ?? 0);
    parts.push(`${q}x${u.item.id}`);
  });
  const kind = kindOf(units, combo.counts);
  const defining = kind === "nampan" ? "bomber_shake" : kind === "set" ? "set" : null;
  return {
    combo,
    kind,
    leftover: combo.serves - party,
    unverifiedServes,
    // Preference per person served, plus a little for different burgers
    quality: weighted / combo.serves + 0.3 * burgerLines,
    share: defining ? (servesByType[defining] ?? 0) / combo.serves : 1,
    disputedServes,
    total,
    signature: parts.join(","),
  };
}

/** Least leftover, then fewest unverified, best quality, lower total, fewer lines; signature keeps it deterministic. */
function compare(a: Scored, b: Scored): number {
  return (
    a.leftover - b.leftover ||
    a.unverifiedServes - b.unverifiedServes ||
    b.quality - a.quality ||
    a.total - b.total ||
    a.combo.lines - b.combo.lines ||
    a.signature.localeCompare(b.signature)
  );
}

/* ── Reason template ─────────────────────────────────────────────────── */

function joinNames(names: readonly string[]): string {
  const list = [...new Set(names)];
  return list.length > 1 ? `${list.slice(0, -1).join(", ")} dan ${list[list.length - 1]}` : list[0] ?? "";
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Reason from the menu data only: what kind of package it is, which items match the customer's
 * taste, and the avoid note. No prices, totals, counts of people or portions, and no "best seller"
 * (the card shows the badge per line).
 */
export function groupDataReason(kind: PlanKind, lines: readonly PlanLine[], c: Criteria): string {
  const items = lines.map((l) => l.item);
  const names = (pick: (m: MenuItem) => boolean) => items.filter(pick).map((m) => m.name);
  const sentences: string[] = [];

  if (kind === "nampan") {
    sentences.push(`${joinNames(names((m) => m.type === "bomber_shake"))} adalah nampan sharing berisi burger dan kentang untuk dinikmati bersama.`);
  } else if (kind === "set") {
    sentences.push(`${joinNames(names((m) => m.type === "set"))} berisi lebih dari satu menu dalam satu paket.`);
  } else {
    sentences.push("Tiap orang dapat burgernya sendiri, jadi bisa pilih sesuai selera.");
  }

  const burgers = items.filter((m) => m.type.endsWith("_burger"));
  if (c.protein && burgers.length) {
    const matching = burgers.filter((m) => m.protein === c.protein).map((m) => m.name);
    const word = c.protein === "beef" ? "daging sapi" : "ayam";
    // "All burgers" only holds when no set or tray (with burgers of their own) is in the plan
    if (matching.length === burgers.length && burgers.length === items.length) sentences.push(`Burgernya pakai ${word} sesuai pilihanmu.`);
    else if (matching.length) sentences.push(`Pilihan ${word} ada di ${joinNames(matching)}.`);
  }
  if (c.wantsPedas === true) {
    const spicy = names(isSpicy);
    if (spicy.length) sentences.push(`Yang pedas ada di ${joinNames(spicy)}.`);
  } else if (c.wantsPedas === false && !items.some(isSpicy)) {
    sentences.push("Tidak ada menu pedas di paket ini.");
  }
  const tasteSentence = (tag: string, phrase: string) => {
    // Flavours from a disputed ingredient (source_conflict.taste_terms) are never claimed
    const list = names((m) => confirmedTaste(m).some((t) => t.includes(tag)));
    if (list.length) sentences.push(`${capitalize(phrase)} ada di ${joinNames(list)}.`);
  };
  if (c.wantsManis) tasteSentence("manis", "rasa manis");
  if (c.wantsSmoky) tasteSentence("smoky", "rasa smoky BBQ");
  if (c.wantsGurih) tasteSentence("gurih", "rasa gurih");

  if (c.avoid.size) {
    sentences.push(lines.some((l) => l.unverified) ? cashierNote(c.avoid) : absenceNote(c.avoid));
  }
  return sentences.join(" ");
}

/* ── Main entry ──────────────────────────────────────────────────────── */

const KIND_ORDER: Record<string, number> = { bomber_shake: 0, set: 1 };

/**
 * "Kombinasi set" only: items whose contents the sources disagree on (Set D's needs_validation, a
 * source_conflict) only break ties. Among set combinations equal in share, leftover, unverified
 * serves and preference score, the one with fewer disputed serves wins if it costs at most this
 * much more than the cheapest.
 */
export const DISPUTED_PRICE_TOLERANCE = 0.15;

function isDisputed(item: MenuItem): boolean {
  return item.contents_unconfirmed === true || item.source_conflict !== undefined;
}

/**
 * Best combination of one kind in the usual order. Only "Kombinasi set" then applies the
 * disputed-contents tie-break (Set D); burgers and trays keep score, then cheapest. Their
 * source_conflict still counts where it always did: avoid filter and reasons.
 */
function bestOfKind(kind: PlanKind, candidates: Scored[]): Scored | undefined {
  const ranked = [...candidates].sort((a, b) => b.share - a.share || compare(a, b));
  const top = ranked[0];
  if (!top || kind !== "set") return top;
  const tied = ranked.filter(
    (s) =>
      s.share === top.share &&
      s.leftover === top.leftover &&
      s.unverifiedServes === top.unverifiedServes &&
      Math.abs(s.quality - top.quality) < 1e-9
  );
  const ceiling = top.total * (1 + DISPUTED_PRICE_TOLERANCE);
  return tied
    .filter((s) => s.total <= ceiling)
    .sort((a, b) => a.disputedServes - b.disputedServes || compare(a, b))[0];
}

function buildPlans(sel: Selections, text: string, menu: readonly MenuItem[], party: number): GroupPlan[] {
  const base = buildCriteria(sel, text);
  // Eating together: only "Cepat saja" still means something; Sendiri/Berdua scoring does not apply
  const criteria: Criteria = { ...base, situasi: base.situasi === "cepat" ? "cepat" : undefined };
  const { tier1, tier2 } = candidateTiers(sel, text, [...menu]);
  const toUnits = (items: MenuItem[], unverified: boolean): Unit[] =>
    items
      .filter((m) => m.serves > 0)
      .map((item) => ({
        item,
        unverified,
        score: itemScore(item, criteria) + (item.best_seller ? 1 : 0),
      }));
  const all = [...toUnits(tier1, false), ...toUnits(tier2, true)];
  const byRank = (a: Unit, b: Unit) => Number(a.unverified) - Number(b.unverified) || b.score - a.score;
  const burgers = all.filter((u) => u.item.type.endsWith("_burger")).sort(byRank).slice(0, MAX_BURGERS);
  const units = [...all.filter((u) => !u.item.type.endsWith("_burger")), ...burgers];
  if (!units.length) return [];

  let combos = enumerate(units, party, DEFAULT_CAP);
  // Few eligible items (e.g. only Buffalo Chicken under "hindari bawang"): allow more of the same
  if (!combos.length) combos = enumerate(units, party, party);
  if (!combos.length) return [];

  const scored = combos.map((c) => scoreCombo(units, c, party)).sort(compare);
  const minLeftover = scored[0].leftover;
  const minUnverified = Math.min(...scored.filter((s) => s.leftover === minLeftover).map((s) => s.unverifiedServes));
  // Best plan of each kind among the least-leftover, least-unverified ones; a kind leans on its own
  // type first (a "Kombinasi set" made mostly of sets), then the usual order and the tie-break
  const eligible = scored.filter((s) => s.leftover === minLeftover && s.unverifiedServes === minUnverified);
  const picked = (["satuan", "set", "nampan"] as const)
    .map((kind) => bestOfKind(kind, eligible.filter((s) => s.kind === kind)))
    .filter((s): s is Scored => s !== undefined)
    .sort(compare);

  return picked.map((s) => {
    const lines: PlanLine[] = s.combo.counts
      .flatMap((qty, i) => (qty ? [{ item: units[i].item, qty, unverified: units[i].unverified, score: units[i].score }] : []))
      .sort(
        (a, b) =>
          (KIND_ORDER[a.item.type] ?? 2) - (KIND_ORDER[b.item.type] ?? 2) ||
          b.qty - a.qty ||
          b.score - a.score ||
          // Equal sets: the one with clear contents is listed first (Set C before Set D)
          (a.item.type === "set" && b.item.type === "set" ? Number(isDisputed(a.item)) - Number(isDisputed(b.item)) : 0)
      )
      .map(({ item, qty, unverified }) => ({ item, qty, unverified }));
    const total = lines.reduce((sum, l) => sum + (l.item.price_idr ?? 0) * l.qty, 0);
    return {
      id: s.kind,
      kind: s.kind,
      lines,
      serves: s.combo.serves,
      leftover: s.leftover,
      total,
      unpriced: lines.filter((l) => l.item.price_idr === null).length,
      perPerson: perPersonEstimate(total, party),
      unverified: lines.some((l) => l.unverified),
      reason: groupDataReason(s.kind, lines, criteria),
    };
  });
}

/** Per-person estimate: total / party, rounded to the nearest Rp1.000. */
export function perPersonEstimate(total: number, party: number): number {
  return Math.round(total / party / 1000) * 1000;
}

/**
 * Plans for a party of 3+ (callers use recommend() for 1–2). Avoid filters, unverified labels and
 * the "nggak pedas" filter apply exactly as for single recommendations.
 */
export function groupPlan(sel: Selections, text: string, menu: readonly MenuItem[], party: number, overLimit = false): GroupResult {
  const plans = buildPlans(sel, text, menu, party);
  const suggestions: string[] = [];
  if (!plans.length) {
    // Which single chip, removed on its own, would leave a plan
    const chipLabel = (group: "hindari" | "rasa", id: string) => {
      const option = chipGroups.find((g) => g.id === group)?.options.find((o) => o.id === id);
      return group === "hindari" ? `Hindari ${option?.label.toLowerCase() ?? id}` : option?.label ?? id;
    };
    for (const id of sel.hindari) {
      if (buildPlans({ ...sel, hindari: sel.hindari.filter((h) => h !== id) }, text, menu, party).length) suggestions.push(chipLabel("hindari", id));
    }
    if (sel.rasa.includes("tidak-pedas") && buildPlans({ ...sel, rasa: sel.rasa.filter((r) => r !== "tidak-pedas") }, text, menu, party).length) {
      suggestions.push(chipLabel("rasa", "tidak-pedas"));
    }
  }
  return {
    party,
    overLimit,
    plans,
    allUnverified: plans.length > 0 && plans.every((p) => p.unverified),
    suggestions,
  };
}
