import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import { API_URL } from '@/utils/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    users: [],
    token: localStorage.getItem('token') || null,
    error: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => state.user,
  },

  actions: {
    async fetchUsers() {
      try {
        this.loading = true
        this.error = null

        const res = await secureAxios.get(`${API_URL}/users`)
        if (res.data) {
          this.users = res.data || []
        } else {
          this.error = res.data.message || 'Error al cargar usuarios'
        }
      } catch (err) {
        console.error('[fetchUsers] Error:', err)
        this.error = 'No se pudieron obtener los usuarios'
      } finally {
        this.loading = false
      }
    },

    async createUser(userData) {
      try {
        this.loading = true
        this.error = null

        const res = await secureAxios.post(`${API_URL}/users/new`, userData)
        if (!res.data.success) {
          this.error = res.data.message || 'Error al crear el usuario'
          throw new Error(this.error)
        }

        return res.data.user
      } catch (err) {
        console.error('[createUser] Error:', err)
        this.error = 'No se pudo crear el usuario'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteUser(id) {
      try {
        this.loading = true
        this.error = null

        const res = await secureAxios.put(`${API_URL}/users/${id}`, {
          status: 'inactive'
        })

        if (!res.data.success) {
          this.error = res.data.message || 'Error al eliminar el usuario'
          throw new Error(this.error)
        }

        this.users = this.users?.filter?.(u => u._id !== id)

        return { success: true }
      } catch (err) {
        console.error('[deleteUser] Error:', err)
        this.error = 'No se pudo eliminar el usuario'
        throw err
      } finally {
        this.loading = false
      }
    }
    ,

    async fetchCurrentUser() {
      try {
        if (!this.token) return null
        this.loading = true
        this.error = null

        const res = await secureAxios.get(`${API_URL}/users/me`)
        if (res.data.success) {
          this.user = res.data.user
          return this.user
        } else {
          this.error = res.data.message || 'Error al obtener el usuario'
        }
      } catch (err) {
        console.error('[fetchCurrentUser] Error:', err)
        this.error = 'No se pudo obtener el usuario actual'
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
    }
  }
})
