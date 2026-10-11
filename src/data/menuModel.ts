/*
 * Pure menu builder shared by the frontend (src/data/menu.ts) and the API (api/recommend.ts).
 * No JSON import here: callers pass the parsed bomber_burger_menu.json in.
 * Relative imports use ".js" so the file also runs as native Node ESM on Vercel.
 */
import type { ChickenFlavorOption, ItemType, MenuItem } from "../types/menu.js";

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
  price_idr: null;
}
interface JsonFlavor { name: string; detail: string }
interface JsonSet {
  id: string;
  name: string;
  items: string[];
  chicken_flavor_options?: JsonFlavor[];
  needs_validation?: string;
  price_idr: null;
}
interface JsonTray { id: string; name: string; items: string[]; needs_validation?: string; price_idr: null }
interface JsonSide {
  id: string;
  name: string;
  description: string;
  contains?: string[];
  price_idr: null;
}
export interface JsonMenu {
  burgers: JsonBurger[];
  sets: JsonSet[];
  sharing_trays: JsonTray[];
  side_dishes: JsonSide[];
}

function img(id: string): string {
  return `/images/menu/${id}.webp`;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Sauces whose contents the JSON says are unknown (_meta.notes), so allergens can't be ruled out. */
const UNKNOWN_SAUCE = /saus og|bomber secret sauce/i;

/** True if every ingredient line is known, i.e. no sauce with unknown contents. */
function burgerIngredientsKnown(b: JsonBurger): boolean {
  return !b.ingredients.some((i) => UNKNOWN_SAUCE.test(i));
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
      image: img(t.id),
      items: t.items,
      avoidData: deriveAvoidData(t.items, raw.burgers, Boolean(t.needs_validation)),
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
      image: img(s.id),
      description: s.description,
      // No "contains" field in the JSON means no ingredient data, not "contains nothing"
      avoidData: { contains: s.contains ?? [], complete: s.contains !== undefined },
    })
  );

  return [...burgers, ...sets, ...shakes, ...sides];
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

/** True if the portion data marks the item as large (double patty or "porsi besar" taste tag). */
export function isLargePortion(item: MenuItem): boolean {
  return (item.patty_count ?? 0) >= 2 || item.taste_draft.includes("porsi besar");
}
