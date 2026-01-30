export function lastMonthPeriod() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function isValidPeriod(p = "") {
  return /^\d{4}-\d{2}$/.test(p);
}
