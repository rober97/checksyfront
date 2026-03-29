<template>
  <q-card flat bordered :class="cardTone" class="rk-side q-pa-md">
    <!-- === USUARIO ===================================================== -->
    <div v-if="mode === 'user'">
      <div class="rk-section-title q-mb-xs">Buscar usuario</div>
      <div class="rk-section-help q-mb-sm">
        Busca a la persona, revisa sus accesos y guarda solo cuando el resumen quede correcto.
      </div>
      <q-input
        ref="userSearchRef"
        v-model="userQueryLocal"
        dense outlined clearable
        placeholder="Nombre o correo"
        class="rk-field"
        @update:model-value="onUserQueryUpdate"
      >
        <template #append>
          <q-btn flat dense round icon="search" class="rk-iconbtn" @click="emitSearchUsers" />
        </template>
      </q-input>

      <div class="rk-list q-mt-sm">
        <q-list separator class="rk-scroll">
          <q-item
            v-for="u in userOptions" :key="u.value"
            clickable v-ripple :active="u.value === selectedUser"
            class="rk-item"
            @click="emitPickUser(u.value)"
          >
            <q-item-section avatar>
              <q-avatar size="28px" color="primary" text-color="white">{{ initials(u.label) }}</q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium ellipsis">{{ u.label }}</q-item-label>
              <q-item-label caption class="ellipsis">{{ u.meta }}</q-item-label>
            </q-item-section>
            <q-item-section side><q-icon name="chevron_right" /></q-item-section>
          </q-item>
        </q-list>

        <div v-if="!userOptions?.length && userQueryLocal" class="rk-empty-mini">
          <q-icon name="search_off" class="q-mr-xs" /> Sin resultados
        </div>
      </div>

      <q-separator class="q-my-md" />

      <!-- === APLICAR PERFIL ============================================ -->
      <div class="rk-section-title q-mb-xs">Aplicar perfil al usuario</div>
      <div class="rk-section-help q-mb-sm">
        Usa un perfil como punto de partida cuando quieras asignar permisos estándar sin partir desde cero.
      </div>

      <!-- Buscador de perfiles -->
      <q-input
        v-model="applyProfileQueryLocal"
        dense outlined clearable
        placeholder="Buscar perfil por nombre…"
        class="rk-field"
        @update:model-value="onApplyProfileQueryUpdate"
        @keydown.enter.prevent="tryPickFirstProfileToApply"
        @focus="openApplyMenu"
      >
        <template #append>
          <q-btn flat dense round icon="search" class="rk-iconbtn" @click="emitSearchApplyProfiles" />
        </template>

        <q-menu v-model="applyMenu" fit anchor="bottom left" self="top left" class="rk-menu">
          <q-list class="rk-suggest">
            <q-item
              v-for="opt in applyProfileMatches" :key="opt.value || opt.id"
              clickable v-ripple class="rk-suggest-item"
              @click="pickProfileToApply(opt)"
            >
              <q-item-section>
                <q-item-label class="text-weight-medium ellipsis">{{ opt.label || opt.name }}</q-item-label>
                <q-item-label caption>Perfil</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="north_east" /></q-item-section>
            </q-item>

            <div v-if="!applyProfileMatches.length && applyProfileQueryLocal" class="rk-empty-mini">
              <q-icon name="search_off" class="q-mr-xs" /> Sin resultados
            </div>
          </q-list>
        </q-menu>
      </q-input>

      <!-- Chip + botón a la derecha; leyenda debajo -->
      <div class="rk-apply-card q-mt-sm" v-if="profileToApplyLocal">
        <div class="rk-apply-row">
          <q-chip
            class="rk-chip rk-chip--selected rk-chip-grow"
            color="primary" text-color="white"
            removable
            @remove="clearProfileToApply"
          >
            <q-icon name="label" class="q-mr-xs" />
            <span class="ellipsis">{{ applyProfileLabel }}</span>
          </q-chip>

          <q-btn
            color="primary"
            label="Aplicar"
            icon="bolt"
            unelevated
            :disable="!selectedUser"
            class="rk-btn rk-btn--pill rk-btn--xs rk-btn-apply"
            @click="emitOpenApplyWizard"
          />
        </div>

        <div class="rk-apply-legend">
          Se aplicarán los permisos de este perfil al usuario seleccionado.
        </div>
      </div>

      <div class="rk-apply-emptyline q-mt-sm" v-else>
        <q-icon name="info" size="18px" class="q-mr-xs text-grey-5" />
        Escribe para buscar perfiles. Selecciona uno y luego confirma con <b>Aplicar</b>.
      </div>
    </div>

    <!-- === PERFILES (modo perfil) ====================================== -->
    <div v-else>
      <div class="row items-center justify-between q-mb-sm">
        <div class="rk-section-title">Perfiles</div>
        <q-btn icon="add" color="primary" label="Nuevo" class="rk-btn rk-btn--pill" @click="emitCreateProfile" />
      </div>
      <div class="rk-section-help q-mb-sm">
        Crea perfiles claros por función, reutilízalos en usuarios similares y evita configurar permiso por permiso cada vez.
      </div>

      <q-input
        v-model="profileQueryLocal"
        dense outlined clearable
        placeholder="Buscar perfil"
        class="rk-field"
        @update:model-value="v => emitUpdate('update:profileQuery', v)"
      >
        <template #append>
          <q-btn flat dense round icon="search" class="rk-iconbtn" @click="emitSearchProfiles" />
        </template>
      </q-input>

      <div class="rk-list q-mt-sm">
        <q-list separator class="rk-scroll">
          <q-item
            v-for="p in profiles" :key="p.id || p._id"
            clickable v-ripple :active="(p.id||p._id) === selectedProfileId"
            class="rk-item"
            @click="emitPickProfile(p.id || p._id)"
          >
            <q-item-section avatar><q-icon name="label" /></q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium ellipsis">{{ p.name }}</q-item-label>
              <q-item-label caption>Perfil</q-item-label>
            </q-item-section>
            <q-item-section side class="row items-center q-gutter-xs">
              <q-btn flat round dense icon="visibility" class="rk-iconbtn" @click.stop="emitPreviewProfile(p)">
                <q-tooltip>Comparar con este perfil</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="content_copy" class="rk-iconbtn" @click.stop="emitDuplicateProfile(p)" />
              <q-btn flat round dense icon="delete" color="negative" class="rk-iconbtn" @click.stop="emitRemoveProfile(p.id || p._id)" />
            </q-item-section>
          </q-item>
        </q-list>

        <div v-if="!profiles?.length && profileQueryLocal" class="rk-empty-mini">
          <q-icon name="search_off" class="q-mr-xs" /> Sin resultados
        </div>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- === RESALTAR ===================================================== -->
    <div>
      <div class="rk-section-title q-mb-xs">Resaltar</div>

      <q-select
        v-model="highlightSourceLocal"
        :options="highlightOptions"
        dense outlined emit-value map-options
        class="rk-field q-mb-xs"
        placeholder="Fuente de resaltado"
        @update:model-value="v => emitUpdate('update:highlightSource', v)"
      />

      <div class="row q-gutter-sm rk-toggles">
        <q-toggle v-model="showDiffsLocal"     label="Diferencias" dense @update:model-value="v => emitUpdate('update:showDiffs', v)" />
        <q-toggle v-model="showConflictsLocal" label="Conflictos"  dense @update:model-value="v => emitUpdate('update:showConflicts', v)" />
        <q-toggle v-model="showChangesLocal"   label="Cambios"     dense @update:model-value="v => emitUpdate('update:showChanges', v)" />
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { computed, ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  cardTone: { type: String, default: '' },
  mode: { type: String, default: 'user' },

  userQuery: { type: String, default: '' },
  userOptions: { type: Array, default: () => [] },
  selectedUser: { type: [String, Number, null], default: null },

  profileQuery: { type: String, default: '' },
  profiles: { type: Array, default: () => [] },
  selectedProfileId: { type: [String, Number, null], default: null },

  profileOptions: { type: Array, default: () => [] },
  profileToApply: { type: [String, Number, null], default: null },

  highlightSource: { type: [String, null], default: null },
  highlightOptions: { type: Array, default: () => [] },
  showDiffs: { type: Boolean, default: false },
  showConflicts: { type: Boolean, default: false },
  showChanges: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:userQuery', 'search-users', 'pick-user',
  'update:profileQuery', 'pick-profile', 'open-create-profile',
  'duplicate-profile', 'remove-profile', 'preview-profile',
  'update:profileToApply', 'open-apply-wizard', 'search-apply-profiles',
  'update:highlightSource', 'update:showDiffs', 'update:showConflicts', 'update:showChanges'
])

/* v-model locales */
const userQueryLocal = ref(props.userQuery)
watch(() => props.userQuery, v => { userQueryLocal.value = v })
watch(userQueryLocal, v => emit('update:userQuery', v))

const profileQueryLocal = ref(props.profileQuery)
watch(() => props.profileQuery, v => { profileQueryLocal.value = v })
watch(profileQueryLocal, v => emit('update:profileQuery', v))

const profileToApplyLocal = ref(props.profileToApply)
watch(() => props.profileToApply, v => {
  profileToApplyLocal.value = v
  const match = (props.profileOptions || []).find((option) => (option.value || option.id) === v)
  applyProfileLabel.value = match ? (match.label || match.name || '') : ''
})

const applyProfileQueryLocal = ref('')
const applyProfileLabel = ref('')
const applyMenu = ref(false)
const applyProfileMatches = computed(() => {
  const query = applyProfileQueryLocal.value.trim().toLowerCase()
  const options = props.profileOptions || []
  if (!query) return options.slice(0, 10)
  return options.filter((option) =>
    String(option?.label || option?.name || "")
      .toLowerCase()
      .includes(query)
  )
})

const highlightSourceLocal = ref(props.highlightSource)
watch(() => props.highlightSource, v => { highlightSourceLocal.value = v })

const showDiffsLocal = ref(props.showDiffs)
const showConflictsLocal = ref(props.showConflicts)
const showChangesLocal = ref(props.showChanges)
watch(() => props.showDiffs,     v => { showDiffsLocal.value = v })
watch(() => props.showConflicts, v => { showConflictsLocal.value = v })
watch(() => props.showChanges,   v => { showChangesLocal.value = v })

/* helpers + emits */
const userSearchRef = ref(null)
const emitUpdate = (evt, payload) => emit(evt, payload)

const emitSearchUsers = () => emit('search-users', userQueryLocal.value)
const emitPickUser = (id) => emit('pick-user', id)

const emitCreateProfile = () => emit('open-create-profile')
const emitSearchProfiles = () => emit('update:profileQuery', profileQueryLocal.value)
const emitPickProfile = (id) => emit('pick-profile', id)
const emitDuplicateProfile = (p) => emit('duplicate-profile', p)
const emitRemoveProfile = (id) => emit('remove-profile', id)
// vista previa opcional si la reactivas en el futuro
const emitPreviewProfile = (p) => emit('preview-profile', p)

const emitOpenApplyWizard = () => emit('open-apply-wizard')
const emitSearchApplyProfiles = () => emit('search-apply-profiles', applyProfileQueryLocal.value)

defineExpose({ focusSearch: () => userSearchRef.value?.focus?.() })

/* buscar perfil para aplicar */
let applyDebounce
const onApplyProfileQueryUpdate = (v) => {
  clearTimeout(applyDebounce)
  applyDebounce = setTimeout(() => {
    if (!profileToApplyLocal.value) applyMenu.value = true
    emitSearchApplyProfiles()
  }, 160)
}
const openApplyMenu = () => { if (!profileToApplyLocal.value) applyMenu.value = true }

const pickProfileToApply = (opt) => {
  profileToApplyLocal.value = opt.value || opt.id
  applyProfileLabel.value = opt.label || opt.name || ''
  applyProfileQueryLocal.value = ''
  applyMenu.value = false
  emit('update:profileToApply', profileToApplyLocal.value)
}
const clearProfileToApply = () => {
  profileToApplyLocal.value = null
  applyProfileLabel.value = ''
  applyProfileQueryLocal.value = ''
  applyMenu.value = false
  emit('update:profileToApply', null)
}
const tryPickFirstProfileToApply = () => {
  const first = applyProfileMatches.value[0]
  if (first) pickProfileToApply(first)
}

/* buscar usuario */
const onUserQueryUpdate = (v) => {
  emit('update:userQuery', v)
  emitSearchUsers()
}

const initials = (label = '') => {
  const p = (label || '').trim().split(/\s+/)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()
}
</script>

<style scoped>
/* ── Variables de tema ───────────────────────────────────────────── */
.rk-side {
  --s-bg:          #ffffff;
  --s-bg-soft:     rgba(6,182,212,.04);
  --s-border:      rgba(6,182,212,.14);
  --s-border-hover:rgba(6,182,212,.28);
  --s-title:       rgba(15,23,42,.88);
  --s-muted:       rgba(15,23,42,.52);
  --s-help:        rgba(15,23,42,.48);
  --s-item-hover:  rgba(6,182,212,.06);
  --s-item-active: rgba(6,182,212,.11);
  --s-item-ring:   rgba(6,182,212,.35);
  --s-icon:        #06b6d4;
  --s-input-r:     14px;
  --s-shadow:      0 8px 28px rgba(6,182,212,.08), 0 2px 8px rgba(0,0,0,.05);
}
.body--dark .rk-side {
  --s-bg:          rgba(10,16,28,.96);
  --s-bg-soft:     rgba(6,182,212,.06);
  --s-border:      rgba(6,182,212,.18);
  --s-border-hover:rgba(6,182,212,.35);
  --s-title:       rgba(255,255,255,.92);
  --s-muted:       rgba(255,255,255,.48);
  --s-help:        rgba(255,255,255,.42);
  --s-item-hover:  rgba(6,182,212,.08);
  --s-item-active: rgba(6,182,212,.16);
  --s-item-ring:   rgba(6,182,212,.4);
  --s-icon:        #22d3ee;
  --s-shadow:      0 8px 32px rgba(0,0,0,.35);
}

/* ── Card base ───────────────────────────────────────────────────── */
.rk-side {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 18px;
  border: 1px solid var(--s-border);
  background: var(--s-bg);
  box-shadow: var(--s-shadow);
  transition: border-color .2s;
}

/* ── Encabezados de sección ──────────────────────────────────────── */
.rk-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--s-icon);
}
.rk-section-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: currentColor;
  opacity: .7;
  flex-shrink: 0;
}
.rk-section-help {
  font-size: .86rem;
  line-height: 1.45;
  color: var(--s-help);
}

/* ── Campos de búsqueda ──────────────────────────────────────────── */
.rk-field :deep(.q-field__control) {
  height: 44px;
  min-height: 44px;
  border-radius: var(--s-input-r) !important;
  background: var(--s-bg-soft);
  border-color: var(--s-border) !important;
  transition: border-color .2s, box-shadow .2s;
}
.rk-field :deep(.q-field__control:hover) {
  border-color: var(--s-border-hover) !important;
}
.rk-field :deep(.q-field--focused .q-field__control) {
  border-color: var(--s-icon) !important;
  box-shadow: 0 0 0 3px rgba(6,182,212,.12);
}
.rk-field :deep(.q-field__native) { padding: 0 4px; line-height: 1; }
.rk-field :deep(.q-field__prepend), .rk-field :deep(.q-field__append) {
  color: var(--s-icon);
}

/* ── Botón ícono ─────────────────────────────────────────────────── */
.rk-iconbtn {
  color: var(--s-muted);
  border-radius: 10px;
  transition: background .15s, color .15s;
}
.rk-iconbtn:hover {
  background: var(--s-item-hover);
  color: var(--s-icon);
}

/* ── Lista de usuarios / perfiles ────────────────────────────────── */
.rk-list   { max-height: 52vh; }
.rk-scroll { overflow: auto; max-height: 52vh; scroll-behavior: smooth; padding: 2px 0; }
.rk-scroll::-webkit-scrollbar { width: 5px; }
.rk-scroll::-webkit-scrollbar-thumb { background: var(--s-border); border-radius: 4px; }

.rk-item {
  border-radius: 12px;
  padding: 10px 10px !important;
  margin: 3px 0;
  transition: background .15s, outline .15s;
  outline: 1px solid transparent;
}
.rk-item :deep(.q-item__label) { color: var(--s-title); }
.rk-item :deep(.q-item__label--caption) { color: var(--s-muted); }
.rk-item:hover { background: var(--s-item-hover); }
.rk-item.q-item--active {
  background: var(--s-item-active);
  outline: 1px solid var(--s-item-ring);
}
.rk-item .q-avatar { background: linear-gradient(135deg, #06b6d4, #14b8a6); }

/* ── Menú de sugerencias ─────────────────────────────────────────── */
.rk-menu { border-radius: 14px; overflow: hidden; border: 1px solid var(--s-border); }
.rk-suggest { min-width: 280px; max-height: 50vh; overflow: auto; }
.rk-suggest-item { padding: 8px 12px; transition: background .12s; }
.rk-suggest-item :deep(.q-item__label) { color: var(--s-title); }
.rk-suggest-item:hover { background: var(--s-item-hover); }

/* ── Card "Aplicar perfil" ───────────────────────────────────────── */
.rk-apply-card {
  border-radius: 14px;
  padding: 12px 14px;
  background: var(--s-bg-soft);
  border: 1px solid var(--s-border);
  transition: border-color .2s;
}
.rk-apply-card:hover { border-color: var(--s-border-hover); }
.rk-apply-row { display: flex; align-items: center; gap: 10px; }
.rk-chip-grow { flex: 1 1 auto; min-width: 0; }
.ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.rk-apply-legend { margin-top: 8px; font-size: .85rem; line-height: 1.4; color: var(--s-help); }

.rk-apply-emptyline {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: .85rem;
  color: var(--s-muted);
  line-height: 1.4;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--s-bg-soft);
  border: 1px dashed var(--s-border);
}

/* Chip seleccionado */
.rk-chip--selected {
  border-radius: 999px;
  padding: 6px 10px;
  box-shadow: 0 3px 10px rgba(6,182,212,.2);
}

/* Botón Aplicar */
.rk-btn { border-radius: 999px; }
.rk-btn--pill { border-radius: 999px !important; }
.rk-btn--xs {
  height: 36px !important;
  min-height: 36px !important;
  padding: 0 16px !important;
  font-weight: 700;
  letter-spacing: .2px;
  white-space: nowrap;
}
.rk-btn-apply { flex: 0 0 auto; min-width: 108px; }

/* ── Toggles de highlight ────────────────────────────────────────── */
.rk-toggles { flex-wrap: wrap; }
.rk-toggles :deep(.q-toggle) { height: 34px; display: inline-flex; align-items: center; }
.rk-toggles :deep(.q-toggle__label) { font-size: .88rem; color: var(--s-title); }
.rk-toggles :deep(.q-toggle__thumb) { box-shadow: 0 2px 6px rgba(0,0,0,.2); }

/* ── Estado vacío ────────────────────────────────────────────────── */
.rk-empty-mini {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--s-bg-soft);
  border: 1px dashed var(--s-border);
  color: var(--s-muted);
  font-size: .88rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Separador ───────────────────────────────────────────────────── */
:deep(.q-separator) { background: var(--s-border); }

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 520px) {
  .rk-apply-row { flex-wrap: wrap; }
  .rk-btn-apply { width: 100%; }
}
@media (min-height: 900px) {
  .rk-list, .rk-scroll { max-height: 66vh; }
}
</style>
