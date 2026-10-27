# Fotografie whisky

W repozytorium znajdują się **13 rzeczywistych fotografii** z Wikimedia Commons: 10 edycji (9 z pierwotnego katalogu oraz Red Label), dodatkowe zdjęcia pudełek i kolekcja na ekranie startowym. Wszystkie 10 początkowych aukcji ma przypisane zdjęcie właściwej edycji.

Zdjęcia zmniejszono do maksymalnie 1400 px i przekonwertowano do WebP. Green Label 15 wykadrowano z lewej części oryginalnego zdjęcia; sąsiednia butelka 180 Cask nie jest pokazywana jako Green Label 15. Pozostałe fotografie zachowują pełny kadr. Licencje CC BY-SA dotyczą także tych adaptacji. Źródła i autorzy są dostępni w galerii i poniżej.

| Produkt / zdjęcie                           | Autor          | Źródło                                                                                                                                                   | Licencja                                                               |
| ------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| blue — Butelka i oryginalne opakowanie      | User:Mattes    | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Johnnie_Walker_-_Blue_label.JPG)                                                             | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.en) |
| george — Butelka i oryginalne opakowanie    | UFu            | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Johnnie_Walker_King_George_V_1.jpg)                                                          | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)         |
| swing — Butelka i oryginalne opakowanie     | Iceman7840     | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Johnnie_Walker_Swing.jpg)                                                                    | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)         |
| double — Butelka i oryginalne opakowanie    | Iceman7840     | [Wikimedia Commons](https://commons.wikimedia.org/wiki/JW_Double_Black.jpg)                                                                              | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)         |
| black — Butelka i oryginalne opakowanie     | Iceman7840     | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Johnnie_Walker_Black_Label.jpg)                                                              | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)         |
| platinum — Butelka i oryginalne opakowanie  | Webysther      | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Webysther_201503211457450661_-_Johnnie_Walker_Platinum_Label,_garrafa_e_Caixa.jpg)           | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)         |
| platinum — Opakowanie                       | Webysther      | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Webysther_201503211456530660_-_Johnnie_Walker_Platinum_Label,_caixa.jpg)                     | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)         |
| centenary — Butelka i oryginalne opakowanie | SkankinHank    | [Wikimedia Commons](<https://commons.wikimedia.org/wiki/File:Johnnie_Walker_Gold_Label_"The_Centenary_Blend"_(Pre-2013_with_18-Year_Age_Statement).jpg>) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)         |
| green — Green Label 15 — butelka (kadr)     | Iceman7840     | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:JW_Greens.jpg)                                                                               | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)         |
| green — Opakowanie                          | Rachmaninoff   | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Johnnie_Walker_Green_Label_box.jpg)                                                          | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)         |
| gold — Butelka                              | Iceman7840     | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Johnnie_Walker_Gold_Label_Reserve.jpg)                                                       | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)         |
| red — Butelka                               | kallerna       | [Wikimedia Commons](https://commons.wikimedia.org/wiki/Johnnie_Walker_Red_Label.jpg)                                                                     | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)         |
| kolekcja — Kolekcja                         | Aneil Lutchman | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Johnnie_Walker_Blends_Lineup.jpg)                                                            | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0)         |

## Czego nadal brakuje

Nie udało się znaleźć potwierdzonych, odpowiednio licencjonowanych fotografii tych dziewięciu pierwotnych edycji:

- Aged 18 Years (`18`)
- Ghost & Rare Brora (`brora`)
- Ghost & Rare Port Ellen (`port`)
- Ghost & Rare Glenury Royal (`glenury`)
- Blue Label The Casks Edition (`casks`)
- Explorers’ Club The Royal Route (`royal`)
- Explorers’ Club The Spice Road (`spice`)
- Explorers’ Club The Gold Route (`goldroute`)
- Blue Label Year of the Dragon (`dragon`)

Nie podmieniono ich na zdjęcia innych whisky. Nowo dodane edycje katalogu, z wyjątkiem Red Label, również nie mają jeszcze fotografii. `npm run check:images:all` celowo zgłasza brak dziewięciu zdjęć pierwotnego katalogu. Kryterium fotografii wszystkich pierwotnych 18 produktów nie jest jeszcze spełnione.

## Dodawanie i kontrola

Pliki: `public/images/whisky/`. Przypisania: `src/product-media.json` — identyfikator produktu, ścieżka, podpis, rodzaj `bottle`/`box`, autor, źródło i licencja. Galerie obsługują wiele zdjęć, powiększenie, oryginalne proporcje i fallback błędu. Nie używaj fotografii innej edycji. `assetUrl` uwzględnia bazę Vite; fotografie są zapisywane także w cache offline.

- `npm run check:images:strict`: pliki i metadane oraz wszystkie pozycje z `src/initial-products.json`.
- `npm run check:images:all`: dodatkowo wszystkie pierwotne 18 edycji; obecnie nie przechodzi.
- `npm run test:e2e`: sprawdza rzeczywiste dekodowanie zdjęć początkowych aukcji i powiększenie pod `/tradegame/`.
