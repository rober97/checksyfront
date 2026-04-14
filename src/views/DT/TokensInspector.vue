<template>
  <q-page padding class="dt-page">
    <div class="text-h5 text-weight-bold q-mb-sm">
      <q-icon name="badge" class="text-primary q-mr-sm" />
      Accesos de fiscalizadores DT
    </div>
    <div class="text-subtitle2 text-grey-7 q-mb-md">
      Emisión de tokens para fiscalizadores externos de la Dirección del Trabajo.
      Vigencia mínima 10 días. Los fiscalizadores que accedan desde la red oficial
      DT (200.72.242.0/27) no necesitan token.
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">Emitir nuevo token</div>
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-4">
            <q-input v-model="form.inspectorName" label="Nombre fiscalizador" outlined dense />
          </div>
          <div class="col-12 col-md-4">
            <q-input v-model="form.inspectorEmail" label="Email *" outlined dense />
          </div>
          <div class="col-12 col-md-2">
            <q-input v-model="form.inspectorRut" label="RUT" outlined dense />
          </div>
          <div class="col-12 col-md-2">
            <q-input v-model.number="form.days" type="number" :min="10" label="Días vigencia" outlined dense />
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn color="primary" icon="add" label="Emitir token" unelevated :loading="dt.loading" @click="issue" />
      </q-card-actions>
    </q-card>

    <q-card flat bordered>
      <q-table
        :rows="dt.inspectorTokens"
        :columns="columns"
        row-key="_id"
        flat
        :loading="dt.loading"
        :pagination="{ rowsPerPage: 10 }"
      >
        <template #body-cell-token="props">
          <q-td :props="props">
            <code class="token-cell">{{ props.row.token }}</code>
            <q-btn
              dense flat size="sm" icon="content_copy"
              @click="copy(props.row.token)"
            />
          </q-td>
        </template>
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip
              :color="statusColor(props.row)"
              text-color="white" dense
            >
              {{ statusLabel(props.row) }}
            </q-chip>
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              v-if="!props.row.revoked"
              size="sm" color="negative" flat icon="block"
              label="Revocar"
              @click="revoke(props.row._id)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useDtStore } from '@/stores/dtStore'

const dt = useDtStore()
const $q = useQuasar()

const form = reactive({
  inspectorName: '',
  inspectorEmail: '',
  inspectorRut: '',
  days: 10,
})

const columns = [
  { name: 'inspectorName', label: 'Nombre', field: 'inspectorName', align: 'left' },
  { name: 'inspectorEmail', label: 'Email', field: 'inspectorEmail', align: 'left' },
  { name: 'token', label: 'Token', field: 'token', align: 'left' },
  { name: 'expiresAt', label: 'Expira', field: (r) => new Date(r.expiresAt).toLocaleString('es-CL'), align: 'left' },
  { name: 'status', label: 'Estado', field: 'revoked', align: 'center' },
  { name: 'actions', label: '', field: '_id', align: 'center' },
]

function statusColor(r) {
  if (r.revoked) return 'grey'
  if (new Date(r.expiresAt) < new Date()) return 'warning'
  return 'positive'
}
function statusLabel(r) {
  if (r.revoked) return 'Revocado'
  if (new Date(r.expiresAt) < new Date()) return 'Expirado'
  return 'Activo'
}
function copy(text) {
  navigator.clipboard?.writeText(text)
  $q.notify({ type: 'positive', message: 'Token copiado', timeout: 1500 })
}

async function issue() {
  if (!form.inspectorEmail) {
    $q.notify({ type: 'negative', message: 'Email requerido' })
    return
  }
  try {
    const access = await dt.issueInspectorToken({ ...form })
    $q.notify({ type: 'positive', message: 'Token emitido' })
    $q.dialog({
      title: 'Token emitido',
      message: `Copia este token ahora, no se volverá a mostrar:\n\n${access.token}`,
      ok: 'Entendido',
    })
    form.inspectorName = ''
    form.inspectorEmail = ''
    form.inspectorRut = ''
    form.days = 10
  } catch (err) {
    $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error' })
  }
}

async function revoke(id) {
  $q.dialog({
    title: 'Revocar token',
    message: '¿Revocar este token? El fiscalizador perderá acceso inmediatamente.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await dt.revokeInspectorToken(id)
      $q.notify({ type: 'positive', message: 'Token revocado' })
    } catch (err) {
      $q.notify({ type: 'negative', message: 'Error revocando' })
    }
  })
}

onMounted(() => dt.fetchInspectorTokens())
</script>

<style scoped>
.dt-page { max-width: 1200px; margin: 0 auto; }
.token-cell { font-family: monospace; font-size: 11px; padding: 2px 6px; background: #f0f0f0; border-radius: 3px; }
</style>
