import { useId, useState } from "react";
import { Info } from "lucide-react";
export default function Hint({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId(),
    [open, setOpen] = useState(false);
  return (
    <span
      className="hint-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="hint-trigger"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            setOpen(false);
          }
        }}
      >
        <Info size={15} />
      </button>
      {open && (
        <span role="tooltip" id={id}>
          {children}
        </span>
      )}
    </span>
  );
}
