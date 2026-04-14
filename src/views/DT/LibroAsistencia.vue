<template>
  <q-page padding class="libro-page">
    <div class="q-mb-md">
      <div class="text-h5 text-weight-bold">
        <q-icon name="menu_book" class="q-mr-sm text-primary" />
        Libro de Asistencia
      </div>
      <div class="text-subtitle2 text-grey-7">
        Resumen semanal conforme a la Ley 21.561 (Chile — "40 horas").
        Límite legal vigente: <b>{{ legalLimit || '—' }} horas semanales.</b>
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-sm items-end">
          <div class="col-12 col-md-3">
            <q-input v-model="filters.from" type="date" label="Desde" outlined dense />
          </div>
          <div class="col-12 col-md-3">
            <q-input v-model="filters.to" type="date" label="Hasta" outlined dense />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.cycle"
              :options="cycleOptions"
              label="Ciclo de promediado (Art.22 CT)"
              outlined dense emit-value map-options
            />
          </div>
          <div class="col-12 col-md-3 text-right">
            <q-btn color="primary" icon="refresh" label="Consultar" unelevated @click="load" />
            <q-btn
              color="primary" outline icon="download"
              label="Exportar Excel" class="q-ml-sm"
              @click="onExport"
              :loading="exporting"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered>
      <q-table
        :rows="rows"
        :columns="columns"
        :loading="loading"
        row-key="rowKey"
        flat
        :pagination="{ rowsPerPage: 25 }"
      >
        <template #body-cell-compliance="props">
          <q-td :props="props">
            <q-chip
              :color="props.row.compliance === 'OK' ? 'positive' : 'negative'"
              text-color="white" dense
              :icon="props.row.compliance === 'OK' ? 'check_circle' : 'error'"
            >
              {{ props.row.compliance === 'OK' ? 'CUMPLE' : 'EXCEDE' }}
            </q-chip>
          </q-td>
        </template>
        <template #body-cell-cycleCompliance="props">
          <q-td :props="props">
            <span v-if="props.row.cycleAverageHours != null">
              {{ props.row.cycleAverageHours }}h
              <q-chip
                :color="props.row.cycleCompliance === 'OK' ? 'positive' : 'warning'"
                text-color="white" dense size="sm"
              >
                {{ props.row.cycleCompliance === 'OK' ? 'OK' : 'EXCEDE' }}
              </q-chip>
            </span>
            <span v-else class="text-grey-5">—</span>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-banner class="q-mt-md bg-blue-1 text-grey-9">
      <template #avatar><q-icon name="info" color="primary" /></template>
      <div class="text-body2">
        <b>Ley 21.561 — tramos vigentes:</b>
        44h/semana hasta 25-04-2026 · 42h/semana desde 26-04-2026 · 40h/semana desde 26-04-2028.
        El ciclo de promediado del Art. 22 del Código del Trabajo permite equilibrar
        semanas de hasta 4, siempre que el promedio no exceda el límite legal.
      </div>
    </q-banner>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useDtStore } from '@/stores/dtStore'

const dt = useDtStore()
const $q = useQuasar()

const rows = ref([])
const loading = ref(false)
const exporting = ref(false)
const legalLimit = ref(null)

const cycleOptions = [
  { label: 'Semanal (sin promediar)', value: 1 },
  { label: 'Ciclo 2 semanas', value: 2 },
  { label: 'Ciclo 3 semanas', value: 3 },
  { label: 'Ciclo 4 semanas', value: 4 },
]

const filters = reactive({
  from: '',
  to: '',
  cycle: 1,
})

const columns = computed(() => {
  const base = [
    { name: 'rut', label: 'RUT', field: (r) => r.identity?.rut || '—', align: 'left' },
    { name: 'name', label: 'Trabajador', field: (r) => r.identity?.fullName || '—', align: 'left' },
    { name: 'week', label: 'Semana', field: 'week', align: 'left' },
    { name: 'ordinary', label: 'H. ordinarias', field: 'ordinaryHours', align: 'right' },
    { name: 'lunch', label: 'Colación', field: 'lunchHours', align: 'right' },
    { name: 'overtime', label: 'H. extras', field: 'overtimeHours', align: 'right' },
    { name: 'limit', label: 'Límite', field: 'legalLimit', align: 'right' },
    { name: 'compliance', label: 'Semana', field: 'compliance', align: 'center' },
  ]
  if (filters.cycle > 1) {
    base.push({ name: 'cycleCompliance', label: `Promedio ${filters.cycle}s`, field: 'cycleCompliance', align: 'center' })
  }
  return base
})

async function load() {
  loading.value = true
  try {
    const data = await dt.fetchWeeklyLibro(filters)
    rows.value = (data?.rows || []).map((r, i) => ({
      ...r,
      rowKey: `${r.userId}-${r.week}-${i}`,
    }))
    legalLimit.value = data?.meta?.legalLimit || null
  } catch (err) {
    console.error('[LibroAsistencia] load error:', err)
    $q.notify({ type: 'negative', message: 'Error cargando libro de asistencia' })
  } finally {
    loading.value = false
  }
}

async function onExport() {
  exporting.value = true
  try {
    await dt.exportWeeklyLibro(filters)
    $q.notify({ type: 'positive', message: 'Libro exportado' })
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Error exportando libro' })
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  // Mes actual por defecto
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, now.getMonth() + 1, 0).getDate()
  filters.from = `${y}-${m}-01`
  filters.to = `${y}-${m}-${String(last).padStart(2, '0')}`
  load()
})
</script>

<style scoped>
.libro-page { max-width: 1300px; margin: 0 auto; }
</style>
