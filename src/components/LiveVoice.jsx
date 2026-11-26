import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { api } from "../lib/api";
import { speak, stopSpeaking, toSpoken } from "../lib/speech";

const TYPES = ["audio/webm", "audio/mp4", "audio/ogg"];
const SILENCE_MS = 1400; // pause that ends your turn
const NO_SPEECH_MS = 12_000;
const MAX_TURN_MS = 45_000;

const LABELS = {
  starting: "Starting the microphone...",
  listening: "Listening... just speak",
  thinking: "Thinking...",
  speaking: "LocoMan is speaking",
  paused: "Paused",
};

// Hands-free conversation: listen until you pause, answer aloud, then listen again.
export default function LiveVoice({ chatId, onExchange, onClose }) {
  const [phase, setPhase] = useState("starting");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const media = useRef(null); // { stream, context, analyser }
  const turn = useRef(null); // { recorder, timer, discard }
  const abort = useRef(null);
  const alive = useRef(true);
  const exchange = useRef(onExchange);

  useEffect(() => {
    exchange.current = onExchange;
  }, [onExchange]);

  const endTurn = useCallback((discard) => {
    const current = turn.current;
    if (!current) return;
    clearInterval(current.timer);
    current.discard = discard;
    if (current.recorder.state !== "inactive") current.recorder.stop();
  }, []);

  const listen = useCallback(() => {
    if (!alive.current || !media.current) return;
    stopSpeaking();
    const { stream, analyser } = media.current;
    const mimeType = TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];
    const samples = new Float32Array(analyser.fftSize);
    const started = Date.now();
    let noise = 0.005;
    let heard = false;
    let lastSound = started;
    const current = { recorder, discard: false };

    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = async () => {
      turn.current = null;
      if (!alive.current || current.discard) return;
      setPhase("thinking");
      const type = (recorder.mimeType || mimeType || "audio/webm").split(";")[0];
      abort.current = new AbortController();
      try {
        const data = await api.sendVoice(chatId, new Blob(chunks, { type }), abort.current.signal);
        if (!alive.current) return;
        exchange.current(data);
        const [question, reply] = data.messages;
        setCaption(`You: ${question.text}\n\n${toSpoken(reply.text)}`);
        setPhase("speaking");
        speak(reply.text, listen);
      } catch (err) {
        if (!alive.current || err.name === "AbortError") return;
        setError(err.message);
        setPhase("paused");
      }
    };

    current.timer = setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      const level = Math.sqrt(samples.reduce((sum, v) => sum + v * v, 0) / samples.length);
      const now = Date.now();
      // The first moments measure background noise.
      if (now - started < 300) noise = Math.max(noise, level);
      else if (level > Math.max(0.015, Math.min(noise * 2.5, 0.08))) {
        heard = true;
        lastSound = now;
      }
      if ((heard && now - lastSound > SILENCE_MS) || now - started > MAX_TURN_MS) endTurn(!heard);
      else if (!heard && now - started > NO_SPEECH_MS) {
        endTurn(true);
        setPhase("paused");
      }
    }, 100);

    turn.current = current;
    recorder.start();
    setError("");
    setPhase("listening");
  }, [chatId, endTurn]);

  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        const context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        context.createMediaStreamSource(stream).connect(analyser);
        await context.resume();
        media.current = { stream, context, analyser };
        listen();
      } catch {
        setError("Microphone is not available. Allow it in your browser settings.");
        setPhase("paused");
      }
    })();
    return () => {
      cancelled = true;
      alive.current = false;
      endTurn(true);
      abort.current?.abort();
      stopSpeaking();
      media.current?.stream.getTracks().forEach((t) => t.stop());
      media.current?.context.close();
      media.current = null;
    };
  }, [listen, endTurn]);

  const main = {
    listening: { label: "Send now", icon: "send", action: () => endTurn(false) },
    speaking: { label: "Interrupt and speak", icon: "mic", action: listen },
    paused: { label: "Start listening", icon: "mic", action: listen },
  }[phase];

  return (
    <div role="dialog" aria-modal="true" aria-label="Live voice chat" className="fixed inset-0 z-40 flex flex-col items-center justify-between bg-slate-950 p-6 text-white">
      <p className="text-sm text-slate-400">Live voice chat</p>
      <div className="flex min-h-0 w-full max-w-xl flex-col items-center gap-6">
        <div className={`grid h-32 w-32 shrink-0 place-items-center rounded-full bg-brand-600 ${phase === "listening" || phase === "speaking" ? "motion-safe:animate-pulse" : ""} ${phase === "paused" ? "opacity-50" : ""}`}>
          <Icon name={phase === "speaking" ? "volume" : "mic"} className="h-12 w-12" />
        </div>
        <p className="text-lg font-semibold" aria-live="polite">{LABELS[phase]}</p>
        {error && <p role="alert" className="text-center text-sm text-red-300">{error}</p>}
        <p className="min-h-0 overflow-y-auto whitespace-pre-wrap text-center text-slate-300">{caption}</p>
      </div>
      <div className="flex gap-3">
        {main && media.current && (
          <button className="btn-primary flex items-center gap-2" onClick={main.action}>
            <Icon name={main.icon} /> {main.label}
          </button>
        )}
        <button className="rounded-xl bg-red-600 px-4 py-2.5 font-semibold hover:bg-red-700" onClick={onClose}>End</button>
      </div>
    </div>
  );
}
