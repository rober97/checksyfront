import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

export const useCompaniesStore = defineStore('companies', {
  state: () => ({
    companies: [],
    selectedCompany: null,
    workSchedules: [],
    error: null,
    loading: false
  }),

  actions: {
    // === COMPANIES ===

    async fetchCompanies() {
      try {
        this.loading = true
        const res = await secureAxios.get(`/companies`)
        if (res.data.success) {
          this.companies = res.data.companies
        } else {
          this.error = res.data.message
        }
      } catch (err) {
        console.error('fetchCompanies error:', err)
        this.error = 'Error fetching companies'
      } finally {
        this.loading = false
      }
    },

    async createCompany(companyData) {
      try {
        const res = await secureAxios.post('/companies', companyData)
        if (!res.data.success) {
          this.error = res.data.message || 'Failed to create company'
          throw new Error(this.error)
        }
        this.companies.push(res.data.company)
        return res.data.company
      } catch (err) {
        console.error('createCompany error:', err)
        this.error = 'Could not create company'
        throw err
      }
    },

    async getCompanyById(id) {
      try {
        const res = await secureAxios.get(`/companies/${id}`)
        if (res.data.success) {
          this.selectedCompany = res.data.company
          return res.data.company
        } else {
          this.error = res.data.message
        }
      } catch (err) {
        console.error('getCompanyById error:', err)
        this.error = 'Error fetching company'
      }
    },

    async updateCompany(id, companyData) {
      try {
        const res = await secureAxios.put(`/companies/${id}`, companyData)
        if (!res.data.success) {
          this.error = res.data.message || 'Failed to update company'
          throw new Error(this.error)
        }
        const idx = this.companies.findIndex((c) => c._id === id)
        if (idx !== -1) {
          this.companies[idx] = { ...this.companies[idx], ...companyData }
        }
        return true
      } catch (err) {
        console.error('updateCompany error:', err)
        this.error = 'Could not update company'
        throw err
      }
    },

    async deleteCompany(id) {
      try {
        const res = await secureAxios.delete(`/companies/${id}`)
        if (!res.data.success) {
          this.error = res.data.message || 'Failed to delete company'
          throw new Error(this.error)
        }
        this.companies = this.companies.filter((c) => c._id !== id)
        return true
      } catch (err) {
        console.error('deleteCompany error:', err)
        this.error = 'Could not delete company'
        throw err
      }
    },

    // === WORK SCHEDULES ===

    async fetchWorkSchedulesByCompany(companyId) {
      try {
        this.loading = true
        const res = await secureAxios.get(`/work-schedules/company/${companyId}`)
        if (res.data.success) {
          this.workSchedules = res.data.data
        } else {
          this.error = res.data.message
        }
      } catch (err) {
        console.error('fetchWorkSchedulesByCompany error:', err)
        this.error = 'Error fetching work schedules'
      } finally {
        this.loading = false
      }
    },

    async createWorkSchedule(scheduleData) {
      try {
        const res = await secureAxios.post('/work-schedules', scheduleData)
        if (!res.data.success) {
          this.error = res.data.message || 'Failed to create schedule'
          throw new Error(this.error)
        }
        this.workSchedules.push(res.data.data)
        return res.data.data
      } catch (err) {
        console.error('createWorkSchedule error:', err)
        this.error = 'Could not create work schedule'
        throw err
      }
    }
  }
})
