import { useState } from "react";
import { api } from "../lib/api";

export default function TripShare({ trip, userId, readOnly, apply, onLeft }) {
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState("");
  const owner = trip.role === "owner";
  const link = trip.inviteToken ? `${window.location.origin}/join/${trip.inviteToken}` : "";

  if (readOnly) return <p className="text-sm text-slate-500">Sharing needs internet.</p>;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `Join my trip: ${trip.title}`, url: link });
      else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
      }
    } catch {
      /* sharing was cancelled */
    }
  };

  const leave = async () => {
    if (await apply(() => (owner ? api.deleteTrip(trip.id) : api.removeMember(trip.id, userId)), true)) onLeft();
  };

  return (
    <div className="space-y-6">
      {owner && (
        <section className="space-y-2">
          <h3 className="font-semibold">Invite friends</h3>
          <p className="text-sm text-slate-500">Anyone with the link can join, see and edit this trip.</p>
          {link ? (
            <>
              <input className="field !py-2 text-sm" readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Invite link" />
              <div className="flex gap-2">
                <button className="btn-primary" onClick={share}>{copied ? "Copied" : "Share link"}</button>
                <button className="chip" onClick={() => apply(() => api.removeInvite(trip.id))}>Turn link off</button>
              </div>
            </>
          ) : (
            <button className="btn-primary" onClick={() => apply(() => api.createInvite(trip.id))}>Create invite link</button>
          )}
        </section>
      )}
      <section>
        <h3 className="mb-2 font-semibold">Members</h3>
        {trip.members.length === 0 && <p className="text-sm text-slate-500">Nobody has joined yet.</p>}
        <ul className="space-y-1">
          {trip.members.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <span className="flex-1">{m.name}</span>
              {owner && <button className="chip" onClick={() => apply(() => api.removeMember(trip.id, m.id))}>Remove</button>}
            </li>
          ))}
        </ul>
        {owner && trip.members.length > 0 && <p className="mt-2 text-xs text-slate-500">Removing someone also turns the invite link off.</p>}
      </section>
      <section>
        {confirm ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>{owner ? "Delete this trip for everyone?" : "Leave this trip?"}</span>
            <button className="font-semibold text-red-600" onClick={leave}>Yes</button>
            <button onClick={() => setConfirm("")}>Cancel</button>
          </div>
        ) : (
          <button className="chip !text-red-600" onClick={() => setConfirm("yes")}>{owner ? "Delete trip" : "Leave trip"}</button>
        )}
      </section>
    </div>
  );
}
