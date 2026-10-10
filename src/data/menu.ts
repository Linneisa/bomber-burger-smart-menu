import type { ChickenFlavorOption, MenuItem, ItemType } from "../types/menu";
import rawMenuJson from "./bomber_burger_menu.json";

/* ── Local interfaces matching bomber_burger_menu.json ────────────────── */
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
  price_idr: null;
}
interface JsonTray { id: string; name: string; items: string[]; price_idr: null }
interface JsonSide {
  id: string;
  name: string;
  description: string;
  contains?: string[];
  price_idr: null;
}
interface JsonMenu {
  burgers: JsonBurger[];
  sets: JsonSet[];
  sharing_trays: JsonTray[];
  side_dishes: JsonSide[];
}

const raw = rawMenuJson as unknown as JsonMenu;

function img(id: string): string {
  return `/images/menu/${id}.webp`;
}

const burgers: MenuItem[] = raw.burgers.map(
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
  })
);

const sets: MenuItem[] = raw.sets.map(
  (s): MenuItem => ({
    id: s.id,
    name: s.name,
    type: "set",
    protein: "none",
    ingredients: [],
    contains: [],
    taste_draft: [],
    spicy: false,
    price_idr: s.price_idr,
    image: img(s.id),
    items: s.items,
    chicken_flavor_options: s.chicken_flavor_options as ChickenFlavorOption[] | undefined,
  })
);

const shakes: MenuItem[] = raw.sharing_trays.map(
  (t): MenuItem => ({
    id: t.id,
    name: t.name,
    type: "bomber_shake",
    protein: "none",
    ingredients: [],
    contains: [],
    taste_draft: [],
    spicy: false,
    price_idr: t.price_idr,
    image: img(t.id),
    items: t.items,
  })
);

const sides: MenuItem[] = raw.side_dishes.map(
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
  })
);

export const menuItems: MenuItem[] = [...burgers, ...sets, ...shakes, ...sides];

export const categories: { id: ItemType | "all"; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "beef_burger", label: "Beef Burger" },
  { id: "chicken_burger", label: "Chicken Burger" },
  { id: "set", label: "Set" },
  { id: "bomber_shake", label: "Bomber Shake" },
  { id: "side", label: "Side Dish" },
];

export const categoryLabels: Record<ItemType, string> = {
  beef_burger: "Beef Burger",
  chicken_burger: "Chicken Burger",
  set: "Set",
  bomber_shake: "Bomber Shake",
  side: "Side Dish",
};

/** Three items shown in the "Menu populer" section on Home */
export const popularItems: MenuItem[] = menuItems.filter((m) =>
  ["smoky_sweet_bbq", "buffalo_chicken", "double_beef"].includes(m.id)
);
