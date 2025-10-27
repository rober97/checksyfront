// /src/stores/documentStore.js
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

export const useDocumentStore = defineStore('documents', {
  state: () => ({
    items: [],             // documentos del empleado seleccionado
    loading: false,
    error: null,
  }),

  getters: {
    byEmployee: (state) => (employeeId) => state.items.filter(d => d.employeeId === employeeId),
  },

  actions: {
    async fetchByEmployee({ employeeId, period, type, q } = {}) {
      try {
        this.loading = true
        this.error = null
        const params = {}
        if (employeeId) params.employeeId = employeeId
        if (period) params.period = period       // YYYY-MM
        if (type) params.type = type
        if (q) params.q = q
        const { data } = await secureAxios.get('/documents', { params })
        if (data?.success) {
          this.items = Array.isArray(data.items) ? data.items : []
        } else {
          this.error = data?.message || 'No se pudo cargar documentos'
        }
      } catch (err) {
        console.error('[documentStore.fetchByEmployee]', err)
        this.error = 'Error de red al obtener documentos'
      } finally {
        this.loading = false
      }
    },

    async uploadOne({ employeeId, name, type, period, file }) {
      const form = new FormData()
      form.append('employeeId', employeeId)
      form.append('name', name)
      form.append('type', type)
      form.append('period', period) // YYYY-MM
      form.append('file', file)
      try {
        this.loading = true
        const { data } = await secureAxios.post('/documents', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        if (!data?.success) throw new Error(data?.message || 'No se pudo subir')
        this.items.unshift(data.item)
        return data.item
      } finally {
        this.loading = false
      }
    },

    async uploadBulk({ employeeId, period, files }) {
      const form = new FormData()
      form.append('employeeId', employeeId)
      form.append('period', period)
      Array.from(files || []).forEach(f => form.append('files', f))
      const { data } = await secureAxios.post('/documents/bulk', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (!data?.success) throw new Error(data?.message || 'No se pudo subir el lote')
      // opcional: server devuelve items agregados
      if (Array.isArray(data.items)) this.items = [...data.items, ...this.items]
      return data
    },

    async getSignedUrl(id) {
      const { data } = await secureAxios.get(`/documents/${id}/url`)
      if (!data?.success) throw new Error(data?.message || 'No se pudo obtener URL')
      return data.url // URL firmada temporal
    },

    async notify(id) {
      const { data } = await secureAxios.post(`/documents/${id}/notify`)
      if (!data?.success) throw new Error(data?.message || 'No se pudo notificar')
      return data
    },

    async notifyMany(ids = []) {
      const { data } = await secureAxios.post('/documents/notify-many', { ids })
      if (!data?.success) throw new Error(data?.message || 'No se pudo notificar')
      return data
    },

    async delete(id) {
      const { data } = await secureAxios.delete(`/documents/${id}`)
      if (!data?.success) throw new Error(data?.message || 'No se pudo eliminar')
      this.items = this.items.filter(d => d.id !== id)
    },

    async deleteMany(ids = []) {
      const { data } = await secureAxios.post('/documents/delete-many', { ids })
      if (!data?.success) throw new Error(data?.message || 'No se pudo eliminar')
      this.items = this.items.filter(d => !ids.includes(d.id))
    },

    async zipByPeriod({ employeeId, period }) {
      const { data } = await secureAxios.get('/documents/zip', {
        params: { employeeId, period }
      })
      if (!data?.success) throw new Error(data?.message || 'No se pudo generar ZIP')
      return data.url // url firmada del ZIP
    }
  }
})
