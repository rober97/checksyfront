// =============================================================
// FILE: src/utils/format.js
// Helpers de números/moneda
// =============================================================
export function normalizeMoney(v) { if (v === null || v === undefined) return 0; const str = String(v).replace(/[^\d-]/g, ''); const n = parseInt(str, 10); return isNaN(n) ? 0 : n }
export function normalizeDecimal(v) { if (v === null || v === undefined) return 0; const str = String(v).replace(/,/g, '.').replace(/[^\d.-]/g, ''); const n = parseFloat(str); return isNaN(n) ? 0 : n }
export function formatMoney(n) { const num = Number(n); if (isNaN(num)) return ''; return num.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }) }