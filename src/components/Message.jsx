import { memo, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Icon from "./Icon";

const MARKDOWN = {
  // Model output could point images at other sites, so they are not loaded.
  img: () => null,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
  table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
};

function Actions({ text }) {
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const utterance = useRef(null);

  useEffect(() => () => {
    if (utterance.current) window.speechSynthesis.cancel();
  }, []);

  const speak = () => {
    window.speechSynthesis.cancel();
    if (speaking) return setSpeaking(false);
    const next = new SpeechSynthesisUtterance(text.replace(/[*_#`>|]/g, ""));
    if (/[ऀ-ॿ]/.test(text)) next.lang = "hi-IN";
    next.onend = next.onerror = () => setSpeaking(false);
    utterance.current = next;
    window.speechSynthesis.speak(next);
    setSpeaking(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-1 flex gap-1">
      {"speechSynthesis" in window && (
        <button className="icon-btn !h-8 !w-8" onClick={speak} aria-label={speaking ? "Stop reading" : "Read aloud"}>
          <Icon name={speaking ? "stop" : "volume"} className="h-4 w-4" />
        </button>
      )}
      <button className="icon-btn !h-8 !w-8" onClick={copy} aria-label={copied ? "Copied" : "Copy reply"}>
        <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
      </button>
    </div>
  );
}

function Message({ role, text, streaming }) {
  if (role === "user") {
    return (
      <div className="max-w-[85%] self-end whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-white">
        {text}
      </div>
    );
  }
  return (
    <div className="min-w-0 max-w-full">
      {text ? (
        <div className="prose prose-slate max-w-none break-words dark:prose-invert">
          <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN}>{text}</Markdown>
        </div>
      ) : (
        <p className="animate-pulse text-slate-500">Thinking...</p>
      )}
      {text && !streaming && <Actions text={text} />}
    </div>
  );
}

export default memo(Message);
