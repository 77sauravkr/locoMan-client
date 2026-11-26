import { useEffect, useState } from "react";

let saved = null;
const listeners = new Set();

// The browser offers installation once, possibly before any component is listening.
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  saved = event;
  listeners.forEach((notify) => notify(event));
});

export function useInstall() {
  const [event, setEvent] = useState(saved);
  useEffect(() => {
    listeners.add(setEvent);
    return () => listeners.delete(setEvent);
  }, []);
  if (!event) return null;
  return async () => {
    await event.prompt();
    saved = null;
    setEvent(null);
  };
}
