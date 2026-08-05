<template>
  <q-page padding class="dt-page">
    <div class="q-mb-md">
      <div class="text-h5 text-weight-bold">
        <q-icon name="gavel" class="q-mr-sm text-primary" />
        Reportes Dirección del Trabajo
      </div>
      <div class="text-subtitle2 text-grey-7">
        Resolución Exenta N°38/2024 — Reportes obligatorios para fiscalización DT
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-xs">Parámetros de búsqueda</div>
        <div class="text-caption text-grey-7 q-mb-sm">
          Búsqueda individual y grupal, período, turnos, local y cargo o función
          (Dictamen ORD N°2927/58 §2.9.7).
        </div>
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.from"
              type="date"
              label="Desde"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.to"
              type="date"
              label="Hasta"
              outlined
              dense
            />
          </div>
          <div v-if="isSuperadmin" class="col-12 col-md-3">
            <q-select
              v-model="filters.companyId"
              :options="companyOptions"
              label="Empresa"
              outlined
              dense
              emit-value
              map-options
              clearable
              @update:model-value="loadFilterOptions"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.userIds"
              label="RUT/IDs trabajadores (separados por coma)"
              outlined
              dense
              placeholder="Individual o grupal"
              hint="Un RUT para búsqueda individual, varios separados por coma para grupal"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.cargo"
              :options="cargoOptions"
              label="Cargo o función"
              outlined
              dense
              clearable
              use-input
              new-value-mode="add-unique"
              input-debounce="0"
              :loading="loadingOptions"
              @filter="filterCargo"
            >
              <template #no-option>
                <q-item><q-item-section class="text-grey">Sin cargos registrados</q-item-section></q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.sucursal"
              :options="sucursalOptions"
              label="Local / sucursal"
              outlined
              dense
              clearable
              use-input
              new-value-mode="add-unique"
              input-debounce="0"
              :loading="loadingOptions"
              @filter="filterSucursal"
            >
              <template #no-option>
                <q-item><q-item-section class="text-grey">Sin locales registrados</q-item-section></q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.scheduleId"
              :options="turnoOptions"
              label="Turno"
              outlined
              dense
              clearable
              emit-value
              map-options
              :loading="loadingOptions"
            >
              <template #no-option>
                <q-item><q-item-section class="text-grey">Sin turnos configurados</q-item-section></q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-3 flex items-center">
            <q-btn
              flat
              dense
              no-caps
              icon="filter_alt_off"
              label="Limpiar filtros"
              color="grey-7"
              :disable="!hasActiveFilters"
              @click="clearFilters"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md">
      <div
        v-for="r in reports"
        :key="r.key"
        class="col-12 col-md-6 col-lg-4"
      >
        <q-card flat bordered class="report-card full-height">
          <q-card-section>
            <div class="row items-center q-mb-sm">
              <q-icon :name="r.icon" size="32px" class="text-primary q-mr-sm" />
              <div class="text-h6">{{ r.label }}</div>
            </div>
            <div class="text-body2 text-grey-8">{{ r.description }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              color="primary"
              icon="download"
              label="Descargar Excel"
              :loading="downloadingKind === r.key"
              @click="onDownload(r.key)"
              unelevated
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <q-card flat bordered class="q-mt-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-xs">
          <q-icon name="info" class="q-mr-xs" /> Sobre estos reportes
        </div>
        <div class="text-body2 text-grey-8">
          Cada archivo Excel incluye el <b>hash SHA-256 del conjunto</b> consultado,
          lo que permite a la fiscalización verificar la integridad del extracto,
          y deja constancia al pie de los <b>criterios de búsqueda</b> con que se generó
          (período, trabajadores, cargo, local y turno). Las horas se exhiben con
          <b>hora, minuto y segundo</b>.
          Los registros marcados como "modificados" quedan resaltados con la razón
          declarada y la persona que los alteró. Esta información se conserva por
          al menos 5 años desde la desvinculación del trabajador.
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useDtStore, DT_REPORT_KINDS } from '@/stores/dtStore'
import { useCompaniesStore } from '@/stores/companies'
import { useAuthStore } from '@/stores/authStore'

const dt = useDtStore()
const companies = useCompaniesStore()
const auth = useAuthStore()
const $q = useQuasar()

const reports = DT_REPORT_KINDS
const downloadingKind = ref(null)
const loadingOptions = ref(false)
const filters = reactive({
  from: '',
  to: '',
  companyId: '',
  userIds: '',
  // Parámetros de búsqueda exigidos por la DT además del período y el trabajador
  cargo: '',
  sucursal: '',
  scheduleId: '',
})

const companyOptions = computed(() =>
  (companies.companies || []).map((c) => ({ label: c.name, value: c._id }))
)
const isSuperadmin = computed(() => auth.role === 'superadmin')

/* ---- Opciones de los selectores (cargos, locales, turnos de la empresa) ---- */
const cargoFilter = ref('')
const sucursalFilter = ref('')

const cargoOptions = computed(() => {
  const all = dt.reportFilterOptions?.cargos || []
  const needle = cargoFilter.value.toLowerCase()
  return needle ? all.filter((c) => c.toLowerCase().includes(needle)) : all
})
const sucursalOptions = computed(() => {
  const all = dt.reportFilterOptions?.sucursales || []
  const needle = sucursalFilter.value.toLowerCase()
  return needle ? all.filter((s) => s.toLowerCase().includes(needle)) : all
})
const turnoOptions = computed(() =>
  (dt.reportFilterOptions?.turnos || []).map((t) => ({
    label: t.active ? t.name : `${t.name} (inactivo)`,
    value: t.id,
  }))
)

function filterCargo(val, update) {
  update(() => { cargoFilter.value = val || '' })
}
function filterSucursal(val, update) {
  update(() => { sucursalFilter.value = val || '' })
}

const hasActiveFilters = computed(
  () => !!(filters.userIds || filters.cargo || filters.sucursal || filters.scheduleId)
)
function clearFilters() {
  filters.userIds = ''
  filters.cargo = ''
  filters.sucursal = ''
  filters.scheduleId = ''
}

async function loadFilterOptions() {
  loadingOptions.value = true
  try {
    // El turno seleccionado pertenece a la empresa anterior: al cambiarla se descarta.
    filters.scheduleId = ''
    await dt.fetchReportFilters(isSuperadmin.value ? { companyId: filters.companyId } : {})
  } catch {
    // Sin catálogo los selectores quedan vacíos, pero admiten texto libre
    // (new-value-mode), así que la búsqueda por cargo o local sigue disponible.
  } finally {
    loadingOptions.value = false
  }
}

onMounted(async () => {
  try {
    if (typeof companies.fetchCompanies === 'function') await companies.fetchCompanies()
  } catch {}
  // Por defecto, si el usuario pertenece a una sola empresa la preseleccionamos
  if (auth.user?.company) filters.companyId = auth.user.company
  // Rango por defecto: mes actual
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, now.getMonth() + 1, 0).getDate()
  filters.from = `${y}-${m}-01`
  filters.to = `${y}-${m}-${String(last).padStart(2, '0')}`
  await loadFilterOptions()
})

async function onDownload(kind) {
  downloadingKind.value = kind
  try {
    const result = await dt.downloadReport(kind, filters)
    if (!result.ok) {
      $q.notify({ type: 'negative', message: result.error || 'Error descargando reporte' })
    } else {
      $q.notify({ type: 'positive', message: 'Reporte descargado' })
    }
  } finally {
    downloadingKind.value = null
  }
}
</script>

<style scoped>
.dt-page { max-width: 1200px; margin: 0 auto; }
.report-card {
  transition: transform 0.15s ease;
  border-left: 4px solid var(--q-primary);
}
.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
</style>
