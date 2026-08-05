// src/stores/legalParams.js
// Parámetros legales vigentes (jornada máxima, tope y recargo de horas extra,
// gratificación, desconexión). Los sirve el backend desde payroll_params con
// vigencia: la web NO lleva su propia copia de la ley, porque cuando cambie
// habría que recordar actualizarla en dos partes — y una de las dos se olvida.
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

export const useLegalParamsStore = defineStore('legalParams', {
  state: () => ({
    items: [],
    loaded: false,
    loading: false,
    error: null,
  }),

  getters: {
    byType: (s) => (type) => s.items.find((i) => i.type === type) || null,

    /**
     * Valor vigente de un parámetro. Devuelve `fallback` (null por defecto)
     * mientras no se haya cargado: es preferible no validar a validar con un
     * número inventado.
     */
    value: (s) => (type, fallback = null) => {
      const item = s.items.find((i) => i.type === type)
      const v = item?.current?.value
      return Number.isFinite(v) ? v : fallback
    },
  },

  actions: {
    async fetch({ force = false } = {}) {
      if (this.loaded && !force) return this.items
      if (this.loading) return this.items
      try {
        this.loading = true
        this.error = null
        const res = await secureAxios.get('/legal-params')
        this.items = res?.data?.items || []
        this.loaded = true
        return this.items
      } catch (err) {
        this.error = err?.response?.data?.message || err.message
        return this.items
      } finally {
        this.loading = false
      }
    },

    // Sólo superadmin: registra una nueva vigencia (no pisa la anterior).
    async update(type, { value, validFrom, label = '' }) {
      const res = await secureAxios.put(`/legal-params/${type}`, { value, validFrom, label })
      const item = res?.data?.item
      if (item) {
        const i = this.items.findIndex((x) => x.type === item.type)
        if (i >= 0) this.items.splice(i, 1, item)
        else this.items.push(item)
      }
      return item
    },
  },
})
