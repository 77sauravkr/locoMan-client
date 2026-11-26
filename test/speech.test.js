import { test } from "node:test";
import assert from "node:assert/strict";
import { toSpoken, chunkText } from "../src/lib/speech.js";

test("drops Markdown and links before reading aloud", () => {
  assert.equal(toSpoken("## Day 1\n\nSee [Hawa Mahal](https://maps.example/x) **early**."), "Day 1\nSee Hawa Mahal early.");
});

test("splits long replies into short pieces without losing words", () => {
  const text = "One sentence. " + "word ".repeat(100) + "ठीक है। Done!";
  const chunks = chunkText(text, 80);
  assert.ok(chunks.every((c) => c.length <= 80));
  assert.equal(chunks.join(" ").replace(/\s+/g, " "), text.replace(/\s+/g, " ").trim());
});
