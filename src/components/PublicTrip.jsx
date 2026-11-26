import { lazy, Suspense, useEffect, useState } from "react";
import { api } from "../lib/api";

const TripMap = lazy(() => import("./TripMap"));

// Read-only page for anyone with the link; no account needed.
export default function PublicTrip({ token }) {
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.publicTrip(token).then((d) => active && setTrip(d.trip), (err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl space-y-5 px-4 py-6">
      <a href="/" className="font-semibold text-brand-600">LocoMan</a>
      {!trip && <p className={error ? "text-red-600" : "animate-pulse text-slate-500"}>{error || "Loading..."}</p>}
      {trip && (
        <>
          <header>
            <h1 className="text-2xl font-bold">{trip.title}</h1>
            <p className="text-sm text-slate-500">{[trip.destination, trip.startDate, `${trip.days.length} day(s)`].filter(Boolean).join(" · ")}</p>
          </header>
          {trip.days.some((d) => d.items.some((i) => i.lat !== undefined && i.lat !== null)) && (
            <Suspense fallback={null}><TripMap days={trip.days} /></Suspense>
          )}
          {trip.days.map((day, d) => (
            <section key={d}>
              <h2 className="mb-2 font-semibold">{day.title}</h2>
              <ol className="space-y-2">
                {day.items.map((item, i) => (
                  <li key={i} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="font-medium">{item.time && <span className="mr-2 text-sm text-slate-500">{item.time}</span>}{item.name}</p>
                    {item.notes && <p className="mt-1 text-sm text-slate-500">{item.notes}</p>}
                  </li>
                ))}
              </ol>
            </section>
          ))}
          <a href="/" className="btn-primary inline-block">Plan your own trip</a>
        </>
      )}
    </div>
  );
}
