import { test } from "node:test";
import assert from "node:assert/strict";
import { weatherAlerts } from "../src/lib/alerts.js";

test("warns only about the trip's own days", () => {
  const day = (date, extra) => ({ date, code: 0, rain: 0, max: 25, min: 15, ...extra });
  const forecast = [day("2026-12-01", { rain: 90 }), day("2026-12-02", { code: 96, rain: 80 }), day("2026-12-03", { min: 2 })];
  assert.equal(weatherAlerts(forecast, "2026-12-02", 1).length, 1);
  assert.match(weatherAlerts(forecast, "2026-12-02", 1)[0], /thunderstorm/);
  assert.equal(weatherAlerts(forecast, "", 3).length, 3);
  assert.equal(weatherAlerts(forecast, "2027-01-01", 3).length, 0);
});
