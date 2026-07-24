// src/stores/demoStore.js
//
// Estado del ambiente de prueba: vigencia del trial, checklist de onboarding,
// trabajadores ficticios y sus credenciales.
//
// Se consulta una vez por sesión y se refresca tras cada acción que pueda
// completar un paso. El backend es la única fuente de verdad del progreso:
// los pasos que dejan rastro en datos (aprobar, marcar, crear, liquidar) los
// deduce leyendo la base, así que el front no puede darlos por hechos.

import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import { useAuthStore } from '@/stores/authStore'

export const useDemoStore = defineStore('demo', {
  state: () => ({
    loaded: false,
    loading: false,
    isDemo: false,
    companyName: '',
    expiresAt: null,
    daysLeft: null,
    expired: false,
    employeePassword: '',
    resetsLeft: 0,
    mailCount: 0,
    progress: { done: 0, total: 0, percent: 0 },
    steps: [],
    employees: [],
    impersonating: null,
    // El panel de bienvenida se puede plegar; la preferencia es por navegador
    // porque es una decisión de "no me molestes más", no un dato del tenant.
    checklistCollapsed: localStorage.getItem('rk_demo_checklist_collapsed') === '1',
    dismissedBanner: false,
  }),

  getters: {
    active: (s) => s.isDemo && !s.expired,
    isImpersonating: (s) => !!s.impersonating,
    nextStep: (s) => s.steps.find((step) => !step.done) || null,
    completed: (s) => s.progress.total > 0 && s.progress.done === s.progress.total,
    /** Aviso de vencimiento: los últimos 3 días se muestran en tono de alerta. */
    urgent: (s) => s.isDemo && s.daysLeft !== null && s.daysLeft <= 3,
  },

  actions: {
    async fetch({ force = false } = {}) {
      const auth = useAuthStore()
      if (!auth.isAuthenticated) {
        this.$reset()
        return null
      }
      if (this.loaded && !force) return this
      if (this.loading) return this

      this.loading = true
      try {
        const { data } = await secureAxios.get('/demo/state')
        this.isDemo = !!data?.isDemo
        if (this.isDemo) {
          this.companyName = data.companyName || ''
          this.expiresAt = data.expiresAt || null
          this.daysLeft = data.daysLeft ?? null
          this.expired = !!data.expired
          this.employeePassword = data.employeePassword || ''
          this.resetsLeft = data.resetsLeft ?? 0
          this.mailCount = data.mailCount ?? 0
          this.progress = data.progress || { done: 0, total: 0, percent: 0 }
          this.steps = data.steps || []
          this.employees = data.employees || []
          this.impersonating = data.impersonating || null
        }
        this.loaded = true
        return this
      } catch (err) {
        // Un fallo acá no puede romper la app: la demo es una capa encima del
        // producto, no un requisito para usarlo.
        console.warn('[demo] no se pudo obtener el estado:', err?.message)
        this.isDemo = false
        this.loaded = true
        return null
      } finally {
        this.loading = false
      }
    },

    /** Confirma un paso que no deja rastro en datos (visitar un módulo). */
    async markVisited(key) {
      if (!this.isDemo) return
      const step = this.steps.find((s) => s.key === key)
      if (!step || step.done || step.source !== 'visit') return
      try {
        const { data } = await secureAxios.post(`/demo/checklist/${key}`)
        if (data?.success) {
          this.steps = data.steps
          this.progress = data.progress
        }
      } catch (err) {
        console.warn('[demo] no se pudo marcar el paso', key, err?.message)
      }
    },

    async impersonate(employeeId = null) {
      const auth = useAuthStore()
      await auth.demoImpersonate(employeeId)
      await this.fetch({ force: true })
    },

    async exitImpersonation() {
      const auth = useAuthStore()
      await auth.demoExitImpersonation()
      await this.fetch({ force: true })
    },

    async reset() {
      const { data } = await secureAxios.post('/demo/reset')
      if (!data?.success) throw new Error(data?.message || 'No se pudo reiniciar el ambiente')
      await this.fetch({ force: true })
      return data
    },

    toggleChecklist() {
      this.checklistCollapsed = !this.checklistCollapsed
      try {
        localStorage.setItem('rk_demo_checklist_collapsed', this.checklistCollapsed ? '1' : '0')
      } catch {}
    },
  },
})
