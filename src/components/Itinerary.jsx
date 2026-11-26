import { useState } from "react";
import Icon from "./Icon";
import { api } from "../lib/api";

const mapsLink = (item, destination) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${destination}`)}`;

// Edits a local copy; nothing is sent until Save.
function Editor({ trip, onSave, onCancel }) {
  const [days, setDays] = useState(() => structuredClone(trip.days));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const change = (fn) => setDays((prev) => {
    const next = structuredClone(prev);
    fn(next);
    return next;
  });
  const move = (d, i, step) => change((next) => {
    const items = next[d].items;
    const [item] = items.splice(i, 1);
    items.splice(i + step, 0, item);
  });

  const locate = async (d, i) => {
    const item = days[d].items[i];
    setNote("");
    try {
      const hit = await api.locate(`${item.name}, ${trip.destination}`);
      change((next) => Object.assign(next[d].items[i], { lat: hit.lat, lng: hit.lng }));
      setNote(`Pinned: ${hit.label}`);
    } catch (err) {
      setNote(err.message);
    }
  };

  const save = async () => {
    setBusy(true);
    await onSave(days);
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      {days.map((day, d) => (
        <section key={d} className="space-y-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <div className="flex gap-2">
            <input className="field !py-2 font-semibold" value={day.title} onChange={(e) => change((n) => { n[d].title = e.target.value; })} aria-label={`Day ${d + 1} title`} maxLength={100} />
            <button className="icon-btn" onClick={() => change((n) => n.splice(d, 1))} aria-label={`Remove day ${d + 1}`}><Icon name="trash" /></button>
          </div>
          {day.items.map((item, i) => (
            <div key={item.id || i} className="space-y-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-900">
              <div className="flex gap-2">
                <input className="field !w-24 !px-2 !py-2" value={item.time || ""} onChange={(e) => change((n) => { n[d].items[i].time = e.target.value; })} placeholder="09:00" aria-label="Time" maxLength={20} />
                <input className="field !py-2" value={item.name} onChange={(e) => change((n) => { n[d].items[i].name = e.target.value; })} placeholder="Place or activity" aria-label="Place" maxLength={120} />
              </div>
              <textarea className="field !py-2 text-sm" rows={2} value={item.notes || ""} onChange={(e) => change((n) => { n[d].items[i].notes = e.target.value; })} placeholder="Notes" aria-label="Notes" maxLength={500} />
              <div className="flex items-center gap-1">
                <button className="chip" onClick={() => locate(d, i)} disabled={!item.name.trim()}>{item.lat === undefined ? "Find on map" : "Pinned · update"}</button>
                <span className="flex-1" />
                <button className="icon-btn !h-8 !w-8" onClick={() => move(d, i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="up" className="h-4 w-4" /></button>
                <button className="icon-btn !h-8 !w-8" onClick={() => move(d, i, 1)} disabled={i === day.items.length - 1} aria-label="Move down"><Icon name="down" className="h-4 w-4" /></button>
                <button className="icon-btn !h-8 !w-8" onClick={() => change((n) => n[d].items.splice(i, 1))} aria-label="Remove place"><Icon name="trash" className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          <button className="chip" onClick={() => change((n) => n[d].items.push({ time: "", name: "", notes: "" }))} disabled={day.items.length >= 20}>+ Add place</button>
        </section>
      ))}
      <button className="chip" onClick={() => change((n) => n.push({ title: `Day ${n.length + 1}`, items: [] }))} disabled={days.length >= 30}>+ Add day</button>
      {note && <p role="status" className="text-sm text-slate-500">{note}</p>}
      <div className="sticky bottom-0 flex gap-2 bg-white py-3 dark:bg-slate-950">
        <button className="btn-primary" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save plan"}</button>
        <button className="chip" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}

export default function Itinerary({ trip, readOnly, onSave }) {
  const [editing, setEditing] = useState(false);
  if (editing && !readOnly) {
    return <Editor trip={trip} onCancel={() => setEditing(false)} onSave={async (days) => (await onSave({ days })) && setEditing(false)} />;
  }
  return (
    <div className="space-y-4">
      {!readOnly && <button className="chip" onClick={() => setEditing(true)}>Edit plan</button>}
      {trip.days.map((day, d) => (
        <section key={d}>
          <h3 className="mb-2 font-semibold">{day.title}</h3>
          {day.items.length === 0 && <p className="text-sm text-slate-500">Nothing planned yet.</p>}
          <ol className="space-y-2">
            {day.items.map((item, i) => (
              <li key={item.id || i} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="font-medium">
                  {item.time && <span className="mr-2 text-sm text-slate-500">{item.time}</span>}
                  <a className="hover:underline" href={mapsLink(item, trip.destination)} target="_blank" rel="noopener noreferrer">{item.name}</a>
                </p>
                {item.notes && <p className="mt-1 text-sm text-slate-500">{item.notes}</p>}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
