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

    <!-- Lista de cargas -->
    <div v-if="local.length === 0" class="rk-cargas-empty">
      <q-icon name="family_restroom" size="36px" class="rk-cargas-empty-icon" />
      <div class="rk-cargas-empty-text">Sin cargas familiares registradas</div>
      <div class="rk-cargas-empty-hint">
        Agrega cada causante con su resolución de reconocimiento.
      </div>
    </div>

    <div v-for="(carga, idx) in local" :key="carga._tempId || carga._id || idx" class="rk-carga-card">
      <div class="rk-carga-head">
        <div class="rk-carga-head-left">
          <q-icon :name="parentescoIcon(carga.parentesco)" size="20px" class="rk-carga-head-icon" />
          <div>
            <div class="rk-carga-name">{{ carga.fullName || 'Carga sin nombre' }}</div>
            <div class="rk-carga-meta">
              {{ parentescoLabel(carga.parentesco) }}
              <template v-if="carga.tipo && carga.tipo !== 'simple'">
                · {{ tipoLabel(carga.tipo) }}
              </template>
              <template v-if="carga.birthDate">
                · {{ ageText(carga.birthDate) }}
              </template>
            </div>
          </div>
        </div>

        <div class="rk-carga-head-actions">
          <q-toggle
            v-model="carga.active"
            color="primary"
            dense
            checked-icon="check"
            unchecked-icon="close"
          >
            <q-tooltip>{{ carga.active ? 'Activa' : 'Inactiva' }}</q-tooltip>
          </q-toggle>
          <q-btn
            flat dense round icon="delete"
            color="negative"
            size="sm"
            @click="removeCarga(idx)"
          >
            <q-tooltip>Eliminar carga</q-tooltip>
          </q-btn>
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6 col-lg-5">
          <q-input
            v-model="carga.fullName"
            label="Nombre completo del causante *"
            dense
            outlined
            class="rk-field"
            :rules="[req]"
          >
            <template #prepend><q-icon name="person" /></template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <q-input
            v-model="carga.rut"
            label="RUT del causante"
            dense
            outlined
            class="rk-field"
            placeholder="11111111-1"
          >
            <template #prepend><q-icon name="badge" /></template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6 col-lg-3">
          <q-input
            v-model="carga.birthDate"
            label="Fecha nacimiento"
            dense
            outlined
            readonly
            class="rk-field"
            placeholder="YYYY-MM-DD"
          >
            <template #prepend><q-icon name="cake" /></template>
            <template #append>
              <q-icon name="calendar_month" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="carga.birthDate"
                    mask="YYYY-MM-DD"
                    minimal
                    color="primary"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <q-select
            v-model="carga.parentesco"
            :options="parentescoOptions"
            label="Parentesco *"
            dense
            outlined
            class="rk-field"
            emit-value
            map-options
            :rules="[req]"
          >
            <template #prepend><q-icon name="family_restroom" /></template>
          </q-select>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <q-select
            v-model="carga.tipo"
            :options="tipoOptions"
            label="Tipo de asignación"
            dense
            outlined
            class="rk-field"
            emit-value
            map-options
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

        <div class="col-12 col-sm-6 col-lg-4">
          <q-input
            v-model="carga.resolucionNumero"
            label="N° resolución Caja/IPS"
            dense
            outlined
            class="rk-field"
            placeholder="Ej: 2024-12345"
          >
            <template #prepend><q-icon name="receipt_long" /></template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <q-input
            v-model="carga.fechaReconocimiento"
            label="Fecha reconocimiento"
            dense
            outlined
            readonly
            class="rk-field"
            placeholder="YYYY-MM-DD"
          >
            <template #prepend><q-icon name="event_available" /></template>
            <template #append>
              <q-icon name="calendar_month" class="cursor-pointer">
                <q-popup-proxy cover>
                  <q-date
                    v-model="carga.fechaReconocimiento"
                    mask="YYYY-MM-DD"
                    minimal
                    color="primary"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <q-input
            v-model="carga.vigenteDesde"
            label="Vigente desde"
            dense
            outlined
            readonly
            class="rk-field"
            placeholder="YYYY-MM-DD"
          >
            <template #prepend><q-icon name="play_arrow" /></template>
            <template #append>
              <q-icon name="calendar_month" class="cursor-pointer">
                <q-popup-proxy cover>
                  <q-date
                    v-model="carga.vigenteDesde"
                    mask="YYYY-MM-DD"
                    minimal
                    color="primary"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <q-input
            v-model="carga.vigenteHasta"
            label="Vigente hasta (opcional)"
            dense
            outlined
            readonly
            class="rk-field"
            placeholder="Dejar vacío si es indefinida"
            hint="Hijos: hasta 18 años (o 24 si estudia)"
          >
            <template #prepend><q-icon name="stop" /></template>
            <template #append>
              <q-icon
                v-if="carga.vigenteHasta"
                name="clear"
                class="cursor-pointer"
                @click.stop="carga.vigenteHasta = null"
              >
                <q-tooltip>Quitar fecha (indefinida)</q-tooltip>
              </q-icon>
              <q-icon name="calendar_month" class="cursor-pointer">
                <q-popup-proxy cover>
                  <q-date
                    v-model="carga.vigenteHasta"
                    mask="YYYY-MM-DD"
                    minimal
                    color="primary"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <!-- Upload de resolución -->
        <div class="col-12">
          <div class="rk-upload-row">
            <q-icon name="attach_file" size="18px" class="rk-upload-icon" />
            <div class="rk-upload-text">
              <strong>Resolución escaneada</strong>
              <span v-if="carga.documentId">Documento adjuntado (id: {{ String(carga.documentId).slice(-6) }})</span>
              <span v-else class="rk-upload-empty">Sin documento — sube la resolución de la Caja/IPS</span>
            </div>
            <q-btn
              flat
              dense
              no-caps
              :color="carga.documentId ? 'primary' : 'grey-7'"
              :icon="carga.documentId ? 'visibility' : 'cloud_upload'"
              :label="carga.documentId ? 'Ver' : 'Subir PDF'"
              :disable="!canUploadDoc"
              @click="onUploadClick(idx)"
            />
            <q-btn
              v-if="carga.documentId"
              flat dense round
              icon="delete"
              color="negative"
              size="sm"
              @click="carga.documentId = null"
            >
              <q-tooltip>Quitar documento</q-tooltip>
            </q-btn>
          </div>
          <div v-if="!canUploadDoc" class="rk-upload-warn">
            <q-icon name="info" size="14px" />
            Primero guarda el usuario para poder adjuntar la resolución.
          </div>
        </div>
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
      @click="addCarga"
    />

    <!-- Resumen visual -->
    <div v-if="vigentes > 0" class="rk-cargas-summary">
      <q-icon name="check_circle" color="positive" size="18px" />
      <div>
        <strong>{{ vigentes }}</strong>
        {{ vigentes === 1 ? 'carga vigente' : 'cargas vigentes' }}
        — se aplicarán al calcular la próxima liquidación.
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { req } from '@/utils/validators'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  // Cuando es true (modo edición), se puede subir documento de respaldo
  canUploadDoc: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'upload-doc'])

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

function ageText(birthDate) {
  if (!birthDate) return ''
  try {
    const b = new Date(birthDate)
    const ageYears = (Date.now() - b.getTime()) / (365.25 * 24 * 3600 * 1000)
    if (ageYears < 1) return `${Math.floor(ageYears * 12)} meses`
    return `${Math.floor(ageYears)} años`
  } catch { return '' }
}

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

function toIsoDate(v) {
  if (!v) return null
  try { return String(v).slice(0, 10) } catch { return null }
}

watch(
  () => props.modelValue,
  (v) => {
    const fresh = cloneCargas(v)
    if (JSON.stringify(fresh) !== JSON.stringify(local)) {
      local.splice(0, local.length, ...fresh)
    }
  },
  { deep: true },
)

watch(
  local,
  (v) => emit('update:modelValue', JSON.parse(JSON.stringify(v))),
  { deep: true },
)

const vigentes = computed(() => local.filter(c => c.active).length)

function addCarga() {
  local.push({
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
  })
}

function removeCarga(idx) {
  local.splice(idx, 1)
}

function onUploadClick(idx) {
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
  --rk-accent:       #06b6d4;
  --rk-accent-soft:  rgba(6, 182, 212, 0.10);
  --rk-success:      #16a34a;
  --rk-success-soft: rgba(22, 163, 74, 0.12);
  --rk-warn:         #d97706;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--rk-text);
}
.body--dark .rk-cargas-wrap {
  --rk-bg:           #141720;
  --rk-surface:      #1a1e2a;
  --rk-surface-2:    #232838;
  --rk-border:       rgba(255, 255, 255, 0.08);
  --rk-border-2:     rgba(255, 255, 255, 0.16);
  --rk-text:         #e8eaf2;
  --rk-text-2:       #8b92ad;
  --rk-text-3:       #555d78;
  --rk-accent-soft:  rgba(6, 182, 212, 0.18);
}

.rk-cargas-info {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: var(--rk-accent-soft);
  border: 1px solid rgba(6, 182, 212, 0.22);
  border-radius: 10px;
}
.rk-cargas-info-icon { color: var(--rk-accent); margin-top: 1px; }
.rk-cargas-info-title {
  font-weight: 700; font-size: 12.5px; color: var(--rk-text);
}
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

.rk-carga-card {
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  padding: 12px 14px;
}

.rk-carga-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; margin-bottom: 10px; padding-bottom: 10px;
  border-bottom: 1px solid var(--rk-border);
}
.rk-carga-head-left { display: flex; align-items: center; gap: 10px; }
.rk-carga-head-icon { color: var(--rk-accent); }
.rk-carga-name { font-size: 13px; font-weight: 700; color: var(--rk-text); line-height: 1.25; }
.rk-carga-meta { font-size: 11.5px; color: var(--rk-text-2); margin-top: 1px; }
.rk-carga-head-actions { display: flex; align-items: center; gap: 6px; }

.rk-field :deep(.q-field__control) {
  min-height: 38px; border-radius: 8px; background: var(--rk-bg);
}
.rk-field :deep(.q-field__label) {
  color: var(--rk-text-2); font-weight: 500; font-size: 12px;
}
.rk-field :deep(.q-field__native), .rk-field :deep(.q-field__input) {
  color: var(--rk-text); font-size: 12.5px;
}

.rk-help-icon { color: var(--rk-text-3); cursor: help; }

.rk-upload-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  background: var(--rk-bg);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
}
.rk-upload-icon { color: var(--rk-text-3); }
.rk-upload-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.rk-upload-text strong { font-size: 12px; color: var(--rk-text); }
.rk-upload-text span { font-size: 11px; color: var(--rk-text-2); }
.rk-upload-text .rk-upload-empty { color: var(--rk-text-3); }

.rk-upload-warn {
  display: flex; align-items: center; gap: 4px;
  margin-top: 4px; padding-left: 6px;
  font-size: 10.5px; color: var(--rk-warn);
}

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
</style>
