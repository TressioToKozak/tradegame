export type Pace = "Spokojne" | "Dynamiczne" | "Intensywne";
export const paceFactor = (pace: Pace) =>
  pace === "Spokojne" ? 1.6 : pace === "Intensywne" ? 0.7 : 1;
export const pacing = {
  Spokojne: "Mniej wydarzeń, więcej czasu na decyzje.",
  Dynamiczne: "Nowe okazje co 30–60 sekund. Zalecane.",
  Intensywne: "Więcej wydarzeń i szybsza logistyka.",
};
