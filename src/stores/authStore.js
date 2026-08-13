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
        this.fetchAvatarUrl().catch(() => {})
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



    /* =========================
       GOOGLE (público)
       Recibe el ID token de Google Identity Services y lo canjea por sesión.

       Una sola acción para login y registro porque el backend decide cuál de
       los dos es: si el correo ya tiene cuenta abre sesión, y si no, construye
       un ambiente de prueba. El front no puede saberlo de antemano sin
       preguntar por el correo, y preguntarlo sería filtrar quién es cliente.

       Devuelve la respuesta completa; `data.created` distingue ambos casos para
       que la pantalla sepa si mandar al dashboard o celebrar un ambiente nuevo.
    ========================= */
    async googleAuth(credential) {
      this.loading = true
      this.error = null
      try {
        const { data } = await publicAxios.post(
          '/auth/google',
          { credential },
          // Cuando el correo es nuevo, esta llamada siembra la empresa de
          // ejemplo entera: el timeout por defecto (10s) la cortaría a mitad.
          { timeout: 60000 }
        )
        if (!data?.success) throw new Error(data?.message || 'No se pudo entrar con Google')

        this._applySession(data)
        this.fetchAvatarUrl().catch(() => {})
        return data
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'No se pudo entrar con Google'
        this.error = msg
        const e = new Error(msg)
        e.code = err?.response?.data?.code || null
        e.status = err?.response?.status || null
        throw e
      } finally {
        this.loading = false
      }
    },

    /* =========================
       AMBIENTE DE PRUEBA (público)
       Crea una empresa demo completa (con trabajadores, asistencia, solicitudes
       y nómina ya cargados) y deja la sesión abierta como su admin de RR.HH.
       Es el camino que sigue quien llega desde recksy.com a "probar": el
       registro clásico no aplica porque esa persona todavía no pertenece a
       ninguna empresa.
    ========================= */
    async demoSignup({ firstName, lastName, email, password }) {
      this.loading = true
      this.error = null
      try {
        const { data } = await publicAxios.post(
          '/demo/signup',
          { firstName, lastName, email, password },
          // Esta llamada siembra la empresa de ejemplo entera (~700 documentos):
          // el timeout por defecto (10s) la cortaba a mitad en producción, y el
          // visitante veía un error sobre un ambiente que sí se estaba creando.
          { timeout: 60000 }
        )
        if (!data?.success) throw new Error(data?.message || 'No se pudo crear el ambiente de prueba')

        this._applySession(data)
        this.fetchAvatarUrl().catch(() => {})
        return data
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'No se pudo crear el ambiente de prueba'
        this.error = msg
        const e = new Error(msg)
        e.code = err?.response?.data?.code || null
        e.status = err?.response?.status || null
        throw e
      } finally {
        this.loading = false
      }
    },

    /**
     * Cambia la sesión a la de un trabajador ficticio del ambiente de prueba
     * (o vuelve a la cuenta de RR.HH. con `exit`). El backend valida que la
     * empresa sea demo antes de emitir el token.
     */
    async demoImpersonate(employeeId = null) {
      const { data } = await secureAxios.post('/demo/impersonate', { employeeId })
      if (!data?.success) throw new Error(data?.message || 'No se pudo cambiar de vista')
      this._applySession(data)
      return data.user
    },

    async demoExitImpersonation() {
      const { data } = await secureAxios.post('/demo/impersonate/exit')
      if (!data?.success) throw new Error(data?.message || 'No se pudo volver a tu cuenta')
      this._applySession(data)
      return data.user
    },

    /* =========================
       RECUPERACIÓN DE CONTRASEÑA (público) — OTP por email
       Paso 1: solicitar el código. Por anti-enumeración el backend SIEMPRE
       responde OK, exista o no el correo.
    ========================= */
    async requestPasswordReset(email) {
      this.loading = true
      this.error = null
      try {
        const { data } = await publicAxios.post('/auth/password/forgot', { email })
        if (data?.success === false) {
          throw new Error(data?.message || 'No se pudo enviar el código')
        }
        return data
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Error de servidor'
        this.error = msg
        throw new Error(msg)
      } finally {
        this.loading = false
      }
    },

    /* Paso 2: validar el código (6 dígitos) y fijar la nueva contraseña.
       payload: { email, code, newPassword } */
    async resetPassword(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await publicAxios.post('/auth/password/reset', payload)
        if (data?.success === false) {
          throw new Error(data?.message || 'No se pudo restablecer la contraseña')
        }
        return data
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Error de servidor'
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
        // Resuelve avatarUrl firmado (mismo que usa la app móvil) en background
        this.fetchAvatarUrl().catch(() => {})
        return this.user
      } catch (err) {
        console.warn('fetchMe error:', err?.message)
        this.user = null
        throw err
      }
    },

    // /profile/me devuelve avatarUrl ya resuelto (firma S3 si la foto vive en S3).
    // Lo usamos para que el front muestre la misma foto que la app móvil.
    async fetchAvatarUrl() {
      try {
        const res = await secureAxios.get('/profile/me')
        const url = res?.data?.user?.avatarUrl || null
        // Solo reasignamos user cuando hay una URL real y distinta. Si url es
        // null (usuario sin foto), reasignar generaría una nueva referencia con
        // avatarUrl seguir vacío, y el watch que llama a este método volvería a
        // dispararse en bucle infinito (peticiones /profile/me sin fin).
        if (url && this.user && this.user.avatarUrl !== url) {
          this.user = { ...this.user, avatarUrl: url }
        }
        return url
      } catch (err) {
        return null
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

    /**
     * Instala una sesión recibida del backend ({ accessToken, user }).
     * Lo usan login por demo y el cambio de vista del ambiente de prueba: son
     * los mismos pasos que hace `login`, y duplicarlos es la forma habitual de
     * que una de las rutas se olvide de persistir el token y la sesión se
     * pierda al recargar.
     */
    _applySession({ accessToken, user }) {
      if (accessToken) {
        this.token = accessToken
        try { localStorage.setItem('token', accessToken) } catch {}
        this._applyAuthHeader(accessToken)
      }
      if (user) this.user = user
    },

    // Utilidad: aplica header Authorization al cliente seguro
    _applyAuthHeader(token) {
      if (!token) return
      // Si secureAxios es una instancia de axios:
      secureAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }
})
