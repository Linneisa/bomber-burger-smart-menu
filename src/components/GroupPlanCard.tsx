import { motion, useReducedMotion } from "framer-motion";
import { CheckIcon, ChevronDownIcon, InfoIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { usePicks } from "../contexts/PicksContext";
import { extraPhoto, splitExtras, SHAKE_PHOTOS, type ExtraPhoto } from "../data/extraPhotos";
import { menuItems } from "../data/menu";
import { PICK_TOAST_MS } from "../hooks/useSavePick";
import type { MenuItem } from "../types/menu";
import { formatRupiah } from "../utils/format";
import { BestSellerBadge } from "./BestSellerBadge";
import { FavouriteBadge } from "./FavouriteBadge";
import { PlanThumb } from "./PlanThumb";
import { PLAN_KIND_LABEL, type GroupPlan, type PlanLine } from "../utils/groupPlan";

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

interface Extra {
  label: string;
  qty: number;
  photo?: ExtraPhoto;
}

/**
 * What a set or tray holds: burgers with their menu entry (photo, detail page) and the other lines
 * with a photo where one matches (extraPhotos.ts). Lines the official menu disputes
 * (source_conflict, e.g. "1 cup saus BBQ") are left out.
 */
function contentsOf(item: MenuItem): { burgers: { menu: MenuItem; qty: number }[]; extras: Extra[] } {
  const disputed = new Set(item.source_conflict?.ingredients.map((i) => i.toLowerCase()));
  const burgers: { menu: MenuItem; qty: number }[] = [];
  const extras: Extra[] = [];
  for (const c of item.components ?? []) {
    const menu = c.burgerId ? menuItems.find((m) => m.id === c.burgerId) : undefined;
    if (menu) burgers.push({ menu, qty: c.qty });
    else if (!disputed.has(c.name.replace(/^cup\s+/i, "").toLowerCase())) {
      for (const label of splitExtras(c.name)) extras.push({ label, qty: c.qty, photo: extraPhoto(label, item.type) });
    }
  }
  return { burgers, extras };
}

/** Fixed-size tile: photo, qty badge and a two-line label underneath, so rows never jump. */
function Tile({ src, alt, label, qty }: { src: string; alt: string; label: string; qty: number }) {
  return (
    <>
      <span className="relative block">
        <PlanThumb src={src} name={alt} />
        {qty > 1 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white">
            {qty}×
          </span>
        )}
      </span>
      <span className="mt-1 line-clamp-2 block h-[26px] text-[10px] font-semibold leading-[13px] text-ink-muted group-hover:text-forest" aria-hidden>
        {label}
      </span>
    </>
  );
}

function LineBadges({ line }: { line: PlanLine }) {
  const badge = servesBadge(line.item);
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {line.item.favourite && <FavouriteBadge className="!px-2 !py-0.5" />}
      {line.item.best_seller && <BestSellerBadge className="!px-2 !py-0.5" />}
      {badge && <span className="rounded-full bg-forest-light px-2 py-0.5 text-[11px] font-semibold text-forest">{badge}</span>}
      {line.item.contents_unconfirmed && (
        <span className="rounded-full bg-sun-light px-2 py-0.5 text-[11px] font-semibold text-ink">isi dipastikan di kasir</span>
      )}
      {line.unverified && (
        <span className="rounded-full bg-sun-light px-2 py-0.5 text-[11px] font-semibold text-ink">bahan belum dipastikan</span>
      )}
    </div>
  );
}

function LinePrice({ line }: { line: PlanLine }) {
  const price = line.item.price_idr;
  return (
    <span className={`shrink-0 text-sm font-bold ${price === null ? "text-ink-muted" : "text-ink"}`}>
      {price === null ? formatRupiah(null) : formatRupiah(price * line.qty)}
    </span>
  );
}

const nameLinkClass = "rounded text-sm font-bold text-ink hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest";

/** A single burger: photo and name both open its detail page (the photo skips the tab order). */
function BurgerLine({ line }: { line: PlanLine }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <Link to={`/menu/${line.item.id}`} tabIndex={-1} aria-hidden className="shrink-0">
        <PlanThumb src={line.item.image} name={line.item.name} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/menu/${line.item.id}`} className={nameLinkClass}>
          {line.qty}× {line.item.name}
        </Link>
        <LineBadges line={line} />
      </div>
      <LinePrice line={line} />
    </li>
  );
}

/**
 * A set or tray: (tray photo,) name and price, then a row of the burgers inside (each opens its
 * page), a row of the other parts with a photo, and the parts without one as text.
 */
function PackageLine({ line }: { line: PlanLine }) {
  const { burgers, extras } = contentsOf(line.item);
  const tray = SHAKE_PHOTOS[line.item.id];
  const pictured = extras.filter((e) => e.photo);
  const textOnly = extras.filter((e) => !e.photo);
  return (
    <li className="px-3 py-2.5">
      {tray && (
        <Link to={`/menu/${line.item.id}`} tabIndex={-1} aria-hidden className="mb-2 block">
          <PlanThumb src={tray.src} name={tray.alt} className="h-28 w-full" />
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/menu/${line.item.id}`} className={nameLinkClass}>
            {line.qty}× {line.item.name}
          </Link>
          <LineBadges line={line} />
        </div>
        <LinePrice line={line} />
      </div>
      {line.qty > 1 && <p className="mt-2 text-[11px] font-semibold text-ink-subtle">Isi per paket</p>}
      {burgers.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label={`Burger di ${line.item.name}`}>
          {burgers.map(({ menu, qty }) => (
            <li key={menu.id} className="w-14">
              <Link
                to={`/menu/${menu.id}`}
                aria-label={`${qty}× ${menu.name}, lihat detail`}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
                <Tile src={menu.image} alt={menu.name} label={menu.name} qty={qty} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pictured.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-2" aria-label={`Pelengkap di ${line.item.name}`}>
          {pictured.map((e) => (
            <li key={e.label} className="w-14">
              <span className="sr-only">{e.qty}× {e.label}</span>
              <Tile src={e.photo!.src} alt={e.photo!.alt} label={e.label} qty={e.qty} />
            </li>
          ))}
        </ul>
      )}
      {textOnly.length > 0 && (
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">+ {textOnly.map((e) => (e.qty > 1 ? `${e.qty}× ${e.label}` : e.label)).join(" · ")}</p>
      )}
    </li>
  );
}

/** One menu combination for 3+ people: contents, estimated total and per-person estimate (all from code). */
export function GroupPlanCard({ plan, party, rank }: GroupPlanCardProps) {
  const reduce = useReducedMotion();
  const { picks, addMany, setQty } = usePicks();
  const [open, setOpen] = useState(rank === 0);
  const [saved, setSaved] = useState(false);
  const contentId = `plan-${plan.id}-isi`;

  // Pressing again takes back exactly what this plan added, so earlier picks of the same menu stay
  const toggle = () => {
    if (saved) {
      for (const l of plan.lines) {
        // Plans never carry Extra Beef: they add and take back the Standar variant only
        const current = picks.find((p) => p.id === l.item.id && p.size === "S")?.qty ?? 0;
        setQty(l.item.id, current - l.qty);
      }
      setSaved(false);
      toast("Paket dihapus dari Pilihanku", { duration: PICK_TOAST_MS });
      return;
    }
    addMany(plan.lines.map((l) => ({ id: l.item.id, qty: l.qty })));
    setSaved(true);
    toast.success("Ditambahkan ke Pilihanku", { duration: PICK_TOAST_MS });
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
              {plan.lines.map((l) =>
                l.item.type === "set" || l.item.type === "bomber_shake" ? (
                  <PackageLine key={l.item.id} line={l} />
                ) : (
                  <BurgerLine key={l.item.id} line={l} />
                )
              )}
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
          onClick={toggle}
          aria-pressed={saved}
          aria-label={saved ? `Paket ada di Pilihanku, ketuk untuk menghapus` : `Tambah paket untuk ${party} orang ke Pilihanku`}
          className={`mt-4 flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[15px] font-bold transition-[background-color,color,transform] duration-150 ease-snappy active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 ${
            saved ? "border border-forest bg-forest-light text-forest" : "bg-forest text-white hover:bg-forest-dark"
          }`}>
          {saved ? <CheckIcon className="h-5 w-5 shrink-0" aria-hidden /> : <PlusIcon className="h-5 w-5 shrink-0" aria-hidden />}
          {saved ? "Paket ada di Pilihanku" : "Tambah paket ke Pilihanku"}
        </button>
      </div>
    </motion.article>
  );
}
