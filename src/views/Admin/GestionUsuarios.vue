<!-- src/views/Admin/UsersPage.vue -->
<template>
  <q-page class="rk-page rk-page--users" :class="{ 'is-dark': isDark }">

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
          <q-icon name="group" size="26px" />
        </div>
        <div class="rk-header-text">
          <h1 class="rk-title">Usuarios</h1>
          <p class="rk-subtitle">
            Administre cuentas,
            <span class="rk-accent">roles</span> y
            <span class="rk-accent">estados</span>. Busque, filtre y exporte.
          </p>
        </div>
        <div class="rk-header-actions q-ml-auto row items-center q-gutter-sm">
          <q-btn
            :icon="isDark ? 'light_mode' : 'dark_mode'"
            round unelevated
            class="rk-mode-toggle"
            :aria-label="isDark ? 'Modo claro' : 'Modo oscuro'"
            @click="toggleDark"
          >
            <q-tooltip>{{ isDark ? 'Modo claro' : 'Modo oscuro' }}</q-tooltip>
          </q-btn>
          <q-btn round unelevated icon="help_outline" class="rk-icon-btn" :to="{ name: 'help.users' }">
            <q-tooltip>Ayuda</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- ===== KPI Cards ===== -->
    <div class="rk-kpi-grid q-mb-lg">
      <div
        v-for="kpi in kpiCards"
        :key="kpi.key"
        class="rk-kpi"
        :class="`kpi-${kpi.key}`"
        @click="setStatusFilter(kpi.key)"
      >
        <div class="kpi-icon-wrap">
          <q-icon :name="kpi.icon" size="22px" />
        </div>
        <div class="kpi-body">
          <div class="kpi-count">{{ kpi.count }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </div>
        <div class="kpi-bar">
          <div class="kpi-bar-fill" :style="{ width: kpiPercent(kpi.count) + '%' }" />
        </div>
        <div v-if="activeStatusFilter === kpi.key" class="kpi-active-dot" />
      </div>
    </div>

    <!-- ===== Toolbar (sticky) ===== -->
    <div ref="toolbarSentinel" class="rk-sentinel" />
    <div
      ref="toolbarRef"
      class="rk-toolbar q-mb-md"
      :class="{ 'is-sticky': stickyToolbar }"
    >
      <div class="row items-center no-wrap full-width" style="gap:10px; flex-wrap:wrap;">

        <!-- Buscador -->
        <div class="rk-search-wrap">
          <q-icon name="search" size="16px" class="rk-search-icon" />
          <input
            v-model="filters.q"
            class="rk-search-input"
            placeholder="Nombre, correo o RUT…"
            autocomplete="off"
            @input="onFilterInput"
          />
          <transition name="fade">
            <q-icon v-if="filters.q" name="close" size="14px" class="rk-search-clear" @click="filters.q=''; onFilterInput()" />
          </transition>
        </div>

        <!-- Rol -->
        <div class="rk-select-wrap">
          <q-icon name="verified_user" size="14px" class="rk-select-icon" />
          <select v-model="filters.role" class="rk-select" @change="onFilterInput">
            <option value="">Todos los roles</option>
            <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <q-icon name="expand_more" size="14px" class="rk-select-arrow" />
        </div>

        <!-- Empresa -->
        <div class="rk-select-wrap rk-select-wide">
          <q-icon name="business" size="14px" class="rk-select-icon" />
          <select v-model="filters.company" class="rk-select" @change="onFilterInput">
            <option value="">Todas las empresas</option>
            <option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
          <q-icon name="expand_more" size="14px" class="rk-select-arrow" />
        </div>

        <div style="flex:1" />

        <!-- Acciones -->
        <button
          class="rk-btn-icon rk-btn-danger"
          :disabled="!selected.length"
          :title="`Eliminar ${selected.length} seleccionados`"
          @click="confirmBulkDelete"
        >
          <q-icon name="delete_sweep" size="16px" />
          <span v-if="selected.length" class="btn-badge">{{ selected.length }}</span>
        </button>
        <button class="rk-btn-icon rk-btn-export" @click="exportExcel" title="Exportar Excel">
          <q-icon name="file_download" size="16px" />
        </button>
        <button class="rk-btn-new" @click="abrirDialogoNuevo">
          <q-icon name="person_add" size="16px" />
          Nuevo usuario
        </button>
      </div>
    </div>

    <!-- ===== Tabla ===== -->
    <div class="rk-table-wrap">

      <!-- Loading skeleton -->
      <div v-if="loading" class="rk-skeleton-list">
        <div v-for="n in 6" :key="n" class="rk-skeleton-row">
          <div class="skel skel-check" />
          <div class="skel skel-avatar" />
          <div class="skel skel-text" style="flex:1.4" />
          <div class="skel skel-text skel-short" />
          <div class="skel skel-badge" />
          <div class="skel skel-badge" />
          <div class="skel skel-text skel-short" />
          <div class="skel skel-actions" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!paginatedRows.length" class="rk-empty">
        <div class="rk-empty-icon"><q-icon name="person_off" size="56px" /></div>
        <div class="rk-empty-title">Sin resultados</div>
        <div class="rk-empty-msg">
          {{ filters.q ? `No hay usuarios que coincidan con "${filters.q}"` : 'Aún no hay usuarios registrados.' }}
        </div>
        <button class="rk-btn-new q-mt-md" @click="abrirDialogoNuevo">
          <q-icon name="person_add" size="16px" />Nuevo usuario
        </button>
      </div>

      <!-- Tabla real -->
      <table v-else class="rk-table">
        <thead>
          <tr>
            <!-- Checkbox global -->
            <th class="rk-th rk-th-check">
              <label class="rk-checkbox">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  :indeterminate="someSelected"
                  @change="toggleSelectAll"
                />
                <span class="rk-checkmark" />
              </label>
            </th>
            <th
              v-for="col in columns"
              :key="col.name"
              :class="['rk-th', `rk-th--${col.align||'left'}`, col.sortable && 'sortable']"
              @click="col.sortable && toggleSort(col.name)"
            >
              <span class="th-content">
                {{ col.label }}
                <span v-if="col.sortable" class="sort-arrows">
                  <q-icon :name="sortIcon(col.name)" size="13px" :class="{ active: sortBy === col.name }" />
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
            :class="{ 'is-selected': isSelected(row), 'is-new': row._id === lastCreatedId }"
            :style="{ animationDelay: idx * 25 + 'ms' }"
            @dblclick="editar(row)"
          >
            <!-- Checkbox -->
            <td class="rk-td rk-td-check">
              <label class="rk-checkbox">
                <input type="checkbox" :checked="isSelected(row)" @change="toggleSelect(row)" />
                <span class="rk-checkmark" />
              </label>
            </td>

            <!-- Usuario -->
            <td class="rk-td">
              <div class="cell-user">
                <div class="user-avatar" :style="{ background: avatarColor(row.firstName) }">
                  {{ initials(row.firstName, row.lastName) }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ row.firstName }} {{ row.lastName }}</div>
                  <div class="user-email">{{ row.email }}</div>
                </div>
              </div>
            </td>

            <!-- Empresa -->
            <td class="rk-td">
              <div v-if="row.company?.name" class="cell-company">
                <q-icon name="apartment" size="13px" class="q-mr-xs" />
                {{ row.company.name }}
              </div>
              <span v-else class="rk-muted">—</span>
            </td>

            <!-- Rol -->
            <td class="rk-td">
              <span class="rk-badge" :class="`badge-role-${normalizeRole(row.role || row.tipo)}`">
                {{ roleNice(row.role || row.tipo) }}
              </span>
            </td>

            <!-- Estado -->
            <td class="rk-td">
              <span class="rk-badge" :class="`badge-${row.status}`">
                <span class="badge-dot" />
                {{ statusNice(row.status) }}
              </span>
            </td>

            <!-- Último acceso -->
            <td class="rk-td rk-date">{{ formatDate(row.lastLogin) }}</td>

            <!-- Acciones -->
            <td class="rk-td rk-td--right">
              <div class="cell-actions">
                <button class="act-btn act-view" @click="ver(row)" title="Ver detalle">
                  <q-icon name="visibility" size="15px" />
                  <q-tooltip>Ver</q-tooltip>
                </button>
                <button class="act-btn act-edit" @click="editar(row)" title="Editar">
                  <q-icon name="edit" size="15px" />
                  <q-tooltip>Editar</q-tooltip>
                </button>
                <button class="act-btn act-delete" @click="confirmDelete(row)" title="Eliminar">
                  <q-icon name="delete_outline" size="15px" />
                  <q-tooltip>Eliminar</q-tooltip>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Paginación + bottom bar -->
      <div v-if="filteredRows.length" class="rk-pagination">
        <div class="page-info">
          <span v-if="selected.length" class="sel-badge">{{ selected.length }} seleccionados</span>
          Mostrando <strong>{{ pageStart + 1 }}–{{ Math.min(pageEnd, filteredRows.length) }}</strong>
          de <strong>{{ filteredRows.length }}</strong>
        </div>
        <div class="page-controls">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
            <q-icon name="chevron_left" size="16px" />
          </button>
          <button
            v-for="p in visiblePages"
            :key="p"
            class="page-btn"
            :class="{ active: p === currentPage, ellipsis: p === '…' }"
            :disabled="p === '…'"
            @click="p !== '…' && (currentPage = p)"
          >{{ p }}</button>
          <button class="page-btn" :disabled="currentPage === pageCount" @click="currentPage++">
            <q-icon name="chevron_right" size="16px" />
          </button>
        </div>
        <div class="page-size">
          <select v-model="pageSize" class="page-size-select" @change="currentPage=1">
            <option v-for="n in [10, 20, 50, 100]" :key="n" :value="n">{{ n }} / página</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ===== Diálogos ===== -->
    <UserCreation
      v-model="dialogoNuevo"
      :empresas="empresas"
      :horarios="horarios"
      @guardar="guardarUsuario"
      @saved="onUserSaved"
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useQuasar } from "quasar";
import { useUserStore } from "@/stores/userStore";
import { useCompaniesStore } from "@/stores/companies";
import UserCreation from "@/components/UserCreation.vue";
import EditUserDialog from "@/components/EditUserDialog.vue";

const $q = useQuasar();
const userStore = useUserStore();
const companiesStore = useCompaniesStore();

/* ── Dark mode ───────────────────────────────────── */
const isDark = ref($q.dark.isActive);
const toggleDark = () => { $q.dark.toggle(); isDark.value = $q.dark.isActive; };
watch(() => $q.dark.isActive, (v) => { isDark.value = v; });

/* ── Estado UI ───────────────────────────────────── */
const loading        = ref(false);
const dialogoNuevo   = ref(false);
const dialogoEditar  = ref(false);
const userIdEditar   = ref(null);
const lastCreatedId  = ref(null);
const selected       = ref([]);
const currentPage    = ref(1);
const pageSize       = ref(20);
const sortBy         = ref("createdAt");
const sortDesc       = ref(true);
const activeStatusFilter = ref("all");

const filters = ref({ q: "", role: "", company: "" });

/* ── Datos ───────────────────────────────────────── */
const empresas = ref([]);
const horarios = ref([]);

/* ── Columnas ────────────────────────────────────── */
const columns = [
  { name: "name",      label: "Usuario",       align: "left",   sortable: true  },
  { name: "company",   label: "Empresa",       align: "left",   sortable: true  },
  { name: "role",      label: "Rol",           align: "left",   sortable: true  },
  { name: "status",    label: "Estado",        align: "left",   sortable: true  },
  { name: "lastLogin", label: "Último acceso", align: "left",   sortable: true  },
  { name: "actions",   label: "",              align: "right",  sortable: false },
];

/* ── Raw rows ────────────────────────────────────── */
const rawRows = computed(() => {
  const arr = userStore.users || [];
  return Array.isArray(arr) ? arr.map(x => ({ ...x, role: x.role || x.tipo })) : [];
});

/* ── KPIs ────────────────────────────────────────── */
const total          = computed(() => rawRows.value.length);
const activeCount    = computed(() => rawRows.value.filter(r => (r.status||"").toLowerCase() === "active").length);
const inactiveCount  = computed(() => rawRows.value.filter(r => (r.status||"").toLowerCase() === "inactive").length);
const suspendedCount = computed(() => rawRows.value.filter(r => (r.status||"").toLowerCase() === "suspended").length);

const kpiCards = computed(() => [
  { key: "all",       label: "Total",       count: total.value,          icon: "group"        },
  { key: "active",    label: "Activos",     count: activeCount.value,    icon: "how_to_reg"   },
  { key: "inactive",  label: "Inactivos",   count: inactiveCount.value,  icon: "person_off"   },
  { key: "suspended", label: "Suspendidos", count: suspendedCount.value, icon: "block"        },
]);
const kpiPercent = (count) => total.value ? Math.round((count / total.value) * 100) : 0;
const setStatusFilter = (key) => { activeStatusFilter.value = key; currentPage.value = 1; };

/* ── Filtrado + ordenación ───────────────────────── */
const filteredRows = computed(() => {
  let rows = rawRows.value;

  // Estado
  if (activeStatusFilter.value !== "all")
    rows = rows.filter(r => (r.status||"").toLowerCase() === activeStatusFilter.value);

  // Búsqueda
  const q = filters.value.q.trim().toLowerCase();
  if (q) rows = rows.filter(r =>
    [r.firstName, r.lastName, r.email, r.rut].filter(Boolean)
      .some(s => String(s).toLowerCase().includes(q))
  );

  // Rol
  if (filters.value.role)
    rows = rows.filter(r => r.role === filters.value.role || r.tipo === filters.value.role);

  // Empresa
  if (filters.value.company)
    rows = rows.filter(r => r.company?._id === filters.value.company || r.company?.id === filters.value.company);

  // Ordenación
  rows = [...rows].sort((a, b) => {
    let av, bv;
    if (sortBy.value === "name")      { av = `${a.firstName} ${a.lastName}`; bv = `${b.firstName} ${b.lastName}`; }
    else if (sortBy.value === "company") { av = a.company?.name||""; bv = b.company?.name||""; }
    else if (sortBy.value === "lastLogin") { av = new Date(a.lastLogin||0); bv = new Date(b.lastLogin||0); return sortDesc.value ? bv-av : av-bv; }
    else { av = a[sortBy.value]||""; bv = b[sortBy.value]||""; }
    return sortDesc.value
      ? bv.toString().localeCompare(av.toString())
      : av.toString().localeCompare(bv.toString());
  });

  return rows;
});

watch([() => filters.value.q, () => filters.value.role, () => filters.value.company, activeStatusFilter], () => {
  currentPage.value = 1;
});

const pageCount     = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));
const pageStart     = computed(() => (currentPage.value - 1) * pageSize.value);
const pageEnd       = computed(() => pageStart.value + pageSize.value);
const paginatedRows = computed(() => filteredRows.value.slice(pageStart.value, pageEnd.value));

// Páginas visibles con elipsis
const visiblePages = computed(() => {
  const total = pageCount.value;
  const cur   = currentPage.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (cur > 3) pages.push("…");
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
  if (cur < total - 2) pages.push("…");
  pages.push(total);
  return pages;
});

/* ── Ordenación ──────────────────────────────────── */
const toggleSort = (col) => {
  if (sortBy.value === col) sortDesc.value = !sortDesc.value;
  else { sortBy.value = col; sortDesc.value = false; }
};
const sortIcon = (col) => {
  if (sortBy.value !== col) return "unfold_more";
  return sortDesc.value ? "expand_more" : "expand_less";
};

/* ── Selección ───────────────────────────────────── */
const isSelected      = (row) => selected.value.some(r => r._id === row._id);
const toggleSelect    = (row) => {
  const idx = selected.value.findIndex(r => r._id === row._id);
  if (idx >= 0) selected.value.splice(idx, 1); else selected.value.push(row);
};
const allSelected  = computed(() => paginatedRows.value.length > 0 && paginatedRows.value.every(r => isSelected(r)));
const someSelected = computed(() => paginatedRows.value.some(r => isSelected(r)) && !allSelected.value);
const toggleSelectAll = () => {
  if (allSelected.value) {
    selected.value = selected.value.filter(r => !paginatedRows.value.some(p => p._id === r._id));
  } else {
    paginatedRows.value.forEach(r => { if (!isSelected(r)) selected.value.push(r); });
  }
};

/* ── Helpers ─────────────────────────────────────── */
const normalizeRole = (r) => r === "empresa" ? "company" : r === "empleado" ? "employee" : r || "unknown";
const roleNice = (r) => ({
  admin: "Admin", company: "Empresa", employee: "Empleado",
  supervisor: "Supervisor", empresa: "Empresa", empleado: "Empleado",
}[r] || r || "—");
const statusNice  = (s) => ({ active: "Activo", inactive: "Inactivo", suspended: "Suspendido" }[s] || s || "—");
const initials    = (fn="", ln="") => ((fn?.[0]||"") + (ln?.[0]||"") || "U").toUpperCase();
const formatDate  = (d) => {
  if (!d) return "—";
  try { return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d)); }
  catch { return "—"; }
};

// Color avatar determinístico
const AVATAR_COLORS = ["#3d6fff","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899"];
const avatarColor = (name="") => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const roleOptions = [
  { label: "Admin",      value: "admin"      },
  { label: "Empleado",   value: "employee"   },
  { label: "Supervisor", value: "supervisor" },
  { label: "Empresa",    value: "company"    },
];

/* ── Debounce ────────────────────────────────────── */
let _t = null;
const onFilterInput = () => { clearTimeout(_t); _t = setTimeout(() => { currentPage.value = 1; }, 200); };

/* ── Acciones ────────────────────────────────────── */
const reload = async () => {
  loading.value = true;
  try { await userStore.fetchUsers(); }
  catch { $q.notify({ type: "negative", message: "Error al cargar usuarios", position: "top-right" }); }
  finally { loading.value = false; }
};

const abrirDialogoNuevo = () => { dialogoNuevo.value = true; };
const guardarUsuario    = async () => { dialogoNuevo.value = false; reload(); };

const ver = (row) => {
  $q.notify({ message: `${row.firstName} ${row.lastName}`, color: "info", position: "top-right" });
};

const editar = (row) => {
  const id = row?._id;
  if (!id) return;
  userIdEditar.value = id;
  dialogoEditar.value = true;
};

const confirmDelete = (row) => {
  $q.dialog({
    title: "Eliminar usuario",
    message: `¿Eliminar a ${row.firstName} ${row.lastName}?`,
    ok: { label: "Eliminar", color: "negative" },
    cancel: { label: "Cancelar" },
  }).onOk(async () => { await eliminarUsuario(row._id); });
};

const confirmBulkDelete = () => {
  if (!selected.value.length) return;
  $q.dialog({
    title: "Eliminar usuarios",
    message: `¿Eliminar ${selected.value.length} usuario(s) seleccionados?`,
    ok: { label: "Eliminar", color: "negative" },
    cancel: { label: "Cancelar" },
  }).onOk(async () => {
    for (const r of selected.value) await eliminarUsuario(r._id);
    selected.value = [];
  });
};

const eliminarUsuario = async (id) => {
  try {
    await userStore.deleteUser(id);
    $q.notify({ type: "positive", message: "Usuario eliminado", position: "top-right" });
    await reload();
  } catch {
    $q.notify({ type: "negative", message: "No se pudo eliminar", position: "top-right" });
  }
};

const exportExcel = () => {
  try {
    const data = filteredRows.value.map(u => ({
      Nombre:            `${u.firstName||""} ${u.lastName||""}`.trim(),
      Email:             u.email || "",
      RUT:               u.rut   || "",
      Rol:               roleNice(u.role || u.tipo),
      Estado:            statusNice(u.status),
      Empresa:           u.company?.name || "",
      "Último acceso":   u.lastLogin ? new Date(u.lastLogin) : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data, { cellDates: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, `usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch {
    $q.notify({ type: "negative", message: "No se pudo exportar a Excel" });
  }
};

const onUserSaved = async (u) => {
  dialogoNuevo.value = false;
  userStore.upsertUser?.(u);
  lastCreatedId.value = u._id;
  await reload();
  currentPage.value = 1;
};

/* ── Sticky ──────────────────────────────────────── */
const toolbarRef      = ref(null);
const toolbarSentinel = ref(null);
const stickyToolbar   = ref(false);
let observer;

onMounted(async () => {
  await reload();
  observer = new IntersectionObserver(
    (entries) => { stickyToolbar.value = !entries[0].isIntersecting; },
    { root: null, threshold: 0 }
  );
  if (toolbarSentinel.value) observer.observe(toolbarSentinel.value);
});
onBeforeUnmount(() => {
  if (observer && toolbarSentinel.value) observer.unobserve(toolbarSentinel.value);
});
</script>

<style scoped>
/* ══════════════════════════════════════════════════
   TOKENS  (mismo sistema que CompaniesPage)
══════════════════════════════════════════════════ */
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
  --c-purple:    #8b5cf6;
  --c-purple-l:  rgba(139,92,246,0.12);
  --c-teal:      #0d9488;
  --c-teal-l:    rgba(13,148,136,0.12);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  --shadow-lg:   0 12px 36px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05);
  --radius-sm:   8px;
  --radius-md:   14px;
  --radius-lg:   20px;
  --ff-body:     'DM Sans', 'Segoe UI', system-ui, sans-serif;
  --ff-mono:     'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  --ff-display:  'Sora', 'DM Sans', system-ui, sans-serif;
  font-family:   var(--ff-body);
  min-height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  padding: 28px 32px 60px;
  position: relative;
  overflow-x: hidden;
  transition: background 0.3s, color 0.3s;
}
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
  --c-purple-l:  rgba(139,92,246,0.18);
  --c-teal-l:    rgba(13,148,136,0.18);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.3);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.4);
  --shadow-lg:   0 12px 36px rgba(0,0,0,0.5);
}

/* ══════════════════════════════════════════════════
   FONDO
══════════════════════════════════════════════════ */
.rk-bg-mesh { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
.mesh-orb { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.35; }
.rk-page:not(.is-dark) .mesh-orb { opacity:0.18; }
.orb-1 { width:600px; height:600px; top:-200px; right:-100px; background:var(--c-all); }
.orb-2 { width:400px; height:400px; bottom:100px; left:-150px; background:var(--c-primary); }
.orb-3 { width:300px; height:300px; top:40%; left:45%; background:var(--c-purple); }
.mesh-grid {
  position:absolute; inset:0;
  background-image: linear-gradient(var(--c-border) 1px, transparent 1px),
                    linear-gradient(90deg, var(--c-border) 1px, transparent 1px);
  background-size: 40px 40px; opacity:0.5;
}

/* ══════════════════════════════════════════════════
   HEADER
══════════════════════════════════════════════════ */
.rk-header-wrap { position:relative; z-index:1; margin-bottom:28px; }
.rk-header-inner { display:flex; align-items:center; gap:16px; }
.rk-header-icon {
  width:52px; height:52px; border-radius:16px;
  background:var(--c-all); color:#fff;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 8px 24px rgba(99,102,241,0.35); flex-shrink:0;
}
.rk-title { font-family:var(--ff-display); font-size:26px; font-weight:700; letter-spacing:-0.5px; margin:0 0 2px; line-height:1.2; }
.rk-subtitle { font-size:13.5px; color:var(--c-text2); margin:0; line-height:1.4; }
.rk-accent { color:var(--c-all); font-weight:600; }
.rk-mode-toggle, .rk-icon-btn {
  width:38px !important; height:38px !important;
  border-radius:12px !important;
  background:var(--c-surface) !important;
  border:1px solid var(--c-border) !important;
  color:var(--c-text) !important;
  box-shadow:var(--shadow-sm);
  transition:transform 0.15s, box-shadow 0.15s;
}
.rk-mode-toggle:hover, .rk-icon-btn:hover { transform:translateY(-1px); box-shadow:var(--shadow-md); }

/* ══════════════════════════════════════════════════
   KPI CARDS
══════════════════════════════════════════════════ */
.rk-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; position:relative; z-index:1; }
@media(max-width:900px){ .rk-kpi-grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:500px){ .rk-kpi-grid{ grid-template-columns:1fr; } }

.rk-kpi {
  background:var(--c-surface); border:1px solid var(--c-border);
  border-radius:var(--radius-md); padding:18px 18px 14px;
  cursor:pointer; position:relative; overflow:hidden;
  transition:transform 0.18s, box-shadow 0.18s;
  box-shadow:var(--shadow-sm);
  display:flex; flex-direction:column; gap:12px;
}
.rk-kpi:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); }

.kpi-all       { --kpi-c:var(--c-all);     --kpi-cl:var(--c-all-l);    }
.kpi-active    { --kpi-c:var(--c-ok);      --kpi-cl:var(--c-ok-l);     }
.kpi-inactive  { --kpi-c:var(--c-warn);    --kpi-cl:var(--c-warn-l);   }
.kpi-suspended { --kpi-c:var(--c-err);     --kpi-cl:var(--c-err-l);    }

.kpi-icon-wrap { width:40px; height:40px; border-radius:12px; background:var(--kpi-cl); color:var(--kpi-c); display:flex; align-items:center; justify-content:center; }
.kpi-count { font-family:var(--ff-display); font-size:28px; font-weight:700; line-height:1; letter-spacing:-1px; }
.kpi-label { font-size:12px; font-weight:500; color:var(--c-text2); text-transform:uppercase; letter-spacing:0.8px; margin-top:4px; }
.kpi-bar { height:3px; background:var(--c-border); border-radius:999px; overflow:hidden; }
.kpi-bar-fill { height:100%; background:var(--kpi-c); border-radius:999px; transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1); }
.kpi-active-dot { position:absolute; top:10px; right:10px; width:7px; height:7px; border-radius:50%; background:var(--kpi-c); box-shadow:0 0 0 3px var(--kpi-cl); }

/* ══════════════════════════════════════════════════
   TOOLBAR
══════════════════════════════════════════════════ */
.rk-sentinel { height:1px; }
.rk-toolbar {
  background:var(--c-surface); border:1px solid var(--c-border);
  border-radius:var(--radius-md); padding:10px 14px;
  box-shadow:var(--shadow-sm); position:relative; z-index:5;
  transition:box-shadow 0.2s;
}
.rk-toolbar.is-sticky {
  position:sticky; top:56px;
  box-shadow:var(--shadow-lg); border-radius:var(--radius-sm);
}

/* Search */
.rk-search-wrap {
  display:flex; align-items:center; gap:8px;
  background:var(--c-surface2); border:1px solid var(--c-border);
  border-radius:10px; padding:6px 12px; min-width:200px;
  transition:border-color 0.15s, box-shadow 0.15s;
}
.rk-search-wrap:focus-within { border-color:var(--c-all); box-shadow:0 0 0 3px var(--c-all-l); }
.rk-search-icon  { color:var(--c-text3); flex-shrink:0; }
.rk-search-input { border:none; background:transparent; outline:none; font-size:13px; color:var(--c-text); font-family:var(--ff-body); flex:1; min-width:0; }
.rk-search-input::placeholder { color:var(--c-text3); }
.rk-search-clear { color:var(--c-text3); cursor:pointer; }
.rk-search-clear:hover { color:var(--c-text); }

/* Selects */
.rk-select-wrap {
  display:flex; align-items:center; gap:6px; position:relative;
  background:var(--c-surface2); border:1px solid var(--c-border);
  border-radius:10px; padding:6px 10px; min-width:140px;
  transition:border-color 0.15s;
}
.rk-select-wrap:focus-within { border-color:var(--c-all); }
.rk-select-wide { min-width:180px; }
.rk-select-icon  { color:var(--c-text3); flex-shrink:0; }
.rk-select-arrow { color:var(--c-text3); flex-shrink:0; pointer-events:none; }
.rk-select {
  border:none; background:transparent; outline:none;
  font-size:13px; color:var(--c-text); font-family:var(--ff-body);
  flex:1; min-width:0; cursor:pointer; appearance:none;
}

/* Botones toolbar */
.rk-btn-icon {
  position:relative; width:36px; height:36px; border-radius:10px;
  border:1px solid var(--c-border); background:var(--c-surface2);
  color:var(--c-text2); cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:transform 0.15s, box-shadow 0.15s;
}
.rk-btn-icon:hover:not(:disabled) { transform:translateY(-1px); box-shadow:var(--shadow-md); }
.rk-btn-icon:disabled { opacity:0.35; cursor:not-allowed; }
.rk-btn-export { background:var(--c-ok-l); color:var(--c-ok); border-color:rgba(22,163,74,0.2); }
.rk-btn-export:hover { box-shadow:0 4px 12px rgba(22,163,74,0.25); }
.rk-btn-danger { background:var(--c-err-l); color:var(--c-err); border-color:rgba(220,38,38,0.2); }
.rk-btn-danger:hover:not(:disabled) { box-shadow:0 4px 12px rgba(220,38,38,0.25); }
.btn-badge {
  position:absolute; top:-5px; right:-5px;
  background:var(--c-err); color:#fff;
  font-size:10px; font-weight:700;
  width:16px; height:16px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
}
.rk-btn-new {
  display:inline-flex; align-items:center; gap:6px;
  padding:7px 16px; border-radius:10px; border:none;
  background:var(--c-all); color:#fff;
  font-size:13px; font-weight:600; font-family:var(--ff-body);
  cursor:pointer; box-shadow:0 4px 14px rgba(99,102,241,0.35);
  transition:transform 0.15s, box-shadow 0.15s;
  white-space:nowrap;
}
.rk-btn-new:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,0.4); }

/* ══════════════════════════════════════════════════
   TABLA WRAP
══════════════════════════════════════════════════ */
.rk-table-wrap {
  background:var(--c-surface); border:1px solid var(--c-border);
  border-radius:var(--radius-lg); overflow:hidden;
  box-shadow:var(--shadow-md); position:relative; z-index:1;
}

/* Skeleton */
.rk-skeleton-list { padding:8px 0; }
.rk-skeleton-row { display:flex; align-items:center; gap:14px; padding:14px 20px; border-bottom:1px solid var(--c-border); }
.rk-skeleton-row:last-child { border-bottom:none; }
.skel { background:linear-gradient(90deg,var(--c-border) 25%,var(--c-surface2) 50%,var(--c-border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
.skel-check   { width:16px; height:16px; border-radius:4px; flex-shrink:0; }
.skel-avatar  { width:34px; height:34px; border-radius:10px; flex-shrink:0; }
.skel-text    { height:12px; flex:1; }
.skel-short   { flex:0.35; }
.skel-badge   { width:70px; height:22px; border-radius:999px; flex-shrink:0; }
.skel-actions { width:80px; height:28px; flex-shrink:0; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Empty */
.rk-empty { display:flex; flex-direction:column; align-items:center; padding:64px 24px; gap:8px; }
.rk-empty-icon { width:80px; height:80px; border-radius:24px; background:var(--c-surface2); display:flex; align-items:center; justify-content:center; color:var(--c-text3); margin-bottom:8px; }
.rk-empty-title { font-size:16px; font-weight:700; }
.rk-empty-msg   { font-size:13.5px; color:var(--c-text2); text-align:center; max-width:320px; }

/* Tabla */
.rk-table { width:100%; border-collapse:collapse; font-size:13.5px; }
.rk-th {
  padding:11px 14px; text-align:left;
  font-size:11.5px; font-weight:600; letter-spacing:0.6px; text-transform:uppercase;
  color:var(--c-text3); background:var(--c-surface2);
  border-bottom:1px solid var(--c-border);
  white-space:nowrap; user-select:none;
}
.rk-th--right { text-align:right; }
.rk-th-check  { width:44px; text-align:center; }
.rk-th.sortable { cursor:pointer; }
.rk-th.sortable:hover { color:var(--c-text); }
.th-content { display:inline-flex; align-items:center; gap:4px; }
.sort-arrows .q-icon { color:var(--c-text3); transition:color 0.15s; }
.sort-arrows .q-icon.active { color:var(--c-all); }

.rk-tr { border-bottom:1px solid var(--c-border); animation:rowIn 0.25s ease both; transition:background 0.12s; cursor:default; }
.rk-tr:last-child { border-bottom:none; }
.rk-tr:hover { background:var(--c-surface2); }
.rk-tr.is-selected { background:var(--c-all-l); }
.rk-tr.is-new { animation:newRow 1.5s ease; }
@keyframes rowIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
@keyframes newRow { 0%,100%{background:transparent} 30%{background:var(--c-all-l)} }

.rk-td { padding:12px 14px; color:var(--c-text); vertical-align:middle; }
.rk-td-check { text-align:center; width:44px; }
.rk-td--right { text-align:right; }
.rk-muted { color:var(--c-text3); }
.rk-date  { font-size:12.5px; color:var(--c-text2); font-family:var(--ff-mono); }

/* Checkbox custom */
.rk-checkbox { position:relative; display:inline-flex; align-items:center; cursor:pointer; }
.rk-checkbox input { position:absolute; opacity:0; width:0; height:0; }
.rk-checkmark {
  width:16px; height:16px; border-radius:5px;
  border:1.5px solid var(--c-border);
  background:var(--c-surface);
  display:flex; align-items:center; justify-content:center;
  transition:background 0.12s, border-color 0.12s;
}
.rk-checkbox input:checked ~ .rk-checkmark { background:var(--c-all); border-color:var(--c-all); }
.rk-checkbox input:checked ~ .rk-checkmark::after {
  content:""; width:9px; height:5px;
  border-left:2px solid #fff; border-bottom:2px solid #fff;
  transform:rotate(-45deg) translateY(-1px);
}
.rk-checkbox input:indeterminate ~ .rk-checkmark { background:var(--c-all-l); border-color:var(--c-all); }
.rk-checkbox input:indeterminate ~ .rk-checkmark::after { content:""; width:8px; height:2px; background:var(--c-all); }

/* Cell: usuario */
.cell-user { display:flex; align-items:center; gap:12px; }
.user-avatar {
  width:36px; height:36px; border-radius:11px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:700; color:#fff; letter-spacing:0.5px;
}
.user-name  { font-weight:600; line-height:1.2; }
.user-email { font-size:11.5px; color:var(--c-text3); margin-top:2px; }

/* Cell: empresa */
.cell-company { display:inline-flex; align-items:center; font-size:12.5px; color:var(--c-text2); }

/* Badges rol */
.rk-badge { display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:600; letter-spacing:0.2px; }
.badge-dot { width:6px; height:6px; border-radius:50%; }

/* Estado */
.badge-active    { background:var(--c-ok-l);   color:var(--c-ok);   }
.badge-active    .badge-dot { background:var(--c-ok); }
.badge-inactive  { background:var(--c-warn-l); color:var(--c-warn); }
.badge-inactive  .badge-dot { background:var(--c-warn); }
.badge-suspended { background:var(--c-err-l);  color:var(--c-err);  }
.badge-suspended .badge-dot { background:var(--c-err); }

/* Rol */
.badge-role-admin      { background:var(--c-purple-l); color:var(--c-purple); }
.badge-role-company    { background:var(--c-all-l);    color:var(--c-all);    }
.badge-role-employee   { background:var(--c-teal-l);   color:var(--c-teal);   }
.badge-role-supervisor { background:var(--c-primary-l);color:var(--c-primary);}
.badge-role-unknown    { background:var(--c-border);   color:var(--c-text3);  }

/* Acciones */
.cell-actions { display:inline-flex; align-items:center; gap:4px; }
.act-btn { width:30px; height:30px; border:none; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; background:transparent; color:var(--c-text2); transition:background 0.12s, transform 0.12s; }
.act-view:hover   { background:var(--c-all-l);     color:var(--c-all);     transform:scale(1.1); }
.act-edit:hover   { background:var(--c-primary-l); color:var(--c-primary); transform:scale(1.1); }
.act-delete:hover { background:var(--c-err-l);     color:var(--c-err);     transform:scale(1.1); }

/* ══════════════════════════════════════════════════
   PAGINACIÓN
══════════════════════════════════════════════════ */
.rk-pagination {
  display:flex; align-items:center; gap:12px;
  padding:12px 20px; border-top:1px solid var(--c-border);
  background:var(--c-surface2); flex-wrap:wrap;
}
.page-info { font-size:12.5px; color:var(--c-text2); flex:1; display:flex; align-items:center; gap:8px; }
.page-info strong { color:var(--c-text); }
.sel-badge { background:var(--c-all-l); color:var(--c-all); font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px; }
.page-controls { display:flex; gap:4px; align-items:center; }
.page-btn {
  min-width:30px; height:30px; padding:0 6px;
  border:1px solid var(--c-border); border-radius:8px;
  background:var(--c-surface); color:var(--c-text2);
  font-size:12.5px; font-weight:500; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:background 0.12s, color 0.12s, border-color 0.12s;
  font-family:var(--ff-body);
}
.page-btn:hover:not(:disabled) { border-color:var(--c-all); color:var(--c-all); }
.page-btn.active { background:var(--c-all); color:#fff; border-color:var(--c-all); }
.page-btn.ellipsis { border:none; background:transparent; cursor:default; }
.page-btn:disabled { opacity:0.35; cursor:not-allowed; }
.page-size-select {
  font-size:12.5px; border:1px solid var(--c-border); border-radius:8px;
  padding:4px 8px; background:var(--c-surface); color:var(--c-text);
  cursor:pointer; font-family:var(--ff-body); outline:none;
}
.page-size-select:focus { border-color:var(--c-all); }

/* Transition */
.fade-enter-active,.fade-leave-active { transition:opacity 0.15s; }
.fade-enter-from,.fade-leave-to       { opacity:0; }
</style>
