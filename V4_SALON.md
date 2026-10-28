# JW Collection Store 4.0 — etap 1: interaktywny salon

Pulpit wykorzystuje bez zmian plik `public/game-art/whisky-salon.png` dodany w repozytorium przez użytkownika. Nie generowano nowego tła. Obraz ma naturalne proporcje, pełną szerokość sceny i automatyczną wysokość, bez kadrowania. Ścieżka korzysta z `import.meta.env.BASE_URL`.

`src/components/InteractiveSalon.tsx` zawiera konfigurację pięciu natywnych przycisków: identyfikator, nazwa, ikona, istniejąca zakładka i współrzędne procentowe obrazu. Biurko z laptopem otwiera aukcje, lewe gabloty magazyn, lada sklep, prawy telefon wiadomości, a stół pakowania zamówienia. Poniżej 701 px przyciski przechodzą pod ilustrację i mają duże pola dotykowe. Dotychczasowa nawigacja, finanse, rozwój, pomoc i ustawienia pozostają dostępne.

Wyróżnienia wyłącznie odczytują stan silnika:

- obserwowana, aktywna aukcja z końcem w ciągu 60 sekund: subtelne światło i rzeczywiste odliczanie;
- magazyn: egzemplarze w stanie `inspect`, oczekujące otwarcia;
- wiadomości: suma `unreadCount` istniejących rozmów;
- sklep: nieprzeczytane, otwarte i niewygasłe propozycje z dodatnią ofertą;
- dostawy: zamówienia `packing`, również zapakowane i jeszcze niewysłane.

Odczyt rozmowy wygasza oznaczenia wiadomości i nowej propozycji. Nie ma losowych alertów. Odliczanie nie jest odczytywane przez czytnik ekranu co sekundę; pozostałe aktualizacje są dyskretne. Natywne przyciski działają klawiaturą i mają widoczny fokus. Animacje respektują systemowe i zapisane w grze ograniczenie ruchu.

Zamiast siatek NowBoard i kart aukcji pod ilustracją są najwyżej trzy ostatnie zdarzenia. Dalsza historia jest rozwijana, a cele dnia zwinięte. Nie przebudowano aukcji, magazynu, komunikatora, finansów ani zapisu; silnik ekonomiczny i struktura zapisów są niezmienione.

## Walidacja

- 101 testów jednostkowych, komponentowych i integracyjnych, w tym test zmian stanu oznaczeń salonu.
- 42 scenariusze Chromium: dotychczasowa gra oraz salon w szerokościach 1440, 768 i 390 px, pięć przejść klawiaturą, pozycje względem rzeczywistego obrazu, brak poziomego przewijania, rzeczywiste liczniki, odczyt rozmowy i odświeżenie zapisu. Dotychczasowe testy responsywności obejmują również 320 px.
- TypeScript/Vite, kontrola 255 fotografii whisky i test produkcyjnego podfolderu `/tradegame/`.
- Smoke Pages porównuje również hash salonu i sprawdza dekodowanie ilustracji oraz pięć przycisków po publikacji.
- Salon jest zasobem powłoki offline. Zdjęcia katalogu nadal mają odrębny cache uzupełniany na żądanie.

Zrzuty działającego Chromium: [1440 px](docs/screenshots/salon-1440.png), [768 px](docs/screenshots/salon-768.png), [390 px](docs/screenshots/salon-390.png).
