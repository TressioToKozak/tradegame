import { ArrowUpRight, ChevronDown, Play } from "lucide-react";
import { useState } from "react";
import ProductGallery from "./ProductGallery";
import { date } from "../ui";
import type { State } from "../engine";
export default function GameMenu({
  state: s,
  onStart,
  onContinue,
  onImport,
  onHelp,
}: {
  state: State | null;
  onStart: (difficulty: string) => void;
  onContinue: () => void;
  onImport: () => void;
  onHelp: () => void;
}) {
  const [difficulty, setDifficulty] = useState("Realistyczna");
  return (
    <main className="game-menu">
      <div className="menu-top">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-seal">JW</span>
          <span>
            COLLECTION STORE<small>AMSTERDAM · THE NETHERLANDS</small>
          </span>
        </a>
        <button className="text-button" onClick={onHelp}>
          Pomoc i ustawienia <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="menu-scene">
        <div className="menu-story">
          <p className="eyebrow">
            TWOJA PASJA. TWOJA KOLEKCJA. TWOJE IMPERIUM.
          </p>
          <h1>
            JW
            <br />
            <em>Collection</em>
            <br />
            Store<span>.</span>
          </h1>
          <p className="menu-tagline">
            Od pierwszej butelki
            <br />
            do kolekcjonerskiego imperium.
          </p>
          <div className="menu-actions">
            <button className="menu-new" onClick={() => onStart(difficulty)}>
              NOWA GRA <ArrowUpRight size={19} />
            </button>
            {s && (
              <button className="menu-continue outline" onClick={onContinue}>
                <Play size={15} />
                KONTYNUUJ
              </button>
            )}
          </div>
          <div className="menu-options">
            <label>
              Poziom trudności{" "}
              <select
                aria-label="Poziom trudności"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                {["Łatwa", "Normalna", "Realistyczna", "Ekspert"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <details>
              <summary>
                Twoje zapisy <ChevronDown size={12} />
              </summary>
              {s && <p>Ostatni zapis: {date(s.now)}</p>}
              <button className="text-button" onClick={onImport}>
                Importuj rozgrywkę
              </button>
            </details>
          </div>
        </div>
        <div className="menu-collection">
          <span className="scene-arch" />
          <ProductGallery collection />
          <div className="collection-caption">
            <span>THE ART OF COLLECTING</span>
            <p>
              Niektóre historie
              <br />
              zaczynają się od jednej butelki.
            </p>
            <i>01 / TWOJA KOLEKCJA CZEKA</i>
          </div>
        </div>
      </div>
      <div className="menu-bottom">
        <span>
          KOLEKCJONUJ <b>·</b> LICYTUJ <b>·</b> NEGOCJUJ
        </span>
        <span>Niezależna gra ekonomiczna</span>
      </div>
    </main>
  );
}
