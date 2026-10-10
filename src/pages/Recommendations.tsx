import React, { useEffect } from "react";
import { ArrowRightIcon, InfoIcon, SlidersHorizontalIcon } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AiLoading } from "../components/AiLoading";
import { PageTransition } from "../components/PageTransition";
import { RecommendationCard } from "../components/RecommendationCard";
import { TopBar } from "../components/TopBar";
import { usePreferences } from "../contexts/PreferenceContext";
import { chipGroups } from "../data/preferenceChips";

const LOADING_MS = 2400;

export function Recommendations() {
  const { status, results, finishSearch, selections, text } = usePreferences();
  const navigate = useNavigate();

  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(finishSearch, LOADING_MS);
    return () => clearTimeout(timer);
  }, [status, finishSearch]);

  if (status === "idle") return <Navigate to="/preferensi" replace />;

  const summary = chipGroups.flatMap((group) =>
  group.options.
  filter((o) => selections[group.id].includes(o.id)).
  map((o) => group.id === "hindari" ? `Tanpa ${o.label.toLowerCase()}` : o.label)
  );

  return (
    <PageTransition>
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur">
        <TopBar title={status === "loading" ? "Mencari rekomendasi" : "Rekomendasi AI"} fallback="/preferensi" />
      </div>

      {status === "loading" || !results ?
      <AiLoading duration={LOADING_MS} /> :

      <main className="px-5 pb-[calc(8rem+env(safe-area-inset-bottom,0px))]">
          <h2 className="text-2xl font-extrabold leading-tight text-ink">
            {results.length ? `${results.length} menu paling cocok buat kamu` : "Belum ada menu yang cocok"}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {summary.map((label) =>
          <span key={label} className="rounded-full bg-forest-light px-2.5 py-1 text-xs font-semibold text-forest">
                {label}
              </span>
          )}
            {text.trim() &&
          <span className="max-w-full truncate rounded-full bg-white px-2.5 py-1 text-xs italic text-ink-muted">
                “{text.trim()}”
              </span>
          }
            <Link
            to="/preferensi"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-ember-dark hover:text-ember">
            
              <SlidersHorizontalIcon className="h-3.5 w-3.5" aria-hidden />
              Ubah
            </Link>
          </div>

          {/* Bawang warning: almost every burger contains caramelized onion */}
          {selections.hindari.includes("bawang") && results.length < 3 && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-sun-light px-4 py-3 text-sm text-ink">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink" aria-hidden />
              <span>
                Hampir semua burger kami memakai caramelized onion.{" "}
                <strong>Tanyakan ke kasir apakah bisa request tanpa bawang.</strong>
              </span>
            </div>
          )}

          {results.length === 0 ? (
            <div className="mt-8 rounded-[20px] bg-white p-6 text-center shadow-card">
              <p className="font-bold text-ink">Preferensi kamu terlalu ketat</p>
              <p className="mt-1 text-sm text-ink-muted">
                Semua menu mengandung bahan yang ingin kamu hindari. Coba longgarkan sedikit pilihanmu.
              </p>
              <button
                type="button"
                onClick={() => navigate("/preferensi")}
                className="mt-4 h-12 rounded-2xl bg-forest px-5 text-sm font-bold text-white hover:bg-forest-dark">
                Ubah preferensi
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {results.map((rec, i) => (
                <RecommendationCard key={rec.item.id} recommendation={rec} rank={i} />
              ))}
            </div>
          )}

          {results.length > 0 &&
        <section className="mt-8 rounded-[20px] bg-forest p-5 text-white" aria-labelledby="puas-heading">
              <h3 id="puas-heading" className="text-lg font-extrabold">
                Sudah puas dengan rekomendasinya?
              </h3>
              <p className="mt-1 text-sm text-white/80">Menu yang kamu simpan bisa langsung ditunjukkan ke kasir.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
              type="button"
              onClick={() => navigate("/preferensi")}
              className="h-12 rounded-2xl border border-white/30 px-3 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              
                  Belum, ubah preferensi
                </button>
                <button
              type="button"
              onClick={() => navigate("/pilihanku")}
              className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-ember px-3 text-sm font-extrabold text-white transition-colors duration-150 hover:bg-ember-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              
                  Ya, lanjut
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </section>
        }
        </main>
      }
    </PageTransition>);

}