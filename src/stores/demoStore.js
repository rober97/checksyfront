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
    // Los dos ambientes de la cuenta: la empresa de ejemplo y la empresa real
    // que la persona creó durante la prueba (puede no existir todavía).
    environments: { demo: null, real: null, activeId: null },
    // Vigencia de la empresa ACTIVA cuando no es la de prueba: la empresa real
    // corre bajo el mismo reloj y al vencer queda en solo lectura.
    trial: null,
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
    /** Días restantes del ambiente activo, venga de la demo o de la empresa real. */
    remainingDays: (s) => (s.isDemo ? s.daysLeft : (s.trial?.daysLeft ?? null)),
    /** Aviso de vencimiento: los últimos 3 días se muestran en tono de alerta. */
    urgent() {
      return this.remainingDays !== null && this.remainingDays <= 3
    },

    /** ¿Ya creó su empresa real? */
    hasRealCompany: (s) => !!s.environments?.real,
    /** ¿Está parado en su empresa real (y no en la de ejemplo)? */
    inRealCompany: (s) => !s.isDemo && !!s.environments?.real?.active,
    /**
     * La barra superior se muestra mientras la cuenta esté en período de prueba,
     * parada en el ambiente de ejemplo o en la empresa real: en ambos casos hay
     * un plazo corriendo y un ambiente sobre el que no puede haber dudas.
     */
    showBar: (s) => s.isDemo || s.trial?.kind === 'trial',
    /** Prueba vencida sobre la empresa real: se puede leer y exportar, no escribir. */
    locked: (s) => !!s.trial?.writeLocked,
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
        // Se guardan también fuera de la demo: son lo que dibuja el cambio de
        // ambiente desde la empresa real.
        this.environments = data?.environments || { demo: null, real: null, activeId: null }
        this.trial = data?.trial || null
        if (!this.isDemo) this.companyName = data?.companyName || ''
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

    /**
     * Crea la empresa real y deja la sesión parada en ella.
     *
     * No convierte la empresa de prueba: crea una aparte, con el RUT verdadero.
     * La de prueba sigue existiendo hasta que vence, para poder volver a mirarla.
     */
    async createRealCompany(payload) {
      const auth = useAuthStore()
      const { data } = await secureAxios.post('/demo/real-company', payload)
      if (!data?.success) throw new Error(data?.message || 'No pudimos crear tu empresa')
      auth._applySession(data)
      await this.fetch({ force: true })
      return data.company
    },

    /** Cambia entre el ambiente de prueba y la empresa real. */
    async switchEnvironment(companyId) {
      const auth = useAuthStore()
      const { data } = await secureAxios.post('/demo/switch-environment', { companyId })
      if (!data?.success) throw new Error(data?.message || 'No pudimos cambiar de empresa')
      auth._applySession(data)
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
