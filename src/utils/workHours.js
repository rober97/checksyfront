// src/utils/workHours.js
//
// Fuente ÚNICA del front para todo cálculo de horas de jornada. Antes esta lógica
// estaba duplicada en GestionHorarios.vue, ProgramacionMensual.vue y SchedulePicker.
// Centralizarla evita que un día "44 h" signifique cosas distintas según la pantalla.
//
// Dos formatos de "weekly" conviven:
//   - Editor (GestionHorarios): { mon: { enabled, segments: [{start,end}] }, ... }
//   - Modelo/backend:           { mon: [{start,end}], ... }
// Los helpers de aquí aceptan ambos donde tiene sentido.

export const DAY_DEFS = [
  { key: 'mon', label: 'Lunes', short: 'Lun' },
  { key: 'tue', label: 'Martes', short: 'Mar' },
  { key: 'wed', label: 'Miércoles', short: 'Mié' },
  { key: 'thu', label: 'Jueves', short: 'Jue' },
  { key: 'fri', label: 'Viernes', short: 'Vie' },
  { key: 'sat', label: 'Sábado', short: 'Sáb' },
  { key: 'sun', label: 'Domingo', short: 'Dom' },
]

const DAY_KEYS = DAY_DEFS.map((d) => d.key)

/** "HH:mm" -> minutos desde medianoche, o null si es inválido. */
export function toMinutes(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null
  const [h, m] = String(hhmm).split(':').map(Number)
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

/** Duración en horas de un tramo start–end (soporta cruce de medianoche). */
export function diffHours(start, end) {
  const s = toMinutes(start)
  let e = toMinutes(end)
  if (s == null || e == null) return 0
  if (e < s) e += 24 * 60
  return +((e - s) / 60).toFixed(2)
}

/**
 * Horas de JORNADA EFECTIVA de un turno programado: el lapso menos la colación,
 * que no es tiempo trabajado (Art. 34). Espeja shiftMinutes() del backend.
 *
 * Un turno 10:00–15:30 con 30 min de colación son 5 h de jornada, no 5,5. Si el
 * día se modeló como dos tramos, la pausa queda entre ellos y cada tramo lleva
 * breakMinutes 0: nunca se descuenta dos veces.
 */
export function shiftHours(shift) {
  const span = diffHours(shift?.start, shift?.end)
  if (span <= 0) return 0
  const pause = Math.max(0, Number(shift?.breakMinutes) || 0) / 60
  return pause >= span ? span : +(span - pause).toFixed(2)
}

/** Suma de horas de una lista de tramos [{start,end}, ...]. */
export function segmentsHours(segments) {
  if (!Array.isArray(segments)) return 0
  return +segments.reduce((sum, s) => sum + diffHours(s?.start, s?.end), 0).toFixed(2)
}

/** Tramos de un día, acepte formato editor ({segments}) o modelo (array). */
function daySegments(dayValue) {
  if (Array.isArray(dayValue)) return dayValue
  if (dayValue && Array.isArray(dayValue.segments)) {
    // En el editor, un día desactivado no cuenta aunque tenga tramos.
    return dayValue.enabled === false ? [] : dayValue.segments
  }
  return []
}

/** Horas de un día (por su valor en weekly). */
export function dayHours(dayValue) {
  return segmentsHours(daySegments(dayValue))
}

/** Total de horas semanales de un objeto weekly (cualquiera de los dos formatos). */
export function weeklyTotalHours(weekly) {
  if (!weekly || typeof weekly !== 'object') return 0
  return +DAY_KEYS.reduce((sum, key) => sum + segmentsHours(daySegments(weekly[key])), 0).toFixed(2)
}

/** Como weeklyTotalHours pero formateado a 1 decimal en string (para chips). */
export function weeklyTotalHoursLabel(weekly) {
  return weeklyTotalHours(weekly).toFixed(1)
}

/* ----------------------------------------------------------------------------
   Resumen visual: agrupa días contiguos con la misma "firma" de horario.
   Para días partidos (09-13 / 15-19) la firma concatena los tramos con " / ".
---------------------------------------------------------------------------- */
export function buildSummaryGroups(weekly) {
  const entries = DAY_DEFS.map((d) => {
    const segs = daySegments(weekly?.[d.key]).filter((s) => s?.start && s?.end)
    if (!segs.length) return { day: d, time: null }
    const time = segs.map((s) => `${s.start}-${s.end}`).join(' / ')
    return { day: d, time }
  })

  const groups = []
  let i = 0
  while (i < entries.length) {
    const cur = entries[i]
    if (!cur.time) { i++; continue }
    let j = i
    while (j + 1 < entries.length && entries[j + 1].time === cur.time) j++
    const label = i === j ? cur.day.short : `${entries[i].day.short}-${entries[j].day.short}`
    groups.push({ key: `${i}-${j}-${cur.time}`, label, time: cur.time })
    i = j + 1
  }
  return groups
}

/* ----------------------------------------------------------------------------
   Horas de contrato sugeridas según el tipo de jornada. Sólo es una SUGERENCIA
   para precargar el campo numérico; el admin siempre puede ajustar el número real.

   El máximo legal NO se calcula aquí: llega como parámetro desde el store
   `legalParams`, que lo lee del backend (payroll_params con vigencia). Si la web
   guardara su propia tabla de la Ley 21.561, un cambio de ley obligaría a
   recordar actualizarla en dos lugares.
---------------------------------------------------------------------------- */
export function suggestedContractHours(jornada, weeklyLimit = null) {
  const limit = Number(weeklyLimit) > 0 ? Number(weeklyLimit) : 0
  switch (jornada) {
    case 'completa': return limit   // jornada completa = máximo legal vigente
    case 'parcial':  return 30      // part-time típico (≤ 30 h, art. 40 bis CT)
    case 'turnos':   return limit   // turnos rotativos suelen pactar la jornada completa
    default:         return 0
  }
}

export default {
  DAY_DEFS,
  toMinutes,
  diffHours,
  segmentsHours,
  shiftHours,
  dayHours,
  weeklyTotalHours,
  weeklyTotalHoursLabel,
  buildSummaryGroups,
  suggestedContractHours,
}
