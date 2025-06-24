import { useState, useEffect } from "react";
import AuthPage from "./components/AuthPage";
import Sidebar from "./components/Sidebar";
import ChatScreen from "./components/ChatScreen";

// API base URL from environment variables
// const API_BASE = `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}`;

const API_BASE = import.meta.env.VITE_API_URL;


export default function App() {
  // User authentication state
  const [user, setUser] = useState(null);

  // Dark mode toggle state
  const [dark, setDark] = useState(false);

  // All chats for the logged-in user
  const [chats, setChats] = useState([]);

  // Currently active chat's ID
  const [activeChatId, setActiveChatId] = useState(null);

  // Unique session ID for the user (for tracking, analytics, etc.)
  const [session] = useState(() => {
    let s = localStorage.getItem("session_id");
    if (!s) {
      s = Math.random().toString(36).slice(2);
      localStorage.setItem("session_id", s);
    }
    return s;
  });

  // Fetch user info on mount (to check if logged in)
  useEffect(() => {
    fetch(`${API_BASE}/me`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  // Fetch all chats for the user whenever user logs in/changes
  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/list-chats`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setChats(data.chats || []);
        // Set the first chat as active by default
        if (data.chats && data.chats.length > 0) setActiveChatId(data.chats[0].chatId);
      });
  }, [user]);

  // Handler for creating a new chat
  const handleNewChat = () => {
    const newId = Date.now().toString();
    setChats(prev => [...prev, { chatId: newId, title: "New Chat" }]);
    setActiveChatId(newId);
    // Optionally: You can also create an empty chat in the backend here
  };

  // Handler for logging out the user
  const handleLogout = async () => {
    await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include"
    });
    setUser(null);
    setChats([]);
    setActiveChatId(null);
  };

  // Update chat title in sidebar when a new message is sent
  const addToHistory = (text, isVoice) => {
    setChats(prev =>
      prev.map(chat =>
        chat.chatId === activeChatId && text
          ? {
              ...chat,
              title:
                prev.find(c => c.chatId === activeChatId)?.title === "New Chat"
                  ? text
                  : prev.find(c => c.chatId === activeChatId)?.title || text
            }
          : chat
      )
    );
  };

  // If not logged in, show the authentication page
  if (!user) return <AuthPage onAuth={setUser} />;

  return (
    <div className={`flex flex-col h-screen font-sans bg-white dark:bg-gray-900 text-black dark:text-white`}>
      {/* Top navigation bar */}
      <nav className="w-full flex items-center justify-between px-6 py-3 bg-gray-100 dark:bg-gray-800 shadow z-10">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="inline-block w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-extrabold">🤖</span>
          <span className="text-blue-600">Loco-Man</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Dark mode toggle button */}
          <button
            className="bg-gray-200 dark:bg-gray-700 rounded-full px-4 py-2 shadow"
            onClick={() => setDark(d => !d)}
            title="Toggle dark mode"
          >
            {dark ? "🌙" : "☀️"}
          </button>
          {/* Logout button */}
          <button
            className="bg-red-200 dark:bg-red-700 rounded-full px-4 py-2 shadow text-red-700 dark:text-white font-semibold"
            onClick={handleLogout}
            title="Logout"
          >
            Logout
          </button>
        </div>
      </nav>
      {/* Main content area: Sidebar + Chat */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar with chat list */}
        <Sidebar
          chats={chats}
          onSelect={setActiveChatId}
          dark={dark}
          onNewChat={handleNewChat}
          activeChatId={activeChatId}
        />
        {/* Chat screen for the selected chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatScreen
            key={activeChatId} // Remounts ChatScreen on chat change
            chatId={activeChatId}
            dark={dark}
            addToHistory={addToHistory}
            session={session}
            chatKey={activeChatId}
          />
        </div>
      </div>
    </div>
  );
}
