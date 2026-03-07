<template>
  <div class="clt-root">
    <div class="clt-layout">

      <!-- Upload zone -->
      <div class="clt-upload-col">
        <div class="clt-card">
          <div class="clt-card-head">
            <div class="clt-ci"><q-icon name="cloud_upload" size="16px" /></div>
            <div>
              <div class="clt-card-title">Subir imagen</div>
              <div class="clt-card-sub">PNG o JPG · máximo recomendado 2 MB</div>
            </div>
          </div>

          <!-- Drop zone -->
          <label class="clt-drop-zone" :class="{ 'has-file': fileSync || previewSync || logoSync }">
            <input type="file" accept="image/*" class="clt-file-input" @change="onFilePick" />
            <template v-if="previewSync || logoSync">
              <img :src="previewSync || logoSync" class="clt-preview-img" alt="Logo preview" />
              <div class="clt-drop-overlay">
                <q-icon name="change_circle" size="20px" />
                <span>Cambiar imagen</span>
              </div>
            </template>
            <template v-else>
              <div class="clt-drop-empty">
                <div class="clt-drop-icon"><q-icon name="add_photo_alternate" size="28px" /></div>
                <div class="clt-drop-text">Haz clic para elegir</div>
                <div class="clt-drop-sub">o arrastra aquí tu imagen</div>
              </div>
            </template>
          </label>

          <div class="clt-card-actions">
            <div class="clt-spec-chips">
              <span class="clt-spec-chip"><q-icon name="straighten" size="12px" />600 × 200 px</span>
              <span class="clt-spec-chip"><q-icon name="aspect_ratio" size="12px" />Horizontal</span>
              <span class="clt-spec-chip"><q-icon name="palette" size="12px" />PNG / JPG</span>
            </div>
            <q-btn v-if="previewSync || logoSync" flat dense size="sm" icon="delete" label="Quitar" color="negative" @click="clearLogo" />
          </div>
        </div>

        <!-- URL alternativa -->
        <div class="clt-card clt-card--flat">
          <div class="clt-card-head">
            <div class="clt-ci clt-ci--grey"><q-icon name="link" size="14px" /></div>
            <div class="clt-card-title-sm">O ingresa una URL externa</div>
          </div>
          <q-input
            v-model="logoSync"
            outlined dense clearable
            placeholder="https://empresa.cl/logo.png"
            @update:model-value="v => { if(!v) clearLogo(); else previewSync = ''; $emit('validity', true) }"
            class="clt-url-input"
          >
            <template #prepend><q-icon name="language" size="16px" color="grey" /></template>
          </q-input>
          <div class="clt-url-note"><q-icon name="info_outline" size="12px" />La URL debe ser pública y accesible externamente</div>
        </div>
      </div>

      <!-- Preview col -->
      <div class="clt-preview-col">
        <div class="clt-prev-label">Cómo se verá</div>

        <!-- Document mockup -->
        <div class="clt-mockup">
          <div class="clt-mockup-header">
            <div class="clt-mockup-logo">
              <img v-if="previewSync || logoSync" :src="previewSync || logoSync" alt="Logo" class="clt-mockup-img" />
              <div v-else class="clt-mockup-placeholder">
                <q-icon name="image" size="20px" />
              </div>
            </div>
            <div class="clt-mockup-lines">
              <div class="clt-ml clt-ml--title"></div>
              <div class="clt-ml clt-ml--sub"></div>
              <div class="clt-ml clt-ml--sub" style="width:55%"></div>
            </div>
          </div>
          <div class="clt-mockup-body">
            <div class="clt-mb-row" v-for="n in 4" :key="n">
              <div class="clt-mb-cell"></div>
              <div class="clt-mb-cell" style="width:30%"></div>
            </div>
          </div>
          <div class="clt-mockup-label">Liquidación de sueldo</div>
        </div>

        <!-- Status badge -->
        <div class="clt-status" :class="(previewSync || logoSync) ? 'clt-s-ok' : 'clt-s-none'">
          <q-icon :name="(previewSync || logoSync) ? 'check_circle' : 'radio_button_unchecked'" size="14px" />
          {{ (previewSync || logoSync) ? 'Logo configurado' : 'Sin logo (usará nombre de empresa)' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ logo: String, file: Object, preview: String })
const emit  = defineEmits(['update:logo', 'update:file', 'update:preview', 'validity'])

const logoSync    = computed({ get: () => props.logo,    set: v => emit('update:logo', v) })
const fileSync    = computed({ get: () => props.file,    set: v => emit('update:file', v) })
const previewSync = computed({ get: () => props.preview, set: v => emit('update:preview', v) })

function onFilePick(e) {
  const file = e.target.files?.[0]
  if (!file) return
  fileSync.value = file
  const r = new FileReader()
  r.onload = ev => { previewSync.value = ev.target.result; emit('validity', true) }
  r.readAsDataURL(file)
}
function clearLogo() { logoSync.value = ''; previewSync.value = ''; fileSync.value = null; emit('validity', true) }
</script>

<style scoped>
.clt-root { font-family: inherit; }
.clt-layout { display: grid; grid-template-columns: 1fr 220px; gap: 18px; align-items: start; }

/* Cards */
.clt-upload-col { display: flex; flex-direction: column; gap: 10px; }
.clt-card {
  background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.body--dark .clt-card { background: #1e293b; border-color: #1e2d3d; }
.clt-card--flat { background: #fafbff; box-shadow: none; border-color: #e0e7ff; }
.body--dark .clt-card--flat { background: rgba(99,102,241,.04); border-color: rgba(99,102,241,.12); }

.clt-card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.clt-ci { width: 28px; height: 28px; border-radius: 7px; background: #eff6ff; border: 1px solid #bfdbfe; color: #3b82f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.clt-ci--grey { background: #f8fafc; border-color: #e2e8f0; color: #64748b; }
.body--dark .clt-ci { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.25); color: #93c5fd; }

.clt-card-title { font-size: .82rem; font-weight: 700; color: #111827; }
.body--dark .clt-card-title { color: #f1f5f9; }
.clt-card-title-sm { font-size: .8rem; font-weight: 700; color: #374151; }
.body--dark .clt-card-title-sm { color: #d1d5db; }
.clt-card-sub { font-size: .71rem; color: #9ca3af; }

/* Drop zone */
.clt-drop-zone {
  display: flex; align-items: center; justify-content: center;
  min-height: 130px; border: 2px dashed #c7d2fe; border-radius: 10px;
  background: #f8faff; cursor: pointer; overflow: hidden;
  position: relative; transition: border-color .15s, background .15s;
  margin-bottom: 12px;
}
.clt-drop-zone:hover { border-color: #818cf8; background: #eef2ff; }
.clt-drop-zone.has-file { border-style: solid; border-color: #a5b4fc; padding: 0; }
.body--dark .clt-drop-zone { background: rgba(99,102,241,.05); border-color: rgba(99,102,241,.2); }
.body--dark .clt-drop-zone:hover { background: rgba(99,102,241,.1); border-color: rgba(99,102,241,.4); }

.clt-file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }

.clt-preview-img { width: 100%; height: 130px; object-fit: contain; display: block; }
.clt-drop-overlay {
  position: absolute; inset: 0; background: rgba(79,70,229,.7);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 5px; color: #fff; font-size: .8rem; font-weight: 700;
  opacity: 0; transition: opacity .15s;
}
.clt-drop-zone:hover .clt-drop-overlay { opacity: 1; }

.clt-drop-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 20px; }
.clt-drop-icon { width: 52px; height: 52px; border-radius: 12px; background: #eff6ff; border: 1px solid #c7d2fe; display: flex; align-items: center; justify-content: center; color: #4f46e5; }
.clt-drop-text { font-size: .82rem; font-weight: 700; color: #374151; }
.body--dark .clt-drop-text { color: #d1d5db; }
.clt-drop-sub { font-size: .72rem; color: #9ca3af; }

/* Spec chips */
.clt-card-actions { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; }
.clt-spec-chips { display: flex; gap: 5px; flex-wrap: wrap; }
.clt-spec-chip {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 8px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px;
  font-size: .68rem; font-weight: 700; color: #475569;
}
.body--dark .clt-spec-chip { background: #0f172a; border-color: #1e293b; color: #64748b; }

/* URL input */
.clt-url-input :deep(.q-field__control) { border-radius: 8px; }
.clt-url-note { display: flex; align-items: center; gap: 5px; font-size: .71rem; color: #9ca3af; margin-top: 7px; }

/* Preview col */
.clt-preview-col { display: flex; flex-direction: column; gap: 10px; }
.clt-prev-label { font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; }

/* Document mockup */
.clt-mockup {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
  box-shadow: 0 4px 14px rgba(0,0,0,.08);
  position: relative;
}
.body--dark .clt-mockup { background: #1e293b; border-color: #1e2d3d; }

.clt-mockup-header { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.body--dark .clt-mockup-header { background: #0f172a; border-bottom-color: #1e2d3d; }
.clt-mockup-logo { width: 80px; height: 40px; border: 1px dashed #c7d2fe; border-radius: 5px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #fff; flex-shrink: 0; }
.body--dark .clt-mockup-logo { background: #1e293b; border-color: rgba(99,102,241,.2); }
.clt-mockup-img { width: 100%; height: 100%; object-fit: contain; }
.clt-mockup-placeholder { color: #c7d2fe; }

.clt-mockup-lines { flex: 1; display: flex; flex-direction: column; gap: 5px; padding-top: 2px; }
.clt-ml { height: 6px; border-radius: 3px; background: #e2e8f0; }
.body--dark .clt-ml { background: #1e2d3d; }
.clt-ml--title { width: 70%; background: #94a3b8; }
.clt-ml--sub { width: 50%; }

.clt-mockup-body { padding: 10px 14px; display: flex; flex-direction: column; gap: 5px; }
.clt-mb-row { display: flex; gap: 8px; align-items: center; }
.clt-mb-cell { height: 5px; flex: 1; background: #f1f5f9; border-radius: 3px; }
.body--dark .clt-mb-cell { background: #1e293b; }

.clt-mockup-label {
  text-align: center; padding: 6px; font-size: .65rem; font-weight: 700;
  color: #94a3b8; background: #f8fafc; border-top: 1px solid #f1f5f9; letter-spacing: .05em; text-transform: uppercase;
}
.body--dark .clt-mockup-label { background: #0f172a; border-top-color: #1e2d3d; }

/* Status */
.clt-status { display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 8px; font-size: .76rem; font-weight: 700; }
.clt-s-ok   { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.clt-s-none { background: #f8fafc; border: 1px solid #e2e8f0; color: #94a3b8; }
.body--dark .clt-s-ok   { background: rgba(21,128,61,.1); border-color: rgba(22,163,74,.2); color: #86efac; }
.body--dark .clt-s-none { background: #0f172a; border-color: #1e293b; color: #475569; }

@media (max-width: 700px) { .clt-layout { grid-template-columns: 1fr; } .clt-preview-col { display: none; } }
</style>