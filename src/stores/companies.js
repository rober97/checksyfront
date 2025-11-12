// src/stores/companies.js
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

// Helpers defensivos
const asArray = (v) => (Array.isArray(v) ? v : [])
const normalizeCompany = (c = {}) => ({
  _id: c._id || c.id || '',
  name: c.name || '',
  rut: c.rut || '',
  logo: c.logo || '',
  status: c.status || 'inactive',
  ...c
})

// Extrae lista de empresas desde distintas formas de respuesta
const extractCompanies = (data) => {
  // Soporta: {success, companies}, {success, items}, array plano
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.companies)) return data.companies
  if (Array.isArray(data?.items)) return data.items
  return []
}

const extractCompany = (data) => {
  // Soporta: {success, company}, {success, item}, objeto plano
  return data?.company ?? data?.item ?? data
}

const extractSchedules = (data) => {
  // Soporta: {success, data}, {items}, array plano
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

export const useCompaniesStore = defineStore('companies', {
  state: () => ({
    // Mantengo tu shape original
    companies: [],
    selectedCompany: null,
    workSchedules: [],

    // Estado general
    error: null,
    loading: false
  }),

  getters: {
    // Aliases para no romper el componente ni código viejo
    items: (s) => s.companies,   // ← el componente usa companies.items
    list: (s) => s.companies,
    empresas: (s) => s.companies,
    getById: (s) => (id) => s.companies.find(c => c._id === id),
    isLoading: (s) => s.loading,
  },

  actions: {
    // ========== COMPANIES ==========
    async fetchCompanies() {
      this.loading = true
      this.error = null
      try {
        const res = await secureAxios.get('/companies')
        const ok = res?.data?.success ?? true
        if (!ok) {
          this.error = res?.data?.message || 'Error fetching companies'
          this.companies = []
          return
        }
        const raw = extractCompanies(res?.data)
        this.companies = asArray(raw).map(normalizeCompany)
      } catch (err) {
        console.error('[companies.fetchCompanies] error:', err)
        this.error = 'Error fetching companies'
        this.companies = []
      } finally {
        this.loading = false
      }
    },

    async createCompany(companyData) {
      this.error = null
      try {
        const res = await secureAxios.post('/companies', companyData)

        const ok = res?.data?.success ?? !!res?.data
        if (!ok) {
          this.error = res?.data?.message || 'Failed to create company'
          throw new Error(this.error)
        }

        const created = normalizeCompany(extractCompany(res?.data))

        // Inserta o reemplaza si ya existe
        const idx = this.companies.findIndex(c => c._id === created._id)
        if (idx === -1) this.companies.unshift(created)
        else this.companies.splice(idx, 1, created)

        return created
      } catch (err) {
        console.error('[companies.createCompany] error:', err)

        let msg = this.error // por si ya lo seteaste arriba

        if (!msg) {
          if (err.response) {
            // Errores HTTP (4xx, 5xx) con payload del backend
            const { data, status, statusText } = err.response
            msg =
              data?.message ||              // ej: "Missing required fields: email"
              data?.error ||
              `Error ${status}: ${statusText || 'Request failed'}`
          } else if (err.request) {
            // No hubo respuesta del servidor
            msg = 'No se pudo contactar al servidor. Intenta nuevamente.'
          } else {
            // Error al construir/enviar la petición
            msg = err.message || 'Could not create company'
          }
        }

        this.error = msg
        // re-lanzamos un Error limpio con el mensaje que quieres mostrar
        throw new Error(msg)
      }
    },


    async getCompanyById(id) {
      this.error = null
      try {
        const res = await secureAxios.get(`/companies/${id}`)
        const ok = res?.data?.success ?? !!res?.data
        if (!ok) {
          this.error = res?.data?.message || 'Error fetching company'
          return null
        }
        const comp = normalizeCompany(extractCompany(res?.data))
        this.selectedCompany = comp
        // Refresca también en la lista si ya existe
        const idx = this.companies.findIndex(c => c._id === comp._id)
        if (idx !== -1) this.companies.splice(idx, 1, comp)
        return comp
      } catch (err) {
        console.error('[companies.getCompanyById] error:', err)
        this.error = 'Error fetching company'
        return null
      }
    },

    async updateCompany(id, companyData) {
      this.error = null
      try {
        const res = await secureAxios.put(`/companies/${id}`, companyData)
        const ok = res?.data?.success ?? !!res?.data
        if (!ok) {
          this.error = res?.data?.message || 'Failed to update company'
          throw new Error(this.error)
        }
        const updated = normalizeCompany(extractCompany(res?.data)) // usa respuesta si viene
        const idx = this.companies.findIndex(c => c._id === id)
        if (idx !== -1) {
          this.companies.splice(idx, 1, updated._id ? updated : { ...this.companies[idx], ...companyData })
        }
        if (this.selectedCompany?._id === id) {
          this.selectedCompany = updated._id ? updated : { ...this.selectedCompany, ...companyData }
        }
        return updated._id ? updated : true
      } catch (err) {
        console.error('[companies.updateCompany] error:', err)
        this.error = this.error || 'Could not update company'
        throw err
      }
    },

    async deleteCompany(id) {
      this.error = null
      try {
        const res = await secureAxios.delete(`/companies/${id}`)
        const ok = res?.data?.success ?? !!res?.data
        if (!ok) {
          this.error = res?.data?.message || 'Failed to delete company'
          throw new Error(this.error)
        }
        this.companies = this.companies.filter(c => c._id !== id)
        if (this.selectedCompany?._id === id) this.selectedCompany = null
        return true
      } catch (err) {
        console.error('[companies.deleteCompany] error:', err)
        this.error = this.error || 'Could not delete company'
        throw err
      }
    },

    // alias para que el componente pueda llamar removeCompany()
    async removeCompany(id) {
      return this.deleteCompany(id)
    },

    // ========== WORK SCHEDULES ==========
    async fetchWorkSchedulesByCompany(companyId) {
      if (!companyId) { this.workSchedules = []; return }
      this.loading = true
      this.error = null
      try {
        // Mantengo tu ruta original
        let res = await secureAxios.get(`/work-schedules/company/${companyId}`)
        // Si tu backend también soporta /companies/:id/work-schedules, usaría fallback:
        if (!(res?.data?.success ?? false) && !Array.isArray(res?.data)) {
          try {
            res = await secureAxios.get(`/companies/${companyId}/work-schedules`)
          } catch { /* ignore */ }
        }
        const ok = res?.data?.success ?? true
        if (!ok) {
          this.error = res?.data?.message || 'Error fetching work schedules'
          this.workSchedules = []
          return
        }
        const raw = extractSchedules(res?.data)
        this.workSchedules = asArray(raw).map(h => ({
          _id: h._id || h.id || '',
          name: h.name || '',
          ...h
        }))
      } catch (err) {
        console.error('[companies.fetchWorkSchedulesByCompany] error:', err)
        this.error = 'Error fetching work schedules'
        this.workSchedules = []
      } finally {
        this.loading = false
      }
    },

    async createWorkSchedule(scheduleData) {
      this.error = null
      try {
        const res = await secureAxios.post('/work-schedules', scheduleData)
        const ok = res?.data?.success ?? !!res?.data
        if (!ok) {
          this.error = res?.data?.message || 'Failed to create schedule'
          throw new Error(this.error)
        }
        const created = extractCompany(res?.data)
        const obj = {
          _id: created?._id || created?.id || '',
          name: created?.name || '',
          ...created
        }
        this.workSchedules.push(obj)
        return obj
      } catch (err) {
        console.error('[companies.createWorkSchedule] error:', err)
        this.error = this.error || 'Could not create work schedule'
        throw err
      }
    }
  }
})
