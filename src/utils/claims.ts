/*
 * Checks reasons for claims the menu data does not back up, and decides when to regenerate or
 * fall back to a data-only template. Pure (no API calls) so it can be unit tested.
 */
import { isLargePortion } from "../data/menuModel.js";
import type { MenuItem } from "../types/menu.js";
import { cashierNote, dataReason, ingredientNames } from "./recommend.js";

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
// Fullness/portion claims: only for items whose data marks a large portion (double patty or "porsi besar")
const PORTION_CLAIMS = [/\bmengenyangkan\b/i, /\bbikin kenyang\b/i, /\bporsi(?:nya)?\s+(?:besar|banyak)\b/i];
// System terms leaking into the reason ("bahan-bahannya sudah lengkap", "data menu", …)
const SYSTEM_LEAKS = [
  /\bbahan(?:-bahan)?(?:nya)?\s+(?:sudah\s+|telah\s+)?(?:lengkap|tercatat|tercantum|terdata|didata)\b/i,
  /\bdaftar bahan(?:nya)?\s+(?:sudah\s+|telah\s+)?(?:lengkap|tercatat|tercantum)\b/i,
  /\bdata menu\b/i,
  /\b(?:ingredients_complete|unverified|terverifikasi|tier)\b/i,
];
// Sending the customer off to check for themselves
const SELF_CHECK = [
  /\b(?:cek|periksa|lihat)\s+(?:\S+\s+){0,2}?sendiri\b/i,
  /\bsilakan\s+(?:cek|periksa|lihat)\b/i,
  /\b(?:cek|periksa)\s+(?:\S+\s+){0,2}?(?:bahan|komposisi)/i,
];
// Asking staff: only the short note on unverified items may do that (see normalizeUnverifiedReason)
const ASK_STAFF = /\btanya(?:kan|in)?\s+(?:\S+\s+){0,3}?(?:kasir|staf|staff|pelayan|karyawan)\b/i;
// Filler that says nothing about the item, or points at the data behind it
const FILLER_PHRASES = [
  /\bmelengkapi rekomendasi\b/i,
  /\bpilihan lain untuk\b/i,
  /\bdari data(?: yang tersedia)?\b/i,
  /(?<!dari )\bdata yang tersedia\b/i,
  /\bburger sendiri\b/i,
];
// Prices are not in the data and never part of a reason, even when the customer asks
const PRICE_TALK = [
  /\bharga\w*/i,
  /\b(?:paling\s+|ter)?murah\b/i,
  /\bmahal\b/i,
  /\brp\.?\s?\d/i,
  /\brupiah\b/i,
  /\b(?:diskon|promo|terjangkau|ekonomis|hemat|budget)\b/i,
  /\bramah di kantong\b/i,
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

/**
 * Phrases in the reason that the item's data does not back up, or that leak system terms or send
 * the customer off to check; empty if the reason is clean.
 * @param unverified Tier-2 item: its "tanyakan ke kasir" sentence is left to normalizeUnverifiedReason.
 */
export function claimViolations(reason: string, item: MenuItem, unverified = false): string[] {
  const data = itemDataText(item);
  const found: string[] = [];
  for (const pattern of UNSUPPORTED_CLAIMS) {
    const match = reason.match(pattern);
    // "tidak terlalu kuat" already covers its own "kuat"
    if (match && !pattern.test(data) && !found.some((f) => f.toLowerCase().includes(match[0].toLowerCase()))) {
      found.push(match[0]);
    }
  }
  if (!isLargePortion(item)) {
    for (const pattern of PORTION_CLAIMS) {
      const match = reason.match(pattern);
      if (match && !pattern.test(data)) found.push(match[0]);
    }
  }
  for (const pattern of [...SYSTEM_LEAKS, ...FILLER_PHRASES, ...(unverified ? [] : [ASK_STAFF])]) {
    const match = reason.match(pattern);
    if (match) found.push(match[0]);
  }
  // One report per reason: "harga paling murah" matches more than one of these
  const price = PRICE_TALK.map((p) => reason.match(p)).find(Boolean);
  if (price) found.push(price[0]);
  // One report per reason: "cek sendiri daftar bahannya" matches more than one of these
  const selfCheck = SELF_CHECK.map((p) => reason.match(p)).find(Boolean);
  if (selfCheck) found.push(selfCheck[0]);
  for (const match of reason.matchAll(ABSENCE_CLAIM)) {
    const ingredient = (match[1] ?? match[2]).toLowerCase();
    const provable = item.avoidData.complete && !item.avoidData.contains.includes(ingredient);
    if (!provable) found.push(match[0]);
  }
  return found;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** "dengan Smoked beef dan Saus BBQ" → "dengan smoked beef dan saus BBQ"; a sentence's first word is left alone. */
export function lowercaseIngredients(reason: string, item: MenuItem): string {
  let out = reason;
  for (const name of new Set(ingredientNames(item))) {
    const capped = name.charAt(0).toUpperCase() + name.slice(1);
    if (capped === name) continue;
    out = out.replace(new RegExp(`(?<!(?:^|[.!?])\\s*)\\b${escapeRegExp(capped)}\\b`, "g"), name);
  }
  return out;
}

export interface EnforceResult<R extends ReasonRec> {
  recs: R[];
  regenerated: boolean;
  /** Number of reasons replaced by the data-only template */
  templated: number;
}

export interface EnforceOptions {
  /** Tier-2 ids (checked with claimViolations(..., true)) */
  unverified?: ReadonlySet<string>;
  /** Replacement reason for a still-dirty item; defaults to dataReason() */
  template?: (item: MenuItem) => string;
}

/**
 * Clean first answer: kept. Otherwise regenerate once (given the offending phrases); whatever is
 * still unsupported after that has its reason replaced by the template. A failed or invalid
 * regeneration (null or throw) keeps the first answer and templates it.
 */
export async function enforceClaims<R extends ReasonRec>(
  first: R[],
  itemsById: ReadonlyMap<string, MenuItem>,
  regenerate: (violations: string[]) => Promise<R[] | null>,
  { unverified, template = dataReason }: EnforceOptions = {}
): Promise<EnforceResult<R>> {
  const check = (r: R) => claimViolations(r.reason, itemsById.get(r.id)!, unverified?.has(r.id));
  const violationsOf = (recs: R[]) => recs.flatMap(check);
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
    if (!check(r).length) return r;
    templated++;
    return { ...r, reason: template(itemsById.get(r.id)!) };
  });
  return { recs, regenerated: true, templated };
}

// Bureaucratic wording that must not appear in an unverified item's reason
const STIFF_PHRASES = [
  /terhadap pilihan/i,
  /pilihan menghindari/i,
  /belum (?:bisa |dapat )?(?:kami )?(?:pastikan|dipastikan)/i,
  /(?:tidak|tak) (?:bisa|dapat) (?:kami )?(?:pastikan|dipastikan|jamin|dijamin|menjamin)/i,
  /bahan belum dipastikan/i,
  /\bmohon\b/i,
  /\bkonfirmasi\b/i,
  /\bverifikasi\b|\bterverifikasi\b/i,
];

const sentencesOf = (text: string) => (text.match(/[^.!?]+[.!?]*/g) ?? []).map((s) => s.trim()).filter(Boolean);

/** "Soal bawang, tanyakan ke kasir ya." style: short, names every avoided ingredient. */
function isShortNote(sentence: string, avoid: readonly string[]): boolean {
  const s = sentence.toLowerCase();
  return /^soal\b/.test(s) && /\bkasir\b/.test(s) && s.split(/\s+/).length <= 9 && avoid.every((a) => s.includes(a));
}

/**
 * Reason for a Tier-2 item: why it fits, then exactly one short cashier note at the end.
 * Stiff wording anywhere: the whole reason becomes the data template plus the note.
 * Missing, misplaced or long-winded note: other "kasir" sentences are dropped and the template note appended.
 */
export function normalizeUnverifiedReason(reason: string, item: MenuItem, avoid: Iterable<string>): string {
  const avoidList = [...avoid];
  const note = cashierNote(avoidList);
  if (STIFF_PHRASES.some((p) => p.test(reason))) return `${dataReason(item)} ${note}`;
  const sentences = sentencesOf(reason);
  const kasir = sentences.filter((s) => /\bkasir\b/i.test(s));
  const last = sentences[sentences.length - 1] ?? "";
  if (kasir.length === 1 && kasir[0] === last && isShortNote(last, avoidList)) return reason;
  const body = sentences.filter((s) => !/\bkasir\b/i.test(s)).join(" ");
  return `${body || dataReason(item)} ${note}`;
}
