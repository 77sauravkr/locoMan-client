import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSse } from "../src/lib/sse.js";

test("parses whole events and keeps the unfinished tail", () => {
  const first = parseSse('data: {"delta":"a"}\n\ndata: {"del');
  assert.deepEqual(first.events, [{ delta: "a" }]);
  const second = parseSse(first.rest + 'ta":"b\\n\\nc"}\n\n');
  assert.deepEqual(second.events, [{ delta: "b\n\nc" }]);
  assert.equal(second.rest, "");
});
