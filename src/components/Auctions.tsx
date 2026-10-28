import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  Clock,
  Gavel,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { euro, whisky, productSpecs, availabilityLabel } from "../catalog";
import {
  submitBid,
  totalCost,
  bidStep,
  watchAuction,
  setBidLimit,
  watcherCount,
  type Auction,
  type State,
} from "../engine";
import { type Mutate } from "../useGame";
import { tradeContacts } from "../progression";
import { countdown, time } from "../ui";
import Hint from "./Hint";
import ProductGallery, { Modal } from "./ProductGallery";
const actor = (s: State, id: string | null) =>
  id === "player"
    ? "Ty"
    : (s.people.find((p) => p.id === id)?.name ?? "Brak ofert");
export function AuctionCard({
  auction: a,
  state: s,
  onOpen,
}: {
  auction: Auction;
  state: State;
  onOpen: () => void;
}) {
  const urgent = a.status === "active" && a.end - s.now < 30000;
  const extension = a.extensions?.at(-1);
  const recentExtension =
    extension && s.now >= extension.at && s.now - extension.at < 6000;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`auction-card ${urgent ? "urgent" : ""}`}
    >
      <div className="auction-visual">
        <ProductGallery product={a.product} compact />
        {recentExtension && (
          <motion.span
            key={a.end}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="extension-chip"
          >
            +15 SEKUND — AUKCJA PRZEDŁUŻONA!
          </motion.span>
        )}
        <span className="lot">
          PARTIA {a.id}
          {a.watched ? " · ★" : ""}
        </span>
        <span className={`auction-clock ${urgent ? "urgent" : ""}`}>
          <Clock size={13} />
          {a.status === "closed" ? "Zakończona" : countdown(a.end, s.now)}
        </span>
      </div>
      <div className="auction-info">
        <span className="eyebrow">
          {whisky(a.product).brand ?? "Johnnie Walker"} · {a.country}
        </span>
        <h3>{whisky(a.product).name}</h3>
        {(whisky(a.product).volumeMl || whisky(a.product).abv) && (
          <p className="product-specs">{productSpecs(whisky(a.product))}</p>
        )}
        <div className="auction-facts">
          <span>
            Butelka / pudełko{" "}
            <b>
              {a.bottleCondition ?? a.condition} /{" "}
              {a.boxCondition ?? a.condition}
            </b>
          </span>
          <span>
            Rzadkość <b>{whisky(a.product).market.rarity}/10</b>
          </span>
          <span>
            Obserwuje <b>{watcherCount(s, a)}</b>
          </span>
        </div>

        <div className="auction-price">
          <div>
            <small>Aktualna oferta</small>
            <AnimatePresence mode="popLayout">
              <motion.strong
                key={a.price}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {euro(a.price)}
              </motion.strong>
            </AnimatePresence>
          </div>
          <small>
            {a.bids.length} ofert
            <br />
            {actor(s, a.leader)}
          </small>
        </div>
        <div className="card-total">
          Łącznie z opłatami <b>{euro(totalCost(a))}</b>
        </div>
        {a.leader === "player" ? (
          <span className="bid-status leading">Prowadzisz</span>
        ) : a.bids.some((b) => b.actor === "player") ? (
          <span className="bid-status outbid">Zostałeś przebity</span>
        ) : null}
        <button className="outline full" onClick={onOpen}>
          {a.status === "active" ? "Wejdź do licytacji" : "Wynik aukcji"}
          <ArrowUpRight size={16} />
        </button>
      </div>
    </motion.article>
  );
}
export function AuctionRoom({
  auction: a,
  state: s,
  mutate,
  onClose,
  onNavigate,
}: {
  auction: Auction;
  state: State;
  mutate: Mutate;
  onClose: () => void;
  onNavigate?: (direction: number) => void;
}) {
  const [limit, setLimit] = useState(
    a.playerLimit === undefined ? "" : String(a.playerLimit / 100),
  );
  const [value, setValue] = useState(
      String((a.price + bidStep(a.price)) / 100),
    ),
    [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched) setValue(String((a.price + bidStep(a.price)) / 100));
  }, [a.price, touched]);
  const amount = Math.round(Number(value.replace(",", ".")) * 100),
    valid =
      Number.isSafeInteger(amount) && amount >= a.price + bidStep(a.price);
  const timeline = [
    ...a.bids.map((b) => ({
      key: `bid-${b.at}-${b.actor}-${b.amount}`,
      at: b.at,
      text: `${actor(s, b.actor)} ${b.actor === "player" ? "— Twoja oferta została przyjęta" : "podnosi ofertę"}${a.extensions?.some((e) => e.at === b.at && e.actor === b.actor) ? " · Aukcja przedłużona o 15 sekund" : ""}`,
      amount: b.amount,
    })),
    ...s.people.flatMap((p) =>
      p.memory
        .filter((m) => m.ref === a.id && ["watch", "withdraw"].includes(m.kind))
        .map((m) => ({
          key: `${p.id}-${m.kind}-${m.at}`,
          at: m.at,
          text: `${p.name} ${m.kind === "watch" ? "obserwuje aukcję" : "wycofuje się: limit ceny lub budżetu"}`,
          amount: 0,
        })),
    ),
  ].sort((x, y) => y.at - x.at);
  const pending = s.events.some(
    (e) =>
      !e.done && e.type === "bid" && e.actor === "player" && e.ref === a.id,
  );
  const urgent = a.status === "active" && a.end - s.now < 30000;
  const extension = a.extensions?.at(-1);
  const recentExtension =
    extension && s.now >= extension.at && s.now - extension.at < 6000;
  return (
    <Modal
      title={`Aukcja ${a.id}`}
      onClose={onClose}
      className={`auction-room ${urgent ? "urgent" : ""}`}
    >
      <div className="room-heading">
        <p className="eyebrow">
          SALON AUKCYJNY · PARTIA {a.id}
          {a.watched ? " · ★" : ""}
        </p>
        <h2>{whisky(a.product).name}</h2>
        <div className="room-actions">
          <button
            className="outline"
            onClick={() => mutate((g) => watchAuction(g, a.id))}
          >
            <Star size={16} fill={a.watched ? "currentColor" : "none"} />
            {a.watched ? "Obserwowana" : "Obserwuj"}
          </button>
          {onNavigate && (
            <>
              <button className="outline" onClick={() => onNavigate(-1)}>
                <ChevronLeft size={16} /> Poprzednia
              </button>
              <button className="outline" onClick={() => onNavigate(1)}>
                Następna <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="room-columns">
        <div>
          <ProductGallery product={a.product} />
          <p className="product-description">{whisky(a.product).description}</p>
          <div className="condition-strip">
            <span>
              Butelka / pudełko{" "}
              <b>
                {a.bottleCondition ?? a.condition} /{" "}
                {a.boxCondition ?? a.condition} (na 100)
              </b>
            </span>
            <span>
              Sprzedawca <b>{a.country}</b>
            </span>
          </div>{" "}
          {a.supplierContact && (
            <p className="contact-source">
              Kontakt:{" "}
              {tradeContacts.find((c) => c.id === a.supplierContact)?.name}
            </p>
          )}
          <details className="edition-data">
            <summary>Dane edycji i rynku</summary>
            <p>{productSpecs(whisky(a.product))}</p>
            <dl>
              <dt>Dostępność</dt>
              <dd>
                {availabilityLabel[whisky(a.product).market.availability]}
              </dd>
              <dt>Rzadkość kolekcjonerska</dt>
              <dd>{whisky(a.product).market.rarity}/10</dd>
              <dt>Popyt / płynność gry</dt>
              <dd>
                {whisky(a.product).market.demand} /{" "}
                {whisky(a.product).market.liquidity} (na 100)
              </dd>
              <dt>Produkcja</dt>
              <dd>
                {
                  {
                    current: "W produkcji",
                    discontinued: "Wycofana",
                    unknown: "Niepotwierdzona",
                  }[whisky(a.product).market.productionStatus]
                }
              </dd>
              <dt>Wprowadzenie</dt>
              <dd>{whisky(a.product).releaseYear ?? "Niepotwierdzone"}</dd>
              <dt>Region</dt>
              <dd>
                {whisky(a.product)
                  .market.regions.map(
                    (r) =>
                      ({
                        NL: "Holandia",
                        EU: "Europa",
                        US: "USA",
                        Global: "Globalny",
                        "Travel Retail": "Rynek podróżny",
                      })[r] ?? r,
                  )
                  .join(", ")}
              </dd>
              <dt>
                {whisky(a.product).market.retailCents !== undefined
                  ? "Zaobserwowana oferta detaliczna"
                  : "Referencja gry (szacunek)"}
              </dt>
              <dd>
                {whisky(a.product).market.retailCents === null
                  ? "Brak potwierdzonej oferty"
                  : euro(
                      whisky(a.product).market.retailCents ??
                        whisky(a.product).value,
                    )}
              </dd>
              <dt>Zweryfikowany przedział aukcyjny</dt>
              <dd>
                {whisky(a.product).market.auctionMinCents !== null &&
                whisky(a.product).market.auctionMaxCents !== null
                  ? `${euro(whisky(a.product).market.auctionMinCents!)} – ${euro(whisky(a.product).market.auctionMaxCents!)}`
                  : "Brak potwierdzonych danych"}
              </dd>
              <dt>Rodzaj źródła</dt>
              <dd>
                {{
                  retail: "Oferta sklepowa",
                  "auction-result": "Zakończona aukcja",
                  "user-report": "Zgłoszenie użytkownika",
                }[whisky(a.product).market.sourceQuote?.kind ?? ""] ??
                  "Parametr gry"}
              </dd>
              <dt>Data wyniku aukcji</dt>
              <dd>
                {whisky(a.product).market.sourceQuote?.soldAt ??
                  "Nie dotyczy / nieznana"}
              </dd>
              <dt>Weryfikacja w repozytorium źródłowym</dt>
              <dd>
                {whisky(a.product).market.lastVerified ??
                  "Niepotwierdzona zewnętrznie"}
              </dd>
            </dl>
            <p>
              {whisky(a.product).balanceNote ??
                whisky(a.product).market.estimateNote ??
                "Referencja jest parametrem gry, nie aktualną ofertą detaliczną."}
            </p>
            {whisky(a.product).market.sources.map((url) => (
              <p key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  Źródło ceny
                </a>
              </p>
            ))}
          </details>
        </div>
        <div className="bid-desk">
          <p className="eyebrow">
            {a.status === "closed" ? "WYNIK AUKCJI" : "TRWA LICYTACJA"}
          </p>
          <motion.div
            key={a.end}
            initial={
              a.extensions?.length
                ? { backgroundColor: "#b57e3e66", scale: 1.03 }
                : false
            }
            animate={{ backgroundColor: "#b57e3e00", scale: 1 }}
            className="room-timer"
          >
            <Clock size={20} />
            <span>
              {a.status === "closed" ? "Zakończona" : countdown(a.end, s.now)}
            </span>
          </motion.div>
          {recentExtension && (
            <motion.p
              key={a.end}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="extension-banner"
              role="status"
            >
              +15 SEKUND — AUKCJA PRZEDŁUŻONA!
            </motion.p>
          )}
          <small>
            {urgent
              ? "Ostatnie sekundy. Liczy się czas rejestracji oferty."
              : "Zmiana lidera w ostatnich 10 sekundach przedłuża aukcję o 15 sekund."}
          </small>
          <div className="room-price">
            <small>Aktualna oferta</small>
            <motion.strong
              key={a.price}
              initial={{ color: "#efc07a", scale: 1.025 }}
              animate={{ color: "#fff0d4", scale: 1 }}
            >
              {euro(a.price)}
            </motion.strong>
            <p>
              <span className="bidder-avatar" aria-hidden="true">
                {actor(s, a.leader).slice(0, 2).toUpperCase()}
              </span>{" "}
              Prowadzi{" "}
              <motion.b
                key={a.leader}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {actor(s, a.leader)}
              </motion.b>
            </p>
          </div>
          {a.status === "active" &&
            (a.leader === "player" ? (
              <p className="bid-status leading" role="status">
                Twoja oferta prowadzi
              </p>
            ) : a.bids.some((b) => b.actor === "player") ? (
              <p className="bid-status outbid" role="status">
                Zostałeś przebity. Prowadzi {actor(s, a.leader)}.
              </p>
            ) : null)}
          {a.status === "active" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (valid && !pending) {
                  mutate((g) => submitBid(g, a.id, amount));
                  setTouched(false);
                }
              }}
            >
              <div className="quick-bids">
                {[1, 2, 5].map((n) => (
                  <button
                    type="button"
                    className="outline"
                    key={n}
                    onClick={() => {
                      setTouched(true);
                      setValue(String((a.price + bidStep(a.price) * n) / 100));
                    }}
                  >
                    {n === 1
                      ? "Minimalne przebicie"
                      : `+${n} ${n === 2 ? "kroki" : "kroków"}`}{" "}
                    · +{euro(bidStep(a.price) * n)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="text-button custom-amount"
                onClick={() => document.getElementById("bid-amount")?.focus()}
              >
                Własna kwota
              </button>
              <label htmlFor="bid-amount">Twoja oferta (€)</label>
              <div className="bid-amount-row">
                <input
                  id="bid-amount"
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => {
                    setTouched(true);
                    setValue(e.target.value);
                  }}
                />
                <button disabled={!valid || pending || a.leader === "player"}>
                  <Gavel size={17} />
                  {pending
                    ? "Rejestrowanie…"
                    : a.leader === "player"
                      ? "Prowadzisz"
                      : "LICYTUJ"}
                </button>
              </div>
              <p className="muted">
                Krok {euro(bidStep(a.price))} · minimalna oferta{" "}
                {euro(a.price + bidStep(a.price))}
              </p>
            </form>
          )}
          <div className="bid-limit">
            <label htmlFor="bid-limit">
              Twój opcjonalny limit ceny młotkowej (€)
            </label>
            <div>
              <input
                id="bid-limit"
                inputMode="decimal"
                value={limit}
                placeholder="Bez limitu"
                onChange={(e) => setLimit(e.target.value)}
              />
              <button
                className="outline"
                onClick={() =>
                  mutate((g) =>
                    setBidLimit(
                      g,
                      a.id,
                      limit.trim()
                        ? Math.round(Number(limit.replace(",", ".")) * 100)
                        : undefined,
                    ),
                  )
                }
              >
                Zapisz limit
              </button>
            </div>
            <small>
              {a.playerLimit === undefined
                ? "Limit chroni kolejne oferty; nie jest automatyczną licytacją."
                : `Zapisany limit: ${euro(a.playerLimit)}. Prowizja i transport są dodatkowo.`}
            </small>
          </div>
          {totalCost(a, a.status === "active" && valid ? amount : a.price) >
            whisky(a.product).value && (
            <p className="purchase-risk">
              Uwaga: koszt przekracza referencję gry. Marża po wysyłce i
              prowizji może być ujemna.
            </p>
          )}
          <dl className="cost-breakdown">
            <dt>
              {a.status === "active"
                ? "Twoja proponowana oferta"
                : "Cena zwycięska"}
            </dt>
            <dd>{euro(a.status === "active" && valid ? amount : a.price)}</dd>
            <dt>Prowizja domu aukcyjnego · {Math.round(a.fee * 100)}%</dt>
            <dd>
              {euro(
                Math.round(
                  (a.status === "active" && valid ? amount : a.price) * a.fee,
                ),
              )}
            </dd>
            <dt>Transport do magazynu</dt>
            <dd>{euro(a.shipping)}</dd>
            <dt>
              Całkowity koszt zakupu{" "}
              <Hint label="Jak liczymy pełny koszt?">
                Cena młotkowa + prowizja aukcyjna + transport do magazynu.
                Wysyłkę do klienta opłacisz osobno po sprzedaży.
              </Hint>
            </dt>
            <dd>
              {euro(
                totalCost(a, a.status === "active" && valid ? amount : a.price),
              )}
            </dd>
          </dl>
        </div>
      </div>
      <div className="live-history">
        <h3>
          <i className="live-dot" />
          Historia licytacji na żywo
        </h3>
        <AnimatePresence initial={false}>
          {timeline.map((entry) => (
            <motion.div
              key={entry.key}
              initial={{ opacity: 0, x: -12, backgroundColor: "#8d63363b" }}
              animate={{ opacity: 1, x: 0, backgroundColor: "#8d633600" }}
            >
              <time>{time(entry.at)}</time>
              <span>{entry.text}</span>
              {entry.amount > 0 && <b>{euro(entry.amount)}</b>}
            </motion.div>
          ))}
        </AnimatePresence>
        {!timeline.length && (
          <p className="muted">
            Jeszcze nikt nie złożył oferty. Możesz otworzyć licytację.
          </p>
        )}
      </div>
    </Modal>
  );
}
