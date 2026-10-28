import { Users, Check, Package, ChartNoAxesCombined } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { euro, whisky } from "../catalog";
import {
  cash,
  held,
  financials,
  pack,
  ship,
  refund,
  type State,
} from "../engine";
import { date, time, labels, PriceInput, Empty } from "../ui";
import type { Mutate } from "../useGame";
export default function BusinessPanels({
  tab,
  state: s,
  mutate,
}: {
  tab: string;
  state: State;
  mutate: Mutate;
}) {
  const fin = financials(s),
    active = s.auctions.filter((a) => a.status === "active");
  const person = (id: string) =>
    s.people.find((p) => p.id === id)?.name ?? "Ty";
  return (
    <>
      {tab === "Finanse" && (
        <div className="stats">
          {[
            [
              "Dostępna gotówka",
              euro(cash(s) - held(s)),
              `Łącznie ${euro(cash(s))} · blokady ${euro(held(s))}`,
            ],
            [
              "Wartość magazynu",
              euro(fin.stock),
              `${s.items.filter((i) => ["stock", "listed"].includes(i.status)).length} butelek gotowych do sprzedaży`,
            ],
            [
              "Zrealizowany zysk",
              euro(fin.profit),
              `Po kosztach nabycia, realizacji i rozwoju (${euro(fin.developmentCost)})`,
            ],
            [
              "Reputacja sklepu",
              `${s.reputation} / 100`,
              "Zaufanie budowane każdą transakcją",
            ],
          ].map(([name, value, detail], i) => (
            <div className="stat" key={name}>
              <div>
                {name}
                {i === 3 ? (
                  <Users size={17} />
                ) : (
                  <ChartNoAxesCombined size={17} />
                )}
              </div>
              <strong>{value}</strong>
              {i === 3 && (
                <div className="progress">
                  <i style={{ width: s.reputation + "%" }} />
                </div>
              )}
              <small>{detail}</small>
            </div>
          ))}
        </div>
      )}
      {tab === "Zamówienia" && (
        <section>
          <h2>Realizacja i obsługa posprzedażowa</h2>
          <p className="muted">
            Symulowane przesyłki, bez połączenia z kurierem. Odstąpienie: 14 dni
            od doręczenia. Częściowa ugoda nie znosi praw klienta.
          </p>
          {!s.orders.length && (
            <Empty text="Pierwsze zamówienie pojawi się po zaakceptowaniu oferty klienta." />
          )}
          {s.orders.map((o) => (
            <article className="card panel" key={o.id}>
              <span className="badge">{labels[o.status]}</span>
              <h3>
                {o.id} · {person(o.customer)}
              </h3>
              <p>
                {whisky(s.items.find((i) => i.id === o.item)!.product).name} ·{" "}
                {euro(o.total)} · Zwrócono: {euro(o.refund)}
              </p>
              {o.status === "packing" && (
                <div className="actions">
                  <button
                    className="outline"
                    onClick={() => mutate((g) => pack(g, o.id))}
                  >
                    {o.packed ? <Check size={15} /> : <Package size={15} />}{" "}
                    {o.packed
                      ? "Zapakowano bezpiecznie"
                      : "Zapakuj bezpiecznie"}
                  </button>
                  <button onClick={() => mutate((g) => ship(g, o.id))}>
                    Kup etykietę i nadaj · 9,50 €
                  </button>
                </div>
              )}
              {o.status === "shipping" && (
                <p>
                  Numer fikcyjny: JW-NL-{o.id} · Doręczenie {date(o.due)}
                </p>
              )}
              {["delivered", "complaint"].includes(o.status) && (
                <>
                  <p>
                    Prawo odstąpienia do {date(o.returnUntil)}.{" "}
                    {o.status === "complaint"
                      ? "Klient zgłosił problem z zabezpieczeniem paczki."
                      : ""}
                  </p>
                  <PriceInput
                    label="Zwróć środki"
                    initial={o.total - o.refund}
                    onSubmit={(n) => mutate((g) => refund(g, o.id, n))}
                  />
                  <details>
                    <summary>Dowody reklamacji</summary>
                    <p>
                      Protokół pakowania:{" "}
                      {o.packed ? "zabezpieczono" : "brak zabezpieczenia"}. Stan
                      przy doręczeniu: {o.quality}/100. Wymaganie klienta:{" "}
                      {
                        s.people.find((p) => p.id === o.customer)!
                          .preferredCondition
                      }
                      /100.
                    </p>
                  </details>
                </>
              )}
            </article>
          ))}
        </section>
      )}
      {tab === "Finanse" && (
        <section className="card panel">
          <h2>Przepływy pieniężne</h2>
          <p>
            Wpłaty za niewysłane zamówienia: {euro(fin.liabilities)} · Towar w
            drodze: {euro(fin.incoming)}
          </p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <AreaChart
                data={s.ledger.map((l, i) => ({
                  name: time(l.at),
                  saldo:
                    s.ledger.slice(0, i + 1).reduce((n, x) => n + x.amount, 0) /
                    100,
                }))}
              >
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#c5a66d" stopOpacity={0.4} />
                    <stop offset="1" stopColor="#c5a66d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#718085" />
                <Tooltip />
                <Area
                  type="stepAfter"
                  dataKey="saldo"
                  name="Saldo €"
                  stroke="#c5a66d"
                  fill="url(#gold)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Operacja</th>
                  <th>Referencja</th>
                  <th>Kwota</th>
                </tr>
              </thead>
              <tbody>
                {s.ledger
                  .slice()
                  .reverse()
                  .map((l) => (
                    <tr key={l.id}>
                      <td>{date(l.at)}</td>
                      <td>{l.type}</td>
                      <td>{l.ref}</td>
                      <td className={l.amount < 0 ? "loss" : "gain"}>
                        {euro(l.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "Uczestnicy" && (
        <section>
          <h2>Ludzie, nie losowe komunikaty</h2>
          <p className="muted">
            Podgląd diagnostyczny silnika. Prywatne limity są widoczne tutaj,
            aby można było sprawdzić przyczyny decyzji.
          </p>
          <div className="people-grid">
            {s.people.map((p) => (
              <article className="card panel" key={p.id}>
                <div className="person-head">
                  <div className="avatar">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3>{p.name}</h3>
                    <small>
                      {p.city} · {p.role === "bidder" ? "Licytant" : "Klient"}
                    </small>
                  </div>
                </div>
                <dl>
                  <dt>Budżet / blokady</dt>
                  <dd>
                    {euro(p.budget)} / {euro(p.reserved)}
                  </dd>
                  <dt>Strategia</dt>
                  <dd>
                    {
                      {
                        early: "Wczesne oferty",
                        measured: "Rozważny",
                        snipe: "Ostatnie sekundy",
                      }[p.strategy]
                    }
                  </dd>
                  <dt>Zainteresowania</dt>
                  <dd>{p.favorites.join(", ")}</dd>
                  <dt>Cierpliwość / wrażliwość cenowa</dt>
                  <dd>
                    {Math.round(p.patience * 100)} /{" "}
                    {Math.round(p.sensitivity * 100)}
                  </dd>
                  <dt>Zaufanie / negocjacje</dt>
                  <dd>
                    {Math.round(p.trust * 100)} /{" "}
                    {Math.round(p.negotiation * 100)}
                  </dd>
                  <dt>Kolekcja</dt>
                  <dd>{p.owned.length} butelek</dd>
                </dl>
                <details>
                  <summary>Pamięć · {p.memory.length} zdarzeń</summary>
                  {p.memory
                    .slice(-15)
                    .reverse()
                    .map((m, i) => (
                      <p key={i}>
                        {date(m.at)} · {memoryLabel(m.kind)} · {m.ref} ·{" "}
                        {m.detail}
                      </p>
                    ))}
                  {p.role === "bidder" &&
                    active.map((a) => (
                      <p key={a.id}>
                        Limit {a.id}: {euro(a.limits[p.id])}
                      </p>
                    ))}
                </details>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
const memoryLabel = (kind: string) =>
  ({
    watch: "Obserwacja",
    bid: "Oferta",
    won: "Wygrana",
    lost: "Przegrana",
    withdraw: "Rezygnacja",
    inquiry: "Zapytanie",
    passed: "Pominięcie",
    ignored: "Brak odpowiedzi",
    rejected: "Odmowa",
    purchase: "Zakup",
    refund: "Zwrot",
    delivered: "Doręczenie",
    complaint: "Reklamacja",
    wait: "Oczekiwanie",
    "counter-rejected": "Odrzucona cena",
  })[kind] ?? kind;
