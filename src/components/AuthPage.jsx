import { useState } from "react";

// const API_BASE = `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}`;

const API_BASE = import.meta.env.VITE_API_URL;


export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle form submit for login/register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/${mode === "login" ? "login" : "register"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username: email, password }),
        }
      );
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server error: Invalid response");
      }
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-400">
      <div className="bg-white rounded-3xl shadow-2xl flex w-[800px] max-w-full overflow-hidden">
        {/* Left Side */}
        <div className="flex-1 bg-gradient-to-b from-blue-600 to-blue-400 flex flex-col justify-center items-center p-10 text-white">
          <h1 className="text-3xl font-bold mb-2">L0c0 M🚶🏼‍♂️N</h1>
          <p className="mb-6">The most popular Travel guide</p>
          {/* <button className="bg-blue-300 hover:bg-blue-200 text-blue-900 font-semibold px-6 py-2 rounded-full transition">Read More</button> */}
        </div>
        {/* Right Side */}
        <div className="flex-1 bg-gray-50 flex flex-col justify-center items-center p-10">
          <h2 className="text-2xl font-bold mb-1">{mode === "login" ? "Hello Again!" : "Create Account"}</h2>
          <p className="mb-6 text-gray-500">{mode === "login" ? "Welcome Back" : "Sign up to get started"}</p>
          <form className="w-full max-w-xs space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="text"
                className="w-full px-10 py-3 rounded-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" fill="none" stroke="currentColor"><path d="M2 4l7 5 7-5" /><rect x="2" y="4" width="14" height="10" rx="2" /></svg>
              </span>
            </div>
            <div className="relative">
              <input
                type="password"
                className="w-full px-10 py-3 rounded-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" fill="none" stroke="currentColor"><circle cx="9" cy="7" r="4" /><path d="M2 16c1.5-2.5 4.5-4 7-4s5.5 1.5 7 4" /></svg>
              </span>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition"
              disabled={loading}
            >
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
            </button>
          </form>
          <button
            className="mt-4 text-blue-600 hover:underline"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
          {mode === "login" && (
            <button className="mt-2 text-gray-400 text-sm hover:underline">Forgot Password</button>
          )}
        </div>
      </div>
    </div>
  );
}