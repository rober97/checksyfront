import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'
import { API_URL } from '@/utils/api'
import { normalizeDecimal, normalizeMoney } from '@/utils/format'

function cleanText(value, fallback = null) {
  if (value === null || value === undefined) return fallback
  const text = String(value).trim()
  return text === '' ? fallback : text
}

function normalizeRole(role) {
  const value = cleanText(role, '')?.toLowerCase()

  if (value === 'employee') return 'empleado'
  if (value === 'company') return 'empresa'

  return value || 'empleado'
}

function hasPayrollData(payroll = {}) {
  return Object.values(payroll).some((value) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    return String(value).trim() !== ''
  })
}

function normalizePayroll(payroll = {}, role = 'empleado') {
  const baseSalary = normalizeMoney(payroll?.baseSalary || 0)
  const contractType = cleanText(payroll?.contractType, '')
  const jornada = cleanText(payroll?.jornada, '')
  const startDate = cleanText(payroll?.startDate, null)
  const afpEntityId = cleanText(payroll?.afpEntityId, null)
  const healthEntityId = cleanText(payroll?.healthEntityId, null)
  const saludSistema = cleanText(payroll?.saludSistema, null)
  const isaprePlan = cleanText(payroll?.isaprePlan, null)
  const isapreUf = Number(normalizeDecimal(payroll?.isapreUf || 0))
  const apv = normalizeMoney(payroll?.apv || 0)
  const cargasFamiliares = Number(payroll?.cargasFamiliares || 0)
  const incomeTaxNote = cleanText(payroll?.incomeTaxNote, '') || ''
  const explicitIncomeTax = typeof payroll?.incomeTaxApplies === 'boolean'
    ? payroll.incomeTaxApplies
    : null

  const isEmployee = role === 'empleado'
  const incomeTaxApplies = explicitIncomeTax ?? (isEmployee && incomeTaxNote === '' && baseSalary > 0)

  const normalized = {
    baseSalary,
    contractType,
    jornada,
    startDate,
    afpEntityId,
    healthEntityId,
    saludSistema,
    isaprePlan,
    isapreUf,
    apv,
    cargasFamiliares,
    incomeTaxApplies: isEmployee ? incomeTaxApplies : false,
    incomeTaxNote: isEmployee && !incomeTaxApplies ? incomeTaxNote : '',
    banco: cleanText(payroll?.banco, ''),
    tipoCuenta: cleanText(payroll?.tipoCuenta, ''),
    numeroCuenta: cleanText(payroll?.numeroCuenta, ''),
    gratificacion: normalizeMoney(payroll?.gratificacion || 0),
    bonoColacion: normalizeMoney(payroll?.bonoColacion || 0),
    bonoMovilizacion: normalizeMoney(payroll?.bonoMovilizacion || 0),
    descuentoPrestamo: normalizeMoney(payroll?.descuentoPrestamo || 0),
  }

  if (!isEmployee && !hasPayrollData(normalized)) return null

  return normalized
}

function normalizeCreateUserPayload(userData = {}) {
  const role = normalizeRole(userData?.role)

  return {
    firstName: cleanText(userData?.firstName, '') || '',
    lastName: cleanText(userData?.lastName, '') || '',
    email: cleanText(userData?.email, '')?.toLowerCase() || '',
    password: userData?.password || '',
    rut: cleanText(userData?.rut, null),
    role,
    company: cleanText(userData?.company, null),
    workSchedule: cleanText(userData?.workSchedule, null),
    phone: cleanText(userData?.phone, null),
    emergencyContact: cleanText(userData?.emergencyContact, null),
    address: {
      line1: cleanText(userData?.address?.line1, '') || '',
      commune: cleanText(userData?.address?.commune, '') || '',
      city: cleanText(userData?.address?.city, '') || '',
      region: cleanText(userData?.address?.region, '') || '',
    },
    permissions: Array.isArray(userData?.permissions) ? userData.permissions : [],
    payroll: normalizePayroll(userData?.payroll, role),
    invite: Boolean(userData?.invite),
  }
}

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
      this.loading = true
      this.error = null

      try {
        const payload = normalizeCreateUserPayload(userData)
        const res = await secureAxios.post(`${API_URL}/users`, payload)
        const data = res?.data

        // Define qué consideras "OK"
        const ok = data

        if (!ok) {
          const msg = data?.message || data?.error || 'Error al crear el usuario'
          this.error = msg
          throw new Error(msg)
        }

        // Ajusta según tu backend: data.user o data directamente
        return data.user || data
      } catch (err) {
        console.error('[createUser] Error:', err)

        let msg = this.error // por si ya fue seteado arriba

        if (!msg) {
          if (err.response) {
            // Errores HTTP (4xx, 5xx) con payload del backend
            const { data, status, statusText } = err.response

            const text = data?.message + data?.error
            msg = text
          } else if (err.request) {
            // No hubo respuesta del servidor
            msg = 'No se pudo contactar al servidor. Revisa tu conexión o inténtalo nuevamente.'
          } else {
            // Error al construir/enviar la petición
            msg = err.message || 'No se pudo crear el usuario'
          }
        }

        this.error = msg
        // relanzamos un Error limpio con el mensaje útil para el front
        throw new Error(msg)
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
    },
    // store: añade una acción utilitaria
    // src/stores/userStore.js
    upsertUser(user) {
      if (!user || !user._id) return
      const idx = this.users.findIndex(u => u._id === user._id)
      if (idx >= 0) this.users.splice(idx, 1, user)
      else this.users.unshift(user) // visible arriba
    }

  }
})
