import { describe, expect, it } from "vitest";
import { getProgress, initialDistributions, validateRequest } from "./rmd";

describe("RMD progress", () => {
  it("starts pending with no completed distributions", () => {
    expect(getProgress([])).toMatchObject({
      completed: 0,
      remaining: 24000,
      percentage: 0,
      status: "Pending",
    });
  });
  it("only counts settled distributions toward the obligation", () => {
    expect(
      getProgress([
        ...initialDistributions(),
        { amount: 6000, status: "processing" },
      ]),
    ).toMatchObject({
      completed: 18000,
      inFlight: 6000,
      remaining: 6000,
      available: 0,
      percentage: 75,
      status: "In flight",
    });
  });
  it("becomes satisfied at the annual obligation", () => {
    expect(
      getProgress([
        ...initialDistributions(),
        { amount: 6000, status: "completed" },
      ]),
    ).toMatchObject({
      completed: 24000,
      remaining: 0,
      percentage: 100,
      status: "Satisfied",
    });
  });
  it("clamps over-distribution to a full gauge and zero remainder", () => {
    expect(getProgress([{ amount: 30000, status: "completed" }])).toMatchObject(
      { remaining: 0, available: 0, percentage: 100, status: "Satisfied" },
    );
  });
  it("handles a zero annual obligation", () => {
    expect(getProgress([], 0)).toMatchObject({
      percentage: 100,
      status: "Satisfied",
    });
  });
  it.each(["", "-1", "0", "Infinity", "NaN", "1.001", "6000.01"])(
    "rejects invalid request %s",
    (amount) => {
      expect(validateRequest(amount, 6000)).toBeTruthy();
    },
  );
  it("accepts a valid cent amount and the full remainder", () => {
    expect(validateRequest("105.25", 6000)).toBeNull();
    expect(validateRequest("6000", 6000)).toBeNull();
  });
});
