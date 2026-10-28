# Import katalogu Johnnie Walker

Źródło: [TressioToKozak/whisky](https://github.com/TressioToKozak/whisky/tree/5c99c4eaed7c48047b58c29e4f442fd08552ccc3), commit `5c99c4eaed7c48047b58c29e4f442fd08552ccc3`. Katalog jest filtrowany według pola marki, nie nazwy pliku.

| Wynik | Liczba |
| --- | ---: |
| Johnnie Walker w źródle | 232 |
| John Walker & Sons w źródle | 21 |
| Wybrane unikalne edycje | 253 |
| Nowe produkty względem katalogu 56 | 198 |
| Uzupełnione dotychczasowe produkty | 55 |
| Produkty w grze | 254 |
| Zaimportowane fotografie | 253 |
| Produkty bez zdjęcia | 0 |
| Wyceny wymagające dalszej weryfikacji | 134 |

Dotychczasowy Double Black 1000 ml pozostaje osobnym produktem; źródłowy Double Black 700 ml jest dodany oddzielnie. Starszy Swing, warianty 700/750/1000 ml, różne miasta, opakowania i edycje Lunar New Year nie są scalane. Wszystkie 56 starych identyfikatorów pozostaje dostępnych; koszt zakupu, księga, cena oferty i terminy trwających aukcji w zapisach nie są przepisywane przez importer.

## Fotografie i synchronizacja

253 odpowiednie pliki pochodzą wyłącznie z rekordów dwóch wybranych linii. Zapisano je lokalnie w `public/images/whisky/imported/`. Źródłowe 12 850 121 B zoptymalizowano do 8 470 372 B (WebP, proporcjonalnie do maks. 1000 × 1200, bez powiększania). Wszystkie 253 źródłowe fotografie mają różne SHA-256. Nie wygenerowano żadnej butelki ani nie zastąpiono brakującej edycji inną. Stare zdjęcie wariantu 1000 ml i fotografia kolekcji pozostają przypisane: łącznie 255 referencji fotografii dla 254 produktów i menu.

`npm run import:johnnie-walker -- --source ../whisky` importuje obie linie; `--dry-run` wyświetla plan bez zmian. Surowy skrypt bez opcji `--include-walker-sons` wybiera wyłącznie markę Johnnie Walker. Aktualizację źródła wykonuje deweloper w lokalnym klonie. Import nie działa podczas rozgrywki i nie wymaga backendu. Ponowne wykonanie z tą samą wersją źródła nie tworzy duplikatów ani nie zmienia wygenerowanych plików. Brak pliku, zła ścieżka, kolizja ID i niezgodne parametry przerywają import przed zapisaniem katalogu.

Mapa: [id-map.json](data/johnnie-walker/id-map.json). Pochodzenie każdego obrazu, wejściowy i wyjściowy SHA-256: [image-provenance.json](data/johnnie-walker/image-provenance.json). Zachowano adresy źródłowe; gdy katalog nie podaje autora lub licencji, nie przypisano fikcyjnego autorstwa ani licencji CC.

## Rynek i rozgrywka

Cały katalog uczestniczy w tym samym silniku: ważone aukcje, NPC z budżetami, dostawy, magazyn, sprzedaż, negocjacje, zamówienia i reklamacje. 16 początkowych aukcji, cel 12–20, regularne uzupełnianie i wielokrotne +15 sekund w ostatnich 10 sekundach pozostają zachowane. Gracz ustala własne ceny; sekcja „Poznaj edycje” i sugerowane ceny odsprzedaży nie wróciły.

Ceny przeniesiono wraz z rodzajem notowania, datą, pojemnością, walutą oryginalną i źródłem kursu. Jest 60 referencji detalicznych i 174 referencje zgodnych wyników aukcyjnych; 20 pozycji korzysta z jawnie niezweryfikowanego balansu. Daty weryfikacji pochodzą z repozytorium źródłowego (zwykle 19 października 2026), nie oznaczają ponownego sprawdzenia strony w tej sesji. Wyceny nie powstają z mnożnika wieku lub rzadkości.

Zaobserwowany przedział aukcyjny istnieje dla 120 wariantów z co najmniej dwoma zgodnymi wynikami. Pojedynczy wynik jest punktem odniesienia; modelowany wokół niego przedział pozostaje szacunkiem. Rekordy `referenceOnly`, wyniki innej pojemności/mocy i zgłoszenie użytkownika nie stają się potwierdzonymi cenami tego wariantu. Oferta zagraniczna nie oznacza dostępności w NL. Status produkcji i dostępność bez dowodu pozostają nieznane lub oznaczone jako parametry symulacji. Premia pudełka 12% jest osobnym, jawnym szacunkiem, a nie potwierdzonym wynikiem pary sprzedaży.

Zdjęcia mają lazy loading. Service worker zapisuje bibliotekę zdjęć dopiero na żądanie, w osobnym cache do 80 plików; instalacja nie pobiera 253 obrazów. Zwykły rynek renderuje najwyżej 20 aktywnych aukcji.

## Wyceny wymagające weryfikacji

Poniższa lista obejmuje pojedyncze/stare wyniki, zagraniczne oferty, niezgodne parametry i brak potwierdzonej wyceny. Nie jest listą proponowanych cen odsprzedaży.

| ID gry | Produkt | Rodzaj źródła | Powód |
| --- | --- | --- | --- |
| double | Johnnie Walker Double Black | game-balance | Brak zweryfikowanej wyceny tego wariantu w repozytorium źródłowym |
| platinum | Johnnie Walker Platinum Label 18 Year Old | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| rye | Johnnie Walker Blenders' Batch · Red Rye Finish | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| blonde | Johnnie Walker Johnnie Blonde | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| islay | Johnnie Walker Black Label 12 Year Old Islay Origin | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| anniversary | Johnnie Walker Blue Label · 200th Anniversary Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| xr21 | Johnnie Walker XR 21 Year Old | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| premier | Johnnie Walker Premier | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| odyssey | John Walker & Sons Odyssey | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| quest | Johnnie Walker Quest | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| pig | Johnnie Walker Blue Label · Year of the Pig 2019 | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| rat | Johnnie Walker Blue Label · Year of the Rat 2020 | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| rabbit | Johnnie Walker Blue Label Year of the Rabbit Limited Edition | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| select | Johnnie Walker Select Casks 10 Year Old Rye Cask Finish | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| high-rye | Johnnie Walker High Rye | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-009 | Johnnie Walker Black Label 12 · 200 Years | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-e7c49fa1b187 | Johnnie Walker Black Label Squid Game Limited Edition | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-cfa84236a438 | Johnnie Walker 30 Year Old · Eight Treasures | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-03b2c78c0513 | Johnnie Walker Blue Label · Year of the Horse 2026 (Taiwan Edition) | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-58b260e125f8 | Johnnie Walker Black Label 12 Year Old · Air Ink Mexico City Edition | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-e1285edb7c05 | Johnnie Walker Black Label 12 Year Old · Air Ink San José Edition | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-221fdd1b660b | Johnnie Walker Black Label 12 Year Old · Air Ink New Delhi Edition | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-77ef31a78842 | Johnnie Walker Black Label 12 Year Old · Air Ink Bangkok Edition | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-245bbc0beb34 | Johnnie Walker XR 19 Year Old | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-f29545856b67 | Johnnie Walker XR 23 Year Old | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-854643fbf2c1 | Johnnie Walker Blue Label · Cities Of The Future Hainan 2220 | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-00ee1bf1ffaa | Johnnie Walker Gold Label 18 Year Old · The Centenary Blend (First Edition) | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-70d785ae6445 | Johnnie Walker Red Label · 1980s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-ecd76d110a36 | Johnnie Walker Old Harmony · 1970s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-fc1e75f76a49 | Johnnie Walker Red Label · 1970s | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-5cfdf92717ae | Johnnie Walker Blue Label · Year of the Pig 2019 (Taiwan Edition) | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-bd2e064343bd | Johnnie Walker Blue Label · South Africa Limited Edition Design | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-820f3c73334f | Johnnie Walker Black Label 12 Year Old · Air Ink Istanbul Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-8370a1d25807 | Johnnie Walker Black Label 12 Year Old · Air Ink Warsaw Edition | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ffa2a4db4241 | Johnnie Walker Red Label · Icons 2.0 | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-32646e7bc8cb | Johnnie Walker Blue Label · Taiwan Limited Edition Design | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-646b1be0353c | Johnnie Walker Blue Label · Great Inventions | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-93d2e18af694 | Johnnie Walker Blue Label · New York Limited Edition Design | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-45e656af7147 | Johnnie Walker Blue Label · Singapore Limited Edition Design | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-2bf2aa7411d4 | Johnnie Walker Blue Label · Icons 2.0 | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-16bbd1175fb9 | Johnnie Walker Gold Label 18 Year Old · 1990s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-81c21720092f | Johnnie Walker Green Label 15 Year Old · 1990s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-12afe20d7c31 | Johnnie Walker Black Label Extra Special · 1970s | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-77559b2d6b2e | Johnnie Walker Black Label 12 Year Old · Air Ink Lagos Edition | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-bbb3e123ff54 | Johnnie Walker 40 Year Old Master's Ruby Reserve | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-4ed38f9bbd46 | Johnnie Walker Black Label 12 Year Old · Icons 2.0 | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-3168521d58c6 | Johnnie Walker 48 Year Old Masters of Flavour | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-117a095fa553 | Johnnie Walker Icon Gold · 200 Years Keep Walking Limited Edition | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-f6aff259b427 | Johnnie Walker Extra Special Black Label · 1960s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-e94f244fddd0 | Johnnie Walker Black Label 12 Year Old 100th Anniversary Edition | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-053cbf44629a | Johnnie Walker Black Label 12 Year Old · 1980s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-b721b0c31347 | Johnnie Walker Gold Label Reserve · Limited Edition Bottle | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-fa853c7ae155 | Johnnie Walker Blue Label (Old Bottling) | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-a57b272146a1 | Johnnie Walker Blue Label · Rare Side of Scotland Limited Edition | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-9f42a012842a | Johnnie Walker Blue Label · London Limited Edition Design | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-dc657ce193ac | Johnnie Walker XR 21 Year Old · New Year 2022 Limited Edition | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-724bb55a7fc2 | Johnnie Walker The Directors Blend 2011 | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-395ccd57d0b8 | Johnnie Walker Blue Label · Vienna Limited Edition Design | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-9a4d28020123 | Johnnie Walker Blue Label · 1990s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-5c6c2cbe720a | Johnnie Walker Blue Label · Sogo 30th Anniversary | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-edcb63a6a031 | Johnnie Walker Blue Label · Hong Kong Limited Edition | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-802f15aa3f9a | Johnnie Walker Blue Label · Bu Gwi Yeong Hwa The Casks Edition | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-d5bc9fc033ff | Johnnie Walker Master’s Cut | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-fdfcf8fb137b | Johnnie Walker 18 Year Old · 2010s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-a69c09502203 | Johnnie Walker Vault The Couture Blend | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-7f00db4965c8 | Johnnie Walker 15 Year Old Gold Label · 1990s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-62256392d42a | Johnnie Walker Swing · 1960s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-167906e9154f | Johnnie Walker Swing · 1980s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-243c435682a6 | Johnnie Walker Kilmarnock 400 15 Year Old · 1990s | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-a8fc178aacb4 | Johnnie Walker Swing · 1970s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-aa3098d9fe54 | Johnnie Walker White Label · ok. 1900 | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-a0f40347cae0 | Johnnie Walker Red Label · 1960s | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-ed-1d7350b2167d | Johnnie Walker Red Label Diageo Hurlford 40 Years Set | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-66f987f58fd7 | Johnnie Walker Blue Label Carp And Dragon | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-c78bf9b9c4db | Johnnie Walker Blue Label For Kilmarnock FC 125th Anniversary | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-b1b76e744adb | Johnnie Walker Black Label 12 · 500 Years Of Whisky Distilling | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-3602d39f8025 | Johnnie Walker Black Label 12 · Ryder Cup 1995 | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-87d1fe10dea2 | Johnnie Walker Blue Label Greg Norman Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-442986ca36c3 | Johnnie Walker Black Label 12 · Project Halo Dubai Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-56dc1d78cde0 | Johnnie Walker Blue Label Lotte Duty Free Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-cf8d8e8e713a | Johnnie Walker Blue Label Mexico City 2220 Cities Of The Future | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-3c7850c7ff1d | Johnnie Walker Blue Label Australia Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-915a8f1c83da | Johnnie Walker Blue Label Chinese Mythology Collection ‘Prosperity’ | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-fb69d4d2a1b6 | Johnnie Walker Black Label 12 · Classic 2007 Celebration | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-a3809dede391 | Johnnie Walker Seasonal Blends 16 · Spring · Batch 3 | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-369f9692b8ae | Johnnie Walker Blue Label Milan Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-5ac339cf7318 | Johnnie Walker Blue Label Seoul 2220 Cities Of The Future | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-591d1d6ea39b | Johnnie Walker Blue Label Heritage Celebration | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-bf15f03a070b | Johnnie Walker Blenders’ Batch #6 Wine Cask Blend | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem |
| jw-ed-6c232f807453 | Johnnie Walker Blue Label Barcelona Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-46041419bc79 | Johnnie Walker Black Label 12 · New York Yankees 2017 Limited Edition | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-ba0e0f813fb9 | Johnnie Walker Blue Label Chinese Mythology Collection ‘Fortune’ | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-bc62ee159a80 | Johnnie Walker Blue Label Middle East Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-c335df0a388f | Johnnie Walker Blue Label Miami Edition | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-fbf25d6b8f3a | Johnnie Walker Blue Label California Edition | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-4cc607b7c099 | Johnnie Walker Black Label 12 · Nouch Edition Air-Ink | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-4a27962a75cf | Johnnie Walker Blue Label Fortune Magnet | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-2e7df61c304b | Johnnie Walker Double Black Mattia Biagi Limited Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-5c6851ce805c | Johnnie Walker Blue Label For Johnnie Walker House Chengdu | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-1750a153ab9c | Johnnie Walker Blue Label Year of The Tiger Taiwan Limited Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-410ac80ed645 | Johnnie Walker Blue Label Johnnie Walker X Scott Naismith | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-f8610d110f61 | Johnnie Walker Blue Label Year of The Snake Taiwan Limited Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-e608d634b654 | Johnnie Walker Blue Label Voyage Yacht Taipei Commemorative Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-827e6170c814 | Johnnie Walker Red Label Special Old Highland Whisky Circa 1930’s | auction-result | Niezgodna lub niepotwierdzona pojemność/moc wyników źródłowych |
| jw-ed-96cbbd330986 | Johnnie Walker XR 21 Year Old Starlux | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-70aaa22b4fae | Johnnie Walker Blue Label Paris Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-c026eb33e369 | Johnnie Walker Blue Label Texas Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-0ce1139f5f11 | Johnnie Walker Blue Label Year of The Dog Australia Limited Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-dfa1eca7cb20 | Johnnie Walker Blue Label Dun Huang Fairies | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-02dbe26913de | Johnnie Walker Blue Label Chinese Mythology Collection ‘Wisdom’ | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-15ae6294d56f | Johnnie Walker Black Label 12 · 40th Anniversary of Diageo Shieldhall | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-b110f8b7baf5 | Johnnie Walker Blue Label Five Ways Of Wealth 'Vision' | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-1f37229e12fc | Johnnie Walker Blue Label Las Vegas Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-67719954ca8d | Johnnie Walker Blue Label Rome Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-4a63366488f9 | Johnnie Walker Green Label 15 Taiwan Limited Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-79e6703b3050 | Johnnie Walker The Directors Blend 2008 | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-43852bd7ca94 | Johnnie Walker The Directors Blend 2009 | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-887763b40b27 | Johnnie Walker The Directors Blend 2010 Release | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-06ff91e1c7b2 | Johnnie Walker The Directors Blend 2012 | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-947094696e5b | Johnnie Walker Blue Label Lebanon Edition | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-black-sabrina-carpenter | Johnnie Walker Black Label 12 · Sabrina Carpenter | user-report | Cena bez zgodnego dowodu sprzedaży lub oferty |
| jw-c946140a0264 | John Walker & Sons 28 Year Old · Bicentenary Blend | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-b159521d8b8d | John Walker & Sons King George V · Chinese New Year Edition 2021 | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-6adbbf0ad634 | John Walker & Sons King George V · Chinese New Year Edition 2022 | retail | Oferta zagraniczna; cena i dostępność w NL wymagają sprawdzenia |
| jw-d06af9adc2c2 | John Walker & Sons The John Walker | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-064511080a1c | John Walker & Sons Private Collection 28 Year Old 2018 Edition | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-ba63f897741e | John Walker & Sons XR 21 Year Old Legacy Collection Cantonese | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-f43d045f132b | John Walker & Sons XR 21 Year Old Legacy Collection Hokkien | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-a7492abc0135 | John Walker & Sons XR 21 Year Old Legacy Collection Hakka | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-5f4c14806c26 | John Walker & Sons XR 21 Year Old Legacy Collection Teochew | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-bbe77f2da519 | John Walker & Sons XR 21 Year Old Legacy Collection Foochow | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-a359d35ec519 | John Walker & Sons XR 21 Year Old Legacy Collection Hainan | auction-result | Tylko jeden zgodny wynik aukcji; przedział pozostaje szacunkiem; Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-cd32210b7a72 | John Walker & Sons XR 21 Year Old James Jean Limited Edition | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
| jw-ed-25a508867231 | John Walker & Sons XR 21 Year Old Philip Colbert Limited Edition | auction-result | Wynik starszy niż rok względem aktualizacji źródła |
