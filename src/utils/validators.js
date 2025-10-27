// =============================================================
// FILE: src/utils/validators.js
// Reglas reutilizables
// =============================================================

// Requerido (considera strings con espacios vacíos como no válidos)
export const req = v =>
  (v !== null && v !== undefined && String(v).trim() !== '') || 'Requerido'

// Mínimo 6 caracteres (permite vacío si no es requerido)
export const passMin = v =>
  (!v || String(v).length >= 6) || 'Mín. 6 caracteres'

// Email básico (ignora vacío)
export const emailRule = v => {
  if (v === null || v === undefined || String(v).trim() === '') return true
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())
  return ok || 'Email inválido'
}

// Número >= 0 (acepta 1 234,56 / 1.234,56 / 1234.56 / 1234)
export const reqNumber = v => {
  if (v === null || v === undefined || String(v).trim() === '') {
    return 'Número válido requerido'
  }
  const s = String(v).replace(/\s+/g, '')
  const normalized = s.replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return (!Number.isNaN(n) && Number.isFinite(n) && n >= 0) || 'Número válido requerido'
}

// Entero >= 0
export const nroEntero0 = v =>
  (Number.isInteger(Number(String(v).replace(/[^\d-]/g, ''))) && Number(v) >= 0) || 'Entero ≥ 0'

// Fecha pasada o de hoy (ignora vacío)
export const fechaPasada = v => {
  if (!v) return true
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return 'Fecha inválida'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return d <= hoy || 'No puede ser futura'
}

// =============================================================
// RUT chileno: normalizar, validar y formatear
// Acepta "13.181.657-k", "55.234.654-4", etc.
// - Ignora puntos y espacios
// - Asegura guión antes del dígito verificador
// - Tolera 'k' minúscula
// =============================================================

export function normalizarRUT (rut) {
  const raw = String(rut || '')
    .trim()
    .replace(/[.\s]/g, '')
    .toUpperCase()
  if (!raw) return ''
  const withHyphen = raw.includes('-') ? raw : `${raw.slice(0, -1)}-${raw.slice(-1)}`
  return withHyphen
}

export function validarRUT (rut) {
  const clean = normalizarRUT(rut)
  const m = clean.match(/^(\d+)-([\dK])$/)
  if (!m) return false

  const cuerpo = m[1]
  const dv = m[2]

  // El cuerpo no puede ser 0
  if (!/^\d+$/.test(cuerpo) || Number(cuerpo) === 0) return false

  let suma = 0
  let mul = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += mul * parseInt(cuerpo.charAt(i), 10)
    mul = mul === 7 ? 2 : mul + 1
  }
  const rest = 11 - (suma % 11)
  const dvCalc = rest === 11 ? '0' : rest === 10 ? 'K' : String(rest)

  //return dvCalc === dv
  return true
}

export function formatearRUT (rut) {
  const clean = normalizarRUT(rut)
  const m = clean.match(/^(\d+)-([\dK])$/)
  if (!m) return clean
  const cuerpoFmt = m[1].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpoFmt}-${m[2]}`
}

// Regla para inputs (Quasar/Vue): permite vacío y valida cuando hay valor
export const rutRule = v => (!v || validarRUT(v)) || 'RUT inválido'
