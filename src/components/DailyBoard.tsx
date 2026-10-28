import { Check, ArrowUpRight, Target, Gift } from "lucide-react";
import { daily, dailyGoals, claimDaily } from "../daily";
import type { State } from "../engine";
import type { Mutate } from "../useGame";
export default function DailyBoard({
  state: s,
  mutate,
  go,
}: {
  state: State;
  mutate: Mutate;
  go: (tab: string) => void;
}) {
  const d = daily(s);
  return (
    <section className="daily-board">
      <div className="section-heading">
        <h2>
          <Target size={20} />
          Twoje cele na dziś
        </h2>
        <span>
          {d.claimed.length}/{dailyGoals.length} odebrane
        </span>
      </div>
      <div className="daily-goals">
        {dailyGoals.map((g) => {
          const count = Math.min(g.target, d.completed[g.id].length),
            done = count >= g.target,
            claimed = d.claimed.includes(g.id);
          return (
            <article
              className={`daily-goal ${done ? "complete" : ""}`}
              key={g.id}
            >
              <div className="goal-symbol">
                {claimed ? <Check size={20} /> : <Gift size={20} />}
              </div>
              <div>
                <h3>{g.title}</h3>
                <p>
                  {g.detail} <span className="goal-reward">+{g.xp} PD</span>
                </p>
                <progress aria-label={g.title} value={count} max={g.target} />
              </div>
              <button
                className={done && !claimed ? "" : "outline"}
                disabled={claimed}
                onClick={() =>
                  done
                    ? mutate((s) => claimDaily(s, g.id))
                    : go(
                        g.id !== "deliver" &&
                          !s.items.some((i) =>
                            ["stock", "inspect", "incoming"].includes(i.status),
                          )
                          ? "Aukcje na żywo"
                          : g.tab,
                      )
                }
              >
                {claimed
                  ? "Odebrano"
                  : done
                    ? `Odbierz ${g.xp} PD`
                    : g.id === "deliver"
                      ? "Zamówienia"
                      : s.items.some((i) =>
                            ["stock", "inspect", "incoming"].includes(i.status),
                          )
                        ? "Do magazynu"
                        : "Szukaj na aukcjach"}
                {!claimed && <ArrowUpRight size={14} />}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
