<template>
  <q-page padding class="fisc-page">
    <div class="q-mb-md">
      <div class="text-h6">Reportes — {{ portal.company?.name }}</div>
      <div class="text-caption text-grey-7">RUT {{ portal.company?.rut }} · Res. Ex. N°38/2024, art. 24 c)</div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">Parámetros de búsqueda</div>
        <div class="row q-col-gutter-sm">
          <div class="col-6 col-md-3">
            <q-input v-model="filters.from" type="date" label="Desde" outlined dense />
          </div>
          <div class="col-6 col-md-3">
            <q-input v-model="filters.to" type="date" label="Hasta" outlined dense />
          </div>
          <div class="col-12 col-md-3">
            <q-input v-model="filters.userIds" label="RUT/IDs trabajadores" outlined dense placeholder="Individual o grupal (coma)" />
          </div>
          <div class="col-12 col-md-3">
            <q-select v-model="filters.cargo" :options="filterOptions.cargos" label="Cargo o función" outlined dense clearable />
          </div>
          <div class="col-12 col-md-3">
            <q-select v-model="filters.sucursal" :options="filterOptions.sucursales" label="Local / sucursal" outlined dense clearable />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.scheduleId"
              :options="turnoOptions"
              label="Turno"
              outlined dense clearable emit-value map-options
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md">
      <div v-for="r in reports" :key="r.key" class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center q-mb-sm">
              <q-icon :name="r.icon" size="28px" class="text-primary q-mr-sm" />
              <div class="text-subtitle1">{{ r.label }}</div>
            </div>
            <div class="text-caption text-grey-8">{{ r.description }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              color="primary"
              icon="download"
              label="Descargar Excel"
              unelevated
              no-caps
              :loading="downloadingKind === r.key"
              @click="download(r.key)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useDtPortalStore } from '@/stores/dtPortalStore'
import { DT_REPORT_KINDS } from '@/stores/dtStore'
import dtPortalAxios from '@/utils/dtPortalRequest'

const portal = useDtPortalStore()
const router = useRouter()
const $q = useQuasar()

const reports = DT_REPORT_KINDS
const downloadingKind = ref(null)
const filterOptions = reactive({ cargos: [], sucursales: [], turnos: [] })
const filters = reactive({ from: '', to: '', userIds: '', cargo: '', sucursal: '', scheduleId: '' })

const turnoOptions = ref([])

onMounted(async () => {
  if (!portal.isAuthenticated) {
    router.replace('/fiscalizacion')
    return
  }
  if (!portal.hasCompany) {
    router.replace('/fiscalizacion/empresas')
    return
  }
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, now.getMonth() + 1, 0).getDate()
  filters.from = `${y}-${m}-01`
  filters.to = `${y}-${m}-${String(last).padStart(2, '0')}`

  try {
    const { data } = await dtPortalAxios.get('/dt/inspect/report-filters')
    filterOptions.cargos = data.cargos || []
    filterOptions.sucursales = data.sucursales || []
    turnoOptions.value = (data.turnos || []).map((t) => ({
      label: t.active ? t.name : `${t.name} (inactivo)`,
      value: t.id,
    }))
  } catch {
    // Sin catálogo, los reportes igual se pueden pedir sin esos filtros.
  }
})

function buildQuery() {
  const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  return new URLSearchParams(clean).toString()
}

async function download(kind) {
  downloadingKind.value = kind
  try {
    const qs = buildQuery()
    const res = await dtPortalAxios.get(`/dt/inspect/reports/${kind}${qs ? '?' + qs : ''}`, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DT_${kind}_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error descargando reporte' })
  } finally {
    downloadingKind.value = null
  }
}
</script>

<style scoped>
.fisc-page { max-width: 1000px; margin: 0 auto; }
</style>
