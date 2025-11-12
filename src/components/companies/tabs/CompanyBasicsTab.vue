<template>
  <div class="rk-cbas row q-col-gutter-sm">
    <!-- ===== Columna principal ===== -->
    <div class="col-12 col-md-8">
      <div class="rk-card q-pa-md">
        <div class="rk-sec-title q-mb-sm">Identificación de la empresa</div>

        <!-- Nombre + Estado -->
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-8">
            <q-input
              v-model.trim="m.name"
              label="Nombre*"
              dense outlined clearable
              :rules="[req]"
              @update:model-value="emitValid"
            >
              <template #append><q-icon name="domain" /></template>
            </q-input>
          </div>

          <div class="col-12 col-sm-4">
            <q-select
              v-model="m.status"
              :options="statusOpts"
              label="Estado"
              dense outlined
              emit-value map-options
              @update:model-value="emitValid"
            >
              <template #append><q-icon name="toggle_on" /></template>
            </q-select>
          </div>
        </div>

        <!-- RUT + Teléfono -->
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-12 col-sm-6">
            <q-input
              v-model.trim="m.rut"
              label="RUT*"
              dense outlined
              :rules="[req, rutRule]"
              mask="##.###.###-#"
              fill-mask
              @update:model-value="emitValid"
              @blur="normalizeRut"
            >
              <template #append>
                <q-icon :name="rutValido ? 'verified' : 'error_outline'"
                        :color="rutValido ? 'positive' : 'warning'" />
              </template>
              <template #hint>Ej.: 12.345.678-9</template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model.trim="m.phone"
              label="Teléfono (opcional)"
              dense outlined clearable
              :rules="[phoneRule]"
              mask="+56 9 ########"
              fill-mask
              @update:model-value="emitValid"
            >
              <template #append><q-icon name="call" /></template>
            </q-input>
          </div>
        </div>

        <!-- Email + Dirección -->
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-12 col-sm-6">
            <q-input
              v-model.trim="m.email"
              type="email"
              label="Correo electrónico (opcional)"
              dense outlined clearable
              :rules="[emailRule]"
              @blur="m.email = (m.email || '').trim().toLowerCase()"
              @update:model-value="emitValid"
            >
              <template #append><q-icon name="mail" /></template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model.trim="m.address"
              label="Dirección"
              dense outlined clearable
              @update:model-value="emitValid"
            >
              <template #append><q-icon name="location_on" /></template>
            </q-input>
          </div>
        </div>

        <!-- Aviso por estado -->
        <q-banner v-if="m.status === 'deleted'" class="rk-warn q-mt-md">
          <q-icon name="warning" class="q-mr-sm" />
          Estado <b>Eliminada</b>: no aparecerá en listados y no podrá usarse en nuevos documentos.
        </q-banner>
      </div>
    </div>

    <!-- ===== Lateral de ayuda ===== -->
    <div class="col-12 col-md-4">
      <q-card flat bordered class="rk-side q-pa-md">
        <div class="rk-help">
          <div class="rk-help-title">Ayuda</div>

          <ul class="rk-help-list text-caption">
            <li>
              <q-icon name="check_circle" size="16px" />
              <div>
                <span class="nowrap"><b>Nombre</b> y <b>RUT</b></span> — obligatorios.
              </div>
            </li>
            <li>
              <q-icon name="notifications" size="16px" />
              <div>
                <span class="nowrap"><b>Teléfono</b> y <b>correo</b></span> — opcionales; se usan para notificaciones.
              </div>
            </li>
            <li>
              <q-icon name="toggle_on" size="16px" />
              <div>
                <b>Estado</b> — controla si la empresa está activa para operar.
              </div>
            </li>
          </ul>

          <q-separator spaced />

          <div class="rk-help-subtitle">Vista rápida</div>
          <div class="rk-mini">
            <div class="row items-center q-mb-xs">
              <q-icon name="badge" class="q-mr-xs" />
              <span>{{ m.rut || 'RUT no informado' }}</span>
            </div>
            <div class="row items-center q-mb-xs">
              <q-icon name="mail" class="q-mr-xs" />
              <span>{{ m.email || 'Correo no informado' }}</span>
            </div>
            <div class="row items-center">
              <q-icon name="call" class="q-mr-xs" />
              <span>{{ m.phone || 'Teléfono no informado' }}</span>
            </div>
          </div>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  isEdit: Boolean,
})
const emit = defineEmits(['update:modelValue', 'validity'])

const m = computed({
  get: () => props.modelValue,
  set: v  => emit('update:modelValue', v),
})

/* Opciones */
const statusOpts = [
  { label: 'Activa',    value: 'active' },
  { label: 'Inactiva',  value: 'inactive' },
  { label: 'Eliminada', value: 'deleted' },
]

/* Reglas */
const req        = v => !!v || 'Requerido'
const emailRule  = v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Correo inválido'
const phoneRule  = v => !v || /^\+56 9 \d{8}$/.test(v) || 'Formato esperado: +56 9 ########'
const rutRegex   = /^\d{1,2}\.?\d{3}\.?\d{3}-[\dKk]$/
const rutRule    = v => !!v && rutRegex.test(v) || 'RUT inválido'
const rutValido  = computed(() => rutRegex.test(String(m.value.rut || '')))

/* Normaliza la K y espacios (mantiene la máscara) */
function normalizeRut () {
  if (!m.value.rut) return
  m.value.rut = String(m.value.rut).replace(/\s+/g, '').toUpperCase()
}

/* Validez global (Nombre y RUT válidos) */
function valid () {
  return !!(m.value.name && m.value.rut && rutRegex.test(String(m.value.rut)))
}
function emitValid () {
  emit('validity', valid())
}
onMounted(emitValid)
watch(() => m.value, emitValid, { deep: true })
</script>

<style scoped>
/* Tarjeta principal */
.rk-card {
  border: 1px solid var(--rk-border, rgba(0,0,0,.08));
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(2,6,23,.02), transparent 60%),
    var(--rk-bg, #fff);
}

/* Lateral */
.rk-side {
  border-radius: 14px;
  background: var(--rk-side, #fff);
  min-width: 280px; /* evita columnas demasiado estrechas */
}

/* Títulos */
.rk-sec-title,
.rk-help-title {
  font-weight: 600;
  color: var(--rk-title, #111827);
}
.rk-help-title { margin-bottom: 6px; }
.rk-help-subtitle {
  font-size: .875rem;
  color: var(--rk-title, #111827);
  margin-bottom: 6px;
}

/* Lista de ayuda (icono + texto) */
.rk-help-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.rk-help-list li {
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: start;
  column-gap: 8px;
  line-height: 1.35;
}

/* Evitar cortes feos de palabras y la “y” suelta */
.nowrap { white-space: nowrap; }
.rk-side, .rk-side * {
  word-break: normal !important;
  overflow-wrap: break-word !important;
  hyphens: auto;
}

/* Aviso */
.rk-warn {
  border-left: 4px solid #f59e0b;
  background: rgba(245,158,11,.10);
  color: #7c4a00;
  border-radius: 10px;
  padding: 8px 10px;
}

/* Vista rápida */
.rk-mini {
  padding: 8px 10px;
  border: 1px dashed var(--rk-border, rgba(0,0,0,.12));
  border-radius: 10px;
}

/* Modo oscuro */
.body--dark .rk-card {
  --rk-border: rgba(255,255,255,.08);
  --rk-bg: #0b1220;
}
.body--dark .rk-side {
  --rk-border: rgba(255,255,255,.08);
  --rk-side: #0e172a;
}
.body--dark .rk-warn {
  background: rgba(245,158,11,.18);
  color: #ffd28a;
}

/* Responsive suave */
@media (max-width: 768px) {
  .rk-mini { font-size: 12px; }
}
</style>
