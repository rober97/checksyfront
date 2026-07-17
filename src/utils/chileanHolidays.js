/**
 * Feriados legales de Chile, calculados por año.
 *
 * Reglas de traslado implementadas:
 *  - Ley 19.973: 29 jun y 12 oct se corren al lunes de esa semana si caen martes,
 *    miércoles o jueves; al lunes siguiente si caen viernes.
 *  - Art. 35 ter Código del Trabajo (leyes 20.215 y 20.983): si el 18 y 19 caen
 *    martes-miércoles, el lunes 17 es feriado; si caen miércoles-jueves, lo es el
 *    viernes 20; y si caen sábado-domingo, lo es el viernes 17.
 *  - Ley 20.299: si el 31 de octubre cae martes, se adelanta al viernes anterior;
 *    si cae miércoles, se corre al viernes siguiente.
 *  - Ley 20.983: si el 1 de enero cae domingo, el lunes 2 también es feriado.
 */

const pad = n => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`

const fromISO  = s => new Date(`${s}T12:00:00`)
const toISO    = dt => iso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
const addDays  = (s, n) => { const d = fromISO(s); d.setDate(d.getDate() + n); return toISO(d) }
const weekday  = s => fromISO(s).getDay() // 0 domingo … 6 sábado

/** Domingo de Pascua (algoritmo de Meeus/Butcher, calendario gregoriano). */
function easterSunday(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return iso(year, month, day)
}

/**
 * Día Nacional de los Pueblos Indígenas: solsticio de junio en hora de Chile.
 * Tabla explícita porque el solsticio no se puede derivar del calendario.
 */
const SOLSTICIO_JUNIO = {
  2021: 21, 2022: 21, 2023: 21, 2024: 20, 2025: 20,
  2026: 21, 2027: 21, 2028: 20, 2029: 20, 2030: 21,
}

/** Ley 19.973 — traslado al lunes. */
function trasladoLunes(date) {
  const wd = weekday(date)
  if (wd >= 2 && wd <= 4) return addDays(date, 1 - wd)  // martes/miércoles/jueves → lunes previo
  if (wd === 5) return addDays(date, 3)                  // viernes → lunes siguiente
  return date
}

/**
 * Feriados legales del año, ordenados por fecha.
 * @returns {Array<{ date: string, name: string, label: string }>}
 */
export function chileanHolidays(year) {
  const out = []
  const push = (date, name) => out.push({ date, name })

  const anioNuevo = iso(year, 1, 1)
  push(anioNuevo, 'Año Nuevo')
  if (weekday(anioNuevo) === 0) push(iso(year, 1, 2), 'Feriado adicional Año Nuevo')

  const pascua = easterSunday(year)
  push(addDays(pascua, -2), 'Viernes Santo')
  push(addDays(pascua, -1), 'Sábado Santo')

  push(iso(year, 5, 1), 'Día del Trabajo')
  push(iso(year, 5, 21), 'Glorias Navales')
  push(iso(year, 6, SOLSTICIO_JUNIO[year] ?? 20), 'Día de los Pueblos Indígenas')
  push(trasladoLunes(iso(year, 6, 29)), 'San Pedro y San Pablo')
  push(iso(year, 7, 16), 'Virgen del Carmen')
  push(iso(year, 8, 15), 'Asunción de la Virgen')

  const dieciocho = iso(year, 9, 18)
  if (weekday(dieciocho) === 2) push(iso(year, 9, 17), 'Feriado Adicional Fiestas Patrias')
  if (weekday(dieciocho) === 3) push(iso(year, 9, 20), 'Feriado Adicional Fiestas Patrias')
  if (weekday(dieciocho) === 6) push(iso(year, 9, 17), 'Feriado Adicional Fiestas Patrias')
  push(dieciocho, 'Independencia Nacional')
  push(iso(year, 9, 19), 'Glorias del Ejército')

  push(trasladoLunes(iso(year, 10, 12)), 'Encuentro de Dos Mundos')

  const reforma = iso(year, 10, 31)
  const wdReforma = weekday(reforma)
  push(
    wdReforma === 2 ? addDays(reforma, -4) : wdReforma === 3 ? addDays(reforma, 2) : reforma,
    'Iglesias Evangélicas y Protestantes',
  )

  push(iso(year, 11, 1), 'Día de Todos los Santos')
  push(iso(year, 12, 8), 'Inmaculada Concepción')
  push(iso(year, 12, 25), 'Navidad')

  return out
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(h => ({ ...h, label: holidayLabel(h.date) }))
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** Etiqueta corta para un ISO date: "2026-07-16" → "16 Jul". */
export const holidayLabel = date =>
  `${Number(date.slice(8, 10))} ${MESES[Number(date.slice(5, 7)) - 1]}`

/** Solo las fechas ISO del año, listas para precargar en un formulario. */
export const chileanHolidayDates = year => chileanHolidays(year).map(h => h.date)
