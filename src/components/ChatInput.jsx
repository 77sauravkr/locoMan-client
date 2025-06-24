/**
 * Chat input area: mic, text input, send button.
 */
export default function ChatInput({ input, setInput, handleSend, handleMicClick, loading, recording }) {
  return (
    <div className="p-3 bg-white dark:bg-gray-800 flex items-center gap-2 rounded-2xl shadow-lg mx-2 mb-4">
      <button
        className={`text-2xl px-3 py-2 rounded-full ${recording ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-600 hover:bg-blue-100"}`}
        onClick={handleMicClick}
        disabled={loading}
        title={recording ? "Stop recording" : "Record voice"}
      >
        <span role="img" aria-label="mic">{recording ? "🎙️" : "🎤"}</span>
      </button>
      <input
        type="text"
        placeholder="Write your message"
        className="flex-1 outline-none px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-base"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSend()}
        disabled={loading || recording}
      />
      <button
        className="text-white bg-blue-600 font-bold text-2xl px-4 py-2 rounded-full hover:bg-blue-700 transition"
        onClick={handleSend}
        disabled={loading || recording}
      >
        ➤
      </button>
    </div>
  );
}