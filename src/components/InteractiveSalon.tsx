import { Gavel, Package, Store, MessageCircle, Truck } from "lucide-react";
import { unreadCount, type State } from "../engine";
import { date } from "../ui";
import "./InteractiveSalon.css";

export const salonZones = [
  { id: "auctions", name: "Aukcje", tab: "Aukcje na żywo", icon: Gavel, x: 50, y: 48 },
  { id: "inventory", name: "Magazyn", tab: "Magazyn", icon: Package, x: 27, y: 38 },
  { id: "shop", name: "Mój sklep", tab: "Mój sklep", icon: Store, x: 70, y: 30 },
  { id: "messages", name: "Wiadomości", tab: "Wiadomości", icon: MessageCircle, x: 98, y: 31 },
  { id: "deliveries", name: "Dostawy", tab: "Zamówienia", icon: Truck, x: 84, y: 63 },
] as const;

export function salonActivity(s: State) {
  const ending = s.auctions.filter(a => a.status === "active" && a.watched && a.end > s.now && a.end - s.now <= 60000).sort((a,b) => a.end - b.end)[0];
  const unread = s.threads.reduce((n,t) => n + unreadCount(t), 0);
  const parcels = s.items.filter(i => i.status === "inspect").length;
  const packing = s.orders.filter(o => o.status === "packing").length;
  const offers = s.threads.filter(t => t.status === "open" && t.expires > s.now && t.offer > 0 && unreadCount(t) > 0).length;
  return {
    auctions: { count: 0, active: !!ending, text: ending ? `Kończy się za ${Math.ceil((ending.end - s.now) / 1000)} s` : "Przejdź do licytacji" },
    inventory: { count: parcels, active: parcels > 0, text: parcels ? `Do otwarcia: ${parcels}` : "Twoja kolekcja" },
    shop: { count: offers, active: offers > 0, text: offers ? `Nowe propozycje: ${offers}` : "Twoje oferty sprzedaży" },
    messages: { count: unread, active: unread > 0, text: unread ? `Nieprzeczytane: ${unread}` : "Rozmowy z klientami" },
    deliveries: { count: packing, active: packing > 0, text: packing ? `Do przygotowania: ${packing}` : "Sprawdź zamówienia" },
  };
}

export default function InteractiveSalon({ state, go }: { state: State; go: (tab: string) => void }) {
  const activity = salonActivity(state);
  return <section className="interactive-salon" aria-label="Interaktywny salon whisky">
    <div className="salon-scene">
      <img className="salon-art" src={`${import.meta.env.BASE_URL}game-art/whisky-salon.png`} width="1672" height="941" alt="Salon whisky: gabloty po lewej, biurko z laptopem pośrodku, lada i telefon po prawej oraz stół pakowania w prawym dolnym rogu." fetchPriority="high" />
      <div className="salon-zones" role="group" aria-label="Miejsca w salonie">
        {salonZones.map(({ id, name, tab, icon: Icon, x, y }) => {
          const status = activity[id];
          return <button key={id} type="button" data-zone={id} className={`salon-zone ${status.active ? "salon-zone-active" : ""}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => go(tab)} aria-label={`${name} — ${status.text}`}>
            <span className="salon-zone-heading"><Icon size={18} aria-hidden="true" /><span>{name}</span>{status.count > 0 && <b className="salon-count">{status.count}</b>}</span>
            <span className="salon-zone-status" aria-live={id === "auctions" ? "off" : "polite"} aria-atomic="true">{status.text}</span>
          </button>;
        })}
      </div>
    </div>
    {state.feed.length > 0 && <section className="salon-events" aria-label="Ostatnie wydarzenia">
      <div className="salon-events-heading"><h2>W salonie</h2></div>
      <ol>{state.feed.slice(0, 3).map((event, i) => <li key={`${event.at}-${i}`}><time dateTime={new Date(event.at).toISOString()}>{date(event.at)}</time><span>{event.text}</span></li>)}</ol>
      {state.feed.length > 3 && <details className="salon-history"><summary>Historia zdarzeń</summary><ol>{state.feed.slice(3).map((event, i) => <li key={`${event.at}-${i}`}><time dateTime={new Date(event.at).toISOString()}>{date(event.at)}</time><span>{event.text}</span></li>)}</ol></details>}
    </section>}
  </section>;
}
