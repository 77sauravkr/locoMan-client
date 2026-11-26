import { useState } from "react";
import RecoveryCode from "./RecoveryCode";
import { api } from "../lib/api";
import { navigate } from "../lib/router";

function Section({ title, children, onSubmit, button, danger }) {
  const [state, setState] = useState({ busy: false, message: "", ok: false });
  const submit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setState({ busy: true, message: "", ok: false });
    try {
      const message = await onSubmit(Object.fromEntries(new FormData(form)));
      form.reset();
      setState({ busy: false, message: message || "", ok: true });
    } catch (err) {
      setState({ busy: false, message: err.message, ok: false });
    }
  };
  return (
    <form onSubmit={submit} className={`space-y-3 rounded-2xl border p-4 ${danger ? "border-red-300 dark:border-red-900" : "border-slate-200 dark:border-slate-800"}`}>
      <h3 className="font-semibold">{title}</h3>
      {children}
      {state.message && <p role="status" className={`text-sm ${state.ok ? "text-brand-600" : "text-red-600"}`}>{state.message}</p>}
      <button className={danger ? "rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50" : "btn-primary"} disabled={state.busy}>
        {state.busy ? "Please wait..." : button}
      </button>
    </form>
  );
}

const Password = ({ name, label, fresh }) => (
  <label className="block text-sm font-medium">
    {label}
    <input className="field mt-1" type="password" name={name} required minLength={fresh ? 8 : undefined} autoComplete={fresh ? "new-password" : "current-password"} />
  </label>
);

export default function Account({ user, onUser, onDeleted }) {
  const [code, setCode] = useState("");
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 px-4 py-6">
      <p className="text-slate-500">Signed in as <strong className="text-slate-900 dark:text-white">{user.username}</strong></p>
      {user.hasPassword && (
        <>
          <Section title="Change password" button="Change password" onSubmit={async (v) => {
            onUser((await api.changePassword(v)).user);
            return "Password changed. Other devices were signed out.";
          }}>
            <Password name="currentPassword" label="Current password" />
            <Password name="newPassword" label="New password" fresh />
          </Section>
          <Section title={user.hasRecovery ? "New recovery code" : "Set up a recovery code"} button="Create code" onSubmit={async (v) => {
            setCode((await api.newRecoveryCode(v.password)).recoveryCode);
          }}>
            <p className="text-sm text-slate-500">Needed to reset a forgotten password. A new code replaces the old one.</p>
            <Password name="password" label="Password" />
          </Section>
        </>
      )}
      <Section title="Delete account" button="Delete my account" danger onSubmit={async (v) => {
        await api.deleteAccount(v);
        onDeleted();
      }}>
        <p className="text-sm text-slate-500">Removes your chats and the trips you created. This cannot be undone.</p>
        {user.hasPassword ? (
          <Password name="password" label="Password" />
        ) : (
          <label className="block text-sm font-medium">
            Type your username to confirm
            <input className="field mt-1" name="confirm" required placeholder={user.username} />
          </label>
        )}
      </Section>
      <button className="text-sm text-slate-500 hover:underline" onClick={() => navigate("/privacy")}>Privacy</button>
      {code && <RecoveryCode code={code} onClose={() => { setCode(""); onUser({ ...user, hasRecovery: true }); }} />}
    </div>
  );
}
