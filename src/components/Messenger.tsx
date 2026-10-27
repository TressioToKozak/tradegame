import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Clock, MessageCircle, CheckCheck } from "lucide-react";
import { euro, whisky } from "../catalog";
import {
  interpret,
  markRead,
  sendResponse,
  unreadCount,
  type Intent,
  type State,
  type Thread,
} from "../engine";
import type { Mutate } from "../useGame";
import { date, labels, PriceInput, time } from "../ui";
import ProductGallery from "./ProductGallery";
export default function Messenger({
  state: s,
  mutate,
}: {
  state: State;
  mutate: Mutate;
}) {
  const [selected, setSelected] = useState<string | null>(
    s.threads.at(-1)?.id ?? null,
  );
  const sorted = s.threads
    .slice()
    .sort(
      (a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0),
    );
  const t = s.threads.find((t) => t.id === selected) ?? sorted[0];
  const inbound = t?.messages.filter((m) => m.from !== "Ty").at(-1)?.at ?? 0;
  useEffect(() => {
    if (t && inbound > (t.readAt ?? 0)) mutate((g) => markRead(g, t.id));
  }, [t?.id, inbound, mutate]);
  return (
    <section className="messenger">
      <div className="conversation-list">
        <div className="inbox-heading">
          <h2>Twoi kolekcjonerzy</h2>
          <span>{s.threads.length} rozmów</span>
        </div>
        {sorted.map((thread) => {
          const c = s.people.find((p) => p.id === thread.customer)!;
          const unread = unreadCount(thread);
          return (
            <button
              key={thread.id}
              onClick={() => setSelected(thread.id)}
              className={`conversation-preview ${thread.id === t?.id ? "selected" : ""}`}
            >
              <span className="avatar">
                {c.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <strong>
                  {c.name}
                  <small>{c.city}</small>
                </strong>
                <p>{thread.messages.at(-1)?.text}</p>
              </div>
              {unread > 0 && <b className="unread-count">{unread}</b>}
            </button>
          );
        })}
        {!sorted.length && (
          <p className="inbox-empty">
            Wystaw pierwszą butelkę. Rozmowy pojawią się, gdy oferta
            zainteresuje klientów.
          </p>
        )}
      </div>
      <div className="conversation-body">
        {t ? (
          <Conversation key={t.id} state={s} thread={t} mutate={mutate} />
        ) : (
          <div className="conversation-empty">
            <MessageCircle size={40} strokeWidth={1} />
            <h3>Dobry biznes zaczyna się od rozmowy.</h3>
            <p>Tu poznasz swoich klientów, ich propozycje i oczekiwania.</p>
          </div>
        )}
      </div>
    </section>
  );
}
function Conversation({
  state: s,
  thread: t,
  mutate,
}: {
  state: State;
  thread: Thread;
  mutate: Mutate;
}) {
  const [text, setText] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  const c = s.people.find((p) => p.id === t.customer)!,
    item = s.items.find((i) => i.id === t.item)!;
  useEffect(() => {
    scroll.current?.scrollTo({
      top: scroll.current.scrollHeight,
      behavior: "smooth",
    });
  }, [t.messages.length]);
  const act = (intent: Intent, text = "", price?: number) =>
    mutate((g) => sendResponse(g, t.id, intent, text, price));
  return (
    <>
      <div className="chat-heading">
        <div className="avatar">{c.name.slice(0, 2)}</div>
        <div>
          <h2>{c.name}</h2>
          <span>
            {c.city} · {labels[t.status]}
          </span>
        </div>
        <span className="trust-tag">
          Zaufanie {Math.round(c.trust * 100)}/100
        </span>
      </div>
      <div className="chat-product">
        <ProductGallery product={item.product} compact />
        <div>
          <span className="eyebrow">ROZMAWIACIE O</span>
          <h3>{whisky(item.product).name}</h3>
          <p>
            Propozycja klienta: <b>{euro(t.offer)}</b> z dostawą
          </p>
        </div>
      </div>
      <div className="negotiation-economy">
        <span>
          Nasza cena <b>{euro(item.price)}</b>
        </span>
        <span>
          Koszt nabycia <b>{euro(item.cost)}</b>
        </span>
        <span>
          Wysyłka <b>{euro(950)}</b>
        </span>
        <span>
          Marża przy ofercie klienta{" "}
          <b>{euro(t.offer - item.cost - 950 - Math.round(t.offer * 0.025))}</b>
        </span>
      </div>
      <div className="chat-history" ref={scroll}>
        {t.messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            className={`chat-bubble ${m.from === "Ty" ? "own" : ""}`}
          >
            <p>{m.text}</p>
            <small>
              {time(m.at)} {m.from === "Ty" && <CheckCheck size={12} />}
            </small>
          </motion.div>
        ))}
        {t.pendingReply && (
          <div className="waiting-reply">
            <span />
            <span />
            <span /> Wiadomość wysłana. Klient zapoznaje się z ofertą.
          </div>
        )}
      </div>
      {t.status === "open" ? (
        <div className="chat-compose">
          <p className="reply-deadline">
            <Clock size={12} /> Odpowiedź do {date(t.expires)}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = interpret(text);
              act(parsed.intent, text, parsed.price);
              if (parsed.intent !== "unclear") setText("");
            }}
          >
            <textarea
              aria-label="Wiadomość do klienta"
              placeholder="Twoja wiadomość… np. „Proponuję 220 €”"
              value={text}
              disabled={!!t.pendingReply}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              aria-label="Wyślij wiadomość"
              disabled={!text.trim() || !!t.pendingReply}
            >
              <ArrowUpRight size={19} />
            </button>
          </form>
          <details>
            <summary>Wybierz konkretne działanie</summary>
            <div className="actions">
              <button
                className="outline"
                disabled={!!t.pendingReply}
                onClick={() => act("accept")}
              >
                Akceptuj {euro(t.offer)}
              </button>
              <button
                className="outline"
                disabled={!!t.pendingReply}
                onClick={() => act("reject")}
              >
                Odmów
              </button>
              <button
                className="outline"
                disabled={!!t.pendingReply}
                onClick={() => act("wait")}
              >
                Poproś o cierpliwość
              </button>
              <button
                className="outline"
                disabled={!!t.pendingReply}
                onClick={() => act("photos")}
              >
                Potwierdź stan
              </button>
              <button
                className="outline"
                disabled={!!t.pendingReply}
                onClick={() => act("shipping")}
              >
                Informacja o dostawie
              </button>
            </div>
            <PriceInput
              label="Zaproponuj z dostawą"
              disabled={!!t.pendingReply}
              onSubmit={(n) => act("counter", "", n)}
            />
            <small>
              Niejasne wiadomości wymagają sprecyzowania. Zwroty obsługuj w
              zamówieniu.
            </small>
          </details>
        </div>
      ) : (
        <div className="chat-closed">
          {labels[t.status]} · Historia rozmowy pozostaje w pamięci klienta.
        </div>
      )}
    </>
  );
}
