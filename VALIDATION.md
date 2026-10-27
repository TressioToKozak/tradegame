# Weryfikacja

W środowisku Node 24 i Chromium wykonano:

- `npm test`: 13 testów silnika — chronologiczne odtwarzanie i zgodność porcjowania, wznowienie zapisu JSON, cofnięcie zegara, budżety i rezerwacje, rozliczenie zwycięstwa, dostawa i kontrola, odrzucenie spóźnionych ofert, limity NPC, zapytania i pamięć klienta, odrzucenie ceny, brak podwójnej sprzedaży, prowizje i etykiety, doręczenie i zwroty, uzasadniona reklamacja, niejednoznaczne intencje.
- `npm run build`: TypeScript i produkcyjny build Vite.
- Chromium: nowa gra → licytacja → podgląd uczestników. Następnie kontrolowany zapis testowy z towarem wystawionym w sklepie → wytworzone przez silnik zapytania → akceptacja → bezpieczne pakowanie → nadanie → odświeżenie z zachowaniem zamówienia. Bez błędów JavaScript.
- Widok 390 px: brak poziomego przepełnienia dokumentu.
- Produkcyjny podgląd: service worker, zapis IndexedDB i odświeżenie z wyłączoną siecią.

Scenariusz przeglądarkowy korzystał z kontrolowanego stanu i przeskoku czasu w silniku; nie odczekiwano dobowych dostaw w czasie rzeczywistym. Publikacja na GitHub nie została wykonana.
