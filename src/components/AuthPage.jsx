import { useState } from "react";
import { api } from "../lib/api";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const registering = mode === "register";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api[mode]({ username: username.trim(), password });
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-brand-700 to-brand-400 p-4">
      <div className="grid w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 md:grid-cols-2">
        <section className="flex flex-col justify-center bg-brand-700 p-8 text-white md:p-10">
          <img src="/favicon.svg" alt="" className="mb-4 h-12 w-12 rounded-xl ring-1 ring-white/30" />
          <h1 className="text-3xl font-bold">LocoMan</h1>
          <p className="mt-2 text-brand-100">Your AI travel guide. Type or talk, in English, Hindi or Hinglish.</p>
          <ul className="mt-6 hidden space-y-2 text-sm text-brand-50 md:block">
            <li>Day-by-day itineraries</li>
            <li>Local food and budget tips</li>
            <li>Saved chats you can return to</li>
          </ul>
        </section>
        <section className="p-8 md:p-10">
          <h2 className="mb-6 text-2xl font-bold">{registering ? "Create account" : "Welcome back"}</h2>
          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-sm font-medium">
              Username or email
              <input className="field mt-1" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required minLength={registering ? 3 : undefined} maxLength={64} />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input className="field mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={registering ? "new-password" : "current-password"} required minLength={registering ? 8 : undefined} />
              {registering && <span className="mt-1 block text-xs font-normal text-slate-500">At least 8 characters</span>}
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Please wait..." : registering ? "Create account" : "Log in"}
            </button>
          </form>
          <button
            className="mt-4 text-sm text-brand-600 hover:underline"
            onClick={() => {
              setMode(registering ? "login" : "register");
              setError("");
            }}
          >
            {registering ? "Already have an account? Log in" : "New here? Create an account"}
          </button>
        </section>
      </div>
    </div>
  );
}
