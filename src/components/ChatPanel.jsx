// src/components/ChatPanel.jsx
import { useEffect, useRef, useState } from "react";

/**
 * Props:
 * - api: { list:()=>Promise<Message[]>, send:(content)=>Promise<any>, remove:(id)=>Promise<any> }
 * - canRead: boolean
 * - canWrite: boolean
 * - canModerate: boolean
 * - title?: string
 * - blurred?: boolean  // <- nouveau: floute visuellement le chat (sans le cacher)
 *
 * Message = { id, sender_username, content, is_deleted, mine, can_delete }
 */
export default function ChatPanel({
  api,
  canRead,
  canWrite,
  canModerate,
  title = "Chat",
  blurred = false,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const tailRef = useRef(null);

  const scrollToBottom = () => {
    tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const load = async () => {
    if (!api || !canRead) return;
    setErr("");
    try {
      const arr = await api.list();
      setMessages(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.error("[ChatPanel] list error:", e);
      setErr("Impossible de charger le chat.");
    }
  };

  // Initial + when api/canRead change
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, canRead]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages?.length) scrollToBottom();
  }, [messages]);

  const send = async () => {
    const v = text.trim();
    if (!v || !api || !canWrite || sending) return;
    setSending(true);
    try {
      await api.send(v);
      setText("");
      await load();
    } catch (e) {
      console.error("[ChatPanel] send error:", e);
      setErr("Envoi impossible.");
    } finally {
      setSending(false);
    }
  };

  const onDelete = async (id) => {
    if (!api) return;
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      await api.remove(id);
      // fallback si pas de WS
      setMessages((m) =>
        m.map((x) =>
          x.id === id ? { ...x, is_deleted: true, content: "" } : x
        )
      );
    } catch (e) {
      console.error("[ChatPanel] delete error:", e);
      setErr("Suppression impossible.");
    }
  };

  // Accès complètement verrouillé (membres uniquement)
  if (!canRead) {
    return (
      <div className="chat-locked">
        <div className="chat-locked-title">{title}</div>
        <div className="chat-blur" />
        <div className="chat-locked-msg">Discussion réservée aux membres</div>
      </div>
    );
  }

  return (
    <div className={`chat-wrap ${blurred ? "is-blurred" : ""}`}>
      <div className="chat-header">
        <div className="chat-title">{title}</div>
        {!!err && <div className="chat-error">{err}</div>}
      </div>

      <div className="chat-list">
        {messages.length === 0 ? (
          <div className="chat-empty">Aucun message pour l’instant.</div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble ${m.mine ? "mine" : ""} ${
                m.is_deleted ? "deleted" : ""
              }`}
            >
              <div className="sender">{m.sender_username}</div>
              <div className="content">
                {m.is_deleted ? "Message supprimé" : m.content}
              </div>
              {!m.is_deleted && (m.can_delete || canModerate) && (
                <button
                  className="msg-action"
                  title="Supprimer"
                  onClick={() => onDelete(m.id)}
                >
                  Suppr
                </button>
              )}
            </div>
          ))
        )}
        <div ref={tailRef} />
      </div>

      {canWrite && (
        <div className="chat-compose">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Votre message…"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button onClick={send} disabled={!text.trim() || sending}>
            {sending ? "…" : "Envoyer"}
          </button>
        </div>
      )}

      {blurred && <div className="chat-soft-blur" aria-hidden />}
    </div>
  );
}
