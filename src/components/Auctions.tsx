import { useEffect, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  Clock,
  Gavel,
  Star,
  ChevronLeft,
  ChevronRight,
  Zap,
  Trophy,
  Package,
  ShieldCheck,
} from "lucide-react";
import { euro, whisky, productSpecs, availabilityLabel } from "../catalog";
import {
  submitBid,
  totalCost,
  cash,
  held,
  bidStep,
  watchAuction,
  activateProxy,
  disableProxy,
  watcherCount,
  type Auction,
  type State,
} from "../engine";
import type { Mutate } from "../useGame";
import { countdown, time, date, labels } from "../ui";
import ProductGallery, { Modal } from "./ProductGallery";
import Hint from "./Hint";
import AuctionRivals from "./AuctionRivals";
import { SoundToggle, unlockAudio, useAuctionAudio } from "../auctionAudio";
import "./AuctionRoom42.css";
import "./AuctionRoom43.css";
import Brand from "./Brand";
import { auctionSignals } from "../auctionSignals";
import { shopLevel } from "../progression";
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
  const urgent = a.status === "active" && a.end - s.now < 30000,
    last = a.extensions?.at(-1),
    recent = last && s.now - last.at < 6000;
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`auction-card ${urgent ? "urgent" : ""} ${a.leader === "player" ? "player-leading" : ""} ${a.special ? "special-lot" : ""}`}
    >
      <div className="auction-visual">
        <ProductGallery product={a.product} compact />
        <span className="rarity-chip">
          <Star size={12} />
          {whisky(a.product).rarity}/10
        </span>
        {a.watched && <span className="watched-chip">★</span>}
        {a.special && <span className="special-chip">Z sieci kontaktów</span>}
        <span className={`auction-clock ${urgent ? "urgent" : ""}`}>
          <Clock size={14} />
          {a.status === "closed" ? "Zakończona" : countdown(a.end, s.now)}
          {recent && (
            <motion.b
              key={a.end}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="clock-added"
            >
              +15 s
            </motion.b>
          )}
        </span>
      </div>
      <div className="auction-info">
        {a.status === "active" && <div className="lot-badges">{auctionSignals(a,s.now).map(label => <span key={label} className={label === "Kończy się" ? "ending" : ""}>{label}</span>)}</div>}
        <h3>{whisky(a.product).name}</h3>
        {(whisky(a.product).volumeMl || whisky(a.product).abv) && (
          <p className="product-specs">{productSpecs(whisky(a.product))}</p>
        )}
        <div className="auction-price">
          <AnimatePresence mode="popLayout">
            <motion.strong
              key={a.price}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {euro(a.price)}
            </motion.strong>
          </AnimatePresence>
          <span className="bid-competitor">
            {a.leader && (
              <span className="bidder-avatar" aria-hidden="true">
                {actor(s, a.leader).slice(0, 2).toUpperCase()}
              </span>
            )}
            <small>{a.bids.length} ofert</small>
          </span>
        </div>
        <div className="card-total">
          Z opłatami <b>{euro(totalCost(a))}</b>
        </div>
        <div className="card-bid-state">
          {a.leader === "player" ? (
            <span className="bid-status leading">
              <ShieldCheck size={13} />
              Prowadzisz
            </span>
          ) : a.bids.some((b) => b.actor === "player") ? (
            <span className="bid-status outbid">Przebity</span>
          ) : (
            <span className="muted">
              {a.leader ? "Trwa licytacja" : "Czeka na pierwszą ofertę"}
            </span>
          )}
          {a.proxyActive && a.status === "active" && (
            <span className="auto-chip">
              <Zap size={12} />
              Automat
            </span>
          )}
        </div>
        <button className="outline full" onClick={onOpen}>
          {a.status === "active" ? "Wejdź do licytacji" : "Wynik aukcji"}
          <ArrowUpRight size={16} />
        </button>
      </div>
    </motion.article>
  );
}
const proxyMessage = (a: Auction) =>
  a.proxyStatus === "limit"
    ? "Przebity ponad limit"
    : a.proxyStatus === "funds"
      ? "Czeka na wolną gotówkę"
      : a.proxyStatus === "capacity"
        ? "Czeka na miejsce w magazynie"
        : a.proxyStatus === "late"
          ? "Nie zdążył zarejestrować oferty"
          : a.leader === "player"
            ? "Twoja oferta prowadzi"
            : "Czuwa nad aukcją";
export function AuctionRoom({
  auction: a,
  state: s,
  mutate,
  onClose,
  onNavigate,
  onBackToMarket,
  onWarehouse,
}: {
  auction: Auction;
  state: State;
  mutate: Mutate;
  onClose: () => void;
  onNavigate?: (direction: number) => void;
  onBackToMarket?: () => void;
  onWarehouse?: () => void;
}) {
  useAuctionAudio(a, s.now);
  const [historyOpen, setHistoryOpen] = useState(() => window.innerWidth > 700);
  const [limit, setLimit] = useState(
    a.playerLimit === undefined ? "" : String(a.playerLimit / 100),
  );
  const [value, setValue] = useState(
      String((a.price + bidStep(a.price)) / 100),
    ),
    [touched, setTouched] = useState(false),
    [confirmProxy, setConfirmProxy] = useState(false);
  useEffect(() => {
    if (!touched) setValue(String((a.price + bidStep(a.price)) / 100));
  }, [a.price, touched]);
  useEffect(() => setConfirmProxy(false), [limit]);
  const amount = Math.round(Number(value.replace(",", ".")) * 100),
    valid =
      Number.isSafeInteger(amount) && amount >= a.price + bidStep(a.price),
    max = Math.round(Number(limit.replace(",", ".")) * 100),
    validLimit = Number.isSafeInteger(max) && max > 0;
  const active = a.status === "active",
    won = !active && a.leader === "player",
    unsold = !active && !a.leader,
    urgent = active && a.end - s.now < 30000,
    last = a.extensions?.at(-1),
    recent = last && s.now - last.at < 6000;
  const pending = s.events.some(
    (e) =>
      !e.done && e.type === "bid" && e.actor === "player" && e.ref === a.id,
  );
  const item = s.items.find((i) => i.auctionId === a.id),
    lastOffer = a.bids.filter((b) => b.actor === "player").at(-1);
  const timeline = [
    ...a.bids.map((b) => ({
      key: `bid-${b.at}-${b.actor}-${b.amount}`,
      at: b.at,
      text: `${actor(s, b.actor)} ${b.actor === "player" ? "— Twoja oferta została przyjęta" : "podnosi ofertę"}${b.automatic ? " · automat" : ""}${b.priority ? " · pierwszeństwo wcześniejszego limitu" : ""}${a.extensions?.some((e) => e.at === b.at && e.actor === b.actor) ? " · Aukcja przedłużona o 15 sekund" : ""}`,
      amount: b.amount,
    })),
    ...s.people.flatMap((p) =>
      p.memory
        .filter((m) => m.ref === a.id && ["watch", "withdraw"].includes(m.kind))
        .map((m) => ({
          key: `${p.id}-${m.kind}-${m.at}`,
          at: m.at,
          text: `${p.name} ${m.kind === "watch" ? "obserwuje aukcję" : "wycofuje się"}`,
          amount: 0,
        })),
    ),
  ]
    .sort((x, y) => y.at - x.at)
    .slice(0, 80);
  const w = whisky(a.product);
  return (
    <Modal
      title={`Aukcja ${a.id}`}
      onClose={onClose}
      className={`auction-room auction-room42 auction-room43 ${a.leader === "player" ? "room-player-leading" : ""} ${active && a.end-s.now<=10000 ? "room-final-seconds" : ""} ${urgent ? "urgent" : ""} ${!active ? "finished-room" : ""}`}
    >
      <div className="auction-scenery" aria-hidden="true" style={{"--room-scene": `url("${new URL(`${import.meta.env.BASE_URL}game-art/auction-room.png`, document.baseURI).href}")`} as CSSProperties}><img src={`${import.meta.env.BASE_URL}game-art/auction-room.png`} alt="" width="1672" height="941" fetchPriority="high" /></div>
      <div className="room-session"><Brand small /><span>DOM AUKCYJNY<small>Sala pojedynczej aukcji</small></span><div><span>Wolna gotówka <b>{euro(cash(s)-held(s))}</b></span><span>Reputacja <b>{s.reputation}/100</b></span><span>Poziom <b>{shopLevel(s)}</b></span></div></div>
      <div className="room-heading">
        <p className="eyebrow">
          {active
            ? "SALON AUKCYJNY"
            : won
              ? "TWOJA NOWA ZDOBYCZ"
              : "WYNIK LICYTACJI"}
          {a.special ? " · AUKCJA SPECJALNA" : ""}
        </p>
        <div className="room-actions">
          <button className="outline" onClick={onBackToMarket ?? onClose}><ChevronLeft size={16} />Powrót do rynku</button>
          <SoundToggle />
          {active && (
            <button
              className="outline"
              onClick={() => mutate((g) => watchAuction(g, a.id))}
            >
              <Star size={16} fill={a.watched ? "currentColor" : "none"} />
              {a.watched ? "Obserwowana" : "Obserwuj"}
            </button>
          )}
          {onNavigate && active && (
            <>
              <button className="outline" onClick={() => onNavigate(-1)}>
                <ChevronLeft size={16} />
                Poprzednia
              </button>
              <button className="outline" onClick={() => onNavigate(1)}>
                Następna
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      {active && <div className="room-mobile-status" aria-label="Skrót licytacji"><strong>{euro(a.price)}</strong><span>{countdown(a.end,s.now)}</span><button type="button" onClick={() => document.getElementById("bid-amount")?.focus()}>Do ofert</button></div>}
      <div className="room-columns">
        <div className="auction-object">
          <span className="object-label">Licytowany egzemplarz</span>
          <ProductGallery product={a.product} />
          <p className="product-description">{w.description}</p>
          <div className="condition-strip">
            <span>
              Butelka <b>{a.bottleCondition ?? a.condition}/100</b>
            </span>
            <span>
              Pudełko <b>{a.boxCondition ?? a.condition}/100</b>
            </span>
          </div>
          <details className="edition-data">
            <summary>Poznaj ten egzemplarz</summary>
            <p>{productSpecs(w)}</p>
            <dl>
              <dt>Edycja / seria</dt>
              <dd>{w.series ?? w.name}</dd>
              <dt>Wiek</dt>
              <dd>
                {w.ageStatement
                  ? `${w.ageStatement} lat`
                  : w.ageStatus === "nas"
                    ? "Bez deklaracji wieku"
                    : "Nieznany"}
              </dd>
              <dt>Wprowadzenie</dt>
              <dd>{w.releaseYear ?? "Niepotwierdzone"}</dd>
              <dt>Produkcja</dt>
              <dd>
                {
                  {
                    current: "W produkcji",
                    discontinued: "Wycofana",
                    unknown: "Niepotwierdzona",
                  }[w.market.productionStatus]
                }
              </dd>
              <dt>Dostępność</dt>
              <dd>{availabilityLabel[w.market.availability]}</dd>
              <dt>Rzadkość</dt>
              <dd>{w.rarity}/10</dd>
              <dt>Region wydania</dt>
              <dd>
                {w.salesMarket ??
                  w.market.regions
                    .map(
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
              <dt>Sprzedawca</dt>
              <dd>{a.country}</dd>
            </dl>
          </details>
        </div>
        <div className="room-center">
          <div className="lot-summary"><h2>{w.name}</h2><p>{productSpecs(w)}</p><span>Butelka {a.bottleCondition ?? a.condition}/100 · Pudełko {a.boxCondition ?? a.condition}/100</span></div>
          {active && <section className="room-pulse" aria-label="Licytacja na żywo">
              <div className="room-live-label">
                <span className="live-dot" />
                Licytacja trwa <span>{watcherCount(s, a)} obserwujących</span>
              </div>
              <motion.div
                key={a.end}
                initial={a.extensions?.length ? { scale: 1.04 } : false}
                animate={{ scale: 1 }}
                className="room-timer"
              >
                <Clock size={21} />
                <span>{countdown(a.end, s.now)}</span>
                {recent && (
                  <motion.b
                    className="extension-banner"
                    role="status"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="sr-only">+15 s</span>+15 SEKUND
                  </motion.b>
                )}
              </motion.div>
              {(a.watched || a.proxyActive) && <div className="room-flags">{a.watched && <span>★ Obserwujesz</span>}{a.proxyActive && <span>ϟ Automat aktywny</span>}</div>}
              <div className="room-price">
                <small>Aktualna oferta</small>
                <motion.strong
                  key={a.price}
                  initial={{ color: "#f5b65f", scale: 1.04 }}
                  animate={{ color: "#fff0d4", scale: 1 }}
                >
                  {euro(a.price)}
                </motion.strong>
                <p>
                  <span className="bidder-avatar" aria-hidden="true">
                    {a.leader
                      ? actor(s, a.leader).slice(0, 2).toUpperCase()
                      : "—"}
                  </span>
                  {a.leader
                    ? `Prowadzi ${actor(s, a.leader)}`
                    : "Otwórz licytację"}
                </p>
              </div>
              {a.bids.some((b) => b.actor === "player") && (
                <p
                  className={`bid-status ${a.leader === "player" ? "leading" : "outbid"}`}
                  role="status"
                >
                  {a.leader === "player"
                    ? "PROWADZISZ"
                    : "Zostałeś przebity!"}
                </p>
              )}

          </section>}
        <div className="bid-desk">
          {active ? (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  unlockAudio();
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
                        setValue(
                          String((a.price + bidStep(a.price) * n) / 100),
                        );
                      }}
                    >
                      +{euro(bidStep(a.price) * n)}
                      {n === 1 && (
                        <span className="sr-only">Minimalne przebicie</span>
                      )}
                    </button>
                  ))}
                </div>
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
                <p className="offer-total">Łącznie z prowizją i transportem: <b>{euro(totalCost(a, valid ? amount : a.price))}</b></p>
                <small className="bid-step">
                  Krok licytacji {euro(bidStep(a.price))}
                </small>
              </form>
              <section
                className={`proxy-panel ${a.proxyActive ? "enabled" : ""}`}
                aria-label="Automatyczna licytacja"
              >
                <div className="proxy-heading">
                  <Zap size={19} />
                  <strong>Automatyczna licytacja</strong>
                  <span>{a.proxyActive ? "AKTYWNA" : "WYŁĄCZONA"}</span>
                </div>
                <label htmlFor="proxy-limit">
                  Automatyczna licytacja — maksymalna oferta (€)
                </label>
                <input
                  id="proxy-limit"
                  inputMode="decimal"
                  value={limit}
                  placeholder="Twój limit"
                  onChange={(e) => setLimit(e.target.value)}
                />
                {a.proxyActive && (
                  <div className="proxy-status" role="status">
                    <strong>
                      Automat aktywny • Limit {euro(a.playerLimit!)}
                    </strong>
                    <span>{proxyMessage(a)}</span>
                  </div>
                )}
                {!confirmProxy ? (
                  <div className="actions">
                    <button
                      type="button"
                      disabled={!validLimit}
                      onClick={() => setConfirmProxy(true)}
                    >
                      {a.proxyActive ? "Zmień limit" : "Aktywuj"}
                    </button>
                    {(a.proxyActive || a.playerLimit !== undefined) && (
                      <button
                        className="outline"
                        onClick={() => {
                          mutate((g) => disableProxy(g, a.id));
                          setConfirmProxy(false);
                        }}
                      >
                        Wyłącz
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="proxy-confirm">
                    <p>
                      Do {euro(max)} za butelkę; z prowizją i transportem do{" "}
                      <b>{euro(totalCost(a, max))}</b>.
                    </p>
                    <p>
                      Automat składa minimalne przebicia także podczas Twojej
                      nieobecności.
                    </p>
                    <div className="actions">
                      <button
                        onClick={() => {
                          unlockAudio();
                          mutate((g) => activateProxy(g, a.id, max));
                          setConfirmProxy(false);
                        }}
                      >
                        Potwierdź {a.proxyActive ? "zmianę" : "aktywację"}
                      </button>
                      <button
                        className="text-button"
                        onClick={() => setConfirmProxy(false)}
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className={`auction-result ${won ? "won" : ""}`}>
              <div className="result-emblem">
                {won ? <Trophy size={34} /> : <Gavel size={30} />}
              </div>
              <p className="eyebrow">
                {won
                  ? "WYGRAŁEŚ AUKCJĘ!"
                  : unsold
                    ? "AUKCJA ZAKOŃCZONA BEZ SPRZEDAŻY"
                    : "AUKCJA ZAKOŃCZONA"}
              </p>
              <h3>
                {won
                  ? "Kolejna historia w Twojej kolekcji"
                  : unsold
                    ? "Tym razem bez kupującego"
                    : actor(s, a.leader)}
              </h3>
              {!unsold && <p className="result-price">{euro(a.price)}</p>}
              {!won && (
                <p>
                  Twoja ostatnia oferta:{" "}
                  <b>
                    {lastOffer ? euro(lastOffer.amount) : "Nie licytowałeś"}
                  </b>
                </p>
              )}
              {!won && !unsold && <p className="settlement-note">Nie pobrano Twoich środków za tę aukcję.</p>}
              {won && (
                <p className="delivery-status">
                  <Package size={18} />
                  {item ? labels[item.status] : "Dostawa zapisana w magazynie"}
                  {item?.due && item.status === "incoming" && <small>Dostawa w czasie gry: {date(item.due)}</small>}
                </p>
              )}
              {won && onWarehouse && <button className="full" onClick={onWarehouse}><Package size={18} />Przejdź do magazynu</button>}
              <button
                className="outline full"
                onClick={onBackToMarket ?? onClose}
              >
                Wróć do aktywnych aukcji
                <ArrowUpRight size={16} />
              </button>
            </section>
          )}
          {(active || won) && (
            <dl className="cost-breakdown">
              <dt>{active ? "Twoja proponowana oferta" : "Cena młotkowa"}</dt>
              <dd>{euro(active && valid ? amount : a.price)}</dd>
              <dt>Prowizja · {Math.round(a.fee * 100)}%</dt>
              <dd>
                {euro(Math.round((active && valid ? amount : a.price) * a.fee))}
              </dd>
              <dt>Transport</dt>
              <dd>{euro(a.shipping)}</dd>
              <dt>
                Całkowity koszt zakupu{" "}
                <Hint label="Jak liczymy pełny koszt?">
                  Cena młotkowa + prowizja + transport. Wysyłkę do klienta
                  opłacisz osobno.
                </Hint>
              </dt>
              <dd>{euro(totalCost(a, active && valid ? amount : a.price))}</dd>
            </dl>
          )}
        </div>
        </div>
        <aside className="room-audience">
          {active && <AuctionRivals auction={a} state={s} />}
      <details className="live-history" open={historyOpen} onToggle={e => setHistoryOpen(e.currentTarget.open)}>
        <summary>Przebieg aukcji</summary>
        <AnimatePresence initial={false}>
          {timeline.map((t) => (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, x: -12, backgroundColor: "#b8803540" }}
              animate={{ opacity: 1, x: 0, backgroundColor: "#b8803500" }}
            >
              <time>{time(t.at)}</time>
              <span>{t.text}</span>
              {t.amount > 0 && <b>{euro(t.amount)}</b>}
            </motion.div>
          ))}
        </AnimatePresence>
        {!timeline.length && <p className="muted">Nie złożono ofert.</p>}
      </details>
        </aside>
      </div>

    </Modal>
  );
}
