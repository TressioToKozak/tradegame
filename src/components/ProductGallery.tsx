import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { createPortal } from "react-dom";
import { assetUrl, photosFor, productMedia, type Photo } from "../media";
import { whisky } from "../catalog";

export function Modal({
  title,
  onClose,
  children,
  className = "",
  dismissible = true,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== ref.current) return;
      if (e.key === "Escape" && dismissible) onClose();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,textarea,select,a[href],[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && dismissible) onClose();
      }}
    >
      <div
        className={"modal " + className}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
      >
        {dismissible && (
          <button
            className="modal-close icon-button"
            onClick={onClose}
            aria-label="Zamknij okno"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default function ProductGallery({
  product,
  compact = false,
  collection = false,
}: {
  product?: string;
  compact?: boolean;
  collection?: boolean;
}) {
  const photos = collection ? productMedia.collection : photosFor(product!);
  const title = collection ? "Kolekcja Johnnie Walker" : whisky(product!).name;
  const [selected, setSelected] = useState(0),
    [failed, setFailed] = useState<string[]>([]),
    [zoom, setZoom] = useState(false);
  useEffect(() => {
    setSelected(0);
    setFailed([]);
    setZoom(false);
  }, [product, collection]);
  const usable = photos.filter((p) => !failed.includes(p.path));
  useEffect(() => {
    setSelected((index) => Math.min(index, Math.max(0, usable.length - 1)));
  }, [usable.length]);
  const photo = usable[Math.min(selected, usable.length - 1)];
  const attribution = (p: Photo) => (
    <p className="photo-credit">
      <a href={p.source} target="_blank" rel="noreferrer">
        {p.author}
      </a>{" "}
      ·{" "}
      <a href={p.licenseUrl} target="_blank" rel="noreferrer">
        {p.license}
      </a>
    </p>
  );
  return (
    <div
      className={`product-gallery ${compact ? "compact" : ""} ${collection ? "collection-photo" : ""}`}
    >
      {photo ? (
        <>
          <button
            className="photo-stage"
            onClick={() => setZoom(true)}
            aria-label={`Powiększ zdjęcie: ${title}`}
          >
            <img
              src={assetUrl(photo.path)}
              alt={`${title} — ${photo.label}`}
              width="700"
              height="900"
              loading={compact ? "lazy" : "eager"}
              onError={() => setFailed((xs) => [...xs, photo.path])}
            />
            <span className="zoom-hint">
              <Expand size={14} /> Powiększ
            </span>
          </button>
          {!compact && (
            <>
              {usable.length > 1 && (
                <div className="photo-thumbnails" aria-label="Zdjęcia produktu">
                  {usable.map((p, i) => (
                    <button
                      className={i === selected ? "selected" : ""}
                      key={p.path}
                      onClick={() => setSelected(i)}
                      aria-label={p.label}
                    >
                      <img src={assetUrl(p.path)} alt="" loading="lazy" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {attribution(photo)}
        </>
      ) : (
        <div className="photo-missing">
          <Camera size={compact ? 24 : 36} strokeWidth={1} />
          <strong>{title.replace("Johnnie Walker ", "")}</strong>
          <span>
            {photos.length
              ? "Nie udało się wczytać fotografii"
              : "Fotografia oczekuje na dodanie"}
          </span>
          {!compact && (
            <small>Wyłącznie zdjęcie tej edycji z potwierdzoną licencją.</small>
          )}
        </div>
      )}
      {zoom && photo && (
        <Modal
          title={`Fotografia: ${title}`}
          onClose={() => setZoom(false)}
          className="lightbox"
        >
          <h2>{title}</h2>
          <img
            className="zoom-photo"
            src={assetUrl(photo.path)}
            alt={`${title} — ${photo.label}`}
          />
          <div className="lightbox-controls">
            <button
              className="outline"
              disabled={selected === 0}
              onClick={() => setSelected((i) => i - 1)}
              aria-label="Poprzednie zdjęcie"
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              {photo.label} · {selected + 1}/{usable.length}
            </span>
            <button
              className="outline"
              disabled={selected >= usable.length - 1}
              onClick={() => setSelected((i) => i + 1)}
              aria-label="Następne zdjęcie"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          {attribution(photo)}
        </Modal>
      )}
    </div>
  );
}
