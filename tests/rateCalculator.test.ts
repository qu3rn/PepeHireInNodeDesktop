import { describe, expect, it } from "vitest";
import {
  calculateB2bDailyToMonthly,
  calculateB2bHourlyToMonthly,
  calculateMonthlyToHourly,
  compareRates,
  calculateRate
} from "../src/main/shared/calculators/rateCalculator";

describe("rateCalculator", () => {
  it("converts hourly to monthly", () => {
    const result = calculateB2bHourlyToMonthly({
      kind: "b2b-hourly",
      contractMode: "b2b",
      hourlyRate: 150,
      hoursPerDay: 8,
      workingDaysPerMonth: 21,
      currency: "PLN"
    });

    expect(result.monthlyGross).toBe(25200);
    expect(result.yearlyGross).toBe(302400);
    expect(result.hourlyEquivalent).toBe(150);
    expect(result.dailyEquivalent).toBe(1200);
  });

  it("converts daily to monthly", () => {
    const result = calculateB2bDailyToMonthly({
      kind: "b2b-daily",
      contractMode: "b2b",
      dailyRate: 1200,
      workingDaysPerMonth: 21,
      currency: "PLN"
    });

    expect(result.monthlyGross).toBe(25200);
    expect(result.yearlyGross).toBe(302400);
    expect(result.dailyEquivalent).toBe(1200);
  });

  it("converts monthly to hourly", () => {
    const result = calculateMonthlyToHourly({
      kind: "monthly-to-hourly",
      contractMode: "b2b",
      monthlyAmount: 25200,
      hoursPerDay: 8,
      workingDaysPerMonth: 21,
      currency: "PLN"
    });

    expect(result.monthlyGross).toBe(25200);
    expect(result.hourlyEquivalent).toBe(150);
    expect(result.dailyEquivalent).toBe(1200);
  });

  it("returns yearly total through the shared result", () => {
    const result = calculateRate({
      kind: "uop-monthly",
      contractMode: "uop",
      monthlyGross: 10000,
      currency: "PLN"
    });

    expect(result.yearlyGross).toBe(120000);
  });

  it("compares two options", () => {
    const comparison = compareRates(
      {
        kind: "b2b-hourly",
        contractMode: "b2b",
        hourlyRate: 150,
        hoursPerDay: 8,
        workingDaysPerMonth: 21,
        currency: "PLN"
      },
      {
        kind: "uop-monthly",
        contractMode: "uop",
        monthlyGross: 20000,
        currency: "PLN"
      }
    );

    expect(comparison.optionA.monthlyGross).toBe(25200);
    expect(comparison.optionB.monthlyGross).toBe(20000);
    expect(comparison.betterMonthly).toBe("A");
    expect(comparison.monthlyDifference).toBe(5200);
  });
});
