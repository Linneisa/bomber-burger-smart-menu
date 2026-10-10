export function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

export function formatPrice(price: number | null): string {
  return price === null ? "Harga di kasir" : formatRupiah(price);
}

export function joinIndonesian(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  if (parts.length === 2) return `${parts[0]} dan ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, dan ${parts[parts.length - 1]}`;
}