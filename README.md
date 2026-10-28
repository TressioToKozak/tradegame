# JW Collection Store 4.2 — sala aukcyjna

Polski symulator sklepu z kolekcjonerskimi whisky Johnnie Walker. React, TypeScript, Vite, Tailwind, Dexie/IndexedDB. Statyczna aplikacja bez serwera aplikacji, kont, API i kluczy. Kapitał początkowy: 5 000 €. Kwoty w eurocentach. Wyceny są datowanymi referencjami z repozytorium źródłowego lub jawnym szacunkiem; nie gwarantują zysku.

**Pełny import:** 253 edycje obu linii Walker z repozytorium `whisky`, 254 produkty w grze, zero brakujących fotografii. [Raport importu i wycen](IMPORT_REPORT.md).

## Uruchomienie

Node.js 24 i npm:

```sh
npm ci
npm run dev
```

`npm run build` tworzy `dist`; `npm run preview` uruchamia podgląd. Vite używa względnej bazy `./`, więc aplikacja działa też pod `/tradegame/`.

## Rozgrywka

1. Wybierz trudność i tempo (domyślnie **Dynamiczne**). Opcjonalne sześć krótkich kroków wprowadzenia można pominąć.
2. Nowa gra otwiera **16 aukcji**, losowanych z całego katalogu według dostępności; wszystkie mają prawdziwe zdjęcia. Rynek regularnie się uzupełnia; docelowo zwykle 12–20 aktywnych partii.
3. W Aukcjach filtruj kategorię, cenę, rzadkość, czas, nowość i obserwowane. W pokoju aukcyjnym szybkie przyciski tylko wybierają kwotę; **LICYTUJ** ją zatwierdza. Krok zależy od ceny: 5 / 10 / 20 / 50 €. Automatyczną licytację uruchamiasz osobno: wpisz maksymalną cenę młotkową, wybierz aktywację i zatwierdź całkowity koszt. Automat składa minimalne przebicia, respektuje wspólną gotówkę i pojemność, działa po powrocie do gry. Stare limity nie włączają go samoczynnie.
4. Oferta wymaga wolnej gotówki na pełny koszt: cena + prowizja danej aukcji (10–15%) + jej koszt transportu. Rejestracja trwa 100–900 ms, a kolejność rozstrzyga termin i numer zdarzenia. Przegrana nic nie kosztuje. Ważna zmiana lidera w ostatnich 10 sekundach dodaje 15 sekund do terminu; mechanizm może zadziałać wielokrotnie.
5. Odbierz przesyłkę w Magazynie. Dostawy to **skompresowane czasy gry**: krajowe zwykle 3–8 minut, zagraniczne 6–15 minut, czasem dłużej. To nie są terminy rzeczywistego kuriera.
6. Otwórz paczkę, porównaj stan butelki i pudełka z opisem. Niezgodność można zgłosić sprzedawcy; rekompensata jest księgowana raz i koryguje koszt zapasu.
7. Sam ustal cenę sprzedaży. Wystawioną cenę można zmienić. Klienci w godzinach 8–22 Amsterdam wybierają według budżetu, zainteresowań, stanu, zaufania i historii. Nie ma gwarancji zakupu.
8. W komunikatorze odpowiedz tekstem lub wybierz działanie. Widzisz własną cenę, ofertę, koszt nabycia, wysyłkę i przewidywaną marżę po prowizji. Klienci odpowiadają zależnie od profilu: 15–45 s, 45–120 s, 5–15 min; wycofani mogą nie odpowiedzieć. Zmiana ceny wymaga Twojej decyzji.
9. Po sprzedaży egzemplarz jest zarezerwowany. W **Więcej → Zamówienia** zapakuj i nadaj za 9,50 €. Niezabezpieczona paczka może wywołać reklamację. Pełny zwrot uruchamia fizyczny powrót towaru.

Finanse, zamówienia, podgląd NPC i pomoc są w dodatkowym menu. Gotówka i reputacja pozostają na górnym pasku. Tempo można zmienić w Pomocy: dotyczy nowych wydarzeń, nie cen, budżetów ani istniejących zobowiązań i terminów. Zmiana trudności wymaga nowej gry.

## Rozwój sklepu

W **Więcej → Rozwój sklepu**: poziom, PD, pięć płatnych ulepszeń (po trzy stopnie), pięć osiągnięć i trzy kontakty. Magazyn mieści bazowo 24 butelki (+12 na stopień). Nowe oferty sprawdzają pojemność także w momencie rejestracji; istniejący towar nie jest usuwany. Koszt rozwoju jest odliczany od wolnej gotówki i wyniku finansowego.

## Świat i wydajność

- 35 licytantów ze wspólnym dla ich aukcji budżetem, rezerwacjami, krajem, preferencjami, cierpliwością, ryzykiem, strategią i pamięcią. Każda aukcja przyciąga wybranych uczestników; nie wszyscy licytują wszystko.
- 56 rzeczywistych edycji: standardowe, wycofane, historyczne, vintage, Blue Label, Ghost & Rare, Travel Retail i wydania noworoczne. Nie dopisano niezweryfikowanych pojemności ani parametrów butelkowania.
- Zwykłe aukcje trwają 2–4 min, standardowe 4–6 min, wyjątkowe 6–10 min. Zakończenia są zróżnicowane; nowa aukcja daje co najmniej 45 sekund na reakcję.
- W Dynamicznym nowa partia zwykle co 30–60 s. Gdy brakuje aktywnych aukcji, uzupełnianie przyspiesza stopniowo. Maksimum 20 aktywnych. Spokojne i Intensywne zmieniają częstotliwość oraz nową logistykę/reakcje, bez zmiany wartości whisky i budżetów NPC.
- `EventQueue` to kopiec binarny uporządkowany według `(at, id)`. Silnik nie sortuje całej historii dla każdego zdarzenia. Zakończone zdarzenia są usuwane; pamięć każdej postaci mieści 120 wpisów. Archiwum zwykłych zakończonych aukcji jest ograniczone; transakcje, przedmioty i aukcje z udziałem gracza są zachowane.
- `advance(state, time)` jest niezależne od React. Zapisany seed i terminy pozwalają odtworzyć świat po powrocie. Porcja ma limit 50 000 zdarzeń; reszta jest kontynuowana przed kolejnymi działaniami gracza.

Przy zamkniętej przeglądarce nic się nie wykonuje w tle. Zdarzenia są rekonstruowane po powrocie. Cofnięcie zegara nie cofa transakcji. Gra lokalna nie jest odporna na edytowanie zapisu i zegara. Nie otwieraj tej samej rozgrywki w wielu kartach — nie ma synchronizacji kart ani urządzeń.

## Zapisy i migracja

Automatyczny zapis w IndexedDB działa co sekundę i po decyzjach. Eksport/import: Pomoc i ustawienia; import także bezpośrednio w menu startowym.

Format 2 obsługuje dawne zapisy formatu 1. Przy otwarciu starej rozgrywki pojawia się ekran **eksportu oryginału przed migracją**. Przeniesienie zachowuje gotówkę, księgę, przedmioty, aukcje i istniejące terminy. Oryginał jest dodatkowo zachowywany w rekordzie IndexedDB `pre-v2`. Dopiero potwierdzenie uruchamia migrację i nowy rynek. Import starego JSON również jest obsługiwany; plik źródłowy pozostaje u użytkownika. Nie wczytuj nowego zapisu w starej wersji gry.

Service worker zachowuje aplikację oraz ostatnio obejrzane zdjęcia (maksymalnie 80) offline po pierwszym otwarciu online. Czyszczenie danych witryny usuwa postęp; regularnie eksportuj grę.

## Fotografie i synchronizacja katalogu

W grze jest 254 produktów: wszystkie 232 pozycje Johnnie Walker i 21 John Walker & Sons z katalogu źródłowego oraz zachowany Double Black 1000 ml. Zaimportowano 253 fotografie; łącznie manifest wskazuje 255 lokalnych zdjęć (wraz z wariantem 1000 ml i kolekcją menu). Nie ma innych marek.

```sh
git clone https://github.com/TressioToKozak/whisky.git ../whisky
npm run import:johnnie-walker -- --source ../whisky --dry-run
npm run import:johnnie-walker -- --source ../whisky
npm run report:import
npm run report:images
```

Przed kolejną synchronizacją aktualizuj czysty klon źródła przez `git -C ../whisky pull --ff-only`. Skrypt czyta lokalny katalog, dopasowuje trwałe ID, rozdziela pojemności, kopiuje i optymalizuje właściwe pliki oraz zapisuje mapę i raport JSON. Powtórzenie nie tworzy duplikatów. W czasie gry nie pobieramy danych z GitHuba ani sklepów.

`check:images:all` wymaga zdjęć każdego aktywnego produktu i blokuje publikację przy brakach. Źródła i hashe każdego pliku są w `data/johnnie-walker/image-provenance.json`. Miniatury używają lazy loading; service worker nie pobiera biblioteki przy instalacji, a cache obejrzanych obrazów ma limit 80 plików. Opakowanie jest widoczne, jeżeli występuje na właściwej fotografii. Szczegóły: [IMPORT_REPORT.md](IMPORT_REPORT.md).

## Aktualizacja rynku

Aktualne dane, źródła i rozdzielenie cen detalicznych od wyników aukcji opisano w [IMPORT_REPORT.md](IMPORT_REPORT.md). Archiwalny etap 2.1 pozostaje w [MARKET_UPDATE.md](MARKET_UPDATE.md). Ceny w centach i rzadkość mają aliasy zgodne ze starym silnikiem, ale dostępność, popyt i płynność są oddzielne. Dane źródłowe są w `src/catalog-data.json`; nieznane parametry i zweryfikowane przedziały cen pozostają nieuzupełnione zamiast zgadywania.

Początkowy rynek to 5 partii powszechnych, 4 o średniej dostępności, 4 ograniczone i 3 trudno dostępne. `src/initial-products.json` opisuje te proporcje, nie listę zdjęć. Filtry obejmują kończące się, obserwowane, tanie, rzadkie, vintage, limitowane i nowe partie.

## Testy i GitHub Pages

```sh
npm test
npm run check:images:strict
npm run build
npx playwright install chromium
npm run test:e2e
```

Przy systemowym Chromium: `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. Testy przeglądarkowe działają na gotowym `dist` pod `/tradegame/`, bez fallbacku HTML dla brakujących plików. Sprawdzają rzeczywiste dekodowanie zdjęć, licytację, reakcje NPC, komunikator, zapis, migrację, magazyn, mobilność i offline.

`npm run check:images:all` wymaga zdjęć całego katalogu — obecnie przechodzi dla wszystkich 254 produktów. Build sprawdza istnienie przypisanych plików; sam w sobie nie potwierdza kompletności zdjęć.

W GitHub ustaw **Settings → Pages → Source → GitHub Actions**. Push na `main` uruchamia testy, build, Chromium oraz publikację `dist`. Nie trzeba zmieniać bazy Vite dla nazwy repozytorium. Dane katalogu są w `src/catalog-data.json`, typy i helpery w `src/catalog.ts`; stabilnych identyfikatorów istniejących edycji nie zmieniaj.

## Aktualizacja 3.1

[Zmiany i zasady automatu](V31_UPDATE.md). Nowe menu, mobilna nawigacja, wyniki aukcji i codzienne cele za XP. Wyceny referencyjne pozostają wewnętrzne; źródła fotografii są w pomocy, poza galerią. Po ponownym imporcie zdjęć uruchom `npm run report:photo-layout`, aby przeliczyć tła galerii bez modyfikowania fotografii.

## Interaktywny salon 4.0

Pulpit to teraz pełna ilustracja `public/game-art/whisky-salon.png` z pięcioma przyciskami prowadzącymi do istniejących ekranów. Na telefonie przyciski są pod obrazem. Obserwowane aukcje blisko końca, nieprzeczytane wiadomości, nowe propozycje, paczki do otwarcia i zamówienia do przygotowania wyróżniają odpowiednie miejsca. Pod sceną są trzy ostatnie zdarzenia, rozwijana historia oraz zwijane cele dnia. [Opis i weryfikacja etapu](V4_SALON.md).

## Pełnoekranowy salon 4.1

Scena zajmuje całe miejsce pod paskami gry, bez kontenera i nagłówka pulpitu. Obraz jest dopasowany z zachowaniem pełnych proporcji; znaczniki pozostają przypięte do obrazu. Wydarzenia i cele dnia są dostępne przez przyciski HUD w wysuwanych panelach. Telefon zachowuje uproszczony układ pięciu stref. [Opis i zrzuty](V41_SALON.md).

## Sala aukcyjna 4.2

Duży przedmiot, cena i zegar, widoczni konkurenci oraz osobny panel ofert i automatu. Poprzednia/następna partia są dostępne bez wracania na rynek. Dźwięki są opcjonalne i domyślnie wyłączone. Salon otrzymał rozmyte przedłużenie ilustracji, światła stref i kompaktowy HUD. [Zmiany, testy i zrzuty](V42_AUCTIONS.md).
