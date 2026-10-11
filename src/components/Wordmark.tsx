
interface WordmarkProps {
  tone?: "light" | "dark";
  size?: "sm" | "lg";
}

export function Wordmark({ tone = "dark", size = "sm" }: WordmarkProps) {
  const base = tone === "light" ? "text-white" : "text-forest";
  return (
    <span
      className={`font-extrabold tracking-tight leading-none ${size === "lg" ? "text-2xl" : "text-lg"} ${base}`}
      aria-label="Bomber Burger">
      
      BOMBER<span className="text-ember"> BURGER</span>
    </span>);

}

export function HalalBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-sun px-2.5 py-1 text-[11px] font-bold text-ink whitespace-nowrap">
      100% Beef • 100% Halal
    </span>);

}