# JW Collection Store

Polska, lokalna gra ekonomiczna React + TypeScript. Nie wymaga serwera aplikacji, API, kont ani kluczy. Pieniądze przechowywane są w eurocentach. Start: 5 000 €. MVP zawiera 18 rzeczywistych nazw edycji Johnnie Walker; dane cenowe są wyłącznie balansem gry, bez deklarowania aktualnych cen rynkowych. Nie podajemy niezweryfikowanych parametrów butelkowania.

## Uruchomienie

Node.js 24, npm:

```sh
npm ci
npm test
npm run dev
```

Produkcja: `npm run build`, podgląd: `npm run preview`. Domyślnie Vite używa portu 5173, podgląd 4173. Testy silnika nie potrzebują przeglądarki ani usług. Testy interfejsu opisano niżej.

## Jak grać

1. W menu wybierz poziom trudności (domyślnie Realistyczna) i NOWA GRA. Przy zapisanej rozgrywce użyj KONTYNUUJ.
2. Na aukcji złóż ofertę. Minimalne przebicie 5 €, potwierdzenie po 100–900 ms. Gotówka jest blokowana z uwzględnieniem 12% prowizji i 15 € dostawy. Płacisz tylko za zwycięstwo.
3. Po 24 rzeczywistych godzinach skontroluj dostawę w magazynie. Sam wpisz cenę i wystaw produkt.
4. Klienci odwiedzają sklep w godzinach 8–22 Amsterdam. Nie każdy produkt pasuje do ich zainteresowań, opakowania i możliwości finansowych. Wiadomość może nie nadejść tego samego dnia.
5. W komunikatorze odpowiedz własnym tekstem lub rozwiń konkretne działania. Kontrpropozycja zawiera dostawę. Klient podejmuje decyzję po 45–240 sekundach, według cierpliwości i zapisanego generatora. Oczekująca odpowiedź jest zachowana po odświeżeniu. Niejasny tekst nie zawiera ukrytej decyzji.
6. Zapakuj zamówienie, kup etykietę i nadaj. Niezabezpieczona paczka obniża stan i może wywołać reklamację. Doręczenie po 2 dniach.
7. Zwroty obsłuż w zamówieniu. Pełny zwrot uruchamia fizyczny powrót egzemplarza po 2 dniach. Częściowy zwrot nie usuwa praw konsumenta. Model gry nie stanowi porady prawnej.

## Rzeczywisty silnik

`src/engine.ts` nie zależy od React ani zegara przeglądarki. `advance(state, timestamp)` przetwarza kolejkę po terminie i numerze rejestracji. Zapis obejmuje generator pseudolosowy, osoby, pieniądze, pamięć, limity każdej aukcji i przyszłe decyzje. Wynik po powrocie jest taki sam jak wynik ciągłego przetwarzania tych samych zdarzeń.

- 5 stałych rywali: budżet wspólny dla aukcji, rezerwacje, zainteresowania, kolekcja, wrażliwość na cenę, cierpliwość, strategia, pamięć przegranych. Maksimum ustalane przed aukcją. Zakup obniża budżet; przegrana nic nie kosztuje.
- 5 stałych klientów: osobne budżety, godziny wizyt, preferowany stan, ulubione kategorie, zaufanie, negocjacje, historia odmów i zakupów. Brak anonimowego generatora komunikatów.
- Ekran Uczestnicy pokazuje stan i przyczyny decyzji. Jest to diagnostyczny podgląd, ujawniający także prywatne limity rywali.
- Jedna butelka zostaje zarezerwowana atomowo w stanie gry. Pozostałe negocjacje dotyczące tego egzemplarza są zamykane.
- Dziennik finansowy ma identyfikatory operacji; ponowne przetworzenie tego samego czasu nie księguje ponownie zakupów.
- Co 6 godzin pojawia się kolejna aukcja. Nie ma nieskończonego dochodu NPC: gdy skończą się ich budżety, ograniczają aktywność.
- Trudność wpływa na prywatne limity licytantów, nie wymusza przegranej gracza.

Przy zamkniętej przeglądarce nic się nie wykonuje; zdarzenia są rekonstruowane po powrocie. Cofnięcie zegara zatrzymuje postęp do ostatniego zapisanego czasu. Zmiana czasu do przodu i edycja pliku nadal pozwalają manipulować lokalną grą. Porcja odtwarzania ma limit 20 000 zdarzeń; dłuższa kolejka jest kontynuowana w kolejnych cyklach. IndexedDB zapisuje rozgrywkę co sekundę i po działaniu. Nie otwieraj dwóch aktywnych kart tej samej rozgrywki — synchronizacja między kartami i urządzeniami nie jest obsługiwana.

## Zapis, eksport, offline

Eksport/import znajdziesz w Pomoc → Pomoc i zapisy. Import jest też w dyskretnym menu „Twoje zapisy” na ekranie startowym. Eksport pobiera JSON zawierający wszystkie osoby i kolejkę zdarzeń. Import sprawdza wersję, strukturę i podstawowe referencje. Format nadal ma wersję 1. Stare zapisy działają bez resetu: pola `readAt` i `pendingReply` są opcjonalne. Zapis zachowuje też nowe zdarzenie `reply`; starsza wersja aplikacji nie powinna odczytywać nowszych zapisów. Obce wersje są odrzucane.

Service worker produkcyjny zachowuje pliki aplikacji po pierwszym otwarciu online. Następne otwarcie może działać offline; stan pochodzi z IndexedDB tej samej przeglądarki i domeny. Czyszczenie danych witryny usuwa postęp. Regularnie eksportuj zapis. Przy błędzie IndexedDB interfejs ostrzega o konieczności eksportu.

## GitHub i Pages

Projekt ma względną bazę Vite (`./`), więc działa pod `/tradegame/` i inną nazwą repozytorium bez zmiany kodu. Nie ma routingu wymagającego przekierowań serwera.

```sh
git add .
git commit -m "Add JW Collection Store simulation"
git push origin HEAD:main
```

W GitHub: **Settings → Pages → Source → GitHub Actions**. Workflow `.github/workflows/pages.yml` uruchomi testy i build, a następnie opublikuje `dist`. Publikacja wymaga uprawnień repozytorium i nie została wykonana przez samo utworzenie plików.

## Rozszerzanie katalogu i zdjęć

Dane są w `src/catalog.ts`. Dodaj stabilny identyfikator, potwierdzoną nazwę edycji, kategorię, referencyjną cenę w centach i rzadkość. Sprawdź istnienie edycji i parametry w wiarygodnym źródle przed ich dopisaniem; nie zgaduj roczników ani pojemności.

Licencjonowane zdjęcia umieść w `public/images/whisky/`, a ich przypisanie i metadane w `src/product-media.json`. Instrukcja i status źródeł: `IMAGE_SOURCES.md`. `ProductGallery` obsługuje osobne fotografie butelki i opakowania, miniatury, powiększanie oraz błąd ładowania. Helper `assetUrl` dodaje `import.meta.env.BASE_URL`; nie używaj ścieżki `/images/...` bez resolvera. Produkcyjny service worker zachowuje także przypisane fotografie offline.

`npm run check:images` sprawdza istnienie i format przypisanych plików oraz metadane. `npm run check:images:strict` dodatkowo wymaga zdjęć trzech głównych aukcji: Blue Label, King George V i Swing. Obecnie strict kończy się błędem, ponieważ brak legalnych plików. Weryfikacja licencji Wikimedia jest zablokowana przez sieć środowiska (403). Nie zastąpiono tego fotografiami innych butelek ani obrazami AI.

## Zakres MVP

Działają aukcje, magazyn, ręczne ceny, klienci i tekstowe negocjacje, realizacja, reklamacje, finanse, trwały zapis i odtwarzanie. Katalog 40–60 edycji, pozyskanie udokumentowanych zdjęć, różne warianty butelkowania, losowe szkody transportu przychodzącego, rozbudowana obsługa niezgodności opisu oraz synchronizacja wielu kart pozostają poza tą pierwszą wersją. Placeholdery nie są fotografiami produktów.

## Przebudowa interfejsu

- Menu gry z nową grą, kontynuacją, dyskretnym wyborem trudności i zapisów.
- Kompaktowy pasek gotówki i reputacji; pełne statystyki tylko w Finansach.
- „Dzieje się teraz” wynika z aktywnych aukcji, zapytań, dostaw i zamówień.
- Pokój aukcyjny ma własną kwotę, pełny koszt, zegar, prawdziwą historię ofert/obserwacji/wycofań i wyróżnienie ostatnich 30 sekund. Powiadomienia o przebiciu pochodzą z silnika.
- Komunikator: lista osób, miasta, ostatnie wiadomości, nieprzeczytane, historia i odroczone odpowiedzi.
- Wygrana aukcja i animowane otwieranie paczki; przyjęcie do magazynu wymaga osobnej decyzji.
- Informacje techniczne i eksport przeniesiono do Pomocy. Żadne finanse nie są dekoracyjnymi licznikami.

## Testy interfejsu pod ścieżką Pages

```sh
npm run build
npx playwright install chromium
npm run test:e2e
```

Na maszynie z systemowym Chromium: `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`.
Testy startują serwer gotowego `dist` pod `/tradegame/`, bez fallbacku dla brakujących plików. Obejmują licytację, czas, reakcje NPC, zapis, komunikator, odroczoną odpowiedź, wygraną, otwieranie paczki, widok 390 px i offline. Test prawdziwych zdjęć jest oznaczony jako pominięty, dopóki manifest nie zawiera plików. Nie oznacza to spełnienia warunku akceptacji fotografii. Testy używają kontrolowanych zapisów i czasu; nie odczekują doby na dostawę.
