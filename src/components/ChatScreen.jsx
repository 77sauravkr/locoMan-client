import { useEffect, useRef, useState } from "react";
import Composer from "./Composer";
import Message from "./Message";
import LiveVoice from "./LiveVoice";
import Icon from "./Icon";
import { api } from "../lib/api";
import { canSpeak, speak, stopSpeaking } from "../lib/speech";

const SUGGESTIONS = [
  "Plan a 3-day trip to Jaipur under ₹10,000",
  "Best street food in Old Delhi",
  "Goa ya Gokarna: kahan jaana chahiye?",
  "Packing list for Ladakh in June",
];
const FOLLOW_UPS = ["Day-wise plan banao", "Budget breakdown do", "Local food kya try karun?", "Wahan kaise pahunchun?"];
const PHOTO_QUESTION = "What is this place or thing, and what should a traveller know about it?";

const asMarkdown = (messages) => messages.map((m) => (m.role === "user" ? `**You:** ${m.text}` : m.text)).join("\n\n");

let counter = 0;
const localMessage = (role, text) => ({ id: `local-${++counter}`, role, text });

export default function ChatScreen({ chatId, onChat, onChatFailed }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null); // null | "text" | "voice"
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [live, setLive] = useState(false);
  const [shared, setShared] = useState("");
  const abort = useRef(null);
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
      stopSpeaking();
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
    const photo = image;
    const text = raw.trim() || (photo ? PHOTO_QUESTION : "");
    if (!text || pending || loading) return;
    const question = { ...localMessage("user", text), image: photo?.preview };
    const isNew = messages.length === 0;
    const reply = localMessage("bot", "");
    const controller = new AbortController();
    abort.current = controller;
    follow.current = true;
    setError("");
    setInput("");
    setImage(null);
    setPending("text");
    setMessages((prev) => [...prev, question, reply]);
    // List the chat right away; the server saves it even if the user switches chats.
    if (isNew) onChat(chatId, text.slice(0, 60));
    else onChat(chatId);

    try {
      const body = {
        text,
        ...(photo && { image: { mimeType: photo.mimeType, data: photo.data } }),
        ...(location && { location }),
      };
      const done = await api.streamMessage(chatId, body, {
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
        setInput((current) => current || raw);
        setImage((current) => current || photo);
        setError(err.message);
        // Nothing was saved, so a new chat should not stay in the list.
        if (isNew) onChatFailed(chatId);
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
      addExchange(data);
      speak(data.messages[1].text);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    }
    setPending(null);
  };

  const addExchange = (data) => {
    follow.current = true;
    setMessages((prev) => [...prev, ...data.messages]);
    onChat(chatId, data.title);
  };

  // Location is asked for only when this is switched on.
  const toggleNearMe = () => {
    if (location) return setLocation(null);
    if (!navigator.geolocation) return setError("Location is not supported in this browser.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setError("");
        setLocation({ lat: Number(coords.latitude.toFixed(2)), lng: Number(coords.longitude.toFixed(2)) });
      },
      () => setError("Location was blocked. Allow it in your browser settings to use Near me."),
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  };

  const openLive = () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) return setError("Voice is not supported in this browser.");
    // iOS only allows speech after it was started by a tap.
    if (canSpeak()) window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    setError("");
    setLive(true);
  };

  const share = async () => {
    const text = asMarkdown(messages);
    try {
      if (navigator.share) await navigator.share({ title: "My LocoMan trip plan", text });
      else {
        await navigator.clipboard.writeText(text);
        setShared("Copied");
      }
    } catch (err) {
      if (err.name !== "AbortError") setError("Could not share this chat.");
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([asMarkdown(messages)], { type: "text/markdown" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: "locoman-trip.md" });
    link.click();
    URL.revokeObjectURL(url);
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
            <Message key={m.id} role={m.role} text={m.text} image={m.image} hasImage={m.hasImage} streaming={pending === "text" && i === messages.length - 1} />
          ))}
          {!pending && messages.at(-1)?.role === "bot" && (
            <div className="flex flex-wrap items-center gap-2">
              {FOLLOW_UPS.map((q) => (
                <button key={q} className="chip" onClick={() => send(q)}>{q}</button>
              ))}
              <button className="chip flex items-center gap-1" onClick={share}><Icon name="share" className="h-4 w-4" /> {shared || "Share"}</button>
              <button className="chip" onClick={download}>Download</button>
            </div>
          )}
          {pending === "voice" && <p className="animate-pulse text-slate-500">Listening to your message...</p>}
        </div>
      </div>
      {error && (
        <div role="alert" className="mx-auto mb-2 w-full max-w-3xl px-3">
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>
        </div>
      )}
      <Composer input={input} setInput={setInput} image={image} setImage={setImage} nearMe={location} onToggleNearMe={toggleNearMe} busy={Boolean(pending) || loading} canStop={pending === "text"} onSend={send} onStop={() => abort.current?.abort()} onRecorded={sendVoice} onLive={openLive} onError={setError} />
      {live && <LiveVoice chatId={chatId} onExchange={addExchange} onClose={() => setLive(false)} />}
    </>
  );
}
