<template>
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-2">
      <q-list padding>
        <q-item-label header>Menú Principal</q-item-label>

        <q-item clickable to="/user" exact>
          <q-item-section avatar>
            <q-icon name="person_add" />
          </q-item-section>
          <q-item-section>Crear Usuario</q-item-section>
        </q-item>

        <q-item clickable to="/attendance" exact>
          <q-item-section avatar>
            <q-icon name="access_time" />
          </q-item-section>
          <q-item-section>Registro de Asistencia</q-item-section>
        </q-item>

        <q-item clickable to="/perfil" exact>
          <q-item-section avatar>
            <q-icon name="person" />
          </q-item-section>
          <q-item-section>Mi Perfil</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
</template>

<script>

</script>