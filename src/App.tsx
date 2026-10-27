import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
} from "lucide-react";
import { catalog, euro, whisky } from "./catalog";
import { cash, held, list, unreadCount, type Item } from "./engine";
import { date, Empty, labels, PriceInput } from "./ui";
import { useGame } from "./useGame";
import ProductGallery, { Modal } from "./components/ProductGallery";
import GameMenu from "./components/GameMenu";
import { AuctionCard, AuctionRoom } from "./components/Auctions";
import { NowBoard, Feed, Unboxing, WinScreen } from "./components/World";
import Messenger from "./components/Messenger";
import BusinessPanels from "./components/BusinessPanels";
const tabs = [
  ["Pulpit", LayoutDashboard],
  ["Aukcje na żywo", Gavel],
  ["Mój sklep", Store],
  ["Magazyn", Package],
  ["Wiadomości", MessageCircle],
  ["Zamówienia", Truck],
  ["Finanse", ChartNoAxesCombined],
  ["Uczestnicy", Users],
] as const;
export default function App() {
  const game = useGame(),
    s = game.state;
  const [menu, setMenu] = useState(true),
    [tab, setTab] = useState("Pulpit"),
    [auctionId, setAuctionId] = useState<string | null>(null),
    [parcelId, setParcelId] = useState<string | null>(null),
    [help, setHelp] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const go = (target: string) => {
    setTab(target);
    setMenu(false);
  };
  const start = (difficulty: string) => {
    if (
      s &&
      !confirm(
        "Rozpocząć nową grę? Obecny postęp zostanie zastąpiony. Możesz najpierw wyeksportować zapis.",
      )
    )
      return;
    game.start(difficulty);
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
        <span className="brand-seal">JW</span>
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
          Koszt nabycia {euro(i.cost)} · Stan {i.condition}/100
        </p>
        {i.status === "inspect" && (
          <button onClick={() => setParcelId(i.id)}>
            Otwórz paczkę <Package size={16} />
          </button>
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
    <>
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
              <span className="brand-seal">JW</span>
              <span>
                COLLECTION STORE<small>TWÓJ SALON KOLEKCJONERSKI</small>
              </span>
            </button>
            <div className="store-status">
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
            {tabs.map(([name, Icon]) => (
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
            <button className="help-nav" onClick={() => setHelp(true)}>
              <BookOpen size={16} /> Pomoc
            </button>
          </nav>
          <main className="game-content">
            <div className="page-title">
              <div>
                <p className="eyebrow">
                  {tab === "Pulpit"
                    ? "WITAJ W SWOIM SALONIE"
                    : "JW COLLECTION STORE"}
                </p>
                <h1>
                  {tab === "Pulpit" ? (
                    <>
                      Dobre historie.
                      <br />
                      <em>Jeszcze lepsze kolekcje.</em>
                    </>
                  ) : (
                    tab
                  )}
                </h1>
                {tab === "Pulpit" && (
                  <p>Otwórz drzwi. Zobacz, co dziś czeka na Twoją decyzję.</p>
                )}
              </div>
              <div className="page-side">
                <span className="badge">{s.difficulty}</span>
                <span className="save-state">
                  <Check size={12} />
                  {game.saved ? "Postęp zapisany" : "Zapisywanie…"}
                </span>
              </div>
            </div>
            {s.clockWarning && (
              <div className="alert">
                Wykryto cofnięcie zegara. Gra poczeka na ostatni zapisany czas;
                rozgrywka lokalna nie jest odporna na zmianę zegara.
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
            {(tab === "Pulpit" || tab === "Aukcje na żywo") && (
              <section className="auctions-section">
                <div className="section-heading">
                  <h2>
                    Aukcje na żywo{" "}
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
                  {(tab === "Pulpit" ? active.slice(0, 3) : active).map((a) => (
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
                {tab === "Aukcje na żywo" &&
                  s.auctions.some((a) => a.status === "closed") && (
                    <details className="auction-archive">
                      <summary>
                        Zakończone aukcje ·{" "}
                        {s.auctions.filter((a) => a.status === "closed").length}
                      </summary>
                      <div className="auction-grid">
                        {s.auctions
                          .filter((a) => a.status === "closed")
                          .slice()
                          .reverse()
                          .map((a) => (
                            <AuctionCard
                              key={a.id}
                              auction={a}
                              state={s}
                              onOpen={() => setAuctionId(a.id)}
                            />
                          ))}
                      </div>
                    </details>
                  )}
              </section>
            )}
            {tab === "Pulpit" && (
              <>
                <section className="shop-preview">
                  <div>
                    <p className="eyebrow">TWOJA WŁASNA KOLEKCJA</p>
                    <h2>
                      Każda butelka
                      <br />
                      <em>ma swoją historię.</em>
                    </h2>
                    <p>
                      {s.items.filter((i) => i.status === "listed").length}{" "}
                      ofert w witrynie ·{" "}
                      {s.orders.filter((o) => o.status === "packing").length}{" "}
                      zamówień czeka na wysyłkę
                    </p>
                    <button className="outline" onClick={() => go("Mój sklep")}>
                      Otwórz swój sklep <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="shop-shelf">
                    {s.items
                      .filter((i) =>
                        ["listed", "stock", "inspect"].includes(i.status),
                      )
                      .slice(0, 3)
                      .map((i) => (
                        <div key={i.id} className="shelf-item">
                          <ProductGallery product={i.product} compact />
                          <button
                            className="text-button"
                            onClick={() =>
                              go(
                                i.status === "listed" ? "Mój sklep" : "Magazyn",
                              )
                            }
                          >
                            {whisky(i.product).name.replace(
                              "Johnnie Walker ",
                              "",
                            )}
                          </button>
                        </div>
                      ))}
                    {!s.items.some((i) =>
                      ["listed", "stock", "inspect"].includes(i.status),
                    ) && (
                      <div className="shelf-empty">
                        <Package size={45} strokeWidth={0.7} />
                        <p>Miejsce na Twoją pierwszą zdobycz.</p>
                        <span>
                          Wygraj aukcję, odbierz przesyłkę i nadaj jej własną
                          cenę.
                        </span>
                      </div>
                    )}
                  </div>
                </section>
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
                  <span className="muted">Transport z aukcji · 24 godziny</span>
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
                  <button className="text-button" onClick={() => go("Magazyn")}>
                    Wystaw z magazynu <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="inventory-grid">
                  {s.items.filter((i) => i.status === "listed").map(itemCard)}
                </div>
                {!s.items.some((i) => i.status === "listed") && (
                  <Empty text="Twoja witryna czeka na pierwszą butelkę. Ustal cenę w magazynie — Ty decydujesz o marży." />
                )}
                <details className="catalog-section">
                  <summary>
                    Poznaj edycje · katalog {catalog.length} whisky
                  </summary>
                  <div className="catalog-grid">
                    {catalog.map((w) => (
                      <article key={w.id}>
                        <ProductGallery product={w.id} compact />
                        <h3>{w.name}</h3>
                        <p>{w.description}</p>
                        <small>
                          Referencja gry {euro(w.value)} · Rzadkość {w.rarity}
                          /10
                        </small>
                      </article>
                    ))}
                  </div>
                </details>
              </section>
            )}
            {tab === "Wiadomości" && (
              <Messenger state={s} mutate={game.mutate} />
            )}
            <BusinessPanels tab={tab} state={s} mutate={game.mutate} />
            <footer className="game-footer">
              <span>
                JW COLLECTION STORE <b>·</b> Niezależna gra kolekcjonerska. Bez
                powiązania z marką.
              </span>
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
          auction={selectedAuction}
          state={s}
          mutate={game.mutate}
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
            Licytuj whisky, uwzględniając prowizję i transport. Dostawa trwa 24
            godziny. Otwórz paczkę w magazynie, skontroluj stan i sam ustal
            cenę. Klienci odwiedzają witrynę w godzinach 8–22 Amsterdam i
            oceniają ją według swoich preferencji.
          </p>
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
    </>
  );
}
