import "./AuctionMarket.css";
import { useState } from "react";
import { categoryLabel, whisky, euro } from "../catalog";
import type { State } from "../engine";
import { AuctionCard } from "./Auctions";
import { auctionSignals } from "../auctionSignals";
import { countdown } from "../ui";
import { Clock, Flame, Star } from "lucide-react";
import { Empty } from "../ui";
export default function AuctionMarket({
  state: s,
  onOpen,
}: {
  state: State;
  onOpen: (id: string) => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState("Wszystkie"),
    [sort, setSort] = useState("Czas do końca"),
    [watched, setWatched] = useState(false),
    [quick, setQuick] = useState("Wszystkie");
  const active = s.auctions.filter((a) => a.status === "active");
  const shown = active
    .filter(
      (a) =>
        (category === "Wszystkie" ||
          categoryLabel(whisky(a.product)) === category) &&
        (!watched || a.watched) &&
        (quick === "Wszystkie" ||
          (quick === "Kończące się" && a.end - s.now <= 120000) ||
          (quick === "Obserwowane" && a.watched) ||
          (quick === "Tanie" && a.price <= 5000) ||
          (quick === "Rzadkie" && whisky(a.product).market.rarity >= 7) ||
          (quick === "Vintage" && whisky(a.product).category === "vintage") ||
          (quick === "Limitowane" &&
            (categoryLabel(whisky(a.product)) === "Limitowane opakowania" ||
              whisky(a.product).market.availability === "limited")) ||
          (quick === "Nowo dodane" && s.now - (a.createdAt ?? 0) <= 120000)),
    )
    .sort((a, b) =>
      sort === "Cena rosnąco"
        ? a.price - b.price
        : sort === "Cena malejąco"
          ? b.price - a.price
          : sort === "Rzadkość"
            ? whisky(b.product).rarity - whisky(a.product).rarity
            : sort === "Najnowsze"
              ? (b.createdAt ?? 0) - (a.createdAt ?? 0)
              : a.end - b.end,
    );
  return (
    <section className="market43">
      <p className="market-intro">Przeglądaj partie, obserwuj okazje i dołącz do konkretnej sali licytacyjnej.</p>
      {quick === "Wszystkie" && category === "Wszystkie" && !watched && active.length > 0 && <section className="market-spotlights" aria-label="Wyróżnione aukcje"><h2>Na parkiecie <span>{active.length} aktywnych partii</span></h2><div>{active.slice().sort((a,b) => a.end-b.end).slice(0,3).map(a => {
        const signals=auctionSignals(a,s.now), tag=signals.includes("Kończy się") ? "Kończy się" : signals.includes("Gorąca") ? "Gorąca aukcja" : signals.includes("Rzadka") ? "Rzadka okazja" : "Najbliższy finał", Icon=signals.includes("Gorąca") ? Flame : signals.includes("Rzadka") ? Star : Clock;
        return <button key={a.id} onClick={() => onOpen(a.id)}><Icon size={18}/><span><small>{tag}</small><strong>{whisky(a.product).name}</strong><em>{euro(a.price)} · {countdown(a.end,s.now)}</em></span></button>;
      })}</div></section>}
      <div className="market-chips" aria-label="Szybkie filtry">
        {[
          "Wszystkie",
          "Kończące się",
          "Obserwowane",
          "Rzadkie",
          "Nowo dodane",
        ].map((label) => (
          <button
            key={label}
            aria-pressed={quick === label}
            className={quick === label ? "selected" : "outline"}
            onClick={() => setQuick(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        className="filter-toggle outline"
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen(!filtersOpen)}
      >
        Filtry i sortowanie{" "}
        <span>
          {shown.length}/{active.length}
        </span>
      </button>
      <div className={`market-tools ${filtersOpen ? "expanded" : "collapsed"}`}>
        <label>
          Kategoria
          <select
            aria-label="Kategoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {[
              "Wszystkie",
              "Standardowe wydania",
              "Wycofane edycje",
              "Vintage",
              "Blue Label",
              "Ghost & Rare",
              "Travel Retail",
              "Limitowane opakowania",
              "Historyczne edycje",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Sortowanie
          <select
            aria-label="Sortowanie"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {[
              "Czas do końca",
              "Cena rosnąco",
              "Cena malejąco",
              "Rzadkość",
              "Najnowsze",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="watch-filter">
          <input
            type="checkbox"
            checked={watched}
            onChange={(e) => setWatched(e.target.checked)}
          />{" "}
          Tylko obserwowane
        </label>
        <span>
          {shown.length} / {active.length} aktywnych
        </span>
      </div>
      <div className="auction-grid">
        {shown.map((a) => (
          <AuctionCard
            key={a.id}
            auction={a}
            state={s}
            onOpen={() => onOpen(a.id)}
          />
        ))}
      </div>
      {!shown.length && (
        <Empty text="Brak aukcji dla tych filtrów. Zmień kategorię lub wróć za chwilę — rynek uzupełnia się regularnie." />
      )}
      <details className="auction-archive">
        <summary>Ostatnie zakończone aukcje</summary>
        <div className="auction-grid">
          {s.auctions
            .filter((a) => a.status === "closed")
            .slice(-20)
            .reverse()
            .map((a) => (
              <AuctionCard
                key={a.id}
                auction={a}
                state={s}
                onOpen={() => onOpen(a.id)}
              />
            ))}
        </div>
      </details>
    </section>
  );
}
