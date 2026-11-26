import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { offline } from "../lib/offline";
import { navigate } from "../lib/router";

export default function Trips({ isOffline }) {
  const [trips, setTrips] = useState(() => (isOffline ? offline.trips() : null));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  // Set when the user comes from a chat reply.
  const [notes] = useState(() => window.history.state?.notes || "");
  const [prefill] = useState(() => window.history.state?.destination || "");

  useEffect(() => {
    if (isOffline) return;
    api.listTrips().then((d) => {
      setTrips(d.trips);
      offline.saveTrips(d.trips);
    }, (err) => {
      setTrips(offline.trips());
      setError(err.message);
    });
  }, [isOffline]);

  const submit = async (e) => {
    e.preventDefault();
    const ai = e.nativeEvent.submitter?.value !== "blank";
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setError("");
    setBusy(ai ? "ai" : "blank");
    try {
      const { trip } = ai
        ? await api.generateTrip({ ...values, days: Number(values.days), notes })
        : await api.createTrip(values);
      navigate(`/trips/${trip.id}`);
    } catch (err) {
      setError(err.message);
      setBusy("");
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      {!isOffline && (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <h2 className="font-semibold">New trip</h2>
          {notes && <p className="text-sm text-brand-600">The plan will follow your chat. Fill in the destination.</p>}
          <input className="field" name="destination" defaultValue={prefill} placeholder="Where to? e.g. Jaipur" required maxLength={100} aria-label="Destination" />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Start date<input className="field mt-1" type="date" name="startDate" /></label>
            <label className="text-sm">Days<input className="field mt-1" type="number" name="days" min={1} max={14} defaultValue={3} required /></label>
            <label className="text-sm">Budget<input className="field mt-1" name="budget" placeholder="₹10,000" maxLength={60} /></label>
          </div>
          <input className="field" name="interests" placeholder="Interests: forts, food, nature..." maxLength={300} aria-label="Interests" />
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" value="ai" disabled={Boolean(busy)}>{busy === "ai" ? "Planning... (up to a minute)" : "Plan with AI"}</button>
            <button className="chip" value="blank" disabled={Boolean(busy)}>Start empty</button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <section>
        <h2 className="mb-2 font-semibold">Saved trips</h2>
        {trips === null && <p className="animate-pulse text-slate-500">Loading...</p>}
        {trips?.length === 0 && <p className="text-sm text-slate-500">No trips yet.</p>}
        <ul className="space-y-2">
          {trips?.map((t) => (
            <li key={t.id}>
              <button className="w-full rounded-xl border border-slate-200 p-3 text-left hover:border-brand-500 dark:border-slate-800" onClick={() => navigate(`/trips/${t.id}`)}>
                <span className="block font-medium">{t.title}</span>
                <span className="text-sm text-slate-500">{[t.destination, t.startDate, t.role === "member" && "shared with you"].filter(Boolean).join(" · ")}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
