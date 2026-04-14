<template>
  <q-page padding class="dt-page">
    <div class="text-h5 text-weight-bold q-mb-sm">
      <q-icon name="history" class="text-primary q-mr-sm" />
      Bitácora de auditoría
    </div>
    <div class="text-subtitle2 text-grey-7 q-mb-md">
      Registro inmutable (append-only) de toda acción realizada sobre las
      marcaciones de asistencia. Exigido por la Res. Ex. 38/2024.
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
            v-model="filters.entity"
            :options="['attendance', 'user', 'dt-report', 'dt_inspector_access']"
            label="Entidad"
            outlined dense clearable
          />
        </div>
        <div class="col-6 col-md-3 text-right">
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
        :pagination="{ rowsPerPage: 20 }"
      >
        <template #body-cell-diff="props">
          <q-td :props="props">
            <q-btn size="sm" flat icon="visibility" @click="showDiff(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="diffOpen">
      <q-card style="min-width:520px;max-width:780px">
        <q-card-section>
          <div class="text-h6">Detalle del evento</div>
          <div class="text-caption text-grey-7">{{ selected?.action }}</div>
        </q-card-section>
        <q-card-section>
          <div class="text-subtitle2 q-mt-sm">Antes</div>
          <pre class="q-pa-sm bg-grey-2">{{ JSON.stringify(selected?.before, null, 2) || '-' }}</pre>
          <div class="text-subtitle2 q-mt-md">Después</div>
          <pre class="q-pa-sm bg-grey-2">{{ JSON.stringify(selected?.after, null, 2) || '-' }}</pre>
          <div class="text-subtitle2 q-mt-md">Contexto</div>
          <pre class="q-pa-sm bg-grey-2">{{ JSON.stringify(selected?.context, null, 2) }}</pre>
        </q-card-section>
        <q-card-actions align="right"><q-btn flat label="Cerrar" v-close-popup /></q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useDtStore } from '@/stores/dtStore'

const dt = useDtStore()

const filters = reactive({ from: '', to: '', entity: '' })
const rows = ref([])
const loading = ref(false)
const diffOpen = ref(false)
const selected = ref(null)

const columns = [
  { name: 'createdAt', label: 'Fecha', field: (r) => new Date(r.createdAt).toLocaleString('es-CL'), align: 'left' },
  { name: 'action', label: 'Acción', field: 'action', align: 'left' },
  { name: 'entity', label: 'Entidad', field: 'entity', align: 'left' },
  { name: 'actor', label: 'Actor', field: (r) => `${r.actorName || ''} (${r.actorRole || ''})`, align: 'left' },
  { name: 'reason', label: 'Razón', field: (r) => r.context?.reason || '', align: 'left' },
  { name: 'ip', label: 'IP', field: (r) => r.context?.ip || '', align: 'left' },
  { name: 'diff', label: 'Detalle', field: '_id', align: 'center' },
]

async function load() {
  loading.value = true
  try {
    const data = await dt.fetchAuditLog(filters)
    rows.value = data.rows || []
  } finally {
    loading.value = false
  }
}

function showDiff(row) {
  selected.value = row
  diffOpen.value = true
}

onMounted(load)
</script>

<style scoped>
.dt-page { max-width: 1300px; margin: 0 auto; }
pre { font-size: 11px; white-space: pre-wrap; max-height: 240px; overflow:auto; }
</style>
