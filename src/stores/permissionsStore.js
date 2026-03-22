import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import { API_URL } from '@/utils/api'
import { normalizePermissionCatalog } from '@/utils/permissions'

const pickItems = (data) => data?.items || data?.profiles || data?.users || []
const pickCatalog = (data) => normalizePermissionCatalog(data?.catalog || data || {})

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
            this.catalog = pickCatalog(data)
            return this.catalog
        },

        // === Roles / Empresas ===
        async fetchRoles() {
            const { data } = await secureAxios.get(`${API_URL}/roles`)
            const items = pickItems(data)
            this.roles = items.map(r => ({ id: r.id, label: r.name }))
        },
        async fetchCompanies() {
            const { data } = await secureAxios.get(`${API_URL}/companies`)
            this.companies = data?.companies || data?.items || []
        },

        // === Profiles ===
        async fetchProfiles() {
            const { data } = await secureAxios.get(`${API_URL}/permissions/profiles`)
            this.profiles = pickItems(data)
            return this.profiles
        },
        async createProfile(p) {
            const { data } = await secureAxios.post(`${API_URL}/permissions/profiles`, p)
            this.profiles = pickItems(data).length ? pickItems(data) : this.profiles
            return this.profiles
        },
        async updateProfile(p) {
            const { data } = await secureAxios.put(`${API_URL}/permissions/profiles/${p.id}`, p)
            this.profiles = pickItems(data).length ? pickItems(data) : this.profiles
            return this.profiles
        },
        async deleteProfile(id) {
            const { data } = await secureAxios.delete(`${API_URL}/permissions/profiles/${id}`)
            this.profiles = pickItems(data).length ? pickItems(data) : this.profiles.filter((profile) => (profile.id || profile._id) !== id)
            return this.profiles
        },

        // === Search users live ===
        async searchUsers(q) {
            const { data } = await secureAxios.get(`${API_URL}/users`, { params: { q, limit: 20 } })
            return pickItems(data)
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
