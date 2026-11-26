import { memo, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Icon from "./Icon";
import { canSpeak, speak as readAloud, stopSpeaking } from "../lib/speech";

const MARKDOWN = {
  // Model output could point images at other sites, so they are not loaded.
  img: () => null,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
  table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
};

function Actions({ text }) {
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  useEffect(() => () => {
    if (started.current) stopSpeaking();
  }, []);

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      return setSpeaking(false);
    }
    started.current = true;
    setSpeaking(true);
    readAloud(text, () => setSpeaking(false));
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
      {canSpeak() && (
        <button className="icon-btn !h-8 !w-8" onClick={toggle} aria-label={speaking ? "Stop reading" : "Read aloud"}>
          <Icon name={speaking ? "stop" : "volume"} className="h-4 w-4" />
        </button>
      )}
      <button className="icon-btn !h-8 !w-8" onClick={copy} aria-label={copied ? "Copied" : "Copy reply"}>
        <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
      </button>
    </div>
  );
}

function Message({ role, text, streaming, image, hasImage }) {
  if (role === "user") {
    return (
      <div className="max-w-[85%] self-end whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-white">
        {image ? (
          <img src={image} alt="You sent" className="mb-2 max-h-60 rounded-lg" />
        ) : (
          hasImage && <span className="mb-1 flex items-center gap-1 text-xs text-brand-100"><Icon name="image" className="h-4 w-4" /> Photo</span>
        )}
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
