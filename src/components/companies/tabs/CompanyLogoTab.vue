<template>
  <div class="clt-root">
    <!-- ═══════════ COLOR DE MARCA ═══════════ -->
    <div class="clt-card clt-brand-card">
      <div class="clt-card-head">
        <div class="clt-ci clt-ci--brand">
          <q-icon name="palette" size="16px" />
        </div>
        <div>
          <div class="clt-card-title">Color de marca</div>
          <div class="clt-card-sub">Tiñe el header, botones y acentos de la app con la identidad de la empresa</div>
        </div>
      </div>

      <div class="clt-brand-body">
        <!-- Live preview -->
        <div class="clt-brand-preview" :style="previewStyle">
          <div class="clt-brand-preview-avatar" :style="previewAvatarStyle">
            <span>{{ previewInitial }}</span>
          </div>
          <div class="clt-brand-preview-text">
            <span class="clt-brand-preview-eyebrow">Vista previa</span>
            <strong class="clt-brand-preview-name">{{ companyNameForPreview }}</strong>
          </div>
          <button
            v-if="brandColorSync"
            type="button"
            class="clt-brand-clear"
            @click="clearBrandColor"
            aria-label="Limpiar color"
          >
            <q-icon name="close" size="14px" />
          </button>
        </div>

        <!-- Paleta sugerida -->
        <div class="clt-swatches-label">Paleta sugerida</div>
        <div class="clt-swatches">
          <button
            v-for="hex in SUGGESTED_BRAND_COLORS"
            :key="hex"
            type="button"
            class="clt-swatch"
            :class="{ 'is-selected': normalize(brandColorSync) === normalize(hex) }"
            :style="{ background: hex }"
            :aria-label="`Usar color ${hex}`"
            @click="pickColor(hex)"
          >
            <q-icon
              v-if="normalize(brandColorSync) === normalize(hex)"
              name="check"
              size="14px"
              class="clt-swatch-check"
            />
          </button>
        </div>

        <!-- Custom hex -->
        <div class="clt-hex-row">
          <div class="clt-hex-native-wrap">
            <input
              type="color"
              class="clt-hex-native"
              :value="brandColorSync || DEFAULT_BRAND.bg"
              @input="onNativeColor($event)"
              aria-label="Selector de color personalizado"
            />
            <span class="clt-hex-native-icon">
              <q-icon name="colorize" size="14px" />
            </span>
          </div>
          <q-input
            v-model="hexInput"
            outlined dense
            label="Color personalizado (#RRGGBB)"
            placeholder="#0CA9C4"
            :rules="hexInputRules"
            class="clt-hex-input"
            @blur="commitHexInput"
            @keyup.enter="commitHexInput"
          >
            <template #prepend>
              <q-icon name="tag" size="14px" />
            </template>
          </q-input>
          <q-btn
            v-if="brandColorSync"
            flat dense size="sm"
            icon="restart_alt"
            label="Quitar"
            color="negative"
            @click="clearBrandColor"
          />
        </div>

        <div class="clt-brand-hint">
          <q-icon name="info_outline" size="14px" />
          <span>Si dejas este campo vacío, se asignará automáticamente un color único derivado del nombre de la empresa.</span>
        </div>
      </div>
    </div>

    <!-- ═══════════ LOGO ═══════════ -->
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
import { computed, ref, watch } from 'vue'
import {
  SUGGESTED_BRAND_COLORS,
  DEFAULT_BRAND,
  deriveBrandFromHex,
  getCompanyColor,
  getCompanyInitial,
} from '@/utils/companyBrand'

const props = defineProps({
  logo: String,
  file: Object,
  preview: String,
  brandColor: { type: String, default: '' },
  companyName: { type: String, default: '' },
})
const emit = defineEmits([
  'update:logo',
  'update:file',
  'update:preview',
  'update:brandColor',
  'validity',
])

const HEX_RE = /^#[0-9a-fA-F]{6}$/

const logoSync    = computed({ get: () => props.logo,    set: v => emit('update:logo', v) })
const fileSync    = computed({ get: () => props.file,    set: v => emit('update:file', v) })
const previewSync = computed({ get: () => props.preview, set: v => emit('update:preview', v) })
const brandColorSync = computed({
  get: () => props.brandColor || '',
  set: v => emit('update:brandColor', v || ''),
})

const hexInput = ref(brandColorSync.value)
watch(() => brandColorSync.value, v => { hexInput.value = v || '' })

const companyNameForPreview = computed(() => props.companyName || 'Tu empresa')
const previewInitial = computed(() => getCompanyInitial({ name: companyNameForPreview.value }))

const effectiveBrand = computed(() => {
  if (brandColorSync.value && HEX_RE.test(brandColorSync.value)) {
    return deriveBrandFromHex(brandColorSync.value)
  }
  // Fallback determinista: muestra cómo se vería sin color custom
  return getCompanyColor({ name: companyNameForPreview.value })
})

const previewStyle = computed(() => ({
  background: `linear-gradient(135deg, ${effectiveBrand.value.bg}, ${effectiveBrand.value.bgAlt})`,
  color: effectiveBrand.value.fg,
}))

const previewAvatarStyle = computed(() => ({
  background: 'rgba(255, 255, 255, 0.2)',
  color: effectiveBrand.value.fg,
  border: `1.5px solid rgba(255, 255, 255, 0.35)`,
}))

const hexInputRules = [
  v => !v || HEX_RE.test(v) || 'Formato esperado: #RRGGBB',
]

function normalize(hex) {
  return String(hex || '').trim().toLowerCase()
}

function pickColor(hex) {
  brandColorSync.value = hex
  hexInput.value = hex
}

function onNativeColor(e) {
  const val = e.target?.value || ''
  if (HEX_RE.test(val)) {
    brandColorSync.value = val
    hexInput.value = val
  }
}

function commitHexInput() {
  const v = String(hexInput.value || '').trim()
  if (!v) {
    brandColorSync.value = ''
    return
  }
  if (HEX_RE.test(v)) {
    brandColorSync.value = v.toLowerCase()
  }
}

function clearBrandColor() {
  brandColorSync.value = ''
  hexInput.value = ''
}

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
.clt-root { font-family: inherit; display: flex; flex-direction: column; gap: 18px; }
.clt-layout { display: grid; grid-template-columns: 1fr 220px; gap: 18px; align-items: start; }

/* Cards */
.clt-upload-col { display: flex; flex-direction: column; gap: 10px; }
.clt-card {
  background: var(--card-background); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.clt-card--flat { background: var(--color-primary-soft); box-shadow: none; border-color: rgba(12, 169, 196,.15); }
.body--dark .clt-card--flat { background: var(--color-primary-soft); border-color: rgba(12, 169, 196,.12); }

.clt-card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.clt-ci { width: 28px; height: 28px; border-radius: 7px; background: var(--color-primary-soft); border: 1px solid rgba(12, 169, 196,.25); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.clt-ci--grey { background: var(--surface-soft); border-color: var(--border-color); color: var(--text-muted); }
.clt-ci--brand { background: var(--color-warning-soft); border-color: rgba(217,119,6,.3); color: var(--color-warning); }

.clt-card-title { font-size: .82rem; font-weight: 700; color: var(--text-primary); }
.clt-card-title-sm { font-size: .8rem; font-weight: 700; color: var(--text-secondary); }
.clt-card-sub { font-size: .71rem; color: #9ca3af; }

/* ═══════════ Brand color section ═══════════ */
.clt-brand-card { padding: 16px 18px; }
.clt-brand-body { display: flex; flex-direction: column; gap: 14px; }

.clt-brand-preview {
  position: relative;
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  transition: background 0.3s ease;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.12);
}

.clt-brand-preview-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; font-weight: 800; letter-spacing: .5px;
  flex-shrink: 0;
}

.clt-brand-preview-text { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
.clt-brand-preview-eyebrow {
  font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px;
  opacity: 0.8;
}
.clt-brand-preview-name { font-size: 1rem; font-weight: 800; }

.clt-brand-clear {
  position: absolute; top: 8px; right: 8px;
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.25); border: none; cursor: pointer;
  color: inherit;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s ease;
}
.clt-brand-clear:hover { background: rgba(255, 255, 255, 0.4); }

/* Swatches */
.clt-swatches-label {
  font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
  color: #64748b;
}
.body--dark .clt-swatches-label { color: #94a3b8; }

.clt-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
.clt-swatch {
  position: relative;
  width: 36px; height: 36px; border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.clt-swatch:hover { transform: scale(1.08); box-shadow: 0 4px 10px rgba(15, 23, 42, 0.25); }
.clt-swatch.is-selected {
  border-color: #ffffff;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.9), 0 4px 10px rgba(15, 23, 42, 0.3);
  transform: scale(1.08);
}
.body--dark .clt-swatch.is-selected {
  border-color: #0f172a;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9), 0 4px 10px rgba(0, 0, 0, 0.5);
}
.clt-swatch-check {
  position: absolute; inset: 0; margin: auto;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
}

/* Hex input row */
.clt-hex-row {
  display: flex; align-items: center; gap: 8px;
}

.clt-hex-native-wrap {
  position: relative;
  width: 36px; height: 36px;
  flex-shrink: 0;
}
.clt-hex-native {
  position: absolute; inset: 0; width: 100%; height: 100%;
  border: 1.5px solid #e2e8f0; border-radius: 8px;
  cursor: pointer; padding: 0;
  background: transparent;
}
.body--dark .clt-hex-native { border-color: #334155; }
.clt-hex-native::-webkit-color-swatch { border: none; border-radius: 6px; }
.clt-hex-native::-webkit-color-swatch-wrapper { padding: 2px; }
.clt-hex-native-icon {
  position: absolute; bottom: -4px; right: -4px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #0f172a; color: #fff;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
.body--dark .clt-hex-native-icon { background: #f1f5f9; color: #0f172a; }

.clt-hex-input { flex: 1; min-width: 0; }
.clt-hex-input :deep(.q-field__control) { border-radius: 8px; }

/* Hint */
.clt-brand-hint {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: .72rem; color: #94a3b8; line-height: 1.4;
}
.clt-brand-hint .q-icon { margin-top: 1px; flex-shrink: 0; }
.body--dark .clt-brand-hint { color: #64748b; }

/* Drop zone */
.clt-drop-zone {
  display: flex; align-items: center; justify-content: center;
  min-height: 130px; border: 2px dashed rgba(12, 169, 196,.3); border-radius: 10px;
  background: var(--color-primary-soft); cursor: pointer; overflow: hidden;
  position: relative; transition: border-color .15s, background .15s;
  margin-bottom: 12px;
}
.clt-drop-zone:hover { border-color: rgba(12, 169, 196,.6); background: var(--color-primary-soft); }
.clt-drop-zone.has-file { border-style: solid; border-color: rgba(12, 169, 196,.4); padding: 0; }

.clt-file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }

.clt-preview-img { width: 100%; height: 130px; object-fit: contain; display: block; }
.clt-drop-overlay {
  position: absolute; inset: 0; background: rgba(8, 147, 170,.7);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 5px; color: #fff; font-size: .8rem; font-weight: 700;
  opacity: 0; transition: opacity .15s;
}
.clt-drop-zone:hover .clt-drop-overlay { opacity: 1; }

.clt-drop-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 20px; }
.clt-drop-icon { width: 52px; height: 52px; border-radius: 12px; background: var(--color-primary-soft); border: 1px solid rgba(12, 169, 196,.25); display: flex; align-items: center; justify-content: center; color: var(--color-primary-dark); }
.clt-drop-text { font-size: .82rem; font-weight: 700; color: var(--text-secondary); }
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
  background: var(--card-background); border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden;
  box-shadow: 0 4px 14px rgba(0,0,0,.08);
  position: relative;
}

.clt-mockup-header { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: var(--surface-soft); border-bottom: 1px solid var(--border-color); }
.clt-mockup-logo { width: 80px; height: 40px; border: 1px dashed rgba(12, 169, 196,.3); border-radius: 5px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: var(--card-background); flex-shrink: 0; }
.clt-mockup-img { width: 100%; height: 100%; object-fit: contain; }
.clt-mockup-placeholder { color: rgba(12, 169, 196,.4); }

.clt-mockup-lines { flex: 1; display: flex; flex-direction: column; gap: 5px; padding-top: 2px; }
.clt-ml { height: 6px; border-radius: 3px; background: var(--border-color); }
.clt-ml--title { width: 70%; background: #94a3b8; }
.clt-ml--sub { width: 50%; }

.clt-mockup-body { padding: 10px 14px; display: flex; flex-direction: column; gap: 5px; }
.clt-mb-row { display: flex; gap: 8px; align-items: center; }
.clt-mb-cell { height: 5px; flex: 1; background: var(--surface-soft); border-radius: 3px; }

.clt-mockup-label {
  text-align: center; padding: 6px; font-size: .65rem; font-weight: 700;
  color: var(--text-muted); background: var(--surface-soft); border-top: 1px solid var(--border-color); letter-spacing: .05em; text-transform: uppercase;
}

/* Status */
.clt-status { display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 8px; font-size: .76rem; font-weight: 700; }
.clt-s-ok   { background: var(--color-success-soft); border: 1px solid rgba(22,163,74,.25); color: var(--color-success); }
.clt-s-none { background: var(--surface-soft); border: 1px solid var(--border-color); color: var(--text-muted); }

@media (max-width: 700px) {
  .clt-layout { grid-template-columns: 1fr; }
  .clt-preview-col { display: none; }
  .clt-hex-row { flex-wrap: wrap; }
}
</style>
