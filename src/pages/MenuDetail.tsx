import { ArrowLeftIcon, BookmarkIcon, CheckIcon, CircleAlertIcon, InfoIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BestSellerBadge } from "../components/BestSellerBadge";
import { MenuImage } from "../components/MenuImage";
import { PageTransition } from "../components/PageTransition";
import { usePicks } from "../contexts/PicksContext";
import { categoryLabels, menuItems } from "../data/menu";
import { useGoBack } from "../hooks/useGoBack";
import { useSavePick } from "../hooks/useSavePick";
import { formatRupiah, formatSetPrice, joinIndonesian } from "../utils/format";

export function MenuDetail() {
  const { id } = useParams();
  const item = menuItems.find((m) => m.id === id);
  const { isPicked, picks } = usePicks();
  const toggle = useSavePick();
  const goBack = useGoBack("/menu");
  const navigate = useNavigate();

  if (!item) {
    return (
      <PageTransition>
        <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
          <p className="text-lg font-extrabold text-ink">Menu tidak ditemukan</p>
          <p className="mt-1 text-sm text-ink-muted">Mungkin menu ini sudah tidak tersedia.</p>
          <Link to="/menu" className="mt-4 rounded-2xl bg-forest px-5 py-3 text-sm font-bold text-white">
            Lihat semua menu
          </Link>
        </div>
      </PageTransition>
    );
  }

  const saved = isPicked(item.id);
  const isShake = item.type === "bomber_shake";
  const isSet = item.type === "set";
  const isSide = item.type === "side";

  return (
    <PageTransition>
      <div className="relative aspect-[4/3] w-full bg-white">
        <MenuImage
          src={item.image}
          name={item.name}
          className="h-full w-full object-contain"
        />
        <button
          type="button"
          onClick={goBack}
          aria-label="Kembali"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-card active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
      </div>

      <main className="relative -mt-6 rounded-t-[28px] bg-cream px-5 pb-36 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-ember-dark">{categoryLabels[item.type]}</p>
          {item.best_seller && <BestSellerBadge />}
        </div>

        <div className="mt-1 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-extrabold leading-tight text-ink">{item.name}</h1>
          <span className={`shrink-0 pt-1 text-lg font-extrabold ${item.price_idr === null ? "text-ink-muted" : "text-forest"}`}>
            {formatRupiah(item.price_idr)}
          </span>
        </div>
        {formatSetPrice(item.set_price_idr) && (
          <p className="mt-1 text-sm font-semibold text-ink-muted">{formatSetPrice(item.set_price_idr)}</p>
        )}

        {/* Bomber Shake notice */}
        {isShake && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-sun-light px-4 py-3 text-sm text-ink">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink" aria-hidden />
            <span><strong>Nampan sharing, bukan minuman.</strong> Berisi beberapa burger + kentang + saus untuk dinikmati bersama.</span>
          </div>
        )}

        {/* Profil rasa */}
        {(item.taste_draft.length > 0 || item.spicy) && (
          <section className="mt-6 rounded-[20px] bg-white p-4 shadow-card" aria-labelledby="rasa-heading">
            <h2 id="rasa-heading" className="text-base font-extrabold text-ink">Profil rasa</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {item.taste_draft.map((tag) => (
                <li key={tag} className="rounded-full bg-forest-light px-3 py-1.5 text-sm font-semibold text-forest capitalize">
                  {tag}
                </li>
              ))}
              {item.spicy && (
                <li className="rounded-full bg-chili-light px-3 py-1.5 text-sm font-semibold text-chili">Pedas</li>
              )}
            </ul>
          </section>
        )}

        {/* Bahan utama */}
        {item.ingredients.length > 0 && (
          <section className="mt-7" aria-labelledby="bahan-heading">
            <h2 id="bahan-heading" className="text-base font-extrabold text-ink">Bahan utama</h2>
            {item.patty_count && item.patty_count > 1 && (
              <p className="mb-2 text-xs text-ink-muted">{item.patty_count} patty beef</p>
            )}
            <ul className="mt-3 flex flex-wrap gap-2">
              {item.ingredients.map((ing) => (
                <li key={ing} className="rounded-full border border-cream-line bg-white px-3 py-1.5 text-sm text-ink">
                  {ing}
                </li>
              ))}
            </ul>
            {item.contains.length > 0 && (
              <p className="mt-4 flex items-start gap-2 text-sm text-ink-muted">
                <CircleAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-ember-dark" aria-hidden />
                Mengandung {joinIndonesian(item.contains)}.
              </p>
            )}
          </section>
        )}

        {/* Set contents */}
        {isSet && item.items && (
          <section className="mt-6" aria-labelledby="isi-heading">
            <h2 id="isi-heading" className="text-base font-extrabold text-ink">Isi paket</h2>
            <ul className="mt-3 space-y-2">
              {item.items.map((it) => (
                <li key={it} className="flex items-start gap-2.5 text-sm text-ink">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" aria-hidden />
                  {it}
                </li>
              ))}
            </ul>
            {item.chicken_flavor_options && item.chicken_flavor_options.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-extrabold text-ink">Pilihan saus ayam</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {item.chicken_flavor_options.map((f) => (
                    <li
                      key={f.name}
                      className="rounded-full border border-cream-line bg-white px-3 py-1.5 text-sm text-ink"
                      title={f.detail}>
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Bomber Shake contents */}
        {isShake && item.items && (
          <section className="mt-6" aria-labelledby="nampan-heading">
            <h2 id="nampan-heading" className="text-base font-extrabold text-ink">Isi nampan</h2>
            <ul className="mt-3 space-y-2">
              {item.items.map((it) => (
                <li key={it} className="flex items-start gap-2.5 text-sm text-ink">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" aria-hidden />
                  {it}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Side dish description */}
        {isSide && item.description && (
          <section className="mt-6">
            <p className="text-[15px] leading-relaxed text-ink">{item.description}</p>
            {item.contains.length > 0 && (
              <p className="mt-4 flex items-start gap-2 text-sm text-ink-muted">
                <CircleAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-ember-dark" aria-hidden />
                Mengandung {joinIndonesian(item.contains)}.
              </p>
            )}
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto flex max-w-[480px] gap-3 border-t border-cream-line bg-cream/95 px-5 pb-5 pt-3 backdrop-blur">
          <button
            type="button"
            onClick={() => navigate("/pilihanku")}
            aria-label={`Buka Pilihanku, ${picks.length} menu tersimpan`}
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cream-line bg-white text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
            <BookmarkIcon className="h-5 w-5" aria-hidden />
            {picks.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-ember px-1.5 text-xs font-extrabold text-white">
                {picks.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => toggle(item)}
            aria-pressed={saved}
            className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-base font-extrabold transition-[background-color,color,transform] duration-150 ease-snappy active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest/30 ${
              saved ? "border border-forest bg-white text-forest" : "bg-forest text-white hover:bg-forest-dark"
            }`}>
            {saved ? <CheckIcon className="h-5 w-5" aria-hidden /> : <BookmarkIcon className="h-5 w-5" aria-hidden />}
            {saved ? "Tersimpan di Pilihanku" : "Simpan ke Pilihanku"}
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
