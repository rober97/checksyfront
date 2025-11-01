<template>
  <q-drawer v-model="model" side="right" overlay bordered :width="420" class="rk-perm-prof">
    <div class="q-pa-md">
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle1 text-weight-medium">Perfiles de permisos</div>
        <q-btn dense round flat icon="close" @click="model = false"/>
      </div>

      <q-input v-model="name" dense outlined label="Nombre del perfil" class="q-mb-sm"/>

      <div class="row q-gutter-sm q-mb-md">
        <q-btn color="primary" icon="save" label="Guardar perfil" :disable="!name" @click="saveProfile"/>
        <q-btn flat color="negative" icon="delete" label="Eliminar" :disable="!selectedId" @click="removeProfile"/>
      </div>

      <q-separator class="q-my-sm"/>

      <q-list bordered separator class="rounded-borders">
        <q-item v-for="p in profiles" :key="p.id" clickable @click="select(p)">
          <q-item-section>
            <q-item-label>{{ p.name }}</q-item-label>
            <q-item-label caption>{{ Object.keys(p.map || {}).length }} reglas</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_left"/>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ modelValue: { type: Boolean, default: false }, profiles: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue','create','update','delete'])

const model = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
const name = ref('')
const selectedId = ref(null)

function select(p){ selectedId.value = p.id; name.value = p.name }
function saveProfile(){
  if (!selectedId.value) emit('create', { id: '', name: name.value, map: {} })
  else emit('update', { id: selectedId.value, name: name.value, map: {} })
  name.value = ''; selectedId.value = null
}
function removeProfile(){ if (selectedId.value) emit('delete', selectedId.value); name.value=''; selectedId.value=null }
</script>

<style scoped>
.rk-perm-prof { backdrop-filter: blur(2px); }
</style>