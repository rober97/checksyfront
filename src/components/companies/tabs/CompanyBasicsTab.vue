<template>
  <div class="cbt-root">

    <div class="cbt-layout">
      <!-- ── FORM SIDE ─────────────────── -->
      <div class="cbt-form-col">

        <!-- Section: Identificación -->
        <div class="cbt-section">
          <div class="cbt-section-head">
            <div class="cbt-section-icon cbt-icon--blue"><q-icon name="badge" size="16px" /></div>
            <div>
              <div class="cbt-section-title">Identificación legal</div>
              <div class="cbt-section-sub">Datos con que se emiten documentos tributarios</div>
            </div>
          </div>
          <div class="cbt-field-grid">
            <div class="cbt-field cbt-field--wide">
              <label class="cbt-label">Nombre de la empresa <span class="cbt-req">*</span></label>
              <q-input
                v-model.trim="m.name"
                outlined dense
                placeholder="Ej: Empresas Ejemplo S.A."
                :rules="[v => !!v || 'Requerido']"
                @update:model-value="emitValid"
                class="cbt-input"
              />
            </div>
            <div class="cbt-field">
              <label class="cbt-label">RUT <span class="cbt-req">*</span></label>
              <q-input
                v-model.trim="m.rut"
                outlined dense
                placeholder="12.345.678-9"
                :rules="[v => !!v || 'Requerido', rutRule]"
                @blur="normalizeRut"
                @update:model-value="emitValid"
                class="cbt-input"
              >
                <template #append>
                  <q-icon
                    :name="rutValido ? 'verified' : 'error_outline'"
                    :class="rutValido ? 'cbt-icon-ok' : 'cbt-icon-err'"
                    size="18px"
                  />
                </template>
              </q-input>
            </div>
            <div class="cbt-field">
              <label class="cbt-label">Estado</label>
              <q-select
                v-model="m.status"
                :options="statusOpts"
                outlined dense emit-value map-options
                class="cbt-input"
                @update:model-value="emitValid"
              >
                <template #selected-item="{ opt }">
                  <div class="cbt-status-chip" :class="`cbt-s-${opt.value}`">
                    <span class="cbt-s-dot"></span>{{ opt.label }}
                  </div>
                </template>
              </q-select>
            </div>
          </div>
        </div>

        <!-- Section: Contacto -->
        <div class="cbt-section">
          <div class="cbt-section-head">
            <div class="cbt-section-icon cbt-icon--green"><q-icon name="contact_phone" size="16px" /></div>
            <div>
              <div class="cbt-section-title">Información de contacto</div>
              <div class="cbt-section-sub">Opcional — para comunicaciones internas</div>
            </div>
          </div>
          <div class="cbt-field-grid">
            <div class="cbt-field">
              <label class="cbt-label">Correo electrónico</label>
              <q-input
                v-model.trim="m.email"
                type="email" outlined dense
                placeholder="contacto@empresa.cl"
                :rules="[emailRule]"
                @blur="m.email = (m.email||'').toLowerCase().trim()"
                @update:model-value="emitValid"
                class="cbt-input"
              >
                <template #prepend><q-icon name="mail_outline" size="16px" class="cbt-prepend" /></template>
              </q-input>
            </div>
            <div class="cbt-field">
              <label class="cbt-label">Teléfono</label>
              <q-input
                v-model.trim="m.phone"
                outlined dense
                placeholder="+56 9 12345678"
                @update:model-value="emitValid"
                class="cbt-input"
              >
                <template #prepend><q-icon name="call" size="16px" class="cbt-prepend" /></template>
              </q-input>
            </div>
            <div class="cbt-field cbt-field--wide">
              <label class="cbt-label">Dirección</label>
              <q-input
                v-model.trim="m.address"
                outlined dense
                placeholder="Av. Ejemplo 123, Santiago"
                @update:model-value="emitValid"
                class="cbt-input"
              >
                <template #prepend><q-icon name="location_on" size="16px" class="cbt-prepend" /></template>
              </q-input>
            </div>
          </div>
        </div>

        <div v-if="m.status === 'deleted'" class="cbt-danger-banner">
          <q-icon name="dangerous" size="18px" />
          <div>
            <strong>Empresa marcada como eliminada.</strong>
            No aparecerá en listados y no podrá usarse en nuevas operaciones.
          </div>
        </div>

      </div>

      <!-- ── PREVIEW SIDE ─────────────── -->
      <div class="cbt-preview-col">
        <div class="cbt-preview-label">Vista previa</div>

        <div class="cbt-preview-card">
          <!-- Card header with avatar -->
          <div class="cbt-prev-header">
            <div class="cbt-prev-avatar">
              {{ m.name ? m.name.charAt(0).toUpperCase() : '?' }}
            </div>
            <div class="cbt-prev-info">
              <div class="cbt-prev-name">{{ m.name || 'Nombre de la empresa' }}</div>
              <div class="cbt-prev-rut">{{ m.rut || 'RUT no configurado' }}</div>
            </div>
          </div>
          <div class="cbt-prev-status-row">
            <span class="cbt-prev-badge" :class="`cbt-pb-${m.status}`">
              <span class="cbt-pb-dot"></span>
              {{ statusLabel }}
            </span>
            <span v-if="rutValido" class="cbt-prev-badge cbt-pb-verified">
              <q-icon name="verified" size="11px" /> RUT válido
            </span>
          </div>
          <div class="cbt-prev-divider"></div>
          <div class="cbt-prev-rows">
            <div class="cbt-prev-row">
              <q-icon name="mail_outline" size="13px" />
              <span>{{ m.email || 'Sin correo' }}</span>
            </div>
            <div class="cbt-prev-row">
              <q-icon name="call" size="13px" />
              <span>{{ m.phone || 'Sin teléfono' }}</span>
            </div>
            <div class="cbt-prev-row">
              <q-icon name="location_on" size="13px" />
              <span>{{ m.address || 'Sin dirección' }}</span>
            </div>
          </div>
        </div>

        <!-- Completion checklist -->
        <div class="cbt-checklist">
          <div class="cbt-check-item" :class="m.name ? 'is-done' : 'is-pending'">
            <q-icon :name="m.name ? 'check_circle' : 'radio_button_unchecked'" size="14px" />
            Nombre
          </div>
          <div class="cbt-check-item" :class="rutValido ? 'is-done' : 'is-pending'">
            <q-icon :name="rutValido ? 'check_circle' : 'radio_button_unchecked'" size="14px" />
            RUT válido
          </div>
          <div class="cbt-check-item is-optional" :class="m.email ? 'is-done' : ''">
            <q-icon :name="m.email ? 'check_circle' : 'circle'" size="14px" />
            Correo <span class="cbt-opt-tag">opc.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
const props = defineProps({ modelValue: { type: Object, required: true }, isEdit: Boolean })
const emit  = defineEmits(['update:modelValue', 'validity'])

const m = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })

const statusOpts = [
  { label: 'Activa', value: 'active' },
  { label: 'Inactiva', value: 'inactive' },
  { label: 'Eliminada', value: 'deleted' },
]
const statusLabel = computed(() => statusOpts.find(s => s.value === m.value.status)?.label ?? '–')

const rutRegex = /^\d{1,2}\.?\d{3}\.?\d{3}-[\dKk]$/
const rutValido = computed(() => rutRegex.test(String(m.value.rut || '')))
const rutRule   = v => rutRegex.test(String(v||'')) || 'RUT inválido'
const emailRule = v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Correo inválido'

const normalizeRut = () => { if (m.value.rut) m.value.rut = String(m.value.rut).replace(/\s+/g,'').toUpperCase() }
const emitValid = () => emit('validity', !!(m.value.name?.trim() && rutValido.value))

onMounted(emitValid)
watch(() => m.value, emitValid, { deep: true })
</script>

<style scoped>
.cbt-root { font-family: inherit; }

.cbt-layout { display: grid; grid-template-columns: 1fr 230px; gap: 20px; align-items: start; }

/* Sections */
.cbt-form-col { display: flex; flex-direction: column; gap: 14px; }
.cbt-section {
  border: 1px solid #f1f5f9;
  border-radius: 12px; padding: 16px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.body--dark .cbt-section { background: #1e293b; border-color: #1e2d3d; }

.cbt-section-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
.cbt-section-icon {
  width: 30px; height: 30px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cbt-icon--blue  { background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; }
.cbt-icon--green { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.body--dark .cbt-icon--blue  { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.25); color: #93c5fd; }
.body--dark .cbt-icon--green { background: rgba(22,163,74,.12); border-color: rgba(22,163,74,.25); color: #86efac; }

.cbt-section-title { font-size: .83rem; font-weight: 700; color: #111827; }
.body--dark .cbt-section-title { color: #f1f5f9; }
.cbt-section-sub { font-size: .72rem; color: #9ca3af; margin-top: 1px; }

.cbt-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cbt-field-wide { grid-column: 1 / -1; }
.cbt-field { display: flex; flex-direction: column; gap: 4px; }
.cbt-field--wide { grid-column: 1 / -1; }

.cbt-label { font-size: .75rem; font-weight: 700; color: #6b7280; }
.body--dark .cbt-label { color: #94a3b8; }
.cbt-req { color: #ef4444; }

.cbt-input :deep(.q-field__control) { border-radius: 8px; }

.cbt-prepend { color: #9ca3af; }
.cbt-icon-ok { color: #16a34a; }
.cbt-icon-err { color: #d97706; }

/* Status chip in select */
.cbt-status-chip { display: flex; align-items: center; gap: 6px; font-size: .82rem; font-weight: 600; }
.cbt-s-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.cbt-s-active   { color: #16a34a; }
.cbt-s-inactive { color: #6b7280; }
.cbt-s-deleted  { color: #ef4444; }

/* Danger banner */
.cbt-danger-banner {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 15px; border-radius: 10px;
  background: #fef2f2; border: 1px solid #fecaca; border-left: 3px solid #ef4444;
  font-size: .82rem; color: #991b1b; line-height: 1.5;
}
.body--dark .cbt-danger-banner { background: rgba(239,68,68,.07); border-color: rgba(252,165,165,.18); color: #fca5a5; }

/* Preview */
.cbt-preview-col { display: flex; flex-direction: column; gap: 10px; }
.cbt-preview-label { font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; }

.cbt-preview-card {
  background: linear-gradient(135deg, #f8faff 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;
}
.body--dark .cbt-preview-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-color: #1e2d3d; }

.cbt-prev-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.cbt-prev-avatar {
  width: 38px; height: 38px; border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff; font-size: .9rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(99,102,241,.35);
}
.cbt-prev-name { font-size: .82rem; font-weight: 700; color: #111827; word-break: break-word; }
.body--dark .cbt-prev-name { color: #f1f5f9; }
.cbt-prev-rut  { font-size: .72rem; color: #6b7280; font-variant-numeric: tabular-nums; }

.cbt-prev-status-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.cbt-prev-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px;
  font-size: .67rem; font-weight: 700;
}
.cbt-pb-active   { background: #dcfce7; color: #15803d; }
.cbt-pb-inactive { background: #f4f4f5; color: #71717a; }
.cbt-pb-deleted  { background: #fee2e2; color: #b91c1c; }
.cbt-pb-verified { background: #eff6ff; color: #1d4ed8; }
.cbt-pb-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.body--dark .cbt-pb-active   { background: rgba(21,128,61,.18); color: #86efac; }
.body--dark .cbt-pb-inactive { background: rgba(115,115,115,.18); color: #a1a1aa; }
.body--dark .cbt-pb-deleted  { background: rgba(185,28,28,.18); color: #fca5a5; }
.body--dark .cbt-pb-verified { background: rgba(59,130,246,.1); color: #93c5fd; }

.cbt-prev-divider { height: 1px; background: #e2e8f0; margin-bottom: 10px; }
.body--dark .cbt-prev-divider { background: #1e2d3d; }

.cbt-prev-rows { display: flex; flex-direction: column; gap: 5px; }
.cbt-prev-row  { display: flex; align-items: center; gap: 6px; font-size: .74rem; color: #6b7280; }
.cbt-prev-row .q-icon { flex-shrink: 0; color: #94a3b8; }
.cbt-prev-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Checklist */
.cbt-checklist { display: flex; flex-direction: column; gap: 4px; }
.cbt-check-item {
  display: flex; align-items: center; gap: 6px;
  font-size: .74rem; font-weight: 600; color: #94a3b8;
  padding: 4px 0;
}
.cbt-check-item.is-done    { color: #16a34a; }
.cbt-check-item.is-pending { color: #d97706; }
.cbt-check-item.is-optional { color: #94a3b8; }
.cbt-check-item.is-optional.is-done { color: #6366f1; }
.cbt-opt-tag { font-size: .63rem; font-weight: 500; color: #9ca3af; margin-left: 2px; }

@media (max-width: 840px) { .cbt-layout { grid-template-columns: 1fr; } .cbt-preview-col { display: none; } }
@media (max-width: 540px) { .cbt-field-grid { grid-template-columns: 1fr; } .cbt-field--wide { grid-column: auto; } }
</style>