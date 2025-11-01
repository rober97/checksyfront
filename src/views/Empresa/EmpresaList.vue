<!-- src/views/Admin/CompaniesPage.vue -->
<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <!-- ===== Header unificado ===== -->
    <PageHeader
      icon="business"
      title="Empresas"
      help-text="AYUDA"
      :help-to="{ name: 'help.companies' }"
    >
      <template #subtitle>
        Administra datos básicos, <b>políticas de vacaciones</b> y
        <b>feriados</b>.
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
        <!-- Estado -->
        <q-btn-toggle
          v-model="statusFilter"
          :options="statusOpts"
          unelevated
          toggle-color="primary"
          size="sm"
          class="rk-modes"
          @update:model-value="reload"
        />

        <!-- Métricas -->
        <div class="row items-center q-gutter-xs rk-metrics q-ml-sm">
          <q-chip dense outline icon="apps" color="primary"
            >{{ totalCount }} Total</q-chip
          >
          <q-chip dense outline icon="check_circle" color="positive"
            >{{ activeCount }} Activas</q-chip
          >
          <q-chip dense outline icon="pause_circle" color="warning"
            >{{ inactiveCount }} Inactivas</q-chip
          >
          <q-chip dense outline icon="error" color="negative"
            >{{ suspendedCount }} Suspendidas</q-chip
          >
        </div>

        <q-space />

        <!-- Buscador -->
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          debounce="250"
          placeholder="Buscar por nombre o RUT…"
          class="rk-pill rk-mini-search"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <!-- Acciones -->
        <div class="rk-actions row items-center q-gutter-sm">
          <q-btn
            color="green"
            icon="file_download"
            class="rk-cta"
            @click="exportExcel"
          />
          <q-btn
            color="primary"
            icon="add"
            no-caps
            unelevated
            class="rk-cta"
            @click="openCreate"
          />
        </div>
      </div>
    </div>

    <!-- ===== Tabla ===== -->
    <q-card flat bordered class="rk-card soft-card" :class="cardTone">
      <DynamicDataTable
        :rows="rowsView"
        :columns="columns"
        row-key="_id"
        :pagination="pagination"
        :rows-per-page-options="[5, 10, 25, 50]"
        :loading="companies.loading"
        loading-label="Cargando empresas…"
        no-data-label="No hay empresas registradas"
        :filter="search"
        :table-class="tableClass"
        :binary-state-sort="true"
        :flat="true"
        :bordered="true"
        :wrap-cells="false"
        selection="none"
      >
        <!-- Empty -->
        <template #no-data>
          <div class="full-width column items-center q-pa-lg rk-muted">
            <q-icon name="apartment" size="48px" class="q-mb-sm" />
            <div class="text-subtitle1 q-mb-xs">No hay empresas</div>
            <div class="text-caption q-mb-md">
              Crea la primera empresa con el botón “Nueva”.
            </div>
            <q-btn
              color="primary"
              icon="add"
              label="Nueva"
              @click="openCreate"
            />
          </div>
        </template>

        <!-- Body: Nombre -->
        <template #body-cell-name="p">
          <q-td :props="p">
            <div class="row items-center no-wrap">
              <q-avatar size="28px" class="q-mr-sm" square>
                <img v-if="p.row.logo" :src="p.row.logo" alt="logo" />
                <q-icon v-else name="apartment" color="grey-7" />
              </q-avatar>
              <div class="rk-ellipsis">{{ p.row.name || "—" }}</div>
            </div>
          </q-td>
        </template>

        <!-- Body: RUT -->
        <template #body-cell-rut="p">
          <q-td :props="p" class="rk-mono">
            {{ p.row.rut || "—" }}
          </q-td>
        </template>

        <!-- Body: Estado -->
        <template #body-cell-status="p">
          <q-td :props="p">
            <q-badge :color="statusColor(p.row.status)" outline>
              {{ statusNice(p.row.status) }}
            </q-badge>
          </q-td>
        </template>

        <!-- Body: Acciones -->
        <template #body-cell-actions="p">
          <q-td :props="p" class="text-right">
            <q-btn
              flat
              dense
              round
              icon="edit"
              color="primary"
              @click="editarEmpresa(p.row)"
            />
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              @click="confirmEliminar(p.row)"
            />
          </q-td>
        </template>
      </DynamicDataTable>
    </q-card>

    <!-- ===== Diálogo ===== -->
    <CompanyDialog
      v-model="dlgOpen"
      :editData="editRow"
      @saved="loadCompanies"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useQuasar } from "quasar";
import DynamicDataTable from "@/components/shared/DynamicDataTable.vue";
import CompanyDialog from "@/components/companies/CompanyDialog.vue";
import PageHeader from "@/components/shared/PageHeader.vue";
import { useCompaniesStore } from "@/stores/companies";

const $q = useQuasar();
const companies = useCompaniesStore();

/* Tema */
const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() =>
  isDark.value ? "bg-grey-10 text-white" : "bg-grey-1"
);
const cardTone = computed(() =>
  isDark.value ? "bg-grey-9 text-white" : "bg-white"
);
const tableClass = computed(() => [
  "rk-scrollable",
  "rk-compact",
  isDark.value ? "bg-grey-9 text-white" : "bg-white text-dark",
]);

/* Estado UI */
const dlgOpen = ref(false);
const editRow = ref(null);
const search = ref("");
const statusFilter = ref("all");
const statusOpts = [
  { label: "Todas", value: "all", icon: "apps" },
  { label: "Activas", value: "active", icon: "check_circle" },
  { label: "Inactivas", value: "inactive", icon: "pause_circle" },
  { label: "Suspendidas", value: "suspended", icon: "error" },
];
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: "name",
  descending: false,
});

/* Datos base */
const rawRows = computed(() => {
  const arr = companies.items || companies.empresas || companies.list || [];
  return Array.isArray(arr) ? arr : [];
});

/* Filtro por estado (texto lo maneja :filter del QTable) */
const rowsView = computed(() => {
  const st = (statusFilter.value || "all").toLowerCase();
  if (st === "all") return rawRows.value;
  return rawRows.value.filter((r) => (r?.status || "").toLowerCase() === st);
});

/* Métricas */
const totalCount = computed(() => rawRows.value.length);
const activeCount = computed(
  () =>
    rawRows.value.filter((r) => (r?.status || "").toLowerCase() === "active")
      .length
);
const inactiveCount = computed(
  () =>
    rawRows.value.filter((r) => (r?.status || "").toLowerCase() === "inactive")
      .length
);
const suspendedCount = computed(
  () =>
    rawRows.value.filter((r) => (r?.status || "").toLowerCase() === "suspended")
      .length
);

/* Columnas */
const columns = [
  {
    name: "name",
    label: "Nombre",
    field: "name",
    align: "left",
    sortable: true,
  },
  { name: "rut", label: "RUT", field: "rut", align: "left", sortable: true },
  {
    name: "status",
    label: "Estado",
    field: "status",
    align: "left",
    sortable: true,
  },
  {
    name: "actions",
    label: "",
    field: "__actions",
    align: "right",
    sortable: false,
  },
];

/* Helpers */
const statusNice = (s) =>
  ({ active: "Activa", inactive: "Inactiva", suspended: "Suspendida" }[
    (s || "").toLowerCase()
  ] ||
  s ||
  "—");
const statusColor = (s) =>
  s === "active"
    ? "positive"
    : s === "inactive"
    ? "warning"
    : s === "suspended"
    ? "negative"
    : "grey";

/* Acciones */
const openCreate = () => {
  editRow.value = null;
  dlgOpen.value = true;
};
const editarEmpresa = (row) => {
  editRow.value = row;
  dlgOpen.value = true;
};
const confirmEliminar = (row) => {
  $q.dialog({
    title: "Eliminar empresa",
    message: `¿Eliminar "${
      row?.name || "esta empresa"
    }"? Esta acción no se puede deshacer.`,
    cancel: true,
    ok: { label: "Eliminar", color: "negative" },
  }).onOk(async () => {
    try {
      await companies.removeCompany(row._id);
      $q.notify({ type: "positive", message: "Empresa eliminada" });
      await loadCompanies();
    } catch (err) {
      console.error(err);
      $q.notify({ type: "negative", message: "No se pudo eliminar" });
    }
  });
};

/* Excel */
const exportExcel = () => {
  try {
    const data = rowsView.value.map((r) => ({
      Nombre: r.name || "",
      RUT: r.rut || "",
      Estado: statusNice(r.status),
      "Fecha creación": r.createdAt ? new Date(r.createdAt) : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data, { cellDates: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Empresas");
    XLSX.writeFile(
      wb,
      `empresas_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  } catch {
    $q.notify({ type: "negative", message: "No se pudo exportar a Excel" });
  }
};

/* Carga */
const loadCompanies = async () => {
  try {
    await companies.fetchCompanies();
  } catch (err) {
    console.error("[loadCompanies] error:", err);
  }
};
const reload = () => {
  /* si en el futuro paginas vía servidor, llama aquí */
};

onMounted(() => {
  loadCompanies();
  initSticky();
});

/* Sticky toolbar */
const toolbarRef = ref(null);
const toolbarSentinel = ref(null);
const stickyToolbar = ref(false);
let observer;
const initSticky = () => {
  observer = new IntersectionObserver(
    (entries) => {
      stickyToolbar.value = !entries[0].isIntersecting;
    },
    { root: null, threshold: 0 }
  );
  if (toolbarSentinel.value) observer.observe(toolbarSentinel.value);
};
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

/* ===== Toolbar ===== */
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
.rk-modes :deep(.q-btn) {
  border-radius: 12px;
}
.rk-modes :deep(.q-btn--active) {
  box-shadow: 0 6px 14px rgba(33, 150, 243, 0.22);
}
.rk-mini-search {
  min-width: 240px;
}
.rk-pill :deep(.q-field__control) {
  border-radius: 12px !important;
  background: color-mix(in oklab, var(--rk-soft) 80%, transparent);
}
.rk-pill :deep(.q-field__native),
.rk-pill :deep(.q-field__label) {
  font-size: 13px;
}

/* Métricas compactas */
.rk-metrics :deep(.q-chip) {
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

/* Acciones */
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

/* Card tabla */
.rk-card {
  border-radius: 16px;
  border: 1px solid var(--rk-border);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

/* Utilidades */
.rk-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rk-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}
</style>
