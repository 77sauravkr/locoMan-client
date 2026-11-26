import { useState } from "react";
import Icon from "./Icon";

// Vote and comments for one place in a shared plan.
export default function Reactions({ item, trip, actions }) {
  const [open, setOpen] = useState(false);
  const votes = trip.votes.filter((v) => v.itemId === item.id);
  const mine = votes.some((v) => v.mine);
  const comments = trip.comments.filter((c) => c.itemId === item.id);

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const text = new FormData(form).get("text").trim();
    if (text && (await actions.comment(item.id, text))) form.reset();
  };

  return (
    <div className="mt-2 text-sm print:hidden">
      <div className="flex gap-2">
        <button className={`chip !py-0.5 ${mine ? "!border-brand-600 !bg-brand-600 !text-white" : ""}`} aria-pressed={mine} onClick={() => actions.vote(item.id, !mine)} aria-label={`Vote for ${item.name}`}>👍 {votes.length}</button>
        <button className="chip !py-0.5" aria-expanded={open} onClick={() => setOpen(!open)} aria-label={`Comments on ${item.name}`}>💬 {comments.length}</button>
      </div>
      {open && (
        <div className="mt-2 space-y-1">
          {comments.map((c) => (
            <p key={c.id} className="flex items-start gap-2">
              <span className="flex-1 break-words"><strong>{c.name}:</strong> {c.text}</span>
              {c.canDelete && <button onClick={() => actions.removeComment(c.id)} aria-label="Delete comment"><Icon name="close" className="h-4 w-4" /></button>}
            </p>
          ))}
          <form onSubmit={add} className="flex gap-2">
            <input className="field !py-1.5" name="text" placeholder="Add a comment" maxLength={300} aria-label="Comment" />
            <button className="chip">Post</button>
          </form>
        </div>
      )}
    </div>
  );
}
