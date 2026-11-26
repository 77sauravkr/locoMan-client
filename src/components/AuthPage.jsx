import { useState } from "react";
import GoogleButton from "./GoogleButton";
import { api } from "../lib/api";
import { navigate } from "../lib/router";

const TITLES = { login: "Welcome back", register: "Create account", reset: "Reset password" };

export default function AuthPage({ onAuth, joining }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fresh = mode !== "login";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const name = username.trim();
      const data =
        mode === "reset"
          ? await api.reset({ username: name, recoveryCode: code, newPassword: password })
          : await api[mode]({ username: name, password });
      onAuth(data.user, data.recoveryCode);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const go = (next) => {
    setMode(next);
    setError("");
    setPassword("");
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-brand-700 to-brand-400 p-4">
      <div className="grid w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 md:grid-cols-2">
        <section className="flex flex-col justify-center bg-brand-700 p-8 text-white md:p-10">
          <img src="/favicon.svg" alt="" className="mb-4 h-12 w-12 rounded-xl ring-1 ring-white/30" />
          <h1 className="text-3xl font-bold">LocoMan</h1>
          <p className="mt-2 text-brand-100">Your AI travel guide. Type or talk, in English, Hindi or Hinglish.</p>
          <ul className="mt-6 hidden space-y-2 text-sm text-brand-50 md:block">
            <li>Day-by-day trip plans on a map</li>
            <li>Plan with friends and split costs</li>
            <li>Ask with a photo or your voice</li>
          </ul>
        </section>
        <section className="p-8 md:p-10">
          <h2 className="mb-6 text-2xl font-bold">{TITLES[mode]}</h2>
          {joining && <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-slate-800 dark:text-brand-100">Log in or create an account to join the trip.</p>}
          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-sm font-medium">
              Username or email
              <input className="field mt-1" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required minLength={mode === "register" ? 3 : undefined} maxLength={64} />
            </label>
            {mode === "reset" && (
              <label className="block text-sm font-medium">
                Recovery code
                <input className="field mt-1 font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" required />
              </label>
            )}
            <label className="block text-sm font-medium">
              {mode === "reset" ? "New password" : "Password"}
              <input className="field mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={fresh ? "new-password" : "current-password"} required minLength={fresh ? 8 : undefined} />
              {fresh && <span className="mt-1 block text-xs font-normal text-slate-500">At least 8 characters</span>}
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Log in" : mode === "register" ? "Create account" : "Reset password"}
            </button>
          </form>
          <GoogleButton onAuth={onAuth} onError={setError} />
          <div className="mt-4 flex flex-col items-start gap-2 text-sm">
            <button className="text-brand-600 hover:underline" onClick={() => go(mode === "register" ? "login" : "register")}>
              {mode === "register" ? "Already have an account? Log in" : "New here? Create an account"}
            </button>
            <button className="text-slate-500 hover:underline" onClick={() => go(mode === "reset" ? "login" : "reset")}>
              {mode === "reset" ? "Back to log in" : "Forgot password?"}
            </button>
            <button className="text-slate-500 hover:underline" onClick={() => navigate("/privacy")}>Privacy</button>
          </div>
        </section>
      </div>
    </div>
  );
}
