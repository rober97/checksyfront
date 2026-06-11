import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import { useAuthStore } from '@/stores/authStore'
import { useAsistenciaStore } from '@/stores/asistenciaStore'

const PENDING_KEYWORDS = /(salida|clock[\s-]?out|\bexit\b)/i
const PENDING_REASON =
  /(olvid|pendient|sin\s+marc|no\s+marc|no\s+registrad|missing|forgot|unmarked|confirm)/i

function asObject (value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value
}

function detectAction ({ type, title, body, meta }) {
  const metaText = [
    meta?.action,
    meta?.kind,
    meta?.reason,
    meta?.event,
    meta?.code,
    meta?.label,
    meta?.message,
  ].filter(Boolean).join(' ')

  const text = `${type} ${title} ${body} ${metaText}`.toLowerCase()
  const hasExitWord = PENDING_KEYWORDS.test(text)
  const hasReason = PENDING_REASON.test(text)
  const hasFlag = !!(
    meta?.missingExit ||
    meta?.requiresExitConfirmation ||
    meta?.allowExitConfirmation ||
    meta?.actionable
  )

  if ((type === 'attendance' && hasExitWord && hasReason) || (hasExitWord && hasFlag)) {
    return 'confirm-missed-exit'
  }
  return undefined
}

function iconForType (type, action) {
  if (action === 'confirm-missed-exit') return 'error_outline'
  if (type === 'attendance') return 'schedule'
  if (type === 'request') return 'description'
  return 'notifications_active'
}

function timeAgo (ms) {
  if (!ms) return ''
  const diff = Date.now() - ms
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Hace un momento'
  if (min < 60) return `Hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `Hace ${d} d`
  return new Date(ms).toLocaleDateString()
}

function normalize (raw) {
  if (!raw) return null
  const id = raw._id || raw.id
  if (!id) return null

  const type = String(raw.type || 'system').trim().toLowerCase() || 'system'
  const meta =
    asObject(raw.meta) || asObject(raw.data) || asObject(raw.payload) || {}

  const title = raw.title || raw.subject || 'Notificación'
  const body = raw.body || raw.message || raw.text || ''

  const createdAtRaw = raw.createdAt || raw.date || raw.timestamp
  const createdAtMs = createdAtRaw ? new Date(createdAtRaw).getTime() : 0
  const createdAtISO = createdAtMs ? new Date(createdAtMs).toISOString() : undefined

  const read =
    typeof raw.read === 'boolean'
      ? raw.read
      : !!raw.readAt || raw.status === 'READ'

  const resolved =
    typeof raw.resolved === 'boolean'
      ? raw.resolved
      : !!raw.resolvedAt || !!meta?.resolved

  const action = raw.action || meta.action || detectAction({ type, title, body, meta })

  return {
    id: String(id),
    type,
    title,
    body,
    meta,
    read,
    resolved,
    action,
    icon: iconForType(type, action),
    severity: raw.severity || 'info',
    createdAtMs,
    createdAtISO,
    time: timeAgo(createdAtMs),
  }
}

function sortNewest (a, b) {
  return (b.createdAtMs || 0) - (a.createdAtMs || 0)
}

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [],
    unreadCount: 0,
    loading: false,
    inited: false,
    error: null,
    lastFetchedAt: 0,
  }),

  getters: {
    pendingMissedExits: (state) =>
      state.items.filter(
        (n) => n.action === 'confirm-missed-exit' && !n.resolved
      ),
  },

  actions: {
    async fetchLatest ({ limit = 20 } = {}) {
      const auth = useAuthStore()
      const userId = auth?.user?.id || auth?.user?._id
      if (!userId) {
        this.items = []
        this.unreadCount = 0
        this.inited = true
        return []
      }
      this.loading = true
      this.error = null
      try {
        const res = await secureAxios.get('/notifications', {
          params: { page: 1, limit },
        })
        const payload = res?.data
        const rawList = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []
        const list = rawList.map(normalize).filter(Boolean)
        list.sort(sortNewest)
        this.items = list
        this.unreadCount =
          typeof payload?.unreadCount === 'number'
            ? payload.unreadCount
            : list.filter((n) => !n.read).length
        this.lastFetchedAt = Date.now()

        // Detección client-side de salidas olvidadas que el backend aún no
        // notificó (sólo se crea notificación cuando el trabajador marca una
        // nueva entrada al día siguiente). Inyectamos un item sintético por
        // cada entrada huérfana en días anteriores a hoy.
        await this.appendSyntheticMissedExits(userId)

        return this.items
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Error al cargar notificaciones'
        this.error = msg
        return this.items
      } finally {
        this.loading = false
        this.inited = true
      }
    },

    async appendSyntheticMissedExits (userId) {
      try {
        const asistencia = useAsistenciaStore()
        if (typeof asistencia.fetchHistorialEmpleado !== 'function') return

        const history = await asistencia.fetchHistorialEmpleado({ employeeId: userId })
        const asistencias = Array.isArray(history?.asistencias) ? history.asistencias : []
        if (asistencias.length === 0) return

        const sorted = [...asistencias].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        )

        const dayKey = (ts) => {
          const d = new Date(ts)
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${y}-${m}-${day}`
        }
        const hoyKey = dayKey(Date.now())

        const orphanEntradas = []
        for (let i = 0; i < sorted.length; i++) {
          const m = sorted[i]
          if (m.tipo !== 'entrada') continue

          let hasExit = false
          for (let j = i + 1; j < sorted.length; j++) {
            if (sorted[j].tipo === 'salida') { hasExit = true; break }
            if (sorted[j].tipo === 'entrada') break
          }

          if (!hasExit && dayKey(m.timestamp) < hoyKey) {
            orphanEntradas.push(m)
          }
        }

        // IDs de asistencia ya cubiertos por una notificación real (resueltas o no)
        const coveredIds = new Set(
          this.items
            .filter((n) => n.action === 'confirm-missed-exit')
            .map((n) => n.meta?.attendanceId || n.meta?.attendance?.id)
            .filter(Boolean)
            .map(String)
        )

        const synthetic = orphanEntradas
          .filter((m) => !coveredIds.has(String(m._id)))
          .map((m) => {
            const ms = new Date(m.timestamp).getTime()
            return {
              id: `synthetic-missed-${m._id}`,
              type: 'attendance',
              title: 'Asistencia sin salida registrada',
              body: `El día ${new Date(m.timestamp).toLocaleDateString('es-CL')} marcaste entrada pero no registraste la salida. Revísalo y corrige el horario.`,
              meta: {
                kind: 'MISSING_CHECKOUT',
                action: 'confirm-missed-exit',
                missingExit: true,
                requiresExitConfirmation: true,
                actionable: true,
                attendanceId: String(m._id),
                attendance: {
                  id: String(m._id),
                  tipo: 'entrada',
                  timestamp: m.timestamp,
                  dayKey: m.dayKey || dayKey(m.timestamp),
                },
              },
              read: false,
              resolved: false,
              action: 'confirm-missed-exit',
              icon: 'error_outline',
              severity: 'warning',
              createdAtMs: ms,
              createdAtISO: new Date(ms).toISOString(),
              time: timeAgo(ms),
              synthetic: true,
            }
          })

        if (synthetic.length === 0) return

        this.items = [...synthetic, ...this.items].sort(sortNewest)
        this.unreadCount = this.items.filter((n) => !n.read).length
      } catch (e) {
        // detección silenciosa — no interrumpe el flujo de notificaciones
      }
    },

    /**
     * Registra la salida olvidada (resuelve una entrada huérfana) desde la web.
     * Solo el dueño de la marca puede hacerlo (validado en el backend).
     * @param {{ attendanceId:string, timestamp:string, mood?:string, note?:string }} payload
     */
    async resolveMissedExit ({ attendanceId, timestamp, mood = 'ok', note = '' }) {
      if (!attendanceId) throw new Error('attendanceId requerido')
      const tzOffset = -new Date().getTimezoneOffset()
      const { data } = await secureAxios.post('/attendance/resolve-missed-exit', {
        attendanceId,
        timestamp,
        mood,
        note,
        tzOffset,
        client: { platform: 'web' },
      })
      // Marca como resuelta en memoria cualquier notificación (real o sintética)
      // asociada a esta entrada, para que deje de figurar como pendiente.
      const idStr = String(attendanceId)
      this.items = this.items.map((n) => {
        const aid = n.meta?.attendanceId || n.meta?.attendance?.id
        return aid && String(aid) === idStr ? { ...n, resolved: true, read: true } : n
      })
      this.unreadCount = this.items.filter((n) => !n.read).length
      return data
    },

    async markAsRead (id) {
      const target = this.items.find((n) => n.id === id)
      const prev = this.items
      this.items = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      this.unreadCount = this.items.filter((n) => !n.read).length
      // Las sintéticas no existen en el backend: sólo se marcan en memoria.
      if (target?.synthetic) return
      try {
        await secureAxios.patch(`/notifications/${id}/read`)
      } catch (err) {
        this.items = prev
        this.unreadCount = prev.filter((n) => !n.read).length
        this.error =
          err?.response?.data?.message ||
          err?.message ||
          'Error al marcar la notificación'
      }
    },

    async markAllAsRead () {
      const prev = this.items
      this.items = prev.map((n) => ({ ...n, read: true }))
      this.unreadCount = 0
      const hasReal = prev.some((n) => !n.synthetic && !n.read)
      if (!hasReal) return // sólo había sintéticas — nada que llamar al backend
      try {
        await secureAxios.post('/notifications/mark-all-read')
      } catch (err) {
        this.items = prev
        this.unreadCount = prev.filter((n) => !n.read).length
        this.error =
          err?.response?.data?.message ||
          err?.message ||
          'No se pudieron marcar todas como leídas'
      }
    },

    reset () {
      this.items = []
      this.unreadCount = 0
      this.loading = false
      this.inited = false
      this.error = null
      this.lastFetchedAt = 0
    },
  },
})
