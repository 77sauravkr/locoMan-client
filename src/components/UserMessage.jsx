import { useEffect, useRef } from "react";

/**
 * User message bubble component.
 * Shows user's text and optional audio playback.
 */
export default function UserMessage({ text, audio }) {
  const audioRef = useRef();

  useEffect(() => {
    const ref = audioRef.current;
    if (!audio || !ref) return;
    const handleEnded = () => {
      if (audio.startsWith("blob:")) {
        URL.revokeObjectURL(audio);
      }
    };
    ref.addEventListener("ended", handleEnded);
    return () => {
      ref.removeEventListener("ended", handleEnded);
    };
  }, [audio]);

  return (
    <div className="self-end max-w-[80%] bg-blue-600 text-white p-3 rounded-2xl rounded-br-sm shadow flex items-center gap-2 text-base">
      {text}
      {audio && <audio ref={audioRef} src={audio} controls />}
    </div>
  );
}