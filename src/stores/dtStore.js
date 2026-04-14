// src/stores/dtStore.js
// Store para el módulo DT Compliance (Dirección del Trabajo — Chile).
//
// Gestiona:
//   - Generación y descarga de los 6 reportes DT obligatorios.
//   - Tokens de acceso de fiscalizadores.
//   - Verificación de comprobantes (hash SHA-256).
//   - Consentimiento DT y personalEmail del trabajador.
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import publicAxios from '@/utils/publicRequest'

export const DT_REPORT_KINDS = [
  {
    key: 'daily-attendance',
    label: 'Asistencia diaria',
    description: 'Listado de marcas (entradas y salidas) por trabajador y día.',
    icon: 'fact_check',
  },
  {
    key: 'daily-shift',
    label: 'Jornada diaria',
    description: 'Horas ordinarias trabajadas por día, descansos y anomalías.',
    icon: 'schedule',
  },
  {
    key: 'sundays-holidays',
    label: 'Domingos y festivos',
    description: 'Marcas registradas en domingos o feriados legales.',
    icon: 'event_busy',
  },
  {
    key: 'modifications',
    label: 'Modificaciones de registros',
    description: 'Bitácora de cambios sobre marcas de asistencia (auditoría).',
    icon: 'edit_note',
  },
  {
    key: 'weekly-distribution',
    label: 'Distribución semanal (40h)',
    description: 'Resumen semanal de jornada conforme a la Ley 21.561.',
    icon: 'view_week',
  },
  {
    key: 'overtime',
    label: 'Horas extraordinarias',
    description: 'Horas extras pactadas y ejecutadas.',
    icon: 'alarm_add',
  },
]

function buildQuery(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  return new URLSearchParams(clean).toString()
}

export const useDtStore = defineStore('dt', {
  state: () => ({
    loading: false,
    error: null,
    inspectorTokens: [],
    lastVerify: null,
    consent: null,
  }),

  actions: {
    /**
     * Descarga un reporte DT como XLSX. Recibe kind y filtros.
     */
    async downloadReport(kind, params = {}) {
      this.loading = true
      this.error = null
      try {
        const qs = buildQuery(params)
        const res = await secureAxios.get(`/dt/reports/${kind}${qs ? '?' + qs : ''}`, {
          responseType: 'blob',
        })
        const blob = new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `DT_${kind}_${new Date().toISOString().slice(0, 10)}.xlsx`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        return { ok: true }
      } catch (err) {
        this.error = err?.response?.data?.message || err.message
        return { ok: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /** Gestión de tokens de fiscalizador DT */
    async fetchInspectorTokens() {
      this.loading = true
      try {
        const { data } = await secureAxios.get('/dt/inspector-tokens')
        this.inspectorTokens = data.rows || []
      } finally {
        this.loading = false
      }
    },

    async issueInspectorToken(payload) {
      const { data } = await secureAxios.post('/dt/inspector-tokens', payload)
      await this.fetchInspectorTokens()
      return data.access
    },

    async revokeInspectorToken(id) {
      await secureAxios.post(`/dt/inspector-tokens/${id}/revoke`)
      await this.fetchInspectorTokens()
    },

    /** Verificación pública de un comprobante por hash */
    async verifyHash(hash) {
      try {
        const { data } = await publicAxios.get(`/compliance/verify/${hash}`)
        this.lastVerify = data
        return data
      } catch (err) {
        this.lastVerify = null
        throw err
      }
    },

    /** Consentimiento DT */
    async fetchConsent() {
      const { data } = await secureAxios.get('/compliance/consent')
      this.consent = data.data
      return data.data
    },

    async acceptConsent(payload) {
      const { data } = await secureAxios.post('/compliance/consent', payload)
      this.consent = { ...(this.consent || {}), dtConsent: data.consent }
      return data
    },

    async setPersonalEmail(personalEmail) {
      return secureAxios.post('/compliance/personal-email', { personalEmail })
    },

    /** Modificación de asistencia (admin) */
    async modifyAttendance(id, payload) {
      const { data } = await secureAxios.put(`/attendance/${id}/modify`, payload)
      return data
    },

    /** Objeción del trabajador (ventana 48h) */
    async objectModification(id) {
      const { data } = await secureAxios.post(`/attendance/${id}/object`)
      return data
    },

    /** Audit log */
    async fetchAuditLog(params = {}) {
      const qs = buildQuery(params)
      const { data } = await secureAxios.get(`/audit${qs ? '?' + qs : ''}`)
      return data
    },

    /** Libro de Asistencia semanal (Ley 21.561) */
    async fetchWeeklyLibro(params = {}) {
      const qs = buildQuery(params)
      const { data } = await secureAxios.get(`/compliance/libro/weekly${qs ? '?' + qs : ''}`)
      return data
    },

    async exportWeeklyLibro(params = {}) {
      const qs = buildQuery(params)
      const res = await secureAxios.get(`/compliance/libro/weekly/export${qs ? '?' + qs : ''}`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Libro_Asistencia_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    },

    /** Objeción one-click desde email (pública, sin auth) */
    async publicObject(attendanceId, token) {
      const { data } = await publicAxios.post(
        `/compliance/object/${attendanceId}/${token}`
      )
      return data
    },
  },
})
