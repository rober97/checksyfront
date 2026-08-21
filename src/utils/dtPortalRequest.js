// src/utils/dtPortalRequest.js
// Cliente axios del portal de fiscalización DT (Res. Ex. 38/2024, arts.
// 17, 22-24). Deliberadamente separado de secureAxios: el fiscalizador no
// tiene una sesión de usuario normal (no hay refresh por cookie, no hay
// authStore) — su JWT vive solo en dtPortalStore, con su propio storage key.
import axios from 'axios'
import { API_URL } from './api'
import { useDtPortalStore } from '@/stores/dtPortalStore'

const dtPortalAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 20000,
})

dtPortalAxios.interceptors.request.use((config) => {
  const portal = useDtPortalStore()
  if (portal.token) {
    config.headers.Authorization = `Bearer ${portal.token}`
  }
  return config
})

dtPortalAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const portal = useDtPortalStore()
      portal.clearSession()
    }
    return Promise.reject(error)
  }
)

export default dtPortalAxios
