<template>
  <q-page class="sa-page">
    <div class="sa-header">
      <div>
        <h1 class="sa-title">Saldos de apertura objetados</h1>
        <p class="sa-sub">
          Empleados que, al activar su cuenta, indicaron que el saldo de vacaciones cargado no coincide
          con el suyo. Revisa cada caso y corrige o confirma el saldo.
        </p>
      </div>
      <q-btn flat round icon="refresh" :loading="loading" @click="load" />
    </div>

    <q-card flat bordered>
      <q-table
        :rows="items"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        flat
        :pagination="{ rowsPerPage: 20 }"
        no-data-label="No hay saldos objetados pendientes."
      >
        <template #body-cell-declaredDays="props">
          <q-td :props="props">
            <span class="sa-days">{{ props.row.declaredDays ?? '—' }}</span> días
          </q-td>
        </template>
        <template #body-cell-cutoffDate="props">
          <q-td :props="props">{{ formatDate(props.row.cutoffDate) }}</q-td>
        </template>
        <template #body-cell-activationCompletedAt="props">
          <q-td :props="props">{{ formatDate(props.row.activationCompletedAt) }}</q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn dense unelevated color="primary" icon="rule" label="Resolver" @click="openResolve(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- ===== Diálogo de resolución ===== -->
    <q-dialog v-model="resolveOpen">
      <q-card style="min-width: 420px; max-width: 90vw">
        <q-card-section class="row items-center">
          <div class="text-h6">Resolver objeción</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup :disable="saving" />
        </q-card-section>

        <q-card-section v-if="current">
          <div class="sa-emp">{{ current.firstName }} {{ current.lastName }} · {{ current.rut }}</div>
          <div class="sa-declared">
            Saldo declarado actual: <b>{{ current.declaredDays }}</b> días
            <span v-if="current.cutoffDate">(al {{ formatDate(current.cutoffDate) }})</span>
          </div>

          <q-input
            v-model="newDays"
            type="number" outlined dense
            label="Saldo corregido (días)"
            hint="Déjalo vacío para confirmar el saldo original como correcto."
            class="q-mt-md"
            min="0" step="0.5"
          >
            <template #prepend><q-icon name="beach_access" /></template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup :disable="saving" />
          <q-btn
            outline color="primary"
            :label="hasNewDays ? 'Corregir saldo' : 'Confirmar original'"
            :loading="saving"
            @click="doResolve"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useUserStore } from '@/stores/userStore'

const $q = useQuasar()
const userStore = useUserStore()

const items = ref([])
const loading = ref(false)
const saving = ref(false)

const resolveOpen = ref(false)
const current = ref(null)
const newDays = ref('')

const hasNewDays = computed(() => newDays.value !== '' && newDays.value != null)

const columns = [
  { name: 'name', label: 'Empleado', align: 'left', field: r => `${r.firstName} ${r.lastName}`.trim() },
  { name: 'rut', label: 'RUT', align: 'left', field: 'rut' },
  { name: 'company', label: 'Empresa', align: 'left', field: r => r.company?.name || '—' },
  { name: 'declaredDays', label: 'Saldo declarado', align: 'left', field: 'declaredDays' },
  { name: 'cutoffDate', label: 'Fecha de corte', align: 'left', field: 'cutoffDate' },
  { name: 'activationCompletedAt', label: 'Activó el', align: 'left', field: 'activationCompletedAt' },
  { name: 'actions', label: '', align: 'right', field: 'actions' },
]

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(d))
  } catch {
    return String(d)
  }
}

async function load() {
  try {
    loading.value = true
    items.value = await userStore.fetchOpeningDisputes()
  } catch (e) {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar las objeciones' })
  } finally {
    loading.value = false
  }
}

function openResolve(row) {
  current.value = row
  newDays.value = ''
  resolveOpen.value = true
}

async function doResolve() {
  if (!current.value) return
  try {
    saving.value = true
    await userStore.resolveOpeningDispute(current.value._id, {
      newDays: hasNewDays.value ? Number(newDays.value) : undefined,
    })
    $q.notify({ type: 'positive', message: 'Objeción resuelta', position: 'top-right' })
    resolveOpen.value = false
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.response?.data?.message || 'No se pudo resolver' })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.sa-page { padding: 28px 32px 60px; }
.sa-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.sa-title { font-size: 1.4rem; font-weight: 800; margin: 0; }
.sa-sub { color: #64748b; font-size: .9rem; max-width: 720px; margin: 4px 0 0; line-height: 1.5; }
.sa-days { font-weight: 800; color: #4f46e5; }
.sa-emp { font-weight: 700; }
.sa-declared { color: #475569; font-size: .9rem; margin-top: 4px; }
</style>
