import { useRef } from "react";
import Icon from "./Icon";
import { useRecorder } from "../hooks/useRecorder";
import { prepareImage } from "../lib/image";

export default function Composer({ input, setInput, image, setImage, nearMe, onToggleNearMe, busy, canStop, onSend, onStop, onRecorded, onLive, onError }) {
  const { recording, toggle } = useRecorder({ onRecorded, onError });
  const picker = useRef(null);
  const empty = !input.trim() && !image;

  const submit = (e) => {
    e.preventDefault();
    if (!busy && !recording && !empty) onSend(input);
  };

  const onKeyDown = (e) => {
    // isComposing: do not send while an input method (e.g. Hindi) is still composing.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
  };

  const addImage = async (file) => {
    if (!file) return;
    try {
      setImage(await prepareImage(file));
      onError("");
    } catch (err) {
      onError(err.message);
    }
  };

  const onPaste = (e) => {
    const file = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      addImage(file);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="rounded-2xl border border-slate-300 bg-white p-1.5 focus-within:border-brand-500 dark:border-slate-700 dark:bg-slate-900">
        {image && (
          <div className="relative m-1 inline-block">
            <img src={image.preview} alt="Selected" className="h-20 rounded-lg object-cover" />
            <button type="button" className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-white" onClick={() => setImage(null)} aria-label="Remove picture">
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <textarea
          className="block max-h-40 min-h-10 w-full resize-none bg-transparent px-2 py-2 outline-none [field-sizing:content]"
          rows={1}
          maxLength={4000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={recording ? "Listening... tap stop to send" : image ? "Ask about this picture" : "Ask about any destination"}
          aria-label="Message"
          disabled={recording}
        />
        <div className="flex items-center gap-1">
          <input ref={picker} type="file" accept="image/*" className="hidden" onChange={(e) => { addImage(e.target.files[0]); e.target.value = ""; }} />
          <button type="button" className="icon-btn" onClick={() => picker.current.click()} disabled={busy || recording} aria-label="Add a picture">
            <Icon name="image" />
          </button>
          <button type="button" className={`flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm ${nearMe ? "bg-brand-100 text-brand-700 dark:bg-brand-700 dark:text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={onToggleNearMe} aria-pressed={Boolean(nearMe)} aria-label="Use my location">
            <Icon name="pin" /> <span className="hidden sm:inline">Near me</span>
          </button>
          <span className="flex-1" />
          <button type="button" className={`icon-btn ${recording ? "!bg-red-100 !text-red-600 motion-safe:animate-pulse" : ""}`} onClick={toggle} disabled={busy} aria-label={recording ? "Stop recording and send" : "Record voice message"} aria-pressed={recording}>
            <Icon name={recording ? "stop" : "mic"} />
          </button>
          <button type="button" className="icon-btn" onClick={onLive} disabled={busy || recording} aria-label="Start live voice chat" title="Live voice chat">
            <Icon name="wave" />
          </button>
          {canStop ? (
            <button type="button" className="icon-btn !bg-slate-900 !text-white dark:!bg-white dark:!text-slate-900" onClick={onStop} aria-label="Stop reply">
              <Icon name="stop" />
            </button>
          ) : (
            <button className="icon-btn !bg-brand-600 !text-white" disabled={busy || recording || empty} aria-label="Send">
              <Icon name="send" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-center text-xs text-slate-500">AI can be wrong. Check visa rules, prices and timings before you travel.</p>
    </form>
  );
}
