<!-- src/views/Admin/CompaniesPage.vue -->
<template>
  <q-page class="rk-page rk-page--companies" :class="{ 'is-dark': isDark }">

    <!-- ===== Fondo decorativo ===== -->
    <div class="rk-bg-mesh" aria-hidden="true">
      <div class="mesh-orb orb-1" />
      <div class="mesh-orb orb-2" />
      <div class="mesh-orb orb-3" />
      <div class="mesh-grid" />
    </div>

    <!-- ===== Header ===== -->
    <div class="rk-header-wrap">
      <div class="rk-header-inner">
        <div class="rk-header-icon">
          <q-icon name="business" size="26px" />
        </div>
        <div class="rk-header-text">
          <h1 class="rk-title">Empresas</h1>
          <p class="rk-subtitle">
            Administra datos básicos,
            <span class="rk-accent">políticas de vacaciones</span> y
            <span class="rk-accent">feriados</span>.
          </p>
        </div>
        <div class="rk-header-actions q-ml-auto row items-center q-gutter-sm">
          <!-- Toggle modo claro/oscuro -->
          <q-btn
            :icon="isDark ? 'light_mode' : 'dark_mode'"
            round
            unelevated
            class="rk-mode-toggle"
            :aria-label="isDark ? 'Modo claro' : 'Modo oscuro'"
            @click="toggleDark"
          >
            <q-tooltip>{{ isDark ? "Modo claro" : "Modo oscuro" }}</q-tooltip>
          </q-btn>

          <q-btn
            round
            unelevated
            icon="help_outline"
            class="rk-icon-btn"
            :to="{ name: 'help.companies' }"
          >
            <q-tooltip>Ayuda</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- ===== KPI Cards ===== -->
    <div class="rk-kpi-grid q-mb-lg">
      <div
        v-for="kpi in kpiCards"
        :key="kpi.label"
        class="rk-kpi"
        :class="`kpi-${kpi.key}`"
        @click="statusFilter = kpi.key; reload()"
        :aria-label="`Filtrar por ${kpi.label}`"
      >
        <div class="kpi-icon-wrap">
          <q-icon :name="kpi.icon" size="22px" />
        </div>
        <div class="kpi-body">
          <div class="kpi-count">{{ kpi.count }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </div>
        <div class="kpi-bar">
          <div
            class="kpi-bar-fill"
            :style="{ width: kpiPercent(kpi.count) + '%' }"
          />
        </div>
        <div v-if="statusFilter === kpi.key" class="kpi-active-dot" />
      </div>
    </div>

    <!-- ===== Toolbar (sticky) ===== -->
    <div ref="toolbarSentinel" class="rk-sentinel" />
    <div
      ref="toolbarRef"
      class="rk-toolbar q-mb-md"
      :class="{ 'is-sticky': stickyToolbar }"
    >
      <div class="row items-center no-wrap full-width q-col-gutter-sm">
        <!-- Filtro estado -->
        <div class="rk-status-tabs">
          <button
            v-for="opt in statusOpts"
            :key="opt.value"
            class="rk-tab"
            :class="{ active: statusFilter === opt.value }"
            @click="statusFilter = opt.value; reload()"
          >
            <q-icon :name="opt.icon" size="14px" class="q-mr-xs" />
            {{ opt.label }}
          </button>
        </div>

        <q-space />

        <!-- Buscador -->
        <div class="rk-search-wrap">
          <q-icon name="search" size="16px" class="rk-search-icon" />
          <input
            v-model="search"
            class="rk-search-input"
            placeholder="Buscar empresa o RUT…"
            autocomplete="off"
          />
          <transition name="fade">
            <q-icon
              v-if="search"
              name="close"
              size="14px"
              class="rk-search-clear"
              @click="search = ''"
            />
          </transition>
        </div>

        <!-- Acciones -->
        <q-btn
          unelevated
          icon="file_download"
          class="rk-btn-export"
          @click="exportExcel"
        >
          <q-tooltip>Exportar a Excel</q-tooltip>
        </q-btn>
        <q-btn
          unelevated
          icon="add"
          label="Nueva"
          no-caps
          class="rk-btn-new"
          @click="openCreate"
        />
      </div>
    </div>

    <!-- ===== Tabla ===== -->
    <div class="rk-table-wrap">
      <!-- Loading skeleton -->
      <div v-if="companies.loading" class="rk-skeleton-list">
        <div v-for="n in 5" :key="n" class="rk-skeleton-row">
          <div class="skel skel-avatar" />
          <div class="skel skel-text" />
          <div class="skel skel-text skel-short" />
          <div class="skel skel-badge" />
          <div class="skel skel-actions" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!filteredRows.length" class="rk-empty">
        <div class="rk-empty-icon">
          <q-icon name="apartment" size="56px" />
        </div>
        <div class="rk-empty-title">Sin resultados</div>
        <div class="rk-empty-msg">
          {{
            search
              ? `No hay empresas que coincidan con "${search}"`
              : "Aún no hay empresas registradas."
          }}
        </div>
        <button class="rk-btn-new q-mt-md" @click="openCreate">
          <q-icon name="add" size="16px" class="q-mr-xs" />Nueva empresa
        </button>
      </div>

      <!-- Tabla real -->
      <table v-else class="rk-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.name"
              :class="['rk-th', `rk-th--${col.align || 'left'}`, col.sortable ? 'sortable' : '']"
              @click="col.sortable && toggleSort(col.name)"
            >
              <span class="th-content">
                {{ col.label }}
                <span v-if="col.sortable" class="sort-arrows">
                  <q-icon
                    :name="sortIcon(col.name)"
                    size="13px"
                    :class="{ active: sortBy === col.name }"
                  />
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in paginatedRows"
            :key="row._id"
            class="rk-tr"
            :style="{ animationDelay: idx * 30 + 'ms' }"
          >
            <!-- Nombre -->
            <td class="rk-td">
              <div class="cell-name">
                <div class="name-avatar">
                  <img v-if="row.logo" :src="row.logo" alt="logo" />
                  <span v-else class="name-initial">
                    {{ (row.name || "?")[0].toUpperCase() }}
                  </span>
                </div>
                <div class="name-info">
                  <div class="name-main">{{ row.name || "—" }}</div>
                  <div v-if="row.email" class="name-sub">{{ row.email }}</div>
                </div>
              </div>
            </td>

            <!-- RUT -->
            <td class="rk-td rk-mono">{{ row.rut || "—" }}</td>

            <!-- Estado -->
            <td class="rk-td">
              <span class="rk-badge" :class="`badge-${row.status}`">
                <span class="badge-dot" />
                {{ statusNice(row.status) }}
              </span>
            </td>

            <!-- Creación -->
            <td class="rk-td rk-date">
              {{ formatDate(row.createdAt) }}
            </td>

            <!-- Acciones -->
            <td class="rk-td rk-td--right">
              <div class="cell-actions">
                <button
                  class="act-btn act-edit"
                  @click="editarEmpresa(row)"
                  aria-label="Editar"
                >
                  <q-icon name="edit" size="15px" />
                  <q-tooltip>Editar</q-tooltip>
                </button>
                <button
                  class="act-btn act-delete"
                  @click="confirmEliminar(row)"
                  aria-label="Eliminar"
                >
                  <q-icon name="delete_outline" size="15px" />
                  <q-tooltip>Eliminar</q-tooltip>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Paginación -->
      <div v-if="filteredRows.length > pageSize" class="rk-pagination">
        <div class="page-info">
          Mostrando
          <strong>{{ pageStart + 1 }}–{{ Math.min(pageEnd, filteredRows.length) }}</strong>
          de <strong>{{ filteredRows.length }}</strong>
        </div>
        <div class="page-controls">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <q-icon name="chevron_left" size="16px" />
          </button>
          <button
            v-for="p in pageCount"
            :key="p"
            class="page-btn"
            :class="{ active: p === currentPage }"
            @click="currentPage = p"
          >
            {{ p }}
          </button>
          <button
            class="page-btn"
            :disabled="currentPage === pageCount"
            @click="currentPage++"
          >
            <q-icon name="chevron_right" size="16px" />
          </button>
        </div>
        <div class="page-size">
          <select v-model="pageSize" class="page-size-select">
            <option v-for="n in [5, 10, 25, 50]" :key="n" :value="n">
              {{ n }} / página
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- ===== Diálogo ===== -->
    <CompanyDialog
      v-model="dlgOpen"
      :editData="editRow"
      @saved="loadCompanies"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useQuasar } from "quasar";
import CompanyDialog from "@/components/companies/CompanyDialog.vue";
import { useCompaniesStore } from "@/stores/companies";

const $q = useQuasar();
const companies = useCompaniesStore();

/* ── Modo claro/oscuro ─────────────────────────────── */
const isDark = ref($q.dark.isActive);
const toggleDark = () => {
  $q.dark.toggle();
  isDark.value = $q.dark.isActive;
};
// Sincroniza si Quasar cambia el modo externamente
watch(() => $q.dark.isActive, (v) => { isDark.value = v; });

/* ── Estado UI ─────────────────────────────────────── */
const dlgOpen    = ref(false);
const editRow    = ref(null);
const search     = ref("");
const statusFilter = ref("all");
const currentPage  = ref(1);
const pageSize     = ref(10);
const sortBy       = ref("name");
const sortDesc     = ref(false);

const statusOpts = [
  { label: "Todas",       value: "all",       icon: "apps"         },
  { label: "Activas",     value: "active",    icon: "check_circle" },
  { label: "Inactivas",   value: "inactive",  icon: "pause_circle" },
  { label: "Suspendidas", value: "suspended", icon: "error"        },
];

/* ── Columnas ──────────────────────────────────────── */
const columns = [
  { name: "name",      label: "Empresa",    align: "left",  sortable: true  },
  { name: "rut",       label: "RUT",        align: "left",  sortable: true  },
  { name: "status",    label: "Estado",     align: "left",  sortable: true  },
  { name: "createdAt", label: "Alta",       align: "left",  sortable: true  },
  { name: "actions",   label: "",           align: "right", sortable: false },
];

/* ── Datos base ────────────────────────────────────── */
const rawRows = computed(() => {
  const arr = companies.items || companies.empresas || companies.list || [];
  return Array.isArray(arr) ? arr : [];
});

/* ── KPIs ──────────────────────────────────────────── */
const totalCount     = computed(() => rawRows.value.length);
const activeCount    = computed(() => rawRows.value.filter(r => (r?.status||"").toLowerCase() === "active").length);
const inactiveCount  = computed(() => rawRows.value.filter(r => (r?.status||"").toLowerCase() === "inactive").length);
const suspendedCount = computed(() => rawRows.value.filter(r => (r?.status||"").toLowerCase() === "suspended").length);

const kpiCards = computed(() => [
  { key: "all",       label: "Total",       count: totalCount.value,     icon: "grid_view"    },
  { key: "active",    label: "Activas",     count: activeCount.value,    icon: "check_circle" },
  { key: "inactive",  label: "Inactivas",   count: inactiveCount.value,  icon: "pause_circle" },
  { key: "suspended", label: "Suspendidas", count: suspendedCount.value, icon: "report"       },
]);
const kpiPercent = (count) => totalCount.value ? Math.round((count / totalCount.value) * 100) : 0;

/* ── Filtro + ordenación ───────────────────────────── */
const filteredRows = computed(() => {
  let rows = rawRows.value;

  // Filtro por estado
  const st = (statusFilter.value || "all").toLowerCase();
  if (st !== "all") rows = rows.filter(r => (r?.status||"").toLowerCase() === st);

  // Búsqueda
  const q = search.value.trim().toLowerCase();
  if (q) rows = rows.filter(r =>
    (r.name||"").toLowerCase().includes(q) ||
    (r.rut||"").toLowerCase().includes(q)
  );

  // Orden
  rows = [...rows].sort((a, b) => {
    const av = (a[sortBy.value] || "").toString().toLowerCase();
    const bv = (b[sortBy.value] || "").toString().toLowerCase();
    return sortDesc.value ? bv.localeCompare(av) : av.localeCompare(bv);
  });

  return rows;
});

// Reinicia página al filtrar
watch([search, statusFilter], () => { currentPage.value = 1; });

const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));
const pageStart  = computed(() => (currentPage.value - 1) * pageSize.value);
const pageEnd    = computed(() => pageStart.value + pageSize.value);
const paginatedRows = computed(() => filteredRows.value.slice(pageStart.value, pageEnd.value));

/* ── Ordenación ────────────────────────────────────── */
const toggleSort = (col) => {
  if (sortBy.value === col) sortDesc.value = !sortDesc.value;
  else { sortBy.value = col; sortDesc.value = false; }
};
const sortIcon = (col) => {
  if (sortBy.value !== col) return "unfold_more";
  return sortDesc.value ? "expand_more" : "expand_less";
};

/* ── Helpers ───────────────────────────────────────── */
const statusNice  = (s) => ({ active: "Activa", inactive: "Inactiva", suspended: "Suspendida" }[(s||"").toLowerCase()] || s || "—");
const formatDate  = (d) => d ? new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/* ── Acciones ──────────────────────────────────────── */
const openCreate      = () => { editRow.value = null;  dlgOpen.value = true; };
const editarEmpresa   = (row) => { editRow.value = row; dlgOpen.value = true; };
const reload          = () => {};

const confirmEliminar = (row) => {
  $q.dialog({
    title: "Eliminar empresa",
    message: `¿Eliminar "${row?.name || "esta empresa"}"? Esta acción no se puede deshacer.`,
    cancel: true,
    ok: { label: "Eliminar", color: "negative" },
  }).onOk(async () => {
    try {
      await companies.removeCompany(row._id);
      $q.notify({ type: "positive", message: "Empresa eliminada", position: "top-right" });
      await loadCompanies();
    } catch (err) {
      console.error(err);
      $q.notify({ type: "negative", message: "No se pudo eliminar", position: "top-right" });
    }
  });
};

/* ── Excel ─────────────────────────────────────────── */
const exportExcel = () => {
  try {
    const data = filteredRows.value.map(r => ({
      Nombre:           r.name || "",
      RUT:              r.rut  || "",
      Estado:           statusNice(r.status),
      "Fecha creación": r.createdAt ? new Date(r.createdAt) : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data, { cellDates: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Empresas");
    XLSX.writeFile(wb, `empresas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch {
    $q.notify({ type: "negative", message: "No se pudo exportar a Excel" });
  }
};

/* ── Carga ─────────────────────────────────────────── */
const loadCompanies = async () => {
  try { await companies.fetchCompanies(); }
  catch (err) { console.error("[loadCompanies] error:", err); }
};

onMounted(() => { loadCompanies(); initSticky(); });

/* ── Sticky toolbar ────────────────────────────────── */
const toolbarRef      = ref(null);
const toolbarSentinel = ref(null);
const stickyToolbar   = ref(false);
let observer;
const initSticky = () => {
  observer = new IntersectionObserver(
    (entries) => { stickyToolbar.value = !entries[0].isIntersecting; },
    { root: null, threshold: 0 }
  );
  if (toolbarSentinel.value) observer.observe(toolbarSentinel.value);
};
onBeforeUnmount(() => {
  if (observer && toolbarSentinel.value) observer.unobserve(toolbarSentinel.value);
});
</script>

<style scoped>
/* ══════════════════════════════════════════════════════
   TOKENS
══════════════════════════════════════════════════════ */
.rk-page {
  --c-bg:        #f0f2f7;
  --c-surface:   #ffffff;
  --c-surface2:  #f7f8fc;
  --c-border:    rgba(0,0,0,0.08);
  --c-text:      #0f1117;
  --c-text2:     #5a6482;
  --c-text3:     #9aa1b9;
  --c-primary:   #3d6fff;
  --c-primary-l: rgba(61,111,255,0.12);
  --c-ok:        #16a34a;
  --c-ok-l:      rgba(22,163,74,0.12);
  --c-warn:      #d97706;
  --c-warn-l:    rgba(217,119,6,0.12);
  --c-err:       #dc2626;
  --c-err-l:     rgba(220,38,38,0.12);
  --c-all:       #6366f1;
  --c-all-l:     rgba(99,102,241,0.12);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  --shadow-lg:   0 12px 36px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05);
  --radius-sm:   8px;
  --radius-md:   14px;
  --radius-lg:   20px;
  --ff-body:     'DM Sans', 'Segoe UI', system-ui, sans-serif;
  --ff-mono:     'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  --ff-display:  'Sora', 'DM Sans', system-ui, sans-serif;
  font-family: var(--ff-body);
  min-height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  padding: 28px 32px 60px;
  position: relative;
  overflow-x: hidden;
  transition: background 0.3s, color 0.3s;
}

/* Dark mode */
.rk-page.is-dark {
  --c-bg:        #0c0e14;
  --c-surface:   #141720;
  --c-surface2:  #1a1e2a;
  --c-border:    rgba(255,255,255,0.07);
  --c-text:      #e8eaf2;
  --c-text2:     #8b92ad;
  --c-text3:     #555d78;
  --c-primary-l: rgba(61,111,255,0.18);
  --c-ok-l:      rgba(22,163,74,0.18);
  --c-warn-l:    rgba(217,119,6,0.18);
  --c-err-l:     rgba(220,38,38,0.18);
  --c-all-l:     rgba(99,102,241,0.18);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.3);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.4);
  --shadow-lg:   0 12px 36px rgba(0,0,0,0.5);
}

/* ══════════════════════════════════════════════════════
   FONDO DECORATIVO
══════════════════════════════════════════════════════ */
.rk-bg-mesh {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.mesh-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
}
.rk-page:not(.is-dark) .mesh-orb { opacity: 0.18; }
.orb-1 { width: 600px; height: 600px; top: -200px; right: -100px; background: var(--c-primary); }
.orb-2 { width: 400px; height: 400px; bottom: 100px; left: -150px; background: var(--c-all); }
.orb-3 { width: 300px; height: 300px; top: 40%; left: 40%; background: var(--c-ok); }
.mesh-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--c-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--c-border) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.5;
}

/* ══════════════════════════════════════════════════════
   HEADER
══════════════════════════════════════════════════════ */
.rk-header-wrap {
  position: relative;
  z-index: 1;
  margin-bottom: 28px;
}
.rk-header-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}
.rk-header-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 8px 24px rgba(61,111,255,0.35);
  flex-shrink: 0;
}
.rk-title {
  font-family: var(--ff-display);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin: 0 0 2px;
  line-height: 1.2;
}
.rk-subtitle {
  font-size: 13.5px;
  color: var(--c-text2);
  margin: 0;
  line-height: 1.4;
}
.rk-accent {
  color: var(--c-primary);
  font-weight: 600;
}
.rk-mode-toggle,
.rk-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px !important;
  background: var(--c-surface) !important;
  border: 1px solid var(--c-border) !important;
  color: var(--c-text) !important;
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s, box-shadow 0.15s;
}
.rk-mode-toggle:hover,
.rk-icon-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* ══════════════════════════════════════════════════════
   KPI CARDS
══════════════════════════════════════════════════════ */
.rk-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  position: relative;
  z-index: 1;
}
@media (max-width: 900px) {
  .rk-kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 500px) {
  .rk-kpi-grid { grid-template-columns: 1fr; }
}

.rk-kpi {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  padding: 18px 18px 14px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rk-kpi:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

.kpi-all    { --kpi-c: var(--c-all);    --kpi-cl: var(--c-all-l); }
.kpi-active { --kpi-c: var(--c-ok);     --kpi-cl: var(--c-ok-l);  }
.kpi-inactive { --kpi-c: var(--c-warn); --kpi-cl: var(--c-warn-l);}
.kpi-suspended { --kpi-c: var(--c-err); --kpi-cl: var(--c-err-l); }

.rk-kpi[class*="statusFilter"] { border-color: var(--kpi-c); }

.kpi-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--kpi-cl);
  color: var(--kpi-c);
  display: flex;
  align-items: center;
  justify-content: center;
}
.kpi-body { flex: 1; }
.kpi-count {
  font-family: var(--ff-display);
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: var(--c-text);
  letter-spacing: -1px;
}
.kpi-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--c-text2);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-top: 4px;
}
.kpi-bar {
  height: 3px;
  background: var(--c-border);
  border-radius: 999px;
  overflow: hidden;
}
.kpi-bar-fill {
  height: 100%;
  background: var(--kpi-c);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.kpi-active-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--kpi-c);
  box-shadow: 0 0 0 3px var(--kpi-cl);
}

/* ══════════════════════════════════════════════════════
   TOOLBAR
══════════════════════════════════════════════════════ */
.rk-sentinel { height: 1px; }
.rk-toolbar {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 5;
  transition: box-shadow 0.2s, top 0.2s;
}
.rk-toolbar.is-sticky {
  position: sticky;
  top: 56px;
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-sm);
}

/* Status tabs */
.rk-status-tabs {
  display: flex;
  gap: 4px;
  background: var(--c-surface2);
  border-radius: 10px;
  padding: 4px;
  border: 1px solid var(--c-border);
}
.rk-tab {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--c-text2);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  font-family: var(--ff-body);
}
.rk-tab:hover { color: var(--c-text); background: var(--c-border); }
.rk-tab.active {
  background: var(--c-surface);
  color: var(--c-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

/* Search */
.rk-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--c-surface2);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 6px 12px;
  min-width: 220px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.rk-search-wrap:focus-within {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px var(--c-primary-l);
}
.rk-search-icon { color: var(--c-text3); flex-shrink: 0; }
.rk-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: var(--c-text);
  font-family: var(--ff-body);
  flex: 1;
  min-width: 0;
}
.rk-search-input::placeholder { color: var(--c-text3); }
.rk-search-clear { color: var(--c-text3); cursor: pointer; }
.rk-search-clear:hover { color: var(--c-text); }

/* Botones toolbar */
.rk-btn-export {
  width: 36px !important;
  height: 36px !important;
  border-radius: 10px !important;
  background: var(--c-ok-l) !important;
  color: var(--c-ok) !important;
  border: 1px solid rgba(22,163,74,0.2) !important;
  transition: transform 0.15s, box-shadow 0.15s;
}
.rk-btn-export:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(22,163,74,0.2); }

.rk-btn-new {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 10px;
  border: none;
  background: var(--c-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--ff-body);
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(61,111,255,0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}
.rk-btn-new:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(61,111,255,0.4); }

/* ══════════════════════════════════════════════════════
   TABLA WRAP
══════════════════════════════════════════════════════ */
.rk-table-wrap {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  position: relative;
  z-index: 1;
}

/* ── Skeleton ── */
.rk-skeleton-list { padding: 12px 0; }
.rk-skeleton-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--c-border);
}
.rk-skeleton-row:last-child { border-bottom: none; }
.skel {
  background: linear-gradient(90deg, var(--c-border) 25%, var(--c-surface2) 50%, var(--c-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}
.skel-avatar  { width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; }
.skel-text    { height: 12px; flex: 1; }
.skel-short   { flex: 0.4; }
.skel-badge   { width: 70px; height: 22px; border-radius: 999px; }
.skel-actions { width: 60px; height: 28px; }
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Empty ── */
.rk-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;
  gap: 8px;
}
.rk-empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: var(--c-surface2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text3);
  margin-bottom: 8px;
}
.rk-empty-title { font-size: 16px; font-weight: 700; color: var(--c-text); }
.rk-empty-msg   { font-size: 13.5px; color: var(--c-text2); text-align: center; max-width: 320px; }

/* ── Tabla ── */
.rk-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.rk-th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--c-text3);
  background: var(--c-surface2);
  border-bottom: 1px solid var(--c-border);
  white-space: nowrap;
  user-select: none;
}
.rk-th--right { text-align: right; }
.rk-th.sortable { cursor: pointer; }
.rk-th.sortable:hover { color: var(--c-text); }
.th-content { display: inline-flex; align-items: center; gap: 4px; }
.sort-arrows .q-icon { color: var(--c-text3); transition: color 0.15s; }
.sort-arrows .q-icon.active { color: var(--c-primary); }

.rk-tr {
  border-bottom: 1px solid var(--c-border);
  animation: rowIn 0.25s ease both;
  transition: background 0.12s;
}
.rk-tr:last-child { border-bottom: none; }
.rk-tr:hover { background: var(--c-surface2); }

@keyframes rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}

.rk-td {
  padding: 13px 16px;
  color: var(--c-text);
  vertical-align: middle;
}
.rk-td--right { text-align: right; }
.rk-mono { font-family: var(--ff-mono); font-size: 12.5px; color: var(--c-text2); }
.rk-date { font-size: 12.5px; color: var(--c-text2); }

/* Cell: nombre */
.cell-name { display: flex; align-items: center; gap: 12px; }
.name-avatar {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  overflow: hidden;
  background: var(--c-primary-l);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.name-avatar img { width: 100%; height: 100%; object-fit: cover; }
.name-initial { font-size: 15px; font-weight: 700; color: var(--c-primary); }
.name-main { font-weight: 600; line-height: 1.2; }
.name-sub  { font-size: 11.5px; color: var(--c-text3); margin-top: 2px; }

/* Badge */
.rk-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%; }
.badge-active    { background: var(--c-ok-l);   color: var(--c-ok);   }
.badge-active    .badge-dot { background: var(--c-ok); }
.badge-inactive  { background: var(--c-warn-l); color: var(--c-warn); }
.badge-inactive  .badge-dot { background: var(--c-warn); }
.badge-suspended { background: var(--c-err-l);  color: var(--c-err);  }
.badge-suspended .badge-dot { background: var(--c-err); }

/* Acciones */
.cell-actions { display: inline-flex; align-items: center; gap: 4px; }
.act-btn {
  width: 30px; height: 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, transform 0.12s;
  background: transparent;
  color: var(--c-text2);
}
.act-edit:hover   { background: var(--c-primary-l); color: var(--c-primary); transform: scale(1.1); }
.act-delete:hover { background: var(--c-err-l);     color: var(--c-err);     transform: scale(1.1); }

/* ══════════════════════════════════════════════════════
   PAGINACIÓN
══════════════════════════════════════════════════════ */
.rk-pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid var(--c-border);
  background: var(--c-surface2);
  flex-wrap: wrap;
}
.page-info { font-size: 12.5px; color: var(--c-text2); flex: 1; }
.page-info strong { color: var(--c-text); }
.page-controls { display: flex; gap: 4px; align-items: center; }
.page-btn {
  min-width: 30px;
  height: 30px;
  padding: 0 6px;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: var(--c-surface);
  color: var(--c-text2);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  font-family: var(--ff-body);
}
.page-btn:hover:not(:disabled) { border-color: var(--c-primary); color: var(--c-primary); }
.page-btn.active { background: var(--c-primary); color: #fff; border-color: var(--c-primary); }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.page-size-select {
  font-size: 12.5px;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 4px 8px;
  background: var(--c-surface);
  color: var(--c-text);
  cursor: pointer;
  font-family: var(--ff-body);
  outline: none;
}
.page-size-select:focus { border-color: var(--c-primary); }

/* ══════════════════════════════════════════════════════
   TRANSITIONS
══════════════════════════════════════════════════════ */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
