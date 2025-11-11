import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

export const useSchedulesStore = defineStore('schedules', {
    state: () => ({ items: [], loading: false, error: null }),
    actions: {
        async fetch(companyId, q = '') {
            this.loading = true
            try {
                const { data } = await secureAxios.get('/work-schedules', { params: { companyId, q, active: true, limit: 50 } })
                this.items = data?.items || []
            } catch (e) { this.error = e?.message || 'Error'; }
            finally { this.loading = false }
        }
    }
})



