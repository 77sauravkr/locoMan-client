import { useState } from "react";
import Icon from "./Icon";
import { balances, settlements, rupees } from "../lib/split";

export default function Budget({ trip, readOnly, onAdd, onRemove, onSave }) {
  const [error, setError] = useState("");
  const total = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const net = balances(trip.people, trip.expenses);
  const pay = settlements(net);

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const splitAmong = data.getAll("split");
    if (!splitAmong.length) return setError("Choose at least one person to share it.");
    setError("");
    const saved = await onAdd({
      description: data.get("description"),
      amount: Math.round(Number(data.get("amount")) * 100),
      paidBy: data.get("paidBy"),
      splitAmong,
    });
    if (saved) form.reset();
  };

  const addPerson = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = new FormData(form).get("person").trim();
    if (name && (await onSave({ people: [...trip.people, name] }))) form.reset();
  };

  return (
    <div className="space-y-5">
      <p className="text-lg">Total spent: <strong>{rupees(total)}</strong></p>

      <section>
        <h3 className="mb-2 font-semibold">People</h3>
        <p className="text-sm">{trip.people.join(", ")}</p>
        {!readOnly && (
          <form onSubmit={addPerson} className="mt-2 flex gap-2">
            <input className="field !py-2" name="person" placeholder="Add a friend's name" maxLength={64} aria-label="Person name" />
            <button className="chip">Add</button>
          </form>
        )}
      </section>

      {!readOnly && (
        <form onSubmit={add} className="space-y-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <h3 className="font-semibold">Add expense</h3>
          <div className="flex gap-2">
            <input className="field !py-2" name="description" placeholder="Hotel, cab, dinner..." required maxLength={120} aria-label="Description" />
            <input className="field !w-32 !py-2" name="amount" type="number" min="0.01" max="10000000" step="0.01" placeholder="₹" required aria-label="Amount in rupees" />
          </div>
          <label className="block text-sm">Paid by
            <select className="field mt-1 !py-2" name="paidBy">{trip.people.map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <fieldset className="flex flex-wrap gap-3 text-sm">
            <legend className="mb-1">Shared by</legend>
            {trip.people.map((p) => (
              <label key={p} className="flex items-center gap-1"><input type="checkbox" name="split" value={p} defaultChecked /> {p}</label>
            ))}
          </fieldset>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary">Add expense</button>
        </form>
      )}

      {trip.expenses.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold">Expenses</h3>
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {trip.expenses.map((e) => (
              <li key={e.id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate">{e.description}</p>
                  <p className="text-xs text-slate-500">{e.paidBy} paid · shared by {e.splitAmong.join(", ")}</p>
                </div>
                <span className="font-medium">{rupees(e.amount)}</span>
                {!readOnly && <button className="icon-btn !h-8 !w-8" onClick={() => onRemove(e.id)} aria-label={`Remove ${e.description}`}><Icon name="trash" className="h-4 w-4" /></button>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 font-semibold">Settle up</h3>
        {pay.length === 0 ? (
          <p className="text-sm text-slate-500">Everyone is even.</p>
        ) : (
          <ul className="space-y-1">{pay.map((p) => <li key={`${p.from}-${p.to}`}><strong>{p.from}</strong> pays <strong>{p.to}</strong> {rupees(p.amount)}</li>)}</ul>
        )}
      </section>
    </div>
  );
}
