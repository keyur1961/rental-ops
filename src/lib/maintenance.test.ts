import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dueItems,
  nextStatusAfterOdometer,
  nextStatusAfterReturn,
} from "./maintenance";

const base = {
  odometerKm: 41000,
  lastServiceKm: 30000,
  lastTyreKm: 5000,
  serviceIntervalKm: 10000,
  tyreIntervalKm: 40000,
  status: "available",
};

describe("maintenance flags", () => {
  it("flags service and tyres when intervals are exceeded", () => {
    assert.deepEqual(dueItems(base), ["service"]);
    assert.deepEqual(dueItems({ ...base, odometerKm: 46000 }), ["service", "tyres"]);
  });

  it("keeps on-rent cars on rent after an odometer update", () => {
    assert.equal(
      nextStatusAfterOdometer({ ...base, status: "on_rent" }, 50000),
      "on_rent",
    );
  });

  it("moves a returned car to attention when service is due", () => {
    assert.equal(nextStatusAfterReturn(base), "attention");
    assert.equal(
      nextStatusAfterReturn({ ...base, lastServiceKm: 40000, lastTyreKm: 20000 }),
      "available",
    );
  });
});
