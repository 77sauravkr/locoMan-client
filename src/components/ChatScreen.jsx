import { useState, useRef, useEffect } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import LoadingSpinner from "./LoadingSpinner";

// API config
// const API_BASE = `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}`;

const API_BASE = import.meta.env.VITE_API_URL;

const SUPPORTED_FORMAT = "webm";
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Main chat screen component.
 * Handles chat history, sending/receiving messages, audio recording, and TTS.
 */
export default function ChatScreen({ chatId, dark, addToHistory, session, chatKey }) {
  // State for messages, input, loading, recording, error
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);

  // Refs for media and chat scroll
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatContainerRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Load chat history when chatId changes
  useEffect(() => {
    if (!chatId) return;
    fetch(`${API_BASE}/load-chat?chatId=${chatId}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setMessages(data.messages || []));
  }, [chatId]);

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0 && chatId) {
      fetch(`${API_BASE}/save-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chatId, messages, title: messages[0]?.text || "New Chat" })
      });
    }
  }, [messages, chatId]);

  // Clear messages when a new chat is started
  useEffect(() => {
    // Clean up blob URLs when messages are cleared
    messages.forEach(msg => {
      if (msg.audio && msg.audio.startsWith("blob:")) {
        URL.revokeObjectURL(msg.audio);
      }
    });
    setMessages([]);
  }, [chatKey]);

  // Stop audio and TTS on unmount (refresh or chat change)
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      document.querySelectorAll("audio").forEach(a => a.pause());
    };
  }, []);

  // Speak text using browser's SpeechSynthesis API
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    window.speechSynthesis.speak(utter);
  };

  // Send text message to backend
  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = {
      id: `${Date.now()}-${Math.random()}`, // Always unique!
      role: "user",
      text: input,
      audio: null,
      createdAt: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput(""); // clear input
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/text-query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify({ query: input })
      });
      const data = await res.json();
      const botMsg = {
        id: `${Date.now()}-${Math.random()}`,
        role: "bot",
        text: data.answer || data.error || "No response",
        audio: null,
        createdAt: Date.now()
      };
      setMessages((msgs) => [...msgs, botMsg]);
      addToHistory(input, false); // Update sidebar history
      if (botMsg.text && !botMsg.audio) speakText(botMsg.text);
    } catch (e) {
      setError("Error contacting server.");
      setMessages(msgs => [
        ...msgs,
        {
          id: `${Date.now()}-${Math.random()}`, // <-- Add this!
          role: "bot",
          text: "Error contacting server.",
          audio: null
        }
      ]);
    }
    setLoading(false);
  };

  // Start or stop audio recording
  const handleMicClick = async () => {
    if (recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    } else {
      if (!navigator.mediaDevices) {
        alert("Audio recording not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream, { mimeType: `audio/${SUPPORTED_FORMAT}` });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: `audio/${SUPPORTED_FORMAT}` });
        await sendAudio(audioBlob);
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
    }
  };

  // Send recorded audio to backend and handle response
  const sendAudio = async (audioBlob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, `recording.${SUPPORTED_FORMAT}`);

    try {
      const res = await fetch(`${API_BASE}/audio-travel-query`, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY
        },
        body: formData
      });
      const data = await res.json();
      const transcribedText = data.query || "[Voice message sent]";
      addToHistory(transcribedText, true);
      setMessages(msgs => [
        ...msgs,
        {
          id: `${Date.now()}-${Math.random()}`,
          role: "user",
          text: transcribedText,
          audio: URL.createObjectURL(audioBlob),
          createdAt: Date.now()
        },
        {
          id: `${Date.now()}-${Math.random()}`,
          role: "bot",
          text: data.answer || data.error || "No response",
          audio: data.audio_url,
          createdAt: Date.now()
        }
      ]);
      if (data.answer && !data.audio_url) speakText(data.answer);
      if (data.audio_url) playAudio(data.audio_url, data.answer);
    } catch (e) {
      setError("Error contacting server.");
      setMessages(msgs => [
        ...msgs,
        {
          id: `${Date.now()}-${Math.random()}`, // <-- Make sure this is present!
          role: "bot",
          text: "Error contacting server.",
          audio: null
        }
      ]);
    }
    setLoading(false);
  };

  // Play audio from URL or fallback to TTS
  const playAudio = (url, fallbackText) => {
    if (url) {
      const audio = new Audio(url);
      audio.play();
    } else if (fallbackText) {
      speakText(fallbackText);
    }
  };

  // Pass messages, loading, error, input, handlers as props
  return (
    <div className={`flex-1 flex flex-col h-full w-full ${dark ? "dark" : ""}`}>
      <div className="flex-1 min-h-0 flex flex-col justify-between bg-white dark:bg-gray-900 h-full w-full pt-0 transition-colors duration-300">
        <ChatMessages
          messages={messages}
          loading={loading}
          chatContainerRef={chatContainerRef}
        />
        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          handleMicClick={handleMicClick}
          loading={loading}
          recording={recording}
        />
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-2">
            {error}
            <button className="ml-2 text-red-500" onClick={() => setError(null)}>✖</button>
          </div>
        )}
      </div>
    </div>
  );
}