# JW Collection Store 4.2 — sala aukcyjna i salon

Rynek pozostaje listą kart z filtrami i obserwowaniem. Otwarcie partii prowadzi do sali zajmującej niemal cały ekran: przedmiot po lewej, cena/zegar/historia pośrodku, uczestnicy i działania po prawej. Tablet ma dwie kolumny; telefon jedną, rozwijane listy konkurentów i ofert oraz przypięty skrót ceny, czasu i przejścia do formularza. Duże fotografie pochodzą z istniejącego lokalnego katalogu; nie dodano ani nie wygenerowano zdjęć whisky.

Cena, prowadzący, przebicia i przedłużenia pochodzą z istniejącego silnika. Panel konkurentów pokazuje wyłącznie uczestników ujawnionych w ofertach, obserwatorach lub publicznych zdarzeniach pamięci. Wycofanie wymaga rzeczywistego zapisu `withdraw`; nie jest zgadywane z prywatnego limitu. Budżety, maksima i szczegóły strategii nie są renderowane. Własne awatary SVG powstają deterministycznie z ID, więc powracający uczestnik zachowuje wygląd.

Animacje reagują na nowe wpisy ofert: cena, aktualny lider, awatar i historia. Status gracza odróżnia prowadzenie od przebicia. Zegar zmienia oprawę przy 30 i 10 sekundach; prawdziwe przedłużenie pokazuje „+15 SEKUND”. Rynek nie ponawia animacji wejścia kart co sekundę; usunięto zbędne pomiary `layout`. Historia pozostaje ograniczona do 80 wpisów, lista rywali ma własne przewijanie.

Automat zachowuje dwustopniowe potwierdzenie, minimalne przebicia, maksymalny limit, prowizję, transport i wspólne ograniczenia środków. Ekonomia, terminarz, NPC, odtwarzanie offline i format zapisów są niezmienione. Wyniki nie zawierają formularza licytowania. Wygrana pokazuje fotografię, cenę i rzeczywisty koszt oraz stan/termin dostawy w czasie gry; prowadzi do magazynu. Przegrana pokazuje zwycięzcę i ostatnią ofertę gracza. Brak sprzedaży jest oddzielnym wynikiem.

Jeden globalny stan dźwięku jest dostępny w sali i ustawieniach, domyślnie wyłączony i zapisywany lokalnie. Web Audio syntetyzuje krótkie sygnały oferty, przebicia, ostatnich sekund, młotka i zwycięstwa. Odtwarzanie wymaga włączonej opcji i kontekstu odblokowanego działaniem użytkownika; nie gra w ukrytej karcie ani podczas samego otwarcia historycznej aukcji. Nie ma muzyki ani zapętlonych nagrań. Testy obejmują wyciszenie i synchronizację przełączników.

Salon zachowuje oryginalną scenę i pięć punktów. Rozmyte, przyciemnione przedłużenie tej samej ilustracji wypełnia wolne miejsce; oryginał nie jest kadrowany. Światło obiektów korzysta z rzeczywistych liczników, a nowa aukcja świeci przez 15 sekund od zapisanego `createdAt`. Hover i fokus wyróżniają właściwy obszar. Od 1250 px nawigacja i stan sklepu mieszczą się w jednym rzędzie; mniejsze ekrany zachowują dotychczasową czytelność. Ograniczenie ruchu systemowe i w ustawieniach jest respektowane.

## Osobna ilustracja sali w przyszłości

`AuctionRoom42.css` udostępnia `--auction-room-background-image`. Obecnie nie odwołuje się do nieistniejącego pliku. Po dodaniu zaakceptowanego obrazu do `public/game-art/` można ustawić tę właściwość na `url(...)`, budując adres przez `import.meta.env.BASE_URL`. Obecna oprawa drewna i bursztynowego światła korzysta z CSS.

## Walidacja

- 106 testów jednostkowych/komponentowych/integracyjnych, w tym prywatność rywali, wycofanie, stabilność awatarów i wyciszenie dźwięków.
- 48 scenariuszy Chromium: ręczne oferty, proxy i odświeżenie, dwa przedłużenia, jedno rozliczenie, wyniki, przejście do magazynu, przełączanie partii, fotografie, zapis i tryb offline.
- Dodatkowe scenariusze sali na 1440×900, 768×1024 i 390×844 oraz test globalnego dźwięku; dotychczasowe testy obejmują również 320 px.
- Produkcyjny TypeScript/Vite, wszystkie 255 fotografii i smoke pod `/tradegame/`. Publiczny pipeline dodatkowo otwiera nową salę i sprawdza zdjęcie, cenę oraz panel automatu po wdrożeniu.

Zrzuty przeglądarki: [desktop](docs/screenshots/auction42-1440.png), [tablet](docs/screenshots/auction42-768.png), [telefon — przedmiot](docs/screenshots/auction42-390.png), [telefon — działania](docs/screenshots/auction42-bidding-390.png).
