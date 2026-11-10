export const PLAN_YEAR = 2026;
export const ANNUAL_OBLIGATION = 24000;
export const money = (value, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);

export function getProgress(distributions, obligation = ANNUAL_OBLIGATION) {
  const completed = distributions
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + d.amount, 0);
  const inFlight = distributions
    .filter((d) => d.status === "processing")
    .reduce((sum, d) => sum + d.amount, 0);
  const remaining = Math.max(0, obligation - completed);
  const available = Math.max(0, remaining - inFlight);
  const percentage =
    obligation > 0 ? Math.min(100, (completed / obligation) * 100) : 100;
  return {
    completed,
    inFlight,
    remaining,
    available,
    percentage,
    status:
      remaining === 0 ? "Satisfied" : inFlight > 0 ? "In flight" : "Pending",
  };
}

export function initialDistributions() {
  return [
    {
      id: "dist-3",
      amount: 6000,
      date: "2026-09-15T12:00:00",
      status: "completed",
      account: "Traditional IRA",
      ending: "4829",
    },
    {
      id: "dist-2",
      amount: 6000,
      date: "2026-06-15T12:00:00",
      status: "completed",
      account: "Traditional IRA",
      ending: "4829",
    },
    {
      id: "dist-1",
      amount: 6000,
      date: "2026-03-15T12:00:00",
      status: "completed",
      account: "Traditional IRA",
      ending: "4829",
    },
  ];
}

export function validateRequest(rawAmount, available) {
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0)
    return "Enter an amount greater than $0.";
  if (Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001)
    return "Use no more than two decimal places.";
  if (amount > available)
    return `You can request up to ${money(available, 2)} of your remaining RMD.`;
  return null;
}
