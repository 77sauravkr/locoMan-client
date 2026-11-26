import { useState } from "react";
import { api } from "../lib/api";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const INTERESTS = ["Mountains", "Beaches", "History", "Food", "Adventure", "Spiritual", "Wildlife"];

export default function Discover() {
  const [ideas, setIdeas] = useState([]);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    try {
      const interests = [...picked, values.more].filter(Boolean).join(", ");
      setIdeas((await api.recommend({ ...values, days: Number(values.days), interests })).suggestions);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  const plan = (idea) => {
    window.history.pushState({ destination: idea.place, notes: `${idea.why}\nHighlights: ${idea.highlights.join(", ")}` }, "", "/trips");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold">Where should I go?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="field" name="from" placeholder="From (your city)" maxLength={80} aria-label="Starting city" />
          <input className="field" name="budget" placeholder="Budget, e.g. ₹15,000" maxLength={60} aria-label="Budget" />
          <input className="field" name="days" type="number" min={1} max={30} defaultValue={4} aria-label="Number of days" />
          <select className="field" name="month" defaultValue={MONTHS[new Date().getMonth()]} aria-label="Travel month">
            {MONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((name) => {
            const on = picked.includes(name);
            return (
              <button type="button" key={name} aria-pressed={on} className={`chip ${on ? "!border-brand-600 !bg-brand-600 !text-white" : ""}`} onClick={() => setPicked(on ? picked.filter((p) => p !== name) : [...picked, name])}>{name}</button>
            );
          })}
        </div>
        <input className="field" name="more" placeholder="Anything else? e.g. with parents, no long walks" maxLength={200} aria-label="Other wishes" />
        <button className="btn-primary" disabled={busy}>{busy ? "Finding places..." : "Suggest places"}</button>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>
      <ul className="space-y-3">
        {ideas.map((idea) => (
          <li key={idea.place} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="text-lg font-bold">{idea.place}</h3>
            <p className="text-sm text-slate-500">{[idea.cost, idea.bestTime && `Best: ${idea.bestTime}`].filter(Boolean).join(" · ")}</p>
            <p className="mt-2">{idea.why}</p>
            <ul className="mt-2 list-disc pl-5 text-sm">{idea.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
            <button className="btn-primary mt-3 !py-2" onClick={() => plan(idea)}>Plan this trip</button>
          </li>
        ))}
      </ul>
      {ideas.length > 0 && <p className="text-xs text-slate-500">Costs are rough AI estimates. Check real prices before booking.</p>}
    </div>
  );
}
