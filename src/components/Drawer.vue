<template>
  <q-drawer
    v-model="leftDrawerOpen"
    show-if-above
    bordered
    :mini="props.miniState"
    :class="drawerClass"
    content-class="q-pa-none"
    class="q-drawer--standard full-height"
  >
    <q-list padding>
      <q-item-label header>Menu</q-item-label>

      <!-- 🔐 Admin -->
      <template v-if="role === 'Administrador'">
        <q-item clickable to="/admin/dashboard" exact>
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable to="/admin/users">
          <q-item-section avatar><q-icon name="people" /></q-item-section>
          <q-item-section>Users</q-item-section>
        </q-item>

        <q-item clickable to="/admin/permissions">
          <q-item-section avatar><q-icon name="lock" /></q-item-section>
          <q-item-section>Permissions</q-item-section>
        </q-item>

        <q-item clickable to="/admin/attendance">
          <q-item-section avatar><q-icon name="apartment" /></q-item-section>
          <q-item-section>Asistencias</q-item-section>
        </q-item>

        <q-item clickable to="/admin/companies">
          <q-item-section avatar><q-icon name="apartment" /></q-item-section>
          <q-item-section>Companies</q-item-section>
        </q-item>

        <q-item clickable to="/admin/horarios" exact>
          <q-item-section avatar>
            <q-icon name="schedule" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Horarios</q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <!-- 🏢 Empresa -->
      <template v-if="role === 'Empresa'">
        <q-item clickable to="/company/dashboard">
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable to="/company/employees">
          <q-item-section avatar><q-icon name="badge" /></q-item-section>
          <q-item-section>Employees</q-item-section>
        </q-item>

        <q-item clickable to="/company/report">
          <q-item-section avatar><q-icon name="bar_chart" /></q-item-section>
          <q-item-section>Report</q-item-section>
        </q-item>

        <q-item clickable to="/company/requests">
          <q-item-section avatar><q-icon name="assignment" /></q-item-section>
          <q-item-section>Requests</q-item-section>
        </q-item>
      </template>

      <!-- 👤 Empleado -->
      <template v-if="role === 'Empleado'">
        <q-item clickable to="/employee/dashboard">
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable to="/employee/attendance">
          <q-item-section avatar><q-icon name="access_time" /></q-item-section>
          <q-item-section>Mark Attendance</q-item-section>
        </q-item>

        <q-item clickable to="/employee/history">
          <q-item-section avatar><q-icon name="history" /></q-item-section>
          <q-item-section>My History</q-item-section>
        </q-item>

        <q-item clickable to="/employee/request">
          <q-item-section avatar><q-icon name="post_add" /></q-item-section>
          <q-item-section>New Request</q-item-section>
        </q-item>

        
      </template>
    </q-list>
  </q-drawer>
</template>

<script setup>
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

const $q = useQuasar();
const router = useRouter();

// Props y emits para v-model
const props = defineProps({
  modelValue: Boolean,
  miniState: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

// Drawer state
const leftDrawerOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
// Role dinámico
const role = localStorage.getItem("role") || "Empleado";

// Clases condicionales
const drawerClass = computed(() =>
  $q.dark.isActive ? "bg-grey-9 text-white" : "bg-grey-1 text-dark"
);

function logout() {
  localStorage.clear();
  router.push("/");
}
</script>
