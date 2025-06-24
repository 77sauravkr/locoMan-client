import { useState, useRef } from "react";

/**
 * Bot message bubble component.
 * Handles both audio playback and TTS controls.
 */
export default function BotMessage({ text, audio }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);

  // Play/Pause/Resume/Replay logic for audio and TTS
  const handlePlay = () => {
    if (audio) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      if (utteranceRef.current) window.speechSynthesis.cancel();
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.onend = () => setIsPlaying(false);
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audio) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  const handleResume = () => {
    if (audio) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    if (audio) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      window.speechSynthesis.cancel();
      handlePlay();
    }
  };

  return (
    <div className="self-start max-w-[80%] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-2xl rounded-bl-sm shadow flex items-center gap-2 text-base">
      <span>{text}</span>
      {audio ? (
        <>
          <audio ref={audioRef} src={audio} />
          <div className="flex flex-col gap-2 ml-2">
            <button onClick={handlePlay} title="Play">▶️</button>
            <button onClick={handlePause} title="Pause">⏸️</button>
            <button onClick={handleResume} title="Resume">⏯️</button>
            <button onClick={handleReplay} title="Replay">🔁</button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2 ml-2">
          <button onClick={handlePlay} title="Speak">🔊</button>
          <button onClick={handlePause} title="Pause">⏸️</button>
          <button onClick={handleResume} title="Resume">⏯️</button>
          <button onClick={handleReplay} title="Replay">🔁</button>
        </div>
      )}
    </div>
  );
}