import { useState } from "react";
import { Calculator, ArrowRightLeft, Landmark, TimerReset } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Input, Select } from "../components/ui";
import {
  calculateB2bDailyToMonthly,
  calculateB2bHourlyToMonthly,
  calculateMonthlyToHourly,
  calculateRate,
  compareRates,
  formatPLN
} from "@shared/calculators/rateCalculator";

const DAYS_PRESETS = [
  { value: "21", label: "21 working days (default)" },
  { value: "28", label: "28 calendar days" },
  { value: "custom", label: "Custom days" }
] as const;

export function RateCalculatorPage() {
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [workingDaysPreset, setWorkingDaysPreset] = useState<(typeof DAYS_PRESETS)[number]["value"]>("21");
  const [customWorkingDays, setCustomWorkingDays] = useState(21);

  const [hourlyRate, setHourlyRate] = useState(150);
  const [dailyRate, setDailyRate] = useState(1200);
  const [monthlyAmount, setMonthlyAmount] = useState(25200);
  const [uopGross, setUopGross] = useState(25200);

  const [compareMode, setCompareMode] = useState<"b2b-hourly" | "b2b-daily" | "b2b-monthly">("b2b-hourly");
  const [compareRate, setCompareRate] = useState(150);
  const [compareMonthly, setCompareMonthly] = useState(25200);
  const [compareUopGross, setCompareUopGross] = useState(22000);

  const workingDaysPerMonth = workingDaysPreset === "custom" ? customWorkingDays : Number(workingDaysPreset);

  const hourlyResult = calculateB2bHourlyToMonthly({
    kind: "b2b-hourly",
    contractMode: "b2b",
    hourlyRate,
    hoursPerDay,
    workingDaysPerMonth,
    currency: "PLN"
  });

  const dailyResult = calculateB2bDailyToMonthly({
    kind: "b2b-daily",
    contractMode: "b2b",
    dailyRate,
    workingDaysPerMonth,
    hoursPerDay,
    currency: "PLN"
  });

  const monthlyToHourlyResult = calculateMonthlyToHourly({
    kind: "monthly-to-hourly",
    contractMode: "b2b",
    monthlyAmount,
    hoursPerDay,
    workingDaysPerMonth,
    currency: "PLN"
  });

  const uopResult = calculateRate({
    kind: "uop-monthly",
    contractMode: "uop",
    monthlyGross: uopGross,
    currency: "PLN"
  });

  const comparison = compareRates(
    compareMode === "b2b-hourly"
      ? {
          kind: "b2b-hourly",
          contractMode: "b2b",
          hourlyRate: compareRate,
          hoursPerDay,
          workingDaysPerMonth,
          currency: "PLN"
        }
      : compareMode === "b2b-daily"
        ? {
            kind: "b2b-daily",
            contractMode: "b2b",
            dailyRate: compareRate,
            workingDaysPerMonth,
            hoursPerDay,
            currency: "PLN"
          }
        : {
            kind: "b2b-hourly",
            contractMode: "b2b",
            hourlyRate: compareMonthly / (Math.max(1, hoursPerDay) * Math.max(1, workingDaysPerMonth)),
            hoursPerDay,
            workingDaysPerMonth,
            currency: "PLN"
          },
    {
      kind: "uop-monthly",
      contractMode: "uop",
      monthlyGross: compareUopGross,
      currency: "PLN"
    }
  );

  const compareOptionLabel =
    compareMode === "b2b-hourly"
      ? "B2B hourly"
      : compareMode === "b2b-daily"
        ? "B2B daily"
        : "B2B monthly";

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text)]">Rate Calculator</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Local-only salary and rate comparison for Polish IT offers. Results update instantly.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CalcCard
          title="B2B hourly to monthly"
          icon={<Calculator className="h-4 w-4 text-[var(--primary)]" />}
          resultTitle="Estimated monthly gross"
          resultValue={formatPLN(hourlyResult.monthlyGross)}
          resultNote={`Yearly: ${formatPLN(hourlyResult.yearlyGross)}`}
          accentNote="Hourly x hours/day x working days"
        >
          <Field label="Hourly rate (PLN/h)" helper="Gross B2B hourly rate">
            <Input type="number" min="0" step="1" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value) || 0)} />
          </Field>
          <SharedWorkdayFields
            hoursPerDay={hoursPerDay}
            onHoursPerDayChange={setHoursPerDay}
            workingDaysPreset={workingDaysPreset}
            onWorkingDaysPresetChange={setWorkingDaysPreset}
            customWorkingDays={customWorkingDays}
            onCustomWorkingDaysChange={setCustomWorkingDays}
          />
        </CalcCard>

        <CalcCard
          title="B2B daily to monthly"
          icon={<TimerReset className="h-4 w-4 text-[var(--primary)]" />}
          resultTitle="Estimated monthly gross"
          resultValue={formatPLN(dailyResult.monthlyGross)}
          resultNote={`Yearly: ${formatPLN(dailyResult.yearlyGross)}`}
          accentNote="Daily x working days"
        >
          <Field label="Daily rate (PLN/day)" helper="Gross daily B2B rate">
            <Input type="number" min="0" step="1" value={dailyRate} onChange={(e) => setDailyRate(Number(e.target.value) || 0)} />
          </Field>
          <SharedWorkdayFields
            hoursPerDay={hoursPerDay}
            onHoursPerDayChange={setHoursPerDay}
            workingDaysPreset={workingDaysPreset}
            onWorkingDaysPresetChange={setWorkingDaysPreset}
            customWorkingDays={customWorkingDays}
            onCustomWorkingDaysChange={setCustomWorkingDays}
          />
        </CalcCard>

        <CalcCard
          title="Monthly to hourly"
          icon={<ArrowRightLeft className="h-4 w-4 text-[var(--primary)]" />}
          resultTitle="Effective hourly rate"
          resultValue={formatPLN(monthlyToHourlyResult.hourlyEquivalent ?? 0) + "/h"}
          resultNote={`Monthly: ${formatPLN(monthlyToHourlyResult.monthlyGross)} • Yearly: ${formatPLN(monthlyToHourlyResult.yearlyGross)}`}
          accentNote="Monthly amount divided by total monthly hours"
        >
          <Field label="Monthly amount (PLN)" helper="Gross monthly amount">
            <Input type="number" min="0" step="1" value={monthlyAmount} onChange={(e) => setMonthlyAmount(Number(e.target.value) || 0)} />
          </Field>
          <SharedWorkdayFields
            hoursPerDay={hoursPerDay}
            onHoursPerDayChange={setHoursPerDay}
            workingDaysPreset={workingDaysPreset}
            onWorkingDaysPresetChange={setWorkingDaysPreset}
            customWorkingDays={customWorkingDays}
            onCustomWorkingDaysChange={setCustomWorkingDays}
          />
        </CalcCard>

        <CalcCard
          title="UoP comparison"
          icon={<Landmark className="h-4 w-4 text-[var(--accent)]" />}
          resultTitle="Simplified net estimate"
          resultValue={formatPLN(uopResult.estimatedNet ?? 0)}
          resultNote={`Gross: ${formatPLN(uopResult.monthlyGross)} • Yearly: ${formatPLN(uopResult.yearlyGross)}`}
          accentNote="Estimated only - simplified placeholder"
        >
          <Field label="Monthly gross salary (PLN)" helper="UoP gross monthly amount">
            <Input type="number" min="0" step="1" value={uopGross} onChange={(e) => setUopGross(Number(e.target.value) || 0)} />
          </Field>
          <p className="text-xs text-[var(--text-muted)]">
            The net estimate is a simplified placeholder for now. It is intentionally not a tax/legal calculator.
          </p>
        </CalcCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offer comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Compare a B2B option with a UoP monthly offer using the same local monthly-yearly math.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
              <Field label="Option A mode" helper="Choose the B2B format to compare">
                <Select value={compareMode} onChange={(e) => setCompareMode(e.target.value as typeof compareMode)}>
                  <option value="b2b-hourly">B2B hourly</option>
                  <option value="b2b-daily">B2B daily</option>
                  <option value="b2b-monthly">B2B monthly</option>
                </Select>
              </Field>

              {compareMode === "b2b-hourly" && (
                <Field label="Hourly rate (PLN/h)" helper="Option A hourly rate">
                  <Input type="number" min="0" step="1" value={compareRate} onChange={(e) => setCompareRate(Number(e.target.value) || 0)} />
                </Field>
              )}

              {compareMode === "b2b-daily" && (
                <Field label="Daily rate (PLN/day)" helper="Option A daily rate">
                  <Input type="number" min="0" step="1" value={compareRate} onChange={(e) => setCompareRate(Number(e.target.value) || 0)} />
                </Field>
              )}

              {compareMode === "b2b-monthly" && (
                <Field label="Monthly gross (PLN)" helper="Option A monthly amount">
                  <Input type="number" min="0" step="1" value={compareMonthly} onChange={(e) => setCompareMonthly(Number(e.target.value) || 0)} />
                </Field>
              )}

              <SharedWorkdayFields
                hoursPerDay={hoursPerDay}
                onHoursPerDayChange={setHoursPerDay}
                workingDaysPreset={workingDaysPreset}
                onWorkingDaysPresetChange={setWorkingDaysPreset}
                customWorkingDays={customWorkingDays}
                onCustomWorkingDaysChange={setCustomWorkingDays}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
              <Field label="Option B UoP monthly gross" helper="Gross monthly salary">
                <Input type="number" min="0" step="1" value={compareUopGross} onChange={(e) => setCompareUopGross(Number(e.target.value) || 0)} />
              </Field>

              <div className="rounded-lg border border-[color:rgba(240,138,42,0.35)] bg-[var(--accent-soft)] p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Winner</p>
                <p className="mt-1 text-sm font-semibold text-[var(--accent-contrast)]">
                  {comparison.betterMonthly === "equal"
                    ? "Same monthly value"
                    : `${comparison.betterMonthly === "A" ? "Option A" : "Option B"} is higher monthly`}
                </p>
                <p className="mt-1 text-xs text-[var(--accent-contrast)]/80">
                  Difference: {formatPLN(comparison.monthlyDifference)} monthly, {formatPLN(comparison.yearlyDifference)} yearly
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <ComparisonTile
              label={`Option A - ${compareOptionLabel}`}
              result={comparison.optionA}
            />
            <ComparisonTile
              label="Option B - UoP monthly"
              result={comparison.optionB}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CalcCard({
  title,
  icon,
  resultTitle,
  resultValue,
  resultNote,
  accentNote,
  children
}: {
  title: string;
  icon: React.ReactNode;
  resultTitle: string;
  resultValue: string;
  resultNote: string;
  accentNote: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <div className="rounded-lg border border-[color:rgba(240,138,42,0.35)] bg-[var(--accent-soft)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{resultTitle}</p>
          <p className="mt-1 text-lg font-semibold text-[var(--accent-contrast)]">{resultValue}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{resultNote}</p>
        </div>
        <p className="text-xs text-[var(--text-muted)]">{accentNote}</p>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  helper,
  children
}: {
  label: string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      </div>
      <div>{children}</div>
      <p className="text-[11px] text-[var(--text-muted)]">{helper}</p>
    </label>
  );
}

function SharedWorkdayFields({
  hoursPerDay,
  onHoursPerDayChange,
  workingDaysPreset,
  onWorkingDaysPresetChange,
  customWorkingDays,
  onCustomWorkingDaysChange
}: {
  hoursPerDay: number;
  onHoursPerDayChange: (value: number) => void;
  workingDaysPreset: (typeof DAYS_PRESETS)[number]["value"];
  onWorkingDaysPresetChange: (value: (typeof DAYS_PRESETS)[number]["value"]) => void;
  customWorkingDays: number;
  onCustomWorkingDaysChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
      <p className="text-xs font-medium text-[var(--text-secondary)]">Time assumptions</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Hours per day" helper="Default: 8">
          <Input type="number" min="1" step="1" value={hoursPerDay} onChange={(e) => onHoursPerDayChange(Number(e.target.value) || 8)} />
        </Field>
        <Field label="Working days per month" helper="Default: 21, or quick 28 day estimate">
          <Select value={workingDaysPreset} onChange={(e) => onWorkingDaysPresetChange(e.target.value as typeof workingDaysPreset)}>
            {DAYS_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {workingDaysPreset === "custom" && (
        <Field label="Custom working days" helper="Enter the number of days for this scenario">
          <Input type="number" min="0" step="1" value={customWorkingDays} onChange={(e) => onCustomWorkingDaysChange(Number(e.target.value) || 0)} />
        </Field>
      )}
    </div>
  );
}

function ComparisonTile({ label, result }: { label: string; result: ReturnType<typeof calculateRate> }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--text-secondary)]">Monthly gross</span>
        <span className="text-sm font-semibold text-[var(--accent-contrast)]">{formatPLN(result.monthlyGross)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--text-secondary)]">Yearly total</span>
        <span className="text-sm text-[var(--text)]">{formatPLN(result.yearlyGross)}</span>
      </div>
      {result.estimatedNet != null && (
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-sm text-[var(--text-secondary)]">Estimated net</span>
          <span className="text-sm text-[var(--accent-contrast)]">{formatPLN(result.estimatedNet)}</span>
        </div>
      )}
    </div>
  );
}
