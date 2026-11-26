// Runs before the app so dark mode does not flash.
(function () {
  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch { /* storage blocked */ }
  var dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
})();
