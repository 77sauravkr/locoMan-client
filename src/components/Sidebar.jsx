export default function Sidebar({ chats, onSelect, dark, onNewChat, activeChatId }) {
  return (
    <div className={`w-[320px] ${dark ? "bg-gray-900" : "bg-white"} p-6 flex flex-col gap-6 border-r shadow-lg h-full`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <span className="inline-block w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-extrabold">🤖</span>
         <span className="text-green-500 text-base ml-2">● Online</span>
        </h2>
        <button
          className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
          onClick={onNewChat}
          title="New Chat"
        >
          + New Chat
        </button>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto pt-4">
        {chats.length === 0 ? (
          <div className="text-gray-400 text-center mt-8">No chats yet</div>
        ) : (
          chats.map(chat => (
            <button
              key={chat.chatId}
              className={`btn truncate ${activeChatId === chat.chatId ? "bg-blue-200" : ""}`}
              onClick={() => onSelect(chat.chatId)}
            >
              {chat.title}
            </button>
          ))
        )}
      </div>
    </div>
  );
}