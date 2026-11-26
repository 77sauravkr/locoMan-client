import { useEffect, useRef, useState } from "react";

const TYPES = ["audio/webm", "audio/mp4", "audio/ogg"];
const MAX_MS = 2 * 60 * 1000;

export function useRecorder({ onRecorded, onError }) {
  const [recording, setRecording] = useState(false);
  const current = useRef(null);
  const mounted = useRef(true);

  // Leaving the screen discards the recording and releases the microphone.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const rec = current.current;
      if (rec) {
        rec.onstop = null;
        if (rec.state !== "inactive") rec.stop();
        rec.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const start = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      return onError("Voice recording is not supported in this browser.");
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return onError("Microphone access was blocked. Allow it in your browser settings.");
    }
    if (!mounted.current) return stream.getTracks().forEach((t) => t.stop());

    const mimeType = TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];
    const timer = setTimeout(() => rec.state === "recording" && rec.stop(), MAX_MS);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      clearTimeout(timer);
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      // Drop codec parameters so the server sees a plain MIME type.
      const type = (rec.mimeType || mimeType || "audio/webm").split(";")[0];
      onRecorded(new Blob(chunks, { type }));
    };
    current.current = rec;
    rec.start();
    setRecording(true);
  };

  const stop = () => current.current?.state === "recording" && current.current.stop();

  return { recording, toggle: () => (recording ? stop() : start()) };
}
