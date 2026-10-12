/*
 * Pure menu builder shared by the frontend (src/data/menu.ts) and the API (api/recommend.ts).
 * No JSON import here: callers pass the parsed bomber_burger_menu.json in.
 * Relative imports use ".js" so the file also runs as native Node ESM on Vercel.
 */
import type { ChickenFlavorOption, ExtraBeefOption, ExtraBeefSize, ItemType, MenuItem, SourceConflict } from "../types/menu.js";

/* ── Interfaces matching bomber_burger_menu.json ──────────────────────── */
interface JsonBurger {
  id: string;
  name: string;
  category: string;
  protein: string;
  patty_count?: number;
  ingredients: string[];
  contains: string[];
  taste_draft: string[];
  spicy: boolean;
  price_idr: number | null;
  set_price_idr?: number | null;
  serves?: number;
  best_seller?: boolean;
  extra_beef_eligible?: boolean;
  source_conflict?: SourceConflict;
}
interface JsonFlavor { name: string; detail: string }
interface JsonSet {
  id: string;
  name: string;
  items: string[];
  chicken_flavor_options?: JsonFlavor[];
  needs_validation?: string;
  price_idr: number | null;
  serves?: number;
}
interface JsonTray {
  id: string;
  name: string;
  items: string[];
  needs_validation?: string;
  price_idr: number | null;
  serves?: number;
  source_conflict?: SourceConflict;
}
interface JsonSide {
  id: string;
  name: string;
  description: string;
  contains?: string[];
  price_idr: number | null;
  serves?: number;
}
export interface JsonMenu {
  /** Extra charge per Extra Beef size, e.g. { "S": 0, "R": 12600, … } */
  extra_beef_package?: Partial<Record<ExtraBeefSize, number>>;
  burgers: JsonBurger[];
  sets: JsonSet[];
  sharing_trays: JsonTray[];
  side_dishes: JsonSide[];
}

function img(id: string): string {
  return `/images/menu/${id}.webp`;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Sauces and seasonings whose contents are unknown, so allergens (bawang, keju) can't be ruled out.
 * Covers SOP and official spellings: "Bomber Secret Sauce", "Bomber's Secret Sauce", "Saus OG",
 * "OG Sauce", "OG Mustard", "Secret Sweet and BBQ Sauce", buffalo sauce, thousand island,
 * bumbu kentang and cajun seasoning.
 */
export const UNKNOWN_COMPONENT =
  /secret (?:sweet and bbq )?sauce|saus og|\bog (?:sauce|mustard)|buffalo sauce|thousand island|bumbu kentang|cajun/i;

/** True if every ingredient line is known and the SOP agrees with the official menu. */
function burgerIngredientsKnown(b: JsonBurger): boolean {
  return !b.source_conflict && !b.ingredients.some((i) => UNKNOWN_COMPONENT.test(i));
}

/**
 * Resolve a set/tray component line (e.g. "2 BBQ Strike Beef Burger") to a burger by exact
 * name, allowing only a leading quantity and a trailing "Burger"/"Beef Burger"/"Chicken Burger".
 * Anything else (rice, fries, drinks, sauces…) has no ingredient data in the JSON → undefined.
 */
function resolveBurger(component: string, burgers: JsonBurger[]): JsonBurger | undefined {
  const c = norm(component.replace(/^\s*\d+\s+/, ""));
  return burgers.find((b) => {
    const n = norm(b.name);
    return [n, `${n}burger`, `${n}beefburger`, `${n}chickenburger`].includes(c);
  });
}

/** Avoidables that a component line names outright, e.g. "Tray dipping cheese", "onion rings". */
const NAMED_AVOIDABLE: [string, RegExp][] = [
  ["keju", /keju|cheese/i],
  ["bawang", /bawang|onion/i],
];

/**
 * Union of known component ingredients; complete only if every component resolved to a fully
 * known burger. Unresolved lines still count as containing an avoidable they name outright.
 */
function deriveAvoidData(
  components: string[],
  burgers: JsonBurger[],
  needsValidation: boolean
): MenuItem["avoidData"] {
  const contains = new Set<string>();
  let complete = !needsValidation;
  for (const component of components) {
    const burger = resolveBurger(component, burgers);
    if (burger) {
      burger.contains.forEach((x) => contains.add(x));
      if (!burgerIngredientsKnown(burger)) complete = false;
    } else {
      complete = false;
      for (const [name, pattern] of NAMED_AVOIDABLE) if (pattern.test(component)) contains.add(name);
    }
  }
  return { contains: [...contains], complete };
}

/** True if any component resolves to a burger tagged spicy. */
function deriveSpicyComponent(components: string[], burgers: JsonBurger[]): boolean {
  return components.some((component) => resolveBurger(component, burgers)?.spicy === true);
}

export function buildMenuItems(raw: JsonMenu): MenuItem[] {
  const burgers = raw.burgers.map(
    (b): MenuItem => ({
      id: b.id,
      name: b.name,
      type: b.category as ItemType,
      protein: b.protein as "beef" | "chicken",
      ingredients: b.ingredients,
      contains: b.contains,
      taste_draft: b.taste_draft,
      spicy: b.spicy,
      price_idr: b.price_idr,
      set_price_idr: b.set_price_idr ?? null,
      serves: b.serves ?? 1,
      best_seller: b.best_seller === true,
      // Only single beef burgers; the category check guards against a stray flag in the JSON
      extra_beef_eligible: b.extra_beef_eligible === true && b.category === "beef_burger",
      source_conflict: b.source_conflict,
      image: img(b.id),
      patty_count: b.patty_count,
      avoidData: { contains: b.contains, complete: burgerIngredientsKnown(b) },
    })
  );

  const sets = raw.sets.map(
    (s): MenuItem => ({
      id: s.id,
      name: s.name,
      type: "set",
      protein: "none",
      ingredients: [],
      contains: [],
      taste_draft: [],
      spicy: false,
      spicyComponent: deriveSpicyComponent(s.items, raw.burgers),
      price_idr: s.price_idr,
      serves: s.serves ?? 1,
      ...(s.needs_validation && { contents_unconfirmed: true }),
      extra_beef_eligible: false,
      image: img(s.id),
      items: s.items,
      chicken_flavor_options: s.chicken_flavor_options as ChickenFlavorOption[] | undefined,
      avoidData: deriveAvoidData(s.items, raw.burgers, Boolean(s.needs_validation)),
    })
  );

  const shakes = raw.sharing_trays.map(
    (t): MenuItem => ({
      id: t.id,
      name: t.name,
      type: "bomber_shake",
      protein: "none",
      ingredients: [],
      contains: [],
      taste_draft: [],
      spicy: false,
      spicyComponent: deriveSpicyComponent(t.items, raw.burgers),
      price_idr: t.price_idr,
      serves: t.serves ?? 4,
      ...(t.needs_validation && { contents_unconfirmed: true }),
      extra_beef_eligible: false,
      image: img(t.id),
      items: t.items,
      source_conflict: t.source_conflict,
      avoidData: deriveAvoidData(t.items, raw.burgers, Boolean(t.needs_validation || t.source_conflict)),
    })
  );

  const sides = raw.side_dishes.map(
    (s): MenuItem => ({
      id: s.id,
      name: s.name,
      type: "side",
      protein: "chicken",
      ingredients: [],
      contains: s.contains ?? [],
      taste_draft: [],
      spicy: false,
      price_idr: s.price_idr,
      serves: s.serves ?? 0,
      extra_beef_eligible: false,
      image: img(s.id),
      description: s.description,
      // No "contains" field in the JSON means no ingredient data, not "contains nothing";
      // an unknown seasoning (bumbu kentang, cajun) in the description also leaves it incomplete
      avoidData: {
        contains: s.contains ?? [],
        complete: s.contains !== undefined && !UNKNOWN_COMPONENT.test(s.description),
      },
    })
  );

  return [...burgers, ...sets, ...shakes, ...sides];
}

const EXTRA_BEEF_SIZES: readonly ExtraBeefSize[] = ["S", "R", "M", "L", "XL", "XXL"];

/** Extra Beef sizes in menu order, S ("Standar") first; sizes missing from the JSON are left out. */
export function buildExtraBeefOptions(raw: JsonMenu): ExtraBeefOption[] {
  const pkg = raw.extra_beef_package ?? {};
  return EXTRA_BEEF_SIZES.flatMap((size) => {
    const price = pkg[size];
    return typeof price === "number" ? [{ size, label: size === "S" ? "Standar" : size, price_idr: price }] : [];
  });
}

/** True if the item may be recommended given the active avoid list. */
export function passesAvoid(item: MenuItem, avoid: ReadonlySet<string>): boolean {
  return avoidTier(item, avoid) === 1;
}

/**
 * 1 = ingredients complete and proven free of every avoided ingredient (or no avoid active);
 * 2 = ingredients incomplete/unknown but not proven to contain one (unverified);
 * null = proven to contain an avoided ingredient, never recommended.
 */
export function avoidTier(item: MenuItem, avoid: ReadonlySet<string>): 1 | 2 | null {
  if (avoid.size === 0) return 1;
  if (item.avoidData.contains.some((a) => avoid.has(a))) return null;
  return item.avoidData.complete ? 1 : 2;
}

/** True if the item or any of its component burgers is tagged spicy (the JSON has no spice levels). */
export function isSpicy(item: MenuItem): boolean {
  return item.spicy || item.spicyComponent === true || item.taste_draft.includes("pedas");
}

/**
 * Taste tags backed by undisputed ingredients: tags containing a source_conflict taste term are
 * dropped (BBQ Strike: "manis" and "smoky BBQ" come from the disputed saus BBQ, "gurih" stays).
 */
export function confirmedTaste(item: MenuItem): string[] {
  const terms = item.source_conflict?.taste_terms ?? [];
  if (!terms.length) return item.taste_draft;
  return item.taste_draft.filter((tag) => !terms.some((t) => new RegExp(`\\b${t}\\b`, "i").test(tag)));
}

/** True if the portion data marks the item as large (double patty or "porsi besar" taste tag). */
export function isLargePortion(item: MenuItem): boolean {
  return (item.patty_count ?? 0) >= 2 || item.taste_draft.includes("porsi besar");
}
