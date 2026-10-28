import { ArrowRight, Play, Settings, Upload } from "lucide-react";
import { useState } from "react";
import { Modal } from "./ProductGallery";
import Brand from "./Brand";
import { assetUrl, productMedia } from "../media";
import { cash } from "../engine";
import { euro } from "../catalog";
import { shopLevel } from "../progression";
import { pacing, type Pace } from "../pace";
import type { State } from "../engine";
export default function GameMenu({
  state: s,
  onStart,
  onContinue,
  onImport,
  onHelp,
}: {
  state: State | null;
  onStart: (d: string, p: Pace) => void;
  onContinue: () => void;
  onImport: () => void;
  onHelp: () => void;
}) {
  const [newGame, setNewGame] = useState(false),
    [difficulty, setDifficulty] = useState("Realistyczna"),
    [pace, setPace] = useState<Pace>("Dynamiczne");
  const photo = productMedia.collection[0];
  return (
    <main className="game-menu menu-v3 menu-v31">
      <div className="menu-story">
        <div className="menu-identity">
          <Brand />
          <span>
            JW COLLECTION STORE<small>TWÓJ DOM KOLEKCJONERSKI</small>
          </span>
        </div>
        <p className="menu-wordmark">JOHNNIE WALKER COLLECTION STORE</p>
        <h1>
          Twoja pasja.
          <br />
          <em>Twoje imperium.</em>
        </h1>
        {s && (
          <div className="menu-resume">
            <span className="menu-level">{shopLevel(s)}</span>
            <div>
              <strong>Twój salon</strong>
              <span>
                {euro(cash(s))} ·{" "}
                {s.items.filter((i) => i.status !== "sold").length} butelek
              </span>
            </div>
            <b>
              {s.auctions.filter((a) => a.status === "active").length}
              <small>aukcji na żywo</small>
            </b>
          </div>
        )}
        <div className="menu-actions">
          <button className="menu-primary" disabled={!s} onClick={onContinue}>
            <Play size={20} /> KONTYNUUJ GRĘ
          </button>
          <button
            className={s ? "outline" : "menu-primary"}
            onClick={() => setNewGame(true)}
          >
            NOWA GRA <ArrowRight size={20} />
          </button>
          <button className="text-button" onClick={onHelp}>
            <Settings size={18} /> USTAWIENIA
          </button>
        </div>
        <button className="text-button import-menu" onClick={onImport}>
          <Upload size={15} /> Importuj zapis
        </button>
      </div>
      <div className="menu-photography">
        {photo && (
          <>
            <img
              src={assetUrl(photo.path)}
              alt="Fotograficzna kolekcja butelek Johnnie Walker"
            />
          </>
        )}
      </div>
      {newGame && (
        <Modal
          title="Nowa gra"
          onClose={() => setNewGame(false)}
          className="new-game-dialog"
        >
          <p className="eyebrow">TWÓJ PIERWSZY SALON</p>
          <h2>Otwórz własny sklep</h2>
          <p>5 000 € kapitału. Reszta zależy od Twoich decyzji.</p>
          <label>
            Poziom trudności
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
          <label>
            Tempo gry
            <select
              aria-label="Tempo gry"
              value={pace}
              onChange={(e) => setPace(e.target.value as Pace)}
            >
              {Object.keys(pacing).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <p className="muted">{pacing[pace]}</p>
          <button
            className="full"
            onClick={() => {
              onStart(difficulty, pace);
              setNewGame(false);
            }}
          >
            ROZPOCZNIJ GRĘ <ArrowRight size={18} />
          </button>
        </Modal>
      )}
    </main>
  );
}
