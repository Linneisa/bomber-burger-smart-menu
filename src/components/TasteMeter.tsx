
interface TasteMeterProps {
  label: string;
  value: number;
  tone: "spice" | "sweet" | "savory";
  variant?: "dots" | "bar";
}

const FILL: Record<TasteMeterProps["tone"], string> = {
  spice: "bg-chili",
  sweet: "bg-ember",
  savory: "bg-forest"
};

export function TasteMeter({ label, value, tone, variant = "dots" }: TasteMeterProps) {
  if (variant === "bar") {
    return (
      <div className="flex items-center gap-3">
        <span className="w-14 text-sm font-semibold text-ink">{label}</span>
        <div
          className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream-dark"
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={value}>
          
          <div className={`h-full rounded-full ${FILL[tone]}`} style={{ width: `${value / 5 * 100}%` }} />
        </div>
        <span className="w-8 text-right text-sm font-bold text-ink-muted">{value}/5</span>
      </div>);

  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-11 text-xs font-semibold text-ink-muted">{label}</span>
      <div className="flex gap-1" role="img" aria-label={`${label} ${value} dari 5`}>
        {[1, 2, 3, 4, 5].map((i) =>
        <span key={i} className={`h-1.5 w-5 rounded-full ${i <= value ? FILL[tone] : "bg-cream-dark"}`} />
        )}
      </div>
      <span className="text-xs font-bold text-ink">{value}/5</span>
    </div>);

}