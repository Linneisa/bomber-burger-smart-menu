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
  // Texture/quality adjectives the data never states
  /\bleleh\b/i,
  /\blumer\b/i,
  /\bcreamy\b/i,
  /\bmewah\b/i,
  /\bpremium\b/i,
  /\bkental\b/i,
  /\bjuicy\b/i,
  /\blembut\b/i,
  /\btanpa ribet\b/i,
  /\bdi-?torch\b/i,
  /\bkaya rasa\b/i,
  // The data never marks a portion as small ("porsi yang tidak terlalu besar")
  /\bporsi(?:nya)?\s+(?:yang\s+)?(?:tidak|nggak|gak)\s+terlalu\s+besar\b/i,
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
// Price wording the data can never back up (discounts, "affordable"…)
const PRICE_SPIN = /\b(?:diskon|promo|potongan harga|cashback|hemat|terjangkau|ekonomis|budget|worth it|ramah di kantong)\b/i;
// "murah", "termurah", "paling mahal", "lebih murah": checked against the menu's prices
const PRICE_COMPARE = /\b(?:(paling|lebih)\s+)?(ter)?(murah|mahal)\b/gi;
// "Rp29.000", "Rp 29,000", "Rp29rb", "29 ribu"
const RP_AMOUNT = /\brp\.?\s?(\d{1,3}(?:[.,]\d{3})+|\d+)(?:\s?(rb|ribu|k)\b)?|(?<!rp\.?\s?)\b(\d{1,3})\s?(rb|ribu)\b/gi;
// The Extra Beef add-on is chosen in the app; reasons never mention or suggest it
const EXTRA_BEEF =
  /\b(?:extra|ekstra)[\s-]?(?:beef|patty|daging)\b|\bpatty\s+(?:tambahan|ekstra|extra)\b|\btambah(?:an)?\s+(?:patty|beef|daging)\b/i;
// "double patty", "2 patty", "dua patty", "patty ganda": only the item's own patty_count may be stated
const PATTY_WORDS: Record<string, number> = {
  single: 1, satu: 1, double: 2, dobel: 2, dua: 2, ganda: 2, triple: 3, tripel: 3, tiga: 3, empat: 4, quadruple: 4, lima: 5,
};
const PATTY_COUNT = new RegExp(
  `\\b(\\d+|${Object.keys(PATTY_WORDS).join("|")})\\s*(?:x\\s*)?(?:beef\\s+)?patt(?:y|ies)\\b` +
    `|\\bpatt(?:y|ies)(?:\\s+beef)?\\s+(ganda|dobel|double|triple|\\d+(?![\\d\\s]*(?:gr?|gram)\\b))\\b|\\bpatt(?:y|ies)(?:\\s+beef)?\\s*\\((\\d+)\\)`,
  "gi"
);
// Weights ("150 gram patty", "patty 100g"): never in the data, so never in a reason
const PATTY_WEIGHT = /\b\d+\s?(?:gr?|gram)\b/i;

/** Patty counts in the reason that differ from the item's patty_count (or any count when it has none). */
function pattyViolations(reason: string, item: MenuItem): string[] {
  const found: string[] = [];
  for (const match of reason.matchAll(PATTY_COUNT)) {
    const word = (match[1] ?? match[2] ?? match[3]).toLowerCase();
    const count = /^\d+$/.test(word) ? Number(word) : PATTY_WORDS[word];
    if (count !== item.patty_count) found.push(match[0]);
  }
  const weight = reason.match(PATTY_WEIGHT);
  if (weight && !itemDataText(item).includes(weight[0].toLowerCase())) found.push(weight[0]);
  return found;
}

// Popularity: the card already shows the Best Seller badge, so reasons never repeat it, and
// "terlaris"/"favorit" are never backed by the data
const POPULARITY = /\bbest[\s-]?seller\b|\bterlaris\b|\bpaling laris\b|\bpaling populer\b|\bfavorit (?:kami|pelanggan|banyak orang)\b/i;
const PEOPLE_WORDS: Record<string, number> = { dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10 };
// Head counts ("berdua", "dua orang", "untuk 4 orang"): only a set whose "serves" says exactly that
const PEOPLE_COUNT = new RegExp(
  `\\bber(${Object.keys(PEOPLE_WORDS).join("|")})\\b|\\b(\\d+|${Object.keys(PEOPLE_WORDS).join("|")})\\s+orang\\b`,
  "gi"
);
// Sharing without a number: only for items that serve more than one (Set C/D, Bomber Shake)
const SHARING = /\b(?:dibagi|berbagi|sharing|share|dinikmati bersama|makan bersama|rame-rame|ramai-ramai)\b/i;
// Packaging details ("Kemasan gelas papercup Bomber") say nothing about why the item fits
const PACKAGING = /\b(?:kemasan(?:nya)?|dikemas|papercup|paper cup|gelas kertas|gelas|packaging|wadah)\b/i;
// Any price talk, for requests that did not ask about price
const PRICE_MENTION = /\bharga(?:nya)?\b|\bseharga\b|\brp\.?\s?\d|\b\d{1,3}\s?(?:rb|ribu)\b|\b(?:ter)?(?:murah|mahal)\b/i;
// Old SOP spellings of renamed menus that the spacing check below can't see
const LEGACY_NAMES = /\bcheddar cheeseburger\b/i;
// Crowd claims the data can't back up even for a best seller ("disukai banyak pelanggan",
// "pilihan banyak pelanggan", "di kalangan pelanggan kami", "sangat best seller")
const CROWD_CLAIMS =
  /\b(?:disukai|digemari|diburu|dicari|dipilih)\s+banyak\s+(?:orang|pelanggan)\b|\bpilihan banyak\s+(?:orang|pelanggan)\b|\bdi kalangan (?:para )?pelanggan\b|\bpelanggan kami\b|\bbanyak dipesan\b|\bsangat best[\s-]?seller\b/i;
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

const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Menu names not written as the official display name: words run together or split differently
 * ("Phillycheesesteak", "CEO PhillyStack"), an acronym in another case ("Bbq Strike", "Og Burger"),
 * or an old SOP spelling ("Beef Cheddar Cheeseburger"). Names are compared case-insensitively
 * elsewhere, so the wrong spelling would otherwise pass.
 */
function nameSpellingViolations(reason: string, item: MenuItem, menu: readonly MenuItem[]): string[] {
  const found: string[] = [];
  for (const name of new Set([item.name, ...menu.map((m) => m.name)])) {
    const words = name.split(/\s+/);
    const pattern = new RegExp(`\\b${words.map(escapeRegExp).join("\\s*")}`, "gi");
    for (const match of reason.matchAll(pattern)) {
      const spacing = match[0].split(/\s+/).length !== words.length;
      const acronymCase = /\b[A-Z]{2,}\b/.test(name) && match[0] !== name;
      if ((spacing || acronymCase) && !found.includes(match[0])) found.push(match[0]);
    }
  }
  const legacy = reason.match(LEGACY_NAMES);
  if (legacy) found.push(legacy[0]);
  return found;
}

/** Head counts and sharing claims that the item's "serves" does not back up. */
function servingViolations(reason: string, item: MenuItem): string[] {
  const found: string[] = [];
  for (const match of reason.matchAll(PEOPLE_COUNT)) {
    const word = (match[1] ?? match[2]).toLowerCase();
    const n = /^\d+$/.test(word) ? Number(word) : PEOPLE_WORDS[word];
    // A Bomber Shake is "isi 4 burger", never "for 4 people"; Set A/B and burgers are one portion
    if (!(item.type === "set" && item.serves >= 2 && n === item.serves)) found.push(match[0]);
  }
  const sharing = reason.match(SHARING);
  if (sharing && item.serves < 2) found.push(sharing[0]);
  return found;
}

/**
 * Flavours that only come from a disputed ingredient (source_conflict.taste_terms, e.g. BBQ, manis,
 * smoky from a disputed saus BBQ). Menu names are taken out first, so "BBQ Strike" itself is fine.
 */
function disputedTasteViolations(reason: string, item: MenuItem, menu: readonly MenuItem[]): string[] {
  const terms = item.source_conflict?.taste_terms ?? [];
  if (!terms.length) return [];
  const names = [item.name, ...menu.map((m) => m.name), ...(item.items ?? []).map((i) => i.replace(/^\d+\s+/, ""))]
    .sort((a, b) => b.length - a.length);
  let body = reason;
  for (const name of names) body = body.replace(new RegExp(escapeRegExp(name), "gi"), " ");
  return terms.flatMap((term) => body.match(new RegExp(`\\b${escapeRegExp(term)}\\b`, "i"))?.[0] ?? []);
}

/** Other menu items named in the text ("lebih murah dari BBQ Strike"). */
function namedItems(text: string, item: MenuItem, menu: readonly MenuItem[]): MenuItem[] {
  const t = normName(text);
  return menu.filter((m) => m.id !== item.id && t.includes(normName(m.name)));
}

/**
 * Price wording that the menu data does not back up. Rp amounts must equal the item's price or set
 * price, or that of another item named in the reason; "termurah"/"termahal" must be true across the
 * whole menu or the item's own category; "lebih murah/mahal" needs a named item to compare with.
 */
function priceViolations(reason: string, item: MenuItem, menu: readonly MenuItem[]): string[] {
  const found: string[] = [];
  const spin = reason.match(PRICE_SPIN);
  if (spin) found.push(spin[0]);

  const named = namedItems(reason, item, menu);
  const allowed = new Set([item, ...named].flatMap((m) => [m.price_idr, m.set_price_idr]).filter((p): p is number => typeof p === "number"));
  for (const match of reason.matchAll(RP_AMOUNT)) {
    const digits = (match[1] ?? match[3]).replace(/[.,]/g, "");
    const amount = Number(digits) * (match[2] ?? match[4] ? 1000 : 1);
    if (!allowed.has(amount)) found.push(match[0]);
  }

  const price = item.price_idr;
  for (const match of reason.matchAll(PRICE_COMPARE)) {
    const [, modifier, ter, word] = match;
    const cheap = word.toLowerCase() === "murah";
    if (price === null) {
      found.push(match[0]);
    } else if (modifier?.toLowerCase() === "lebih") {
      // Compare with the items named in the same sentence
      const sentence = reason.slice(0, reason.indexOf(match[0])).split(/[.!?]/).pop()! + reason.slice(reason.indexOf(match[0])).split(/[.!?]/)[0];
      const others = namedItems(sentence, item, menu).filter((m) => m.price_idr !== null);
      const holds = others.length > 0 && others.every((m) => (cheap ? price < m.price_idr! : price > m.price_idr!));
      if (!holds) found.push(match[0]);
    } else if (ter || modifier) {
      const extreme = (pool: readonly MenuItem[]) => {
        const prices = pool.map((m) => m.price_idr).filter((p): p is number => p !== null);
        return prices.length > 0 && price === (cheap ? Math.min(...prices) : Math.max(...prices));
      };
      if (!extreme(menu) && !extreme(menu.filter((m) => m.type === item.type))) found.push(match[0]);
    } else {
      // Plain "murah"/"mahal" is an opinion, not data
      found.push(match[0]);
    }
  }
  return found;
}

/**
 * Phrases in the reason that the item's data does not back up, or that leak system terms or send
 * the customer off to check; empty if the reason is clean.
 * @param unverified Tier-2 item: its "tanyakan ke kasir" sentence is left to normalizeUnverifiedReason.
 * @param menu Whole menu, for price comparisons ("termurah", "lebih murah dari …") and name spelling.
 * @param allowPrice False when the customer did not ask about price: any price talk is flagged.
 */
export function claimViolations(
  reason: string,
  item: MenuItem,
  unverified = false,
  menu: readonly MenuItem[] = [],
  allowPrice = true
): string[] {
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
  if (allowPrice) {
    found.push(...priceViolations(reason, item, menu));
  } else {
    const price = reason.match(PRICE_MENTION);
    if (price) found.push(price[0]);
  }
  const extraBeef = reason.match(EXTRA_BEEF);
  if (extraBeef) found.push(extraBeef[0]);
  found.push(...pattyViolations(reason, item));
  // "sangat best seller" is reported once, as a crowd claim
  const crowd = reason.match(CROWD_CLAIMS);
  if (crowd) found.push(crowd[0]);
  const popular = reason.match(POPULARITY);
  if (popular && !found.some((f) => f.toLowerCase().includes(popular[0].toLowerCase()))) found.push(popular[0]);
  found.push(...nameSpellingViolations(reason, item, menu));
  found.push(...servingViolations(reason, item));
  // "saus BBQ" (a disputed ingredient, reported below) already covers its own "BBQ"
  const disputedNames = item.source_conflict?.terms.filter((t) => new RegExp(`\\b${escapeRegExp(t)}\\b`, "i").test(reason)) ?? [];
  for (const taste of disputedTasteViolations(reason, item, menu)) {
    if (!disputedNames.some((t) => t.toLowerCase().includes(taste.toLowerCase()))) found.push(taste);
  }
  const packaging = reason.match(PACKAGING);
  if (packaging) found.push(packaging[0]);
  // SOP and official menu disagree: the disputed ingredient is never named. The unverified
  // cashier note ("Soal keju, tanyakan ke kasir ya.") names the avoided one on purpose, so skip it.
  if (item.source_conflict) {
    const body = sentencesOf(reason).filter((s) => !(unverified && /^soal\b/i.test(s) && /\bkasir\b/i.test(s))).join(" ");
    for (const term of item.source_conflict.terms) {
      const match = body.match(new RegExp(`\\b${escapeRegExp(term)}\\b`, "i"));
      if (match && !found.some((f) => f.toLowerCase().includes(match[0].toLowerCase()))) found.push(match[0]);
    }
  }
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

/**
 * "dengan Smoked beef dan Saus BBQ" → "dengan smoked beef dan saus BBQ". A sentence's first word
 * and menu names ("Smoky Sweet BBQ", "Sweet Sensation Beef Burger") are left alone.
 */
export function lowercaseIngredients(reason: string, item: MenuItem, menuNames: readonly string[] = []): string {
  // Character ranges covered by a menu name, case-sensitive as written in the data
  const protectedRanges = menuNames.flatMap((name) =>
    [...reason.matchAll(new RegExp(escapeRegExp(name), "g"))].map((m) => [m.index!, m.index! + name.length] as const)
  );
  let out = reason;
  for (const name of new Set(ingredientNames(item))) {
    const capped = name.charAt(0).toUpperCase() + name.slice(1);
    if (capped === name) continue;
    const pattern = new RegExp(`(?<!(?:^|[.!?])\\s*)\\b${escapeRegExp(capped)}\\b`, "g");
    // Same length replacement, so the protected ranges stay valid
    out = out.replace(pattern, (match, offset: number) =>
      protectedRanges.some(([start, end]) => offset < end && offset + match.length > start) ? match : name
    );
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
  /** False when the customer did not ask about price: reasons may not mention any price */
  allowPrice?: boolean;
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
  { unverified, template = dataReason, allowPrice = true }: EnforceOptions = {}
): Promise<EnforceResult<R>> {
  const menu = [...itemsById.values()];
  const check = (r: R) => claimViolations(r.reason, itemsById.get(r.id)!, unverified?.has(r.id), menu, allowPrice);
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
