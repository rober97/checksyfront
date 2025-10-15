import { defineStore } from 'pinia'
import secureAxios from '@/utils/secureRequest'

export const useAsistenciaStore = defineStore('asistencia', {
  state: () => ({
    records: [],               // todas las asistencias
    loading: false,
    employeeRecords: [],       // asistencias por empleado
    error: null,
  }),

  actions: {
    async fetchAllRecords() {
      this.loading = true
      try {
        const res = await secureAxios.get('/attendance')
        if (res.data.success) {
          this.records = res.data.attendance || []
          this.error = null
        } else {
          this.records = []
          this.error = res.data.message || 'Error loading attendance records'
        }
      } catch (err) {
        console.error('fetchAllRecords error:', err)
        this.records = []
        this.error = 'Server error while loading attendance'
      } finally {
        this.loading = false
      }
    },

    async fetchHistorialEmpleado({ employeeId, from = null, to = null }) {
      try {
        const res = await secureAxios.get(`/attendance/history/${employeeId}`, {
          params: {
            ...(from && { from }),
            ...(to && { to })
          }
        })

        if (res.data.success) {
          return res.data.data // { _id, nombre, rut, asistencias }
        } else {
          throw new Error(res.data.message || 'Error al obtener historial de asistencias')
        }
      } catch (err) {
        console.error('fetchHistorialEmpleado error:', err)
        throw err
      }
    },


    async fetchRecordsByEmployee() {
      try {
        debugger
        const res = await secureAxios.get('/attendance/by-employee')
        if (res.data.success) {
          this.employeeRecords = res.data.data
        } else {
          this.error = res.data.message || 'Error loading employee records'
        }
      } catch (err) {
        console.error('fetchRecordsByEmployee error:', err)
        this.error = 'Server error while loading employee attendance'
      }
    },

    async exportEmployeeExcel({ employeeId, from, to }) {
      try {
        const res = await secureAxios.post(
          '/attendance/export',
          { employeeId, from, to },
          { responseType: 'blob' }
        )

        const blob = new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `attendance_${employeeId}.xlsx`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error('exportEmployeeExcel error:', err)
        throw err
      }
    },
    // Crea una asistencia: POST /attendance/new
    async crearAsistencia({
      userId,
      tipo,          // 'entrada' | 'salida'
      mood,          // 'bien' | 'excelente' | 'normal' | 'cansado' | 'mal'
      note = '',     // string opcional
      ubicacion = null,   // { lat, lng } opcional
      timestamp = Date.now(), // opcional (ms)
      client = null        // opcional { platform, appVersion }
    }) {
      if (!userId || !tipo || !mood) {
        throw new Error('Faltan campos obligatorios (userId, tipo, mood)');
      }

      // Info de cliente por defecto si no viene
      const clientInfo = client || {
        platform: (navigator?.userAgentData?.platform || navigator?.platform || 'web'),
        appVersion: (import.meta?.env?.VITE_APP_VERSION || 'web')
      };

      // Normaliza ubicación
      const ubic = ubicacion && typeof ubicacion === 'object'
        ? { lat: Number(ubicacion.lat), lng: Number(ubicacion.lng) }
        : null;

      try {
        this.loading = true;
        this.error = null;

        const payload = {
          userId,
          tipo,
          mood,
          note: note ?? '',
          ubicacion: ubic,
          timestamp,
          client: clientInfo
        };

        const res = await secureAxios.post('/attendance/new', payload);

        // Tu backend responde { success:true, asistencia }
        if (res?.data?.success) {
          const saved = res.data.asistencia;

          // Opcional: actualiza cache local para feedback inmediato
          // (quita esto si prefieres recargar desde backend)
          this.records = [saved, ...this.records];

          return saved;
        }

        // Si el backend devuelve error sin success=true
        const msg = res?.data?.message || 'No se pudo crear la asistencia';
        this.error = msg;
        throw new Error(msg);
      } catch (err) {
        // Mensaje claro de backend si viene en response
        const backendMsg = err?.response?.data || err?.message || 'Error al crear asistencia';
        console.error('[crearAsistencia] Error:', backendMsg);
        this.error = typeof backendMsg === 'string' ? backendMsg : 'Error al crear asistencia';
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

  }
})
