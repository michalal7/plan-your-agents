import assert from "node:assert/strict";
import { test } from "node:test";
import { planRoute } from "../src/planner.js";

const depot = { lat: 52.52, lon: 13.405 };
const stops = [
  { id: "c", lat: 52.61, lon: 13.42 },
  { id: "a", lat: 52.53, lon: 13.41 },
  { id: "b", lat: 52.57, lon: 13.39 },
];

test("visits the nearest stop first", () => {
  const { order } = planRoute(stops, depot);
  assert.equal(order[0].id, "a");
});

test("visits every stop exactly once", () => {
  const { order } = planRoute(stops, depot);
  assert.deepEqual(
    order.map((s) => s.id).sort(),
    ["a", "b", "c"],
  );
});

test("reports a positive total distance", () => {
  const { totalKm } = planRoute(stops, depot);
  assert.ok(totalKm > 0);
});
