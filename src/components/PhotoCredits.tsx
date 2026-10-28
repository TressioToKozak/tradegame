import { useState } from "react";
import { Modal } from "./ProductGallery";
import { productMedia } from "../media";
import { whisky } from "../catalog";
export default function PhotoCredits({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);
  const rows = [
    ...Object.entries(productMedia.products).flatMap(([id, photos]) =>
      photos.map((p) => ({ name: whisky(id).name, ...p })),
    ),
    ...productMedia.collection.map((p) => ({
      name: "Fotografia kolekcji",
      ...p,
    })),
  ];
  return (
    <Modal
      title="Informacje o fotografiach"
      onClose={onClose}
      className="photo-credits-dialog"
    >
      <h2>Fotografie i autorzy</h2>
      <p>
        Oryginalne fotografie, źródła i informacje o prawach. Monogram gry jest
        autorskim znakiem JW Collection Store.
      </p>
      <div className="credits-list">
        {rows.slice(page * 20, page * 20 + 20).map((p) => (
          <article key={p.path}>
            <h3>{p.name}</h3>
            <p>{p.author}</p>
            <a href={p.source} target="_blank" rel="noreferrer">
              Źródło
            </a>{" "}
            ·{" "}
            <a href={p.licenseUrl} target="_blank" rel="noreferrer">
              {p.license}
            </a>
          </article>
        ))}
      </div>
      <div className="actions">
        <button
          className="outline"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Poprzednia
        </button>
        <span>
          {page + 1}/{Math.ceil(rows.length / 20)}
        </span>
        <button
          className="outline"
          disabled={(page + 1) * 20 >= rows.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Następna
        </button>
      </div>
    </Modal>
  );
}
