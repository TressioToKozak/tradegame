// Wartości w centach to balans gry, nie bieżące notowania rynku.
export interface Whisky {
  id: string;
  name: string;
  category: "standard" | "blue" | "vintage" | "travel";
  value: number;
  rarity: number;
  description: string;
  collectorNote?: string;
  releaseYear?: number;
  volumeMl?: number;
  sourceUrl?: string;
}
export const catalog: Whisky[] = [
  ["black", "Black Label 12", "standard", 3500, 1],
  ["double", "Double Black", "standard", 4500, 2],
  ["green", "Green Label 15", "standard", 6000, 2],
  ["gold", "Gold Label Reserve", "standard", 6500, 2],
  ["platinum", "Platinum Label 18", "standard", 11000, 4],
  ["18", "Aged 18 Years", "standard", 9500, 3],
  ["blue", "Blue Label", "blue", 19000, 3],
  ["brora", "Blue Label Ghost & Rare Brora", "blue", 48000, 8],
  ["port", "Blue Label Ghost & Rare Port Ellen", "blue", 52000, 9],
  ["glenury", "Blue Label Ghost & Rare Glenury Royal", "blue", 39000, 8],
  ["george", "King George V", "blue", 49000, 7],
  ["casks", "Blue Label The Casks Edition", "blue", 35000, 7],
  ["royal", "Explorers’ Club The Royal Route", "travel", 16000, 6],
  ["spice", "Explorers’ Club The Spice Road", "travel", 6500, 4],
  ["goldroute", "Explorers’ Club The Gold Route", "travel", 11000, 5],
  ["swing", "Swing", "vintage", 7000, 4],
  ["centenary", "Gold Label 18 The Centenary Blend", "vintage", 17000, 7],
  ["dragon", "Blue Label Year of the Dragon", "blue", 26000, 6],
].map(([id, name, category, value, rarity]) => ({
  id: String(id),
  name: "Johnnie Walker " + name,
  category: category as Whisky["category"],
  value: Number(value),
  rarity: Number(rarity),
  description:
    "Autentyczna edycja. Cena referencyjna jest parametrem symulacji, nie ofertą handlową.",
}));
const additions: [
  string,
  string,
  Whisky["category"],
  number,
  number,
  string,
][] = [
  [
    "red",
    "Red Label",
    "standard",
    2200,
    1,
    "Podstawowe wydanie blendu; duża dostępność i niewielka marża.",
  ],
  [
    "rye",
    "Red Rye Finish",
    "standard",
    4500,
    4,
    "Finisz w beczkach po rye; wycofana seria Blenders’ Batch.",
  ],
  [
    "blonde",
    "Blonde",
    "standard",
    2800,
    2,
    "Jasny blend przeznaczony również do drinków.",
  ],
  [
    "white",
    "White Walker",
    "standard",
    6500,
    5,
    "Edycja związana z serialem Gra o tron.",
  ],
  [
    "ice",
    "A Song of Ice",
    "standard",
    5500,
    5,
    "Osobna edycja kolekcjonerska inspirowana Grą o tron.",
  ],
  [
    "fire",
    "A Song of Fire",
    "standard",
    5500,
    5,
    "Druga odrębna edycja serialowej serii.",
  ],
  [
    "jane",
    "Jane Walker Black Label 12",
    "standard",
    9000,
    6,
    "Black Label z kolekcjonerską etykietą Jane Walker.",
  ],
  [
    "sherry",
    "Black Label Sherry Finish",
    "standard",
    6000,
    4,
    "Specjalne wydanie Black Label z finiszem sherry.",
  ],
  [
    "speyside",
    "Black Label Origin Speyside",
    "standard",
    6500,
    5,
    "Regionalny blend z serii Black Label Origin.",
  ],
  [
    "highlands",
    "Black Label Origin Highlands",
    "standard",
    6500,
    5,
    "Regionalna odsłona kolekcjonerskiej serii Origin.",
  ],
  [
    "lowlands",
    "Black Label Origin Lowlands",
    "standard",
    6500,
    5,
    "Odrębna regionalna kompozycja serii Origin.",
  ],
  [
    "islay",
    "Black Label Origin Islay",
    "standard",
    7000,
    5,
    "Regionalne wydanie serii Origin związane z Islay.",
  ],
  [
    "pittyvaich",
    "Blue Label Ghost & Rare Pittyvaich",
    "blue",
    39000,
    8,
    "Ghost & Rare z whisky zamkniętej destylarni Pittyvaich.",
  ],
  [
    "portdundas",
    "Blue Label Ghost & Rare Port Dundas",
    "blue",
    39000,
    8,
    "Odrębne wydanie Ghost & Rare z Port Dundas.",
  ],
  [
    "anniversary",
    "Blue Label 200th Anniversary",
    "blue",
    35000,
    8,
    "Specjalne wydanie z okazji dwustulecia marki.",
  ],
  [
    "celebratory",
    "Celebratory Blend",
    "vintage",
    9000,
    6,
    "Wydanie z kolekcji dwustulecia marki.",
  ],
  [
    "legendary",
    "Blue Label Legendary Eight",
    "blue",
    42000,
    8,
    "Odrębna kompozycja rocznicowa Legendary Eight.",
  ],
  [
    "xr21",
    "XR 21",
    "travel",
    18000,
    6,
    "Kolekcjonerski blend z deklaracją wieku 21 lat.",
  ],
  [
    "premier",
    "Premier",
    "travel",
    20000,
    7,
    "Historyczna edycja z segmentu premium.",
  ],
  [
    "odyssey",
    "Odyssey",
    "blue",
    110000,
    9,
    "Luksusowy triple malt w charakterystycznej karafce.",
  ],
  [
    "quest",
    "Quest",
    "travel",
    70000,
    9,
    "Rzadkie historyczne wydanie dla kolekcjonerów.",
  ],
  [
    "honour",
    "Honour",
    "vintage",
    90000,
    9,
    "Historyczne wydanie premium; mała płynność w grze.",
  ],
  [
    "island",
    "Island Green",
    "travel",
    8500,
    5,
    "Travel Retail; odrębny blend od standardowego Green Label.",
  ],
  [
    "ram",
    "Blue Label Year of the Ram",
    "blue",
    32000,
    7,
    "Kolekcjonerska odsłona noworocznej serii Lunar New Year.",
  ],
  [
    "monkey",
    "Blue Label Year of the Monkey",
    "blue",
    30000,
    7,
    "Odrębne noworoczne opakowanie i motyw kolekcjonerski.",
  ],
  [
    "rooster",
    "Blue Label Year of the Rooster",
    "blue",
    30000,
    7,
    "Odsłona Lunar New Year z motywem koguta.",
  ],
  [
    "dog",
    "Blue Label Year of the Dog",
    "blue",
    29000,
    7,
    "Noworoczne wydanie z motywem psa.",
  ],
  [
    "pig",
    "Blue Label Year of the Pig",
    "blue",
    28000,
    7,
    "Odsłona Lunar New Year z motywem świni.",
  ],
  [
    "rat",
    "Blue Label Year of the Rat",
    "blue",
    28000,
    7,
    "Noworoczna edycja kolekcjonerska z motywem szczura.",
  ],
  [
    "ox",
    "Blue Label Year of the Ox",
    "blue",
    28000,
    7,
    "Odrębne kolekcjonerskie wydanie Lunar New Year.",
  ],
  [
    "tiger",
    "Blue Label Year of the Tiger",
    "blue",
    27000,
    7,
    "Wydanie noworoczne z motywem tygrysa.",
  ],
  [
    "rabbit",
    "Blue Label Year of the Rabbit",
    "blue",
    27000,
    7,
    "Wydanie noworoczne z motywem królika.",
  ],
  [
    "snake",
    "Blue Label Year of the Snake",
    "blue",
    26000,
    6,
    "Odrębna odsłona kolekcjonerskiej serii noworocznej.",
  ],
  [
    "select",
    "Select Casks Rye Cask Finish",
    "travel",
    9500,
    6,
    "Travel Retail z finiszem w beczkach po rye.",
  ],
];
for (const [id, name, category, value, rarity, note] of additions)
  catalog.push({
    id,
    name: "Johnnie Walker " + name,
    category,
    value,
    rarity,
    description: note + " Ceny są balansem gry.",
    collectorNote: note,
  });
catalog.find((w) => w.id === "green")!.volumeMl = 700;
catalog.find((w) => w.id === "double")!.volumeMl = 1000;
export const categoryLabel = (w: Whisky) =>
  w.name.includes("Ghost & Rare")
    ? "Ghost & Rare"
    : w.id === "centenary" || w.id === "honour"
      ? "Historyczne edycje"
      : w.category === "travel"
        ? "Travel Retail"
        : w.name.includes("Year of")
          ? "Limitowane opakowania"
          : w.category === "blue"
            ? "Blue Label"
            : w.category === "vintage"
              ? "Vintage"
              : ["platinum", "rye", "white", "ice", "fire"].includes(w.id)
                ? "Wycofane edycje"
                : "Standardowe wydania";
export const whisky = (id: string) => catalog.find((w) => w.id === id)!;
export { productMedia } from "./media";
export const euro = (n: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "EUR" }).format(
    n / 100,
  );
