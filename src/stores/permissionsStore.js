import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import { API_URL } from '@/utils/api'

export const usePermissionsStore = defineStore('permissions', {
    state: () => ({
        catalog: { categories: [], items: [] },
        roles: [],
        companies: [],
        profiles: [],
    }),
    actions: {
        // === Catalog ===
        async fetchCatalog() {
            const { data } = await secureAxios.get(`${API_URL}/permissions/catalog`)
            this.catalog = data && data.catalog ? data.catalog : { categories: [], items: [] }
        },

        // === Roles / Empresas ===
        async fetchRoles() {
            const { data } = await secureAxios.get(`${API_URL}/roles`)
            const items = (data && data.items) || []
            this.roles = items.map(r => ({ id: r.id, label: r.name }))
        },
        async fetchCompanies() {
            const { data } = await secureAxios.get(`${API_URL}/companies`)
            this.companies = (data && data.companies) || []
        },

        // === Profiles ===
        async fetchProfiles() {
            const { data } = await secureAxios.get(`${API_URL}/permissions/profiles`)
            this.profiles = (data && data.items) || []
        },
        async createProfile(p) {
            const { data } = await secureAxios.post(`${API_URL}/permissions/profiles`, p)
            this.profiles = (data && data.items) || this.profiles
            return this.profiles
        },
        async updateProfile(p) {
            const { data } = await secureAxios.put(`${API_URL}/permissions/profiles/${p.id}`, p)
            this.profiles = (data && data.items) || this.profiles
            return this.profiles
        },
        async deleteProfile(id) {
            const { data } = await secureAxios.delete(`${API_URL}/permissions/profiles/${id}`)
            this.profiles = (data && data.items) || this.profiles
            return this.profiles
        },

        // === Search users live ===
        async searchUsers(q) {
            const { data } = await secureAxios.get(`${API_URL}/users`, { params: { q, limit: 20 } })
            return (data && data.items) || []
        },

        // === Read current maps ===
        async fetchRolePermissions(roleId) {
            const { data } = await secureAxios.get(`${API_URL}/permissions/role/${roleId}`)
            return (data && data.map) || {}
        },
        async fetchUserPermissions(userId) {
            const { data } = await secureAxios.get(`${API_URL}/permissions/user/${userId}`)
            return (data && data.map) || {}
        },
        async fetchCompanyDefaults(companyId) {
            const { data } = await secureAxios.get(`${API_URL}/permissions/company/${companyId}`)
            return (data && data.map) || {}
        },

        // === Save maps ===
        async saveRolePermissions(roleId, map) {
            const { data } = await secureAxios.put(`${API_URL}/permissions/role/${roleId}`, { map })
            return !!(data && data.success)
        },
        async saveUserPermissions(userId, map) {
            const { data } = await secureAxios.put(`${API_URL}/permissions/user/${userId}`, { map })
            return !!(data && data.success)
        },
        async saveCompanyDefaults(companyId, map) {
            const { data } = await secureAxios.put(`${API_URL}/permissions/company/${companyId}`, { map })
            return !!(data && data.success)
        },
    }
})