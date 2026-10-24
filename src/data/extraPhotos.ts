/*
 * Photos for the non-burger parts of sets and Bomber Shakes (public/images/extras, WebP made from
 * the PNG cutouts). Matched by the exact line names in bomber_burger_menu.json; anything else
 * (e.g. "Minuman (soda / fruitea / mineral)", a choice of drink) stays text only.
 */
import type { ItemType } from "../types/menu";

export interface ExtraPhoto {
  src: string;
  alt: string;
}

const extra = (file: string, alt: string): ExtraPhoto => ({ src: `/images/extras/${file}.webp`, alt });

/** Tray photo per Bomber Shake id */
export const SHAKE_PHOTOS: Record<string, ExtraPhoto> = {
  tropical_bomber_shake: extra("shake-tropical", "Nampan Tropical Bomber Shake"),
  meaty_bomber_shake: extra("shake-meaty", "Nampan Meaty Bomber Shake"),
  mix_bomber_shake: extra("shake-mix", "Nampan Mix Bomber Shake"),
};

const RULES: [RegExp, (parent: ItemType) => ExtraPhoto][] = [
  // A tray's "Large cajun french fries" is the seasoned bunch; Set D's "Small Cajun Fries" the plain one
  [/^(?:large |small )?cajun (?:french )?fries$/i, (p) => (p === "bomber_shake" ? extra("fries-seasoned", "Kentang goreng cajun") : extra("cajun-fries", "Cajun fries"))],
  [/^onion rings?$/i, () => extra("onion-ring", "Onion ring")],
  [/^(?:tray )?(?:dipping cheese|cheese dipping)$/i, () => extra("cheese-dipping", "Saus keju untuk cocolan")],
  [/^coca[\s-]?cola$/i, () => extra("coca-cola", "Coca-Cola")],
  [/^fruit[\s-]tea$/i, () => extra("fruit-tea", "Fruit Tea")],
  [/^nasi putih$/i, () => extra("rice", "Nasi putih")],
  [/^(?:ayam krispi|crispy chicken)$/i, () => extra("crispy-chicken", "Ayam krispi")],
];

/** Photo for one non-burger line, or undefined (shown as text only). */
export function extraPhoto(name: string, parent: ItemType): ExtraPhoto | undefined {
  const rule = RULES.find(([re]) => re.test(name.trim()));
  return rule?.[1](parent);
}

/** "Large cajun french fries + onion rings" is two things on one line: one label (and photo) each. */
export function splitExtras(name: string): string[] {
  return name.split(/\s+\+\s+/).map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}
