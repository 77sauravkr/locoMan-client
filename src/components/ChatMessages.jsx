import UserMessage from "./UserMessage";
import BotMessage from "./BotMessage";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Renders all chat messages and loading spinner.
 */
export default function ChatMessages({ messages, loading, chatContainerRef }) {
  return (
    <div
      ref={chatContainerRef}
      className="flex-1 min-h-0 overflow-y-auto px-2 py-4 flex flex-col gap-4 pb-24"
    >
      {messages.map((msg) =>
        msg.role === "user" ? (
          <UserMessage
            key={msg.id}
            text={msg.text}
            audio={msg.audio}
          />
        ) : (
          <BotMessage
            key={msg.id}
            text={msg.text}
            audio={msg.audio}
          />
        )
      )}
      {loading && <LoadingSpinner />}
    </div>
  );
}