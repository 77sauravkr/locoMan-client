import { useEffect, useState } from "react";
import { api } from "../lib/api";

const CODES = ["INR", "USD", "EUR", "GBP", "AED", "THB", "SGD", "JPY", "NPR", "LKR", "IDR", "AUD"];

export default function Currency({ isOffline }) {
  const [amount, setAmount] = useState("1000");
  const [from, setFrom] = useState("INR");
  const [to, setTo] = useState("USD");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOffline) return;
    let active = true;
    api.rates(from).then(
      (d) => active && (setData(d), setError("")),
      (err) => active && setError(err.message),
    );
    return () => {
      active = false;
    };
  }, [from, isOffline]);

  const rate = data?.base === from ? data.rates[to] : undefined;
  const select = (value, set, label) => (
    <select className="field !w-28 !py-2" value={value} onChange={(e) => set(e.target.value)} aria-label={label}>
      {CODES.map((c) => <option key={c}>{c}</option>)}
    </select>
  );

  return (
    <section>
      <h3 className="mb-2 font-semibold">Currency converter</h3>
      {isOffline ? (
        <p className="text-sm text-slate-500">Needs internet.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input className="field !w-32 !py-2" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" />
            {select(from, setFrom, "From currency")}
            <span>→</span>
            {select(to, setTo, "To currency")}
          </div>
          <p className="mt-2 text-lg font-semibold" role="status">
            {rate !== undefined ? `${(Number(amount) * rate).toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${to}` : error || "Loading..."}
          </p>
          <p className="text-xs text-slate-500">Daily reference rates, not what a shop or bank will charge. <a className="underline" href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">Rates By Exchange Rate API</a></p>
        </>
      )}
    </section>
  );
}
