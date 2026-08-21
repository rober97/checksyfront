// src/stores/dtPortalStore.js
// Sesión del portal de fiscalización DT — separada del authStore normal
// (el fiscalizador no es un usuario de la plataforma). Persiste en un key
// de localStorage propio para no chocar con la sesión normal en el mismo
// navegador (ver dtPortalRequest.js).
import { defineStore } from 'pinia'
import publicAxios from '@/utils/publicRequest'

const STORAGE_KEY = 'dt_portal_session'

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persist(state) {
  try {
    if (state.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        token: state.token,
        email: state.email,
        company: state.company,
      }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {}
}

const stored = loadStored()

export const useDtPortalStore = defineStore('dtPortal', {
  state: () => ({
    token: stored?.token || null,
    email: stored?.email || null,
    company: stored?.company || null, // { id, name, rut } una vez elegido (art. 24)
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    hasCompany: (state) => !!state.company,
  },

  actions: {
    async requestAccess(email) {
      this.loading = true
      this.error = null
      try {
        const { data } = await publicAxios.post('/dt/portal/request-access', { email })
        return data
      } catch (err) {
        this.error = err?.response?.data?.message || 'Error solicitando la clave'
        throw err
      } finally {
        this.loading = false
      }
    },

    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        const { data } = await publicAxios.post('/dt/portal/login', { email, password })
        this.token = data.token
        this.email = email
        this.company = null
        persist(this)
        return data
      } catch (err) {
        this.error = err?.response?.data?.message || 'Correo o clave inválidos'
        throw err
      } finally {
        this.loading = false
      }
    },

    setCompany(token, company) {
      this.token = token
      this.company = company
      persist(this)
    },

    clearSession() {
      this.token = null
      this.email = null
      this.company = null
      persist(this)
    },

    // Vuelve a la búsqueda de empleador sin cerrar la sesión (útil si el
    // fiscalizador quiere revisar a otro empleador dentro de la misma clave).
    clearCompany() {
      this.company = null
      persist(this)
    },
  },
})
