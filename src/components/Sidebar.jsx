import { useState } from "react";
import Icon from "./Icon";

function ChatRow({ chat, active, onSelect, onRename, onDelete }) {
  const [mode, setMode] = useState("view"); // view | edit | confirm
  const [title, setTitle] = useState(chat.title);

  if (mode === "edit") {
    const save = (e) => {
      e.preventDefault();
      if (title.trim()) onRename(chat.chatId, title.trim());
      setMode("view");
    };
    return (
      <form onSubmit={save} className="flex gap-1">
        <input className="field !py-1.5 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setMode("view")} maxLength={60} aria-label="Chat title" autoFocus />
        <button className="icon-btn !h-9 !w-9" aria-label="Save title"><Icon name="check" className="h-4 w-4" /></button>
      </form>
    );
  }

  if (mode === "confirm") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-1.5 text-sm dark:bg-red-950">
        <span className="flex-1">Delete this chat?</span>
        <button className="font-semibold text-red-600" onClick={() => onDelete(chat.chatId)}>Delete</button>
        <button onClick={() => setMode("view")}>Cancel</button>
      </div>
    );
  }

  return (
    <div className={`group flex items-center rounded-xl ${active ? "bg-brand-100 dark:bg-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-800/60"}`}>
      <button className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm" onClick={() => onSelect(chat.chatId)} aria-current={active ? "true" : undefined}>
        {chat.title}
      </button>
      <div className={`flex ${active ? "" : "md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100"}`}>
        <button className="icon-btn !h-8 !w-8" onClick={() => { setTitle(chat.title); setMode("edit"); }} aria-label={`Rename ${chat.title}`}>
          <Icon name="edit" className="h-4 w-4" />
        </button>
        <button className="icon-btn !h-8 !w-8" onClick={() => setMode("confirm")} aria-label={`Delete ${chat.title}`}>
          <Icon name="trash" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const LINKS = [
  { path: "/", section: "", label: "Chat", icon: "chat" },
  { path: "/trips", section: "trips", label: "My trips", icon: "map" },
  { path: "/account", section: "account", label: "Account", icon: "user" },
];

export default function Sidebar({ chats, activeId, section = "", open, user, onClose, onNavigate, onSelect, onNew, onRename, onDelete, onLogout }) {
  const [query, setQuery] = useState("");
  const shown = chats.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={onClose} aria-hidden="true" />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-slate-50 transition dark:border-slate-800 dark:bg-slate-900 md:visible md:static md:translate-x-0 ${open ? "visible translate-x-0" : "invisible -translate-x-full"}`}>
        <div className="flex items-center gap-2 p-3">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          <span className="flex-1 text-lg font-bold">LocoMan</span>
          <button className="icon-btn md:hidden" onClick={onClose} aria-label="Close menu"><Icon name="close" /></button>
        </div>
        <div className="space-y-1 px-3 pb-3">
          {LINKS.map((link) => (
            <button key={link.path} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${section === link.section ? "bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-100" : "hover:bg-slate-100 dark:hover:bg-slate-800/60"}`} onClick={() => onNavigate(link.path)}>
              <Icon name={link.icon} className="h-4 w-4" /> {link.label}
            </button>
          ))}
        </div>
        <div className="px-3">
          <button className="btn-primary flex w-full items-center justify-center gap-2" onClick={onNew}>
            <Icon name="plus" /> New chat
          </button>
        </div>
        {chats.length > 0 && (
          <div className="px-3 pt-3">
            <input type="search" className="field !py-2 text-sm" placeholder="Search chats" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search chats" />
          </div>
        )}
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3" aria-label="Your chats">
          {chats.length === 0 && <p className="mt-6 text-center text-sm text-slate-500">No chats yet</p>}
          {chats.length > 0 && shown.length === 0 && <p className="mt-6 text-center text-sm text-slate-500">No match</p>}
          {shown.map((chat) => (
            <ChatRow key={chat.chatId} chat={chat} active={chat.chatId === activeId} onSelect={onSelect} onRename={onRename} onDelete={onDelete} />
          ))}
        </nav>
        <div className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
          <span className="min-w-0 flex-1 truncate text-sm">{user.username}</span>
          <button className="icon-btn" onClick={onLogout} aria-label="Log out"><Icon name="logout" /></button>
        </div>
      </aside>
    </>
  );
}
