import type { ChipGroup, Selections } from "../types/preferences.js";

export const chipGroups: ChipGroup[] = [
{
  id: "rasa",
  label: "Rasa",
  hint: "Manis & gurih bisa dikombinasi",
  multi: true,
  exclusive: [["pedas", "tidak-pedas"]],
  options: [
  { id: "pedas", label: "Pedas" },
  { id: "tidak-pedas", label: "Tidak terlalu pedas" },
  { id: "manis", label: "Manis" },
  { id: "gurih", label: "Gurih" }]

},
{
  id: "protein",
  label: "Protein",
  hint: "Pilih satu",
  multi: false,
  options: [
  { id: "beef", label: "Beef" },
  { id: "chicken", label: "Chicken" }]

},
{
  id: "budget",
  label: "Budget",
  hint: "Pilih satu",
  multi: false,
  options: [
  { id: "low", label: "< Rp30rb" },
  { id: "mid", label: "Rp30–50rb" },
  { id: "high", label: "> Rp50rb" }]

},
{
  id: "porsi",
  label: "Porsi",
  hint: "Seberapa lapar?",
  multi: false,
  options: [
  { id: "ringan", label: "Ringan" },
  { id: "normal", label: "Normal" },
  { id: "besar", label: "Lapar berat" }]

},
{
  id: "hindari",
  label: "Hindari",
  hint: "Menu yang mengandung ini tidak akan disarankan",
  multi: true,
  options: [
  { id: "bawang", label: "Bawang" },
  { id: "keju", label: "Keju" }]

},
{
  id: "orang",
  label: "Jumlah orang",
  hint: "3 orang atau lebih: kami susun paketnya",
  multi: false,
  options: [
  { id: "sendiri", label: "Sendiri" },
  { id: "berdua", label: "Berdua" },
  { id: "bertiga", label: "Bertiga" },
  { id: "berempat", label: "Berempat" },
  { id: "rombongan", label: "Rombongan 5+" }]

},
{
  id: "situasi",
  label: "Situasi",
  hint: "Opsional",
  multi: false,
  options: [
  { id: "cepat", label: "Cepat saja" }]

}];

/** Party size for the "orang" chips; "rombongan" uses the stepper value (5–10) */
export const PARTY_CHIP_SIZE: Record<string, number> = { sendiri: 1, berdua: 2, bertiga: 3, berempat: 4 };
export const ROMBONGAN_MIN = 5;
export const PARTY_MAX = 10;


export const emptySelections: Selections = {
  rasa: [],
  protein: [],
  budget: [],
  porsi: [],
  hindari: [],
  orang: [],
  situasi: []
};