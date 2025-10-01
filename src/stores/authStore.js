// src/stores/auth.js
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import publicAxios from '@/utils/publicRequest'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,                 // { id, name, email, role, permissions: [] }
    token: localStorage.getItem('token') || null, // access token (opcional)
    loading: false,
    error: null,
    _refreshing: false,         // evita refresh concurrentes
  }),

  getters: {
    isAuthenticated: (s) => !!s.token && !!s.user,
    role: (s) => s.user?.role || null,
    permissions: (s) => s.user?.permissions || [],
    hasRole: (s) => (r) => s.user?.role === r,
    hasPermission: (s) => (perm) => (s.user?.permissions || []).includes(perm),
    getUser: (s) => s.user
  },

  actions: {
    // Login: NO guardamos role en localStorage. Lo trae el backend.
    async login({ email, password }) {
      this.loading = true
      this.error = null
      try {
        // Recomendado: el backend setea refresh-token en cookie httpOnly (SameSite=Lax/Strict, Secure)
        const res = await publicAxios.post('/auth/login', { email, password })
        if (!res.data?.success) throw new Error(res.data?.message || 'Login fallido')
        const { accessToken, user } = res.data
        if (!accessToken || !user) throw new Error('Respuesta de login inválida')

        this.token = accessToken
        this.user = user

        this._applyAuthHeader(accessToken)
      } catch (err) {
        console.error('Login error:', err)
        this.user = null
        this.token = null
        localStorage.removeItem('token')
        this.error = err?.message || 'Error de servidor'
        throw err
      } finally {
        this.loading = false
      }
    },

    // Obtiene el perfil actual desde el backend usando el access token
    async fetchMe() {
      try {
        const res = await secureAxios.get('/auth/me')
        if (!res.data?.success) throw new Error(res.data?.message || 'No autorizado')
        this.user = res.data.user
        return this.user
      } catch (err) {
        console.warn('fetchMe error:', err?.message)
        this.user = null
        throw err
      }
    },

    // Intenta refrescar el access token usando la cookie httpOnly (servidor debe emitirla en /auth/login)
    async refresh() {
      if (this._refreshing) return null
      this._refreshing = true
      try {
        const res = await publicAxios.post('/auth/refresh', {}, { withCredentials: true }) // 👈 {} + cookies
        if (!res.data?.success) throw new Error('No se pudo refrescar la sesión')
        const { accessToken } = res.data
        if (!accessToken) throw new Error('Respuesta de refresh inválida')
        this.token = accessToken
        localStorage.setItem('token', accessToken)
        this._applyAuthHeader(accessToken)
        return accessToken
      } catch (err) {
        console.error('refresh error:', err?.message)
        this.logout(false)
        return null
      } finally {
        this._refreshing = false
      }
    },

    // Restaurar sesión al cargar la app
    async restore() {
      const token = localStorage.getItem('token')
      if (token) this._applyAuthHeader(token)

      // 1) Si hay token, intenta /auth/me; si 401, intenta refresh y luego /auth/me
      if (token) {
        try {
          await this.fetchMe()
          return
        } catch {
          const newToken = await this.refresh()
          if (newToken) {
            await this.fetchMe().catch(() => this.logout(false))
            return
          }
        }
      }

      // 2) Si no había token o falló todo, intenta refresh directo (por si la cookie sigue viva)
      const newToken = await this.refresh()
      if (newToken) {
        await this.fetchMe().catch(() => this.logout(false))
        return
      }

      // 3) Sin sesión
      this.logout(false)
    },

    // Logout: limpia estado y revoca refresh cookie en el backend
    // src/stores/auth.js (solo la acción logout)
    async logout(callServer = true) {
      try {
        if (callServer) {
          // Revoca refresh cookie httpOnly en el backend (si la usas)
          await publicAxios.post('/auth/logout', {}, { withCredentials: true })
        }
      } catch (e) {
        console.warn('logout server warn:', e?.message)
      } finally {
        // Limpia estado local SIEMPRE
        this.user = null
        this.token = null
        this.error = null

        // Limpia Authorization del cliente seguro
        try {
          if (secureAxios?.defaults?.headers?.common) {
            delete secureAxios.defaults.headers.common.Authorization
          }
        } catch { }

        // Borra token persistido
        try { localStorage.removeItem('token') } catch { }

        // Opcional: limpia más cachés de tu app aquí
        // localStorage.removeItem('otra_clave')

        // Broadcast multi-pestaña: otras tabs escuchan y cierran sesión también
        try { localStorage.setItem('__LOGOUT_BROADCAST__', String(Date.now())) } catch { }
      }
    }
    ,

    // Utilidad: aplica header Authorization al cliente seguro
    _applyAuthHeader(token) {
      if (!token) return
      // Si secureAxios es una instancia de axios:
      secureAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }
})
