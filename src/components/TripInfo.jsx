import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { bookingLinks } from "../lib/booking";

// WMO weather codes, grouped.
function sky(code) {
  if (code === 0) return "☀️ Clear";
  if (code <= 3) return "⛅ Cloudy";
  if (code <= 48) return "🌫️ Fog";
  if (code <= 67 || (code >= 80 && code <= 82)) return "🌧️ Rain";
  if (code <= 77 || code === 85 || code === 86) return "❄️ Snow";
  return "⛈️ Storm";
}

export default function TripInfo({ trip, isOffline }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");

  useEffect(() => {
    if (isOffline || !trip.destination) return;
    let active = true;
    api.weather(trip.destination).then((d) => active && setWeather(d), (err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [trip.destination, isOffline]);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-semibold">Weather, next 7 days</h3>
        {isOffline && <p className="text-sm text-slate-500">Needs internet.</p>}
        {!isOffline && !weather && !error && <p className="animate-pulse text-sm text-slate-500">Loading...</p>}
        {error && <p className="text-sm text-slate-500">{error}</p>}
        {weather && (
          <>
            <p className="mb-2 text-sm text-slate-500">{weather.place}</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {weather.days.map((d) => (
                <li key={d.date} className="rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-800">
                  <p className="font-medium">{new Date(`${d.date}T00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
                  <p>{sky(d.code)}</p>
                  <p>{Math.round(d.max)}° / {Math.round(d.min)}°C</p>
                  <p className="text-slate-500">Rain {d.rain ?? 0}%</p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">Weather data by <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo.com</a></p>
          </>
        )}
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Book travel and stay</h3>
        <input className="field !py-2" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Travelling from (city)" aria-label="Travelling from" maxLength={60} />
        <div className="mt-3 flex flex-wrap gap-2">
          {bookingLinks({ destination: trip.destination || trip.title, startDate: trip.startDate, days: trip.days.length }, from).map((link) => (
            <a key={link.label} className="chip" href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">These open other websites. LocoMan does not sell tickets.</p>
      </section>
    </div>
  );
}
