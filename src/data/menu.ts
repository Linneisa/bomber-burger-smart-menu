import type { MenuItem, ItemType } from "../types/menu";
import rawMenuJson from "./bomber_burger_menu.json";
import { buildMenuItems, type JsonMenu } from "./menuModel";

export const menuItems: MenuItem[] = buildMenuItems(rawMenuJson as unknown as JsonMenu);

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
