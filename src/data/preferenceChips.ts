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
  id: "situasi",
  label: "Situasi",
  hint: "Pilih satu",
  multi: false,
  options: [
  { id: "sendiri", label: "Makan sendiri" },
  { id: "berdua", label: "Berdua" },
  { id: "cepat", label: "Cepat saja" }]

}];


export const emptySelections: Selections = {
  rasa: [],
  protein: [],
  budget: [],
  porsi: [],
  hindari: [],
  situasi: []
};