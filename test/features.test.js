import { test } from "node:test";
import assert from "node:assert/strict";
import { balances, settlements } from "../src/lib/split.js";
import { bookingLinks } from "../src/lib/booking.js";

test("splits to the paisa and balances sum to zero", () => {
  const list = balances(["a", "b", "c"], [
    { amount: 10000, paidBy: "a", splitAmong: ["a", "b", "c"] },
    { amount: 3000, paidBy: "b", splitAmong: ["c"] },
  ]);
  assert.equal(list.reduce((sum, b) => sum + b.amount, 0), 0);
  assert.deepEqual(list, [
    { name: "a", amount: 6666 },
    { name: "b", amount: -333 },
    { name: "c", amount: -6333 },
  ]);
  const paid = settlements(list);
  assert.deepEqual(paid, [
    { from: "c", to: "a", amount: 6333 },
    { from: "b", to: "a", amount: 333 },
  ]);
});

test("booking links carry the dates and encode names", () => {
  const links = bookingLinks({ destination: "Leh & Ladakh", startDate: "2026-12-30", days: 4 }, "Delhi");
  assert.match(links[0].url, /Leh%20%26%20Ladakh/);
  assert.match(links[3].url, /checkin=2026-12-30&checkout=2027-01-02/);
});
