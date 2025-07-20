<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card :class="dialogClass" style="min-width: 400px; max-width: 95vw">
      <q-card-section class="text-h6 row items-center q-pb-none" :class="headerTextClass">
        <q-icon name="person_add" class="q-mr-sm" />
        Crear Nuevo Usuario
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <!-- Nombre -->
        <q-input
          v-model="form.nombre"
          label="Nombre completo"
          dense
          outlined
          clearable
          :rules="[val => !!val || 'Requerido']"
        />

        <!-- Correo -->
        <q-input
          v-model="form.email"
          label="Correo electrónico"
          type="email"
          dense
          outlined
          clearable
          :rules="[val => !!val || 'Requerido']"
        />

        <!-- RUT -->
        <q-input
          v-if="form.tipo === 'empleado' || form.tipo === 'empresa'"
          v-model="form.rut"
          label="RUT"
          dense
          outlined
          clearable
          :rules="[val => !!val || 'Requerido']"
        />

        <!-- Empresa -->
        <q-select
          v-if="form.tipo !== 'admin'"
          v-model="form.empresa"
          label="Empresa"
          :options="empresas"
          option-value="id"
          option-label="nombre"
          dense
          outlined
          emit-value
          map-options
          :rules="[val => !!val || 'Selecciona empresa']"
        />

        <!-- Tipo -->
        <q-select
          v-model="form.tipo"
          label="Tipo de usuario"
          :options="['admin', 'empresa', 'empleado']"
          dense
          outlined
          emit-value
          map-options
          :rules="[val => !!val || 'Selecciona un tipo']"
        />

        <!-- Horario -->
        <q-select
          v-if="form.tipo === 'empleado'"
          v-model="form.horarioLaboralId"
          label="Horario Laboral"
          :options="horarios"
          option-value="id"
          option-label="nombre"
          dense
          outlined
          emit-value
          map-options
          :rules="[val => !!val || 'Selecciona un horario']"
        />

        <!-- Contraseña -->
        <q-input
          v-model="form.password"
          label="Contraseña"
          type="password"
          dense
          outlined
          clearable
          :rules="[val => !!val || 'Requerido']"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="cancelar" />
        <q-btn color="primary" label="Guardar" @click="guardar" unelevated />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useQuasar } from 'quasar'

// Props
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  empresas: { type: Array, default: () => [] },
  horarios: { type: Array, default: () => [] }
})

// Emits
const emit = defineEmits(['update:modelValue', 'guardar'])

const $q = useQuasar()

// Modelo de visibilidad
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Formulario local
const form = ref({
  nombre: '',
  email: '',
  rut: '',
  tipo: '',
  empresa: null,
  horarioLaboralId: null,
  password: ''
})

// Reset al abrir
watch(() => props.modelValue, (val) => {
  if (val) {
    form.value = {
      nombre: '',
      email: '',
      rut: '',
      tipo: '',
      empresa: null,
      horarioLaboralId: null,
      password: ''
    }
  }
})

function guardar() {
  if (!form.value.nombre || !form.value.email || !form.value.tipo || !form.value.password) {
    $q.notify({ type: 'negative', message: 'Completa los campos obligatorios' })
    return
  }
  emit('guardar', { ...form.value })
  dialogVisible.value = false
}

function cancelar() {
  dialogVisible.value = false
}
</script>
