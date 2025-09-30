// src/stores/kpi.js
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

export const useKpiStore = defineStore('kpi', {
  state: () => ({
    loading: false,
    error: null,
    data: {}
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
    }
  }
})
