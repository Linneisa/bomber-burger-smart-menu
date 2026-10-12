import { motion, useReducedMotion } from "framer-motion";
import { BookmarkIcon, CheckIcon, ChevronDownIcon, InfoIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usePicks } from "../contexts/PicksContext";
import type { MenuItem } from "../types/menu";
import { formatRupiah } from "../utils/format";
import { PLAN_KIND_LABEL, type GroupPlan } from "../utils/groupPlan";

interface GroupPlanCardProps {
  plan: GroupPlan;
  party: number;
  rank: number;
}

/** "isi 4 burger" for a Bomber Shake, "2 porsi" for Set C/D; nothing for single items. */
function servesBadge(item: MenuItem): string | null {
  if (item.type === "bomber_shake") return `isi ${item.serves} burger`;
  if (item.serves > 1) return `${item.serves} porsi`;
  return null;
}

/** One menu combination for 3+ people: contents, estimated total and per-person estimate (all from code). */
export function GroupPlanCard({ plan, party, rank }: GroupPlanCardProps) {
  const reduce = useReducedMotion();
  const { addMany } = usePicks();
  const navigate = useNavigate();
  const [open, setOpen] = useState(rank === 0);
  const [saved, setSaved] = useState(false);
  const contentId = `plan-${plan.id}-isi`;

  const save = () => {
    addMany(plan.lines.map((l) => ({ id: l.item.id, qty: l.qty })));
    setSaved(true);
    toast.success(`Paket untuk ${party} orang disimpan ke Pilihanku`, {
      action: { label: "Lihat", onClick: () => navigate("/pilihanku") },
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: rank * 0.06, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden rounded-[20px] bg-white shadow-card">
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {rank === 0 && <span className="rounded-full bg-sun px-2.5 py-1 text-[11px] font-extrabold text-ink">Paling cocok</span>}
          {plan.unverified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sun-light px-2.5 py-1 text-[11px] font-semibold text-ink">
              <InfoIcon className="h-3 w-3" aria-hidden />
              Ada bahan yang belum dipastikan
            </span>
          )}
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h3 className="text-lg font-extrabold leading-snug text-ink">{PLAN_KIND_LABEL[plan.kind]}</h3>
          <div className="shrink-0 text-right">
            <p className="text-base font-extrabold text-forest">{formatRupiah(plan.total)}</p>
            <p className="text-xs font-semibold text-ink-muted">± {formatRupiah(plan.perPerson)}/orang</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={contentId}
          className="mt-2 flex w-full items-center justify-between gap-2 rounded-xl text-left text-sm text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
          <span className="line-clamp-1">
            {plan.lines.map((l) => `${l.qty}× ${l.item.name}`).join(", ")}
          </span>
          <span className="flex shrink-0 items-center gap-0.5 font-bold text-ember-dark">
            {open ? "Tutup" : "Lihat isi"}
            <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
          </span>
        </button>

        {open && (
          <div id={contentId}>
            <ul className="mt-3 divide-y divide-cream-line rounded-2xl border border-cream-line">
              {plan.lines.map((l) => {
                const badge = servesBadge(l.item);
                return (
                  <li key={l.item.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <Link
                        to={`/menu/${l.item.id}`}
                        className="text-sm font-bold text-ink hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded">
                        {l.qty}× {l.item.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {badge && (
                          <span className="rounded-full bg-forest-light px-2 py-0.5 text-[11px] font-semibold text-forest">{badge}</span>
                        )}
                        {l.item.contents_unconfirmed && (
                          <span className="rounded-full bg-sun-light px-2 py-0.5 text-[11px] font-semibold text-ink">isi dipastikan di kasir</span>
                        )}
                        {l.unverified && (
                          <span className="rounded-full bg-sun-light px-2 py-0.5 text-[11px] font-semibold text-ink">bahan belum dipastikan</span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${l.item.price_idr === null ? "text-ink-muted" : "text-ink"}`}>
                      {l.item.price_idr === null ? formatRupiah(null) : formatRupiah(l.item.price_idr * l.qty)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {plan.leftover > 0 && (
              <p className="mt-2 text-xs text-ink-muted">Cukup untuk {plan.serves} porsi.</p>
            )}

            <div className="mt-4 rounded-2xl bg-forest-light p-3.5">
              <p className="flex items-center gap-1.5 text-sm font-bold text-forest">
                <SparklesIcon className="h-4 w-4" aria-hidden />
                Kenapa paket ini
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{plan.reason}</p>
            </div>

            <div className="mt-4 rounded-2xl bg-cream px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold text-ink">Perkiraan total</span>
                <span className="text-base font-extrabold text-forest">{formatRupiah(plan.total)}</span>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-3">
                <span className="text-sm text-ink-muted">Perkiraan per orang ({party} orang)</span>
                <span className="text-sm font-bold text-ink">± {formatRupiah(plan.perPerson)}</span>
              </div>
              <p className="mt-1.5 text-xs text-ink-muted">
                Dari harga satuan menu{plan.unpriced > 0 ? `, belum termasuk ${plan.unpriced} menu tanpa harga` : ""}. Harga final di kasir.
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saved}
          className={`mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold transition-[background-color,color,transform] duration-150 ease-snappy active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 ${
            saved ? "border border-forest bg-white text-forest" : "bg-forest text-white hover:bg-forest-dark"
          }`}>
          {saved ? <CheckIcon className="h-5 w-5" aria-hidden /> : <BookmarkIcon className="h-5 w-5" aria-hidden />}
          {saved ? "Paket tersimpan" : "Simpan paket ke Pilihanku"}
        </button>
      </div>
    </motion.article>
  );
}
