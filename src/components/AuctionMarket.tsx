import { useState } from "react";
import { categoryLabel, whisky } from "../catalog";
import type { State } from "../engine";
import { AuctionCard } from "./Auctions";
import { Empty } from "../ui";
export default function AuctionMarket({
  state: s,
  onOpen,
}: {
  state: State;
  onOpen: (id: string) => void;
}) {
  const [category, setCategory] = useState("Wszystkie"),
    [sort, setSort] = useState("Czas do końca"),
    [watched, setWatched] = useState(false);
  const active = s.auctions.filter((a) => a.status === "active");
  const shown = active
    .filter(
      (a) =>
        (category === "Wszystkie" ||
          categoryLabel(whisky(a.product)) === category) &&
        (!watched || a.watched),
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
    <section>
      <div className="market-tools">
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
