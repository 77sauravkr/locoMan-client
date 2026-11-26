import { useRef } from "react";
import Icon from "./Icon";
import { useRecorder } from "../hooks/useRecorder";

export default function Composer({ input, setInput, busy, canStop, onSend, onStop, onRecorded, onError }) {
  const { recording, toggle } = useRecorder({ onRecorded, onError });
  const box = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    if (!busy && !recording) onSend(input);
  };

  const onKeyDown = (e) => {
    // isComposing: do not send while an input method (e.g. Hindi) is still composing.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-end gap-1 rounded-2xl border border-slate-300 bg-white p-1.5 focus-within:border-brand-500 dark:border-slate-700 dark:bg-slate-900">
        <button type="button" className={`icon-btn ${recording ? "!bg-red-100 !text-red-600 motion-safe:animate-pulse" : ""}`} onClick={toggle} disabled={busy} aria-label={recording ? "Stop recording and send" : "Record voice message"} aria-pressed={recording}>
          <Icon name={recording ? "stop" : "mic"} />
        </button>
        <textarea
          ref={box}
          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 outline-none [field-sizing:content]"
          rows={1}
          maxLength={4000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={recording ? "Listening... tap stop to send" : "Ask about any destination"}
          aria-label="Message"
          disabled={recording}
        />
        {canStop ? (
          <button type="button" className="icon-btn !bg-slate-900 !text-white dark:!bg-white dark:!text-slate-900" onClick={onStop} aria-label="Stop reply">
            <Icon name="stop" />
          </button>
        ) : (
          <button className="icon-btn !bg-brand-600 !text-white" disabled={busy || recording || !input.trim()} aria-label="Send">
            <Icon name="send" />
          </button>
        )}
      </div>
      <p className="mt-1.5 text-center text-xs text-slate-500">AI can be wrong. Check visa rules, prices and timings before you travel.</p>
    </form>
  );
}
