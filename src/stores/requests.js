// src/stores/requests.js
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import { API_URL } from '@/utils/api'

/**
 * Convenciones de API asumidas (ajusta si difieren):
 * - Crear:           POST   /requests
 * - Mis solicitudes: GET    /requests/me        (fallback: /requests?mine=1)
 * - Listado admin:   GET    /requests
 * - Cancelar:        PATCH  /requests/:id/cancel
 * - Balance vac.:    GET    /requests/vacation/balance
 * - Feriados:        GET    /holidays           (fallback: /companies/:id/holidays en companiesStore)
 *
 * Los archivos se envían como FormData (campo "attachments").
 */

function toQuery(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) v.forEach(x => q.append(k, x))
    else q.append(k, v)
  })
  return q.toString()
}

export const useRequestsStore = defineStore('requests', {
  state: () => ({
    // colección del usuario autenticado
    myRequests: [],
    myPagination: { page: 1, limit: 20, total: 0 },
    // colección general (admin/supervisor)
    list: [],
    listPagination: { page: 1, limit: 20, total: 0 },

    // catálogos / auxiliares
    holidays: [],               // ['YYYY-MM-DD', ...]
    vacationBalance: null,      // { daysAvailable: number } o número directo

    // flags
    loading: false,
    sending: false,
    error: null,

    // caches ligeros
    _holidaysFetchedAt: null,
  }),

  getters: {
    myPending: (s) => s.myRequests.filter(r => r.status === 'pending').length,
    myApproved: (s) => s.myRequests.filter(r => r.status === 'approved').length,
    myRejected: (s) => s.myRequests.filter(r => r.status === 'rejected').length,
  },

  actions: {
    _setError(msg) {
      this.error = msg || 'Error desconocido'
    },

    /* ===========================
     * Mis solicitudes (empleado)
     * =========================== */
    async fetchMyRequests(params = {}) {
      // params: { page, limit, status, type, from, to, sortBy, descending }
      try {
        this.loading = true
        this.error = null

        // 1) intenta /requests/me ; 2) fallback /requests?mine=1
        const baseUrl = `${API_URL}/requests`
        const preferMe = `${API_URL}/requests/me`
        let res

        try {
          const q = toQuery(params)
          res = await secureAxios.get(q ? `${preferMe}?${q}` : preferMe)
        } catch {
          const p = { ...params, mine: 1 }
          const q2 = toQuery(p)
          res = await secureAxios.get(q2 ? `${baseUrl}?${q2}` : baseUrl)
        }

        const data = res?.data
        const items = data?.items || data || []
        const total = Number(data?.total ?? items.length)

        this.myRequests = items
        this.myPagination = {
          page: Number(params.page || 1),
          limit: Number(params.limit || 20),
          total
        }
        return items
      } catch (err) {
        console.error('[requests.fetchMyRequests] Error:', err)
        this._setError(err?.response?.data?.message || 'No se pudieron cargar tus solicitudes')
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ==================================================
     * Listado general (admin/supervisor) con filtros
     * ================================================== */
    async fetchRequests(params = {}) {
      try {
        this.loading = true
        this.error = null

        const q = toQuery(params)
        const res = await secureAxios.get(q ? `${API_URL}/requests?${q}` : `${API_URL}/requests`)
        const data = res?.data
        const items = data?.items || data || []
        const total = Number(data?.total ?? items.length)

        this.list = items
        this.listPagination = {
          page: Number(params.page || 1),
          limit: Number(params.limit || 20),
          total
        }
        return items
      } catch (err) {
        console.error('[requests.fetchRequests] Error:', err)
        this._setError(err?.response?.data?.message || 'No se pudo cargar el listado de solicitudes')
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ===============================
     * Crear solicitud (con adjuntos)
     * =============================== */
    async createRequest(payload) {
      // payload puede ser JSON o FormData
      try {
        this.sending = true
        this.error = null

        const isFormData = (typeof FormData !== 'undefined') && (payload instanceof FormData)
        const cfg = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined

        const res = await secureAxios.post(`${API_URL}/requests`, payload, cfg)
        const created = res?.data?.request || res?.data

        // Optimista: si es “mío”, lo empujamos a myRequests
        if (created) {
          // si el backend no incluye el "owner", asumimos que pertenece al usuario actual
          this.myRequests = [created, ...this.myRequests]
          this.myPagination.total = (this.myPagination.total || 0) + 1
        }

        return created
      } catch (err) {
        console.error('[requests.createRequest] Error:', err)
        const status = err?.response?.status
        const msg =
          err?.response?.data?.message ||
          (status === 413 && 'Adjuntos demasiado pesados') ||
          (status === 422 && 'Datos inválidos en la solicitud') ||
          'No se pudo crear la solicitud'
        this._setError(msg)
        throw new Error(msg)
      } finally {
        this.sending = false
      }
    },

    /* ======================
     * Cancelar mi solicitud
     * ====================== */
    async cancelRequest(id) {
      try {
        this.loading = true
        this.error = null

        const res = await secureAxios.patch(`${API_URL}/requests/${id}/cancel`)
        const updated = res?.data?.request || res?.data

        // Refresca en estado local (myRequests y list)
        this.myRequests = this.myRequests.map(r => (r._id === id ? updated : r))
        this.list = this.list.map(r => (r._id === id ? updated : r))

        return updated
      } catch (err) {
        console.error('[requests.cancelRequest] Error:', err)
        this._setError(err?.response?.data?.message || 'No se pudo cancelar la solicitud')
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ======================
     * Subir adjunto suelto
     * ====================== */
    async uploadAttachment(requestId, file) {
      try {
        if (!file) throw new Error('Archivo requerido')
        const fd = new FormData()
        fd.append('attachment', file, file.name || 'archivo')

        const res = await secureAxios.post(`${API_URL}/requests/${requestId}/attachments`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        const updated = res?.data?.request || res?.data
        this.myRequests = this.myRequests.map(r => (r._id === requestId ? updated : r))
        this.list = this.list.map(r => (r._id === requestId ? updated : r))
        return updated
      } catch (err) {
        console.error('[requests.uploadAttachment] Error:', err)
        this._setError(err?.response?.data?.message || 'No se pudo subir el adjunto')
        throw err
      }
    },

    /* =====================
     * Saldo de vacaciones
     * ===================== */
    async fetchVacationBalance() {
      try {
        this.loading = true
        this.error = null

        const res = await secureAxios.get(`${API_URL}/requests/vacation/balance`)
        // Puede venir { success, daysAvailable } o un número
        const data = res?.data
        const daysAvailable = Number(
          data?.daysAvailable ??
          data?.diasDisponibles ??
          data // si es número directo
        )

        this.vacationBalance = isNaN(daysAvailable) ? null : { daysAvailable }
        return this.vacationBalance
      } catch (err) {
        console.error('[requests.fetchVacationBalance] Error:', err)
        this._setError(err?.response?.data?.message || 'No se pudo obtener el saldo de vacaciones')
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ==========
     * Feriados
     * ========== */
    async fetchHolidays(params = {}) {
      // Si tu API de feriados es global: GET /holidays
      // Si depende de empresa, podrías usar el companiesStore (ya lo integramos en la página)
      try {
        this.loading = true
        this.error = null

        const q = toQuery(params)
        const res = await secureAxios.get(q ? `${API_URL}/holidays?${q}` : `${API_URL}/holidays`)
        const list = Array.isArray(res?.data) ? res.data
          : (res?.data?.items || res?.data?.holidays || [])
        // normaliza a 'YYYY-MM-DD'
        this.holidays = list.map(d => typeof d === 'string' ? d : (d.date || d.day || d.fecha)).filter(Boolean)
        this._holidaysFetchedAt = Date.now()
        return this.holidays
      } catch (err) {
        console.error('[requests.fetchHolidays] Error:', err)
        this._setError(err?.response?.data?.message || 'No se pudieron cargar los feriados')
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ===================================================
     * Admin/Supervisor: aprobar o rechazar solicitudes
     * =================================================== */
    async updateStatus(id, action, payload = {}) {
      // action: 'approve' | 'reject'
      try {
        this.loading = true
        this.error = null

        const res = await secureAxios.patch(`${API_URL}/requests/${id}/${action}`, payload)
        const updated = res?.data?.request || res?.data

        // reflejar en colecciones
        this.myRequests = this.myRequests.map(r => (r._id === id ? updated : r))
        this.list = this.list.map(r => (r._id === id ? updated : r))
        return updated
      } catch (err) {
        console.error('[requests.updateStatus] Error:', err)
        const msg = err?.response?.data?.message ||
          (action === 'approve' ? 'No se pudo aprobar' : 'No se pudo rechazar')
        this._setError(msg)
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ============================
     * Utilidades “client-side”
     * ============================ */
    // Detecta traslape simple con una nueva solicitud { startDate, endDate }
    overlapsWithMine({ startDate, endDate }) {
      const s = new Date(startDate)
      const e = new Date(endDate || startDate)
      return this.myRequests.some(r => {
        const rs = new Date(r.startDate)
        const re = new Date(r.endDate || r.startDate)
        return !(re < s || rs > e)
      })
    },
  }
})
