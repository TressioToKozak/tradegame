# Weryfikacja wersji 2.0

## Zaliczone lokalnie

- **36 testów jednostkowych/komponentowych**: stare finanse, deterministyczne odtwarzanie, transakcje i magazyn; kolejka priorytetowa, migracja 1→2, limity budżetu, zmienne kroki, rekompensata, 35 NPC i 15 równoczesnych aukcji.
- Godzinna symulacja Dynamiczna: brak pustego rynku, nie więcej niż 15 aktywnych partii, zwykle co najmniej 8.
- Trzy dni odtworzone w około 0,7–1,2 s w tej maszynie; po odtworzeniu ograniczone archiwum, najwyżej 120 wpisów pamięci na postać i kilkanaście przyszłych zdarzeń. To pomiar tej maszyny, nie gwarancja czasu na każdym urządzeniu.
- `npm run check:images:strict`: wszystkie początkowe partie mają lokalne pliki i metadane. Łącznie **13 fotografii**.
- Produkcyjny build Vite i TypeScript.
- **9 scenariuszy Chromium** na gotowym `dist` pod `/tradegame/`: nowa gra, czas i rzeczywiste oferty NPC, własna oferta i odświeżenie; odroczona odpowiedź; otwarcie i przyjęcie paczki; wygrana i koszty; telefon 390 px i finanse; offline; powiększenie zdjęcia; dekodowanie zdjęć wszystkich 10 początkowych aukcji, filtry, obserwowane i limit; eksport oryginału przed migracją.
- Zdjęcia są sprawdzane przez `complete` i `naturalWidth`, także po przewinięciu do obrazów ładowanych leniwie. Testy zdjęć nie są już pomijane i nie używają atrap jako fotografii produkcyjnych.
- Obejrzano nowe menu, pulpit i pokój aukcyjny z rzeczywistymi zdjęciami. Brak przepełnienia dokumentu na telefonie.

Testy korzystają z kontrolowanych zapisów i terminów; nie odczekiwano pełnych dni transportu. Pierwotne terminy w migrowanych zapisach nie są skracane. Nie zmieniono kwot historycznych transakcji.

## Zakres nieukończony

`npm run check:images:all` zgłasza **9 braków** pierwotnego katalogu: Aged 18, Brora, Port Ellen, Glenury Royal, The Casks Edition, The Royal Route, The Spice Road, The Gold Route, Year of the Dragon. Nie znaleziono dla nich odpowiednich plików z potwierdzoną licencją; nie podstawiono innych produktów. Dalsze nowe edycje katalogu także nie są w pełni sfotografowane. Szczegóły: `IMAGE_SOURCES.md`.

Dostęp do publicznego GitHub Pages działa (HTTP 200); sprawdzenie nowego opublikowanego buildu jest odrębne od lokalnych testów i opisane w końcowym raporcie. GitHub API do statusu Actions zwraca 403 w tym środowisku, dlatego sam push nie jest traktowany jako dowód publikacji.
