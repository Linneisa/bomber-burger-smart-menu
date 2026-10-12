import type { ExtraBeefOption, MenuItem, ItemType } from "../types/menu";
import rawMenuJson from "./bomber_burger_menu.json";
import { buildExtraBeefOptions, buildMenuItems, type JsonMenu } from "./menuModel";

export const menuItems: MenuItem[] = buildMenuItems(rawMenuJson as unknown as JsonMenu);

/** Extra Beef sizes (Standar, R … XXL) with their extra charge, for eligible burgers only */
export const extraBeefOptions: ExtraBeefOption[] = buildExtraBeefOptions(rawMenuJson as unknown as JsonMenu);

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

/** "Rekomendasi Best Seller" on Home: follows the best_seller flag in bomber_burger_menu.json */
export const bestSellerItems: MenuItem[] = menuItems.filter((m) => m.best_seller === true);
