<template>
  <q-page padding>
    <div class="inspector-shell">
      <div class="text-h5 text-weight-bold q-mb-sm">
        <q-icon name="fact_check" class="text-primary q-mr-sm" />
        Inspección de registros de asistencia
      </div>

      <q-card flat bordered class="q-mb-md">
        <q-card-section class="row q-col-gutter-sm">
          <div class="col-6 col-md-3">
            <q-input v-model="filters.from" type="date" label="Desde" outlined dense />
          </div>
          <div class="col-6 col-md-3">
            <q-input v-model="filters.to" type="date" label="Hasta" outlined dense />
          </div>
          <div class="col-6 col-md-3">
            <q-select
              v-model="filters.tipo"
              :options="['entrada','salida','colacion_inicio','colacion_fin','he_inicio','he_fin']"
              label="Tipo" outlined dense clearable
            />
          </div>
          <div class="col-6 col-md-3">
            <q-toggle v-model="filters.modifiedOnly" label="Solo modificados" />
          </div>
          <div class="col-12 text-right">
            <q-btn color="primary" icon="refresh" label="Consultar" unelevated @click="load" />
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-table
          :rows="rows"
          :columns="columns"
          :loading="loading"
          row-key="_id"
          flat
          :pagination="{ rowsPerPage: 30 }"
        >
          <template #body-cell-integrity="props">
            <q-td :props="props">
              <q-icon
                :name="props.row.integrityOk ? 'verified' : 'dangerous'"
                :color="props.row.integrityOk ? 'positive' : 'negative'"
                size="22px"
              />
            </q-td>
          </template>
          <template #body-cell-modified="props">
            <q-td :props="props">
              <q-chip v-if="props.row.modified" color="warning" text-color="white" dense>
                Modificado
              </q-chip>
              <span v-else class="text-grey-5">—</span>
            </q-td>
          </template>
          <template #body-cell-hash="props">
            <q-td :props="props">
              <code class="hash-cell">{{ (props.row.hash || '').slice(0, 14) }}…</code>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import secureAxios from '@/utils/secureRequest'

const filters = reactive({ from: '', to: '', tipo: null, modifiedOnly: false })
const rows = ref([])
const loading = ref(false)

const columns = [
  { name: 'fecha', label: 'Fecha servidor', field: (r) => new Date(r.serverTimestamp || r.timestamp).toLocaleString('es-CL'), align: 'left' },
  { name: 'rut', label: 'RUT', field: (r) => r.identity?.rut || '', align: 'left' },
  { name: 'name', label: 'Trabajador', field: (r) => r.identity?.fullName || '', align: 'left' },
  { name: 'company', label: 'Empleador', field: (r) => r.identity?.companyName || '', align: 'left' },
  { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'left' },
  { name: 'hash', label: 'Hash', field: 'hash', align: 'left' },
  { name: 'integrity', label: 'Integridad', field: 'integrityOk', align: 'center' },
  { name: 'modified', label: '', field: 'modified', align: 'center' },
]

async function load() {
  loading.value = true
  try {
    const qs = new URLSearchParams({
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
      ...(filters.tipo ? { tipo: filters.tipo } : {}),
      ...(filters.modifiedOnly ? { modified: 'true' } : {}),
      limit: '500',
    }).toString()
    const { data } = await secureAxios.get(`/dt/inspect/attendance?${qs}`)
    rows.value = data.rows || []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.inspector-shell { max-width: 1300px; margin: 0 auto; }
.hash-cell { font-family: monospace; font-size: 11px; }
</style>
