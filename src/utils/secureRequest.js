// src/utils/secureRequest.js
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { API_URL } from './api'

// === Utils ===
function getSafeRedirectPath(pathname) {
  // Sólo permitimos paths internos del sitio
  const safe = typeof pathname === 'string' && /^\/[a-zA-Z0-9\-_/]*$/.test(pathname)
  return safe ? pathname : '/'
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function makeRequestId() {
  // Simple request-id (puedes reemplazar por uuid v4 si lo tienes)
  return 'req_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// === Axios Instance ===
const secureAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  },
  timeout: 15000,             // timeout un poco más generoso
  withCredentials: true       // true si usas refresh por cookie httpOnly
})

// === Política de métodos permitidos ===
const ALLOWED_METHODS = ['get', 'post', 'put', 'delete', 'patch']

// === Refresh control (cola) ===
let isRefreshing = false
let refreshWaitList = []  // { resolve, reject }

// Reintentos (sólo para GET/HEAD/OPTIONS por seguridad)
const IDEMPOTENT_METHODS = ['get', 'head', 'options']
const MAX_RETRIES = 1
const RETRY_BASE_DELAY = 400 // ms

// === Request Interceptor ===
secureAxios.interceptors.request.use(
  (config) => {
    const method = (config.method || 'get').toLowerCase()
    if (!ALLOWED_METHODS.includes(method)) {
      return Promise.reject(new Error(`[secureAxios] Blocked method: ${config.method}`))
    }

    // Cabeceras útiles
    config.headers['X-Request-Id'] = config.headers['X-Request-Id'] || makeRequestId()
    config.headers['X-Client-Time'] = new Date().toISOString()

    // Token desde el store (no confíes en localStorage)
    const auth = useAuthStore()
    const token = auth?.token

    if (!token) {
      // Este cliente está pensado para endpoints protegidos
      return Promise.reject(new axios.Cancel('[secureAxios] Missing token (protected endpoint)'))
    }

    config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// === Response Interceptor ===
secureAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const auth = useAuthStore()
    const status = error?.response?.status
    const original = error.config || {}
    const method = (original.method || 'get').toLowerCase()

    // --- 1) 401: intentar refresh una sola vez ---
    if (status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        // Espera a que termine el refresh actual
        return new Promise((resolve, reject) => {
          refreshWaitList.push({ resolve, reject })
        })
          .then((newToken) => {
            if (newToken) original.headers.Authorization = `Bearer ${newToken}`
            return secureAxios(original)
          })
          .catch((e) => Promise.reject(e))
      }

      isRefreshing = true
      try {
        const newToken = await auth.refresh()   // usa cookie httpOnly en /auth/refresh
        // Libera la cola
        refreshWaitList.forEach(p => p.resolve(newToken))
        refreshWaitList = []
        isRefreshing = false

        if (!newToken) {
          // Refresh falló: limpiar sesión
          await auth.logout(false)
          // Redirigir a login (opcional)
          const current = getSafeRedirectPath(window.location.pathname + window.location.search)
          window.location.assign(`/login?redirect=${encodeURIComponent(current)}`)
          return Promise.reject(error)
        }

        // Reintentar con nuevo token
        original.headers.Authorization = `Bearer ${newToken}`
        return secureAxios(original)
      } catch (e) {
        refreshWaitList.forEach(p => p.reject(e))
        refreshWaitList = []
        isRefreshing = false
        await auth.logout(false)
        const current = getSafeRedirectPath(window.location.pathname + window.location.search)
        window.location.assign(`/login?redirect=${encodeURIComponent(current)}`)
        return Promise.reject(e)
      }
    }

    // --- 2) Retries para 429/5xx en métodos idempotentes ---
    const shouldRetry =
      (!status || status === 429 || (status >= 500 && status <= 599)) &&
      IDEMPOTENT_METHODS.includes(method)

    if (shouldRetry && (original._retries || 0) < MAX_RETRIES) {
      original._retries = (original._retries || 0) + 1
      const delay = RETRY_BASE_DELAY * original._retries
      await sleep(delay)
      return secureAxios(original)
    }

    // --- 3) 403: sin permisos -> opcionalmente redirigir o mostrar mensaje ---
    if (status === 403) {
      console.warn('[secureAxios] Forbidden (403).')
      // Aquí puedes disparar una notificación global si quieres
    }

    // --- 4) Logs controlados para 5xx / red / timeout ---
    if (status >= 500 || !error.response) {
      if (error.code === 'ECONNABORTED') {
        console.error('[secureAxios] Timeout.')
      } else {
        console.error('[secureAxios] Network/Server error:', error?.message || error)
      }
    }

    return Promise.reject(error)
  }
)

export default secureAxios
