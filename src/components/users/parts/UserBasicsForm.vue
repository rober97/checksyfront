<template>
  <div class="rk-form-grid">
    <!-- Nombre -->
    <q-input
      v-model="local.firstName"
      label="Nombre"
      dense outlined clearable
      :rules="[req]"
    />

    <!-- Apellido -->
    <q-input
      v-model="local.lastName"
      label="Apellido"
      dense outlined clearable
      :rules="[req]"
    />

    <!-- Email -->
    <q-input
      v-model="local.email"
      label="Correo electrónico"
      type="email"
      dense outlined clearable
      :rules="[req, emailRule]"
      @blur="local.email = (local.email || '').trim().toLowerCase()"
    />

    <!-- Rol -->
    <q-option-group
      v-model="local.tipo"
      :options="roleOpts"
      inline
      class="rk-roles"
    />

    <!-- Empresa -->
    <CompanySearchSelect
      v-if="local.tipo !== 'admin'"
      v-model="local.empresa"
      :rules="[req]"
      label="Empresa"
      @created="onCompanyCreated"
    />

    <!-- RUT -->
    <q-input
      v-if="local.tipo === 'empleado'"
      v-model="local.rut"
      label="RUT (sin puntos, con guión)"
      dense outlined clearable
      :rules="[req, rutRule]"
      @blur="formatRut"
      placeholder="11111111-1"
    />

    <!-- Horario laboral -->
    <SchedulePicker
      v-if="local.tipo === 'empleado'"
      v-model="local.workScheduleChoice"
      :company-id="local.empresa"
      :company="companyObj"
      @preview="onPreviewSchedule"
      @created="onScheduleCreated"
    />

    <!-- Contraseña -->
    <q-input
      v-model="local.password"
      :type="showPass ? 'text' : 'password'"
      label="Contraseña"
      dense outlined clearable
      :rules="[passMin]"
    >
      <template #append>
        <q-btn
          flat dense round
          :icon="showPass ? 'visibility' : 'visibility_off'"
          @click="showPass = !showPass"
        />
        <q-btn
          flat dense round icon="auto_fix_high"
          @click="generatePassword"
        />
      </template>
    </q-input>

    <!-- Confirmación -->
    <q-input
      v-model="local.passwordConfirm"
      :type="showPass ? 'text' : 'password'"
      label="Confirmar contraseña"
      dense outlined clearable
      :rules="[matchPasswordRule]"
    />
  </div>
</template>

<script setup>
import { reactive, watch, ref, computed } from 'vue'
import {
  validarRUT,
  formatearRUT,
  emailRule,
  req,
  passMin
} from '@/utils/validators'
import CompanySearchSelect from '@/components/companies/CompanySearchSelect.vue'
import SchedulePicker from '@/components/users/SchedulePicker.vue'

/* =========================
   Props / Emits
========================= */
const props = defineProps({
  modelValue: { type: Object, required: true },
  // opcional: lista cruda para mostrar nombre de empresa
  empresasRaw: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'tipo-change', 'preview-schedule'])

/* =========================
   Campos que sí nos importan
========================= */
const EMPTY = () => ({
  firstName: '',
  lastName: '',
  email: '',
  tipo: 'empleado',
  empresa: null,
  rut: '',
  horarioLaboralId: null,
  workScheduleChoice: { mode: 'companyDefault', scheduleId: null },
  password: '',
  passwordConfirm: ''
})

// extraemos SOLO estos campos y en orden estable
function clean(v = {}) {
  const x = EMPTY()
  const src = v || {}
  x.firstName = src.firstName ?? ''
  x.lastName = src.lastName ?? ''
  x.email = src.email ?? ''
  x.tipo = src.tipo ?? 'empleado'
  x.empresa = src.empresa ?? null
  x.rut = src.rut ?? ''
  x.horarioLaboralId = src.horarioLaboralId ?? null
  const w = src.workScheduleChoice || {}
  x.workScheduleChoice = {
    mode: w.mode ?? 'companyDefault',
    scheduleId: w.scheduleId ?? null
  }
  x.password = src.password ?? ''
  x.passwordConfirm = src.passwordConfirm ?? ''
  return x
}

const stableStringify = (o) => JSON.stringify(o) // ya viene en orden fijo por clean()

const isEqualClean = (a, b) => stableStringify(clean(a)) === stableStringify(clean(b))

/* =========================
   Estado local
========================= */
const local = reactive(clean(props.modelValue))
const showPass = ref(false)
const roleOpts = [
  { label: 'Empleado', value: 'empleado' },
  { label: 'Admin',    value: 'admin' }
]

let syncing = false

// Padre -> Hijo (solo si cambió el payload limpio)
watch(
  () => props.modelValue,
  (v) => {
    const src = clean(v)
    if (!isEqualClean(src, local)) {
      syncing = true
      Object.assign(local, src)
      // microtask para evitar que el watcher de salida dispare en el mismo tick
      queueMicrotask(() => { syncing = false })
    }
  },
  { deep: true, immediate: true }
)

// Hijo -> Padre (solo si cambió el payload limpio)
watch(
  local,
  (v) => {
    if (syncing) return
    const out = clean(v)
    if (!isEqualClean(out, props.modelValue)) {
      emit('update:modelValue', structuredClone(out))
    }
  },
  { deep: true }
)

// Emitir tipo-change SOLO cuando cambia 'tipo'
watch(
  () => local.tipo,
  (nv, ov) => {
    if (syncing) return
    if (nv !== ov) emit('tipo-change', nv)
  }
)

/* =========================
   Reglas y utilidades
========================= */
const rutRule = (value) => {
  if (!value) return true
  try { return validarRUT(value) || 'RUT inválido' } catch { return true }
}
const matchPasswordRule = (v) => v === local.password || 'Las contraseñas no coinciden'

function formatRut () {
  if (!local.rut) return
  try { local.rut = formatearRUT(local.rut) } catch {}
}

function generatePassword () {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*_-'
  let out = ''
  for (let i = 0; i < 12; i++) out += chars.charAt(Math.floor(Math.random() * chars.length))
  local.password = out
  local.passwordConfirm = ''
}

/* =========================
   Empresa (obj opcional)
========================= */
const companyObj = computed(() => {
  const id = String(local.empresa || '')
  if (!id) return null
  const arr = props.empresasRaw || []
  return arr.find(e => String(e.id || e._id) === id) || null
})

/* =========================
   Child events
========================= */
function onCompanyCreated (company) {
  if (company?._id) local.empresa = company._id
}
function onPreviewSchedule (id) {
  if (id) emit('preview-schedule', id)
}
function onScheduleCreated () {
  // opcional: toast/notificación
}
</script>

<style scoped>
.rk-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
  background: #ffffff;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.body--dark .rk-form-grid {
  background: #15181f;
  border-color: #2a2f39;
}
.rk-roles {
  grid-column: 1 / -1;
  padding: 4px 0 8px;
}
</style>
