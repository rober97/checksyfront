
<template>
  <q-dialog v-model="modelLocal" persistent>
    <q-card class="rk-wizard">
      <q-card-section class="text-subtitle1 text-weight-medium">
        Aplicar perfil al usuario
      </q-card-section>

      <q-separator />

      <q-card-section>
        
        <div class="q-mb-md">
          <div class="text-caption text-weight-medium q-mb-xs">Perfil</div>
          <q-select
            v-model="profileId"
            :options="profileOptions"
            dense outlined emit-value map-options
            placeholder="Seleccione un perfil"
          />
        </div>

        
        <div class="q-mb-md">
          <div class="text-caption text-weight-medium q-mb-xs">Estrategia de fusión</div>
          <q-option-group
            v-model="policy"
            :options="applyPolicies"
            type="radio"
            color="primary"
          />
          <div class="rk-policy-hint q-mt-xs">
            <div v-if="policy === 'replace'">Reemplaza completamente los permisos del usuario por los del perfil.</div>
            <div v-else-if="policy === 'fill'">Completa únicamente los permisos que el usuario tiene en “heredar”.</div>
            <div v-else-if="policy === 'userWins'">En conflicto, se mantiene la decisión del usuario.</div>
            <div v-else-if="policy === 'profileWins'">En conflicto, se prioriza la decisión del perfil.</div>
            <div v-else-if="policy === 'categoryManual'">Seleccione por categoría “Tomar del Usuario” o “Tomar del Perfil”.</div>
          </div>
        </div>

        
        <div v-if="policy === 'categoryManual'" class="q-mb-md">
          <div class="text-caption text-weight-medium q-mb-xs">Selección por categoría</div>
          <div class="rk-cat-manual q-pa-sm">
            <div
              v-for="cat in (catalog.categories || [])"
              :key="cat"
              class="row items-center justify-between rk-cat-manual-row"
            >
              <div class="text-body2">{{ cat }}</div>
              <q-btn-toggle
                v-model="categorySource[cat]"
                :options="[{label:'Usuario', value:'user'}, {label:'Perfil', value:'profile'}]"
                dense toggle-color="primary"
              />
            </div>
          </div>
        </div>

        
        <div class="q-mt-md">
          <q-separator class="q-mb-sm" />
          <div class="text-caption text-weight-medium q-mb-xs">Previsualización del resultado</div>
          <div class="row q-gutter-sm q-mb-sm">
            <q-chip outline>{{ preview.totalChanged }} cambios</q-chip>
            <q-chip outline color="primary">{{ preview.fromProfile }} desde perfil</q-chip>
            <q-chip outline color="grey-7">{{ preview.keptUser }} conservados del usuario</q-chip>
            <q-chip outline color="negative">{{ preview.conflicts }} conflictos resueltos</q-chip>
          </div>
          <div class="text-caption text-grey">
            Esta previsualización no guarda cambios. Confirme para aplicar al editor.
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" v-close-popup @click="cancel" />
        <q-btn
          color="primary"
          :disable="!profileId || !policy"
          label="Aplicar al editor"
          @click="confirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

/**
 * Single-source-of-truth merge dialog:
 * - Recibe el mapa de permisos del usuario (workingPerms) por props (solo lectura aquí)
 * - Permite seleccionar un perfil y una política
 * - Calcula una vista previa y emite "applied" con { merged, summary, profileId, policy }
 * - No replica lógica en el padre: el merge solo existe aquí
 */

const props = defineProps({
  modelValue: { type: Boolean, default: false },

  profiles: { type: Array, default: () => [] },
  catalog:  { type: Object, default: () => ({ categories: [], items: [] }) },
  workingPerms: { type: Object, default: () => ({}) },

  defaultProfileId: { type: [String, Number, null], default: null },
  initialPolicy: { type: String, default: 'fill' }
})

const emit = defineEmits(['update:modelValue', 'applied'])

/* ===== Model ===== */
const modelLocal = ref(props.modelValue)
watch(() => props.modelValue, v => { modelLocal.value = v })
watch(modelLocal, v => emit('update:modelValue', v))

/* ===== Selección ===== */
const profileOptions = computed(() => props.profiles.map(p => ({ label: p.name, value: p.id || p._id })))
const profileId = ref(props.defaultProfileId)
const policy = ref(props.initialPolicy)
const applyPolicies = [
  { label: 'Reemplazar todo', value: 'replace' },
  { label: 'Completar vacíos (heredar)', value: 'fill' },
  { label: 'Usuario manda (en conflicto)', value: 'userWins' },
  { label: 'Perfil manda (en conflicto)',  value: 'profileWins' },
  { label: 'Manual por categoría', value: 'categoryManual' }
]

/* ===== Category manual mapping ===== */
const categorySource = ref({}) // { [category]: 'user'|'profile' }
const buildDefaultCategorySource = () => {
  const obj = {}
  for (const c of (props.catalog.categories || [])) obj[c] = 'user'
  categorySource.value = obj
}

/* ===== Helpers ===== */
const valOf = (map, k) => (map && Object.prototype.hasOwnProperty.call(map, k) ? map[k] : 'inherit')
const opposite = (x, y) => (x === 'allow' && y === 'deny') || (x === 'deny' && y === 'allow')
const getProfileMap = (pid) => {
  const p = props.profiles.find(x => (x.id || x._id) === pid)
  return { ...(p?.map || {}) }
}

/* ===== Merge & preview (the only place where it exists) ===== */
const computeMerged = (userMap, profileMap, plc, byCatMap = {}) => {
  const allKeys = new Set([...Object.keys(userMap || {}), ...Object.keys(profileMap || {})])
  const merged = {}
  let fromProfile = 0, keptUser = 0, totalChanged = 0, conflicts = 0

  // Build helper sets for categoryManual
  const byCat = { user: new Set(), profile: new Set() }
  for (const it of (props.catalog.items || [])) {
    const cat = it.category
    const src = byCatMap[cat] || 'user'
    byCat[src].add(it.key)
  }

  for (const k of allKeys) {
    const u = valOf(userMap, k)
    const p = valOf(profileMap, k)
    let out = u

    if (plc === 'replace') {
      out = p
      if (out !== u) totalChanged++
      if (out !== 'inherit' && out === p) fromProfile++
    }
    else if (plc === 'fill') {
      out = (u === 'inherit' || typeof u === 'undefined') ? p : u
      if (out !== u) totalChanged++
      if (out === p && out !== 'inherit' && (u === 'inherit' || typeof u === 'undefined')) fromProfile++
      else keptUser++
    }
    else if (plc === 'userWins') {
      if (opposite(u, p)) { conflicts++; out = u }
      else out = (u !== 'inherit') ? u : p
      if (out !== u) totalChanged++
      if (out === u) keptUser++; else fromProfile++
    }
    else if (plc === 'profileWins') {
      if (opposite(u, p)) { conflicts++; out = p }
      else out = (p !== 'inherit') ? p : u
      if (out !== u) totalChanged++
      if (out === p) fromProfile++; else keptUser++
    }
    else if (plc === 'categoryManual') {
      const takeFrom = byCat.profile.has(k) ? 'profile' : (byCat.user.has(k) ? 'user' : 'user')
      out = (takeFrom === 'profile') ? p : u
      if (out !== u) totalChanged++
      if (takeFrom === 'profile') fromProfile++; else keptUser++
      if (opposite(u, p)) conflicts++
    }

    merged[k] = out
  }

  return { merged, summary: { totalChanged, fromProfile, keptUser, conflicts } }
}

/* ===== Preview reactive ===== */
const preview = ref({ totalChanged: 0, fromProfile: 0, keptUser: 0, conflicts: 0 })

const rebuildPreview = () => {
  if (!profileId.value) {
    preview.value = { totalChanged: 0, fromProfile: 0, keptUser: 0, conflicts: 0 }
    return
  }
  const pMap = getProfileMap(profileId.value)
  const uMap = props.workingPerms || {}
  const { summary } = computeMerged(uMap, pMap, policy.value, categorySource.value || {})
  preview.value = summary
}

watch([profileId, policy, categorySource], rebuildPreview, { deep: true })

/* ===== Lifecycle-ish: init defaults when dialog opens ===== */
watch(modelLocal, (open) => {
  if (open) {
    // init defaults when opened
    if (!profileId.value && props.defaultProfileId) profileId.value = props.defaultProfileId
    if (!policy.value) policy.value = props.initialPolicy || 'fill'
    buildDefaultCategorySource()
    rebuildPreview()
  }
}, { immediate: true })

/* ===== Actions ===== */
const confirm = () => {
  if (!profileId.value) return
  const pMap = getProfileMap(profileId.value)
  const uMap = props.workingPerms || {}
  const { merged, summary } = computeMerged(uMap, pMap, policy.value, categorySource.value || {})
  emit('applied', { merged, summary, profileId: profileId.value, policy: policy.value })
  modelLocal.value = false
}

const cancel = () => {
  modelLocal.value = false
}
</script>

<style scoped>
.rk-wizard{
  width:min(720px,92vw);
  border-radius:16px;
  border:1px solid rgba(127,127,127,.16)
}
.rk-cat-manual{ border:1px dashed rgba(127,127,127,.25); border-radius:12px; background:rgba(127,127,127,.04) }
.rk-cat-manual-row{ padding:6px 8px }
.rk-policy-hint{ opacity:.9 }
</style>