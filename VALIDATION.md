# Weryfikacja kandydata 3.0

## Silnik i zapis

`npm test`: **64 testy jednostkowe i komponentowe**, bez pominiętych. Zachowane obliczenia aukcji, wspólne budżety NPC, klienci, rezerwacje, zwroty, księga i import. Nowe testy obejmują płatne ulepszenia, blokady gotówki, pojemność w momencie rejestracji, jednokrotne PD, zgodność starszych zapisów, wpływ pakowania na ryzyko, kontakty i pochodzenie partii, przedziały wyceny i brak mnożnika rzadkości.

Godzinny rynek utrzymuje zwykle 12–20 aukcji, nigdy więcej niż 20; test obciążenia obejmuje 20 partii i wspólne budżety. Trzy dni offline odtwarzają się w około 1 s na tej maszynie; to obserwacja, nie gwarancja wydajności telefonu. Silnik przetwarza ograniczone porcje 50 000 zdarzeń. Test porównuje pełne odtworzenie w takich porcjach z odtwarzaniem co minutę; oba kończą na żądanym czasie i identycznym stanie, także z doświadczeniem.

Anti-sniping: próg 10/11 sekund, wielokrotne +15 s, gracz/NPC, spóźnione/odrzucone/własne oferty, stare zdarzenia zamknięcia, zaktualizowane decyzje snajperów, odświeżenie i jedno rozliczenie.

## Przeglądarka i wygląd

**14 scenariuszy Chromium zaliczonych**, bez pominiętych, na skompilowanym `dist`, serwowanym z rzeczywistego podfolderu `/tradegame/`. Zestaw obejmuje menu i nieinteraktywne zdjęcie kolekcji, focus, monogram, osobną konfigurację nowej gry, licytację, zegary i NPC, klientów i zapis odpowiedzi, rozpakowanie, finanse, mobilny układ, tryb offline, migrację z eksportem oryginału, zdjęcia, filtry, checkbox, obserwowanie, limit, rozwój i koszt/pojemność po odświeżeniu, ustawienie uproszczonych animacji i tooltip zamykany Escape.

Test anti-sniping korzysta z rzeczywistego upływu czasu przez około 39 s: gracz przedłuża aukcję, odświeża stronę, NPC ponownie przedłuża, żaden wcześniejszy termin nie zamyka aukcji, budżet NPC i pamięć zwycięstwa są rozliczone raz.

Zrzuty menu, pulpitu, rozwoju i rynku mobilnego zapisują się w `test-results/`; wybrane są zachowane w `docs/screenshots/`. Obejrzano ekran menu, pulpit, rynek mobilny i rozwój. Po przeglądzie zmniejszono karty bez fotografii, skrócono sekcję nowych okazji i usunięto część mikrotekstu z telefonu. Zrzuty nie ukrywają braku 44 fotografii.

Każdy z 15 przypisanych plików jest dekodowany przez `Image.decode()` w prawdziwym Chromium, a 12 sfotografowanych produktów sprawdza `complete` i `naturalWidth` na kartach. To nie jest test kompletności całego katalogu.

## Build i blokery

- TypeScript, Vite i kontrola istniejących fotografii przechodzą.
- **`check:images:all` nie przechodzi: 44 braki z 56 produktów.** W tej sesji nie pozyskano nowych plików: wszystkie osiem sprawdzonych źródeł jest zablokowane przez proxy CONNECT 403. Pełna lista w `MISSING_IMAGES.md`.
- Aktualne detaliczne ceny i zakończone aukcje nie zostały zewnętrznie zweryfikowane. Szacunki są oznaczone jako szacunki, a daty i źródła nie są fabrykowane.
- Publiczna domena Pages także jest poza aktywną listą dostępu tego środowiska. Nie wykonano końcowego testu nowej wersji na publicznym hostingu.
- Kandydat pozostaje na gałęzi `jwcs-v3`, bez zastąpienia opublikowanej gry. Publikacja wymaga przejścia kontroli fotografii całego katalogu. Zgodność z podfolderem Pages i tryb offline sprawdzono lokalnie; nie jest to deklaracja wydania 3.0.
