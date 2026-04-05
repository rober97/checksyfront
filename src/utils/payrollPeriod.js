const PERIOD_RE = /^\d{4}-\d{2}$/;

function buildPeriod(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function normalizePeriodValue(value = "") {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return buildPeriod(value.getFullYear(), value.getMonth() + 1);
  }

  const raw = String(value || "").trim();
  if (!raw) return "";

  const dashMatch = raw.match(/^(\d{4})-(\d{2})/);
  if (dashMatch) return buildPeriod(dashMatch[1], dashMatch[2]);

  const slashMatch = raw.match(/^(\d{4})\/(\d{2})/);
  if (slashMatch) return buildPeriod(slashMatch[1], slashMatch[2]);

  const compactMatch = raw.match(/^(\d{4})(\d{2})$/);
  if (compactMatch) return buildPeriod(compactMatch[1], compactMatch[2]);

  return raw;
}

export function lastMonthPeriod() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return normalizePeriodValue(d);
}

export function isValidPeriod(period = "") {
  const normalized = normalizePeriodValue(period);
  if (!PERIOD_RE.test(normalized)) return false;

  const month = Number(normalized.slice(5, 7));
  return month >= 1 && month <= 12;
}

export function formatPeriodLabel(period = "") {
  const normalized = normalizePeriodValue(period);
  if (!isValidPeriod(normalized)) return normalized;

  const [year, month] = normalized.split("-");
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return `${months[Number(month) - 1]} ${year}`;
}
