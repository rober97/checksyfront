<!-- src/views/Admin/UsersPage.vue -->
<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <!-- ===== Header unificado ===== -->
    <PageHeader
      icon="group"
      title="Gestión de Usuarios"
      help-text="AYUDA"
      :help-to="{ name: 'help.users' }"
    >
      <template #subtitle>
        Administre cuentas, <b>roles</b> y <b>estados</b>. Busque, filtre y
        exporte.
      </template>
    </PageHeader>

    <!-- ===== Toolbar (sticky) ===== -->
    <div ref="toolbarSentinel" class="rk-sentinel" />
    <div
      ref="toolbarRef"
      class="rk-toolbar q-mb-md"
      :class="{ 'is-sticky': stickyToolbar }"
    >
      <div class="row items-center q-col-gutter-sm full-width">
        <!-- Filtros -->
        <q-input
          v-model="filters.q"
          dense
          outlined
          clearable
          debounce="250"
          placeholder="Buscar por nombre, correo o RUT…"
          class="rk-pill col-12 col-md-4"
          @update:model-value="onFilterInput"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <q-select
          v-model="filters.role"
          :options="roleOptions"
          dense
          outlined
          clearable
          emit-value
          map-options
          label="Rol"
          class="rk-pill col-6 col-md-2"
          @update:model-value="onFilterInput"
        >
          <template #prepend><q-icon name="verified_user" /></template>
        </q-select>

        <q-select
          v-model="filters.company"
          :options="empresas"
          option-value="id"
          option-label="name"
          dense
          outlined
          clearable
          emit-value
          map-options
          label="Empresa"
          class="rk-pill col-6 col-md-3"
          @update:model-value="onFilterInput"
        >
          <template #prepend><q-icon name="business" /></template>
        </q-select>

        <q-space />

        <!-- Acciones a la derecha -->
        <div class="rk-actions row items-center q-gutter-sm">
          <q-btn
            color="green"
            icon="file_download"
            class="rk-cta"
            @click="exportExcel"
          />
          <q-btn
            icon="delete_sweep"
            unelevated
            color="negative"
            :disable="!selected.length"
            class="rk-cta"
            @click="confirmBulkDelete"
          />
          <q-btn
            color="primary"
            icon="person_add"
            no-caps
            unelevated
            class="rk-cta"
            @click="abrirDialogoNuevo"
          />
        </div>
      </div>
    </div>

    <!-- ===== Tabla ===== -->
    <DynamicDataTable
      :rows="rows"
      :columns="columns"
      row-key="_id"
      :loading="loading"
      :pagination="pagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :binary-state-sort="true"
      :flat="true"
      :bordered="true"
      :wrap-cells="false"
      no-data-label="No hay usuarios"
      :table-class="tableClass"
      selection="multiple"
      v-model:selected="selected"
      @request="onRequest"
      @row-dblclick="onRowDblClick"
    >
      <template #top-right>
        <div class="text-caption rk-muted q-pr-sm">
          {{ total }} resultado(s)
        </div>
      </template>

      <!-- Usuario -->
      <template #body-cell-name="p">
        <q-td :props="p">
          <div class="row items-center no-wrap">
            <q-avatar
              color="primary"
              text-color="white"
              size="28px"
              class="q-mr-sm"
            >
              {{ initials(p.row.firstName, p.row.lastName) }}
            </q-avatar>
            <div class="col">
              <div class="text-body2 text-weight-medium ellipsis">
                {{ p.row.firstName }} {{ p.row.lastName }}
              </div>
              <div class="text-caption rk-muted ellipsis">
                {{ p.row.email }}
              </div>
            </div>
          </div>
        </q-td>
      </template>

      <!-- Empresa -->
      <template #body-cell-company="p">
        <q-td :props="p">
          <q-chip v-if="p.row.company?.name" dense square icon="apartment">
            {{ p.row.company.name }}
          </q-chip>
          <span v-else>—</span>
        </q-td>
      </template>

      <!-- Rol -->
      <template #body-cell-role="p">
        <q-td :props="p">
          <q-badge :color="roleColor(p.row.role || p.row.tipo)" outline>
            {{ roleNice(p.row.role || p.row.tipo) }}
          </q-badge>
        </q-td>
      </template>

      <!-- Estado -->
      <template #body-cell-status="p">
        <q-td :props="p">
          <q-badge :color="statusColor(p.row.status)" outline>
            {{ statusNice(p.row.status) }}
          </q-badge>
        </q-td>
      </template>

      <!-- Último acceso -->
      <template #body-cell-lastLogin="p">
        <q-td :props="p">
          <span v-if="p.row.lastLogin">{{ formatDate(p.row.lastLogin) }}</span>
          <span v-else>—</span>
        </q-td>
      </template>

      <!-- Acciones -->
      <template #body-cell-actions="p">
        <q-td :props="p" class="q-gutter-xs">
          <q-btn
            dense
            flat
            round
            icon="visibility"
            @click="ver(p.row)"
            title="Ver"
          />
          <q-btn
            dense
            flat
            round
            icon="edit"
            color="primary"
            @click="editar(p.row)"
            title="Editar"
          />
          <q-btn
            dense
            flat
            round
            icon="delete"
            color="negative"
            @click="confirmDelete(p.row)"
            title="Eliminar"
          />
        </q-td>
      </template>
    </DynamicDataTable>

    <!-- ===== Bottom bar ===== -->
    <div class="rk-bottombar">
      <div class="row items-center justify-between q-gutter-sm">
        <div class="text-caption rk-muted">
          Mostrando <b>{{ showingStart }}</b
          >–<b>{{ showingEnd }}</b> de <b>{{ total }}</b>
          <span v-if="selected.length">
            • {{ selected.length }} seleccionados</span
          >
        </div>
        <q-pagination
          v-model="pagination.page"
          :max="maxPages"
          max-pages="6"
          boundary-numbers
          direction-links
          size="sm"
          @update:model-value="reload"
        />
      </div>
    </div>

    <!-- ===== Dialogs ===== -->
    <UserCreation
      v-model="dialogoNuevo"
      :empresas="empresas"
      :horarios="horarios"
      @guardar="guardarUsuario"
    />
    <EditUserDialog
      v-model="dialogoEditar"
      :user-id="userIdEditar"
      @updated="reload"
      @deleted="reload"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useQuasar } from "quasar";
import { useUserStore } from "@/stores/userStore";
import { useCompaniesStore } from "@/stores/companies";
import DynamicDataTable from "@/components/shared/DynamicDataTable.vue";
import UserCreation from "@/components/UserCreation.vue";
import EditUserDialog from "@/components/EditUserDialog.vue";
import PageHeader from "@/components/shared/PageHeader.vue";

const $q = useQuasar();
const userStore = useUserStore();
const companiesStore = useCompaniesStore();

/* Debounce simple */
let _t = null;
const debounce =
  (fn, ms = 250) =>
  (...args) => {
    clearTimeout(_t);
    _t = setTimeout(() => fn(...args), ms);
  };

/* Filtros y paginación */
const filters = ref({ q: "", role: null, company: null });
const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  sortBy: "createdAt",
  descending: true,
});
const total = ref(0);
const loading = ref(false);
const rows = ref([]);
const selected = ref([]);

/* Columnas */
const columns = [
  {
    name: "name",
    label: "Usuario",
    field: "firstName",
    align: "left",
    sortable: true,
  },
  {
    name: "company",
    label: "Empresa",
    field: (r) => r.company?.name,
    align: "left",
    sortable: true,
  },
  {
    name: "role",
    label: "Rol",
    field: (r) => r.role || r.tipo,
    align: "left",
    sortable: true,
  },
  {
    name: "status",
    label: "Estado",
    field: "status",
    align: "left",
    sortable: true,
  },
  {
    name: "lastLogin",
    label: "Último acceso",
    field: "lastLogin",
    align: "left",
    sortable: true,
  },
  { name: "actions", label: "Acciones", field: "actions", align: "center" },
];

/* Empresas/Horarios para crear */
const dialogoNuevo = ref(false);
const empresas = ref([]);
const horarios = ref([]);
const loadEmpresas = async () => {
  await companiesStore.fetchCompanies();
  empresas.value = (companiesStore.companies || []).map((e) => ({
    id: e._id,
    name: e.name,
  }));
};
const loadHorariosAll = async () => {
  horarios.value = [];
  for (const e of empresas.value) {
    await companiesStore.fetchWorkSchedulesByCompany?.(e.id);
    const hs = (companiesStore.workSchedules || []).map((h) => ({
      id: h._id,
      name: h.name,
    }));
    horarios.value.push(...hs);
  }
};

/* Utilidad filtros */
const applyFilters = (list, { q, role, company }) => {
  const term = (q || "").toLowerCase().trim();
  let out = Array.isArray(list) ? list : [];
  if (term) {
    out = out.filter((u) =>
      [u.firstName, u.lastName, u.email, u.rut]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(term))
    );
  }
  if (role) out = out.filter((u) => u.role === role || u.tipo === role);
  if (company) out = out.filter((u) => u.company?._id === company);
  return out;
};

/* Request servidor (simulado con store local) */
const onRequest = async ({ pagination: p }) => {
  const { page, rowsPerPage, sortBy, descending } = p;
  loading.value = true;
  try {
    await userStore.fetchUsers();
    const all = (userStore.users || []).map((x) => ({
      ...x,
      role: x.role || x.tipo,
    }));
    const filtered = applyFilters(all, filters.value);

    const getVal = (obj) => {
      if (sortBy === "createdAt") return new Date(obj.createdAt || 0);
      const col = columns.find((c) => c.name === sortBy);
      if (col && typeof col.field === "function") {
        try {
          return col.field(obj) ?? "";
        } catch {
          return "";
        }
      }
      return obj?.[sortBy];
    };

    const sorted = [...filtered].sort((a, b) => {
      const dir = descending ? -1 : 1;
      const av = getVal(a);
      const bv = getVal(b);
      return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
    });

    total.value = sorted.length;
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    rows.value = rowsPerPage === 0 ? sorted : sorted.slice(start, end);

    pagination.value = { page, rowsPerPage, sortBy, descending };
  } catch (e) {
    $q.notify({ type: "negative", message: "Error al cargar usuarios" });
  } finally {
    loading.value = false;
  }
};
const reload = () => onRequest({ pagination: pagination.value });
const onFilterInput = debounce(() => {
  pagination.value.page = 1;
  reload();
}, 250);

/* Dblclick -> editar */
const dialogoEditar = ref(false);
const userIdEditar = ref(null);
const onRowDblClick = (_evt, row) => editar(row);
const editar = (row) => {
  const id = row?._id;
  if (!id) return;
  userIdEditar.value = id;
  dialogoEditar.value = true;
};

/* Acciones */
const exportExcel = () => {
  try {
    const all = (userStore.users || []).map((x) => ({
      ...x,
      role: x.role || x.tipo,
    }));
    const filtered = applyFilters(all, filters.value);

    const data = filtered.map((u) => ({
      Nombre: (u.firstName || "") + " " + (u.lastName || ""),
      Email: u.email || "",
      RUT: u.rut || "",
      Rol: roleNice(u.role || u.tipo),
      Estado: statusNice(u.status),
      Empresa: u.company?.name || "",
      "Último acceso": u.lastLogin ? new Date(u.lastLogin) : "",
    }));

    const ws = XLSX.utils.json_to_sheet(data, { cellDates: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(
      wb,
      `usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  } catch {
    $q.notify({ type: "negative", message: "No se pudo exportar a Excel" });
  }
};

const abrirDialogoNuevo = () => {
  dialogoNuevo.value = true;
};
const guardarUsuario = async () => {
  dialogoNuevo.value = false;
  reload();
};
const ver = (row) => {
  $q.notify({
    message: `Usuario: ${row.firstName} ${row.lastName}`,
    color: "info",
  });
};

const confirmDelete = (row) => {
  $q.dialog({
    title: "Eliminar usuario",
    message: `¿Eliminar a ${row.firstName} ${row.lastName}?`,
    ok: { label: "Eliminar", color: "negative" },
    cancel: { label: "Cancelar" },
  }).onOk(async () => {
    await eliminarUsuario(row._id);
  });
};
const confirmBulkDelete = () => {
  $q.dialog({
    title: "Eliminar usuarios",
    message: `¿Eliminar ${selected.value.length} usuario(s) seleccionados?`,
    ok: { label: "Eliminar", color: "negative" },
    cancel: { label: "Cancelar" },
  }).onOk(async () => {
    for (const r of selected.value) await eliminarUsuario(r._id);
    selected.value = [];
    reload();
  });
};
const eliminarUsuario = async (id) => {
  try {
    await userStore.deleteUser(id);
    $q.notify({ type: "positive", message: "Usuario eliminado" });
    reload();
  } catch {
    $q.notify({ type: "negative", message: "No se pudo eliminar el usuario" });
  }
};

/* UI helpers */
const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Empleado", value: "employee" },
  { label: "Supervisor", value: "supervisor" },
  { label: "Empresa", value: "company" },
];
const roleNice = (r) =>
  ({
    admin: "Admin",
    company: "Empresa",
    employee: "Empleado",
    supervisor: "Supervisor",
    empresa: "Empresa",
    empleado: "Empleado",
  }[r] || r);
const roleColor = (r) => {
  const rr = r === "empresa" ? "company" : r === "empleado" ? "employee" : r;
  return rr === "admin"
    ? "deep-purple-5"
    : rr === "company"
    ? "indigo-6"
    : rr === "employee"
    ? "teal-6"
    : "grey-6";
};
const statusNice = (s) =>
  ({ active: "Activo", inactive: "Inactivo", suspended: "Suspendido" }[s] ||
  s ||
  "—");
const statusColor = (s) =>
  s === "active" ? "positive" : s === "inactive" ? "grey" : "warning";
const initials = (fn = "", ln = "") =>
  ((fn?.[0] || "") + (ln?.[0] || "") || "U").toUpperCase();
const formatDate = (d) => {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(d));
  } catch {
    return "—";
  }
};

/* Tema & sticky */
const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() =>
  isDark.value ? "bg-grey-10 text-white" : "bg-grey-1"
);
const tableClass = computed(() =>
  isDark.value ? "bg-grey-9 text-white" : "bg-white text-dark"
);

const showingStart = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage + 1;
  return total.value ? Math.min(start, total.value) : 0;
});
const showingEnd = computed(() =>
  Math.min(pagination.value.page * pagination.value.rowsPerPage, total.value)
);
const maxPages = computed(() =>
  Math.max(
    1,
    Math.ceil(total.value / Math.max(1, pagination.value.rowsPerPage || 1))
  )
);

const toolbarRef = ref(null);
const toolbarSentinel = ref(null);
const stickyToolbar = ref(false);
let observer;

onMounted(async () => {
  await loadEmpresas();
  await loadHorariosAll();
  reload();
  observer = new IntersectionObserver(
    (entries) => {
      stickyToolbar.value = !entries[0].isIntersecting;
    },
    { root: null, threshold: 0 }
  );
  if (toolbarSentinel.value) observer.observe(toolbarSentinel.value);
});
onBeforeUnmount(() => {
  if (observer && toolbarSentinel.value)
    observer.unobserve(toolbarSentinel.value);
});
</script>

<style scoped>
/* ===== Tokens mínimos ===== */
:root {
  --rk-border: rgba(0, 0, 0, 0.08);
  --rk-card: #fff;
  --rk-soft: #f5f7fb;
  --rk-muted: #667085;
}
.body--dark {
  --rk-border: rgba(255, 255, 255, 0.08);
  --rk-card: #101318;
  --rk-soft: #0f1216;
  --rk-muted: #9aa3b2;
}
.rk-muted {
  color: var(--rk-muted);
}

/* ===== Toolbar sticky ===== */
.rk-sentinel {
  height: 1px;
}
.rk-toolbar {
  border: 1px solid var(--rk-border);
  border-radius: 14px;
  padding: 12px;
  background: radial-gradient(
      120% 120% at 0% 0%,
      color-mix(in oklab, var(--q-primary) 8%, transparent),
      transparent 60%
    ),
    var(--rk-card);
  backdrop-filter: saturate(1.1) blur(6px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
}
.rk-toolbar.is-sticky {
  position: sticky;
  top: 56px;
  z-index: 5;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
}

/* Inputs redondeados */
.rk-pill :deep(.q-field__control) {
  border-radius: 12px !important;
  background: color-mix(in oklab, var(--rk-soft) 80%, transparent);
}
.rk-pill :deep(.q-field__native),
.rk-pill :deep(.q-field__label) {
  font-size: 13px;
}

/* Acciones derechas */
.rk-actions .rk-btn {
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  background: color-mix(in oklab, var(--rk-card) 88%, transparent);
  transition: transform 0.15s, box-shadow 0.15s;
}
.rk-actions .rk-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
.rk-cta {
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 10px 22px color-mix(in oklab, var(--q-primary) 22%, transparent);
}

/* Bottom bar */
.rk-bottombar {
  position: sticky;
  bottom: 0;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  background: var(--rk-card);
  backdrop-filter: saturate(1.1) blur(4px);
  box-shadow: 0 -8px 22px rgba(0, 0, 0, 0.08);
}

/* Fondo sutil página */
.q-page {
  background: linear-gradient(
    180deg,
    color-mix(in oklab, var(--rk-soft) 95%, transparent),
    transparent 320px
  );
}
</style>
