<template>
  <q-page padding class="dt-page">
    <div class="text-h5 text-weight-bold q-mb-xs">
      <q-icon name="gavel" class="q-mr-sm text-primary" />
      Accesos al portal de fiscalización
    </div>
    <div class="text-subtitle2 text-grey-7 q-mb-md">
      Res. Ex. N°38/2024, art. 22.5 — conexiones de funcionarios DT (self-service, sin intervención de RR.HH.).
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-col-gutter-sm items-end">
        <div class="col-6 col-md-3">
          <q-input v-model="filters.from" type="date" label="Desde" outlined dense />
        </div>
        <div class="col-6 col-md-3">
          <q-input v-model="filters.to" type="date" label="Hasta" outlined dense />
        </div>
        <div class="col-6 col-md-3">
          <q-btn color="primary" icon="refresh" label="Consultar" unelevated no-caps @click="load" />
        </div>
        <div class="col-6 col-md-3 text-right">
          <q-btn color="secondary" icon="file_download" label="Exportar CSV" unelevated no-caps @click="exportCsv" />
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered>
      <q-table :rows="rows" :columns="columns" :loading="loading" row-key="_id" flat :pagination="{ rowsPerPage: 20 }" />
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import secureAxios from '@/utils/secureRequest'
import { API_URL } from '@/utils/api'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const filters = reactive({ from: '', to: '' })
const rows = ref([])
const loading = ref(false)

const columns = [
  { name: 'createdAt', label: 'Fecha y hora', field: (r) => new Date(r.createdAt).toLocaleString('es-CL', { timeZone: 'America/Santiago' }), align: 'left' },
  { name: 'action', label: 'Evento', field: (r) => (r.action === 'DT_INSPECTION_STARTED' ? 'Fiscalización iniciada' : 'Ingreso al portal'), align: 'left' },
  { name: 'email', label: 'Correo del funcionario', field: (r) => r.actorName || r.context?.extra?.inspectorEmail || r.context?.extra?.email || '', align: 'left' },
  { name: 'company', label: 'Empresa consultada', field: (r) => (r.companyId ? `${r.companyId.name || ''} (${r.companyId.rut || ''})` : ''), align: 'left' },
  { name: 'ip', label: 'IP', field: (r) => r.context?.ip || '', align: 'left' },
]

function buildQuery(params) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  return new URLSearchParams(clean).toString()
}

async function load() {
  loading.value = true
  try {
    const qs = buildQuery(filters)
    const { data } = await secureAxios.get(`/dt/portal/access-log${qs ? '?' + qs : ''}`)
    rows.value = data.rows || []
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  const qs = buildQuery(filters)
  const url = `${API_URL}/dt/portal/access-log/export${qs ? '?' + qs : ''}`
  // Descarga autenticada: el token va en el header, así que no basta con
  // window.open. Reutilizamos el mismo fetch con Authorization manual.
  fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = `DT_accesos_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)
    })
}

onMounted(load)
</script>

<style scoped>
.dt-page { max-width: 1200px; margin: 0 auto; }
</style>
