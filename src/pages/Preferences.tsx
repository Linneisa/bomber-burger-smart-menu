import { RotateCcwIcon, SparklesIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Chip } from "../components/Chip";
import { PageTransition } from "../components/PageTransition";
import { TopBar } from "../components/TopBar";
import { usePreferences } from "../contexts/PreferenceContext";
import { chipGroups } from "../data/preferenceChips";
import { hasAnyPreference } from "../utils/recommend";

const MAX_TEXT = 200;

export function Preferences() {
  const { selections, text, toggleChip, setText, reset, startSearch } = usePreferences();
  const navigate = useNavigate();
  const ready = hasAnyPreference(selections, text);
  const chipCount = Object.values(selections).reduce((n, v) => n + v.length, 0);

  const handleSubmit = () => {
    if (!ready) return;
    startSearch();
    navigate("/hasil");
  };

  return (
    <PageTransition>
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur">
        <TopBar
          title="Bantu Aku Pilih"
          right={
          chipCount > 0 || text ?
          <button
            type="button"
            onClick={reset}
            className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
            
                <RotateCcwIcon className="h-4 w-4" aria-hidden />
                Reset
              </button> :
          null
          } />
        
      </div>

      <main className="px-5 pb-40">
        <p className="text-[15px] leading-relaxed text-ink-muted">
          Pilih yang sesuai selera kamu, atau langsung ceritakan di bawah. Semakin jelas, semakin pas rekomendasinya.
        </p>

        <div className="mt-6 space-y-6">
          {/* TODO: remove the budget filter below once price_idr is populated in bomber_burger_menu.json */}
          {chipGroups.filter((group) => group.id !== "budget").map((group) =>
          <fieldset key={group.id}>
              <legend className="flex w-full items-baseline justify-between gap-3">
                <span className="text-base font-extrabold text-ink">{group.label}</span>
                <span className="text-xs text-ink-subtle">{group.hint}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.options.map((option) =>
              <Chip
                key={option.id}
                label={option.label}
                variant={group.id === "hindari" ? "avoid" : "include"}
                selected={selections[group.id].includes(option.id)}
                onClick={() => toggleChip(group.id, option.id)} />

              )}
              </div>
            </fieldset>
          )}
        </div>

        <section className="mt-8 rounded-[20px] bg-white p-4 shadow-card" aria-labelledby="chat-label">
          <div className="flex gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-white">
              <SparklesIcon className="h-4 w-4" aria-hidden />
            </span>
            <p id="chat-label" className="rounded-2xl rounded-tl-md bg-cream px-3.5 py-2.5 text-sm leading-relaxed text-ink">
              Ada yang mau kamu ceritakan lagi? Ketik bebas aja, aku pahami kok.
            </p>
          </div>
          <div className="mt-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
              rows={3}
              aria-labelledby="chat-label"
              placeholder="Ceritakan selera kamu, misal: aku suka ayam, nggak terlalu pedas..."
              className="w-full resize-none rounded-2xl border border-cream-line bg-cream/60 px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-subtle focus:border-forest focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/20" />
            
            <p className="mt-1 text-right text-xs text-ink-subtle">
              {text.length}/{MAX_TEXT}
            </p>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto max-w-[480px] border-t border-cream-line bg-cream/95 px-5 pb-5 pt-3 backdrop-blur">
          <p className="mb-2 text-center text-xs text-ink-muted" aria-live="polite">
            {ready ?
            `${chipCount} preferensi dipilih${text.trim() ? " + cerita kamu" : ""}` :
            "Pilih minimal satu preferensi atau ceritakan selera kamu"}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!ready}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ember text-[17px] font-extrabold text-white transition-[background-color,transform,opacity] duration-150 ease-snappy hover:bg-ember-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-cream-dark disabled:text-ink-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ember/40">
            
            <SparklesIcon className="h-5 w-5" aria-hidden />
            Cari Rekomendasi
          </button>
        </div>
      </div>
    </PageTransition>);

}