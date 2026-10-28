# JW Collection Store 4.1 — pełnoekranowy salon

Pulpit zajmuje całą pozostałą wysokość viewportu pod istniejącymi paskami gry. Osobna klasa układu dotyczy wyłącznie salonu: brak limitu szerokości, marginesów, nagłówka i sekcji dashboardu pod sceną. Pozostałe zakładki zachowują zwykły układ i przewijanie.

Oryginalny `public/game-art/whisky-salon.png` pozostaje niezmieniony. Rozmiar sceny wynika z mniejszego ograniczenia: szerokości albo wysokości dostępnego miejsca, przy proporcjach 1672:941. Pełny obraz pozostaje widoczny; odmienne proporcje ekranu powodują neutralne wolne miejsce, bez rozciągania i obcinania ilustracji. Procentowe znaczniki odnoszą się do rzeczywistego obszaru obrazu. Większy podpis aukcji jest odsunięty znad laptopa; cienka linia wskazuje zachowany punkt.

HUD udostępnia wydarzenia i cele dnia. Kompaktowe panele wysuwają się nad sceną, mają własne przewijanie, zamykanie przyciskiem/Escape/kliknięciem poza panelem, pułapkę fokusu i powrót do przycisku otwierającego. Wydarzenia zachowują pełną istniejącą historię. Cele korzystają z dotychczasowego DailyBoard i zapisanych postępów. Telefon ma pięć stref pod pełnym obrazem, dolną nawigację oraz panele mieszczące się w viewportcie.

Animacje wejścia i podświetlenia respektują systemowe oraz zapisane ograniczenie ruchu. Pięć stref, rzeczywiste liczniki i dostęp do dodatkowego menu pozostają zachowane. Silnik, automat aukcyjny, struktura zapisów i koszty nie zmieniają się.

Walidacja: 101 testów jednostkowych/komponentowych/integracyjnych, 44 scenariusze Chromium, TypeScript/Vite oraz smoke produkcyjnego `/tradegame/`. Testy sceny mierzą współrzędne obrazu i znaczników, brak przewijania dokumentu i poziomego przepełnienia, pięć przejść klawiaturą i panele HUD na rozmiarach:

- [1920×1080](docs/screenshots/salon41-1920.png)
- [1440×900](docs/screenshots/salon41-1440.png)
- [1366×768](docs/screenshots/salon41-1366.png)
- [768×1000](docs/screenshots/salon41-768.png)
- [390×844](docs/screenshots/salon41-390.png)

[Panel zadań na telefonie](docs/screenshots/salon41-tasks-390.png). Publiczny pipeline dodatkowo kontroluje hash PNG, jego dekodowanie i pięć stref po wdrożeniu Pages.
