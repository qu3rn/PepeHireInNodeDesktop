import { describe, expect, it } from "vitest";
import { parseSalary } from "../src/main/normalization/salary";

describe("parseSalary", () => {
  it("parses hourly PLN with net+vat", () => {
    const result = parseSalary("120-180 PLN netto + VAT / h");
    expect(result.min).toBe(120);
    expect(result.max).toBe(180);
    expect(result.currency).toBe("PLN");
    expect(result.period).toBe("hourly");
    expect(result.taxMode).toBe("net_plus_vat");
    expect(result.monthlyMin).toBe(20160);
    expect(result.monthlyMax).toBe(30240);
  });

  it("parses k format monthly salary", () => {
    const result = parseSalary("18k - 24k PLN");
    expect(result.min).toBe(18000);
    expect(result.max).toBe(24000);
  });

  it("parses yearly range", () => {
    const result = parseSalary("100k - 150k PLN/year");
    expect(result.period).toBe("yearly");
    expect(result.monthlyMin).toBe(8333);
    expect(result.monthlyMax).toBe(12500);
  });
});
