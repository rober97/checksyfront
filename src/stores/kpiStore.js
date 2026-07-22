// src/stores/kpi.js
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

export const useKpiStore = defineStore('kpi', {
  state: () => ({
    loading: false,
    error: null,
    data: {},
    // Panel completo de RR.HH. (GET /kpi/rrhh/dashboard). Lo entrega el backend
    // ya agregado: dotación, asistencia, solicitudes, saldos, alertas…
    rrhh: null,
    rrhhLoading: false,
    rrhhError: null
  }),
  getters: {
    vacaciones: (s) => s.data.vacaciones ?? 0,
    asistencias: (s) => s.data.asistencias ?? 0,
    solicitudes: (s) => s.data.solicitudes ?? 0,
    usuariosActivos: (s) => s.data.usuariosActivos ?? 0,
    empresas: (s) => s.data.empresas ?? 0,
    diasAdmin: (s) => s.data.diasAdmin ?? 0,
    ultimoCheck: (s) => s.data.ultimoCheck ?? '—'
  },
  actions: {
    async fetchKpis({ role, companyId, userId, from, to }) {
      this.loading = true
      this.error = null
      try {
        const res = await secureAxios.get('/kpi/summary', {
          params: { role, companyId, userId, from, to }
        })
        if (res.data && res.data.success) {
          this.data = res.data.data || {}
        } else {
          this.data = {}
          this.error = (res.data && res.data.message) || 'No se pudieron cargar los KPIs'
        }
      } catch (e) {
        console.error('fetchKpis error:', e)
        this.data = {}
        this.error = 'Error del servidor al cargar KPIs'
      } finally {
        this.loading = false
      }
    },

    /**
     * Panel de RR.HH. La empresa NO se manda: el backend la resuelve desde el
     * token (scopeToCompany), así que no hay forma de pedir datos de otra.
     */
    async fetchRrhhDashboard({ from, to } = {}) {
      this.rrhhLoading = true
      this.rrhhError = null
      try {
        const res = await secureAxios.get('/kpi/rrhh/dashboard', { params: { from, to } })
        if (res.data?.success) {
          this.rrhh = res.data.data || null
        } else {
          this.rrhhError = res.data?.message || 'No se pudo cargar el panel'
        }
      } catch (e) {
        console.error('fetchRrhhDashboard error:', e)
        this.rrhhError = e?.response?.data?.message || 'Error del servidor al cargar el panel'
      } finally {
        this.rrhhLoading = false
      }
    }
  }
})
