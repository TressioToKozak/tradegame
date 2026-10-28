import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useState } from "react";
import {
  ArrowUpRight,
  Clock,
  MessageCircle,
  Package,
  Truck,
  Trophy,
  Gavel,
  Check,
  Sparkles,
} from "lucide-react";
import { photosFor, assetUrl } from "../media";
import { euro, whisky } from "../catalog";
import {
  inspect,
  totalCost,
  type Auction,
  type Item,
  type State,
} from "../engine";
import { shopLevel, progress, levelStart } from "../progression";
import { countdown, date } from "../ui";
import type { Mutate } from "../useGame";
import ProductGallery, { Modal } from "./ProductGallery";
export function NowBoard({
  state: s,
  go,
  openAuction,
  openParcel,
}: {
  state: State;
  go: (tab: string) => void;
  openAuction: (id: string) => void;
  openParcel: (id: string) => void;
}) {
  const soon = s.auctions
    .filter((a) => a.status === "active")
    .sort((a, b) => a.end - b.end)[0];
  const threads = s.threads.filter((t) => t.status === "open");
  const parcel = s.items.find((i) => i.status === "inspect");
  const order = s.orders.find((o) => o.status === "packing");
  return (
    <section className="now-section">
      <div className="section-heading">
        <h2>Twój następny ruch</h2>
        <span className="live-tag">
          <i className="live-dot" /> NA ŻYWO
        </span>
      </div>
      <div className="now-grid">
        {soon ? (
          <button
            className="world-event feature-event"
            onClick={() => openAuction(soon.id)}
          >
            <div className="event-product">
              {photosFor(soon.product)[0] ? (
                <img
                  className="event-bottle"
                  src={assetUrl(photosFor(soon.product)[0].path)}
                  alt={whisky(soon.product).name}
                />
              ) : null}
            </div>
            <div className="event-icon">
              <Gavel size={23} />
            </div>
            <span className="eyebrow">W SALONIE AUKCYJNYM</span>
            <h3>{whisky(soon.product).name.replace("Johnnie Walker ", "")}</h3>
            <p>
              {soon.leader === "player"
                ? "Prowadzisz"
                : `${euro(soon.price)} · ${soon.bids.length} ofert`}
            </p>
            <div>
              <strong>
                <Clock size={18} />
                {countdown(soon.end, s.now)}
              </strong>
              <span>
                Wejdź na aukcję <ArrowUpRight size={16} />
              </span>
            </div>
          </button>
        ) : (
          <div className="world-event feature-event quiet-event">
            <Clock size={25} />
            <span className="eyebrow">CHWILA NA DOBRĄ DECYZJĘ</span>
            <h3>Salon czeka na nowe okazje</h3>
            <p>
              Kolejna partia pojawi się za chwilę. Sprawdź w tym czasie sklep i
              wiadomości.
            </p>
          </div>
        )}
        <div className="world-event message-event">
          <MessageCircle size={22} />
          <span className="eyebrow">ROZMOWY Z KOLEKCJONERAMI</span>
          <h3>
            {threads.length
              ? `${threads.length} ${threads.length === 1 ? "propozycja czeka" : "propozycje czekają"}`
              : "Otwórz witrynę"}
          </h3>
          <p>
            {threads.length
              ? `${s.people.find((p) => p.id === threads[0].customer)?.name} proponuje ${euro(threads[0].offer)} za Twoją butelkę.`
              : "Twoje oferty przyciągną kolekcjonerów."}
          </p>
          <button
            className="text-button"
            onClick={() => go(threads.length ? "Wiadomości" : "Mój sklep")}
          >
            {threads.length ? "Otwórz rozmowy" : "Zajrzyj do sklepu"}{" "}
            <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="world-event parcel-event">
          {parcel ? <Package size={22} /> : <Truck size={22} />}
          <span className="eyebrow">ZA DRZWIAMI TWOJEGO SKLEPU</span>
          <h3>
            {parcel
              ? "Twoja przesyłka dotarła"
              : order
                ? "Zamówienie do przygotowania"
                : "Kolekcja w drodze"}
          </h3>
          <p>
            {parcel
              ? `${whisky(parcel.product).name}. Odkryj, co kryje pudełko.`
              : order
                ? `Zamówienie ${order.id} czeka na bezpieczne pakowanie.`
                : `${s.items.filter((i) => i.status === "incoming").length} przesyłek przychodzących.`}
          </p>
          <button
            className="text-button"
            onClick={() =>
              parcel
                ? openParcel(parcel.id)
                : go(order ? "Zamówienia" : "Magazyn")
            }
          >
            {parcel
              ? "Otwórz paczkę"
              : order
                ? "Przygotuj zamówienie"
                : "Zobacz magazyn"}
            <ArrowUpRight size={16} />
          </button>
        </div>
        <button
          className="world-event growth-event"
          onClick={() => go("Rozwój sklepu")}
        >
          <Sparkles size={22} />
          <span className="eyebrow">TWÓJ SALON ROŚNIE</span>
          <h3>Poziom {shopLevel(s)}</h3>
          <progress
            aria-label="Postęp rozwoju"
            value={progress(s).xp - levelStart(shopLevel(s))}
            max={levelStart(shopLevel(s) + 1) - levelStart(shopLevel(s))}
          />
          <span>
            {progress(s).xp} PD · Rozwijaj sklep <ArrowUpRight size={16} />
          </span>
        </button>
      </div>
    </section>
  );
}
export function Feed({ state: s }: { state: State }) {
  return (
    <div className="world-feed">
      <AnimatePresence initial={false}>
        {s.feed.slice(0, 5).map((f) => (
          <motion.div
            key={`${f.at}-${f.text}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="feed-dot" />
            <div>
              <p>{f.text}</p>
              <time>{date(f.at)}</time>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
export function WinScreen({
  auction: a,
  onClose,
}: {
  auction: Auction;
  onClose: () => void;
}) {
  return (
    <Modal title="Wygrana aukcja" onClose={onClose} className="win-screen">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="trophy"
      >
        <Trophy size={34} strokeWidth={1.2} />
      </motion.div>
      <p className="eyebrow">KOLEJNY ROZDZIAŁ TWOJEJ KOLEKCJI</p>
      <h2>Wygrana aukcja!</h2>
      <ProductGallery product={a.product} compact />
      <h3>{whisky(a.product).name}</h3>
      <div className="win-cost">
        <span>
          Zwycięska oferta <b>{euro(a.price)}</b>
        </span>
        <span>
          Z prowizją i transportem <b>{euro(totalCost(a))}</b>
        </span>
      </div>
      <p>+25 PD · Butelka jest w drodze do Twojego magazynu.</p>
      <button onClick={onClose}>
        Wspaniale. Wracam do sklepu <ArrowUpRight size={17} />
      </button>
    </Modal>
  );
}
export function Unboxing({
  item: i,
  mutate,
  onClose,
}: {
  item: Item;
  mutate: Mutate;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"closed" | "opening" | "revealed">(
    "closed",
  );
  const reduced = useReducedMotion();
  return (
    <Modal title="Otwieranie przesyłki" onClose={onClose} className="unboxing">
      <p className="eyebrow">DOSTAWA DO JW COLLECTION STORE</p>
      <h2>
        {phase === "revealed"
          ? "Oto Twoja nowa zdobycz."
          : "Ten moment należy do Ciebie."}
      </h2>
      {phase !== "revealed" ? (
        <>
          <div className="parcel-stage">
            <motion.div
              className="parcel-box"
              animate={
                phase === "opening"
                  ? { rotate: [0, -3, 3, 0], y: -15, opacity: 0, scale: 1.1 }
                  : {}
              }
              transition={{ duration: reduced ? 0 : 0.3 }}
              onAnimationComplete={() => {
                if (phase === "opening") setPhase("revealed");
              }}
            >
              <div className="parcel-tape" />
              <Package size={65} strokeWidth={0.8} />
              <span>JW COLLECTION STORE</span>
              <small>OSTROŻNIE · SZKŁO</small>
            </motion.div>
          </div>
          <p>{whisky(i.product).name}</p>
          <button
            disabled={phase === "opening"}
            onClick={() => setPhase("opening")}
          >
            {phase === "opening" ? "Rozpakowywanie…" : "Otwórz paczkę"}{" "}
            <Package size={17} />
          </button>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ProductGallery product={i.product} />
          <h3>{whisky(i.product).name}</h3>
          <div className="inspection-result">
            <Check size={20} />
            <div>
              <strong>Kontrola zakończona · stan {i.condition}/100</strong>
              <p>
                Butelka {i.bottleCondition ?? i.condition}/100 · pudełko{" "}
                {i.boxCondition ?? i.condition}/100. Opis aukcji:{" "}
                {i.expectedCondition ?? i.condition}/100.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              mutate((g) => inspect(g, i.id));
              onClose();
            }}
          >
            Przyjmij do magazynu <ArrowUpRight size={17} />
          </button>
        </motion.div>
      )}
    </Modal>
  );
}
