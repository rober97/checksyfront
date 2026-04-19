// src/stores/auth.js
import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import publicAxios from '@/utils/publicRequest'
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  normalizeRole,
  normalizePermissions,
} from '@/utils/permissions'

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
    permissions: (s) => normalizePermissions(s.user?.permissions),
    hasRole: (s) => (r) => normalizeRole(s.user?.role) === normalizeRole(r),
    hasPermission: (s) => (perm) => hasPermission(s.user?.permissions, perm),
    hasAnyPermission: (s) => (perms) => hasAnyPermission(s.user?.permissions, perms),
    hasAllPermissions: (s) => (perms) => hasAllPermissions(s.user?.permissions, perms),
    getUser: (s) => s.user,
    activeCompany: (s) => s.user?.company || null,
    assignedCompanies: (s) => Array.isArray(s.user?.companies) ? s.user.companies : [],
    hasMultipleCompanies: (s) => Array.isArray(s.user?.companies) && s.user.companies.length > 1,
  },

  actions: {
    // Login: NO guardamos role en localStorage. Lo trae el backend.
    async login({ email, password }) {
      this.loading = true
      this.error = null
      try {
        // El backend setea refresh-token en cookie httpOnly (SameSite=Lax/Strict, Secure)
        const res = await publicAxios.post('/auth/login', { email, password })
        if (!res.data?.success) throw new Error(res.data?.message || 'Login fallido')
        const { accessToken, user } = res.data
        if (!accessToken || !user) throw new Error('Respuesta de login inválida')

        this.token = accessToken
        this.user = user

        // ⚠️ Persistir el access token en localStorage para que sobreviva al
        // refresh de la página. Sin esto, restore() no encuentra el token al
        // recargar y manda al usuario al login.
        try { localStorage.setItem('token', accessToken) } catch {}

        this._applyAuthHeader(accessToken)
      } catch (err) {
        console.error('Login error:', err)
        this.user = null
        this.token = null
        try { localStorage.removeItem('token') } catch {}
        this.error = err?.message || 'Error de servidor'
        throw err
      } finally {
        this.loading = false
      }
    },

    /* =========================
       REGISTER (público)
       payload: { firstName, lastName?, email, password, inviteCode? }
       opts: { autoLogin = true }  ← inicia sesión tras registrar
    ========================= */
    async register(payload, opts = {}) {
      const { autoLogin = true } = opts
      this.loading = true
      this.error = null
      try {
        // Si tu backend expone otra ruta, cámbiala aquí:
        // - si seguiste lo que armamos: POST /users/register (pública)
        // - en otros setups: POST /auth/register
        const { data } = await publicAxios.post('/users/register', payload)

        // 409 (duplicado) o mensajes custom
        if (data?.success === false) {
          const msg = data?.message || 'No se pudo crear la cuenta'
          this.error = msg
          throw new Error(msg)
        }

        // Autologin opcional con las mismas credenciales
        if (autoLogin) {
          await this.login({ email: payload.email, password: payload.password })
        }

        return data
      } catch (err) {
        const status = err?.response?.status
        const msg =
          err?.response?.data?.message ||
          (status === 409 ? 'El correo ya está registrado' : null) ||
          err?.message ||
          'Error creando la cuenta'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.loading = false
      }
    },



    /**
     * Cambia la empresa activa del admin_rrhh.
     * Llama al backend para re-emitir el JWT (porque companyId va en el token)
     * y actualiza el user en el store.
     */
    async switchCompany(companyId) {
      if (!companyId) throw new Error('companyId requerido')
      const res = await secureAxios.post('/auth/switch-company', { companyId })
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'No se pudo cambiar de empresa')
      }
      const { accessToken, user } = res.data
      if (accessToken) {
        this.token = accessToken
        try { localStorage.setItem('token', accessToken) } catch {}
        this._applyAuthHeader(accessToken)
      }
      if (user) this.user = user
      return user
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
