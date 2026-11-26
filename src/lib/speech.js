// Turns Markdown into text that sounds natural when read aloud.
export function toSpoken(markdown) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, "")
    .replace(/[*_#`>]/g, "")
    .replace(/\|/g, ", ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// Some browsers stop long utterances part way, so speak sentence by sentence.
export function chunkText(text, max = 200) {
  const chunks = [];
  for (const sentence of text.split(/(?<=[.!?।])\s+|\n+/)) {
    let rest = sentence.trim();
    while (rest.length > max) {
      const cut = rest.lastIndexOf(" ", max);
      const at = cut > 0 ? cut : max;
      chunks.push(rest.slice(0, at));
      rest = rest.slice(at).trim();
    }
    if (rest) chunks.push(rest);
  }
  return chunks;
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

let run = 0;

export function stopSpeaking() {
  run++;
  if (canSpeak()) window.speechSynthesis.cancel();
}

export function speak(markdown, onEnd = () => {}) {
  stopSpeaking();
  const id = run;
  const chunks = canSpeak() ? chunkText(toSpoken(markdown)) : [];
  const lang = /[ऀ-ॿ]/.test(markdown) ? "hi-IN" : "en-IN";
  const next = (i) => {
    if (id !== run) return;
    if (i >= chunks.length) return onEnd();
    const utterance = new SpeechSynthesisUtterance(chunks[i]);
    utterance.lang = lang;
    utterance.onend = utterance.onerror = () => next(i + 1);
    window.speechSynthesis.speak(utterance);
  };
  next(0);
}
