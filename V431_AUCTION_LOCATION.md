# JW Collection Store 4.3.1 — pełnoekranowa lokacja aukcyjna

Pojedyncza aukcja jest teraz osobnym `AuctionScreen`, renderowanym jako stała lokacja `inset: 0`, `100vw × 100dvh`. Nie używa `Modal`, `.modal-backdrop`, limitu 1800 px, zewnętrznych marginesów ani zaokrąglonej ramki. Usunięto stare `AuctionRoom42.css` i `AuctionRoom43.css`. Reguły rynku, uczestników i głównego HUD zostały przeniesione do osobnych arkuszy; sala ma jeden własny `AuctionLocation.css`.

Tło `auction-room.png` wypełnia ekran, zachowując proporcje i centralny podest. Nie ma animacji całego tła ani skalowania/zoomowania aplikacji. W lewej strefie znajduje się eksponat ze światłem, dyskretnym podestem i ciemną ramą fotograficzną. Oryginalne zdjęcia pozostają bez zmian: białe tło samej fotografii nie jest usuwane, ale nie ma dodatkowej wielkiej białej planszy pod zdjęciem. Nie zastosowano multiply, filtrów zmieniających etykiety ani rozciągania. Kliknięcie nadal otwiera pełną fotografię, a dostępne dodatkowe fotografie pozostają w miniaturach.

W centrum dominują nazwa, cena i zegar. Poniżej są prowadzący, status gracza, zakładki „Szybka oferta” i „Automat”. Szybkie przyciski pokazują docelową kwotę oraz przyrost; wyłącznie wybierają kwotę, bez wysyłania oferty. Duży LICYTUJ zatwierdza decyzję, obok widać pełny koszt. Automat ma osobny panel z limitem, statusem, aktywacją/potwierdzeniem, zmianą i wyłączeniem. Przełączenie panelu nie zmienia silnika ani aktywnego automatu; zakładki działają również strzałkami, Home i End.

Prawy panel pokazuje rzeczywistych uczestników i ostatnie oferty. Długość listy/historii ma własne przewijanie, a krótka lista nie rozciąga pustego panelu na całą wysokość. Długie opisy i dane edycji są dostępne przez „Informacje o egzemplarzu”; nie są stałym blokiem pod zdjęciem. Nie przywrócono wycen, źródeł cen ani podpisów technicznych fotografii.

HUD mieści w jednym rzędzie powrót, poprzednią/następną partię, obserwowanie, dźwięk, gotówkę, reputację, poziom i zamknięcie. Tablet ma dwie kolumny. Telefon ma pionową kompozycję, przypięty skrót ceny/czasu i „Do ofert”; szczegóły mogą być przewijane. Natywne przyciski zachowują fokus. Informacje i powiększenie zdjęcia otwierają osobne panele nad lokacją, a Escape zamyka aktualnie aktywną warstwę i przywraca fokus. Ograniczenie ruchu jest respektowane.

Nie zmieniono ekonomii, NPC, schedulerów, rozliczeń, proxy, anti-sniping ani struktury zapisów. Cała interakcja nadal wywołuje dotychczasowe funkcje silnika.

## Weryfikacja

108 testów jednostkowych/komponentowych/integracyjnych i 57 scenariuszy Chromium. Pięć nowych scenariuszy mierzy rzeczywisty viewport oraz położenie kontrolek na:

- [1920×1080](docs/screenshots/location431-1920.png)
- [1440×900](docs/screenshots/location431-1440.png)
- [1366×768](docs/screenshots/location431-1366.png)
- [768×1024](docs/screenshots/location431-768.png)
- [390×844](docs/screenshots/location431-390.png)

Na trzech rozmiarach desktopowych sprawdzane są brak przewijania całej lokacji i widoczność fotografii, nazwy/ceny/zegara, pola oferty, LICYTUJ, zakładki automatu, prowadzącego, uczestników i zamknięcia. Potwierdzenie aktywacji automatu również mieści się w viewportcie. Testy mierzą przezroczystość powierzchni pod fotografią, sprawdzają wybór szybkiej kwoty bez złożenia oferty, klawiaturę zakładek, zachowanie aktywnego automatu po zmianie panelu, zmianę/wyłączenie oraz informacje/powiększenie i powrót fokusu.

[Panel aktywnego automatu](docs/screenshots/location431-automatic.png). Fotografie są dekodowane, a zrzut wykonywany po wyrenderowaniu klatki. Produkcyjny smoke GitHub Pages dodatkowo potwierdza pełny viewport bez backdropu modala, scenę, zdjęcie i otwieranie panelu automatu. Build TypeScript/Vite oraz dotychczasowe kontrole 255 fotografii pozostają wymagane.

Dodatkowy scenariusz otwiera najdłuższą rzeczywistą nazwę z katalogu na 1366×768 i mierzy położenie LICYTUJ, potwierdzenia aktywacji oraz potwierdzenia zmiany działającego automatu. Kompaktowy status w kroku potwierdzenia zachowuje bieżący limit i pełną kwotę, a usuwa powtarzane objaśnienie.

[Telefon po przejściu do ofert](docs/screenshots/location431-actions-390.png). Przypięty skrót pozostaje dostępny podczas przewijania.
