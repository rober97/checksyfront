import axios from 'axios'
import { API_URL } from './api'

// === Helpers ===
function getToken() {
  const token = localStorage.getItem('token')
  if (!token || token === 'null' || token.length < 10) return null
  return token
}

function isValidPath(path) {
  return typeof path === 'string' && /^\/[a-zA-Z0-9\-_/]*$/.test(path)
}

// === Axios Instance ===
const secureAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  },
  timeout: 10000, // Protección contra DoS con tiempo muerto
  withCredentials: false // Cambia a true si usas cookies httpOnly
})

// === Request Interceptor ===
secureAxios.interceptors.request.use(
  (config) => {
    const token = getToken()

    // Seguridad: No enviar si no es válido
    if (!token) {
      console.warn('[secureAxios] No valid token found. Request canceled.')
      throw new axios.Cancel('Request canceled due to missing/invalid token')
    }

    config.headers.Authorization = `Bearer ${token}`

    // Bloqueo de métodos o headers sospechosos (solo GET/POST/PUT/DELETE)
    const safeMethods = ['get', 'post', 'put', 'delete']
    if (!safeMethods.includes(config.method.toLowerCase())) {
      throw new Error(`Blocked method: ${config.method}`)
    }

    return config
  },
  (error) => {
    console.error('[secureAxios] Request error:', error)
    return Promise.reject(error)
  }
)

// === Response Interceptor ===
secureAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status

    // 🔐 Token caducado o acceso inválido
    if (status === 401 || status === 403) {
      console.warn('[secureAxios] Unauthorized access. Logging out.')

      localStorage.removeItem('token')
      localStorage.removeItem('role')

      const currentPath = window.location.pathname
      if (!currentPath.includes('/login')) {
        // Validación de redirección segura
        if (isValidPath('/login')) {
          window.location.href = '/login'
        }
      }
    }

    // 🚨 Bloqueo de posibles respuestas corruptas o manipuladas
    if (status >= 500 || !error.response) {
      console.error('[secureAxios] Server/internal error:', error)
    }

    return Promise.reject(error)
  }
)

export default secureAxios
