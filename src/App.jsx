import { useCallback, useEffect, useState } from "react";
import AuthPage from "./components/AuthPage";
import Sidebar from "./components/Sidebar";
import ChatScreen from "./components/ChatScreen";
import Icon from "./components/Icon";
import { useTheme } from "./hooks/useTheme";
import { api } from "./lib/api";

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function App() {
  const [status, setStatus] = useState("checking"); // checking | ready | offline
  const [user, setUser] = useState(null);
  const [dark, toggleTheme] = useTheme();
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(newId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const checkSession = useCallback(() => {
    setStatus("checking");
    api
      .me()
      .then((data) => {
        setUser(data.user);
        setStatus("ready");
      })
      .catch((err) => setStatus(err.status === 401 ? "ready" : "offline"));
  }, []);

  useEffect(checkSession, [checkSession]);

  const reset = useCallback(() => {
    window.speechSynthesis?.cancel();
    setUser(null);
    setChats([]);
    setActiveId(newId());
    setMenuOpen(false);
    setNotice("");
  }, []);

  useEffect(() => {
    window.addEventListener("session-expired", reset);
    return () => window.removeEventListener("session-expired", reset);
  }, [reset]);

  useEffect(() => {
    if (!user) return;
    api
      .listChats()
      // Keep any chat started while the list was loading.
      .then((data) =>
        setChats((prev) => [...prev, ...data.chats.filter((c) => !prev.some((p) => p.chatId === c.chatId))]),
      )
      .catch((err) => setNotice(err.message));
  }, [user]);

  const select = (id) => {
    setActiveId(id);
    setMenuOpen(false);
  };

  // Adds or updates a chat and moves it to the top.
  const upsertChat = useCallback((chatId, title) => {
    setChats((prev) => {
      const old = prev.find((c) => c.chatId === chatId);
      return [{ chatId, title: title || old?.title || "New chat" }, ...prev.filter((c) => c !== old)];
    });
  }, []);

  const dropChat = useCallback((chatId) => {
    setChats((prev) => prev.filter((c) => c.chatId !== chatId));
  }, []);

  const rename = async (chatId, title) => {
    try {
      const data = await api.renameChat(chatId, title);
      setChats((prev) => prev.map((c) => (c.chatId === chatId ? { ...c, title: data.title } : c)));
    } catch (err) {
      setNotice(err.message);
    }
  };

  const remove = async (chatId) => {
    try {
      await api.deleteChat(chatId);
    } catch (err) {
      if (err.status !== 404) return setNotice(err.message);
    }
    setChats((prev) => prev.filter((c) => c.chatId !== chatId));
    if (chatId === activeId) setActiveId(newId());
  };

  const logout = async () => {
    try {
      await api.logout();
      reset();
    } catch (err) {
      setNotice(err.message);
    }
  };

  if (status === "checking") {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center text-slate-500">
        <div>
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
          <p>Connecting to LocoMan...</p>
          <p className="mt-1 text-sm">The first load can take up to a minute while the server wakes up.</p>
        </div>
      </div>
    );
  }
  if (status === "offline") {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="mb-4">The server is not responding.</p>
          <button className="btn-primary" onClick={checkSession}>Try again</button>
        </div>
      </div>
    );
  }
  if (!user) return <AuthPage onAuth={setUser} />;

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        chats={chats}
        activeId={activeId}
        open={menuOpen}
        user={user}
        onClose={() => setMenuOpen(false)}
        onSelect={select}
        onNew={() => select(newId())}
        onRename={rename}
        onDelete={remove}
        onLogout={logout}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          <button className="icon-btn md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open chat list">
            <Icon name="menu" />
          </button>
          <h1 className="min-w-0 flex-1 truncate font-semibold">
            {chats.find((c) => c.chatId === activeId)?.title || "New chat"}
          </h1>
          <button className="icon-btn" onClick={toggleTheme} aria-label={dark ? "Use light theme" : "Use dark theme"}>
            <Icon name={dark ? "sun" : "moon"} />
          </button>
        </header>
        {notice && (
          <div role="alert" className="flex items-center justify-between gap-3 bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Dismiss"><Icon name="close" /></button>
          </div>
        )}
        <ChatScreen key={activeId} chatId={activeId} onChat={upsertChat} onChatFailed={dropChat} />
      </main>
    </div>
  );
}
