# JW Collection Store 3.0 — kandydat wydania

Polski symulator sklepu z kolekcjonerskimi whisky Johnnie Walker. React, TypeScript, Vite, Tailwind, Dexie/IndexedDB. Statyczna aplikacja bez serwera aplikacji, kont, API i kluczy. Kapitał początkowy: 5 000 €. Kwoty w eurocentach. Ceny referencyjne są balansem gry, nie bieżącymi notowaniami.

**Bloker wydania:** nadal brakuje 44 fotografii. Zmiany są na gałęzi `jwcs-v3`, bez zastępowania gry na Pages. Workflow publikacyjny wymaga `check:images:all`. [Raport wersji 3.0](V3_UPDATE.md).

## Uruchomienie

Node.js 24 i npm:

```sh
npm ci
npm run dev
```

`npm run build` tworzy `dist`; `npm run preview` uruchamia podgląd. Vite używa względnej bazy `./`, więc aplikacja działa też pod `/tradegame/`.

## Rozgrywka

1. Wybierz trudność i tempo (domyślnie **Dynamiczne**). Opcjonalne sześć krótkich kroków wprowadzenia można pominąć.
2. Nowa gra otwiera **16 aukcji**, losowanych z całego katalogu według dostępności, także pozycji bez zdjęcia. Rynek regularnie się uzupełnia; docelowo zwykle 12–20 aktywnych partii.
3. W Aukcjach filtruj kategorię, cenę, rzadkość, czas, nowość i obserwowane. W pokoju aukcyjnym szybkie przyciski tylko wybierają kwotę; **LICYTUJ** ją zatwierdza. Krok zależy od ceny: 5 / 10 / 20 / 50 €. Opcjonalny zapisany limit ogranicza cenę młotkową, nie licytuje automatycznie.
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

Service worker zachowuje aplikację i przypisane zdjęcia offline po pierwszym otwarciu online. Czyszczenie danych witryny usuwa postęp; regularnie eksportuj grę.

## Fotografie

W projekcie jest **15 fotografii**, obejmujących **12/56 produktów**. Dodano Red Rye Finish i White Walker. Pełna lista 44 brakujących edycji: [MISSING_IMAGES.md](MISSING_IMAGES.md); autorzy i licencje: [IMAGE_SOURCES.md](IMAGE_SOURCES.md). Nie podstawiamy innych wariantów whisky.

Rynek nie filtruje produktów według posiadania fotografii. Wszystkie edycje mogą się pojawiać, a brak obrazu jest widoczny. `public/images/whisky/` zawiera pliki; `src/product-media.json` przypisania. `assetUrl` uwzględnia bazę Vite. `npm run report:images` odtwarza raport kompletności.

## Aktualizacja rynku

Siedem produktów, ceny gry i rzadkości, ograniczenia weryfikacji zewnętrznej, nowy model i anti-sniping opisano w [MARKET_UPDATE.md](MARKET_UPDATE.md). Ceny w centach i rzadkość mają aliasy zgodne ze starym silnikiem, ale dostępność, popyt i płynność są oddzielne. Dane źródłowe są w `src/catalog-data.json`; nieznane parametry i zweryfikowane przedziały cen pozostają nieuzupełnione zamiast zgadywania.

Początkowy rynek to 3 partie powszechne, 3 o średniej dostępności, 2 ograniczone i 2 trudno dostępne. `src/initial-products.json` opisuje te proporcje, nie listę zdjęć. Filtry obejmują kończące się, obserwowane, tanie, rzadkie, vintage, limitowane i nowe partie.

## Testy i GitHub Pages

```sh
npm test
npm run check:images:strict
npm run build
npx playwright install chromium
npm run test:e2e
```

Przy systemowym Chromium: `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. Testy przeglądarkowe działają na gotowym `dist` pod `/tradegame/`, bez fallbacku HTML dla brakujących plików. Sprawdzają rzeczywiste dekodowanie zdjęć, licytację, reakcje NPC, komunikator, zapis, migrację, magazyn, mobilność i offline.

`npm run check:images:all` wymaga zdjęć całego katalogu — obecnie zgłasza 44 braki. Build sprawdza istnienie przypisanych plików; sam w sobie nie potwierdza kompletności zdjęć.

W GitHub ustaw **Settings → Pages → Source → GitHub Actions**. Push na `main` uruchamia testy, build, Chromium oraz publikację `dist`. Nie trzeba zmieniać bazy Vite dla nazwy repozytorium. Dane katalogu są w `src/catalog-data.json`, typy i helpery w `src/catalog.ts`; stabilnych identyfikatorów istniejących edycji nie zmieniaj.
