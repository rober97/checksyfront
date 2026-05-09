import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import { useAuthStore } from '@/stores/authStore'

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
      if (!auth?.user?.id && !auth?.user?._id) {
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
        return list
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

    async markAsRead (id) {
      const prev = this.items
      this.items = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      this.unreadCount = this.items.filter((n) => !n.read).length
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
