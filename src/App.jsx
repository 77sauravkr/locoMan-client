import { useCallback, useEffect, useState } from "react";
import AuthPage from "./components/AuthPage";
import Sidebar from "./components/Sidebar";
import ChatScreen from "./components/ChatScreen";
import Trips from "./components/Trips";
import Discover from "./components/Discover";
import PublicTrip from "./components/PublicTrip";
import { wallet } from "./lib/wallet";
import TripPage from "./components/TripPage";
import Account from "./components/Account";
import Privacy from "./components/Privacy";
import RecoveryCode from "./components/RecoveryCode";
import Icon from "./components/Icon";
import { useTheme } from "./hooks/useTheme";
import { api } from "./lib/api";
import { offline } from "./lib/offline";
import { navigate, usePath } from "./lib/router";

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function App() {
  const path = usePath();
  const [status, setStatus] = useState("checking"); // checking | ready | offline | unreachable
  const [user, setUser] = useState(null);
  const [dark, toggleTheme] = useTheme();
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(newId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");

  const [, section, param] = path.split("/");
  const isOffline = status === "offline";

  const signedIn = useCallback((next, code) => {
    offline.clear();
    offline.saveUser(next);
    setUser(next);
    setStatus("ready");
    if (code) setRecoveryCode(code);
  }, []);

  const checkSession = useCallback(() => {
    setStatus("checking");
    api.me().then(
      (data) => {
        setUser(data.user);
        offline.saveUser(data.user);
        setStatus("ready");
      },
      (err) => {
        if (err.status === 401) {
          offline.clear();
          return setStatus("ready");
        }
        // Without a connection, saved trips can still be read.
        const saved = err.status === 0 && offline.user();
        if (saved) {
          setUser(saved);
          setStatus("offline");
          if (!/^\/(trips|t\/)/.test(window.location.pathname)) navigate("/trips", { replace: true });
        } else setStatus("unreachable");
      },
    );
  }, []);

  useEffect(checkSession, [checkSession]);

  useEffect(() => {
    if (!isOffline) return;
    window.addEventListener("online", checkSession);
    return () => window.removeEventListener("online", checkSession);
  }, [isOffline, checkSession]);

  const reset = useCallback(() => {
    window.speechSynthesis?.cancel();
    offline.clear();
    setUser(null);
    setChats([]);
    setActiveId(newId());
    setMenuOpen(false);
    setNotice("");
    setRecoveryCode("");
  }, []);

  useEffect(() => {
    window.addEventListener("session-expired", reset);
    return () => window.removeEventListener("session-expired", reset);
  }, [reset]);

  // An invite link joins as soon as someone is signed in.
  useEffect(() => {
    if (!user || section !== "join" || isOffline) return;
    api.joinTrip(param).then(
      (d) => navigate(`/trips/${d.id}`, { replace: true }),
      (err) => {
        setNotice(err.message);
        navigate("/trips", { replace: true });
      },
    );
  }, [user, section, param, isOffline]);

  const userName = user?.username;
  useEffect(() => {
    if (!userName || isOffline) return;
    api
      .listChats()
      // Keep any chat started while the list was loading.
      .then((data) =>
        setChats((prev) => [...prev, ...data.chats.filter((c) => !prev.some((p) => p.chatId === c.chatId))]),
      )
      .catch((err) => setNotice(err.message));
  }, [userName, isOffline]);

  const go = (to) => {
    setMenuOpen(false);
    navigate(to);
  };
  const select = (id) => {
    setActiveId(id);
    go("/");
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
    dropChat(chatId);
    if (chatId === activeId) setActiveId(newId());
  };

  const logout = async () => {
    try {
      await api.logout();
      await wallet.clear();
      reset();
      navigate("/", { replace: true });
    } catch (err) {
      setNotice(err.message);
    }
  };

  // Shared plans open without an account.
  if (section === "t") return <PublicTrip token={param} />;

  if (status === "checking") {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center text-slate-500">
        <div>
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
          <p>Connecting to LocoMan...</p>
        </div>
      </div>
    );
  }
  if (status === "unreachable") {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="mb-4">The server is not responding.</p>
          <button className="btn-primary" onClick={checkSession}>Try again</button>
        </div>
      </div>
    );
  }
  if (!user) {
    if (section === "privacy") {
      return (
        <div className="min-h-dvh">
          <button className="m-4 text-brand-600 hover:underline" onClick={() => navigate("/")}>← Back</button>
          <Privacy />
        </div>
      );
    }
    return <AuthPage onAuth={signedIn} joining={section === "join"} />;
  }

  const chatTitle = chats.find((c) => c.chatId === activeId)?.title || "New chat";
  const title = { discover: "Discover", trips: "My trips", account: "Account", privacy: "Privacy", join: "Joining trip..." }[section] || chatTitle;

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        chats={chats}
        activeId={section ? null : activeId}
        section={section}
        open={menuOpen}
        user={user}
        onClose={() => setMenuOpen(false)}
        onNavigate={go}
        onSelect={select}
        onNew={() => select(newId())}
        onRename={rename}
        onDelete={remove}
        onLogout={logout}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          <button className="icon-btn md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <h1 className="min-w-0 flex-1 truncate font-semibold">{title}</h1>
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
        {!section ? (
          <ChatScreen key={activeId} chatId={activeId} onChat={upsertChat} onChatFailed={dropChat} />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {section === "trips" && (param ? <TripPage key={param} id={param} userId={user._id} isOffline={isOffline} /> : <Trips isOffline={isOffline} />)}
            {section === "discover" && !isOffline && <Discover />}
            {section === "account" && !isOffline && <Account user={user} onUser={setUser} onDeleted={() => { wallet.clear(); reset(); navigate("/", { replace: true }); }} />}
            {section === "privacy" && <Privacy />}
          </div>
        )}
      </main>
      {recoveryCode && <RecoveryCode code={recoveryCode} onClose={() => setRecoveryCode("")} />}
    </div>
  );
}
