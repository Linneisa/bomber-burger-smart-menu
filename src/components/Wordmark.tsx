
interface WordmarkProps {
  size?: "sm" | "md" | "lg";
}

/** Official logo image, shown as-is. Dark green, so it needs a light background. */
export function Wordmark({ size = "sm" }: WordmarkProps) {
  return (
    <img
      src="/images/logo-bomber-burger.png"
      alt="Bomber Burger"
      className={`w-auto object-contain ${size === "lg" ? "h-[88px]" : size === "md" ? "h-14" : "h-10"}`}
    />);

}

export function HalalBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-sun px-2.5 py-1 text-[11px] font-bold text-ink whitespace-nowrap">
      100% Beef • 100% Halal
    </span>);

}
