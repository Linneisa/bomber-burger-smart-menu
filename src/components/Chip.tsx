import { CheckIcon, XIcon } from "lucide-react";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: "include" | "avoid";
}

export function Chip({ label, selected, onClick, variant = "include" }: ChipProps) {
  const selectedClass =
  variant === "avoid" ? "border-chili bg-chili-light text-chili" : "border-forest bg-forest text-white";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-snappy active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
      selected ? selectedClass : "border-cream-line bg-white text-ink hover:border-forest/40"}`
      }>
      
      {selected && (variant === "avoid" ? <XIcon className="h-4 w-4" aria-hidden /> : <CheckIcon className="h-4 w-4" aria-hidden />)}
      {label}
    </button>);

}