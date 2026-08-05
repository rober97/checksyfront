<template>
  <div class="rk-cargas-wrap">
    <!-- Header informativo -->
    <div class="rk-cargas-info">
      <q-icon name="info" size="18px" class="rk-cargas-info-icon" />
      <div>
        <div class="rk-cargas-info-title">Asignación familiar (DFL 150 / Ley 18.987)</div>
        <p class="rk-cargas-info-text">
          Cada carga debe estar reconocida por la Caja de Compensación o IPS.
          El tramo (A/B/C/D) se calcula automáticamente cada mes según la renta del trabajador.
        </p>
      </div>
    </div>

    <!-- Lista vacía -->
    <div v-if="local.length === 0" class="rk-cargas-empty">
      <q-icon name="family_restroom" size="36px" class="rk-cargas-empty-icon" />
      <div class="rk-cargas-empty-text">Sin cargas familiares registradas</div>
      <div class="rk-cargas-empty-hint">
        Agrega cada causante con su resolución de reconocimiento.
      </div>
    </div>

    <!-- Lista de cargas (fila compacta + acciones) -->
    <div
      v-for="(carga, idx) in local"
      :key="carga._tempId || carga._id || idx"
      class="rk-carga-row"
      :class="{ 'rk-carga-row--off': !isPagable(carga) }"
    >
      <div class="rk-carga-avatar">
        <q-icon :name="parentescoIcon(carga.parentesco)" size="20px" />
      </div>

      <div class="rk-carga-body">
        <div class="rk-carga-line1">
          <span class="rk-carga-name">{{ carga.fullName || 'Carga sin nombre' }}</span>
          <span class="rk-chip" :class="`rk-chip--${estado(carga).tone}`">
            {{ estado(carga).label }}
            <q-tooltip v-if="estado(carga).hint" max-width="260px">{{ estado(carga).hint }}</q-tooltip>
          </span>
          <span v-if="carga.tipo && carga.tipo !== 'simple'" class="rk-chip rk-chip--accent">
            {{ tipoLabel(carga.tipo) }}
          </span>
          <span v-if="carga.documentId" class="rk-chip rk-chip--soft">
            <q-icon name="description" size="12px" /> Resolución
          </span>
        </div>

        <div class="rk-carga-line2">
          {{ parentescoLabel(carga.parentesco) }}
          <template v-if="carga.rut"> · {{ carga.rut }}</template>
          <template v-if="carga.birthDate"> · {{ ageText(carga.birthDate) }}</template>
          <template v-if="carga.resolucionNumero"> · Res. {{ carga.resolucionNumero }}</template>
          <template v-if="vigenciaText(carga)"> · {{ vigenciaText(carga) }}</template>
        </div>
      </div>

      <div class="rk-carga-actions">
        <q-btn
          flat dense round size="sm"
          :icon="carga.documentId ? 'visibility' : 'cloud_upload'"
          :color="carga.documentId ? 'primary' : 'grey-6'"
          :disable="!canUploadDoc"
          @click="onUploadClick(idx)"
        >
          <q-tooltip>
            {{ carga.documentId
              ? 'Ver resolución adjunta'
              : (canUploadDoc ? 'Subir resolución (PDF)' : 'Guarda el usuario para adjuntar la resolución') }}
          </q-tooltip>
        </q-btn>

        <q-btn flat dense round size="sm" icon="edit" color="primary" @click="openEditor(idx)">
          <q-tooltip>Editar carga</q-tooltip>
        </q-btn>

        <q-btn
          flat dense round size="sm"
          :icon="carga.active ? 'toggle_on' : 'toggle_off'"
          :color="carga.active ? 'positive' : 'grey-6'"
          @click="toggleActive(idx)"
        >
          <q-tooltip>{{ carga.active ? 'Desactivar carga' : 'Reactivar carga' }}</q-tooltip>
        </q-btn>

        <q-btn flat dense round size="sm" icon="delete" color="negative" @click="confirmRemove(idx)">
          <q-tooltip>Eliminar carga</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Acción agregar -->
    <q-btn
      unelevated
      no-caps
      icon="add"
      label="Agregar carga familiar"
      color="primary"
      class="rk-cargas-add"
      @click="openEditor(null)"
    />

    <!-- Resumen visual -->
    <div v-if="local.length" class="rk-cargas-summary" :class="{ 'rk-cargas-summary--muted': vigentes === 0 }">
      <q-icon :name="vigentes ? 'check_circle' : 'info'" :color="vigentes ? 'positive' : 'grey'" size="18px" />
      <div>
        <template v-if="vigentes">
          <strong>{{ vigentes }}</strong>
          {{ vigentes === 1 ? 'carga vigente' : 'cargas vigentes' }}
          — se aplicarán al calcular la próxima liquidación.
        </template>
        <template v-else>
          Ninguna carga vigente hoy — no se pagará asignación familiar en la próxima liquidación.
        </template>
        <span v-if="noPagables" class="rk-cargas-summary-extra">
          ({{ noPagables }} {{ noPagables === 1 ? 'registrada sin efecto' : 'registradas sin efecto' }}:
          inactivas, vencidas o programadas)
        </span>
      </div>
    </div>

    <!-- ═══════════ Editor de carga (alta y edición) ═══════════ -->
    <q-dialog v-model="editor.open" persistent @hide="closeEditor">
      <q-card class="rk-editor-card">
        <div class="rk-editor-head">
          <div class="rk-editor-head-icon">
            <q-icon :name="editor.index === null ? 'person_add' : 'edit'" size="20px" />
          </div>
          <div class="rk-editor-head-text">
            <div class="rk-editor-title">
              {{ editor.index === null ? 'Nueva carga familiar' : 'Editar carga familiar' }}
            </div>
            <div class="rk-editor-subtitle">
              Datos del causante y su acreditación ante la Caja/IPS.
            </div>
          </div>
          <q-btn flat dense round icon="close" @click="editor.open = false">
            <q-tooltip>Cerrar sin guardar</q-tooltip>
          </q-btn>
        </div>

        <q-card-section class="rk-editor-body">
          <q-form ref="editorFormRef" greedy class="row q-col-gutter-sm">
            <div class="col-12 col-sm-7">
              <q-input
                v-model="draft.fullName"
                label="Nombre completo del causante *"
                dense outlined class="rk-field"
                :rules="[req]"
                autofocus
              >
                <template #prepend><q-icon name="person" /></template>
              </q-input>
            </div>

            <div class="col-12 col-sm-5">
              <q-input
                v-model="draft.rut"
                label="RUT del causante"
                dense outlined class="rk-field"
                placeholder="11111111-1"
                :rules="[rutRule]"
                @blur="draft.rut = draft.rut ? formatearRUT(draft.rut) : ''"
              >
                <template #prepend><q-icon name="badge" /></template>
              </q-input>
            </div>

            <div class="col-12 col-sm-4">
              <q-select
                v-model="draft.parentesco"
                :options="parentescoOptions"
                label="Parentesco *"
                dense outlined class="rk-field"
                emit-value map-options
                :rules="[req]"
              >
                <template #prepend><q-icon name="family_restroom" /></template>
              </q-select>
            </div>

            <div class="col-12 col-sm-4">
              <q-select
                v-model="draft.tipo"
                :options="tipoOptions"
                label="Tipo de asignación"
                dense outlined class="rk-field"
                emit-value map-options
              >
                <template #prepend><q-icon name="rule" /></template>
                <template #after>
                  <q-icon name="help_outline" size="16px" class="rk-help-icon">
                    <q-tooltip max-width="240px">
                      <strong>Duplo</strong>: paga el doble (causantes con discapacidad).<br>
                      <strong>Maternal</strong>: durante embarazo y post-natal.<br>
                      <strong>Invalidez</strong>: causante declarado inválido por COMPIN.
                    </q-tooltip>
                  </q-icon>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-sm-4">
              <RkDateField v-model="draft.birthDate" label="Fecha nacimiento" icon="cake" />
            </div>

            <div class="col-12 col-sm-4">
              <q-input
                v-model="draft.resolucionNumero"
                label="N° resolución Caja/IPS"
                dense outlined class="rk-field"
                placeholder="Ej: 2024-12345"
              >
                <template #prepend><q-icon name="receipt_long" /></template>
              </q-input>
            </div>

            <div class="col-12 col-sm-4">
              <RkDateField
                v-model="draft.fechaReconocimiento"
                label="Fecha reconocimiento"
                icon="event_available"
              />
            </div>

            <div class="col-12 col-sm-4">
              <RkDateField v-model="draft.vigenteDesde" label="Vigente desde" icon="play_arrow" />
            </div>

            <div class="col-12 col-sm-6">
              <RkDateField
                v-model="draft.vigenteHasta"
                label="Vigente hasta (opcional)"
                icon="stop"
                clearable
                hint="Hijos: hasta 18 años (o 24 si estudia)"
              />
            </div>

            <div class="col-12 col-sm-6">
              <div class="rk-active-box">
                <q-toggle v-model="draft.active" color="primary" dense />
                <div>
                  <div class="rk-active-title">{{ draft.active ? 'Carga activa' : 'Carga inactiva' }}</div>
                  <div class="rk-active-hint">
                    Una carga inactiva se conserva en el historial pero no paga asignación.
                  </div>
                </div>
              </div>
            </div>

            <!-- Resolución escaneada (sólo cargas ya guardadas) -->
            <div v-if="editor.index !== null" class="col-12">
              <div class="rk-upload-row">
                <q-icon name="attach_file" size="18px" class="rk-upload-icon" />
                <div class="rk-upload-text">
                  <strong>Resolución escaneada</strong>
                  <span v-if="draft.documentId">Documento adjuntado (id: {{ String(draft.documentId).slice(-6) }})</span>
                  <span v-else class="rk-upload-empty">Sin documento — sube la resolución de la Caja/IPS</span>
                </div>
                <q-btn
                  flat dense no-caps
                  :color="draft.documentId ? 'primary' : 'grey-7'"
                  :icon="draft.documentId ? 'visibility' : 'cloud_upload'"
                  :label="draft.documentId ? 'Ver' : 'Subir PDF'"
                  :disable="!canUploadDoc"
                  @click="onUploadClick(editor.index)"
                />
                <q-btn
                  v-if="draft.documentId"
                  flat dense round icon="delete" color="negative" size="sm"
                  @click="draft.documentId = null"
                >
                  <q-tooltip>Quitar documento</q-tooltip>
                </q-btn>
              </div>
              <div v-if="!canUploadDoc" class="rk-upload-warn">
                <q-icon name="info" size="14px" />
                Primero guarda el usuario para poder adjuntar la resolución.
              </div>
            </div>

            <!-- Avisos de coherencia -->
            <div v-if="draftWarnings.length" class="col-12">
              <div v-for="w in draftWarnings" :key="w.text" class="rk-warn-box" :class="`rk-warn-box--${w.tone}`">
                <q-icon :name="w.tone === 'error' ? 'error' : 'warning'" size="16px" />
                <span>{{ w.text }}</span>
              </div>
            </div>
          </q-form>
        </q-card-section>

        <div class="rk-editor-foot">
          <q-btn flat no-caps label="Cancelar" @click="editor.open = false" />
          <q-btn
            unelevated no-caps
            color="primary"
            :label="editor.index === null ? 'Agregar carga' : 'Guardar carga'"
            :disable="hasBlockingError"
            @click="saveEditor"
          />
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useToast } from 'vue-toastification'
import { req, rutRule, formatearRUT } from '@/utils/validators'
import RkDateField from './RkDateField.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  // Cuando es true (modo edición), se puede subir documento de respaldo
  canUploadDoc: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'upload-doc'])

const $q = useQuasar()
const toast = useToast()

const parentescoOptions = [
  { label: 'Hijo/a', value: 'hijo' },
  { label: 'Cónyuge', value: 'conyuge' },
  { label: 'Conviviente civil', value: 'conviviente_civil' },
  { label: 'Madre/padre de hijo no matrimonial', value: 'madre_hijo_nm' },
  { label: 'Ascendiente (padre/madre/abuelo)', value: 'ascendiente' },
  { label: 'Nieto/a', value: 'nieto' },
  { label: 'Inválido', value: 'invalido' },
]

const tipoOptions = [
  { label: 'Simple', value: 'simple' },
  { label: 'Maternal', value: 'maternal' },
  { label: 'Invalidez', value: 'invalidez' },
  { label: 'Duplo (paga doble)', value: 'duplo' },
]

const PARENT_ICON = {
  hijo: 'child_care',
  conyuge: 'favorite',
  conviviente_civil: 'favorite_border',
  madre_hijo_nm: 'pregnant_woman',
  ascendiente: 'elderly',
  nieto: 'escalator_warning',
  invalido: 'accessible',
}

const parentescoLabel = (v) => parentescoOptions.find(o => o.value === v)?.label || v || '—'
const tipoLabel = (v) => tipoOptions.find(o => o.value === v)?.label || v
const parentescoIcon = (v) => PARENT_ICON[v] || 'person'

function toIsoDate(v) {
  if (!v) return null
  try { return String(v).slice(0, 10) } catch { return null }
}

function todayIso() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function ageYears(birthDate) {
  if (!birthDate) return null
  const b = new Date(birthDate)
  if (Number.isNaN(+b)) return null
  return (Date.now() - b.getTime()) / (365.25 * 24 * 3600 * 1000)
}

function ageText(birthDate) {
  const a = ageYears(birthDate)
  if (a === null) return ''
  if (a < 1) return `${Math.max(0, Math.floor(a * 12))} meses`
  return `${Math.floor(a)} años`
}

function fmt(d) {
  if (!d) return ''
  const [y, m, dd] = String(d).slice(0, 10).split('-')
  return dd ? `${dd}-${m}-${y}` : String(d)
}

function vigenciaText(c) {
  if (c.vigenteDesde && c.vigenteHasta) return `Vigencia ${fmt(c.vigenteDesde)} → ${fmt(c.vigenteHasta)}`
  if (c.vigenteHasta) return `Hasta ${fmt(c.vigenteHasta)}`
  if (c.vigenteDesde) return `Desde ${fmt(c.vigenteDesde)}`
  return ''
}

/* ── Estado real de la carga (mismas reglas que cargasVigentes del backend) ── */
function estado(c) {
  const hoy = todayIso()
  if (c.active === false) {
    return { label: 'Inactiva', tone: 'grey', hint: 'Se conserva en el historial pero no paga asignación.' }
  }
  if (c.vigenteDesde && c.vigenteDesde > hoy) {
    return { label: 'Programada', tone: 'warn', hint: `Empieza a pagar el ${fmt(c.vigenteDesde)}.` }
  }
  if (c.vigenteHasta && c.vigenteHasta < hoy) {
    return { label: 'Vencida', tone: 'danger', hint: `Su vigencia terminó el ${fmt(c.vigenteHasta)}.` }
  }
  if (c.parentesco === 'hijo' && (ageYears(c.birthDate) ?? 0) >= 18) {
    return {
      label: 'Sin efecto (18+)',
      tone: 'danger',
      hint: 'Los hijos dejan de causar asignación a los 18 años (hasta 24 acreditando estudios ante la Caja/IPS).',
    }
  }
  return { label: 'Vigente', tone: 'ok' }
}

const isPagable = (c) => estado(c).tone === 'ok'

const local = reactive(cloneCargas(props.modelValue))

function cloneCargas(arr) {
  return (Array.isArray(arr) ? arr : []).map(c => ({
    _id: c._id || null,
    _tempId: c._tempId || (Math.random().toString(36).slice(2, 9)),
    rut: c.rut || '',
    fullName: c.fullName || '',
    birthDate: toIsoDate(c.birthDate),
    parentesco: c.parentesco || 'hijo',
    tipo: c.tipo || 'simple',
    fechaReconocimiento: toIsoDate(c.fechaReconocimiento),
    resolucionNumero: c.resolucionNumero || '',
    vigenteDesde: toIsoDate(c.vigenteDesde),
    vigenteHasta: toIsoDate(c.vigenteHasta),
    documentId: c.documentId || null,
    active: c.active !== false,
  }))
}

// Evita el eco del two-way binding: cuando emitimos, el padre re-asigna
// props.modelValue y este watch volvería a pisar `local`.
let isEmitting = false

watch(
  () => props.modelValue,
  (v) => {
    if (isEmitting) return
    const fresh = cloneCargas(v)
    if (JSON.stringify(fresh) !== JSON.stringify(local)) {
      local.splice(0, local.length, ...fresh)
    }
  },
  { deep: true },
)

watch(
  local,
  (v) => {
    isEmitting = true
    emit('update:modelValue', JSON.parse(JSON.stringify(v)))
    nextTick(() => { isEmitting = false })
  },
  { deep: true },
)

const vigentes = computed(() => local.filter(isPagable).length)
const noPagables = computed(() => local.length - vigentes.value)

/* ═══════════ Editor ═══════════ */
const editorFormRef = ref(null)
const editor = reactive({ open: false, index: null })
const draft = reactive(emptyCarga())

function emptyCarga() {
  return {
    _id: null,
    _tempId: Math.random().toString(36).slice(2, 9),
    rut: '',
    fullName: '',
    birthDate: null,
    parentesco: 'hijo',
    tipo: 'simple',
    fechaReconocimiento: null,
    resolucionNumero: '',
    vigenteDesde: null,
    vigenteHasta: null,
    documentId: null,
    active: true,
  }
}

function openEditor(idx) {
  editor.index = idx
  Object.assign(draft, idx === null ? emptyCarga() : JSON.parse(JSON.stringify(local[idx])))
  editor.open = true
  nextTick(() => editorFormRef.value?.resetValidation?.())
}

function closeEditor() {
  editor.index = null
}

// La subida del PDF la resuelve el diálogo padre y escribe el documentId sobre
// la carga de la lista: reflejamos ese cambio en el borrador abierto.
watch(
  () => (editor.index !== null ? local[editor.index]?.documentId : null),
  (v) => {
    if (editor.open && editor.index !== null && v && v !== draft.documentId) {
      draft.documentId = v
    }
  },
)

/* Avisos de coherencia. `tone: 'error'` bloquea el guardado. */
const draftWarnings = computed(() => {
  const out = []
  const hoy = todayIso()

  if (draft.birthDate && draft.birthDate > hoy) {
    out.push({ tone: 'error', text: 'La fecha de nacimiento no puede ser futura.' })
  }
  if (draft.fechaReconocimiento && draft.fechaReconocimiento > hoy) {
    out.push({ tone: 'error', text: 'La fecha de reconocimiento no puede ser futura.' })
  }
  if (draft.vigenteDesde && draft.vigenteHasta && draft.vigenteHasta < draft.vigenteDesde) {
    out.push({ tone: 'error', text: '“Vigente hasta” debe ser posterior a “Vigente desde”.' })
  }
  if (draft.birthDate && draft.vigenteDesde && draft.vigenteDesde < draft.birthDate) {
    out.push({ tone: 'error', text: 'La vigencia no puede empezar antes del nacimiento del causante.' })
  }

  const dup = local.find((c, i) => (
    i !== editor.index &&
    draft.rut &&
    String(c.rut || '').replace(/[.\-\s]/g, '').toLowerCase() ===
      String(draft.rut).replace(/[.\-\s]/g, '').toLowerCase()
  ))
  if (dup) out.push({ tone: 'error', text: `Ya existe una carga con ese RUT (${dup.fullName || 'sin nombre'}).` })

  const edad = ageYears(draft.birthDate)
  if (draft.parentesco === 'hijo' && edad !== null && edad >= 18 && !draft.vigenteHasta) {
    out.push({
      tone: 'warn',
      text: 'El causante ya cumplió 18 años: no generará asignación salvo acreditación de estudios (hasta 24). Registra la vigencia correspondiente.',
    })
  }
  if (!draft.resolucionNumero && !draft.documentId) {
    out.push({ tone: 'warn', text: 'Sin N° de resolución ni documento de respaldo de la Caja/IPS.' })
  }
  return out
})

const hasBlockingError = computed(() => draftWarnings.value.some(w => w.tone === 'error'))

async function saveEditor() {
  const ok = await editorFormRef.value?.validate?.()
  if (!ok) return
  if (hasBlockingError.value) return

  const isNew = editor.index === null
  const payload = JSON.parse(JSON.stringify(draft))
  payload.rut = payload.rut ? formatearRUT(payload.rut) : ''
  payload.fullName = String(payload.fullName || '').trim()

  if (isNew) local.push(payload)
  else local.splice(editor.index, 1, payload)

  editor.open = false
  toast.success(
    isNew
      ? 'Carga agregada — recuerda guardar los cambios del usuario.'
      : 'Carga actualizada — recuerda guardar los cambios del usuario.',
  )
}

function toggleActive(idx) {
  const c = local[idx]
  if (!c) return
  c.active = !c.active
  // Al desactivar, cerramos la vigencia hoy si estaba abierta (deja trazabilidad).
  if (!c.active && !c.vigenteHasta) c.vigenteHasta = todayIso()
  // Al reactivar, si la fecha de término ya pasó, la limpiamos (vuelve a indefinida).
  if (c.active && c.vigenteHasta && c.vigenteHasta <= todayIso()) c.vigenteHasta = null
}

function confirmRemove(idx) {
  const c = local[idx]
  if (!c) return
  $q.dialog({
    title: 'Eliminar carga familiar',
    message:
      `Se eliminará <strong>${escapeHtml(c.fullName || 'la carga sin nombre')}</strong> del contrato. ` +
      'Las liquidaciones ya emitidas no se modifican.<br><br>' +
      'Si la carga simplemente dejó de causar asignación, es preferible <strong>desactivarla</strong> ' +
      'o fijarle una fecha de término para conservar el historial.',
    html: true,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true, noCaps: true },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    persistent: true,
  }).onOk(() => {
    local.splice(idx, 1)
    toast.info('Carga eliminada — recuerda guardar los cambios del usuario.')
  })
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ))
}

function onUploadClick(idx) {
  if (idx === null || idx === undefined) return
  emit('upload-doc', { index: idx, carga: local[idx] })
}
</script>

<style scoped>
.rk-cargas-wrap {
  --rk-bg:           #ffffff;
  --rk-surface:      #f7f8fc;
  --rk-surface-2:    #eef0f6;
  --rk-border:       rgba(15, 17, 23, 0.08);
  --rk-border-2:     rgba(15, 17, 23, 0.14);
  --rk-text:         #0f1117;
  --rk-text-2:       #5a6482;
  --rk-text-3:       #9aa1b9;
  --rk-accent:       #0CA9C4;
  --rk-accent-soft:  rgba(12, 169, 196, 0.10);
  --rk-success:      #16a34a;
  --rk-success-soft: rgba(22, 163, 74, 0.12);
  --rk-warn:         #d97706;
  --rk-warn-soft:    rgba(217, 119, 6, 0.12);
  --rk-danger:       #dc2626;
  --rk-danger-soft:  rgba(220, 38, 38, 0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--rk-text);
}
.body--dark .rk-cargas-wrap {
  --rk-bg:           var(--card-background);
  --rk-surface:      var(--surface-soft);
  --rk-surface-2:    rgba(255, 255, 255, 0.05);
  --rk-border:       var(--border-color);
  --rk-border-2:     rgba(255, 255, 255, 0.16);
  --rk-text:         var(--text-primary);
  --rk-text-2:       var(--text-secondary);
  --rk-text-3:       var(--text-muted);
  --rk-accent-soft:  var(--color-primary-soft);
}

.rk-cargas-info {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: var(--rk-accent-soft);
  border: 1px solid rgba(12, 169, 196, 0.22);
  border-radius: 10px;
}
.rk-cargas-info-icon { color: var(--rk-accent); margin-top: 1px; }
.rk-cargas-info-title { font-weight: 700; font-size: 12.5px; color: var(--rk-text); }
.rk-cargas-info-text {
  margin: 2px 0 0 0; font-size: 11.5px; color: var(--rk-text-2); line-height: 1.45;
}

.rk-cargas-empty {
  text-align: center;
  padding: 24px 16px;
  background: var(--rk-surface);
  border: 1px dashed var(--rk-border-2);
  border-radius: 12px;
  color: var(--rk-text-3);
}
.rk-cargas-empty-icon { color: var(--rk-text-3); margin-bottom: 6px; }
.rk-cargas-empty-text { font-size: 13px; font-weight: 600; color: var(--rk-text-2); }
.rk-cargas-empty-hint { font-size: 11.5px; margin-top: 2px; }

/* ── Fila de carga ── */
.rk-carga-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 10px;
  transition: border-color .15s ease, background .15s ease;
}
.rk-carga-row:hover { border-color: var(--rk-border-2); }
.rk-carga-row--off { opacity: .72; }

.rk-carga-avatar {
  width: 34px; height: 34px; flex: 0 0 34px;
  display: grid; place-items: center;
  border-radius: 9px;
  background: var(--rk-accent-soft);
  color: var(--rk-accent);
}

.rk-carga-body { flex: 1; min-width: 0; }
.rk-carga-line1 {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.rk-carga-name {
  font-size: 13px; font-weight: 700; color: var(--rk-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px;
}
.rk-carga-line2 {
  font-size: 11.5px; color: var(--rk-text-2); margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.rk-chip {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10.5px; font-weight: 700; line-height: 1.6;
  border: 1px solid transparent;
}
.rk-chip--ok     { background: var(--rk-success-soft); color: var(--rk-success); border-color: rgba(22,163,74,.25); }
.rk-chip--warn   { background: var(--rk-warn-soft);    color: var(--rk-warn);    border-color: rgba(217,119,6,.25); }
.rk-chip--danger { background: var(--rk-danger-soft);  color: var(--rk-danger);  border-color: rgba(220,38,38,.25); }
.rk-chip--grey   { background: var(--rk-surface-2);    color: var(--rk-text-3);  border-color: var(--rk-border); }
.rk-chip--accent { background: var(--rk-accent-soft);  color: var(--rk-accent);  border-color: rgba(12,169,196,.25); }
.rk-chip--soft   { background: var(--rk-surface-2);    color: var(--rk-text-2);  border-color: var(--rk-border); }

.rk-carga-actions { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; }

.rk-cargas-add {
  align-self: flex-start;
  border-radius: 8px;
  font-weight: 600;
  font-size: 12.5px;
  padding: 6px 14px;
}

.rk-cargas-summary {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: var(--rk-success-soft);
  border: 1px solid rgba(22, 163, 74, 0.22);
  border-radius: 10px;
  font-size: 12px;
  color: var(--rk-text);
}
.rk-cargas-summary--muted {
  background: var(--rk-surface);
  border-color: var(--rk-border);
  color: var(--rk-text-2);
}
.rk-cargas-summary-extra { color: var(--rk-text-2); margin-left: 4px; }

/* ── Editor ── */
.rk-editor-card {
  width: 760px;
  max-width: 94vw;
  border-radius: 14px;
  background: var(--card-background, #fff);
}
.rk-editor-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border-color, rgba(15,17,23,.08));
}
.rk-editor-head-icon {
  width: 34px; height: 34px; display: grid; place-items: center;
  border-radius: 9px;
  background: rgba(12, 169, 196, 0.12);
  color: #0CA9C4;
}
.rk-editor-head-text { flex: 1; min-width: 0; }
.rk-editor-title { font-size: 14px; font-weight: 700; }
.rk-editor-subtitle { font-size: 11.5px; opacity: .7; margin-top: 1px; }
.rk-editor-body { padding: 14px 16px 6px; }
.rk-editor-foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 10px 16px 14px;
}

.rk-field :deep(.q-field__control) { min-height: 38px; border-radius: 8px; }
.rk-field :deep(.q-field__label) { font-weight: 500; font-size: 12px; }
.rk-field :deep(.q-field__native), .rk-field :deep(.q-field__input) { font-size: 12.5px; }

.rk-help-icon { color: var(--rk-text-3); cursor: help; }

.rk-active-box {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--rk-border);
  border-radius: 8px;
  height: 100%;
}
.rk-active-title { font-size: 12px; font-weight: 600; }
.rk-active-hint { font-size: 10.5px; opacity: .7; line-height: 1.35; }

.rk-upload-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--rk-border);
  border-radius: 8px;
}
.rk-upload-icon { color: var(--rk-text-3); }
.rk-upload-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.rk-upload-text strong { font-size: 12px; }
.rk-upload-text span { font-size: 11px; opacity: .8; }
.rk-upload-text .rk-upload-empty { opacity: .6; }
.rk-upload-warn {
  display: flex; align-items: center; gap: 4px;
  margin-top: 4px; padding-left: 6px;
  font-size: 10.5px; color: var(--rk-warn);
}

.rk-warn-box {
  display: flex; align-items: flex-start; gap: 6px;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  line-height: 1.4;
  margin-bottom: 6px;
}
.rk-warn-box--warn  { background: var(--rk-warn-soft);   color: var(--rk-warn); }
.rk-warn-box--error { background: var(--rk-danger-soft); color: var(--rk-danger); }
</style>
