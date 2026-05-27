<template>
  <div class="crt-root">
    <div class="crt-intro">
      <q-icon name="gavel" size="20px" />
      <div>
        <div class="crt-intro-title">Reglamento Interno</div>
        <div class="crt-intro-sub">
          PDF que el trabajador debe leer y aceptar durante su activación de cuenta
          (Res. Ex. N°38/2024 — Dirección del Trabajo).
        </div>
      </div>
    </div>

    <div class="crt-grid">
      <!-- ═══════════ UPLOAD ═══════════ -->
      <div class="crt-card">
        <div class="crt-card-head">
          <div class="crt-ci"><q-icon name="picture_as_pdf" size="16px" /></div>
          <div>
            <div class="crt-card-title">Archivo</div>
            <div class="crt-card-sub">PDF · máximo 10 MB</div>
          </div>
        </div>

        <label class="crt-drop-zone" :class="{ 'has-doc': hasDoc }">
          <input
            type="file"
            accept="application/pdf,.pdf"
            class="crt-file-input"
            :disabled="uploading"
            @change="onFilePick"
          />
          <template v-if="uploading">
            <q-spinner size="22px" color="primary" />
            <span class="crt-drop-text">Subiendo…</span>
          </template>
          <template v-else-if="hasDoc">
            <q-icon name="check_circle" size="28px" color="positive" />
            <div class="crt-drop-text">Reglamento configurado</div>
            <div class="crt-drop-sub">Clic para reemplazar</div>
          </template>
          <template v-else>
            <q-icon name="upload_file" size="28px" color="primary" />
            <div class="crt-drop-text">Subir reglamento</div>
            <div class="crt-drop-sub">o arrastrá el PDF aquí</div>
          </template>
        </label>

        <div v-if="hasDoc" class="crt-actions">
          <q-btn flat dense size="sm" icon="visibility" label="Ver PDF" color="primary" :loading="loadingUrl" @click="openCurrent" />
          <q-btn flat dense size="sm" icon="delete" label="Quitar" color="negative" @click="clearDoc" />
        </div>
      </div>

      <!-- ═══════════ VERSIÓN ═══════════ -->
      <div class="crt-card">
        <div class="crt-card-head">
          <div class="crt-ci crt-ci--grey"><q-icon name="tag" size="14px" /></div>
          <div>
            <div class="crt-card-title">Versión</div>
            <div class="crt-card-sub">Queda registrada con la firma del trabajador</div>
          </div>
        </div>
        <q-input
          v-model="versionSync"
          outlined dense
          placeholder="1.0"
          :rules="versionRules"
          maxlength="20"
        >
          <template #prepend><q-icon name="numbers" size="14px" /></template>
        </q-input>
        <div class="crt-hint">
          <q-icon name="info_outline" size="14px" />
          <span>Subila a 1.1, 2.0, etc. cuando publiques una nueva versión del reglamento.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useDocumentStore } from '@/stores/documentStore'

const props = defineProps({
  companyId: { type: String, required: true },
  internalRegulationDocId: { type: String, default: '' },
  internalRegulationVersion: { type: String, default: '1.0' },
})
const emit = defineEmits([
  'update:internalRegulationDocId',
  'update:internalRegulationVersion',
  'validity',
])

const $q = useQuasar()
const documentStore = useDocumentStore()

const uploading = ref(false)
const loadingUrl = ref(false)

const docIdSync = computed({
  get: () => props.internalRegulationDocId || '',
  set: v => emit('update:internalRegulationDocId', v || ''),
})
const versionSync = computed({
  get: () => props.internalRegulationVersion || '',
  set: v => emit('update:internalRegulationVersion', v || ''),
})

const hasDoc = computed(() => !!docIdSync.value)

const versionRules = [
  v => !!v || 'La versión es obligatoria',
  v => v.length <= 20 || 'Máximo 20 caracteres',
]

async function onFilePick(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    $q.notify({ type: 'negative', message: 'El archivo debe ser PDF' })
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    $q.notify({ type: 'negative', message: 'El PDF excede 10 MB' })
    return
  }
  try {
    uploading.value = true
    const doc = await documentStore.uploadOne({
      companyId: props.companyId,
      name: `Reglamento Interno v${versionSync.value || '1.0'}`,
      type: 'annex',
      file,
    })
    docIdSync.value = doc?._id || doc?.id || ''
    $q.notify({ type: 'positive', message: 'Reglamento subido' })
    emit('validity', true)
  } catch (err) {
    console.error('[CompanyRegulationTab.upload]', err)
    $q.notify({ type: 'negative', message: err?.message || 'No se pudo subir' })
  } finally {
    uploading.value = false
  }
}

async function openCurrent() {
  if (!docIdSync.value) return
  try {
    loadingUrl.value = true
    const url = await documentStore.getSignedUrl(docIdSync.value)
    window.open(url, '_blank', 'noopener')
  } catch (err) {
    console.error('[CompanyRegulationTab.openCurrent]', err)
    $q.notify({ type: 'negative', message: err?.message || 'No se pudo abrir' })
  } finally {
    loadingUrl.value = false
  }
}

function clearDoc() {
  $q.dialog({
    title: '¿Quitar reglamento?',
    message: 'Los empleados que aún no completaron su activación no podrán continuar hasta que subas otro PDF.',
    ok: { label: 'Sí, quitar', color: 'negative', unelevated: true },
    cancel: { label: 'Cancelar', flat: true },
    persistent: true,
  }).onOk(() => {
    docIdSync.value = ''
  })
}
</script>

<style scoped>
.crt-root { font-family: inherit; display: flex; flex-direction: column; gap: 16px; }

.crt-intro {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px;
  background: #eef2ff; border: 1px solid #c7d2fe;
  border-left: 3px solid #6366f1; border-radius: 10px;
  color: #1e1b4b;
}
.body--dark .crt-intro { background: rgba(99,102,241,.08); border-color: rgba(99,102,241,.25); color: #c7d2fe; }
.crt-intro-title { font-size: .9rem; font-weight: 800; }
.crt-intro-sub { font-size: .78rem; color: #475569; line-height: 1.45; margin-top: 2px; }
.body--dark .crt-intro-sub { color: #94a3b8; }

.crt-grid {
  display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; align-items: start;
}
@media (max-width: 700px) {
  .crt-grid { grid-template-columns: 1fr; }
}

.crt-card {
  background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.body--dark .crt-card { background: #1e293b; border-color: #1e2d3d; }

.crt-card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.crt-ci {
  width: 28px; height: 28px; border-radius: 7px;
  background: #fee2e2; border: 1px solid #fecaca; color: #dc2626;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.crt-ci--grey { background: #f8fafc; border-color: #e2e8f0; color: #64748b; }
.body--dark .crt-ci { background: rgba(220,38,38,.12); border-color: rgba(220,38,38,.25); color: #fca5a5; }
.body--dark .crt-ci--grey { background: rgba(148,163,184,.08); border-color: rgba(148,163,184,.18); color: #94a3b8; }

.crt-card-title { font-size: .82rem; font-weight: 700; color: #111827; }
.body--dark .crt-card-title { color: #f1f5f9; }
.crt-card-sub { font-size: .71rem; color: #9ca3af; }

.crt-drop-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 140px; padding: 16px;
  border: 2px dashed #c7d2fe; border-radius: 10px;
  background: #f8faff; cursor: pointer; position: relative;
  transition: border-color .15s, background .15s;
  gap: 6px;
}
.crt-drop-zone:hover { border-color: #818cf8; background: #eef2ff; }
.crt-drop-zone.has-doc { border-color: #86efac; background: #f0fdf4; }
.crt-drop-zone.has-doc:hover { border-color: #4ade80; background: #dcfce7; }
.body--dark .crt-drop-zone { background: rgba(99,102,241,.05); border-color: rgba(99,102,241,.2); }
.body--dark .crt-drop-zone.has-doc { background: rgba(22,163,74,.08); border-color: rgba(34,197,94,.3); }

.crt-file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

.crt-drop-text { font-size: .85rem; font-weight: 700; color: #374151; }
.body--dark .crt-drop-text { color: #d1d5db; }
.crt-drop-sub { font-size: .72rem; color: #9ca3af; }

.crt-actions { display: flex; gap: 6px; margin-top: 10px; }

.crt-hint {
  display: flex; align-items: flex-start; gap: 6px; margin-top: 10px;
  font-size: .72rem; color: #94a3b8; line-height: 1.4;
}
.body--dark .crt-hint { color: #64748b; }
</style>
