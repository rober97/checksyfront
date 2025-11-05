<template>
  <q-card flat bordered :class="cardTone" class="rk-side q-pa-md">
    <!-- === USUARIO ===================================================== -->
    <div v-if="mode === 'user'">
      <div class="rk-section-title q-mb-xs">Buscar usuario</div>
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
              v-for="opt in profileOptions" :key="opt.value || opt.id"
              clickable v-ripple class="rk-suggest-item"
              @click="pickProfileToApply(opt)"
            >
              <q-item-section>
                <q-item-label class="text-weight-medium ellipsis">{{ opt.label || opt.name }}</q-item-label>
                <q-item-label caption>Perfil</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="north_east" /></q-item-section>
            </q-item>

            <div v-if="!profileOptions?.length && applyProfileQueryLocal" class="rk-empty-mini">
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
import { ref, watch, defineProps, defineEmits } from 'vue'

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
watch(() => props.profileToApply, v => { profileToApplyLocal.value = v })

const applyProfileQueryLocal = ref('')
const applyProfileLabel = ref('')
const applyMenu = ref(false)

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
  const first = (props.profileOptions || [])[0]
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
/* ===== Card ===== */
.rk-side{
  flex:1 1 auto; min-height:0;
  border-radius:18px;
  border:1px solid rgba(127,127,127,.12);
  background: linear-gradient(180deg,#2b2e33,#262a2f);
  box-shadow:0 8px 24px rgba(0,0,0,.22);
}

/* Títulos */
.rk-section-title{ color:#e9eaf0; font-weight:700; letter-spacing:.2px }

/* Campos */
.rk-field :deep(.q-field),
.rk-field :deep(.q-field__control){
  --h: 44px; height:var(--h); min-height:var(--h);
  border-radius:14px !important;
}
.rk-field :deep(.q-field__native){ padding:0 12px !important; line-height:1 !important }
.rk-iconbtn{ opacity:.9 }
.rk-iconbtn:hover{ background:rgba(255,255,255,.06) }

/* Lista */
.rk-list{ max-height:58vh }
.rk-scroll{ overflow:auto; max-height:58vh; scroll-behavior:smooth }
.rk-item{ border-radius:12px; padding:10px 10px !important; margin:4px 0 }
.rk-item:hover{ background:rgba(255,255,255,.05) }
.rk-item.q-item--active{ background:rgba(59,130,246,.12); outline:1px solid rgba(59,130,246,.35) }

/* Sugerencias */
.rk-menu{ border-radius:14px; overflow:hidden }
.rk-suggest{ min-width:280px; max-height:50vh; overflow:auto }
.rk-suggest-item{ padding:8px 10px }
.rk-suggest-item:hover{ background:rgba(255,255,255,.06) }

/* === Aplicar perfil: chip + botón + leyenda ========================= */
.rk-apply-card{
  border-radius:14px; padding:12px;
  background:rgba(255,255,255,.035);
  border:1px solid rgba(255,255,255,.08);
}
.rk-apply-row{
  display:flex; align-items:center; gap:12px;
}
.rk-chip-grow{ flex:1 1 auto; min-width:0 }        /* el chip ocupa el resto y trunca */
.ellipsis{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis }

.rk-apply-legend{
  margin-top:8px; color:#aeb5c0; font-size:.92rem; line-height:1.25;
}

/* Chip y botón */
.rk-chip--selected{
  border-radius:999px; padding:6px 10px;
  box-shadow:0 3px 10px rgba(37,99,235,.2);
}
.rk-btn--pill{ border-radius:999px !important; }
.rk-btn--xs{ height:36px !important; min-height:36px !important; padding:0 16px !important; font-weight:700; letter-spacing:.2px; white-space:nowrap }
.rk-btn-apply{ flex:0 0 auto; min-width:112px }     /* nunca colapsa ni pone puntos */

/* Toggles */
.rk-toggles :deep(.q-toggle){ height:32px; display:inline-flex; align-items:center }
.rk-toggles :deep(.q-toggle__inner){ transform:scale(.94) }
.rk-toggles :deep(.q-toggle__thumb){ box-shadow:0 2px 6px rgba(0,0,0,.35) }

/* Vacío */
.rk-empty-mini{ padding:8px 10px; opacity:.85; border-radius:10px; background:rgba(255,255,255,.04) }

/* Responsive: si no cabe, el botón baja abajo del chip de forma limpia */
@media (max-width: 520px){
  .rk-apply-row{ flex-wrap:wrap }
  .rk-btn-apply{ width:100%; }
}
@media (min-height:900px){
  .rk-list, .rk-scroll{ max-height:70vh }
}
</style>
