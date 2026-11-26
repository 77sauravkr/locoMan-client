import { useEffect, useState } from "react";

const CHANGE = "app-navigate";

export function navigate(path, { replace = false } = {}) {
  window.history[replace ? "replaceState" : "pushState"](null, "", path);
  window.dispatchEvent(new Event(CHANGE));
}

export function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener("popstate", update);
    window.addEventListener(CHANGE, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(CHANGE, update);
    };
  }, []);
  return path;
}
