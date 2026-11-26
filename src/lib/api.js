import { parseSse } from "./sse";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function send(path, { json, ...options } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      ...(json && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) }),
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError("Cannot reach the server. Check your connection.", 0);
  }
  if (res.ok) return res;
  const data = await res.json().catch(() => ({}));
  // Login failures also return 401, so only other routes mean the session ended.
  const publicAuth = ["/auth/login", "/auth/register", "/auth/reset", "/auth/google", "/auth/me"].includes(path);
  if (res.status === 401 && !publicAuth) window.dispatchEvent(new Event("session-expired"));
  throw new ApiError(data.error || "Server is unavailable. Please try again.", res.status);
}

const json = async (path, options) => (await send(path, options)).json();
const chatPath = (id) => `/chats/${encodeURIComponent(id)}`;
const tripPath = (id) => `/trips/${encodeURIComponent(id)}`;

export const api = {
  me: () => json("/auth/me"),
  login: (body) => json("/auth/login", { method: "POST", json: body }),
  register: (body) => json("/auth/register", { method: "POST", json: body }),
  logout: () => json("/auth/logout", { method: "POST" }),
  config: () => json("/config"),
  reset: (body) => json("/auth/reset", { method: "POST", json: body }),
  google: (credential) => json("/auth/google", { method: "POST", json: { credential } }),
  changePassword: (body) => json("/auth/password", { method: "POST", json: body }),
  newRecoveryCode: (password) => json("/auth/recovery-code", { method: "POST", json: { password } }),
  deleteAccount: (body) => json("/auth/account", { method: "DELETE", json: body }),
  listTrips: () => json("/trips"),
  createTrip: (body) => json("/trips", { method: "POST", json: body }),
  generateTrip: (body) => json("/trips/generate", { method: "POST", json: body }),
  getTrip: (id) => json(tripPath(id)),
  saveTrip: (id, body) => json(tripPath(id), { method: "PATCH", json: body }),
  deleteTrip: (id) => json(tripPath(id), { method: "DELETE" }),
  joinTrip: (token) => json("/trips/join", { method: "POST", json: { token } }),
  createInvite: (id) => json(`${tripPath(id)}/invite`, { method: "POST" }),
  removeInvite: (id) => json(`${tripPath(id)}/invite`, { method: "DELETE" }),
  removeMember: (id, userId) => json(`${tripPath(id)}/members/${encodeURIComponent(userId)}`, { method: "DELETE" }),
  addExpense: (id, body) => json(`${tripPath(id)}/expenses`, { method: "POST", json: body }),
  removeExpense: (id, expenseId) => json(`${tripPath(id)}/expenses/${encodeURIComponent(expenseId)}`, { method: "DELETE" }),
  weather: (place) => json(`/places/weather?q=${encodeURIComponent(place)}`),
  locate: (place) => json(`/places/locate?q=${encodeURIComponent(place)}`),
  listChats: () => json("/chats"),
  loadChat: (id, signal) => json(chatPath(id), { signal }),
  renameChat: (id, title) => json(chatPath(id), { method: "PATCH", json: { title } }),
  deleteChat: (id) => json(chatPath(id), { method: "DELETE" }),
  sendVoice(id, blob, signal) {
    const body = new FormData();
    body.append("audio", blob, "voice");
    return json(`${chatPath(id)}/voice`, { method: "POST", body, signal });
  },
  async streamMessage(id, body, { signal, onDelta }) {
    const res = await send(`${chatPath(id)}/messages`, { method: "POST", json: body, signal });
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      const parsed = parseSse(buffer + value);
      buffer = parsed.rest;
      for (const event of parsed.events) {
        if (event.error) throw new ApiError(event.error, 502);
        if (event.done) return event;
        onDelta(event.delta);
      }
    }
    throw new ApiError("The reply was interrupted. Please try again.", 0);
  },
};
