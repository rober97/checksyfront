import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import { API_URL } from '@/utils/api'

/* ---------------- utils ---------------- */
function toQuery(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) v.forEach(x => q.append(k, x))
    else q.append(k, v)
  })
  return q.toString()
}

// Normaliza un request del backend (puede venir en { ok, data } o plano)
function normalizeRequest(r) {
  const o = r?.data ? r.data : r
  if (!o) return null
  // Asegura minimos que usa el front
  return {
    _id: o._id || o.id,
    id: o.id || o._id,
    userId: o.userId,
    companyId: o.companyId,
    type: o.type,                 // 'VACATION' | 'ADMIN_DAY' | ...
    status: o.status,             // 'PENDING' | 'APPROVED' | ...
    startDate: o.startDate,
    endDate: o.endDate,
    reason: o.reason || '',
    approverId: o.approverId || null,
    approvedAt: o.approvedAt || null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt
  }
}

/* ---------------------------------------------------------- */

export const useRequestsStore = defineStore('requests', {
  state: () => ({
    // colecciones
    myRequests: [],
    myPagination: { page: 1, limit: 20, total: 0 },

    list: [],
    listPagination: { page: 1, limit: 20, total: 0 },

    // saldos y feriados
    balances: null,              // { VACATION, ADMIN_DAY, COMP_DAY, holds: [...] }
    holidays: [],                // ['YYYY-MM-DD', ...]

    // flags
    loading: false,
    sending: false,
    error: null,

    // cache
    _holidaysFetchedAt: null
  }),

  getters: {
    // contadores del usuario autenticado
    myPending: (s) => s.myRequests.filter(r => r.status === 'PENDING').length,
    myApproved: (s) => s.myRequests.filter(r => r.status === 'APPROVED').length,
    myRejected: (s) => s.myRequests.filter(r => r.status === 'REJECTED').length,

    // accesos rápidos a saldos
    vacationDays: (s) => Number(s.balances?.VACATION ?? 0),
    adminDays: (s) => Number(s.balances?.ADMIN_DAY ?? 0),
    compDays: (s) => Number(s.balances?.COMP_DAY ?? 0),
  },

  actions: {
    _setError(msg) { this.error = msg || 'Error desconocido' },

    /* ===========================
     * Mis solicitudes (empleado)
     * =========================== */
    async fetchMyRequests(params = {}) {
      // Con tu backend, GET /solicitudes sin filtros ya usa req.user por defecto
      try {
        this.loading = true
        this.error = null

        const q = toQuery(params)
        const url = q ? `${API_URL}/solicitudes?${q}` : `${API_URL}/requests`
        const res = await secureAxios.get(url)

        // tus controladores devuelven { ok, total, page, limit, data }
        const payload = res?.data || {}
        const items = Array.isArray(payload) ? payload : (payload.data || [])
        const total = Number(payload.total ?? items.length)
        const page = Number(payload.page ?? params.page ?? 1)
        const limit = Number(payload.limit ?? params.limit ?? 20)

        this.myRequests = items.map(normalizeRequest).filter(Boolean)
        this.myPagination = { page, limit, total }
        return this.myRequests
      } catch (err) {
        console.error('[requests.fetchMyRequests] ', err)
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
      // mismos filtros que tu controlador listRequests
      try {
        this.loading = true
        this.error = null

        const q = toQuery(params)
        const url = q ? `${API_URL}/requests?${q}` : `${API_URL}/requests`
        const res = await secureAxios.get(url)

        const payload = res?.data || {}
        const items = Array.isArray(payload) ? payload : (payload.data || [])
        const total = Number(payload.total ?? items.length)
        const page = Number(payload.page ?? params.page ?? 1)
        const limit = Number(payload.limit ?? params.limit ?? 20)

        this.list = items.map(normalizeRequest).filter(Boolean)
        this.listPagination = { page, limit, total }
        return this.list
      } catch (err) {
        console.error('[requests.fetchRequests] ', err)
        this._setError(err?.response?.data?.message || 'No se pudo cargar el listado de solicitudes')
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ===============================
     * Crear solicitud (JSON o FormData)
     * =============================== */
    async createRequest(payload) {
      try {
        this.sending = true
        this.error = null

        const isFD = (typeof FormData !== 'undefined') && (payload instanceof FormData)
        const cfg = isFD ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined

        const res = await secureAxios.post(`${API_URL}/requests`, payload, cfg)
        const created = normalizeRequest(res?.data?.data || res?.data)

        if (created) {
          // optimista en "míos"
          this.myRequests = [created, ...this.myRequests]
          this.myPagination.total = (this.myPagination.total || 0) + 1
        }
        return created
      } catch (err) {
        console.error('[requests.createRequest] ', err)
        const status = err?.response?.status
        const msg =
          err?.response?.data?.message ||
          (status === 413 && 'Adjuntos demasiado pesados') ||
          (status === 422 && 'Datos inválidos') ||
          'No se pudo crear la solicitud'
        this._setError(msg)
        throw new Error(msg)
      } finally {
        this.sending = false
      }
    },

    /* ======================
     * Cancelar (owner/admin)
     * ====================== */
    async cancelRequest(id) {
      try {
        this.loading = true
        this.error = null
        const res = await secureAxios.patch(`${API_URL}/solicitudes/${id}/cancelar`)
        const updated = normalizeRequest(res?.data?.data || res?.data)

        this.myRequests = this.myRequests.map(r => (String(r._id) === String(id) ? updated : r))
        this.list = this.list.map(r => (String(r._id) === String(id) ? updated : r))
        return updated
      } catch (err) {
        console.error('[requests.cancelRequest] ', err)
        this._setError(err?.response?.data?.message || 'No se pudo cancelar la solicitud')
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ===================================================
     * Admin/Supervisor: aprobar/rechazar/cancelar
     * =================================================== */
    async setStatus(id, status /* 'APPROVED'|'REJECTED'|'CANCELLED' */) {
      try {
        this.loading = true
        this.error = null
        const res = await secureAxios.patch(`${API_URL}/requests/${id}`, { status })
        const updated = normalizeRequest(res?.data?.data || res?.data)

        this.myRequests = this.myRequests.map(r => (String(r._id) === String(id) ? updated : r))
        this.list = this.list.map(r => (String(r._id) === String(id) ? updated : r))
        return updated
      } catch (err) {
        console.error('[requests.setStatus] ', err)
        this._setError(err?.response?.data?.message || 'No se pudo actualizar el estado')
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ========== Balances (nuevo modelo) ========== */
    async fetchBalances() {
      try {
        this.loading = true
        this.error = null
        // ruta nueva preferida
        const res = await secureAxios.get(`${API_URL}/balances/me`)
        // fallback por compatibilidad si hicieras otro endpoint
        const data = res?.data?.data ?? res?.data
        // Estructura esperada: { VACATION, ADMIN_DAY, COMP_DAY, holds: [...] }
        this.balances = data || { VACATION: 0, ADMIN_DAY: 0, COMP_DAY: 0, holds: [] }
        return this.balances
      } catch (err) {
        console.error('[requests.fetchBalances] ', err)
        this._setError(err?.response?.data?.message || 'No se pudieron obtener los saldos')
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ========== Feriados ========== */
    async fetchHolidays(params = {}) {
      try {
        this.loading = true
        this.error = null
        const q = toQuery(params)
        const url = q ? `${API_URL}/holidays?${q}` : `${API_URL}/holidays`
        const res = await secureAxios.get(url)
        const list = Array.isArray(res?.data) ? res.data
          : (res?.data?.items || res?.data?.holidays || [])
        this.holidays = list
          .map(d => typeof d === 'string' ? d : (d.date || d.day || d.fecha))
          .filter(Boolean)
        this._holidaysFetchedAt = Date.now()
        return this.holidays
      } catch (err) {
        console.error('[requests.fetchHolidays] ', err)
        this._setError(err?.response?.data?.message || 'No se pudieron cargar los feriados')
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ========== KPIs / Summary ========== */
    async fetchSummary(params = {}) {
      try {
        this.loading = true
        this.error = null
        // tienes dos routers posibles: /requests/summary y /summary
        const q = toQuery(params)
        const try1 = () => secureAxios.get(q ? `${API_URL}/requests/summary?${q}` : `${API_URL}/requests/summary`)
        const try2 = () => secureAxios.get(q ? `${API_URL}/summary?${q}` : `${API_URL}/summary`)
        let res
        try { res = await try1() } catch { res = await try2() }
        return res?.data?.data ?? res?.data
      } catch (err) {
        console.error('[requests.fetchSummary] ', err)
        this._setError(err?.response?.data?.message || 'No se pudo obtener el resumen')
        throw err
      } finally {
        this.loading = false
      }
    },

    /* ========== Export XLSX ========== */
    async exportXlsx(params = {}) {
      try {
        const q = toQuery(params)
        const url = q ? `${API_URL}/solicitudes/export/xlsx?${q}` : `${API_URL}/solicitudes/export/xlsx`
        const res = await secureAxios.get(url, { responseType: 'blob' })
        return res.data // blob → tú decides descargar en el componente
      } catch (err) {
        console.error('[requests.exportXlsx] ', err)
        this._setError(err?.response?.data?.message || 'No se pudo exportar')
        throw err
      }
    },

    /* ========== Utilidad: traslape local ========== */
    overlapsWithMine({ startDate, endDate }) {
      const s = new Date(startDate)
      const e = new Date(endDate || startDate)
      return this.myRequests.some(r => {
        const rs = new Date(r.startDate)
        const re = new Date(r.endDate || r.startDate)
        return !(re < s || rs > e)
      })
    },

    async bulkUpdate(ids, estado) {
      await secureAxios.patch(`/requests/bulk`, { ids, estado })
      this.items = this.items.map(r => ids.includes(r._id) ? { ...r, estado } : r)
    },

    async exportCSV(params = {}) {
      // Ajusta a tu export real (CSV/Excel)
      const { data } = await secureAxios.get('/requests/export', {
        params: { ...this.lastQuery, ...params },
        responseType: 'blob'
      })
      return data // Blob
    },
  }
})
