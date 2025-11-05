// Utilidades de fechas (0 dependencias). Úsalas desde cualquier paso.
export function toISO(d) {
  const dt = d instanceof Date ? d : new Date(d + "T00:00:00");
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function fmt(iso) {
  const [y, m, d] = String(iso).split("-");
  return `${d}/${m}/${y}`;
}

export function isWeekend(d) {
  const g = (d instanceof Date ? d : new Date(d)).getDay();
  return g === 0 || g === 6;
}

export function businessDaysCount(startISO, endISO, feriados = []) {
  if (!startISO || !endISO) return 0;
  const ferSet = new Set(feriados);
  const s = new Date(startISO + "T00:00:00");
  const e = new Date(endISO + "T00:00:00");
  if (s > e) return 0;
  let c = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const iso = toISO(d);
    if (isWeekend(d) || ferSet.has(iso)) continue;
    c++;
  }
  return c;
}

export function nextBusinessISO(iso, feriados = []) {
  const ferSet = new Set(feriados);
  let d = new Date(iso + "T00:00:00");
  do d.setDate(d.getDate() + 1);
  while (isWeekend(d) || ferSet.has(toISO(d)));
  return toISO(d);
}

export function sameOrNextBusinessISO(iso, feriados = []) {
  const ferSet = new Set(feriados);
  let d = new Date(iso + "T00:00:00");
  while (isWeekend(d) || ferSet.has(toISO(d))) d.setDate(d.getDate() + 1);
  return toISO(d);
}

export function addBusinessDays(iso, add, feriados = []) {
  const ferSet = new Set(feriados);
  let d = new Date(iso + "T00:00:00");
  let moved = 0;
  while (moved < add) {
    d.setDate(d.getDate() + 1);
    if (isWeekend(d) || ferSet.has(toISO(d))) continue;
    moved++;
  }
  return toISO(d);
}

export function businessDiffExclusiveInclusive(fromISO, toISOstr, feriados = []) {
  // días hábiles entre from (exclusivo) y to (inclusive)
  const ferSet = new Set(feriados);
  const s = new Date(fromISO + "T00:00:00");
  const e = new Date(toISOstr + "T00:00:00");
  if (e <= s) return 0;
  let c = 0;
  for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    d.setDate(d.getDate() + 1);
    if (isWeekend(d) || ferSet.has(toISO(d))) continue;
    c++;
  }
  return c;
}
