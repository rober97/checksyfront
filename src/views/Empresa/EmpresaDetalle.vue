<template>
  <q-page>
    <div class="rk-module-shell">
      <section class="rk-module-header">
        <div class="rk-module-icon">
          <q-icon name="business" size="28px" />
        </div>
        <div class="col">
          <h1 class="rk-module-title">Detalle de empresa</h1>
          <p class="rk-module-subtitle">
            Vista ejecutiva con identidad visual alineada al módulo de asistencias.
          </p>
        </div>
        <div class="rk-module-actions">
          <q-btn flat color="primary" icon="arrow_back" label="Volver" @click="goBack" />
          <q-btn unelevated color="primary" icon="edit" label="Editar" @click="editarEmpresa" />
          <q-btn outline color="negative" icon="delete" label="Eliminar" @click="confirmEliminar" />
        </div>
      </section>

      <section class="rk-module-grid rk-module-grid--2">
        <div class="rk-module-stat">
          <div class="rk-module-stat__icon">
            <q-icon name="badge" size="20px" />
          </div>
          <div>
            <div class="rk-module-stat__label">RUT</div>
            <div class="rk-module-stat__value stat-text">{{ empresa.rut || '—' }}</div>
          </div>
        </div>

        <div class="rk-module-stat">
          <div class="rk-module-stat__icon">
            <q-icon name="groups" size="20px" />
          </div>
          <div>
            <div class="rk-module-stat__label">Empleados</div>
            <div class="rk-module-stat__value">{{ empleados.length }}</div>
          </div>
        </div>
      </section>

      <section class="rk-module-grid rk-module-grid--2">
        <article class="rk-module-panel">
          <div class="rk-module-panel__section">
            <h2 class="rk-module-panel__title">Información general</h2>
            <p class="rk-module-panel__caption">Datos base de contacto y operación.</p>
          </div>

          <q-list separator>
            <q-item>
              <q-item-section avatar><q-icon name="badge" /></q-item-section>
              <q-item-section>
                <q-item-label>Nombre</q-item-label>
                <q-item-label caption>{{ empresa.nombre }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar><q-icon name="assignment_ind" /></q-item-section>
              <q-item-section>
                <q-item-label>RUT</q-item-label>
                <q-item-label caption>{{ empresa.rut }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar><q-icon name="email" /></q-item-section>
              <q-item-section>
                <q-item-label>Correo</q-item-label>
                <q-item-label caption>{{ empresa.email }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar><q-icon name="phone" /></q-item-section>
              <q-item-section>
                <q-item-label>Teléfono</q-item-label>
                <q-item-label caption>{{ empresa.telefono }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar><q-icon name="location_on" /></q-item-section>
              <q-item-section>
                <q-item-label>Dirección</q-item-label>
                <q-item-label caption>{{ empresa.direccion }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </article>

        <article class="rk-module-panel">
          <div class="rk-module-panel__section">
            <h2 class="rk-module-panel__title">Equipo asociado</h2>
            <p class="rk-module-panel__caption">Resumen rápido del personal vinculado a esta empresa.</p>
          </div>

          <q-table
            :rows="empleados"
            :columns="columns"
            flat
            bordered
            row-key="id"
            :pagination="{ rowsPerPage: 5 }"
          >
            <template #body-cell-actions="props">
              <q-td>
                <q-btn dense flat icon="visibility" color="primary" @click="verEmpleado(props.row)" />
              </q-td>
            </template>
          </q-table>
        </article>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();

const empresa = ref({});
const empleados = ref([]);

const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'correo', label: 'Correo', field: 'correo', align: 'left' },
  { name: 'cargo', label: 'Cargo', field: 'cargo', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' },
];

function goBack() {
  router.back();
}

function editarEmpresa() {
  router.push(`/admin/company/${empresa.value.id}`);
}

function confirmEliminar() {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Estás seguro de eliminar "${empresa.value.nombre}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    $q.notify({ type: 'positive', message: 'Empresa eliminada' });
    router.push('/admin/companies');
  });
}

function verEmpleado(empleado) {
  router.push(`/admin/empleados/${empleado.id}`);
}

onMounted(() => {
  const id = route.params.id;
  empresa.value = {
    id,
    nombre: 'Recksy Demo S.A.',
    rut: '76.123.456-7',
    email: 'contacto@recksy.cl',
    telefono: '+56 2 1234 5678',
    direccion: 'Av. del Trabajo 123',
  };

  empleados.value = [
    { id: 1, nombre: 'Juan Pérez', correo: 'juan@recksy.cl', cargo: 'Analista' },
    { id: 2, nombre: 'María López', correo: 'maria@recksy.cl', cargo: 'Contadora' },
  ];
});
</script>

<style scoped>
.stat-text {
  font-size: 20px;
}
</style>
