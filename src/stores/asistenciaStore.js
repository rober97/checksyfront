import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

const UI_MOOD = new Set(['great', 'good', 'ok', 'tired', 'bad'])

function normalizeMood (mood) {
  if (!mood) return ''
  const m = String(mood).toLowerCase().trim()
  if (UI_MOOD.has(m)) return m
  const map = {
    'excelente': 'great',
    'bien': 'good',
    'normal': 'ok',
    'cansado': 'tired',
    'mal': 'bad'
  }
  return map[m] || m
}

/**
 * Id idempotente por marca. Permite reintentar la sincronización de una marca
 * offline sin duplicarla en el libro (el backend indexa clientMarkId como único).
 */
function makeClientMarkId () {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function toQuery (obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  )
}

export const useAsistenciaStore = defineStore('asistencia', {
  state: () => ({
    records: [],               // todas las asistencias
    loading: false,
    employeeRecords: [],       // asistencias por empleado
    error: null,

    // caches opcionales
    _kpiCache: {},             // por userId
    _settingsCache: {},        // por userId
    _goalCache: {},            // por userId
  }),

  actions: {
    // ==================== TUS ACCIONES ORIGINALES ====================
    async fetchAllRecords () {
      this.loading = true
      try {
        const res = await secureAxios.get('/attendance')
        if (res.data.success) {
          this.records = res.data.attendance || []
          this.error = null
        } else {
          this.records = []
          this.error = res.data.message || 'Error loading attendance records'
        }
      } catch (err) {
        console.error('fetchAllRecords error:', err)
        this.records = []
        this.error = 'Server error while loading attendance'
      } finally {
        this.loading = false
      }
    },

    async fetchHistorialEmpleado ({ employeeId, from = null, to = null }) {
      try {
        const res = await secureAxios.get(`/attendance/history/${employeeId}`, {
          params: {
            ...(from && { from }),
            ...(to && { to })
          }
        })

        if (res.data.success) {
          return res.data.data // { _id, nombre, rut, asistencias }
        } else {
          throw new Error(res.data.message || 'Error al obtener historial de asistencias')
        }
      } catch (err) {
        console.error('fetchHistorialEmpleado error:', err)
        throw err
      }
    },

    async fetchRecordsByEmployee () {
      try {
        const res = await secureAxios.get('/attendance/by-employee')
        if (res.data.success) {
          this.employeeRecords = res.data.data
        } else {
          this.error = res.data.message || 'Error loading employee records'
        }
      } catch (err) {
        console.error('fetchRecordsByEmployee error:', err)
        this.error = 'Server error while loading employee attendance'
      }
    },

    async exportEmployeeExcel ({ employeeId, from, to }) {
      try {
        const res = await secureAxios.post(
          '/attendance/export',
          { employeeId, from, to },
          { responseType: 'blob' }
        )

        const blob = new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `attendance_${employeeId}.xlsx`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error('exportEmployeeExcel error:', err)
        throw err
      }
    },

    async crearAsistencia ({
      userId,
      tipo,            // 'entrada' | 'salida'
      mood,            // 'great' | 'good' | 'ok' | 'tired' | 'bad' (o ES -> se normaliza)
      note = '',
      ubicacion = null,     // { lat, lng }
      timestamp = Date.now(),
      client = null,
      // Traza offline: si la marca se capturó sin conexión, `capturedAt` es la
      // hora REAL del evento y manda sobre el reloj del servidor.
      deferred = false,
      capturedAt = null,
      clientMarkId = ''
    }) {
      if (!userId || !tipo || !mood) {
        throw new Error('Faltan campos obligatorios (userId, tipo, mood)')
      }

      const clientInfo = client || {
        platform: (navigator?.userAgentData?.platform || navigator?.platform || 'web'),
        appVersion: (import.meta?.env?.VITE_APP_VERSION || 'web')
      }

      const ubic = (ubicacion && typeof ubicacion === 'object')
        ? { lat: Number(ubicacion.lat), lng: Number(ubicacion.lng) }
        : null

      try {
        this.loading = true
        this.error = null

        const payload = {
          userId,
          tipo,
          mood: normalizeMood(mood),
          note: note ?? '',
          ubicacion: ubic,
          timestamp,
          client: clientInfo,
          // Zona horaria del dispositivo: el backend la necesita para fijar el
          // día calendario local de la marca (dayKey).
          tzOffset: -new Date().getTimezoneOffset(),
          ...(deferred ? { deferred: true, capturedAt: capturedAt || timestamp } : {}),
          ...(clientMarkId ? { clientMarkId } : {})
        }

        const res = await secureAxios.post('/attendance/new', payload)

        if (res?.data?.success) {
          const saved = res.data.asistencia
          this.records = [saved, ...this.records]
          return saved
        }

        const msg = res?.data?.message || 'No se pudo crear la asistencia'
        this.error = msg
        throw new Error(msg)
      } catch (err) {
        const backendMsg = err?.response?.data?.message || err?.message || 'Error al crear asistencia'
        console.error('[crearAsistencia] Error:', backendMsg)
        this.error = typeof backendMsg === 'string' ? backendMsg : 'Error al crear asistencia'
        throw new Error(this.error)
      } finally {
        this.loading = false
      }
    },

    // ==================== NUEVAS PARA EL COMPONENTE ====================

    async fetchKPIs ({ userId }) {
      if (!userId) throw new Error('userId requerido')
      try {
        const res = await secureAxios.get('/attendance/kpis', { params: { userId } })
        const data = res?.data?.data || res?.data?.kpis || res?.data || {}
        this._kpiCache[userId] = data
        return {
          asistenciasMes: data.asistenciasMes ?? null,
          horasMes: data.horasMes ?? null,
          puntualidad: data.puntualidad ?? null,
          vacaciones: data.vacaciones ?? null,
          primerCheck: data.primerCheck ?? null,
          ultimoCheck: data.ultimoCheck ?? null,
          horasHoy: data.horasHoy ?? null
        }
      } catch (err) {
        console.error('fetchKPIs error:', err)
        if (this._kpiCache[userId]) return this._kpiCache[userId] // fallback cache
        throw err
      }
    },

    async fetchActivity ({ userId, limit = 20 }) {
      if (!userId) throw new Error('userId requerido')
      try {
        const res = await secureAxios.get('/attendance/activity', {
          params: toQuery({ userId, limit })
        })
        return res?.data?.data || res?.data?.activity || []
      } catch (err) {
        console.error('fetchActivity error:', err)
        return [] // UI tolerante
      }
    },

    async fetchStreak ({ userId, days = 14 }) {
      if (!userId) throw new Error('userId requerido')
      try {
        const res = await secureAxios.get('/attendance/streak', {
          params: toQuery({ userId, days })
        })
        return res?.data?.data || res?.data?.streak || []
      } catch (err) {
        console.error('fetchStreak error:', err)
        return []
      }
    },

    async getWorkHoursGoal ({ userId }) {
      if (!userId) throw new Error('userId requerido')
      try {
        const res = await secureAxios.get('/attendance/work-goal', { params: { userId } })
        const hoursRaw = (res?.data?.data && res.data.data.hours != null)
          ? res.data.data.hours
          : (res?.data?.hours != null ? res.data.hours : res?.data)

        const hours = Number(hoursRaw)
        if (!Number.isNaN(hours)) {
          this._goalCache[userId] = hours
          return hours
        }
        return this._goalCache[userId] ?? 9
      } catch (err) {
        console.error('getWorkHoursGoal error:', err)
        return this._goalCache[userId] ?? 9
      }
    },

    async saveWorkHoursGoal ({ userId, hours }) {
      if (!userId) throw new Error('userId requerido')
      try {
        await secureAxios.post('/attendance/work-goal', { userId, hours })
        this._goalCache[userId] = Number(hours) || 0
        return true
      } catch (err) {
        console.error('saveWorkHoursGoal error:', err)
        throw err
      }
    },

    async getSettings ({ userId }) {
      try {
        if (!userId) throw new Error('userId requerido')
        const res = await secureAxios.get('/attendance/settings', { params: { userId } })
        const s = res?.data?.data || res?.data?.settings || {}
        this._settingsCache[userId] = s
        return s
      } catch (err) {
        console.error('getSettings error:', err)
        return userId && this._settingsCache[userId]
          ? this._settingsCache[userId]
          : { autoLocation: true, offlineMode: true, soundEffects: true, haptics: true }
      }
    },

    async saveSettings ({ userId, settings }) {
      if (!userId) throw new Error('userId requerido')
      try {
        await secureAxios.post('/attendance/settings', { userId, settings })
        this._settingsCache[userId] = settings
        return true
      } catch (err) {
        console.error('saveSettings error:', err)
        throw err
      }
    },

    /**
     * Sincroniza las marcas que quedaron pendientes por falta de conexión.
     *
     * Van una a una por POST /attendance/new con la traza offline
     * ({ deferred, capturedAt, clientMarkId }), que es el único camino sellado:
     *  - conserva la hora REAL del evento (capturedAt manda como hora oficial),
     *  - la sella como capturada sin conexión (captureMode 'offline', hash v5),
     *  - es idempotente: si el reintento repite un clientMarkId no se duplica,
     *  - emite comprobante y queda en la bitácora.
     *
     * Antes había un intento previo contra POST /attendance/bulk, que insertaba
     * sin identidad, sin cadena de hashes ni bitácora. Ese endpoint ya no existe.
     */
    async syncPending (pendientes) {
      if (!Array.isArray(pendientes) || pendientes.length === 0) return { ok: 0, fail: 0 }

      let ok = 0; let fail = 0
      for (const p of pendientes) {
        try {
          // La hora real de la marca es la que se capturó offline, no la de ahora.
          const capturedAt = new Date(p.capturedAt || p.timestamp || Date.now()).toISOString()
          await this.crearAsistencia({
            ...p,
            mood: normalizeMood(p.mood),
            timestamp: capturedAt,
            deferred: true,
            capturedAt,
            // Id estable por marca: si ya se insertó, el backend la deduplica.
            clientMarkId: p.clientMarkId || makeClientMarkId(),
          })
          ok++
        } catch {
          fail++
        }
      }
      return { ok, fail }
    }
  }
})
