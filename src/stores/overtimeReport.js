// src/stores/overtimeReport.js
// Horas extraordinarias EJECUTADAS: lo efectivamente trabajado por sobre la
// jornada pactada, con o sin pacto previo. El pacto (autorizaciones) vive en
// stores/overtimeAuth.js — son dos cosas distintas y la ley las separa.
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

function buildQuery(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    q.append(k, v)
  })
  return q.toString()
}

export const useOvertimeReportStore = defineStore('overtimeReport', {
  state: () => ({
    rows: [],
    totals: null,
    meta: null,
    loading: false,
    error: null,
  }),

  actions: {
    // params: { from, to, userId?, companyId?, onlyWithOvertime? }
    async fetchSummary(params = {}) {
      try {
        this.loading = true
        this.error = null
        const qs = buildQuery(params)
        const res = await secureAxios.get(`/overtime/summary${qs ? '?' + qs : ''}`)
        this.rows = res?.data?.rows || []
        this.totals = res?.data?.totals || null
        this.meta = res?.data?.meta || null
        return this.rows
      } catch (err) {
        this.error = err?.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async exportSummary(params = {}) {
      const qs = buildQuery(params)
      const res = await secureAxios.get(`/overtime/summary/export${qs ? '?' + qs : ''}`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Horas_extraordinarias_${params.from || ''}_${params.to || ''}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    },
  },
})
