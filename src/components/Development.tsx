import {
  Trophy,
  ArrowUpRight,
  Lock,
  Package,
  Shield,
  Store,
  Megaphone,
  Users,
} from "lucide-react";
import { type State } from "../engine";
import {
  progress,
  shopLevel,
  levelStart,
  upgrades,
  achievements,
  buyUpgrade,
  upgradeCost,
  capacity,
  tradeContacts,
} from "../progression";
import { euro } from "../catalog";
import type { Mutate } from "../useGame";
const icons = {
  warehouse: Package,
  packing: Shield,
  website: Store,
  marketing: Megaphone,
  contacts: Users,
};
export default function Development({
  state: s,
  mutate,
}: {
  state: State;
  mutate: Mutate;
}) {
  const p = progress(s),
    level = shopLevel(s),
    start = levelStart(level),
    next = levelStart(level + 1);
  return (
    <section className="development">
      <div className="progress-hero">
        <div className="level-medal">{level}</div>
        <div>
          <p className="eyebrow">POZIOM SKLEPU</p>
          <h2>
            {
              [
                "Początkujący handlarz",
                "Własny salon",
                "Znany kolekcjoner",
                "Dom kolekcjonerski",
              ][Math.min(3, level - 1)]
            }
          </h2>
          <p>
            {p.xp} PD · następny poziom {next} PD
          </p>
          <progress
            aria-label="Postęp poziomu"
            value={p.xp - start}
            max={next - start}
          />
        </div>
        <span>
          {s.items.filter((i) => i.status !== "sold").length}/{capacity(s)}{" "}
          miejsc
        </span>
      </div>
      <h2>Rozwijaj swój salon</h2>
      <div className="upgrade-grid">
        {upgrades.map((u) => {
          const Icon = icons[u.id],
            tier = p.upgrades[u.id],
            locked = level < u.level;
          return (
            <article className="upgrade-card" key={u.id}>
              <Icon size={27} />
              <span className="badge">
                {locked ? (
                  <>
                    <Lock size={12} /> Poziom {u.level}
                  </>
                ) : (
                  `Stopień ${tier}/3`
                )}
              </span>
              <h3>{u.name}</h3>
              <p>{u.detail}</p>
              <button
                disabled={locked || tier >= 3}
                onClick={() => mutate((g) => buyUpgrade(g, u.id))}
              >
                {tier >= 3 ? "Rozwinięte" : euro(upgradeCost(s, u.id))}
                <ArrowUpRight size={16} />
              </button>
            </article>
          );
        })}
      </div>
      <h2>Kontakty handlowe</h2>
      <div className="contacts-grid">
        {tradeContacts.map((c) => (
          <article
            className={`trade-contact ${p.upgrades.contacts >= c.tier ? "unlocked" : ""}`}
            key={c.id}
          >
            <span className="contact-avatar">
              {c.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <h3>{c.name}</h3>
              <p>
                {c.country} · {c.specialty}
              </p>
            </div>
            <span>
              {p.upgrades.contacts >= c.tier
                ? "W kontakcie"
                : `Sieć kontaktów ${c.tier}`}
            </span>
          </article>
        ))}
      </div>
      <h2>
        Twoje osiągnięcia{" "}
        <span className="muted">
          {p.achievements.length}/{achievements.length}
        </span>
      </h2>
      <div className="achievement-grid">
        {achievements.map((a) => (
          <article
            className={`achievement ${p.achievements.includes(a.id) ? "earned" : ""}`}
            key={a.id}
          >
            <Trophy size={26} />
            <div>
              <h3>{a.name}</h3>
              <p>{a.detail}</p>
            </div>
            <span>
              {p.achievements.includes(a.id) ? "Zdobyte" : "Przed Tobą"}
            </span>
          </article>
        ))}
      </div>
      <p className="muted">
        PD otrzymujesz za wygrane aukcje, kontrolę towaru, sprzedaż i
        doręczenia. Ulepszenia nie gwarantują zysku.
      </p>
    </section>
  );
}
