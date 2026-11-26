import { useState } from "react";
import Icon from "./Icon";
import { api } from "../lib/api";

export default function Packing({ trip, readOnly, onSave }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const items = trip.packing || [];
  const done = items.filter((i) => i.done).length;

  // One save at a time: each carries the version it started from.
  const save = async (packing) => {
    setBusy(true);
    const ok = await onSave({ packing });
    setBusy(false);
    return ok;
  };

  const suggest = async () => {
    setBusy(true);
    setError("");
    try {
      const { items: suggested } = await api.suggestPacking(trip.id);
      const have = new Set(items.map((i) => i.text.toLowerCase()));
      await onSave({ packing: [...items, ...suggested.filter((i) => !have.has(i.text.toLowerCase()))] });
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const text = new FormData(form).get("item").trim();
    if (text && (await save([...items, { text, done: false }]))) form.reset();
  };

  return (
    <div className="space-y-4">
      {items.length > 0 && <p className="text-sm text-slate-500">{done} of {items.length} packed</p>}
      {!readOnly && <button className="btn-primary !py-2" onClick={suggest} disabled={busy}>{busy ? "Please wait..." : "Suggest with AI"}</button>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center gap-2">
            <label className="flex flex-1 items-center gap-2 py-1">
              <input type="checkbox" checked={item.done} disabled={readOnly || busy} onChange={() => save(items.map((x, i) => (i === index ? { ...x, done: !x.done } : x)))} />
              <span className={item.done ? "text-slate-400 line-through" : ""}>{item.text}</span>
            </label>
            {!readOnly && <button className="icon-btn !h-8 !w-8" disabled={busy} onClick={() => save(items.filter((_, i) => i !== index))} aria-label={`Remove ${item.text}`}><Icon name="trash" className="h-4 w-4" /></button>}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <form onSubmit={add} className="flex gap-2">
          <input className="field !py-2" name="item" placeholder="Add an item" maxLength={100} aria-label="Packing item" />
          <button className="chip" disabled={busy}>Add</button>
        </form>
      )}
    </div>
  );
}
