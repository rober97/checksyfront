// src/stores/asistencia.js
import { defineStore } from 'pinia'
import axios from 'axios'
import { API_URL } from '@/utils/api'

export const useAsistenciaStore = defineStore('asistencia', {
  state: () => ({
    asistencias: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAsistencias() {
      this.loading = true
      try {
        const res = await axios.get(`${API_URL}/asistencias`)
        this.asistencias = res.data
        this.error = null
      } catch (err) {
        this.error = 'Error al cargar asistencias'
        this.asistencias = []
      } finally {
        this.loading = false
      }
    }
  }
})
