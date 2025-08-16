// src/components/ChatPanel.jsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Props:
 * - api: { list:()=>Promise<Message[]>, send:(content)=>Promise<any>, remove:(id)=>Promise<any> }
 * - canRead: boolean
 * - canWrite: boolean
 * - canModerate: boolean
 * - title?: string
 * - blurred?: boolean  // floute visuellement le chat (sans le cacher)
 *
 * Message = { id, sender_username, content, is_deleted, mine, can_delete }
 */
export default function ChatPanel({
  api,
  canRead,
  canWrite,
  canModerate,
  title,
  blurred = false,
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("cp_title");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const tailRef = useRef(null);

  const scrollToBottom = () => {
    tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const load = async () => {
    if (!api || !canRead) return; // ne charge pas si pas d'accès
    setErr("");
    try {
      const arr = await api.list();
      setMessages(Array.isArray(arr) ? arr : []);
    } catch (e) {
      const status = e?.response?.status ?? e?.status;
      if (status === 403) {
        setMessages([]);
        setErr("");
        return;
      }
      console.warn("[ChatPanel] list error:", e);
      setErr(t("cp_err_load"));
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, canRead]);

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
      setErr(t("cp_err_send"));
    } finally {
      setSending(false);
    }
  };

  const onDelete = async (id) => {
    if (!api) return;
    if (!window.confirm(t("cp_confirm_delete"))) return;
    try {
      await api.remove(id);
      setMessages((m) =>
        m.map((x) => (x.id === id ? { ...x, is_deleted: true, content: "" } : x))
      );
    } catch (e) {
      console.error("[ChatPanel] delete error:", e);
      setErr(t("cp_err_delete"));
    }
  };

  // === Cas 1: pas le droit de lire & on veut un BLUR visuel ===
  if (!canRead && blurred) {
    // petits placeholders fictifs (aucun call réseau)
    const placeholders = [
      { id: "p1", sender_username: "membre_1", content: "…", mine: false },
      { id: "p2", sender_username: "membre_2", content: "…", mine: true },
      { id: "p3", sender_username: "membre_3", content: "…", mine: false },
      { id: "p4", sender_username: "membre_4", content: "…", mine: true },
    ];
    return (
      <div className="chat-wrap is-blurred">
        <div className="chat-header">
          <div className="chat-title">{resolvedTitle}</div>
        </div>
        <div className="chat-list">
          {placeholders.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble ${m.mine ? "mine" : ""}`}
              aria-hidden
            >
              <div className="sender">{m.sender_username}</div>
              <div className="content">{t("cp_placeholder_msg")}</div>
            </div>
          ))}
        </div>
        <div className="chat-soft-blur" aria-hidden />
        <div className="chat-locked-msg">{t("cp_join_to_view")}</div>
      </div>
    );
  }

  // === Cas 2: pas le droit de lire & pas de blur => bloc “locked” compact ===
  if (!canRead) {
    return (
      <div className="chat-locked">
        <div className="chat-locked-title">{resolvedTitle}</div>
        <div className="chat-blur" />
        <div className="chat-locked-msg">{t("cp_members_only")}</div>
      </div>
    );
  }

  // === Cas 3: accès normal ===
  return (
    <div className={`chat-wrap ${blurred ? "is-blurred" : ""}`}>
      <div className="chat-header">
        <div className="chat-title">{resolvedTitle}</div>
        {!!err && <div className="chat-error">{err}</div>}
      </div>

      <div className="chat-list">
        {messages.length === 0 ? (
          <div className="chat-empty">{t("cp_empty")}</div>
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
                {m.is_deleted ? t("cp_deleted") : m.content}
              </div>
              {!m.is_deleted && (m.can_delete || canModerate) && (
                <button
                  className="msg-action"
                  title={t("cp_delete")}
                  onClick={() => onDelete(m.id)}
                >
                  {t("cp_delete_short")}
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
            placeholder={t("cp_placeholder_input")}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button onClick={send} disabled={!text.trim() || sending}>
            {sending ? "…" : t("cp_send")}
          </button>
        </div>
      )}

      {blurred && <div className="chat-soft-blur" aria-hidden />}
    </div>
  );
}
