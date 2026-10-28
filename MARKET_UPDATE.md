> Raport archiwalny aktualizacji 2.1. Bieżący katalog, fotografie i wyceny opisano w [IMPORT_REPORT.md](IMPORT_REPORT.md).

# Aktualizacja rynku i aukcji — raport

## Siedem edycji

Wartości pochodzą z polecenia użytkownika na październik 2026 i są **parametrami balansu**, nie potwierdzonymi ofertami detalicznymi. Nie dopisano fikcyjnych przedziałów aukcyjnych ani dat zewnętrznej weryfikacji.

| ID          | Edycja                          | Cena gry | Rzadkość | Wariant             | Dostępność                         | Zmiana                                      |
| ----------- | ------------------------------- | -------: | -------: | ------------------- | ---------------------------------- | ------------------------------------------- |
| red         | Red Label                       |     19 € |     1/10 | 700 ml, 40%         | Powszechna                         | Aktualizacja istniejącego ID                |
| red-soul    | Red Soul                        |     19 € |     2/10 | 700 ml, 40%, 2026   | Powszechna                         | Dodana                                      |
| rye         | Blenders’ Batch Red Rye Finish  |     35 € |     5/10 | 700 ml, 40%, 2016   | Ograniczona, wycofana              | Aktualizacja istniejącego ID, bez duplikatu |
| high-rye    | High Rye                        |     35 € |     5/10 | 750 ml, 45%         | Ograniczona w Europie, głównie USA | Dodana                                      |
| triple-cask | Black Label Triple Cask Edition |     60 € |     5/10 | 1000 ml, 40%        | Średnia, Travel Retail             | Dodana                                      |
| black-ruby  | Black Ruby                      |     34 € |     2/10 | 700 ml, 40%         | Powszechna                         | Dodana                                      |
| sherry      | Black Label Sherry Finish       |     35 € |     4/10 | 700 ml, 40%, 12 lat | Średnia                            | Aktualizacja istniejącego ID                |

High Rye: 35 € nie jest potwierdzoną ceną w Holandii ani automatycznym przeliczeniem 25–40 USD. Informacja jest zachowana także w interfejsie szczegółów produktu.

Próby odczytu johnniewalker.com, diageo.com, whiskybase.com, bockje.nl, mitra.nl i thewhiskyexchange.com zakończyły się HTTP 403. Nie udało się porównać dwóch niezależnych ofert na produkt. W draftcie ustawień środowiska zapisano potrzebne domeny; zapis draftu nie uruchamia dostępu. `market.lastVerified` pozostaje `null`, `market.sources` puste, a `referenceKind` ma wartość `game-balance`. Dalsza niezależna weryfikacja cen wymaga dostępu do tych źródeł.

## Model rynku

Katalog ma 56 pozycji i znajduje się w `src/catalog-data.json`. `src/catalog.ts` udostępnia typy i zgodne ze starym silnikiem aliasy `value`/`rarity`.

Dane oddzielają dostępność, rzadkość kolekcjonerską, popyt i płynność. Uwzględniają region, produkcję, parametry wariantu oraz źródła i datę weryfikacji. Nieznana pojemność, ABV, rok lub przedział aukcyjny nie jest zgadywany.

Losowanie korzysta z całego katalogu, także produktów bez fotografii. Powszechne produkty mają większą wagę, regionalny High Rye mniejszą dostępność w Holandii; wielokrotne wystawienie tej samej edycji i nadmiar jednej kategorii zmniejszają ich dalszą wagę. Start: 3 powszechne, 3 o średniej dostępności, 2 ograniczone, 2 trudno dostępne. To dostępność, a nie lista sfotografowanych produktów.

Prowizje, transport, kraj, stan butelki i pudełka są różne dla poszczególnych nowych partii. Stare aukcje zachowują swoje kwoty. Limity NPC uwzględniają pełny koszt; u handlarzy także przewidywaną wysyłkę i opłatę płatniczą. Powszechne whisky mają ograniczoną skłonność NPC do przepłacania. Popyt i płynność wpływają na zapytania klientów.

## Anti-sniping

Przyjęta oferta zmieniająca lidera, zarejestrowana co najwyżej 10 sekund przed końcem i przed faktycznym terminem, dodaje 15 sekund do istniejącego końca. Dotyczy gracza i NPC, wielokrotnie. Odrzucenia i podbijanie własnej oferty niczego nie przedłużają.

Stare `close` jest unieważniane i powstaje nowe. Dodatkowa kontrola terminu w obsłudze `close` zabezpiecza odczyt starszych lub nadmiarowych zdarzeń. Snajperzy aktualizują oczekujące decyzje do nowego końca. Historia przedłużeń, terminy i decyzje są w zapisie IndexedDB. Licznik i mały baner pokazują dodatkowy czas bez zasłaniania licytacji.

Format zapisu pozostaje 2: nowe dane aukcji są opcjonalne, a dane katalogu nie są kopiowane do transakcji. Zapisy 1 nadal przechodzą istniejącą migrację z eksportem oryginału; zapisy 2 nie wymagają resetu. Pieniądze, koszty zapasu, księga, bieżące ceny i terminy istniejących aukcji nie są nadpisywane przez aktualizację referencji katalogowych.

## Fotografie i brakujące elementy

Dodano właściwe fotografie **Red Rye Finish** i **White Walker**, obie CC BY-SA 4.0. Jest **15 plików**, obejmujących **12 z 56 produktów**, osobne pudełka i fotografię kolekcji. White Walker to fotografia pustej butelki, jawnie opisana w podpisie.

**44 produkty nadal nie mają zdjęć.** Pełna, wygenerowana lista: [MISSING_IMAGES.md](MISSING_IMAGES.md). Obejmuje m.in. Ghost & Rare, Black Label Origin, Lunar New Year oraz pięć z siedmiu wskazanych edycji poza Red Label i Red Rye. Nie podstawiono innych butelek ani grafik AI.

`npm run report:images` aktualizuje listę dla całego katalogu. `check:images:strict` sprawdza wszystkie przypisane pliki i metadane. `check:images:all` wymaga kompletności całych 56 pozycji i obecnie zgłasza 44 braki. Nie traktujemy zwykłego builda jako dowodu kompletności zdjęć.

### Ustawienie publikacji Pages

Workflow publikuje skompilowany katalog `dist`. W ustawieniach repozytorium **Settings → Pages → Build and deployment → Source** należy wybrać **GitHub Actions**, aby równoległa publikacja z gałęzi nie nadpisywała aplikacji surowymi plikami źródłowymi. Token workflow ma uprawnienie publikowania Pages, ale API odrzuca zmianę tego ustawienia (`Resource not accessible by integration`); dlatego wdrożenie nie próbuje zmieniać konfiguracji administracyjnej.
