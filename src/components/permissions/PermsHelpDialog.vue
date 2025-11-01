
<template>
  <q-dialog v-model="modelLocal">
    <q-card class="rk-help">
      <q-card-section class="text-h6">Cómo Utilizar</q-card-section>
      <q-card-section>
        <ol class="q-pl-md">
          <li><b>Usuario:</b> Busque y seleccione a la persona en la columna izquierda y edite.</li>
          <li><b>Perfil:</b> Seleccione un perfil o cree uno nuevo; edite su mapa y guarde.</li>
          <li>Use los botones <b>tri-estado</b> por categoría o por permiso.</li>
          <li>Resalte <i>diferencias</i>, <i>conflictos</i> o <i>cambios</i> según necesite.</li>
          <li>Para aplicar un perfil, abra “Aplicar perfil…”, elija estrategia, <i>previsualice</i> y confirme.</li>
        </ol>
      </q-card-section>
      <q-card-actions align="right"><q-btn flat label="Entendido" @click="modelLocal=false" /></q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const modelLocal = ref(props.modelValue)
watch(() => props.modelValue, v => { modelLocal.value = v })
watch(modelLocal, v => emit('update:modelValue', v))
</script>

<style scoped>
.rk-help{ width:min(720px,92vw) }
</style>