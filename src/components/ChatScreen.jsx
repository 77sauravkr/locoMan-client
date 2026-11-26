import { useEffect, useRef, useState } from "react";
import Composer from "./Composer";
import Message from "./Message";
import { api } from "../lib/api";

const SUGGESTIONS = [
  "Plan a 3-day trip to Jaipur under ₹10,000",
  "Best street food in Old Delhi",
  "Goa ya Gokarna: kahan jaana chahiye?",
  "Packing list for Ladakh in June",
];

let counter = 0;
const localMessage = (role, text) => ({ id: `local-${++counter}`, role, text });

export default function ChatScreen({ chatId, onChat }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null); // null | "text" | "voice"
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const abort = useRef(null);
  const audio = useRef(null);
  const scroller = useRef(null);
  const follow = useRef(true);

  useEffect(() => {
    const load = new AbortController();
    api
      .loadChat(chatId, load.signal)
      .then((data) => setMessages(data.messages))
      .catch((err) => {
        // 404 means a new chat with nothing saved yet.
        if (err.name !== "AbortError" && err.status !== 404) setError(err.message);
      })
      .finally(() => !load.signal.aborted && setLoading(false));
    return () => load.abort();
  }, [chatId]);

  useEffect(
    () => () => {
      abort.current?.abort();
      audio.current?.pause();
      window.speechSynthesis?.cancel();
    },
    [],
  );

  // Follow new text unless the user has scrolled up to read.
  useEffect(() => {
    const el = scroller.current;
    if (el && follow.current) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const onScroll = () => {
    const el = scroller.current;
    follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const send = async (raw) => {
    const text = raw.trim();
    if (!text || pending || loading) return;
    const question = localMessage("user", text);
    const reply = localMessage("bot", "");
    const controller = new AbortController();
    abort.current = controller;
    follow.current = true;
    setError("");
    setInput("");
    setPending("text");
    setMessages((prev) => [...prev, question, reply]);
    // List the chat right away; the server saves it even if the user switches chats.
    if (messages.length === 0) onChat(chatId, text.slice(0, 60));
    else onChat(chatId);

    try {
      const done = await api.streamMessage(chatId, text, {
        signal: controller.signal,
        onDelta: (delta) =>
          setMessages((prev) => prev.map((m) => (m.id === reply.id ? { ...m, text: m.text + delta } : m))),
      });
      onChat(chatId, done.title);
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== reply.id || m.text));
      } else {
        // Nothing was saved, so remove both bubbles and let the user retry.
        setMessages((prev) => prev.filter((m) => m.id !== question.id && m.id !== reply.id));
        setInput((current) => current || text);
        setError(err.message);
      }
    }
    setPending(null);
  };

  const sendVoice = async (blob) => {
    if (!blob.size) return setError("Nothing was recorded.");
    const controller = new AbortController();
    abort.current = controller;
    follow.current = true;
    setError("");
    setPending("voice");
    try {
      const data = await api.sendVoice(chatId, blob, controller.signal);
      setMessages((prev) => [...prev, ...data.messages]);
      onChat(chatId, data.title);
      if (data.audio) {
        audio.current = new Audio(`data:audio/mpeg;base64,${data.audio}`);
        // Autoplay can be blocked; the "Read aloud" button still works.
        audio.current.play().catch(() => {});
      }
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    }
    setPending(null);
  };

  return (
    <>
      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 px-4 py-6" aria-live="polite" aria-busy={Boolean(pending)}>
          {loading && <p className="m-auto animate-pulse text-slate-500">Loading chat...</p>}
          {!loading && messages.length === 0 && !pending && (
            <div className="m-auto w-full text-center">
              <h2 className="text-2xl font-bold">Where to next?</h2>
              <p className="mt-1 text-slate-500">Ask by text or tap the mic.</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="rounded-xl border border-slate-200 p-3 text-left text-sm transition hover:border-brand-500 hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-slate-900" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <Message key={m.id} role={m.role} text={m.text} streaming={pending === "text" && i === messages.length - 1} />
          ))}
          {pending === "voice" && <p className="animate-pulse text-slate-500">Listening to your message...</p>}
        </div>
      </div>
      {error && (
        <div role="alert" className="mx-auto mb-2 w-full max-w-3xl px-3">
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>
        </div>
      )}
      <Composer input={input} setInput={setInput} busy={Boolean(pending) || loading} canStop={pending === "text"} onSend={send} onStop={() => abort.current?.abort()} onRecorded={sendVoice} onError={setError} />
    </>
  );
}
