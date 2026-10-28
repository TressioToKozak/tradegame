# JW Collection Store 3.0

## Wprowadzone zmiany

- Pełnoekranowe menu z nieinteraktywną prawdziwą fotografią kolekcji, przyciskami kontynuacji, nowej gry i ustawień. Trudność i tempo są dopiero w osobnym panelu nowej gry.
- Własny wektorowy monogram JWC: `Brand.tsx`, `public/brand/jwcs.svg`, mniejszy znak w pasku i favicon. Nie korzysta z logotypu producenta.
- Grafitowy interfejs z ciepłymi akcentami, jaśniejszymi scenami butelek, dopracowanymi kontrolkami i przewijaniem. Mniejsze, uczciwie oznaczone braki fotografii zamiast wielkich pustych galerii. Nie usunięto żadnego produktu z losowania ze względu na brak zdjęcia.
- Pulpit skupia aukcje, wiadomości, dostawy i rozwój. Usunięto „Poznaj edycje”, stale widoczne komunikaty zapisu, sloganowe intro i dostaw. Zapis nadal działa co sekundę; jego techniczny wskaźnik jest niewidoczny. Informacje o symulacji i niezależności gry przeniesiono do Pomocy.
- Animacje zakładek, ofert, zmiany lidera, +15 sekund, końcówki aukcji, wiadomości, nagrody i odsłonięcia butelki. Standardowo 150–300 ms; koniec aukcji pulsuje. MotionConfig i CSS respektują `prefers-reduced-motion`; w Ustawieniach jest dodatkowy zapisany przełącznik uproszczonych animacji. Tooltip pełnego kosztu działa z klawiatury i zamyka się Escape. Powiadomienia znikają po 6,5 s.
- Modale zamykane Escape, pułapka focusu, przywrócenie focusu oraz `inert` dla tła; zagnieżdżone powiększenia zamykają się osobno. Formularze i natywne semantyczne kontrolki zachowują klawiaturę i otrzymały własną stylistykę.

## Tempo i świat

Nowa gra: 16 aukcji. Maksimum 20, cel 12–20. Przy niskim stanie uzupełnianie stopniowo przyspiesza; przy 16+ partiach odstęp wynosi 30–60 s. Stabilizowanie liczby aukcji czasem wymaga krótszego odstępu. Krótkie aukcje 2–4 min, standardowe 4–6 min, wyjątkowe 6–10 min. Dotychczasowe zapisane terminy nie są przepisywane. Anti-sniping pozostaje: ważna zmiana lidera w ostatnich 10 s daje +15 s, wielokrotnie, bez wcześniejszego zamknięcia ani podwójnego rozliczenia.

Szybki klient: 15–45 s, typowy 45–120 s; powolny 5–15 min, wycofany może milczeć. Wizyty istniejących klientów są częstsze; rozmowy nadal wymagają rzeczywistej oferty sklepu, preferencji, budżetu i zainteresowania. Godziny aktywności klientów pozostały 8–22 Amsterdam. Nie ma fikcyjnych wiadomości przy pustym sklepie.

Dostawy: 3–8 min krajowe, 6–15 min zagraniczne, z istniejącą możliwością opóźnienia. Są to skompresowane czasy gry. Ceny i budżety nie zależą od tempa.

## Rozwój

Za wygraną aukcję +25 PD, kontrolę +10, przyjęte zamówienie +35, doręczenie +50 (reklamacja +10). Każde zdarzenie ma unikalny klucz; odświeżenie i ponowne odtwarzanie nie powielają PD. Poziom: `floor(sqrt(PD/100))+1`. Pięć osiągnięć bez premii pieniężnych.

Pięć ulepszeń, po trzy stopnie. Koszt rośnie liniowo, zakup wymaga odpowiedniego poziomu i wolnej gotówki po blokadach ofert:

| Ulepszenie | Pierwszy koszt | Efekt |
| --- | ---: | --- |
| Magazyn | 180 € | 24 bazowe miejsca +12/stopień; mniejsze ryzyko transportowe |
| Pakowanie | 120 € | Mniejsze, lecz niezerowe ryzyko uszkodzenia zabezpieczonej paczki |
| Witryna | 160 € | Większe zainteresowanie pasującą ofertą; bez przekroczenia budżetu klienta |
| Marketing | 220 € | Krótsze odstępy wizyt istniejących klientów |
| Kontakty | 250 € | Większa waga trudniejszych partii i trzy kontakty dostawców; pochodzenie zapisane w aukcji |

Ulepszenia nie gwarantują sprzedaży, nie zmieniają za gracza cen i nie tworzą pieniędzy. Koszt rozwoju jest księgowany i odliczany od wyniku finansowego.

## Rynek

`market.ts` oddziela przedział ceny młotkowej od opłat i detalicznej referencji. Potwierdzony przedział wymaga źródeł i daty; gdy ich brak, wykorzystujemy ostrożny szacunek na podstawie dostępności, popytu i płynności, z osobnym wpływem butelki i pudełka. Sama rzadkość nie mnoży ceny. Nie przedstawiamy ofert wystawienia jako zakończonych sprzedaży. Nie zweryfikowano nowych zewnętrznych cen w tej sesji; dotychczasowe `lastVerified: null` pozostają puste.

## Zapisy

Format pozostaje 2. `progression` jest opcjonalne; starszy zapis otrzymuje rozwój na podstawie zachowanych ukończonych działań. Pieniądze, butelki, terminy i istniejące transakcje nie są zmieniane. Oryginalny eksport przed migracją formatu 1 jest nadal dostępny. Zbyt duży istniejący magazyn nie jest redukowany; ograniczenie dotyczy nowych zakupów. Import sprawdza poprawność nowych pól.

## Fotografie — bloker usunięty importem

Pełny import obu linii z repozytorium `TressioToKozak/whisky` uzupełnił wszystkie fotografie. Aktualny katalog ma 254 produktów, bez brakujących zdjęć. Import obejmuje 198 nowych produktów i aktualizację 55 dotychczasowych; osobno zachowano Double Black 1000 ml. Szczegółowe liczby, źródłowe ceny, mapowanie i lista wycen wymagających weryfikacji: [IMPORT_REPORT.md](IMPORT_REPORT.md).

Kontrola `check:images:all` przechodzi i pozostaje wymagana przed publikacją. Poprzednie szkice dostępu do zewnętrznych serwisów nie są potrzebne do gry ani ponownego importu z lokalnego klonu GitHub. Publikacja 3.0 korzysta z istniejącego workflow Pages, z kontrolą skompilowanego wejścia, sum SHA-256 zasobów oraz rzeczywistego menu i zdjęć w Chromium po wdrożeniu.
