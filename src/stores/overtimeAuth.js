// src/stores/overtimeAuth.js
// Autorizaciones previas de horas extraordinarias (Art. 30-32 CT / Res. Ex. 38).
// El empleador (jefatura o representante) otorga la HE; el backend valida la
// autoridad de cuatro ojos y notifica al trabajador.
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import { API_URL } from '@/utils/api'

function toQuery(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    q.append(k, v)
  })
  return q.toString()
}

export const useOvertimeAuthStore = defineStore('overtimeAuth', {
  state: () => ({
    list: [],
    loading: false,
    sending: false,
    error: null,
  }),

  actions: {
    _setError(msg) { this.error = msg || 'Error desconocido' },

    async fetchAuthorizations(params = {}) {
      try {
        this.loading = true
        this.error = null
        const q = toQuery(params)
        const url = q
          ? `${API_URL}/overtime-authorizations?${q}`
          : `${API_URL}/overtime-authorizations`
        const res = await secureAxios.get(url)
        this.list = res?.data?.rows || []
        return this.list
      } catch (err) {
        this._setError(err?.response?.data?.message || err.message)
        throw err
      } finally {
        this.loading = false
      }
    },

    // payload: { userId, dayKey 'YYYY-MM-DD', maxMinutes, reason }
    async grant(payload) {
      try {
        this.sending = true
        this.error = null
        const res = await secureAxios.post(`${API_URL}/overtime-authorizations`, payload)
        const auth = res?.data?.authorization
        if (auth) this.list = [auth, ...this.list]
        return auth
      } catch (err) {
        this._setError(err?.response?.data?.message || err.message)
        throw err
      } finally {
        this.sending = false
      }
    },

    /**
     * Autoriza varios días de una sola vez (regularización masiva desde el
     * reporte de ejecutadas). No hay endpoint bulk: el backend valida autoridad
     * y tope por autorización, así que se emiten de a una y en serie —
     * paralelizar sólo multiplicaría los conflictos sobre el mismo día.
     *
     * Cada ítem: { userId, dayKey, maxMinutes, reason, replaceId? }.
     * Devuelve { ok, failed: [{ item, message }] }: un día que falla no
     * cancela los demás, pero tampoco se traga el error.
     */
    async grantMany(items = [], onProgress = null) {
      const failed = []
      let ok = 0
      this.sending = true
      this.error = null
      try {
        for (let i = 0; i < items.length; i += 1) {
          const it = items[i]
          try {
            // Ajustar un día ya autorizado = anular y volver a otorgar: deja
            // las dos huellas en la bitácora, que es lo que corresponde.
            if (it.replaceId) await this.cancel(it.replaceId)
            await secureAxios.post(`${API_URL}/overtime-authorizations`, {
              userId: it.userId,
              dayKey: it.dayKey,
              maxMinutes: it.maxMinutes,
              reason: it.reason || '',
            })
            ok += 1
          } catch (err) {
            failed.push({
              item: it,
              message: err?.response?.data?.message || err.message || 'Error desconocido',
            })
          }
          if (onProgress) onProgress(i + 1, items.length)
        }
      } finally {
        this.sending = false
      }
      if (failed.length) this._setError(failed[0].message)
      return { ok, failed }
    },

    async cancel(id) {
      try {
        this.error = null
        const res = await secureAxios.post(`${API_URL}/overtime-authorizations/${id}/cancel`)
        const auth = res?.data?.authorization
        const i = this.list.findIndex(a => String(a.id) === String(id))
        if (i >= 0 && auth) this.list.splice(i, 1, auth)
        return auth
      } catch (err) {
        this._setError(err?.response?.data?.message || err.message)
        throw err
      }
    },

    // Aprueba una solicitud del trabajador (REQUESTED → APPROVED). Cuatro ojos.
    async approve(id, note = '') {
      try {
        this.sending = true
        this.error = null
        const res = await secureAxios.post(`${API_URL}/overtime-authorizations/${id}/approve`, { note })
        const auth = res?.data?.authorization
        const i = this.list.findIndex(a => String(a.id) === String(id))
        if (i >= 0 && auth) this.list.splice(i, 1, auth)
        return auth
      } catch (err) {
        this._setError(err?.response?.data?.message || err.message)
        throw err
      } finally {
        this.sending = false
      }
    },

    // Rechaza una solicitud del trabajador (REQUESTED → REJECTED).
    async reject(id, note = '') {
      try {
        this.sending = true
        this.error = null
        const res = await secureAxios.post(`${API_URL}/overtime-authorizations/${id}/reject`, { note })
        const auth = res?.data?.authorization
        const i = this.list.findIndex(a => String(a.id) === String(id))
        if (i >= 0 && auth) this.list.splice(i, 1, auth)
        return auth
      } catch (err) {
        this._setError(err?.response?.data?.message || err.message)
        throw err
      } finally {
        this.sending = false
      }
    },
  },
})
