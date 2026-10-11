/** What a set adds to the burger (official menu, "make it set") */
export const SET_CONTENTS = "Cajun Fries & Coca-Cola";

/** "Rp29.000"; null (no price in the data) → "Harga di kasir". */
export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Harga di kasir";
  // Manual grouping: toLocaleString("id-ID") depends on the runtime's ICU data
  return `Rp${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/** "Set Rp42.000 (+ Cajun Fries & Coca-Cola)", or null when the burger is not sold as a set. */
export function formatSetPrice(setPrice: number | null | undefined): string | null {
  return setPrice ? `Set ${formatRupiah(setPrice)} (+ ${SET_CONTENTS})` : null;
}

export function joinIndonesian(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  if (parts.length === 2) return `${parts[0]} dan ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, dan ${parts[parts.length - 1]}`;
}
