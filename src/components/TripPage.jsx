import { lazy, Suspense, useEffect, useState } from "react";
import Itinerary from "./Itinerary";
import Budget from "./Budget";
import TripInfo from "./TripInfo";
import TripShare from "./TripShare";
import Packing from "./Packing";
import { api } from "../lib/api";
import { offline } from "../lib/offline";
import { navigate } from "../lib/router";

const TripMap = lazy(() => import("./TripMap"));
const TABS = ["Plan", "Map", "Budget", "Packing", "Info", "Group"];

export default function TripPage({ id, userId, isOffline }) {
  const [trip, setTrip] = useState(() => (isOffline ? offline.trip(id) : null));
  const [stale, setStale] = useState(isOffline);
  const [tab, setTab] = useState("Plan");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (isOffline) return;
    let active = true;
    api.getTrip(id).then(
      (d) => {
        if (!active) return;
        setTrip(d.trip);
        setStale(false);
        offline.saveTrip(d.trip);
      },
      (err) => {
        if (!active) return;
        if (err.status === 404) offline.removeTrip(id);
        // No connection: fall back to the copy on this device, read-only.
        else if (err.status === 0) {
          setTrip(offline.trip(id));
          setStale(true);
        }
        setError(err.message);
      },
    );
    return () => {
      active = false;
    };
  }, [id, isOffline, reload]);

  // Picks up changes by other group members while the page is visible.
  const seen = trip?.updatedAt;
  useEffect(() => {
    if (isOffline || !seen) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      api.tripStamp(id).then((d) => d.updatedAt !== seen && setReload((n) => n + 1), () => {});
    }, 10_000);
    return () => clearInterval(timer);
  }, [id, isOffline, seen]);

  // Runs a change on the server and shows the trip it returns.
  const apply = async (action, leaving = false) => {
    setError("");
    try {
      const data = await action();
      if (data.trip) {
        setTrip(data.trip);
        offline.saveTrip(data.trip);
      }
      if (leaving) offline.removeTrip(id);
      return true;
    } catch (err) {
      setError(err.message);
      if (err.status === 409) setReload((n) => n + 1);
      return false;
    }
  };
  // An editor passes the version it started from, so later changes by others are not lost.
  const save = (changes) => apply(() => api.saveTrip(id, { version: trip.version, ...changes }));
  const reactions = {
    vote: (itemId, on) => apply(() => api.vote(id, itemId, on)),
    comment: (itemId, text) => apply(() => api.addComment(id, itemId, text)),
    removeComment: (commentId) => apply(() => api.removeComment(id, commentId)),
  };

  if (!trip) {
    return (
      <div className="p-6 text-center">
        <p className={error ? "text-red-600" : "animate-pulse text-slate-500"}>{error || (isOffline ? "This trip is not saved on this device." : "Loading trip...")}</p>
        <button className="chip mt-4" onClick={() => navigate("/trips")}>All trips</button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <button className="text-sm text-brand-600 hover:underline" onClick={() => navigate("/trips")}>← All trips</button>
      <h2 className="mt-1 text-2xl font-bold">{trip.title}</h2>
      <p className="text-sm text-slate-500">{[trip.destination, trip.startDate, `${trip.days.length} day(s)`].filter(Boolean).join(" · ")}</p>
      {stale && <p className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900">Offline: showing the copy saved on this device.</p>}
      <div className="my-4 flex gap-1 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
      {tab === "Plan" && <Itinerary trip={trip} readOnly={stale} onSave={save} reactions={reactions} />}
      {tab === "Map" && (
        <>
          <Suspense fallback={<p className="animate-pulse text-slate-500">Loading map...</p>}><TripMap days={trip.days} /></Suspense>
          <p className="mt-2 text-xs text-slate-500">Pins suggested by AI are approximate. Use Edit plan, then Find on map, to correct one. The map needs internet.</p>
        </>
      )}
      {tab === "Budget" && (
        <Budget trip={trip} readOnly={stale} onSave={save} onAdd={(body) => apply(() => api.addExpense(id, body))} onRemove={(eid) => apply(() => api.removeExpense(id, eid))} />
      )}
      {tab === "Packing" && <Packing trip={trip} readOnly={stale} onSave={save} />}
      {tab === "Info" && <TripInfo trip={trip} userId={userId} isOffline={stale} />}
      {tab === "Group" && <TripShare trip={trip} userId={userId} readOnly={stale} apply={apply} onLeft={() => navigate("/trips", { replace: true })} />}
    </div>
  );
}
