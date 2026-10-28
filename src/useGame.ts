import { useCallback, useEffect, useRef, useState } from "react";
import { advance, createGame, type State, type Pace } from "./engine";
import { load, save, parseSave, backupLegacy } from "./storage";
import { date } from "./ui";
export type Mutate = (fn: (g: State) => unknown) => void;
export function useGame() {
  const [state, setState] = useState<State | null>(null),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [wins, setWins] = useState<string[]>([]),
    [needsMigration, setNeedsMigration] = useState(false);
  const legacy = useRef<State | null>(null);
  const current = useRef<State | null>(null),
    busy = useRef(false),
    seenWins = useRef(new Set<string>());
  const update = useCallback((g: State) => {
    const newWins = g.auctions.filter(
      (a) =>
        a.status === "closed" &&
        a.leader === "player" &&
        !seenWins.current.has(a.id),
    );
    newWins.forEach((a) => seenWins.current.add(a.id));
    if (newWins.length) setWins((w) => [...w, ...newWins.map((a) => a.id)]);
    current.current = g;
    setState(structuredClone(g));
  }, []);
  const persist = useCallback((g: State) => {
    setSaved(false);
    save(g)
      .then(() => setSaved(true))
      .catch(() =>
        setError(
          "Nie udało się zapisać postępu. Wyeksportuj grę przed zamknięciem.",
        ),
      );
  }, []);
  const mutate: Mutate = useCallback(
    (fn) => {
      if (!current.current || busy.current) return;
      const previous = current.current;
      const g = structuredClone(previous);
      const target = Date.now();
      advance(g, target);
      const result =
        g.now < target
          ? "Odtwarzanie zaległych zdarzeń. Poczekaj chwilę przed kolejną decyzją."
          : fn(g);
      if (typeof result === "string") setNotice(result);
      else {
        const fresh = g.feed.filter(
          (f) =>
            f.at >= previous.now &&
            !previous.feed.some(
              (old) => old.at === f.at && old.text === f.text,
            ),
        );
        const important = fresh.find((f) =>
          /przebity|Oferta zaakceptowana|Oferta spóźniona|zamówienie|Dostawa dotarła|pyta o/.test(
            f.text,
          ),
        );
        if (important) setNotice(important.text);
      }
      update(g);
      persist(g);
    },
    [update, persist],
  );
  useEffect(() => {
    let active = true;
    load()
      .then((s) => {
        if (!active) return;
        if (s && Number(s.version) === 1) {
          legacy.current = structuredClone(s);
          setNeedsMigration(true);
          setReady(true);
          return;
        }
        if (s) {
          s.auctions
            .filter((a) => a.status === "closed")
            .forEach((a) => seenWins.current.add(a.id));
          const previous = s.now;
          advance(s, Date.now());
          update(s);
          persist(s);
          if (Date.now() - previous > 60000)
            setNotice(
              `Witaj ponownie. Odtworzono wydarzenia od ${date(previous)}.`,
            );
        }
        setReady(true);
      })
      .catch(() => {
        setError(
          "Brak dostępu do zapisu IndexedDB. Sprawdź ustawienia przeglądarki.",
        );
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [update, persist]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const timer = setInterval(() => mutate(() => {}), 1000);
    return () => clearInterval(timer);
  }, [mutate]);
  const start = (difficulty: string, pace: Pace = "Dynamiczne") => {
    seenWins.current.clear();
    setWins([]);
    const g = createGame(
      Date.now(),
      crypto.getRandomValues(new Uint32Array(1))[0],
      difficulty,
      pace,
    );
    update(g);
    persist(g);
  };
  const download = (data: State, name = "jw-collection-zapis.json") => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };
  const exportGame = () => {
    const data = current.current ?? legacy.current;
    if (data) download(data);
  };
  const exportLegacy = () => {
    if (legacy.current)
      download(legacy.current, "jw-collection-przed-migracja.json");
  };
  const migrate = async () => {
    if (!legacy.current) return;
    try {
      await backupLegacy(legacy.current);
      const g = parseSave(JSON.stringify(legacy.current));
      advance(g, Date.now());
      update(g);
      await save(g);
      setNeedsMigration(false);
      setSaved(true);
    } catch (e) {
      setError(
        "Migracja nie powiodła się. Oryginalny zapis nie został usunięty.",
      );
    }
  };
  const importGame = async (file: File) => {
    busy.current = true;
    try {
      if (file.size > 10_000_000) throw Error("Plik jest za duży.");
      const g = parseSave(await file.text());
      if (
        current.current &&
        !confirm("Zastąpić bieżącą rozgrywkę importowanym zapisem?")
      )
        return false;
      seenWins.current = new Set(
        g.auctions.filter((a) => a.status === "closed").map((a) => a.id),
      );
      setWins([]);
      advance(g, Date.now());
      await save(g);
      update(g);
      setSaved(true);
      setNotice("Zapis zaimportowany.");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie można odczytać pliku.");
      return false;
    } finally {
      busy.current = false;
    }
  };
  return {
    state,
    needsMigration,
    exportLegacy,
    migrate,
    ready,
    notice,
    setNotice,
    error,
    setError,
    saved,
    wins,
    dismissWin: () => setWins((w) => w.slice(1)),
    mutate,
    start,
    exportGame,
    importGame,
  };
}
