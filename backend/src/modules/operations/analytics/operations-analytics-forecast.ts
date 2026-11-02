export const FORECAST_HORIZONS = [7, 14, 30, 60, 90] as const;
export type ForecastHorizon = (typeof FORECAST_HORIZONS)[number];

export const FORECAST_MIN_POINTS = 14;

export type ForecastBacktest = {
  holdoutDays: number;
  mae: number;
  mape: number | null;
};

export type ForecastResult = {
  sufficient: boolean;
  methodology: string;
  message: string;
  forecast: number[];
  lower: number[];
  upper: number[];
  backtest: ForecastBacktest | null;
};

const METHODOLOGY =
  "Holt linear exponential smoothing (alpha 0.35, beta 0.15) on daily counts. Bands are ±1.96 residual standard errors and widen with the horizon. Estimates are not guaranteed outcomes.";

function clampCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

function holtFit(values: number[]): {
  level: number;
  trend: number;
  residuals: number[];
} {
  const alpha = 0.35;
  const beta = 0.15;
  let level = values[0] ?? 0;
  const first = values.slice(0, Math.min(7, values.length));
  let trend = 0;
  if (first.length > 1) {
    trend = (first[first.length - 1]! - first[0]!) / (first.length - 1);
  }
  const residuals: number[] = [];
  for (let i = 1; i < values.length; i += 1) {
    const actual = values[i] ?? 0;
    const previousLevel = level;
    const expected = previousLevel + trend;
    residuals.push(actual - expected);
    level = alpha * actual + (1 - alpha) * expected;
    trend = beta * (level - previousLevel) + (1 - beta) * trend;
  }
  return { level, trend, residuals };
}

function project(
  level: number,
  trend: number,
  residualStd: number,
  horizon: number,
): { forecast: number[]; lower: number[]; upper: number[] } {
  const forecast: number[] = [];
  const lower: number[] = [];
  const upper: number[] = [];
  for (let step = 1; step <= horizon; step += 1) {
    const point = level + step * trend;
    const band = 1.96 * residualStd * Math.sqrt(step);
    forecast.push(clampCount(point));
    lower.push(clampCount(point - band));
    upper.push(clampCount(point + band));
  }
  return { forecast, lower, upper };
}

function residualStd(residuals: number[]): number {
  if (residuals.length === 0) return 0;
  const mean = residuals.reduce((sum, value) => sum + value, 0) / residuals.length;
  const variance =
    residuals.reduce((sum, value) => sum + (value - mean) ** 2, 0) / residuals.length;
  return Math.sqrt(variance);
}

function mape(actual: number[], predicted: number[]): number | null {
  let used = 0;
  let total = 0;
  for (let i = 0; i < actual.length; i += 1) {
    const value = actual[i] ?? 0;
    if (value <= 0) continue;
    used += 1;
    total += Math.abs((value - (predicted[i] ?? 0)) / value);
  }
  if (used === 0) return null;
  return Math.round((total / used) * 1000) / 10;
}

function mae(actual: number[], predicted: number[]): number {
  if (actual.length === 0) return 0;
  const total = actual.reduce(
    (sum, value, index) => sum + Math.abs(value - (predicted[index] ?? 0)),
    0,
  );
  return Math.round((total / actual.length) * 10) / 10;
}

/** Add calendar days to a YYYY-MM-DD key without shifting the date through a timezone. */
export function addCalendarDays(isoDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days),
  );
  return date.toISOString().slice(0, 10);
}

/**
 * Fill missing calendar days with zero. Input dates must already be Asia/Kolkata YYYY-MM-DD keys.
 * The keys are not parsed as instants, so a Kolkata day is not moved to the previous UTC day.
 */
export function fillCalendarDays(
  points: Array<{ date: string; count: number }>,
): Array<{ date: string; count: number }> {
  const byDate = new Map<string, number>();
  for (const point of points) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.date)) continue;
    byDate.set(point.date, (byDate.get(point.date) ?? 0) + point.count);
  }
  const dates = [...byDate.keys()].sort();
  if (dates.length === 0) return [];
  const filled: Array<{ date: string; count: number }> = [];
  for (
    let cursor = dates[0]!;
    cursor <= dates[dates.length - 1]!;
    cursor = addCalendarDays(cursor, 1)
  ) {
    filled.push({ date: cursor, count: byDate.get(cursor) ?? 0 });
    if (filled.length > 4000) break;
  }
  return filled;
}

export function buildCalendarForecast(
  points: Array<{ date: string; count: number }>,
  horizon: number,
): {
  history: Array<{ date: string; actual: number }>;
  projection: Array<{ date: string; estimate: number; lower: number; upper: number }>;
  backtest: { holdoutDays: number; mae: number; mape: number | null; from?: string; to?: string } | null;
  sufficient: boolean;
  message: string;
  methodology: string;
} {
  const filled = fillCalendarDays(points);
  const result = forecastDailySeries(
    filled.map((point) => point.count),
    horizon,
  );
  const lastDate = filled[filled.length - 1]?.date;
  const holdout = result.backtest?.holdoutDays ?? 0;
  return {
    sufficient: result.sufficient,
    message: result.message,
    methodology: result.methodology,
    history: filled.map((point) => ({ date: point.date, actual: point.count })),
    projection: result.forecast.map((estimate, index) => ({
      date: lastDate ? addCalendarDays(lastDate, index + 1) : "",
      estimate,
      lower: result.lower[index] ?? estimate,
      upper: result.upper[index] ?? estimate,
    })),
    backtest: result.backtest
      ? {
          ...result.backtest,
          from: filled[filled.length - holdout]?.date,
          to: lastDate,
        }
      : null,
  };
}

export function forecastDailySeries(
  history: number[],
  horizon: number,
): ForecastResult {
  const values = history.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0));
  if (values.length < FORECAST_MIN_POINTS) {
    return {
      sufficient: false,
      methodology: METHODOLOGY,
      message: "Insufficient historical data to generate a reliable forecast.",
      forecast: [],
      lower: [],
      upper: [],
      backtest: null,
    };
  }

  const holdout = Math.min(14, Math.floor(values.length / 3));
  let backtest: ForecastBacktest | null = null;
  if (holdout >= 3 && values.length - holdout >= FORECAST_MIN_POINTS) {
    const train = values.slice(0, values.length - holdout);
    const actual = values.slice(values.length - holdout);
    const fitted = holtFit(train);
    const predicted = project(
      fitted.level,
      fitted.trend,
      residualStd(fitted.residuals),
      holdout,
    ).forecast;
    backtest = {
      holdoutDays: holdout,
      mae: mae(actual, predicted),
      mape: mape(actual, predicted),
    };
  }

  const fitted = holtFit(values);
  const projected = project(
    fitted.level,
    fitted.trend,
    residualStd(fitted.residuals),
    horizon,
  );
  return {
    sufficient: true,
    methodology: METHODOLOGY,
    message: `Forward estimate for the next ${horizon} days from ${values.length} historical days. This is an estimate, not a guaranteed outcome.`,
    ...projected,
    backtest,
  };
}
