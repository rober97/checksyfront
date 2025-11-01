
<template>
  <q-card flat bordered :class="cardTone" class="rk-side q-pa-sm">
    
    <div v-if="mode === 'user'">
      <div class="text-caption text-weight-medium q-mb-xs">Buscar usuario</div>
      <q-input
        ref="userSearchRef"
        v-model="userQueryLocal"
        dense outlined clearable
        placeholder="Nombre o correo"
        @update:model-value="onUserQueryUpdate"   
      >
        <template #append>
          <q-btn flat dense round icon="search" @click="emitSearchUsers" />
        </template>
      </q-input>

      <div class="rk-list q-mt-sm">
        <q-list separator class="rk-scroll">
          <q-item
            v-for="u in userOptions" :key="u.value"
            clickable v-ripple :active="u.value === selectedUser"
            @click="emitPickUser(u.value)"
          >
            <q-item-section avatar>
              <q-avatar size="28px" color="primary" text-color="white">{{ initials(u.label) }}</q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ u.label }}</q-item-label>
              <q-item-label caption>{{ u.meta }}</q-item-label>
            </q-item-section>
            <q-item-section side><q-icon name="chevron_right" /></q-item-section>
          </q-item>
        </q-list>

        <div v-if="!userOptions?.length && userQueryLocal" class="rk-empty-mini">
          <q-icon name="search_off" class="q-mr-xs" /> Sin resultados
        </div>
      </div>

      <q-separator class="q-my-sm" />

      
      <div>
        <div class="text-caption text-weight-medium q-mb-xs">Aplicar perfil al usuario</div>
        <div class="row items-center q-gutter-sm">
          <q-select
            v-model="profileToApplyLocal"
            :options="profileOptions"
            dense outlined emit-value map-options
            placeholder="Seleccione un perfil"
            @update:model-value="v => emitUpdate('update:profileToApply', v)"
          />
          <q-btn
            dense color="primary"
            :disable="!selectedUser || !profileToApplyLocal"
            label="Aplicar perfil…"
            @click="emitOpenApplyWizard"
          />
        </div>
        <div class="text-caption q-mt-xs text-grey">
          Use el asistente para elegir estrategia de fusión y previsualizar.
        </div>
      </div>
    </div>

    
    <div v-else>
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-caption text-weight-medium">Perfiles</div>
        <q-btn dense icon="add" color="primary" label="Nuevo" @click="emitCreateProfile" />
      </div>

      <q-input
        v-model="profileQueryLocal"
        dense outlined clearable
        placeholder="Buscar perfil"
        @update:model-value="v => emitUpdate('update:profileQuery', v)"
      />

      <div class="rk-list q-mt-sm">
        <q-list separator class="rk-scroll">
          <q-item
            v-for="p in profiles" :key="p.id || p._id"
            clickable v-ripple :active="(p.id||p._id) === selectedProfileId"
            @click="emitPickProfile(p.id || p._id)"
          >
            <q-item-section avatar><q-icon name="label" /></q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ p.name }}</q-item-label>
              <q-item-label caption>Perfil</q-item-label>
            </q-item-section>
            <q-item-section side class="row items-center q-gutter-xs">
              <q-btn flat round dense icon="content_copy" @click.stop="emitDuplicateProfile(p)" />
              <q-btn flat round dense icon="delete" color="negative" @click.stop="emitRemoveProfile(p.id || p._id)" />
            </q-item-section>
          </q-item>
        </q-list>

        <div v-if="!profiles?.length && profileQueryLocal" class="rk-empty-mini">
          <q-icon name="search_off" class="q-mr-xs" /> Sin resultados
        </div>
      </div>
    </div>

    <q-separator class="q-my-sm" />

    
    <div>
      <div class="text-caption text-weight-medium q-mb-xs">Resaltar</div>
      <q-select
        v-model="highlightSourceLocal"
        :options="highlightOptions"
        dense outlined emit-value map-options
        class="q-mb-xs"
        @update:model-value="v => emitUpdate('update:highlightSource', v)"
      />
      <div class="row q-gutter-xs">
        <q-toggle v-model="showDiffsLocal"     label="Diferencias" dense @update:model-value="v => emitUpdate('update:showDiffs', v)" />
        <q-toggle v-model="showConflictsLocal" label="Conflictos"  dense @update:model-value="v => emitUpdate('update:showConflicts', v)" />
        <q-toggle v-model="showChangesLocal"   label="Cambios"     dense @update:model-value="v => emitUpdate('update:showChanges', v)" />
      </div>
      <div
        v-if="highlightSourceLocal === 'profile' && !profileToApplyLocal && mode === 'user'"
        class="text-caption text-italic q-mt-xs"
      >
        Seleccione un perfil para comparar.
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  cardTone: { type: String, default: '' },
  mode: { type: String, default: 'user' },

  // Users
  userQuery: { type: String, default: '' },
  userOptions: { type: Array, default: () => [] },
  selectedUser: { type: [String, Number, null], default: null },

  // Profiles
  profileQuery: { type: String, default: '' },
  profiles: { type: Array, default: () => [] },
  selectedProfileId: { type: [String, Number, null], default: null },

  profileOptions: { type: Array, default: () => [] },
  profileToApply: { type: [String, Number, null], default: null },

  // Highlight
  highlightSource: { type: [String, null], default: null },
  highlightOptions: { type: Array, default: () => [] },
  showDiffs: { type: Boolean, default: false },
  showConflicts: { type: Boolean, default: false },
  showChanges: { type: Boolean, default: false }
})

const emit = defineEmits([
  // users
  'update:userQuery', 'search-users', 'pick-user',
  // profiles
  'update:profileQuery', 'pick-profile', 'open-create-profile',
  'duplicate-profile', 'remove-profile', 'preview-profile',
  // apply profile
  'update:profileToApply', 'open-apply-wizard',
  // highlight
  'update:highlightSource', 'update:showDiffs', 'update:showConflicts', 'update:showChanges'
])

/* === v-model locales */
const userQueryLocal = ref(props.userQuery)
watch(() => props.userQuery, v => { userQueryLocal.value = v })
watch(userQueryLocal, v => emit('update:userQuery', v))

const profileQueryLocal = ref(props.profileQuery)
watch(() => props.profileQuery, v => { profileQueryLocal.value = v })
watch(profileQueryLocal, v => emit('update:profileQuery', v))

const profileToApplyLocal = ref(props.profileToApply)
watch(() => props.profileToApply, v => { profileToApplyLocal.value = v })

const highlightSourceLocal = ref(props.highlightSource)
watch(() => props.highlightSource, v => { highlightSourceLocal.value = v })

const showDiffsLocal = ref(props.showDiffs)
const showConflictsLocal = ref(props.showConflicts)
const showChangesLocal = ref(props.showChanges)
watch(() => props.showDiffs,     v => { showDiffsLocal.value = v })
watch(() => props.showConflicts, v => { showConflictsLocal.value = v })
watch(() => props.showChanges,   v => { showChangesLocal.value = v })

/* === helpers & emits */
const userSearchRef = ref(null)

const emitUpdate = (evt, payload) => emit(evt, payload)

const emitSearchUsers = () => emit('search-users', userQueryLocal.value)
const emitPickUser = (id) => emit('pick-user', id)

const emitCreateProfile = () => emit('open-create-profile')
const emitPickProfile = (id) => emit('pick-profile', id)
const emitDuplicateProfile = (p) => emit('duplicate-profile', p)
const emitRemoveProfile = (id) => emit('remove-profile', id)
const emitPreviewProfile = (p) => emit('preview-profile', p)

const emitOpenApplyWizard = () => emit('open-apply-wizard')

// expose focus method for parent
defineExpose({
  focusSearch: () => userSearchRef.value?.focus?.()
})

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
.rk-side{
  flex:1 1 auto; min-height:0; border-radius:18px; border:1px solid rgba(127,127,127,.12);
  box-shadow:0 10px 24px rgba(0,0,0,.06);
  transition:box-shadow .2s ease, transform .1s ease
}
.rk-side:hover{ box-shadow:0 14px 34px rgba(0,0,0,.08) }
.rk-list{ max-height:58vh }
.rk-scroll{ overflow:auto; max-height:58vh; scroll-behavior:smooth }
@media (min-height:900px){
  .rk-list, .rk-scroll{ max-height:70vh }
}
.rk-empty-mini{ padding:6px 8px; opacity:.8 }
</style>