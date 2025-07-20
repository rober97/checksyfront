<template>
  <q-btn flat dense class="empresa-menu-btn">
    <div class="empresa-selector">
      <q-icon name="business" size="20px" class="q-mr-xs" />
      <span>{{ getSiglas(empresaSeleccionada?.nombre) }}</span>
    </div>

    <q-menu anchor="bottom right" self="top right">
      <q-list style="min-width: 180px">
        <q-item-label header>Empresas</q-item-label>

        <q-item
          v-for="empresa in empresas"
          :key="empresa.id"
          clickable
          v-ripple
          v-close-popup
          @click="seleccionarEmpresa(empresa)"
        >
          <q-item-section avatar>
            <q-icon name="business" />
          </q-item-section>
          <q-item-section>{{ empresa.nombre }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const empresas = ref([
  { id: 1, nombre: 'Empresa Uno' },
  { id: 2, nombre: 'Empresa Dos' },
  { id: 3, nombre: 'Empresa Tres' }
])
const empresaSeleccionada = ref("")

function getSiglas(nombre) {
  return (
    nombre
      ?.split(' ')
      .map(p => p[0]?.toUpperCase())
      .join('') || ''
  )
}

function seleccionarEmpresa(empresa) {
  empresaSeleccionada.value = empresa
  localStorage.setItem('empresaSeleccionada', JSON.stringify(empresa))
}

onMounted(() => {
  const savedEmpresa = localStorage.getItem('empresaSeleccionada')
  empresaSeleccionada.value = savedEmpresa
    ? JSON.parse(savedEmpresa)
    : empresas.value[0]
})
</script>

<style scoped>
.empresa-menu-btn {
  margin-right: 8px;
}

.empresa-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  color: white;
  font-weight: bold;
  text-transform: uppercase;
}
</style>
