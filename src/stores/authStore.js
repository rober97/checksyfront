// src/stores/auth.js
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => state.user,
  },

  actions: {
    async login({ email, password }) {
      try {
        const res = await secureAxios.post('/auth/login', { email, password })
        if (res.data.success) {
          this.user = res.data.user
          this.token = res.data.token
          localStorage.setItem('token', res.data.token)
          localStorage.setItem('role', 'Administrador') // Puedes reemplazar con el rol real si está disponible
          this.error = null
        } else {
          this.error = res.data.message || 'Login fallido'
        }
      } catch (err) {
        console.error('Login error:', err)
        this.error = 'Error de servidor'
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.error = null
      localStorage.removeItem('token')
      localStorage.removeItem('role')
    },

    async newUser(userData) {
      try {
        const res = await secureAxios.post('/users/new', userData)
        if (!res.data.success) {
          this.error = res.data.message || 'Error al crear usuario'
          throw new Error(this.error)
        }
      } catch (err) {
        console.error('newUser error:', err)
        this.error = 'No se pudo crear el usuario'
        throw err
      }
    }
  }
})
