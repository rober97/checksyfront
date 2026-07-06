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
  },
})
