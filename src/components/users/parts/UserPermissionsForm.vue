<template>
  <div class="rk-perms">
    <!-- Barra de acciones -->
    <div class="row items-center q-gutter-sm q-mb-sm">
      <q-input
        v-model="search"
        dense outlined clearable
        class="col-12 col-sm"
        placeholder="Buscar permisos…"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <q-btn dense flat icon="select_all" @click="selectAllFiltered">
        <q-tooltip>Seleccionar visibles</q-tooltip>
      </q-btn>
      <q-btn dense flat icon="backspace" @click="clearAll">
        <q-tooltip>Limpiar todo</q-tooltip>
      </q-btn>

      <q-separator vertical class="q-ml-xs q-mr-xs" />

      <q-btn
        v-if="rolePreset && role"
        dense outline color="primary" icon="bolt"
        :label="`Preset ${roleNice}`"
        @click="applyRolePreset"
      />

      <q-badge class="q-ml-auto" color="primary" outline>
        {{ selectedCount }} / {{ totalCount }}
      </q-badge>
    </div>

    <!-- Grupos -->
    <div class="rk-grid">
      <q-card v-for="g in visibleGroups" :key="g.key" flat bordered class="rk-card">
        <q-card-section class="rk-card-sec">
          <div class="row items-center justify-between q-mb-xs">
            <div class="row items-center">
              <q-icon :name="g.icon" size="18px" class="q-mr-xs" />
              <div class="text-body2 text-weight-medium">{{ g.label }}</div>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-btn dense flat icon="checklist_rtl" @click="selectGroup(g)">
                <q-tooltip>Seleccionar grupo</q-tooltip>
              </q-btn>
              <q-btn dense flat icon="do_not_disturb_on" @click="clearGroup(g)">
                <q-tooltip>Quitar grupo</q-tooltip>
              </q-btn>
            </div>
          </div>

          <div class="rk-items">
            <q-toggle
              v-for="opt in g.filtered"
              :key="opt.value"
              v-model="internal"
              :val="opt.value"
              :label="opt.label"
              dense left-label
            >
              <q-tooltip v-if="opt.help">{{ opt.help }}</q-tooltip>
            </q-toggle>

            <div v-if="!g.filtered.length" class="text-caption text-grey-6 q-mt-xs">
              No hay resultados en este grupo.
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Resumen seleccionado -->
    <div class="rk-chips q-mt-sm" v-if="internal.length">
      <q-chip
        v-for="p in internal"
        :key="p"
        dense clickable removable
        @remove="removePermission(p)"
        class="rk-chip"
      >
        {{ short(p) }}
      </q-chip>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

/* Props / Emits */
const props = defineProps({
  modelValue: { type: Array, required: true },
  role: { type: String, default: '' } // 'admin' | 'empresa' | 'empleado' | 'supervisor'
})
const emit = defineEmits(['update:modelValue'])

/* ---------- Catálogo agrupado ---------- */
const CATALOG = [
  {
    key: 'attendance', label: 'Asistencias', icon: 'fingerprint',
    items: [
      { label: 'Ver asistencias', value: 'attendance:view', help: 'Ver historial y estado.' },
      { label: 'Marcar asistencia', value: 'attendance:mark', help: 'Registrar entrada/salida.' },
    ]
  },
  {
    key: 'requests', label: 'Solicitudes', icon: 'assignment_turned_in',
    items: [
      { label: 'Aprobar solicitudes', value: 'requests:approve', help: 'Aprobar/rechazar permisos, vacaciones…' },
    ]
  },
  {
    key: 'payroll', label: 'Liquidaciones', icon: 'paid',
    items: [
      { label: 'Ver liquidaciones', value: 'payroll:view' },
      { label: 'Generar liquidaciones', value: 'payroll:generate' },
    ]
  },
  {
    key: 'users', label: 'Usuarios', icon: 'group',
    items: [
      { label: 'Gestión usuarios', value: 'users:manage' },
    ]
  },
]

/* ---------- Estado local (a prueba de bucles) ---------- */
const internal = ref([ ...props.modelValue ])  // array local, no Set (evita recrear refs)
const search = ref('')

/* Igualdad profunda simple para arrays de strings */
function same(a, b) {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/* Sincroniza: padre -> hijo (solo si hay cambios reales) */
watch(() => props.modelValue, (v) => {
  const arr = Array.isArray(v) ? v : []
  if (!same(arr, internal.value)) internal.value = [ ...arr ]
})

/* Emite: hijo -> padre (solo si hay cambios reales) */
watch(internal, (v) => {
  if (!same(v, props.modelValue)) emit('update:modelValue', [ ...v ])
}, { deep: true })

/* ---------- Derivados ---------- */
const allItemsFlat = computed(() => CATALOG.flatMap(g => g.items))
const totalCount = computed(() => allItemsFlat.value.length)
const selectedCount = computed(() => internal.value.length)

const query = computed(() => (search.value || '').trim().toLowerCase())
const visibleGroups = computed(() => {
  const q = query.value
  return CATALOG.map(g => {
    const filtered = !q
      ? g.items
      : g.items.filter(it =>
          it.label.toLowerCase().includes(q) || it.value.toLowerCase().includes(q)
        )
    return { ...g, filtered }
  })
})

/* ---------- Acciones ---------- */
function selectAllFiltered() {
  const list = visibleGroups.value.flatMap(g => g.filtered.map(i => i.value))
  const set = new Set(internal.value)
  list.forEach(v => set.add(v))
  internal.value = Array.from(set)
}
function clearAll() { if (internal.value.length) internal.value = [] }
function selectGroup(g) {
  const set = new Set(internal.value)
  g.filtered.forEach(i => set.add(i.value))
  internal.value = Array.from(set)
}
function clearGroup(g) {
  if (!g.filtered.length) return
  const set = new Set(internal.value)
  g.filtered.forEach(i => set.delete(i.value))
  internal.value = Array.from(set)
}
function removePermission(p) {
  const set = new Set(internal.value)
  set.delete(p)
  internal.value = Array.from(set)
}
function short(p) { return p.split(':').pop() }

/* ---------- Presets por rol (opcional) ---------- */
const PRESETS = {
  admin: allItemsFlat.value.map(i => i.value),
  empresa: ['attendance:view','requests:approve','payroll:view','payroll:generate','users:manage'],
  empleado: ['attendance:mark','attendance:view','payroll:view'],
  supervisor: ['attendance:view','attendance:mark','requests:approve','payroll:view'],
}
const role = computed(() => props.role || '')
const rolePreset = computed(() => PRESETS[role.value] || null)
const roleNice = computed(() => ({ admin:'Admin', empresa:'Empresa', empleado:'Empleado', supervisor:'Supervisor' }[role.value] || 'Rol'))
function applyRolePreset() {
  const preset = rolePreset.value || []
  if (!same(preset, internal.value)) internal.value = [ ...preset ]
}
</script>

<style scoped>
/* Grid responsivo */
.rk-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
@media (min-width: 900px){ .rk-grid{ grid-template-columns: 1fr 1fr; } }

/* Cards compactas */
.rk-card { border-radius: 12px; }
.rk-card-sec { padding: 10px 12px; }

/* Lista de toggles */
.rk-items :deep(.q-toggle){ margin: 4px 0; }

/* Chips resumen */
.rk-chips{ max-height: 96px; overflow: auto; }
.rk-chip{ margin-right: 4px; margin-bottom: 4px; }

/* Densidad */
:deep(.q-field--dense) .q-field__control { min-height: 34px; }
</style>
