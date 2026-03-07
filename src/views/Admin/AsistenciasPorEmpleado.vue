<!-- src/views/Attendance/AttendanceHistoryPage.vue -->
<template>
  <q-page class="rk-page" :class="{ 'is-dark': isDark }">

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
          <q-icon name="fact_check" size="26px" />
          <div class="rk-icon-pulse" />
        </div>
        <div class="rk-header-text">
          <h1 class="rk-title">Historial de Asistencias</h1>
          <p class="rk-subtitle">
            Registros detallados por
            <span class="rk-accent">colaborador</span> con timeline y exportación.
          </p>
        </div>
        <div class="rk-header-actions q-ml-auto row items-center q-gutter-sm">
          <q-btn
            :icon="isDark ? 'light_mode' : 'dark_mode'"
            round unelevated
            class="rk-mode-toggle"
            @click="toggleDark"
          >
            <q-tooltip>{{ isDark ? 'Modo claro' : 'Modo oscuro' }}</q-tooltip>
          </q-btn>
          <button
            class="rk-btn-refresh"
            :disabled="loading"
            @click="loadData"
          >
            <q-icon name="refresh" size="16px" :class="{ 'spin': loading }" />
            Actualizar
          </button>
        </div>
      </div>
    </div>

    <!-- ===== KPI Cards ===== -->
    <div class="rk-kpi-grid q-mb-lg">
      <div class="rk-kpi kpi-total">
        <div class="kpi-icon-wrap"><q-icon name="groups" size="22px" /></div>
        <div class="kpi-body">
          <div class="kpi-count">{{ totalEmpleados }}</div>
          <div class="kpi-label">Colaboradores</div>
        </div>
        <div class="kpi-bar"><div class="kpi-bar-fill" style="width:100%" /></div>
      </div>
      <div class="rk-kpi kpi-marcas">
        <div class="kpi-icon-wrap"><q-icon name="fingerprint" size="22px" /></div>
        <div class="kpi-body">
          <div class="kpi-count">{{ totalMarcas }}</div>
          <div class="kpi-label">Total marcas</div>
        </div>
        <div class="kpi-bar"><div class="kpi-bar-fill" style="width:100%" /></div>
      </div>
      <div class="rk-kpi kpi-entradas">
        <div class="kpi-icon-wrap"><q-icon name="login" size="22px" /></div>
        <div class="kpi-body">
          <div class="kpi-count">{{ totalEntradas }}</div>
          <div class="kpi-label">Entradas hoy</div>
        </div>
        <div class="kpi-bar"><div class="kpi-bar-fill" :style="{ width: pctEntradas + '%' }" /></div>
      </div>
      <div class="rk-kpi kpi-salidas">
        <div class="kpi-icon-wrap"><q-icon name="logout" size="22px" /></div>
        <div class="kpi-body">
          <div class="kpi-count">{{ totalSalidas }}</div>
          <div class="kpi-label">Salidas hoy</div>
        </div>
        <div class="kpi-bar"><div class="kpi-bar-fill" :style="{ width: pctSalidas + '%' }" /></div>
      </div>
    </div>

    <!-- ===== Toolbar ===== -->
    <div ref="toolbarSentinel" class="rk-sentinel" />
    <div ref="toolbarRef" class="rk-toolbar q-mb-md" :class="{ 'is-sticky': stickyToolbar }">
      <div class="row items-center no-wrap full-width" style="gap:10px">
        <div class="rk-search-wrap">
          <q-icon name="search" size="16px" class="rk-search-icon" />
          <input
            v-model="search"
            class="rk-search-input"
            placeholder="Buscar por nombre o RUT…"
            autocomplete="off"
          />
          <transition name="fade">
            <q-icon v-if="search" name="close" size="14px" class="rk-search-clear" @click="search=''" />
          </transition>
        </div>
        <div style="flex:1" />
        <div class="rk-results-chip" v-if="!loading">
          <q-icon name="people" size="13px" />
          {{ filteredRows.length }} colaboradores
        </div>
      </div>
    </div>

    <!-- ===== Tabla principal ===== -->
    <div class="rk-table-wrap">

      <!-- Skeleton -->
      <div v-if="loading" class="rk-skeleton-list">
        <div v-for="n in 6" :key="n" class="rk-skeleton-row">
          <div class="skel skel-avatar" />
          <div class="skel skel-text" style="flex:1.5" />
          <div class="skel skel-text skel-short" />
          <div class="skel skel-badge" />
          <div class="skel skel-actions" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!filteredRows.length" class="rk-empty">
        <div class="rk-empty-icon"><q-icon name="event_busy" size="56px" /></div>
        <div class="rk-empty-title">Sin resultados</div>
        <div class="rk-empty-msg">
          {{ search ? `No hay colaboradores que coincidan con "${search}"` : 'No hay registros de asistencia.' }}
        </div>
      </div>

      <!-- Tabla -->
      <table v-else class="rk-table">
        <thead>
          <tr>
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
            :style="{ animationDelay: idx * 25 + 'ms' }"
          >
            <!-- Colaborador -->
            <td class="rk-td">
              <div class="cell-user">
                <div class="user-avatar" :style="{ background: avatarColor(row.nombre) }">
                  {{ (row.nombre||'?')[0].toUpperCase() }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ row.nombre || '—' }}</div>
                </div>
              </div>
            </td>

            <!-- RUT -->
            <td class="rk-td rk-mono">{{ row.rut || '—' }}</td>

            <!-- Total -->
            <td class="rk-td">
              <div class="cell-total">
                <span class="total-badge">
                  <q-icon name="event_available" size="13px" />
                  {{ row.total }}
                </span>
                <span class="total-label">días</span>
              </div>
            </td>

            <!-- Acciones -->
            <td class="rk-td rk-td--right">
              <button class="rk-btn-historial" @click="verHistorial(row)">
                <q-icon name="timeline" size="14px" />
                Ver historial
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Paginación -->
      <div v-if="filteredRows.length > pageSize" class="rk-pagination">
        <div class="page-info">
          Mostrando <strong>{{ pageStart + 1 }}–{{ Math.min(pageEnd, filteredRows.length) }}</strong>
          de <strong>{{ filteredRows.length }}</strong>
        </div>
        <div class="page-controls">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
            <q-icon name="chevron_left" size="16px" />
          </button>
          <button
            v-for="p in visiblePages" :key="p"
            class="page-btn" :class="{ active: p === currentPage, ellipsis: p === '…' }"
            :disabled="p === '…'"
            @click="p !== '…' && (currentPage = p)"
          >{{ p }}</button>
          <button class="page-btn" :disabled="currentPage === pageCount" @click="currentPage++">
            <q-icon name="chevron_right" size="16px" />
          </button>
        </div>
        <div class="page-size">
          <select v-model="pageSize" class="page-size-select" @change="currentPage=1">
            <option v-for="n in [10, 20, 50]" :key="n" :value="n">{{ n }} / página</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ===== Modal historial ===== -->
    <q-dialog
      v-model="modalHistorial"
      persistent
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <div class="rk-modal" :class="{ 'is-dark': isDark }">

        <!-- Modal header -->
        <div class="rk-modal-header">
          <div class="modal-header-left">
            <div class="modal-avatar" :style="{ background: avatarColor(historialEmpleado?.nombre) }">
              {{ (historialEmpleado?.nombre||'?')[0].toUpperCase() }}
            </div>
            <div>
              <div class="modal-title">{{ historialEmpleado?.nombre || '—' }}</div>
              <div class="modal-sub">RUT: {{ historialEmpleado?.rut || '—' }}</div>
            </div>
          </div>
          <div class="modal-header-right">
            <!-- Mini stats -->
            <div class="modal-stats">
              <div class="mstat mstat-total">
                <div class="mstat-num">{{ conteos.total }}</div>
                <div class="mstat-lbl">Total</div>
              </div>
              <div class="mstat mstat-in">
                <div class="mstat-num">{{ conteos.entradas }}</div>
                <div class="mstat-lbl">Entradas</div>
              </div>
              <div class="mstat mstat-out">
                <div class="mstat-num">{{ conteos.salidas }}</div>
                <div class="mstat-lbl">Salidas</div>
              </div>
            </div>
            <button class="modal-close" v-close-popup aria-label="Cerrar">
              <q-icon name="close" size="18px" />
            </button>
          </div>
        </div>

        <!-- Filtros rápidos + rango -->
        <div class="rk-modal-filters">
          <div class="quick-chips">
            <button
              v-for="q in quickRanges" :key="q.key"
              class="quick-chip"
              :class="{ active: activeQuick === q.key }"
              @click="setQuickRange(q.key)"
            >{{ q.label }}</button>
            <button v-if="rangoDesde||rangoHasta" class="quick-chip quick-clear" @click="limpiarRango">
              <q-icon name="clear" size="13px" />Limpiar
            </button>
          </div>

          <div class="filter-row">
            <div class="rk-date-wrap">
              <label class="filter-label">Desde</label>
              <input type="date" v-model="rangoDesde" class="rk-date-input" />
            </div>
            <div class="rk-date-wrap">
              <label class="filter-label">Hasta</label>
              <input type="date" v-model="rangoHasta" class="rk-date-input" />
            </div>
            <div class="rk-select-wrap">
              <label class="filter-label">Tipo</label>
              <select v-model="filtroTipo" class="rk-select">
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="salida">Salidas</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="rk-modal-tabs">
          <button
            v-for="t in modalTabs" :key="t.key"
            class="mtab" :class="{ active: tab === t.key }"
            @click="tab = t.key"
          >
            <q-icon :name="t.icon" size="15px" />
            {{ t.label }}
          </button>
        </div>

        <!-- Contenido del modal -->
        <div class="rk-modal-body">

          <!-- Loading -->
          <div v-if="isFetching" class="modal-loading">
            <div class="modal-spinner" />
            <div class="modal-loading-txt">Cargando registros…</div>
          </div>

          <!-- Timeline -->
          <template v-else-if="tab === 'timeline'">
            <div v-if="gruposPorDia.length" class="timeline-list">
              <div v-for="grupo in gruposPorDia" :key="grupo.fechaClave" class="timeline-day">
                <div class="tday-header">
                  <div class="tday-dot" />
                  <div class="tday-info">
                    <span class="tday-fecha">{{ grupo.fechaLarga }}</span>
                    <span class="tday-count">{{ grupo.items.length }} marca{{ grupo.items.length !== 1 ? 's' : '' }}</span>
                  </div>
                </div>
                <div class="tday-items">
                  <div
                    v-for="m in grupo.items" :key="m._id"
                    class="titem"
                    :class="`titem-${m.tipo}`"
                  >
                    <div class="titem-icon">
                      <q-icon :name="estadoIcono(m.tipo)" size="16px" />
                    </div>
                    <div class="titem-body">
                      <div class="titem-tipo">{{ capitalizar(m.tipo || '—') }}</div>
                      <div class="titem-nota">{{ m.note || 'Sin comentario' }}</div>
                    </div>
                    <div class="titem-right">
                      <div class="titem-hora">{{ horaBonita(m.timestamp) }}</div>
                      <a v-if="m.ubicacion?.lat" href="#" class="titem-mapa" @click.prevent="openInMaps(m)">
                        <q-icon name="place" size="12px" />mapa
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="modal-empty">
              <q-icon name="event_busy" size="52px" />
              <div>No hay registros en este rango</div>
            </div>
          </template>

          <!-- Tabla -->
          <template v-else>
            <div v-if="historialFiltradoYTipado.length" class="htable-wrap">
              <table class="rk-table">
                <thead>
                  <tr>
                    <th class="rk-th">Fecha</th>
                    <th class="rk-th">Hora</th>
                    <th class="rk-th">Tipo</th>
                    <th class="rk-th">Ubicación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="m in historialFiltradoYTipado" :key="m._id"
                    class="rk-tr"
                  >
                    <td class="rk-td rk-mono">{{ formatFecha(m.timestamp) }}</td>
                    <td class="rk-td rk-mono">{{ horaBonita(m.timestamp) }}</td>
                    <td class="rk-td">
                      <span class="rk-badge" :class="`badge-${m.tipo}`">
                        <span class="badge-dot" />
                        {{ capitalizar(m.tipo) }}
                      </span>
                    </td>
                    <td class="rk-td">
                      <button v-if="m.ubicacion?.lat" class="act-btn act-map" @click="openInMaps(m)">
                        <q-icon name="place" size="14px" />
                        <q-tooltip>Ver en mapa</q-tooltip>
                      </button>
                      <span v-else class="rk-muted">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="modal-empty">
              <q-icon name="table_rows" size="52px" />
              <div>Sin registros</div>
            </div>
          </template>
        </div>

        <!-- Modal footer -->
        <div class="rk-modal-footer">
          <div class="footer-info">
            {{ conteos.total }} marcas · {{ conteos.entradas }} entradas · {{ conteos.salidas }} salidas
          </div>
          <div class="footer-actions">
            <button class="footer-btn footer-btn-print" @click="imprimirHistorial">
              <q-icon name="print" size="14px" />Imprimir
            </button>
            <button class="footer-btn footer-btn-excel" @click="exportarExcel">
              <q-icon name="file_download" size="14px" />Excel
            </button>
            <button class="footer-btn footer-btn-close" v-close-popup>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useQuasar, date } from 'quasar';
import { useAsistenciaStore } from '@/stores/asistenciaStore';

const $q = useQuasar();
const asistenciaStore = useAsistenciaStore();

/* ── Dark mode ─────────────────────────────── */
const isDark = ref($q.dark.isActive);
const toggleDark = () => { $q.dark.toggle(); isDark.value = $q.dark.isActive; };
watch(() => $q.dark.isActive, v => { isDark.value = v; });

/* ── Estado UI ─────────────────────────────── */
const loading     = ref(true);
const search      = ref('');
const currentPage = ref(1);
const pageSize    = ref(10);
const sortBy      = ref('nombre');
const sortDesc    = ref(false);

/* ── Modal ─────────────────────────────────── */
const modalHistorial    = ref(false);
const historialEmpleado = ref(null);
const isFetching        = ref(false);
const rangoDesde        = ref('');
const rangoHasta        = ref('');
const filtroTipo        = ref('');
const tab               = ref('timeline');
const activeQuick       = ref('');

const modalTabs   = [
  { key: 'timeline', icon: 'timeline',    label: 'Timeline' },
  { key: 'tabla',    icon: 'table_chart', label: 'Tabla'    },
];
const quickRanges = [
  { key: 'hoy',    label: 'Hoy'          },
  { key: 'semana', label: 'Esta semana'  },
  { key: 'mes',    label: 'Este mes'     },
];

/* ── Datos brutos ───────────────────────────── */
const rawEmployees = computed(() =>
  Array.isArray(asistenciaStore.employeeRecords) ? asistenciaStore.employeeRecords : []
);
const rowsMain = computed(() =>
  rawEmployees.value.map(e => ({
    ...e,
    total: Array.isArray(e?.asistencias) ? e.asistencias.length : (e?.total || 0),
  }))
);

/* ── KPIs globales ──────────────────────────── */
const totalEmpleados = computed(() => rowsMain.value.length);
const totalMarcas    = computed(() => rowsMain.value.reduce((s, r) => s + r.total, 0));
// Estas son ilustrativas; si el store provee datos de hoy se pueden conectar
const totalEntradas  = computed(() => 0);
const totalSalidas   = computed(() => 0);
const pctEntradas    = computed(() => totalMarcas.value ? Math.round((totalEntradas.value / totalMarcas.value) * 100) : 0);
const pctSalidas     = computed(() => totalMarcas.value ? Math.round((totalSalidas.value  / totalMarcas.value) * 100) : 0);

/* ── Filtrado + orden ───────────────────────── */
const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  let rows = rowsMain.value;
  if (q) rows = rows.filter(r =>
    (r.nombre||'').toLowerCase().includes(q) ||
    (r.rut||'').toLowerCase().includes(q)
  );
  return [...rows].sort((a, b) => {
    const av = (a[sortBy.value]||'').toString().toLowerCase();
    const bv = (b[sortBy.value]||'').toString().toLowerCase();
    return sortDesc.value ? bv.localeCompare(av) : av.localeCompare(bv);
  });
});

watch(search, () => { currentPage.value = 1; });

const pageCount     = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));
const pageStart     = computed(() => (currentPage.value - 1) * pageSize.value);
const pageEnd       = computed(() => pageStart.value + pageSize.value);
const paginatedRows = computed(() => filteredRows.value.slice(pageStart.value, pageEnd.value));

const visiblePages = computed(() => {
  const t = pageCount.value, c = currentPage.value;
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
  const p = [1];
  if (c > 3) p.push('…');
  for (let i = Math.max(2, c-1); i <= Math.min(t-1, c+1); i++) p.push(i);
  if (c < t - 2) p.push('…');
  p.push(t);
  return p;
});

/* ── Ordenación ─────────────────────────────── */
const toggleSort = col => {
  if (sortBy.value === col) sortDesc.value = !sortDesc.value;
  else { sortBy.value = col; sortDesc.value = false; }
};
const sortIcon = col => {
  if (sortBy.value !== col) return 'unfold_more';
  return sortDesc.value ? 'expand_more' : 'expand_less';
};

/* ── Columnas ───────────────────────────────── */
const columns = [
  { name: 'nombre',  label: 'Colaborador',  align: 'left',   sortable: true  },
  { name: 'rut',     label: 'RUT',          align: 'left',   sortable: true  },
  { name: 'total',   label: 'Asistencias',  align: 'left',   sortable: true  },
  { name: 'actions', label: '',             align: 'right',  sortable: false },
];

/* ── Carga ──────────────────────────────────── */
const loadData = async () => {
  loading.value = true;
  try { await asistenciaStore.fetchRecordsByEmployee(); }
  catch { $q.notify({ type: 'negative', message: 'Error al cargar asistencias', position: 'top-right' }); }
  finally { loading.value = false; }
};

onMounted(() => { loadData(); initSticky(); });

/* ── Modal ──────────────────────────────────── */
const verHistorial = async (empleado) => {
  rangoDesde.value = '';
  rangoHasta.value = '';
  filtroTipo.value = '';
  tab.value = 'timeline';
  activeQuick.value = '';
  modalHistorial.value = true;
  isFetching.value = true;
  try {
    const data = await asistenciaStore.fetchHistorialEmpleado({ employeeId: empleado._id });
    historialEmpleado.value = data || { asistencias: [], nombre: empleado?.nombre, rut: empleado?.rut, _id: empleado?._id };
  } catch {
    modalHistorial.value = false;
    $q.notify({ type: 'negative', message: 'No se pudo cargar el historial', position: 'top-right' });
  } finally { isFetching.value = false; }
};

watch([rangoDesde, rangoHasta], () => {
  activeQuick.value = '';
  if (historialEmpleado.value?._id) recargarHistorialConRango();
});

const recargarHistorialConRango = async () => {
  isFetching.value = true;
  try {
    const data = await asistenciaStore.fetchHistorialEmpleado({
      employeeId: historialEmpleado.value._id,
      from: rangoDesde.value || null,
      to:   rangoHasta.value || null,
    });
    historialEmpleado.value = {
      ...(data || { asistencias: [] }),
      nombre: historialEmpleado.value?.nombre,
      rut:    historialEmpleado.value?.rut,
      _id:    historialEmpleado.value?._id,
    };
  } catch { $q.notify({ type: 'negative', message: 'Error al filtrar', position: 'top-right' }); }
  finally { isFetching.value = false; }
};

const limpiarRango = () => { rangoDesde.value = ''; rangoHasta.value = ''; activeQuick.value = ''; };

const setQuickRange = (tipo) => {
  const hoy = new Date();
  const fmt  = d => date.formatDate(d, 'YYYY-MM-DD');
  activeQuick.value = tipo;
  if (tipo === 'hoy') {
    const d = fmt(hoy); rangoDesde.value = d; rangoHasta.value = d;
  } else if (tipo === 'semana') {
    rangoDesde.value = fmt(date.startOfDate(hoy, 'week'));
    rangoHasta.value = fmt(date.endOfDate(hoy, 'week'));
  } else if (tipo === 'mes') {
    rangoDesde.value = fmt(date.startOfDate(hoy, 'month'));
    rangoHasta.value = fmt(date.endOfDate(hoy, 'month'));
  }
};

/* ── Datos filtrados del modal ──────────────── */
const historialFiltrado = computed(() => {
  const asistencias = historialEmpleado.value?.asistencias || [];
  return asistencias.filter(a => {
    if (rangoDesde.value || rangoHasta.value) {
      const f = new Date(a.timestamp); f.setHours(0,0,0,0);
      const d = rangoDesde.value ? new Date(rangoDesde.value) : null;
      if (d) d.setHours(0,0,0,0);
      const h = rangoHasta.value ? new Date(rangoHasta.value) : null;
      if (h) h.setHours(23,59,59,999);
      if ((d && f < d) || (h && f > h)) return false;
    }
    return true;
  });
});

const historialFiltradoYTipado = computed(() => {
  const base = filtroTipo.value
    ? historialFiltrado.value.filter(a => a.tipo === filtroTipo.value)
    : historialFiltrado.value;
  return [...base].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

const gruposPorDia = computed(() => {
  const map = new Map();
  for (const m of historialFiltradoYTipado.value) {
    const clave = date.formatDate(m.timestamp, 'YYYY-MM-DD');
    if (!map.has(clave)) {
      const fechaLarga = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: '2-digit',
      }).format(new Date(m.timestamp));
      map.set(clave, { fechaClave: clave, fechaLarga, items: [] });
    }
    map.get(clave).items.push(m);
  }
  return Array.from(map.values());
});

const conteos = computed(() => {
  let entradas = 0, salidas = 0;
  for (const m of historialFiltradoYTipado.value) {
    if (m.tipo === 'entrada') entradas++;
    else if (m.tipo === 'salida') salidas++;
  }
  return { entradas, salidas, total: historialFiltradoYTipado.value.length };
});

/* ── Helpers ────────────────────────────────── */
const estadoIcono  = t => t === 'entrada' ? 'login' : t === 'salida' ? 'logout' : 'radio_button_unchecked';
const capitalizar  = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
const horaBonita   = ts => date.formatDate(ts, 'HH:mm');
const formatFecha  = ts => date.formatDate(ts, 'DD/MM/YYYY');
const openInMaps   = m => { const { lat, lng } = m?.ubicacion||{}; if (lat&&lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank'); };

const AVATAR_COLORS = ['#0891b2','#7c3aed','#059669','#d97706','#dc2626','#db2777','#2563eb'];
const avatarColor   = (name='') => AVATAR_COLORS[(name||'?').charCodeAt(0) % AVATAR_COLORS.length];

/* ── Export/Print ───────────────────────────── */
const exportarExcel = async () => {
  if (!historialEmpleado.value?._id) return;
  try {
    await asistenciaStore.exportEmployeeExcel({
      employeeId: historialEmpleado.value._id,
      from: rangoDesde.value || null,
      to:   rangoHasta.value || null,
    });
    $q.notify({ type: 'positive', message: 'Exportación iniciada', position: 'top-right' });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al exportar', position: 'top-right' });
  }
};
const imprimirHistorial = () => window.print();

/* ── Sticky ─────────────────────────────────── */
const toolbarRef      = ref(null);
const toolbarSentinel = ref(null);
const stickyToolbar   = ref(false);
let observer;
const initSticky = () => {
  observer = new IntersectionObserver(
    entries => { stickyToolbar.value = !entries[0].isIntersecting; },
    { root: null, threshold: 0 }
  );
  if (toolbarSentinel.value) observer.observe(toolbarSentinel.value);
};
onBeforeUnmount(() => { if (observer && toolbarSentinel.value) observer.unobserve(toolbarSentinel.value); });
</script>

<style scoped>
/* ══════════════════════════════════════════════════
   TOKENS — mismos que CompaniesPage / UsersPage
══════════════════════════════════════════════════ */
.rk-page {
  --c-bg:        #f0f2f7;
  --c-surface:   #ffffff;
  --c-surface2:  #f7f8fc;
  --c-border:    rgba(0,0,0,0.08);
  --c-text:      #0f1117;
  --c-text2:     #5a6482;
  --c-text3:     #9aa1b9;
  --c-primary:   #0891b2;
  --c-primary-l: rgba(8,145,178,0.12);
  --c-ok:        #059669;
  --c-ok-l:      rgba(5,150,105,0.12);
  --c-warn:      #d97706;
  --c-warn-l:    rgba(217,119,6,0.12);
  --c-err:       #dc2626;
  --c-err-l:     rgba(220,38,38,0.12);
  --c-all:       #0891b2;
  --c-all-l:     rgba(8,145,178,0.12);
  --c-teal:      #0d9488;
  --c-teal-l:    rgba(13,148,136,0.12);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.07);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg:   0 12px 36px rgba(0,0,0,0.1);
  --radius-sm:   8px;
  --radius-md:   14px;
  --radius-lg:   20px;
  --ff-body:     'DM Sans','Segoe UI',system-ui,sans-serif;
  --ff-mono:     'JetBrains Mono','Fira Code',ui-monospace,monospace;
  --ff-display:  'Sora','DM Sans',system-ui,sans-serif;
  font-family:   var(--ff-body);
  min-height:    100vh;
  background:    var(--c-bg);
  color:         var(--c-text);
  padding:       28px 32px 60px;
  position:      relative;
  overflow-x:    hidden;
  transition:    background 0.3s, color 0.3s;
}
.rk-page.is-dark {
  --c-bg:        #0c0e14;
  --c-surface:   #141720;
  --c-surface2:  #1a1e2a;
  --c-border:    rgba(255,255,255,0.07);
  --c-text:      #e8eaf2;
  --c-text2:     #8b92ad;
  --c-text3:     #555d78;
  --c-primary-l: rgba(8,145,178,0.18);
  --c-ok-l:      rgba(5,150,105,0.18);
  --c-warn-l:    rgba(217,119,6,0.18);
  --c-err-l:     rgba(220,38,38,0.18);
  --c-all-l:     rgba(8,145,178,0.18);
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.3);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.4);
  --shadow-lg:   0 12px 36px rgba(0,0,0,0.5);
}

/* ══ FONDO ══ */
.rk-bg-mesh { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
.mesh-orb   { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.35; }
.rk-page:not(.is-dark) .mesh-orb { opacity:0.15; }
.orb-1 { width:500px; height:500px; top:-150px; right:-80px;  background:var(--c-primary); }
.orb-2 { width:400px; height:400px; bottom:80px; left:-120px; background:var(--c-teal);   }
.orb-3 { width:300px; height:300px; top:45%; left:50%;        background:var(--c-ok);     }
.mesh-grid {
  position:absolute; inset:0;
  background-image: linear-gradient(var(--c-border) 1px,transparent 1px),
                    linear-gradient(90deg,var(--c-border) 1px,transparent 1px);
  background-size:40px 40px; opacity:0.5;
}

/* ══ HEADER ══ */
.rk-header-wrap  { position:relative; z-index:1; margin-bottom:28px; }
.rk-header-inner { display:flex; align-items:center; gap:16px; }
.rk-header-icon  {
  width:52px; height:52px; border-radius:16px; position:relative;
  background:linear-gradient(135deg,var(--c-primary),var(--c-teal));
  color:#fff; display:flex; align-items:center; justify-content:center;
  box-shadow:0 8px 24px rgba(8,145,178,0.35); flex-shrink:0;
}
.rk-icon-pulse {
  position:absolute; inset:-6px;
  background:linear-gradient(135deg,var(--c-primary),var(--c-teal));
  border-radius:20px; opacity:0; filter:blur(10px);
  animation:iconPulse 3s ease-in-out infinite;
}
@keyframes iconPulse { 0%,100%{opacity:0;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.2)} }

.rk-title    { font-family:var(--ff-display); font-size:26px; font-weight:700; letter-spacing:-0.5px; margin:0 0 2px; }
.rk-subtitle { font-size:13.5px; color:var(--c-text2); margin:0; }
.rk-accent   { color:var(--c-primary); font-weight:600; }

.rk-mode-toggle {
  width:38px !important; height:38px !important; border-radius:12px !important;
  background:var(--c-surface) !important; border:1px solid var(--c-border) !important;
  color:var(--c-text) !important; box-shadow:var(--shadow-sm);
  transition:transform 0.15s, box-shadow 0.15s;
}
.rk-mode-toggle:hover { transform:translateY(-1px); box-shadow:var(--shadow-md); }

.rk-btn-refresh {
  display:inline-flex; align-items:center; gap:7px; padding:7px 16px;
  border-radius:10px; border:1px solid var(--c-border);
  background:var(--c-surface); color:var(--c-text);
  font-size:13px; font-weight:600; font-family:var(--ff-body);
  cursor:pointer; box-shadow:var(--shadow-sm);
  transition:transform 0.15s, box-shadow 0.15s;
}
.rk-btn-refresh:hover:not(:disabled) { transform:translateY(-1px); box-shadow:var(--shadow-md); }
.rk-btn-refresh:disabled { opacity:0.45; cursor:not-allowed; }
.spin { animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* ══ KPI ══ */
.rk-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; position:relative; z-index:1; }
@media(max-width:900px){ .rk-kpi-grid{grid-template-columns:repeat(2,1fr);} }
@media(max-width:500px){ .rk-kpi-grid{grid-template-columns:1fr;} }

.rk-kpi {
  background:var(--c-surface); border:1px solid var(--c-border);
  border-radius:var(--radius-md); padding:18px 18px 14px;
  position:relative; overflow:hidden;
  box-shadow:var(--shadow-sm);
  display:flex; flex-direction:column; gap:12px;
  transition:transform 0.18s, box-shadow 0.18s;
}
.rk-kpi:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); }

.kpi-total   { --kpi-c:var(--c-primary); --kpi-cl:var(--c-primary-l); }
.kpi-marcas  { --kpi-c:var(--c-teal);   --kpi-cl:var(--c-teal-l);    }
.kpi-entradas{ --kpi-c:var(--c-ok);     --kpi-cl:var(--c-ok-l);      }
.kpi-salidas { --kpi-c:var(--c-err);    --kpi-cl:var(--c-err-l);     }

.kpi-icon-wrap { width:40px; height:40px; border-radius:12px; background:var(--kpi-cl); color:var(--kpi-c); display:flex; align-items:center; justify-content:center; }
.kpi-count { font-family:var(--ff-display); font-size:28px; font-weight:700; line-height:1; letter-spacing:-1px; }
.kpi-label { font-size:12px; font-weight:500; color:var(--c-text2); text-transform:uppercase; letter-spacing:0.8px; margin-top:4px; }
.kpi-bar   { height:3px; background:var(--c-border); border-radius:999px; overflow:hidden; }
.kpi-bar-fill { height:100%; background:var(--kpi-c); border-radius:999px; transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1); }

/* ══ TOOLBAR ══ */
.rk-sentinel { height:1px; }
.rk-toolbar {
  background:var(--c-surface); border:1px solid var(--c-border);
  border-radius:var(--radius-md); padding:10px 14px;
  box-shadow:var(--shadow-sm); position:relative; z-index:5;
  display:flex; align-items:center; gap:12px;
  transition:box-shadow 0.2s;
}
.rk-toolbar.is-sticky { position:sticky; top:56px; box-shadow:var(--shadow-lg); border-radius:var(--radius-sm); }

.rk-search-wrap {
  display:flex; align-items:center; gap:8px;
  background:var(--c-surface2); border:1px solid var(--c-border);
  border-radius:10px; padding:6px 12px; min-width:260px;
  transition:border-color 0.15s, box-shadow 0.15s;
}
.rk-search-wrap:focus-within { border-color:var(--c-primary); box-shadow:0 0 0 3px var(--c-primary-l); }
.rk-search-icon  { color:var(--c-text3); flex-shrink:0; }
.rk-search-input { border:none; background:transparent; outline:none; font-size:13px; color:var(--c-text); font-family:var(--ff-body); flex:1; min-width:0; }
.rk-search-input::placeholder { color:var(--c-text3); }
.rk-search-clear { color:var(--c-text3); cursor:pointer; }
.rk-search-clear:hover { color:var(--c-text); }

.rk-results-chip {
  display:inline-flex; align-items:center; gap:5px;
  padding:4px 10px; border-radius:999px;
  background:var(--c-primary-l); color:var(--c-primary);
  font-size:12px; font-weight:600;
}

/* ══ TABLA WRAP ══ */
.rk-table-wrap { background:var(--c-surface); border:1px solid var(--c-border); border-radius:var(--radius-lg); overflow:hidden; box-shadow:var(--shadow-md); position:relative; z-index:1; }

/* Skeleton */
.rk-skeleton-list { padding:8px 0; }
.rk-skeleton-row  { display:flex; align-items:center; gap:14px; padding:14px 20px; border-bottom:1px solid var(--c-border); }
.rk-skeleton-row:last-child { border-bottom:none; }
.skel { background:linear-gradient(90deg,var(--c-border) 25%,var(--c-surface2) 50%,var(--c-border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
.skel-avatar  { width:36px; height:36px; border-radius:11px; flex-shrink:0; }
.skel-text    { height:12px; flex:1; }
.skel-short   { flex:0.35; }
.skel-badge   { width:72px; height:22px; border-radius:999px; flex-shrink:0; }
.skel-actions { width:100px; height:28px; flex-shrink:0; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Empty */
.rk-empty { display:flex; flex-direction:column; align-items:center; padding:64px 24px; gap:8px; }
.rk-empty-icon  { width:80px; height:80px; border-radius:24px; background:var(--c-surface2); display:flex; align-items:center; justify-content:center; color:var(--c-text3); margin-bottom:8px; }
.rk-empty-title { font-size:16px; font-weight:700; }
.rk-empty-msg   { font-size:13.5px; color:var(--c-text2); text-align:center; max-width:320px; }

/* Tabla */
.rk-table { width:100%; border-collapse:collapse; font-size:13.5px; }
.rk-th {
  padding:12px 16px; text-align:left;
  font-size:11.5px; font-weight:600; letter-spacing:0.6px; text-transform:uppercase;
  color:var(--c-text3); background:var(--c-surface2); border-bottom:1px solid var(--c-border);
  white-space:nowrap; user-select:none;
}
.rk-th--right { text-align:right; }
.rk-th.sortable { cursor:pointer; }
.rk-th.sortable:hover { color:var(--c-text); }
.th-content { display:inline-flex; align-items:center; gap:4px; }
.sort-arrows .q-icon { color:var(--c-text3); }
.sort-arrows .q-icon.active { color:var(--c-primary); }

.rk-tr { border-bottom:1px solid var(--c-border); animation:rowIn 0.25s ease both; transition:background 0.12s; }
.rk-tr:last-child { border-bottom:none; }
.rk-tr:hover { background:var(--c-surface2); }
@keyframes rowIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

.rk-td      { padding:13px 16px; color:var(--c-text); vertical-align:middle; }
.rk-td--right { text-align:right; }
.rk-mono    { font-family:var(--ff-mono); font-size:12.5px; color:var(--c-text2); }
.rk-muted   { color:var(--c-text3); }

.cell-user  { display:flex; align-items:center; gap:12px; }
.user-avatar { width:36px; height:36px; border-radius:11px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#fff; }
.user-name  { font-weight:600; }

.cell-total { display:flex; align-items:center; gap:6px; }
.total-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:999px; background:var(--c-ok-l); color:var(--c-ok); font-size:12.5px; font-weight:700; }
.total-label { font-size:12px; color:var(--c-text3); }

.rk-btn-historial {
  display:inline-flex; align-items:center; gap:6px; padding:6px 14px;
  border-radius:8px; border:1px solid var(--c-border);
  background:var(--c-primary-l); color:var(--c-primary);
  font-size:12.5px; font-weight:600; font-family:var(--ff-body);
  cursor:pointer; transition:transform 0.12s, box-shadow 0.12s;
}
.rk-btn-historial:hover { transform:translateY(-1px); box-shadow:0 4px 12px var(--c-primary-l); }

/* Acciones tabla modal */
.act-btn { width:28px; height:28px; border:none; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; background:transparent; color:var(--c-text2); transition:background 0.12s; }
.act-map:hover { background:var(--c-primary-l); color:var(--c-primary); }

/* Badges */
.rk-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:600; }
.badge-dot { width:6px; height:6px; border-radius:50%; }
.badge-entrada { background:var(--c-ok-l);  color:var(--c-ok);  } .badge-entrada .badge-dot { background:var(--c-ok); }
.badge-salida  { background:var(--c-err-l); color:var(--c-err); } .badge-salida  .badge-dot { background:var(--c-err); }

/* Paginación */
.rk-pagination { display:flex; align-items:center; gap:12px; padding:12px 20px; border-top:1px solid var(--c-border); background:var(--c-surface2); flex-wrap:wrap; }
.page-info { font-size:12.5px; color:var(--c-text2); flex:1; }
.page-info strong { color:var(--c-text); }
.page-controls { display:flex; gap:4px; }
.page-btn { min-width:30px; height:30px; padding:0 6px; border:1px solid var(--c-border); border-radius:8px; background:var(--c-surface); color:var(--c-text2); font-size:12.5px; font-weight:500; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.12s; font-family:var(--ff-body); }
.page-btn:hover:not(:disabled) { border-color:var(--c-primary); color:var(--c-primary); }
.page-btn.active { background:var(--c-primary); color:#fff; border-color:var(--c-primary); }
.page-btn.ellipsis { border:none; background:transparent; cursor:default; }
.page-btn:disabled { opacity:0.35; cursor:not-allowed; }
.page-size-select { font-size:12.5px; border:1px solid var(--c-border); border-radius:8px; padding:4px 8px; background:var(--c-surface); color:var(--c-text); cursor:pointer; font-family:var(--ff-body); outline:none; }

/* ══════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════ */
.rk-modal {
  --c-bg:       #f0f2f7;
  --c-surface:  #ffffff;
  --c-surface2: #f7f8fc;
  --c-border:   rgba(0,0,0,0.08);
  --c-text:     #0f1117;
  --c-text2:    #5a6482;
  --c-text3:    #9aa1b9;
  --c-primary:  #0891b2;
  --c-primary-l:rgba(8,145,178,0.12);
  --c-ok:       #059669;
  --c-ok-l:     rgba(5,150,105,0.12);
  --c-err:      #dc2626;
  --c-err-l:    rgba(220,38,38,0.12);
  --ff-body:    'DM Sans','Segoe UI',system-ui,sans-serif;
  --ff-mono:    'JetBrains Mono',ui-monospace,monospace;
  --ff-display: 'Sora','DM Sans',system-ui,sans-serif;

  width:900px; max-width:95vw;
  background:var(--c-surface); border-radius:20px;
  overflow:hidden; display:flex; flex-direction:column;
  max-height:90vh;
  box-shadow:0 24px 64px rgba(0,0,0,0.18);
  font-family:var(--ff-body);
  color:var(--c-text);
}
.rk-modal.is-dark {
  --c-bg:        #0c0e14;
  --c-surface:   #141720;
  --c-surface2:  #1a1e2a;
  --c-border:    rgba(255,255,255,0.07);
  --c-text:      #e8eaf2;
  --c-text2:     #8b92ad;
  --c-text3:     #555d78;
  --c-primary-l: rgba(8,145,178,0.18);
  --c-ok-l:      rgba(5,150,105,0.18);
  --c-err-l:     rgba(220,38,38,0.18);
}

/* Modal header */
.rk-modal-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:20px 24px;
  background:linear-gradient(135deg,var(--c-primary),var(--c-teal,#0d9488));
  color:#fff; flex-shrink:0;
}
.modal-header-left  { display:flex; align-items:center; gap:14px; }
.modal-header-right { display:flex; align-items:center; gap:16px; }
.modal-avatar { width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800; color:#fff; background:rgba(255,255,255,0.2); flex-shrink:0; }
.modal-title  { font-family:var(--ff-display); font-size:18px; font-weight:700; line-height:1.2; }
.modal-sub    { font-size:12.5px; opacity:0.8; margin-top:2px; }
.modal-close  { width:34px; height:34px; border-radius:10px; border:none; background:rgba(255,255,255,0.15); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
.modal-close:hover { background:rgba(255,255,255,0.25); }

/* Mini stats */
.modal-stats { display:flex; gap:1px; background:rgba(255,255,255,0.15); border-radius:10px; overflow:hidden; }
.mstat { padding:8px 14px; text-align:center; background:rgba(255,255,255,0.08); }
.mstat-num  { font-family:var(--ff-display); font-size:18px; font-weight:700; line-height:1; }
.mstat-lbl  { font-size:10px; opacity:0.75; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; }
.mstat-in  .mstat-num { color:#6ee7b7; }
.mstat-out .mstat-num { color:#fca5a5; }

/* Filtros modal */
.rk-modal-filters { padding:16px 24px; border-bottom:1px solid var(--c-border); background:var(--c-surface2); flex-shrink:0; }
.quick-chips { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
.quick-chip {
  padding:4px 12px; border-radius:999px; border:1.5px solid var(--c-border);
  background:var(--c-surface); color:var(--c-text2); font-size:12px; font-weight:600;
  cursor:pointer; font-family:var(--ff-body); transition:all 0.15s;
}
.quick-chip:hover  { border-color:var(--c-primary); color:var(--c-primary); }
.quick-chip.active { background:var(--c-primary); border-color:var(--c-primary); color:#fff; }
.quick-clear { display:inline-flex; align-items:center; gap:4px; border-color:var(--c-err); color:var(--c-err); }
.quick-clear:hover { background:var(--c-err-l); }

.filter-row { display:flex; gap:12px; flex-wrap:wrap; }
.rk-date-wrap { display:flex; flex-direction:column; gap:4px; }
.rk-select-wrap { display:flex; flex-direction:column; gap:4px; min-width:120px; }
.filter-label { font-size:11px; font-weight:600; color:var(--c-text3); text-transform:uppercase; letter-spacing:0.5px; }
.rk-date-input, .rk-select {
  padding:6px 10px; border:1px solid var(--c-border); border-radius:8px;
  background:var(--c-surface); color:var(--c-text); font-size:13px;
  font-family:var(--ff-body); outline:none; appearance:none;
  transition:border-color 0.15s;
}
.rk-date-input:focus, .rk-select:focus { border-color:var(--c-primary); }

/* Tabs modal */
.rk-modal-tabs { display:flex; gap:2px; padding:10px 24px 0; border-bottom:1px solid var(--c-border); background:var(--c-surface); flex-shrink:0; }
.mtab {
  display:inline-flex; align-items:center; gap:6px; padding:8px 16px;
  border:none; border-bottom:2px solid transparent; background:transparent;
  color:var(--c-text2); font-size:13px; font-weight:600; font-family:var(--ff-body);
  cursor:pointer; transition:color 0.15s, border-color 0.15s;
  margin-bottom:-1px;
}
.mtab:hover  { color:var(--c-text); }
.mtab.active { color:var(--c-primary); border-bottom-color:var(--c-primary); }

/* Cuerpo modal */
.rk-modal-body { flex:1; overflow-y:auto; padding:20px 24px; min-height:200px; max-height:46vh; }

/* Loading */
.modal-loading { display:flex; flex-direction:column; align-items:center; padding:48px; gap:14px; }
.modal-spinner { width:36px; height:36px; border-radius:50%; border:3px solid var(--c-border); border-top-color:var(--c-primary); animation:spin 0.8s linear infinite; }
.modal-loading-txt { font-size:13.5px; color:var(--c-text2); }

/* Empty modal */
.modal-empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:48px 24px; color:var(--c-text3); text-align:center; font-size:14px; }

/* Timeline */
.timeline-list { display:flex; flex-direction:column; gap:20px; }
.timeline-day  {}
.tday-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.tday-dot { width:10px; height:10px; border-radius:50%; background:var(--c-primary); flex-shrink:0; box-shadow:0 0 0 3px var(--c-primary-l); }
.tday-fecha { font-family:var(--ff-display); font-size:14px; font-weight:700; text-transform:capitalize; }
.tday-count { font-size:11.5px; color:var(--c-text3); margin-left:6px; }
.tday-items { display:flex; flex-direction:column; gap:6px; padding-left:22px; }

.titem { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:12px; background:var(--c-surface2); border:1px solid var(--c-border); transition:background 0.12s; }
.titem:hover { background:var(--c-bg,#f0f2f7); }
.titem-entrada .titem-icon { background:var(--c-ok-l); color:var(--c-ok); }
.titem-salida  .titem-icon { background:var(--c-err-l); color:var(--c-err); }

.titem-icon { width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.titem-body { flex:1; min-width:0; }
.titem-tipo { font-size:13px; font-weight:700; text-transform:capitalize; }
.titem-nota { font-size:11.5px; color:var(--c-text3); margin-top:2px; }
.titem-right { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }
.titem-hora  { font-family:var(--ff-mono); font-size:13px; font-weight:700; color:var(--c-text); }
.titem-mapa  { font-size:11px; color:var(--c-primary); text-decoration:none; display:inline-flex; align-items:center; gap:2px; }
.titem-mapa:hover { text-decoration:underline; }

/* Tabla interna modal */
.htable-wrap { overflow-x:auto; }

/* Footer modal */
.rk-modal-footer { display:flex; align-items:center; justify-content:space-between; padding:14px 24px; border-top:1px solid var(--c-border); background:var(--c-surface2); flex-shrink:0; flex-wrap:wrap; gap:10px; }
.footer-info { font-size:12.5px; color:var(--c-text2); }
.footer-actions { display:flex; gap:6px; }
.footer-btn {
  display:inline-flex; align-items:center; gap:5px; padding:6px 14px;
  border-radius:8px; border:1px solid var(--c-border); background:var(--c-surface);
  color:var(--c-text2); font-size:12.5px; font-weight:600; font-family:var(--ff-body);
  cursor:pointer; transition:all 0.12s;
}
.footer-btn:hover { transform:translateY(-1px); box-shadow:var(--shadow-sm); }
.footer-btn-print { color:var(--c-text2); }
.footer-btn-excel { background:var(--c-ok-l); color:var(--c-ok); border-color:rgba(5,150,105,0.2); }
.footer-btn-close { background:var(--c-primary); color:#fff; border-color:var(--c-primary); }

/* Transitions */
.fade-enter-active,.fade-leave-active { transition:opacity 0.15s; }
.fade-enter-from,.fade-leave-to       { opacity:0; }

@media(max-width:600px) {
  .rk-page { padding:16px; }
  .rk-modal { width:100vw; max-width:none; height:100dvh; max-height:none; border-radius:0; }
  .rk-modal-body { max-height:calc(100dvh - 320px); }
  .filter-row { flex-direction:column; }
  .modal-stats { display:none; }
}
</style>