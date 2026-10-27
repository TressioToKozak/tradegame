import { useState } from "react";
import { Package } from "lucide-react";
export const time = (n: number) =>
  new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(n);
export const date = (n: number) =>
  new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Amsterdam",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(n);
export const countdown = (end: number, now: number) => {
  const sec = Math.max(0, Math.ceil((end - now) / 1000));
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
};
export const labels: Record<string, string> = {
  incoming: "W drodze",
  inspect: "Do kontroli",
  stock: "W magazynie",
  listed: "W sklepie",
  reserved: "Zarezerwowane",
  sold: "Sprzedane",
  packing: "Do spakowania",
  shipping: "W drodze",
  delivered: "Doręczone",
  complaint: "Reklamacja",
  returned: "Zwrócone",
  open: "Oczekuje",
  accepted: "Kupiono",
  declined: "Zamknięte",
  expired: "Wygasło",
};
export function PriceInput({
  initial = 0,
  onSubmit,
  label = "Zapisz cenę",
  disabled = false,
}: {
  initial?: number;
  onSubmit: (n: number) => void;
  label?: string;
  disabled?: boolean;
}) {
  const [value, set] = useState(initial ? String(initial / 100) : "");
  return (
    <form
      className="price-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(Math.round(Number(value.replace(",", ".")) * 100));
      }}
    >
      <input
        aria-label="Kwota w euro"
        inputMode="decimal"
        placeholder="Kwota w €"
        value={value}
        disabled={disabled}
        onChange={(e) => set(e.target.value)}
      />
      <button disabled={disabled}>{label}</button>
    </form>
  );
}
export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Package size={30} strokeWidth={1} />
      <h3>Tu zaczyna się kolejny rozdział</h3>
      <p>{text}</p>
    </div>
  );
}
