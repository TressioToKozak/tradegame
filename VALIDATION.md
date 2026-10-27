# Weryfikacja przebudowy

## Zaliczone

- `npm test`: **26 testów**, 3 pliki. Dotychczasowe scenariusze finansów i chronologicznego odtwarzania nadal przechodzą. Nowe testy sprawdzają kolejkę odpowiedzi, zgodność zapisów wersji 1, nieprzeczytane wiadomości, brak podwójnej sprzedaży podczas oczekiwania oraz resolver ścieżek i galerię.
- Testy komponentu galerii używają kontrolowanych nazw plików w JSDOM: wybór opakowania, wymiary obrazu, powiększenie, Escape i fokus, błąd pliku oraz zmiana edycji. Te testy **nie są weryfikacją autentycznych fotografii**.
- `npm run build`: TypeScript i produkcyjna kompilacja Vite.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`: **6 zaliczonych, 1 pominięty**. Testy działają na gotowym `dist` pod rzeczywistym prefiksem `/tradegame/`; brakujące pliki zwracają 404, a nie stronę HTML.
- Chromium: nowa gra, odliczanie czasu, prawdziwe oferty NPC, oferta gracza i odświeżenie; komunikator i zachowanie przyszłej odpowiedzi po odczycie IndexedDB; sekwencja otwierania paczki i osobna decyzja o przyjęciu; ekran wygranej i pełny koszt; finanse i viewport 390 px; ponowne otwarcie produkcyjnej aplikacji bez sieci.
- Obejrzano zrzuty menu startowego, pulpitu i aukcji. Zweryfikowano brak poziomego przepełnienia na telefonie.
- Workflow Pages uruchamia teraz także testy Chromium przed publikacją.

Testy wykorzystują kontrolowane zapisy i czas. Nie odczekiwano dobowych transportów w czasie rzeczywistym. Testy finansów rozliczają je poprzez ten sam silnik odtwarzania, który działa przy powrocie użytkownika.

## Niespełnione / zablokowane

- `npm run check:images:strict`: **nie przechodzi** — brak fotografii Blue Label, King George V i Swing. Zwykły weryfikator nie znalazł przypisanych plików i ostrzega, że manifest jest pusty.
- Test rzeczywistych fotografii w Chromium: **pominięty**, dopóki nie ma legalnych plików w manifeście. Nie zastąpiono go testem obrazów AI ani innych produktów.
- Pozyskanie i sprawdzenie licencji z Wikimedia Commons: zablokowane przez politykę sieciową środowiska, `CONNECT 403`.
- Odczyt `https://tressiotokozak.github.io/tradegame/`: również zablokowany przez `CONNECT 403`. Zaliczone testy pod `/tradegame/` są lokalnymi testami gotowego buildu, **nie potwierdzeniem udanego wdrożenia na publicznym GitHub Pages**.

W konfiguracji środowiska zapisano wymagane domeny `commons.wikimedia.org`, `upload.wikimedia.org` i `tressiotokozak.github.io`. Sam zapis draftu nie stosuje ani nie publikuje konfiguracji. Stan tego ograniczenia jest opisany w `IMAGE_SOURCES.md`.
