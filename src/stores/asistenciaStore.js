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

    async fetchRecordsByEmployee() {
      try {
        const res = await secureAxios.get('/attendance/by-employee')
        debugger
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
    }
  }
})
