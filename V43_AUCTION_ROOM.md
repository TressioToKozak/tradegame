# JW Collection Store 4.3 — sala na gotowej scenie

Sala pojedynczej aukcji wykorzystuje oryginalny `public/game-art/auction-room.png` dodany przez użytkownika. Scena zachowuje proporcje i jest dopasowana przez `object-fit: contain`; wolne miejsce wypełnia przyciemniona, rozmyta kopia tej samej grafiki. Główna scena nie jest agresywnie kadrowana ani rozciągana. Obraz sali i fotografie whisky to osobne warstwy.

`auction-ui-reference.png` został obejrzany jako wzór. Nie jest renderowany, pobierany ani umieszczony w cache aplikacji. Układ odtworzono z żywych komponentów: duży przedmiot i informacje po lewej, tytuł/specyfikacja, cena, zegar, status oraz oferty pośrodku, awatary NPC i rzeczywista historia po prawej. Panele są półprzezroczyste i utrzymane w ciemnym drewnie, bursztynie i złocie. Na tablecie są dwie strefy; na telefonie jedna kolumna ze skrótem ceny/czasu i przyciskiem „Do ofert”. Rywale i historia pozostają rozwijane.

Wszystkie fotografie edycji pochodzą z istniejącego katalogu. Nie zastąpiono ich elementami referencji ani fikcyjnymi whisky. Widoczne są stan butelki i pudełka, pojemność/moc oraz opis kolekcjonerski; dodatkowe fotografie i powiększenie zachowują dotychczasową obsługę.

Rynek nosi nazwę „Rynek aukcyjny”. Ma lekkie filtry, trzy tekstowe wyróżnienia najbliższych finałów oraz oznaczenia kart. „Nowa” wymaga rzeczywistego `createdAt` z ostatnich dwóch minut; „Kończy się” dotyczy ostatniej minuty; „Gorąca” wymaga co najmniej trzech ofert z ostatniej minuty od przynajmniej dwóch uczestników. „Rzadka” bazuje na katalogu, a „Obserwowana” na zapisanym wyborze gracza. Zamknięte partie nie otrzymują aktywnych oznaczeń. Wyróżnienia nie tworzą drugiego zestawu ciężkich kart ani sztucznych zdarzeń.

Pozostają zachowane: publiczni uczestnicy i ich deterministyczne awatary, rzeczywiste wycofania, prywatność budżetów i strategii, animacje ofert i prowadzenia, +15 SEKUND, wyniki i opcjonalne dźwięki. W centrum widać również obserwowanie i aktywny automat. Przy formularzu widoczny jest pełny koszt wybranej oferty. Przegrana nie pobiera pieniędzy; wygrana pokazuje opłaty i dostawę oraz prowadzi do magazynu. Panele wyników nie zawierają kontrolek licytowania.

Nie zmieniono silnika ekonomicznego, NPC, schedulerów, proxy, anti-sniping ani struktury zapisów. Pulpit zachowuje dotychczasową scenę i pięć stref. Drobna poprawka adresów rozmytego tła używa adresu bazowego strony, dzięki czemu CSS prawidłowo pobiera sceny również spod `/tradegame/`.

## Dostępność i wydajność

Panele korzystają z istniejącej obsługi fokusu i Escape. Animacje są krótkie i respektują ograniczenie ruchu; nie ma animowania wszystkich kart co sekundę. Dane HUD to aktualna wolna gotówka, reputacja i poziom istniejącego zapisu. Historia i lista rywali zachowują ograniczenia i własne przewijanie. Sala jest zasobem powłoki offline; grafika referencyjna nie jest zasobem runtime.

## Walidacja

- 108 testów jednostkowych/komponentowych/integracyjnych, w tym prawdziwość i granice czasowe oznaczeń rynku.
- 51 scenariuszy Chromium: dotychczasowe manualne/proxy oferty, replay, dwa przedłużenia i pojedyncze rozliczenie, wygrana/przegrana/brak sprzedaży, migracja, prywatne dane NPC, dźwięki i responsywność.
- Nowe testy sali na 1440×900 oraz 390×844 potwierdzają rzeczywiste tło, zdjęcie wybranej edycji, środkowy panel ofert, prawy panel rywali, brak przepełnienia i brak żądań grafiki referencyjnej. Zdjęcie jest dekodowane przed zrzutem; próbka pikseli odróżnia fotografię testowego Blue Label od pustego białego obrazu.
- Osobny test otwiera salę ponownie po odświeżeniu offline i potwierdza dekodowanie sceny oraz fotografii.
- TypeScript/Vite i kontrola 255 fotografii. Smoke Pages porównuje również SHA-256 sali oraz dekoduje ją w publicznej aplikacji po wdrożeniu.

Zrzuty Chromium: [rynek desktop](docs/screenshots/market43-1440.png), [sala desktop](docs/screenshots/auction43-1440.png), [sala mobile](docs/screenshots/auction43-390.png).
