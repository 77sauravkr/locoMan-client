import { test } from "node:test";
import assert from "node:assert/strict";
import { toIcs } from "../src/lib/ics.js";
import { shortestOrder } from "../src/lib/route.js";

test("calendar file has one event per stop, with escaped text", () => {
  const ics = toIcs(
    { id: "t1", startDate: "2026-12-31", destination: "Goa", days: [{ items: [{ time: "9:05", name: "Fort, old; one" }] }, { items: [{ name: "Beach", notes: "a\nb" }] }] },
    new Date("2026-11-27T00:00:00Z"),
  );
  assert.match(ics, /DTSTART:20261231T090500\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270101\r\n/);
  const slash = String.fromCharCode(92);
  assert.ok(ics.includes(`SUMMARY:Fort${slash}, old${slash}; one`));
  assert.match(ics, /DESCRIPTION:a\\nb/);
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 2);
});

test("route is shortened but keeps the first stop and the time slots", () => {
  const stop = (name, lat, time) => ({ name, lat, lng: 75, time });
  const items = [stop("a", 26.0, "09:00"), stop("far", 26.2, "11:00"), stop("near", 26.01, "13:00")];
  const result = shortestOrder(items);
  assert.deepEqual(result.map((i) => [i.name, i.time]), [["a", "09:00"], ["near", "11:00"], ["far", "13:00"]]);
  assert.equal(shortestOrder(result), result);
  const unpinned = [{ name: "x" }, { name: "y" }, { name: "z" }];
  assert.equal(shortestOrder(unpinned), unpinned);
});
