# JW Collection Store 3.1

Automatyczna licytacja wymaga wyraźnej aktywacji i potwierdzenia maksymalnego kosztu. Maksimum dotyczy ceny młotkowej; każda oferta sprawdza także prowizję, transport, środki zajęte na innych aukcjach i pojemność magazynu. Automat składa minimalny krok, nie przebija siebie. Można zmienić limit i wyłączyć automat; już przyjęte oferty pozostają wiążące. Przy równych maksimach wygrywa wcześniejsza rejestracja maksimum. Kolejka, kolejność i decyzje są zapisane i odtwarzane offline. Zmiana prowadzenia w ostatnich 10 sekundach wydłuża aukcję o 15 sekund, również dla automatu.

Zamknięte aukcje mają osobne wyniki bez formularza licytacji. Wygrana pokazuje rzeczywisty koszt i dostawę przypisaną do tej aukcji. Nowy interfejs obejmuje menu, własny znak sklepu, mobilną nawigację, uproszczone filtry, powiadomienia i duże fotografie bez przycinania. Źródła i autorzy zdjęć pozostają dostępni w pomocy. Wyceny źródłowe i prywatne limity NPC nie są podpowiedziami cenowymi w interfejsie.

Codzienne cele nagradzają wyłącznie XP za rzeczywistą kontrolę egzemplarza, wystawienie i doręczenie bez reklamacji. Odbiór nagrody jest jednokrotny; dzień wyznacza strefa Europe/Amsterdam. Kontakty odblokowują specjalne partie z istniejącego katalogu, bez sztucznych rabatów. Tempo rynku i ekonomiczne koszty pozostają zachowane.

Zapis zachowuje format 2 i istniejące pieniądze, towary, transakcje oraz terminy. Nowe pola są opcjonalne. Starsze limity bezpieczeństwa są migrowane jako nieaktywne i nie uruchamiają automatu. Eksport i import zapisu nadal są dostępne.

Katalog: 254 produkty i 255 prawdziwych fotografii. Źródłowe notowania pozostają niezmienione; NPC korzystają z mediany zamiast zawyżania budżetu przez skrajny wynik. 134 wyceny nadal wymagają niezależnej weryfikacji zgodnie z IMPORT_REPORT.md.

Walidacja: 100 testów jednostkowych/komponentowych/integracyjnych, 38 scenariuszy Chromium, kompilacja TypeScript/Vite i kontrola wszystkich zdjęć. Publiczny pipeline dodatkowo porównuje hashe publikowanych plików i dekoduje wszystkie fotografie w przeglądarce po wdrożeniu.
