import { ArrowRight, Play, Settings, Upload } from "lucide-react";
import { useState } from "react";
import { Modal } from "./ProductGallery";
import Brand from "./Brand";
import { assetUrl, productMedia } from "../media";
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
    <main className="game-menu menu-v3">
      <div className="menu-story">
        <Brand />
        <p className="menu-wordmark">
          JOHNNIE WALKER
          <br />
          <strong>COLLECTION STORE</strong>
        </p>
        <h1>
          Zbuduj swoje
          <br />
          <em>whisky imperium.</em>
        </h1>
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
            <div className="menu-photo-credit">
              <a href={photo.source} target="_blank" rel="noreferrer">
                {photo.author}
              </a>{" "}
              ·{" "}
              <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
                {photo.license}
              </a>
            </div>
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
