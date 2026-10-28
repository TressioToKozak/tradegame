import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  Download,
  Gavel,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Store,
  Truck,
  Upload,
  Users,
  Sparkles,
} from "lucide-react";
import { euro, whisky } from "./catalog";
import {
  cash,
  held,
  list,
  unreadCount,
  setPace,
  supplierClaim,
  type Item,
  type Pace,
} from "./engine";
import { date, Empty, labels, PriceInput } from "./ui";
import { useGame } from "./useGame";
import ProductGallery, { Modal } from "./components/ProductGallery";
import Brand from "./components/Brand";
import Development from "./components/Development";
import { shopLevel, progress, levelStart } from "./progression";
import GameMenu from "./components/GameMenu";
import { AuctionCard, AuctionRoom } from "./components/Auctions";
import { NowBoard, Feed, Unboxing, WinScreen } from "./components/World";
import Messenger from "./components/Messenger";
import AuctionMarket from "./components/AuctionMarket";
import BusinessPanels from "./components/BusinessPanels";
const tabs = [
  ["Pulpit", LayoutDashboard],
  ["Aukcje na żywo", Gavel],
  ["Mój sklep", Store],
  ["Magazyn", Package],
  ["Wiadomości", MessageCircle],
  ["Rozwój sklepu", Sparkles],
  ["Zamówienia", Truck],
  ["Finanse", ChartNoAxesCombined],
  ["Uczestnicy", Users],
] as const;
export default function App() {
  const [simplifiedMotion, setSimplifiedMotion] = useState(() => {
    try {
      return localStorage.getItem("jw-reduced-motion") === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(simplifiedMotion);
    try {
      localStorage.setItem("jw-reduced-motion", String(simplifiedMotion));
    } catch {
      /* System preference still works when storage is unavailable. */
    }
  }, [simplifiedMotion]);
  const game = useGame(),
    s = game.state;
  const [menu, setMenu] = useState(true),
    [tab, setTab] = useState("Pulpit"),
    [auctionId, setAuctionId] = useState<string | null>(null),
    [parcelId, setParcelId] = useState<string | null>(null),
    [help, setHelp] = useState(false),
    [more, setMore] = useState(false),
    [tutorial, setTutorial] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const go = (target: string) => {
    setTab(target);
    setMenu(false);
  };
  const start = (difficulty: string, pace: Pace) => {
    if (
      s &&
      !confirm(
        "Rozpocząć nową grę? Obecny postęp zostanie zastąpiony. Możesz najpierw wyeksportować zapis.",
      )
    )
      return;
    game.start(difficulty, pace);
    setTutorial(0);
    setMenu(false);
    setTab("Pulpit");
  };
  const importInput = (
    <input
      ref={input}
      type="file"
      accept="application/json"
      hidden
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file && (await game.importGame(file))) setMenu(false);
        e.target.value = "";
      }}
    />
  );
  if (!game.ready)
    return (
      <div className="loading">
        <Brand small />
        <p>Twój salon za chwilę otworzy drzwi…</p>
      </div>
    );
  const active = s?.auctions.filter((a) => a.status === "active") ?? [],
    unread = s?.threads.reduce((n, t) => n + unreadCount(t), 0) ?? 0;
  const selectedAuction = s?.auctions.find((a) => a.id === auctionId),
    selectedParcel = s?.items.find((i) => i.id === parcelId);
  const won = s?.auctions.find((a) => a.id === game.wins[0]);
  const itemCard = (i: Item) => (
    <article className="inventory-card" key={i.id}>
      <ProductGallery product={i.product} compact />
      <div>
        <span className="badge">{labels[i.status]}</span>
        <h3>{whisky(i.product).name}</h3>
        <p>
          Koszt nabycia {euro(i.cost)} · Butelka{" "}
          {i.bottleCondition ?? i.condition}/100 · Pudełko{" "}
          {i.boxCondition ?? i.condition}/100
        </p>
        {i.status === "inspect" && (
          <button onClick={() => setParcelId(i.id)}>
            Otwórz paczkę <Package size={16} />
          </button>
        )}
        {i.expectedCondition !== undefined &&
          i.condition < i.expectedCondition && (
            <div className="condition-claim">
              <p>
                Opis aukcji: {i.expectedCondition}/100. Dostarczony stan odbiega
                od opisu.
              </p>
              <button
                className="outline"
                disabled={!!i.supplierClaim}
                onClick={() => game.mutate((g) => supplierClaim(g, i.id))}
              >
                {i.supplierClaim
                  ? "Rekompensata otrzymana"
                  : "Zgłoś niezgodność sprzedawcy"}
              </button>
            </div>
          )}
        {i.status === "incoming" && i.due && (
          <p>Przewidywana dostawa: {date(i.due)} · czas gry</p>
        )}
        {["stock", "listed"].includes(i.status) && (
          <PriceInput
            initial={i.price}
            onSubmit={(n) => game.mutate((g) => list(g, i.id, n))}
          />
        )}
        <small>
          {i.views} wyświetleń · {new Set(i.interested).size} zainteresowanych
        </small>
      </div>
    </article>
  );
  return (
    <MotionConfig
      reducedMotion={simplifiedMotion ? "always" : "user"}
      transition={{ duration: 0.24 }}
    >
      {importInput}
      {menu || !s ? (
        <GameMenu
          state={s}
          onStart={start}
          onContinue={() => setMenu(false)}
          onImport={() => input.current?.click()}
          onHelp={() => setHelp(true)}
        />
      ) : (
        <div className="game-shell">
          <header className="store-header">
            <button
              className="brand brand-button"
              onClick={() => setMenu(true)}
              aria-label="Menu główne"
            >
              <Brand small />
              <span>
                COLLECTION STORE<small>TWÓJ SALON</small>
              </span>
            </button>
            <div className="store-status">
              <button
                className="live-shortcut outline"
                onClick={() => go("Aukcje na żywo")}
              >
                <Gavel size={15} />
                {active.length} aukcji
              </button>
              <span className="header-cash">
                <small>Wolna gotówka</small>
                <b>{euro(cash(s) - held(s))}</b>
              </span>
              <span className="header-reputation">
                <small>Reputacja</small>
                <b>
                  {s.reputation}
                  <i>/100</i>
                </b>
              </span>
              <button
                className="header-level"
                onClick={() => go("Rozwój sklepu")}
                aria-label={`Poziom sklepu ${shopLevel(s)} — rozwój`}
              >
                <span>{shopLevel(s)}</span>
                <div>
                  <small>Poziom sklepu</small>
                  <progress
                    aria-label="Postęp sklepu"
                    value={progress(s).xp - levelStart(shopLevel(s))}
                    max={
                      levelStart(shopLevel(s) + 1) - levelStart(shopLevel(s))
                    }
                  />
                </div>
              </button>
              <span className="header-time">
                {date(s.now)}
                <small>Amsterdam</small>
              </span>
              <button
                className="notification-button"
                aria-label={`Powiadomienia: ${unread} nieprzeczytanych wiadomości`}
                onClick={() => go("Wiadomości")}
              >
                <Bell size={19} />
                {unread > 0 && <b>{unread}</b>}
              </button>
            </div>
          </header>
          <nav className="store-nav">
            {tabs.slice(0, 5).map(([name, Icon]) => (
              <button
                className={tab === name ? "selected" : ""}
                key={name}
                onClick={() => go(name)}
              >
                <Icon size={16} />
                {name}
                {name === "Wiadomości" && unread > 0 && <b>{unread}</b>}
              </button>
            ))}
            <button className="help-nav" onClick={() => setMore(true)}>
              <BookOpen size={16} /> Więcej
            </button>
          </nav>
          <main className="game-content">
            <div className="page-title">
              <div>
                <p className="eyebrow">TWÓJ SALON KOLEKCJONERSKI</p>
                <h1>{tab === "Pulpit" ? "Aktualnie w grze" : tab}</h1>
              </div>
              <span className="save-state sr-only" aria-live="off">
                {game.saved ? "Postęp zapisany" : "Zapisywanie…"}
              </span>
            </div>
            <motion.div
              key={tab}
              className="tab-scene"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {s.clockWarning && (
                <div className="alert">
                  Wykryto cofnięcie zegara. Gra poczeka na ostatni zapisany
                  czas; rozgrywka lokalna nie jest odporna na zmianę zegara.
                </div>
              )}
              {tab === "Pulpit" && (
                <NowBoard
                  state={s}
                  go={go}
                  openAuction={setAuctionId}
                  openParcel={setParcelId}
                />
              )}
              {tab === "Pulpit" && (
                <section className="auctions-section">
                  <div className="section-heading">
                    <h2>
                      Kończą się za chwilę{" "}
                      <span className="live-tag">
                        <i className="live-dot" />
                        {active.length} AKTYWNE
                      </span>
                    </h2>
                    {tab === "Pulpit" && (
                      <button
                        className="text-button"
                        onClick={() => go("Aukcje na żywo")}
                      >
                        Wejdź do salonu <ArrowUpRight size={16} />
                      </button>
                    )}
                  </div>
                  <div className="auction-grid">
                    {active
                      .slice()
                      .sort((a, b) => a.end - b.end)
                      .slice(0, 3)
                      .map((a) => (
                        <AuctionCard
                          key={a.id}
                          auction={a}
                          state={s}
                          onOpen={() => setAuctionId(a.id)}
                        />
                      ))}
                  </div>
                  {!active.length && (
                    <Empty text="Nowe aukcje pojawią się zgodnie z harmonogramem świata. Do tego czasu możesz zająć się własną kolekcją." />
                  )}
                </section>
              )}
              {tab === "Aukcje na żywo" && (
                <AuctionMarket state={s} onOpen={setAuctionId} />
              )}
              {tab === "Pulpit" && (
                <section className="new-opportunities">
                  <div className="section-heading">
                    <h2>Nowe okazje</h2>
                    <span className="muted">Najnowsze partie</span>
                  </div>
                  <div className="auction-grid">
                    {active
                      .slice()
                      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
                      .slice(0, 3)
                      .map((a) => (
                        <AuctionCard
                          key={a.id}
                          auction={a}
                          state={s}
                          onOpen={() => setAuctionId(a.id)}
                        />
                      ))}
                  </div>
                </section>
              )}
              {tab === "Pulpit" && (
                <>
                  <section className="journal-section">
                    <div className="section-heading">
                      <h2>Dziennik Twojego świata</h2>
                      <span className="live-tag">
                        <i className="live-dot" /> ZDARZENIA NA ŻYWO
                      </span>
                    </div>
                    <Feed state={s} />
                  </section>
                </>
              )}
              {tab === "Magazyn" && (
                <section>
                  <div className="section-heading">
                    <h2>Twoje butelki i dostawy</h2>
                  </div>
                  <div className="inventory-grid">{s.items.map(itemCard)}</div>
                  {!s.items.length && (
                    <Empty text="Pierwsza wygrana aukcja zapoczątkuje Twoją kolekcję. Tutaj odbierzesz i otworzysz przesyłkę." />
                  )}
                </section>
              )}
              {tab === "Mój sklep" && (
                <section>
                  <div className="section-heading">
                    <h2>Witryna JW Collection Store</h2>
                    <button
                      className="text-button"
                      onClick={() => go("Magazyn")}
                    >
                      Wystaw z magazynu <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="inventory-grid">
                    {s.items.filter((i) => i.status === "listed").map(itemCard)}
                  </div>
                  {!s.items.some((i) => i.status === "listed") && (
                    <Empty text="Twoja witryna czeka na pierwszą butelkę. Ustal cenę w magazynie — Ty decydujesz o marży." />
                  )}
                </section>
              )}
              {tab === "Wiadomości" && (
                <Messenger state={s} mutate={game.mutate} />
              )}
              {tab === "Rozwój sklepu" && (
                <Development state={s} mutate={game.mutate} />
              )}
              <BusinessPanels tab={tab} state={s} mutate={game.mutate} />
            </motion.div>
            <footer className="game-footer">
              <button className="text-button" onClick={() => setMenu(true)}>
                <LogOut size={14} /> Menu gry
              </button>
            </footer>
          </main>
        </div>
      )}
      <AnimatePresence>
        {game.notice && (
          <motion.div
            role="status"
            className="toast"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
          >
            <Bell size={18} />
            <p>{game.notice}</p>
            <button
              className="icon-button"
              aria-label="Zamknij powiadomienie"
              onClick={() => game.setNotice("")}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {game.error && (
        <div role="alert" className="global-error">
          {game.error}
          <button onClick={() => game.setError("")}>Zamknij</button>
        </div>
      )}
      {selectedAuction && s && (
        <AuctionRoom
          key={selectedAuction.id}
          auction={selectedAuction}
          state={s}
          mutate={game.mutate}
          onNavigate={(direction) => {
            const index = active.findIndex((a) => a.id === selectedAuction.id);
            if (active.length)
              setAuctionId(
                active[(index + direction + active.length) % active.length].id,
              );
          }}
          onClose={() => setAuctionId(null)}
        />
      )}
      {selectedParcel?.status === "inspect" && (
        <Unboxing
          item={selectedParcel}
          mutate={game.mutate}
          onClose={() => setParcelId(null)}
        />
      )}
      {won && !menu && !selectedAuction && !selectedParcel && (
        <WinScreen auction={won} onClose={game.dismissWin} />
      )}
      {game.needsMigration && (
        <Modal
          title="Aktualizacja zapisu"
          dismissible={false}
          onClose={() => {}}
          className="help-dialog"
        >
          <h2>Twój sklep przechodzi do wersji 2.0</h2>
          <p>
            Zachowamy gotówkę, butelki, transakcje i istniejące terminy. Przed
            migracją możesz pobrać oryginał. Dodatkowa kopia pozostanie w
            IndexedDB.
          </p>
          <div className="actions">
            <button onClick={game.exportLegacy}>Pobierz zapis wersji 1</button>
            <button className="outline" onClick={() => void game.migrate()}>
              Przenieś do wersji 2
            </button>
          </div>
        </Modal>
      )}
      {more && (
        <Modal
          title="Dodatkowe ekrany"
          onClose={() => setMore(false)}
          className="help-dialog"
        >
          <h2>Twój biznes</h2>
          <div className="extra-navigation">
            {tabs.slice(5).map(([name, Icon]) => (
              <button
                className="outline"
                key={name}
                onClick={() => {
                  go(name);
                  setMore(false);
                }}
              >
                <Icon size={19} />
                {name}
              </button>
            ))}
            <button
              className="outline"
              onClick={() => {
                setHelp(true);
                setMore(false);
              }}
            >
              <BookOpen size={19} />
              Pomoc i ustawienia
            </button>
          </div>
        </Modal>
      )}
      {tutorial !== null && s && (
        <Modal
          title="Pierwsze kroki"
          onClose={() => {
            setTutorial(null);
            game.mutate((g) => {
              g.tutorialDone = true;
            });
          }}
          className="tutorial-dialog"
        >
          <p className="eyebrow">PIERWSZE KROKI · {tutorial + 1}/6</p>
          <h2>
            {
              [
                "To Twój sklep",
                "Masz 5 000 € na start",
                "Rynek nie zasypia",
                "Licytuj świadomie",
                "Nadaj butelce własną cenę",
                "Poznaj swoich klientów",
              ][tutorial]
            }
          </h2>
          <p>
            {
              [
                "Witaj w JW Collection Store. Zbudujesz kolekcję i własny biznes.",
                "Gotówkę i reputację widzisz u góry. Oferty blokują pełny koszt, razem z opłatami.",
                "W Aukcjach znajdziesz 16 początkowych partii. Obserwuj je i filtruj według swoich zainteresowań.",
                "W szczegółach wybierz szybkie przebicie albo wpisz kwotę, sprawdź koszt i zatwierdź. Możesz ustawić limit.",
                "Po dostawie otwórz paczkę w Magazynie. Sam ustal cenę; możesz ją później zmienić.",
                "Wiadomości zawierają propozycje prawdziwych postaci symulacji. Nie każda negocjacja zakończy się sprzedażą.",
              ][tutorial]
            }
          </p>
          <div className="actions">
            <button
              onClick={() => {
                if (tutorial < 5) setTutorial(tutorial + 1);
                else {
                  setTutorial(null);
                  game.mutate((g) => {
                    g.tutorialDone = true;
                  });
                }
              }}
            >
              {tutorial < 5 ? "Dalej" : "Zaczynamy"}
            </button>
            <button
              className="text-button"
              onClick={() => {
                setTutorial(null);
                game.mutate((g) => {
                  g.tutorialDone = true;
                });
              }}
            >
              Pomiń wprowadzenie
            </button>
          </div>
        </Modal>
      )}
      {help && (
        <Modal
          title="Pomoc i ustawienia"
          onClose={() => setHelp(false)}
          className="help-dialog"
        >
          <p className="eyebrow">TWOJA ROZGRYWKA</p>
          <h2>Pomoc i zapisy</h2>
          <div className="help-actions">
            <button onClick={game.exportGame} disabled={!s}>
              <Download size={17} /> Eksportuj zapis
            </button>
            <button
              className="outline"
              onClick={() => {
                setHelp(false);
                input.current?.click();
              }}
            >
              <Upload size={17} /> Importuj zapis
            </button>
          </div>
          <h3>Od aukcji do własnego sklepu</h3>
          <p>
            Licytuj whisky, uwzględniając prowizję i transport. Dostawa trwa
            zwykle 3–8 minut w kraju i 6–15 minut z zagranicy. Są to
            skompresowane czasy gry, a nie terminy prawdziwych kurierów. Otwórz
            paczkę w magazynie, skontroluj stan i sam ustal cenę. Klienci
            odwiedzają witrynę najczęściej między 8 a 22 czasu Amsterdamu i
            oceniają ją według swoich preferencji.
          </p>
          {s && (
            <label>
              Tempo bieżącej gry
              <select
                aria-label="Tempo bieżącej gry"
                value={s.pace}
                onChange={(e) =>
                  game.mutate((g) => setPace(g, e.target.value as Pace))
                }
              >
                {["Spokojne", "Dynamiczne", "Intensywne"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <p className="muted">
                Zmiana dotyczy nowych wydarzeń; istniejące terminy, ceny i
                budżety pozostają bez zmian.
              </p>
            </label>
          )}
          <div className="setting-row">
            <div>
              <h3>Uproszczone animacje</h3>
              <p>
                Bez pulsowania i przesunięć. Preferencje systemowe są
                respektowane automatycznie.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="Uproszczone animacje"
              aria-checked={simplifiedMotion}
              className="setting-switch"
              onClick={() => setSimplifiedMotion(!simplifiedMotion)}
            >
              <span />
            </button>
          </div>
          <h3>Czas i zapis</h3>
          <p>
            To lokalna symulacja, bez konta i backendu. Postęp jest
            automatycznie zapisywany w IndexedDB tej przeglądarki. Po powrocie
            gra odtwarza zaległe wydarzenia. Przy zamkniętej przeglądarce nic
            nie wykonuje się w tle.
          </p>
          <p>
            Nie otwieraj jednej rozgrywki w kilku kartach. Nie ma synchronizacji
            urządzeń. Zmiana zegara i edycja zapisu pozwalają manipulować grą.
            Regularnie eksportuj postęp.
          </p>
          <p>
            Niezależna gra kolekcjonerska, bez powiązania z marką Johnnie
            Walker. Fotografie i znaki producenta należą do ich właścicieli.
          </p>
          <h3>Fotografie</h3>
          <p>
            Galerie pokazują wyłącznie zdjęcia przypisane do konkretnej edycji.
            Autor i licencja są pod fotografią w szczegółach. Jeśli zdjęcie nie
            ma potwierdzonych praw, edycja czeka na jego dodanie.
          </p>
          <h3>Prawa klientów</h3>
          <p>
            Gra przewiduje 14 dni na odstąpienie od doręczenia. Częściowa ugoda
            nie znosi uprawnień klienta. Przesyłki są symulowane, bez połączenia
            z kurierem.
          </p>
        </Modal>
      )}
    </MotionConfig>
  );
}
