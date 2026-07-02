export type ContractMode = "b2b" | "uop";

export type RateInput =
  | {
      kind: "b2b-hourly";
      contractMode: "b2b";
      hourlyRate: number;
      hoursPerDay: number;
      workingDaysPerMonth: number;
      currency?: "PLN";
    }
  | {
      kind: "b2b-daily";
      contractMode: "b2b";
      dailyRate: number;
      workingDaysPerMonth: number;
      hoursPerDay?: number;
      currency?: "PLN";
    }
  | {
      kind: "monthly-to-hourly";
      contractMode: "b2b";
      monthlyAmount: number;
      hoursPerDay: number;
      workingDaysPerMonth: number;
      currency?: "PLN";
    }
  | {
      kind: "uop-monthly";
      contractMode: "uop";
      monthlyGross: number;
      currency?: "PLN";
    };

export interface RateCalculationResult {
  kind: RateInput["kind"];
  contractMode: ContractMode;
  currency: "PLN";
  monthlyGross: number;
  yearlyGross: number;
  hourlyEquivalent: number | null;
  dailyEquivalent: number | null;
  estimatedNet: number | null;
  notes: string[];
}

export interface ComparisonResult {
  optionA: RateCalculationResult;
  optionB: RateCalculationResult;
  betterMonthly: "A" | "B" | "equal";
  betterYearly: "A" | "B" | "equal";
  monthlyDifference: number;
  yearlyDifference: number;
}

const DEFAULT_CURRENCY: "PLN" = "PLN";
const YEAR_MULTIPLIER = 12;
const UOP_SIMPLE_NET_RATIO = 0.72;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toYearly(monthlyGross: number): number {
  return roundMoney(monthlyGross * YEAR_MULTIPLIER);
}

function estimateUopNet(monthlyGross: number): number {
  return roundMoney(monthlyGross * UOP_SIMPLE_NET_RATIO);
}

function baseResult(
  kind: RateInput["kind"],
  contractMode: ContractMode,
  monthlyGross: number,
  hourlyEquivalent: number | null,
  dailyEquivalent: number | null,
  estimatedNet: number | null,
  notes: string[]
): RateCalculationResult {
  return {
    kind,
    contractMode,
    currency: DEFAULT_CURRENCY,
    monthlyGross: roundMoney(monthlyGross),
    yearlyGross: toYearly(monthlyGross),
    hourlyEquivalent: hourlyEquivalent == null ? null : roundMoney(hourlyEquivalent),
    dailyEquivalent: dailyEquivalent == null ? null : roundMoney(dailyEquivalent),
    estimatedNet: estimatedNet == null ? null : roundMoney(estimatedNet),
    notes
  };
}

export function calculateB2bHourlyToMonthly(input: Extract<RateInput, { kind: "b2b-hourly" }>): RateCalculationResult {
  const monthlyGross = input.hourlyRate * input.hoursPerDay * input.workingDaysPerMonth;
  return baseResult(
    input.kind,
    input.contractMode,
    monthlyGross,
    input.hourlyRate,
    input.hourlyRate * input.hoursPerDay,
    null,
    [
      `Hourly rate x hours/day x working days = ${input.hourlyRate} x ${input.hoursPerDay} x ${input.workingDaysPerMonth}`
    ]
  );
}

export function calculateB2bDailyToMonthly(input: Extract<RateInput, { kind: "b2b-daily" }>): RateCalculationResult {
  const hoursPerDay = input.hoursPerDay ?? 8;
  const monthlyGross = input.dailyRate * input.workingDaysPerMonth;
  return baseResult(
    input.kind,
    input.contractMode,
    monthlyGross,
    input.dailyRate / hoursPerDay,
    input.dailyRate,
    null,
    [
      `Daily rate x working days = ${input.dailyRate} x ${input.workingDaysPerMonth}`
    ]
  );
}

export function calculateMonthlyToHourly(input: Extract<RateInput, { kind: "monthly-to-hourly" }>): RateCalculationResult {
  const monthlyHours = input.hoursPerDay * input.workingDaysPerMonth;
  const hourlyEquivalent = monthlyHours > 0 ? input.monthlyAmount / monthlyHours : 0;
  const dailyEquivalent = input.hoursPerDay > 0 ? hourlyEquivalent * input.hoursPerDay : 0;

  return baseResult(
    input.kind,
    input.contractMode,
    input.monthlyAmount,
    hourlyEquivalent,
    dailyEquivalent,
    null,
    [`Monthly amount divided by total monthly hours (${monthlyHours})`]
  );
}

export function calculateUopMonthly(input: Extract<RateInput, { kind: "uop-monthly" }>): RateCalculationResult {
  return baseResult(
    input.kind,
    input.contractMode,
    input.monthlyGross,
    null,
    null,
    estimateUopNet(input.monthlyGross),
    ["Simplified UoP estimate only - not legal/tax advice"]
  );
}

export function calculateRate(input: RateInput): RateCalculationResult {
  switch (input.kind) {
    case "b2b-hourly":
      return calculateB2bHourlyToMonthly(input);
    case "b2b-daily":
      return calculateB2bDailyToMonthly(input);
    case "monthly-to-hourly":
      return calculateMonthlyToHourly(input);
    case "uop-monthly":
      return calculateUopMonthly(input);
  }
}

export function compareRates(optionA: RateInput, optionB: RateInput): ComparisonResult {
  const calculatedA = calculateRate(optionA);
  const calculatedB = calculateRate(optionB);
  const monthlyDifference = roundMoney(Math.abs(calculatedA.monthlyGross - calculatedB.monthlyGross));
  const yearlyDifference = roundMoney(Math.abs(calculatedA.yearlyGross - calculatedB.yearlyGross));

  return {
    optionA: calculatedA,
    optionB: calculatedB,
    betterMonthly:
      calculatedA.monthlyGross > calculatedB.monthlyGross
        ? "A"
        : calculatedB.monthlyGross > calculatedA.monthlyGross
          ? "B"
          : "equal",
    betterYearly:
      calculatedA.yearlyGross > calculatedB.yearlyGross
        ? "A"
        : calculatedB.yearlyGross > calculatedA.yearlyGross
          ? "B"
          : "equal",
    monthlyDifference,
    yearlyDifference
  };
}

export function formatPLN(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 2
  }).format(value);
}
