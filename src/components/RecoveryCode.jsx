import { useState } from "react";

export default function RecoveryCode({ code, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard.writeText(code).then(() => setCopied(true), () => {});
  return (
    <div role="dialog" aria-modal="true" aria-label="Recovery code" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center dark:bg-slate-900">
        <h2 className="text-xl font-bold">Save your recovery code</h2>
        <p className="mt-2 text-sm text-slate-500">If you forget your password, this is the only way back in. It is shown only now.</p>
        <p className="my-4 select-all rounded-xl bg-slate-100 px-3 py-3 font-mono text-lg dark:bg-slate-800">{code}</p>
        <button className="chip" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
        <button className="btn-primary mt-4 w-full" onClick={onClose}>I have saved it</button>
      </div>
    </div>
  );
}
