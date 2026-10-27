# Fotografie: status, źródła i dodawanie

## Diagnoza obecnej wersji

Przyczyną braku zdjęć był **pusty `whiskyImages` i brak jakichkolwiek plików w `public/images/whisky/`**. Nie istniały fotografie, które mogłyby się wyświetlić. Ponadto stary komponent nie dodawał bazy repozytorium do ścieżek `/images/...`.

Nowy `ProductGallery` korzysta z `src/product-media.json` i `assetUrl()` w `src/media.ts`, który dodaje bazę Vite. Obsługuje galerię butelki i opakowania, podpis, autora i licencję, powiększenie w modalu, stały wymiar sceny oraz powrót do czytelnej informacji przy błędzie obrazu.

## Bieżący blocker: brak legalnych plików

**Nie dołączono jeszcze fotografii. Warunek akceptacji zdjęć nie jest spełniony.** Nie wolno traktować działającej galerii ani kompilacji jako potwierdzenia dostępności fotografii.

Próba odczytania metadanych Wikimedia Commons zakończyła się `Tunnel connection failed: 403 Forbidden`. Polityka sieciowa środowiska nie pozwala obecnie sprawdzić licencji ani pobrać tych plików. W projekcie nie użyto zdjęć skopiowanych bez uprawnień, obrazów AI ani fotografii innej edycji. W konfiguracji środowiska zapisano propozycję dodania `commons.wikimedia.org` oraz `upload.wikimedia.org`; zapis draftu nie stosuje automatycznie zmian w działającym środowisku.

| Plik | Produkt | Autor / źródło | Licencja | Modyfikacje |
| ---- | ------- | -------------- | -------- | ----------- |
| —    | —       | —              | —        | —           |

## Jak podłączyć fotografie

1. Potwierdź, że zdjęcie przedstawia konkretną edycję. Sprawdź prawo do redystrybucji oraz wymagania oznaczenia autorstwa.
2. Umieść własny lub odpowiednio licencjonowany JPEG, PNG albo WebP w `public/images/whisky/`.
3. Uzupełnij manifest. Poniższe pola są wzorem struktury, **nie deklaracją istniejącego pliku ani licencji**:

```json
{
  "products": {
    "blue": [
      {
        "path": "images/whisky/blue-label-bottle.webp",
        "label": "Butelka",
        "kind": "bottle",
        "author": "Autor zgodnie z licencją",
        "source": "https://adres-oryginalnej-strony-pliku",
        "license": "Dokładna nazwa potwierdzonej licencji",
        "licenseUrl": "https://adres-licencji"
      }
    ]
  },
  "collection": []
}
```

4. Drugie zdjęcie tej samej edycji z `kind: "box"` i etykietą „Opakowanie” tworzy kolejną miniaturę galerii. `collection` przyjmuje legalną fotografię kolekcji/salonu na menu startowe. Nie umieszczaj tam zdjęcia udającego inną edycję.
5. Wpisz plik, autora, źródło, licencję, datę sprawdzenia i modyfikacje do tabeli powyżej. Dołącz tekst licencji, jeśli tego wymaga.
6. Uruchom `npm run check:images`, `npm run check:images:strict`, `npm run build` oraz `npm run test:e2e`.

Weryfikator sprawdza istnienie i nagłówki plików oraz obecność metadanych; **nie potwierdza praw autorskich**. Prawa trzeba sprawdzić u źródła. Tryb strict wymaga fotografii Blue Label (`blue`), King George V (`george`) i Swing (`swing`). Test przeglądarkowy weryfikuje rzeczywiste dekodowanie obrazów z `/tradegame/` i powiększenie; gdy nie ma zdjęć, test jest jawnie pominięty.
