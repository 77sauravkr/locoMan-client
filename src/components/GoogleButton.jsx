import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const SCRIPT = "https://accounts.google.com/gsi/client";

function loadScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = Object.assign(document.createElement("script"), { src: SCRIPT, async: true, onload: resolve, onerror: reject });
    document.head.appendChild(script);
  });
}

// Shown only when the server has a Google client id. Google's script is loaded only then.
export default function GoogleButton({ onAuth, onError }) {
  const [clientId, setClientId] = useState(null);
  const box = useRef(null);
  const handlers = useRef({ onAuth, onError });

  useEffect(() => {
    handlers.current = { onAuth, onError };
  });

  useEffect(() => {
    let active = true;
    api.config().then((c) => active && setClientId(c.googleClientId)).catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return;
    loadScript()
      .then(() => {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) =>
            api.google(credential).then((d) => handlers.current.onAuth(d.user), (err) => handlers.current.onError(err.message)),
        });
        if (box.current) window.google.accounts.id.renderButton(box.current, { theme: "outline", size: "large", width: 280 });
      })
      .catch(() => handlers.current.onError("Google sign-in could not load."));
  }, [clientId]);

  return clientId ? <div ref={box} className="mt-4 flex justify-center" /> : null;
}
