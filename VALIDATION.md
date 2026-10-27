# Weryfikacja aktualizacji rynku 2.1

## Zaliczone

- **50 testów jednostkowych/komponentowych**: dotychczasowe finanse, NPC, zapis i chronologiczne odtwarzanie; siedem edycji i brak duplikatu `rye`; eurocenty, dostępność, częstotliwość, popyt/płynność, opłaty, pełny raport fotografii, anti-sniping i zgodność zapisów 1/2.
- Anti-sniping w silniku: próg dokładnie 10 sekund, brak przedłużenia przy 11 sekundach, wielokrotne +15 s, odrzucenia, własne podbijanie, oferta w chwili końca, stare `close`, aktualizacja snajperów, wznowienie JSON i jednokrotne rozliczenie.
- **10 scenariuszy Chromium**, bez pominiętych, na gotowym `dist` pod `/tradegame/`. Dotychczasowe licytacje, komunikator, paczki, finanse, mobile, offline i migracja oraz rzeczywiste zdjęcia i nowy anti-sniping.
- Scenariusz anti-sniping w przeglądarce korzysta z prawdziwego upływu czasu: koniec za 8 sekund → oferta gracza → +15 sekund → odświeżenie → oferta NPC 5 sekund przed nowym końcem → kolejne +15 sekund → brak zamknięcia przy starym terminie → jedno rozliczenie. Trwa około 39 sekund. Nie zastąpiono go sztucznym odliczaniem.
- Test zdjęć otwiera wszystkie 12 sfotografowanych produktów i sprawdza `complete`/`naturalWidth`, a następnie dekoduje wszystkie 15 plików, w tym opakowania i kolekcję, przez `Image.decode()` w Chromium. To są fotografie produkcyjne, nie atrapy.
- Godzinny test rynku: zwykle 8–15 aktywnych, brak pustego rynku. Test 15 aukcji sprawdza wspólne budżety. Trzy dni odtworzone w około 0,4 s w tej maszynie po optymalizacji wag i formatowania czasu; to pomiar środowiska, nie gwarancja czasu na telefonie.
- `npm run check:images:strict`: 15 istniejących plików i ich metadane. `npm run report:images`: pełna lista 44 braków w 56-pozycyjnym katalogu. Losowanie nie korzysta z manifestu zdjęć.
- TypeScript i produkcyjny build Vite.

## Nieukończone lub niezweryfikowane

- Fotografie **44 z 56 produktów** nadal nie są dostępne. Pełna lista: [MISSING_IMAGES.md](MISSING_IMAGES.md). `npm run check:images:all` celowo kończy się błędem kompletności; nie jest opisywany jako zaliczony.
- Nie potwierdzono aktualnych ofert cenowych w dwóch niezależnych źródłach dla siedmiu produktów. Wskazane strony producenta i sklepów zwracają 403 w tym środowisku. Wartości są parametrami z polecenia, a `lastVerified` pozostaje puste. High Rye nie udaje potwierdzonej ceny holenderskiej.
- Bezpośrednie otwarcie publicznej strony w Chromium ogranicza konfiguracja certyfikatu proxy. Nie zmieniono zaufania certyfikatów ani nie wyłączono weryfikacji TLS. Publiczny build i fotografie można odrębnie zweryfikować przez HTTPS oraz porównać z przetestowanym lokalnie `dist`; wynik wdrożenia jest podany w końcowym raporcie.
