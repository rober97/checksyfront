<template>
  <q-page class="flex flex-center bg-grey-1">
    <div class="text-center q-pa-md">

      <q-icon name="sentiment_dissatisfied" color="primary" size="100px" class="q-mb-md" />

      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        ¡Vaya! Página no encontrada
      </div>

      <div class="text-subtitle2 text-grey q-mb-lg">
        La ruta que intentaste visitar no existe o fue movida.
      </div>

      <q-btn
        label="Volver al inicio"
        icon="arrow_back"
        color="primary"
        unelevated
        @click="$router.push('/')"
      />
    </div>
  </q-page>
</template>
