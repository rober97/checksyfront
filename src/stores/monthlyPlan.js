import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

const asArray = (v) => (Array.isArray(v) ? v : [])

export const useMonthlyPlanStore = defineStore('monthlyPlan', {
  state: () => ({
    loading: false,
    error: null,
    plan: null,
    assignments: [],
    shifts: [],
    unassigned: [],
    range: null,
  }),

  actions: {
    async fetchPlan({ companyId, year, month }) {
      if (!companyId || !year || !month) return
      this.loading = true
      this.error = null
      try {
        const res = await secureAxios.get('/monthly-plan', {
          params: { companyId, year, month },
        })
        const ok = res?.data?.success ?? true
        if (!ok) {
          this.error = res?.data?.message || 'No se pudo cargar la programación'
          return
        }
        this.plan = res?.data?.plan || null
        this.assignments = asArray(res?.data?.assignments)
        this.shifts = asArray(res?.data?.shifts)
        this.unassigned = asArray(res?.data?.unassigned)
        this.range = res?.data?.range || null
      } catch (err) {
        console.error('[monthlyPlan.fetchPlan] error:', err)
        this.error = 'Error cargando la programación mensual'
      } finally {
        this.loading = false
      }
    },

    async prefillMonth({ companyId, year, month }) {
      const res = await secureAxios.post('/monthly-plan/prefill', { companyId, year, month })
      if (!(res?.data?.success ?? true)) {
        throw new Error(res?.data?.message || 'No se pudo pre-rellenar el mes')
      }
      return res.data
    },

    async publishMonth({ companyId, year, month }) {
      const res = await secureAxios.post('/monthly-plan/publish', { companyId, year, month })
      if (!(res?.data?.success ?? true)) {
        throw new Error(res?.data?.message || 'No se pudo publicar el mes')
      }
      this.plan = res?.data?.plan || this.plan
      return res.data
    },

    async unpublishMonth({ companyId, year, month }) {
      const res = await secureAxios.post('/monthly-plan/unpublish', { companyId, year, month })
      if (!(res?.data?.success ?? true)) {
        throw new Error(res?.data?.message || 'No se pudo despublicar el mes')
      }
      this.plan = res?.data?.plan || this.plan
      return res.data
    },

    async clearMonth({ companyId, year, month }) {
      const res = await secureAxios.post('/monthly-plan/clear', { companyId, year, month })
      if (!(res?.data?.success ?? true)) {
        throw new Error(res?.data?.message || 'No se pudo limpiar el mes')
      }
      return res.data
    },

    /**
     * Reemplaza los segmentos planificados de un (userId, date).
     * `segments` es un array de {start, end}. Si llega vacío, deja el día libre.
     */
    async upsertCellShifts({ userId, companyId, date, segments, scheduleId = null }) {
      const res = await secureAxios.post('/scheduled-shifts/upsert-by-date', {
        userId,
        companyId,
        date,
        segments,
        scheduleId,
        source: 'override',
      })
      if (!(res?.data?.success ?? true)) {
        throw new Error(res?.data?.message || 'No se pudo actualizar el día')
      }
      return res.data
    },
  },
})
