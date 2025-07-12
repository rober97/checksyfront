<template>
  <div class="q-pa-lg">
    <div class="text-h4 text-primary flex items-center q-mb-md">
      <q-icon name="list_alt" size="36px" class="q-mr-sm" />
      Registro de Asistencia
    </div>

    <div v-if="store.loading" class="flex flex-center q-my-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else>
      <div v-if="store.asistencias.length === 0" class="text-center text-grey q-my-xl">
        <q-icon name="sentiment_dissatisfied" size="28px" class="q-mr-xs" />
        No hay asistencias registradas.
      </div>
      <q-gutter-y-md>
        <q-row class="q-col-gutter-md">
          <q-col
            v-for="asistencia in store.asistencias"
            :key="asistencia._id"
            cols="12"
            sm="6"
            md="4"
          >
            <q-card class="my-card">
              <q-card-section class="q-pb-none flex items-center">
                <q-avatar color="primary" text-color="white" icon="person" />
                <div class="q-ml-md">
                  <div class="text-subtitle1 text-weight-medium">
                    {{ asistencia.userId?.nombre || 'Usuario' }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ asistencia.userId?.email || '' }}
                  </div>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-section>
                <div class="row items-center q-mb-xs">
                  <q-icon name="event" size="20px" class="q-mr-xs text-grey-7" />
                  <span class="text-body2">{{ formatFecha(asistencia.timestamp) }}</span>
                </div>
                <div class="q-mb-xs">
                  <q-badge
                    v-if="asistencia.tipo === 'entrada'"
                    color="green-6"
                    class="q-mr-sm"
                    outline
                  >
                    <q-icon name="login" size="16px" class="q-mr-xs" />
                    Entrada
                  </q-badge>
                  <q-badge
                    v-if="asistencia.tipo === 'salida'"
                    color="red-6"
                    class="q-mr-sm"
                    outline
                  >
                    <q-icon name="logout" size="16px" class="q-mr-xs" />
                    Salida
                  </q-badge>
                </div>
                <div
                  v-if="asistencia.ubicacion?.lat && asistencia.ubicacion?.lng"
                  class="text-caption text-grey-7"
                >
                  <q-icon name="place" size="16px" class="q-mr-xs" />
                  {{ asistencia.ubicacion.lat }}, {{ asistencia.ubicacion.lng }}
                </div>
              </q-card-section>
            </q-card>
          </q-col>
        </q-row>
      </q-gutter-y-md>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAsistenciaStore } from '@/stores/asistenciaStore'

const store = useAsistenciaStore()

onMounted(() => {
  store.fetchAsistencias()
})

function formatFecha(fecha) {
  if (!fecha) return ''
  const date = new Date(fecha)
  return date.toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
.my-card {
  transition: box-shadow 0.3s;
}
.my-card:hover {
  box-shadow: 0 6px 32px 0 rgba(56,56,223,0.10), 0 1.5px 4.5px 0 rgba(20,37,63,0.06);
}
</style>
