<template>
  <q-page padding>
    <div class="q-mb-md">
      <div class="text-h5 text-weight-bold">
        <q-icon name="receipt_long" class="text-primary q-mr-sm" />
        Mis comprobantes de asistencia
      </div>
      <div class="text-caption text-grey-7">
        Cada marcación genera un comprobante con hash verificable. Puedes
        reenviar el comprobante a tu correo personal o consultarlo aquí.
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-table
        :rows="records"
        :columns="columns"
        row-key="_id"
        flat
        :loading="loading"
        :pagination="{ rowsPerPage: 15 }"
      >
        <template #body-cell-modified="props">
          <q-td :props="props">
            <q-chip
              v-if="props.row.modified"
              color="warning" text-color="white" dense
              icon="edit_note"
            >
              Modificado
            </q-chip>
            <span v-else class="text-grey-5">—</span>
          </q-td>
        </template>
        <template #body-cell-hash="props">
          <q-td :props="props">
            <code class="hash-mini">{{ (props.row.hash || '').slice(0, 10) }}…</code>
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              size="sm" flat icon="visibility" color="primary"
              @click="openDetail(props.row)"
            />
            <q-btn
              v-if="canObject(props.row)"
              size="sm" flat icon="gavel" color="negative" label="Objetar"
              @click="objectItem(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="detailOpen">
      <q-card style="min-width:480px;max-width:620px">
        <q-card-section>
          <div class="text-h6">Comprobante</div>
          <div class="text-caption text-grey-7">{{ tipoLabel(selected?.tipo) }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div><b>Fecha:</b> {{ fmt(selected?.serverTimestamp || selected?.timestamp) }}</div>
          <div><b>RUT:</b> {{ selected?.identity?.rut }}</div>
          <div><b>Empleador:</b> {{ selected?.identity?.companyName }}</div>
          <div class="q-mt-sm"><b>Hash SHA-256:</b></div>
          <pre class="hash-full">{{ selected?.hash }}</pre>
          <q-banner v-if="selected?.modified" class="bg-amber-2 q-mt-sm">
            <q-icon name="edit_note" /> Registro modificado el {{ fmt(selected?.modifiedAt) }}.
            Razón: {{ selected?.modificationReason || '-' }}
          </q-banner>
          <div class="q-mt-md">
            <q-btn
              color="primary" icon="open_in_new" label="Verificador público"
              :href="verifyUrl" target="_blank" unelevated dense
            />
          </div>
        </q-card-section>
        <q-card-actions align="right"><q-btn flat label="Cerrar" v-close-popup /></q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import secureAxios from '@/utils/secureRequest'
import { useAuthStore } from '@/stores/authStore'
import { useDtStore } from '@/stores/dtStore'

const auth = useAuthStore()
const dt = useDtStore()
const $q = useQuasar()

const records = ref([])
const loading = ref(false)
const detailOpen = ref(false)
const selected = ref(null)

const verifyUrl = computed(() => {
  if (!selected.value?.hash) return '#'
  return `/verificar-comprobante/${selected.value.hash}`
})

const columns = [
  { name: 'fecha', label: 'Fecha', field: (r) => fmt(r.serverTimestamp || r.timestamp), align: 'left' },
  { name: 'tipo', label: 'Tipo', field: (r) => tipoLabel(r.tipo), align: 'left' },
  { name: 'hash', label: 'Hash', field: 'hash', align: 'left' },
  { name: 'modified', label: 'Modificación', field: 'modified', align: 'center' },
  { name: 'actions', label: '', field: '_id', align: 'center' },
]

const TIPOS = {
  entrada: 'Entrada',
  salida: 'Salida',
  colacion_inicio: 'Inicio colación',
  colacion_fin: 'Fin colación',
  he_inicio: 'Inicio HE',
  he_fin: 'Fin HE',
}

function tipoLabel(t) { return TIPOS[t] || t }
function fmt(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' })
}
function openDetail(row) { selected.value = row; detailOpen.value = true }

function canObject(row) {
  if (!row.modified) return false
  if (row.workerObjected) return false
  if (!row.modificationWindowEnds) return false
  return new Date(row.modificationWindowEnds) > new Date()
}

async function objectItem(row) {
  $q.dialog({
    title: 'Objetar modificación',
    message: 'Vas a rechazar esta modificación. Se registrará en la bitácora y se notificará al empleador.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await dt.objectModification(row._id)
      $q.notify({ type: 'positive', message: 'Objeción registrada' })
      await load()
    } catch (err) {
      $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error' })
    }
  })
}

async function load() {
  loading.value = true
  try {
    const userId = auth.user?._id || auth.user?.id
    const { data } = await secureAxios.get(`/attendance/list?userId=${userId}&sort=desc&limit=200`)
    records.value = data.rows || []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.hash-mini { font-family: monospace; font-size: 11px; }
.hash-full { font-family: monospace; font-size: 11px; word-break: break-all; background: #f4f4f4; padding: 8px; border-radius: 4px; }
</style>
