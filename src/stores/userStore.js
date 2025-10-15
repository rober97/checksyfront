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
    currentUser: null,
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
          this.users = res.data.items || []
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

    async fetchUserById(id) {
      try {
        this.loading = true
        this.error = null
        const res = await secureAxios.get(`${API_URL}/users/${id}`)
        debugger
        if (res.data) {
          this.currentUser = res.data
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

        const res = await secureAxios.post(`${API_URL}/users`, userData)
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

    // en src/stores/userStore.js (o donde tengas el store)
    async updateUser({ id, patch }) {
      try {
        this.loading = true;
        this.error = null;

        // PUT /users/:id con el patch directamente
        const res = await secureAxios.put(`${API_URL}/users/${id}`, patch);
        const updatedUser = res.data; // el back retorna el usuario "plain"

        // Mantén el estado coherente si estás mostrando currentUser
        if (this.currentUser && this.currentUser._id === updatedUser._id) {
          this.currentUser = updatedUser;
        }

        return updatedUser;
      } catch (err) {
        // Mensajes alineados a tu back: 404, 409 (duplicado), 400/422 validaciones, y 500 genérico
        const status = err?.response?.status;
        const msg =
          err?.response?.data?.message ||
          (status === 404 && 'Usuario no encontrado') ||
          (status === 409 && 'Ya existe un registro con ese dato (duplicado)') ||
          (status >= 400 && status < 500 && 'Datos inválidos para actualizar') ||
          'Error actualizando usuario';

        console.error('[updateUser] Error:', err);
        this.error = msg;
        throw new Error(msg);
      } finally {
        this.loading = false;
      }
    },


    async deleteUser(id) {
      try {
        this.loading = true
        this.error = null

        const res = await secureAxios.put(`${API_URL}/users/${id}`, {
          status: 'inactive'
        })

        if (!res.status) {
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
