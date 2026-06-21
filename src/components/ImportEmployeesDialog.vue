<template>
  <q-dialog v-model="open" persistent>
    <q-card class="ie-card">
      <q-card-section class="row items-center no-wrap ie-head">
        <q-icon name="upload_file" size="22px" class="q-mr-sm" />
        <div class="text-h6">Importar empleados (carga inicial)</div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup :disable="validating || committing" />
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <div class="ie-hint">
          Sube el Excel con tus empleados. Primero <b>validamos</b> sin crear nada y te mostramos los
          errores fila por fila; luego confirmas la carga. Para empleados que ya trabajan en la empresa,
          incluye su <b>fecha de ingreso histórica</b> y su <b>saldo de vacaciones</b> a la fecha de corte.
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6" v-if="empresas && empresas.length > 1">
            <q-select
              v-model="companyId"
              :options="companyOptions"
              option-value="value"
              option-label="label"
              emit-value map-options
              outlined dense label="Empresa destino"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input v-model="cutoffDate" outlined dense type="date" label="Fecha de corte">
              <template #prepend><q-icon name="event" /></template>
            </q-input>
          </div>
        </div>

        <div class="row items-center q-gutter-sm">
          <q-btn outline color="primary" icon="download" label="Descargar plantilla" :loading="downloading" @click="onDownloadTemplate" />
          <q-space />
        </div>

        <q-file
          v-model="file"
          outlined dense
          label="Archivo Excel (.xlsx)"
          accept=".xlsx"
          :disable="validating || committing"
          @update:model-value="resetReport"
        >
          <template #prepend><q-icon name="attach_file" /></template>
        </q-file>

        <q-checkbox
          v-model="sendInvites"
          label="Enviar correos de activación al crear (si no, se reenvían después desde cada ficha)"
        />

        <!-- ===== Reporte ===== -->
        <div v-if="report" class="ie-report">
          <div class="ie-summary">
            <span class="ie-chip ie-chip--total">Total: {{ report.total }}</span>
            <span class="ie-chip ie-chip--ok">OK: {{ report.ok }}</span>
            <span class="ie-chip ie-chip--err" v-if="report.failed">Errores: {{ report.failed }}</span>
            <span class="ie-mode">{{ report.mode === 'dryRun' ? 'Validación (no se creó nada)' : 'Carga realizada' }}</span>
          </div>

          <div class="ie-table-wrap" v-if="report.report?.length">
            <table class="ie-table">
              <thead>
                <tr><th>Fila</th><th>Nombre</th><th>RUT</th><th>Estado</th><th>Detalle</th></tr>
              </thead>
              <tbody>
                <tr v-for="r in report.report" :key="r.row" :class="r.status === 'error' ? 'is-err' : 'is-ok'">
                  <td>{{ r.row }}</td>
                  <td>{{ r.name || '—' }}</td>
                  <td>{{ r.rut || '—' }}</td>
                  <td>
                    <q-icon :name="r.status === 'ok' ? 'check_circle' : 'error'" :color="r.status === 'ok' ? 'positive' : 'negative'" size="16px" />
                    {{ r.status === 'ok' ? 'OK' : 'Error' }}
                  </td>
                  <td>{{ r.message || '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="report.hint" class="ie-report-hint">{{ report.hint }}</div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cerrar" v-close-popup :disable="validating || committing" />
        <q-btn
          color="primary" outline icon="fact_check" label="Validar"
          :loading="validating" :disable="!file || committing"
          @click="onValidate"
        />
        <q-btn
          v-if="canCommit"
          color="primary" unelevated icon="group_add"
          :label="`Crear ${report.ok} empleado(s)`"
          :loading="committing"
          @click="onCommit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useUserStore } from '@/stores/userStore'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  empresas: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'imported'])

const $q = useQuasar()
const userStore = useUserStore()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const file = ref(null)
const companyId = ref(null)
const cutoffDate = ref(new Date().toISOString().slice(0, 10))
const sendInvites = ref(false)
const report = ref(null)
const validating = ref(false)
const committing = ref(false)
const downloading = ref(false)

const companyOptions = computed(() =>
  (props.empresas || []).map(e => ({ value: String(e._id || e.id), label: e.name }))
)

// Permite commit sólo tras una validación dry-run exitosa con al menos 1 OK.
const canCommit = computed(() => report.value?.mode === 'dryRun' && report.value?.ok > 0)

function resetReport() { report.value = null }

watch(open, (v) => {
  if (!v) {
    // Limpiar al cerrar
    file.value = null
    report.value = null
    sendInvites.value = false
  } else if (props.empresas?.length === 1) {
    companyId.value = String(props.empresas[0]._id || props.empresas[0].id)
  }
})

async function onDownloadTemplate() {
  try {
    downloading.value = true
    await userStore.downloadImportTemplate()
  } catch (e) {
    $q.notify({ type: 'negative', message: 'No se pudo descargar la plantilla' })
  } finally {
    downloading.value = false
  }
}

async function runImport(commit) {
  const opts = {
    companyId: companyId.value || undefined,
    commit,
    sendInvites: sendInvites.value,
    cutoffDate: cutoffDate.value || undefined,
  }
  return userStore.importUsers(file.value, opts)
}

async function onValidate() {
  if (!file.value) return
  try {
    validating.value = true
    report.value = await runImport(false)
    if (report.value.failed) {
      $q.notify({ type: 'warning', message: `${report.value.failed} fila(s) con errores. Corrige el Excel y vuelve a validar.` })
    } else {
      $q.notify({ type: 'positive', message: `${report.value.ok} fila(s) válidas. Ya puedes crear.` })
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.response?.data?.message || 'No se pudo validar el archivo' })
  } finally {
    validating.value = false
  }
}

async function onCommit() {
  try {
    committing.value = true
    report.value = await runImport(true)
    $q.notify({ type: 'positive', message: `${report.value.ok} empleado(s) creados`, position: 'top-right' })
    emit('imported')
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.response?.data?.message || 'No se pudo completar la carga' })
  } finally {
    committing.value = false
  }
}
</script>

<style scoped>
.ie-card { width: 760px; max-width: 92vw; }
.ie-head { background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff; }
.ie-hint { font-size: .85rem; color: #475569; line-height: 1.55; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
.ie-report { margin-top: 8px; }
.ie-summary { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.ie-chip { font-size: .8rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.ie-chip--total { background: #e0e7ff; color: #3730a3; }
.ie-chip--ok { background: #dcfce7; color: #166534; }
.ie-chip--err { background: #fee2e2; color: #991b1b; }
.ie-mode { font-size: .78rem; color: #64748b; }
.ie-table-wrap { max-height: 320px; overflow: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
.ie-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.ie-table th { position: sticky; top: 0; background: #f1f5f9; text-align: left; padding: 8px 10px; font-weight: 700; color: #334155; }
.ie-table td { padding: 7px 10px; border-top: 1px solid #f1f5f9; }
.ie-table tr.is-err td { background: #fef2f2; }
.ie-report-hint { margin-top: 8px; font-size: .8rem; color: #64748b; }
</style>
