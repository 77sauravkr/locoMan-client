import { useState } from "react";
import { EMERGENCY } from "../lib/emergency";

export default function Emergency() {
  const [country, setCountry] = useState("India");
  return (
    <section>
      <h3 className="mb-2 font-semibold">Emergency numbers</h3>
      <select className="field !py-2" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
        {Object.keys(EMERGENCY).map((c) => <option key={c}>{c}</option>)}
      </select>
      <ul className="mt-2 space-y-1">
        {EMERGENCY[country].map(([label, number]) => (
          <li key={label} className="flex justify-between">
            <span>{label}</span>
            <a className="font-mono font-semibold text-brand-600" href={`tel:${number.split(" ")[0]}`}>{number}</a>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-slate-500">Confirm locally when you arrive.</p>
    </section>
  );
}
