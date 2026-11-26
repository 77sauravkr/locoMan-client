import { useEffect, useState } from "react";
import Icon from "./Icon";
import { wallet, MAX_FILE } from "../lib/wallet";

export default function Wallet({ userId, tripId }) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    wallet.list(userId, tripId).then(
      (list) => active && setFiles(list),
      () => active && setError("This browser does not allow saving files."),
    );
    return () => {
      active = false;
    };
  }, [userId, tripId, version]);

  const run = async (action) => {
    setError("");
    try {
      await action();
      setVersion((v) => v + 1);
    } catch {
      setError("Could not save. The device may be out of space.");
    }
  };

  const add = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type)) return setError("Only PDF, JPG, PNG or WebP files.");
    if (file.size > MAX_FILE) return setError("File is larger than 5 MB.");
    run(() => wallet.add(userId, tripId, file));
  };

  const save = (item) => {
    const url = URL.createObjectURL(item.file);
    Object.assign(document.createElement("a"), { href: url, download: item.name }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <h3 className="mb-1 font-semibold">Tickets and documents</h3>
      <p className="mb-2 text-xs text-slate-500">Stored only on this device, works offline, removed when you log out. Keep your originals.</p>
      <ul className="space-y-1">
        {files.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <button className="min-w-0 flex-1 truncate text-left text-brand-600 hover:underline" onClick={() => save(item)}>{item.name}</button>
            <button className="icon-btn !h-8 !w-8" onClick={() => run(() => wallet.remove(item.id))} aria-label={`Remove ${item.name}`}><Icon name="trash" className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <label className="chip mt-2 inline-block cursor-pointer">
        + Add file
        <input type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={add} aria-label="Add ticket or document" />
      </label>
      {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
    </section>
  );
}
