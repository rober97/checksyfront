<template>
  <q-page
    class="q-pa-md"
    :class="isDark ? 'bg-grey-10 text-white' : 'bg-grey-1'"
  >
    <!-- HEADER -->
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <q-icon name="history" class="q-mr-sm" size="28px" color="primary" />
        <div class="column">
          <div class="text-h5" :class="isDark ? 'text-white' : 'text-primary'">
            Historial de Asistencias
          </div>
          <div class="text-caption text-grey-6">{{ subHeader }}</div>
          <div class="text-caption text-primary q-mt-xs">
            Periodo: <span class="text-weight-medium">{{ periodLabel }}</span>
          </div>
        </div>
      </div>

      <!-- CONTROLES -->
      <div class="row items-center header-actions q-gutter-sm">
        <SegmentControl
          v-model="rangePreset"
          :options="presetOptions"
          @update:model-value="onPresetChange"
        />

        <q-input
          dense
          standout="bg"
          v-model="dateRangeLabel"
          :disable="rangePreset !== 'custom'"
          placeholder="Rango personalizado"
          readonly
          class="rk-date"
        >
          <template #prepend><q-icon name="event" /></template>
          <q-popup-proxy
            transition-show="scale"
            transition-hide="scale"
            :breakpoint="520"
          >
            <q-date v-model="range" mask="YYYY-MM-DD" range minimal>
              <div class="row justify-end q-pa-sm q-gutter-sm">
                <q-btn flat label="Limpiar" @click="clearCustom" />
                <q-btn flat label="Cancelar" v-close-popup />
                <q-btn
                  color="primary"
                  label="Aplicar"
                  @click="applyCustom"
                  v-close-popup
                />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-input>

        <q-btn
          dense
          round
          icon="download"
          :disable="rows.length === 0 || exporting"
          @click="exportExcel"
        >
          <q-tooltip>Exportar Excel</q-tooltip>
        </q-btn>
        <q-btn
          dense
          round
          icon="ios_share"
          :disable="rows.length === 0"
          @click="exportCSV"
        >
          <q-tooltip>Descargar CSV</q-tooltip>
        </q-btn>
        <q-btn
          dense
          round
          icon="print"
          :disable="rows.length === 0"
          @click="printTable"
        >
          <q-tooltip>Imprimir</q-tooltip>
        </q-btn>
        <q-btn
          dense
          round
          icon="content_copy"
          :disable="rows.length === 0"
          @click="copySummary"
        >
          <q-tooltip>Copiar resumen</q-tooltip>
        </q-btn>
        <q-btn dense round icon="refresh" :loading="loading" @click="reload">
          <q-tooltip>Actualizar</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- RESUMEN -->
    <div class="row q-gutter-sm q-mb-md">
      <q-chip outline color="primary" icon="event_note"
        >Marcas: {{ rows.length }}</q-chip
      >
      <q-chip outline color="teal" icon="calendar_month"
        >Días: {{ dayCount }}</q-chip
      >
      <q-chip outline color="indigo" icon="schedule"
        >Horas totales: {{ totalWorkedHuman }}</q-chip
      >
      <q-chip v-if="offline" outline color="orange" icon="wifi_off"
        >Offline: usando caché</q-chip
      >
    </div>

    <!-- FILTROS -->
    <div class="row items-center q-gutter-sm q-mb-sm">
      <q-input
        dense
        filled
        debounce="250"
        v-model="filter"
        placeholder="Buscar por fecha, tipo, ánimo, nota…"
        class="col-grow"
        clearable
      >
        <template #append><q-icon name="search" /></template>
      </q-input>

      <q-select
        dense
        filled
        v-model="filterTipo"
        :options="tipoOptions"
        emit-value
        map-options
        clearable
        standout="bg"
        style="min-width: 160px"
        placeholder="Tipo"
      />
      <q-select
        dense
        filled
        v-model="filterMood"
        :options="moodOptions"
        emit-value
        map-options
        clearable
        standout="bg"
        style="min-width: 170px"
        placeholder="Ánimo"
      />

      <q-btn flat dense icon="view_column">
        <q-menu>
          <q-list dense>
            <q-item
              v-for="col in toggleableColumns"
              :key="col.name"
              clickable
              @click="toggleColumn(col.name)"
            >
              <q-item-section>{{ col.label }}</q-item-section>
              <q-item-section side>
                <q-toggle
                  v-model="visible[col.name]"
                  @update:model-value="savePrefs"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <!-- ERRORES -->
    <q-banner
      v-if="error"
      rounded
      class="q-mb-md"
      :class="isDark ? 'bg-red-10 text-white' : 'bg-red-2'"
    >
      <q-icon name="error" class="q-mr-sm" color="negative" /> {{ error }}
      <q-btn flat dense label="Reintentar" class="q-ml-sm" @click="reload" />
    </q-banner>

    <!-- TABLA AGRUPADA -->
    <q-card flat bordered>
      <q-card-section>
        <div
          v-if="!loading && rows.length === 0"
          class="q-pa-xl text-center text-grey-6"
        >
          <q-icon name="hourglass_empty" size="48px" class="q-mb-sm" />
          <div>No hay asistencias en el período seleccionado.</div>
        </div>

        <q-virtual-scroll
          v-else
          :items="groupedDays"
          :virtual-scroll-item-size="56"
        >
          <template #default="{ item }">
            <!-- Header del día -->
            <div
              class="day-header row items-center justify-between"
              :class="
                isDark ? 'bg-grey-9 text-grey-3' : 'bg-grey-2 text-grey-8'
              "
            >
              <div class="row items-center">
                <q-btn
                  flat
                  round
                  dense
                  :icon="item.open ? 'expand_more' : 'chevron_right'"
                  @click="item.open = !item.open"
                  class="q-mr-xs"
                />
                <q-icon name="today" size="16px" class="q-mr-sm" />
                <div class="text-weight-bold">
                  {{ formatDateHuman(item.dateISO) }}
                </div>

                <q-chip
                  dense
                  outline
                  color="indigo"
                  class="q-ml-sm"
                  icon="schedule"
                >
                  {{ item.totalHuman }}
                </q-chip>
                <q-chip
                  dense
                  outline
                  color="primary"
                  class="q-ml-xs"
                  icon="list_alt"
                >
                  {{ item.rows.length }} marca{{
                    item.rows.length === 1 ? "" : "s"
                  }}
                </q-chip>

                <!-- ✅ GALERÍA PRO -->
                <q-btn
                  v-if="item.photosCount > 0"
                  flat
                  dense
                  icon="photo_library"
                  class="q-ml-sm"
                  @click="openDayGallery(item)"
                >
                  <span class="q-ml-xs text-caption"
                    >{{ item.photosCount }} foto{{
                      item.photosCount === 1 ? "" : "s"
                    }}</span
                  >
                  <q-tooltip>Ver fotos del día</q-tooltip>
                </q-btn>
              </div>

              <div class="row items-center q-gutter-xs">
                <q-btn flat dense icon="content_copy" @click="copyDay(item)"
                  >Copiar</q-btn
                >
                <q-btn flat dense icon="download" @click="exportDayCSV(item)"
                  >CSV</q-btn
                >
              </div>
            </div>

            <!-- Tabla del día -->
            <q-table
              v-show="item.open"
              :rows="item.rows"
              :columns="visibleColumns"
              row-key="__id"
              dense
              flat
              separator="horizontal"
              :loading="loading"
              hide-bottom
              :filter="tableFilterProxy"
              :pagination="dayPagination"
              :rows-per-page-options="[0]"
              :class="isDark ? 'bg-grey-10' : ''"
            >
              <template #body-cell-fecha="props">
                <q-td :props="props">
                  <div class="text-weight-medium">
                    {{ formatTime(props.row.timestamp) }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ formatDate(props.row.timestamp) }}
                  </div>
                </q-td>
              </template>

              <template #body-cell-tipo="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    square
                    :color="
                      props.row.tipo === 'entrada' ? 'positive' : 'negative'
                    "
                    text-color="white"
                  >
                    <q-icon
                      :name="props.row.tipo === 'entrada' ? 'login' : 'logout'"
                      class="q-mr-xs"
                    />
                    {{ cap(props.row.tipo) }}
                  </q-chip>
                </q-td>
              </template>

              <template #body-cell-mood="props">
                <q-td :props="props">
                  <q-chip dense outline :color="moodColor(props.row.mood)">
                    <q-icon
                      :name="moodIcon(props.row.mood)"
                      size="16px"
                      class="q-mr-xs"
                    />
                    {{ moodLabel(props.row.mood) }}
                  </q-chip>
                </q-td>
              </template>

              <template #body-cell-note="props">
                <q-td :props="props">
                  <div class="ellipsis">
                    <q-icon name="notes" size="16px" class="q-mr-xs" />
                    <span :title="props.row.note || '—'">{{
                      props.row.note || "—"
                    }}</span>
                  </div>
                </q-td>
              </template>

              <template #body-cell-ubicacion="props">
                <q-td :props="props">
                  <div
                    v-if="props.row.ubicacion?.lat && props.row.ubicacion?.lng"
                    class="row items-center no-wrap"
                  >
                    <q-icon name="place" size="16px" class="q-mr-xs" />
                    <a
                      :href="mapsLink(props.row.ubicacion)"
                      target="_blank"
                      rel="noopener"
                      class="text-primary"
                    >
                      {{ locToText(props.row.ubicacion) }}
                    </a>
                  </div>
                  <span v-else class="text-grey-6">—</span>
                </q-td>
              </template>

              <!-- ✅ FOTO: UX pro (botón + preview) -->
              <template #body-cell-photo="props">
                <q-td :props="props" class="text-center">
                  <div
                    v-if="props.row.photo"
                    class="row items-center justify-center no-wrap q-gutter-xs"
                  >
                    <q-avatar
                      size="34px"
                      rounded
                      class="rk-thumb cursor-pointer"
                      @click="openFromRow(props.row, props.row.__dayKey)"
                    >
                      <q-img
                        :src="thumbSrc(props.row)"
                        :ratio="1"
                        fit="cover"
                        no-spinner
                        @error="onThumbError(props.row)"
                      />
                    </q-avatar>

                    <q-btn
                      dense
                      flat
                      size="sm"
                      icon="open_in_full"
                      @click="openFromRow(props.row, props.row.__dayKey)"
                    >
                      <q-tooltip>Ver foto</q-tooltip>
                    </q-btn>
                  </div>

                  <q-icon
                    v-else
                    name="image_not_supported"
                    color="grey-5"
                    size="20px"
                  />
                </q-td>
              </template>
            </q-table>
          </template>
        </q-virtual-scroll>

        <q-inner-loading :showing="loading">
          <q-spinner-ios size="32px" />
        </q-inner-loading>
      </q-card-section>
    </q-card>

    <!-- ✅ VISOR PRO (Lightbox) -->
    <q-dialog
      v-model="viewer.open"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="rk-viewer">
        <!-- Topbar -->
        <div
          class="rk-viewer__top row items-center justify-between q-px-md q-py-sm"
        >
          <div class="min-w-0">
            <div class="text-subtitle1 ellipsis">{{ viewerTitle }}</div>
            <div class="text-caption text-grey-6">{{ viewerSubtitle }}</div>
          </div>

          <div class="row items-center q-gutter-xs">
            <q-btn dense flat round icon="content_copy" @click="copyViewerLink">
              <q-tooltip>Copiar link</q-tooltip>
            </q-btn>
            <q-btn dense flat round icon="open_in_new" @click="openInNewTab">
              <q-tooltip>Abrir</q-tooltip>
            </q-btn>
            <q-btn dense flat round icon="close" @click="closeViewer">
              <q-tooltip>Cerrar</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Stage -->
        <div class="rk-viewer__body">
          <q-btn
            v-if="viewer.list.length > 1"
            class="rk-nav rk-nav--left"
            round
            flat
            icon="chevron_left"
            @click="prevPhoto"
          />
          <q-btn
            v-if="viewer.list.length > 1"
            class="rk-nav rk-nav--right"
            round
            flat
            icon="chevron_right"
            @click="nextPhoto"
          />

          <div class="rk-stage">
            <q-inner-loading :showing="viewer.loading">
              <q-spinner size="42px" />
            </q-inner-loading>

            <q-img
              v-if="viewer.src && !viewer.error"
              :src="viewer.src"
              fit="contain"
              class="rk-img"
              no-spinner
              @error="onViewerError"
            />

            <div
              v-else-if="viewer.error"
              class="rk-error column items-center justify-center"
            >
              <q-icon name="broken_image" size="46px" color="negative" />
              <div class="q-mt-sm text-body2">{{ viewer.error }}</div>
              <q-btn
                class="q-mt-md"
                outline
                icon="refresh"
                label="Reintentar"
                @click="loadCurrentPhoto"
              />
            </div>
          </div>
        </div>

        <!-- Filmstrip -->
        <div
          v-if="viewer.list.length > 1"
          class="rk-viewer__strip q-px-md q-pb-md"
        >
          <div class="rk-strip">
            <button
              v-for="(r, i) in viewer.list"
              :key="r.__id"
              type="button"
              class="rk-strip__item"
              :class="{ active: i === viewer.index }"
              @click="jumpTo(i)"
              :title="`${cap(r.tipo)} · ${formatTime(r.timestamp)}`"
            >
              <q-img :src="thumbSrc(r)" :ratio="1" fit="cover" no-spinner />
            </button>
          </div>
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useQuasar } from "quasar";
import SegmentControl from "@/components/SegmentControl.vue";
import { useAuthStore } from "@/stores/authStore";
import { useAsistenciaStore } from "@/stores/asistenciaStore";
import { API_URL } from "@/utils/api";
/**
 * ✅ CONFIG FOTO
 * Ajusta SOLO estas rutas si tu API usa otras:
 *
 * - PHOTO_STREAM_ENDPOINT: endpoint que entrega la imagen (recommended)
 *   Ej: GET /api/attendance/photo?bucket=...&key=...
 *
 * - PHOTO_SIGNED_ENDPOINT: endpoint que devuelve { url } (optional)
 *   Ej: GET /api/attendance/photo-url?bucket=...&key=...
 */
const API_BASE = API_URL.replace(/\/$/, "");
const PHOTO_STREAM_ENDPOINT = `${API_BASE}/attendance/photo`; // 👈 base para armar /:id/photo
const PHOTO_SIGNED_ENDPOINT = `${API_BASE}/attendance/photo-url`;

/* ===== UI / THEME ===== */
const $q = useQuasar();
const isDark = computed(() => $q.dark.isActive);
const offline = computed(() => !navigator.onLine);

/* ===== STORES ===== */
const auth = useAuthStore();
const asistenciaStore = useAsistenciaStore();

/* ===== RANGE + PRESETS ===== */
const rangePreset = ref(localStorage.getItem("hist.preset") || "7d");
const range = ref({ from: null, to: null });

const presetOptions = [
  { label: "7D", value: "7d", icon: "bolt" },
  { label: "30D", value: "30d", icon: "calendar_view_month" },
  { label: "YTD", value: "ytd", icon: "timeline" },
  { label: "TODO", value: "all", icon: "all_inbox" },
  { label: "CUSTOM", value: "custom", icon: "tune" },
];

function setPresetDates(val) {
  const now = new Date();
  if (val === "7d") {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    range.value = {
      from: s.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  } else if (val === "30d") {
    const s = new Date(now);
    s.setDate(s.getDate() - 29);
    range.value = {
      from: s.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  } else if (val === "ytd") {
    const s = new Date(now.getFullYear(), 0, 1);
    range.value = {
      from: s.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  } else if (val === "all") {
    range.value = { from: null, to: null };
  }
}
function onPresetChange(val) {
  localStorage.setItem("hist.preset", val);
  if (val !== "custom") {
    setPresetDates(val);
    reload();
  }
}
function clearCustom() {
  range.value = { from: null, to: null };
}
function applyCustom() {
  if (!range.value?.from && !range.value?.to) return;
  rangePreset.value = "custom";
  localStorage.setItem("hist.preset", "custom");
  reload();
}

const dateRangeLabel = computed(() => {
  if (rangePreset.value !== "custom") return "Rango personalizado";
  const f = range.value?.from,
    t = range.value?.to;
  if (!f && !t) return "Seleccionar rango";
  const fmt = (d) => d?.split("-").reverse().join("/") || "—";
  return `${fmt(f)} → ${fmt(t)}`;
});
const periodLabel = computed(() => {
  if (rangePreset.value === "7d") return "Últimos 7 días";
  if (rangePreset.value === "30d") return "Últimos 30 días";
  if (rangePreset.value === "ytd") return "Año en curso";
  if (rangePreset.value === "all") return "Todo";
  if (rangePreset.value === "custom") return dateRangeLabel.value;
  return "—";
});

/* ===== FILTERS ===== */
const filter = ref(localStorage.getItem("hist.filter") || "");
watch(filter, (v) => localStorage.setItem("hist.filter", v || ""));

const tipoOptions = [
  { label: "Entrada", value: "entrada" },
  { label: "Salida", value: "salida" },
];
const moodOptions = [
  { label: "Excelente", value: "great" },
  { label: "Bien", value: "good" },
  { label: "Normal", value: "ok" },
  { label: "Cansado", value: "tired" },
  { label: "Mal", value: "bad" },
];
const filterTipo = ref(localStorage.getItem("hist.tipo") || null);
const filterMood = ref(localStorage.getItem("hist.mood") || null);
watch(filterTipo, (v) => localStorage.setItem("hist.tipo", v || ""));
watch(filterMood, (v) => localStorage.setItem("hist.mood", v || ""));

/* ===== DATA ===== */
const userId = computed(() => auth?.user?.id || auth?.user?._id || null);
const raw = ref([]);
const loading = ref(false);
const error = ref(null);
const exporting = ref(false);

/* ===== COLUMNS ===== */
const allColumns = [
  {
    name: "fecha",
    label: "Fecha/Hora",
    align: "left",
    field: "timestamp",
    sortable: true,
  },
  { name: "tipo", label: "Tipo", align: "left", field: "tipo", sortable: true },
  { name: "mood", label: "Ánimo", align: "left", field: "mood" },
  { name: "note", label: "Nota", align: "left", field: "note" },
  { name: "ubicacion", label: "Ubicación", align: "left", field: "ubicacion" },
  { name: "photo", label: "Foto", align: "center", field: "photo" }, // ✅
];

const visible = ref(JSON.parse(localStorage.getItem("hist.cols") || "{}"));
if (!Object.keys(visible.value).length) {
  allColumns.forEach((c) => (visible.value[c.name] = true));
} else {
  // si ya existía prefs antiguas, asegura que "photo" exista
  if (typeof visible.value.photo === "undefined") visible.value.photo = true;
}

function savePrefs() {
  localStorage.setItem("hist.cols", JSON.stringify(visible.value));
}
function toggleColumn(name) {
  visible.value[name] = !visible.value[name];
  savePrefs();
}
const visibleColumns = computed(() =>
  allColumns.filter((c) => visible.value[c.name])
);
const toggleableColumns = computed(() => allColumns);

/* ===== BUILD ROWS ===== */
const rows = computed(() => {
  const list = (raw.value || []).map((a) => {
    const ts = a.timestamp || a.createdAt || Date.now();
    const dateISO = new Date(ts).toISOString().slice(0, 10);
    return {
      __id: String(a._id || ts),
      __dayKey: dateISO, // ✅ clave para galería
      dateISO,
      timestamp: ts,
      tipo: a.tipo,
      mood: a.mood || "",
      note: a.note || "",
      ubicacion: a.ubicacion || null,
      photo: a.photo || null, // ✅
    };
  });

  let filtered = list;
  if (filterTipo.value)
    filtered = filtered.filter((r) => r.tipo === filterTipo.value);
  if (filterMood.value)
    filtered = filtered.filter((r) => r.mood === filterMood.value);

  if (filter.value) {
    const q = filter.value.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        (r.tipo || "").includes(q) ||
        (r.mood || "").includes(q) ||
        (r.note || "").toLowerCase().includes(q) ||
        formatDate(r.timestamp).includes(q) ||
        formatTime(r.timestamp).includes(q)
    );
  }

  return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

/* ===== GROUP BY DAY + WORKED TIME + COUNT PHOTOS ===== */
const groupedDays = computed(() => {
  const map = new Map();
  rows.value.forEach((r) => {
    if (!map.has(r.dateISO)) map.set(r.dateISO, []);
    map.get(r.dateISO).push(r);
  });

  const out = [];
  for (const [dateISO, list] of map.entries()) {
    const dayRows = [...list].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    let minutes = 0;
    for (let i = 0; i < dayRows.length - 1; i++) {
      const a = dayRows[i],
        b = dayRows[i + 1];
      if (a.tipo === "entrada" && b.tipo === "salida") {
        minutes += Math.max(
          0,
          (new Date(b.timestamp) - new Date(a.timestamp)) / 60000
        );
        i++;
      }
    }

    const photos = dayRows.filter((r) => !!r.photo);

    out.push({
      dayKey: dateISO,
      dateISO,
      rows: dayRows,
      minutes,
      totalHuman: toHumanMinutes(minutes),
      open: true,
      photosCount: photos.length,
    });
  }

  return out.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
});

const dayCount = computed(() => groupedDays.value.length);
const totalWorkedHuman = computed(() =>
  toHumanMinutes(groupedDays.value.reduce((acc, d) => acc + d.minutes, 0))
);

/* ===== PAGINATION ===== */
const dayPagination = ref({ page: 1, rowsPerPage: 0 });
const tableFilterProxy = ref("");

/* ===== LOAD ===== */
async function reload() {
  if (!userId.value) {
    error.value = "No se encontró el usuario.";
    return;
  }
  loading.value = true;
  error.value = null;

  try {
    const resp = await asistenciaStore.fetchHistorialEmpleado({
      employeeId: userId.value,
      from: range.value?.from || undefined,
      to: range.value?.to || undefined,
    });
    raw.value = resp?.asistencias || [];
  } catch (e) {
    error.value = e?.message || "No se pudo cargar el historial";
  } finally {
    loading.value = false;
  }
}

/* ===== EXPORTS / ACTIONS ===== */
async function exportExcel() {
  if (!userId.value) return;
  exporting.value = true;
  try {
    await asistenciaStore.exportEmployeeExcel({
      employeeId: userId.value,
      from: range.value?.from || undefined,
      to: range.value?.to || undefined,
    });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e?.message || "No se pudo exportar",
    });
  } finally {
    exporting.value = false;
  }
}

function exportDayCSV(day) {
  const header = [
    "Fecha",
    "Hora",
    "Tipo",
    "Ánimo",
    "Nota",
    "Lat",
    "Lng",
    "FotoKey",
  ];
  const lines = day.rows.map((r) => {
    const d = formatDate(r.timestamp),
      h = formatTime(r.timestamp);
    const lat = r.ubicacion?.lat ?? "",
      lng = r.ubicacion?.lng ?? "";
    const key = r.photo?.key ?? "";
    return [
      d,
      h,
      r.tipo,
      r.mood,
      (r.note || "").replace(/\n/g, " "),
      lat,
      lng,
      key,
    ]
      .map((s) => `"${String(s).replace(/"/g, '""')}"`)
      .join(",");
  });
  downloadText(
    `asistencia_${day.dateISO}.csv`,
    [header.join(","), ...lines].join("\n")
  );
}

function exportCSV() {
  const header = [
    "Fecha",
    "Hora",
    "Tipo",
    "Ánimo",
    "Nota",
    "Lat",
    "Lng",
    "FotoKey",
  ];
  const lines = rows.value.map((r) => {
    const d = formatDate(r.timestamp),
      h = formatTime(r.timestamp);
    const lat = r.ubicacion?.lat ?? "",
      lng = r.ubicacion?.lng ?? "";
    const key = r.photo?.key ?? "";
    return [
      d,
      h,
      r.tipo,
      r.mood,
      (r.note || "").replace(/\n/g, " "),
      lat,
      lng,
      key,
    ]
      .map((s) => `"${String(s).replace(/"/g, '""')}"`)
      .join(",");
  });
  downloadText("asistencia.csv", [header.join(","), ...lines].join("\n"));
}

function printTable() {
  window.print();
}

async function copySummary() {
  const text = `Historial (${periodLabel.value})\nDías: ${dayCount.value}\nMarcas: ${rows.value.length}\nHoras totales: ${totalWorkedHuman.value}`;
  try {
    await navigator.clipboard.writeText(text);
    $q.notify({ type: "positive", message: "Resumen copiado" });
  } catch {
    $q.notify({ type: "warning", message: "No se pudo copiar" });
  }
}

function copyDay(day) {
  const lines = day.rows.map(
    (r) =>
      `${formatTime(r.timestamp)} · ${cap(r.tipo)} · ${moodLabel(r.mood)} · ${
        r.note || "—"
      }`
  );
  const text =
    `${formatDateHuman(day.dateISO)} · Total: ${day.totalHuman}\n` +
    lines.join("\n");
  navigator.clipboard.writeText(text);
  $q.notify({ type: "positive", message: "Día copiado" });
}

/* =======================
   ✅ FOTO: VISOR PRO
======================= */
const viewer = reactive({
  open: false,
  loading: false,
  error: null,
  src: null,
  list: [], // [{ row, photo }]
  index: 0,
});

const photoCache = reactive(Object.create(null)); // key => resolved url

const viewerItem = computed(() => viewer.list[viewer.index] || null);
const viewerRow = computed(() => viewerItem.value?.row || null);
const viewerPhoto = computed(() => viewerItem.value?.photo || null);

const viewerTitle = computed(() => {
  const r = viewerRow.value;
  if (!r) return "Foto";
  return `${cap(r.tipo)} · ${formatDate(r.timestamp)} ${formatTime(
    r.timestamp
  )}`;
});
const viewerSubtitle = computed(() => {
  if (viewer.list.length <= 1) return "";
  return `${viewer.index + 1} de ${viewer.list.length}`;
});

function photoKey(photo) {
  return photo?.bucket && photo?.key ? `${photo.bucket}::${photo.key}` : null;
}

/**
 * Thumb: usamos URL directa al endpoint stream.
 * Si tu endpoint stream funciona, thumbnails funcionan sin fetch extra.
 */
function thumbSrc(row) {
  if (!row?.photo) return "";
  // thumb liviano para tabla
  return buildStreamUrl(row.__id, 96);
}

function buildStreamUrl(attendanceId, size) {
  debugger;
  if (!attendanceId) return "";
  const base = `${PHOTO_STREAM_ENDPOINT}/${encodeURIComponent(
    String(attendanceId)
  )}/photo`;
  if (!size) return base;
  return `${base}?size=${encodeURIComponent(String(size))}`;
}

async function resolvePhotoUrl(photo) {
  const k = photoKey(photo);
  if (!k) return null;

  // 1) si el backend ya manda url
  if (photo?.url) {
    photoCache[k] = photo.url;
    return photo.url;
  }

  // 2) si ya está cacheado
  if (photoCache[k]) return photoCache[k];

  // 3) si el store tiene un método (opcional)
  if (typeof asistenciaStore?.getAttendancePhotoUrl === "function") {
    const u = await asistenciaStore.getAttendancePhotoUrl(photo);
    if (u) {
      photoCache[k] = u;
      return u;
    }
  }

  // 4) intentar signed endpoint (si existe)
  try {
    const qs = new URLSearchParams({
      bucket: String(photo.bucket),
      key: String(photo.key),
    });
    const r = await fetch(`${PHOTO_SIGNED_ENDPOINT}?${qs.toString()}`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (r.ok) {
      const data = await r.json().catch(() => null);
      const url =
        data?.url ||
        data?.data?.url ||
        data?.signedUrl ||
        data?.data?.signedUrl ||
        null;
      if (url) {
        photoCache[k] = url;
        return url;
      }
    }
  } catch {
    // si falla, caemos a stream
  }

  // 5) fallback stream (lo más simple y estable)
  const streamUrl = buildStreamUrl(photo);
  if (streamUrl) {
    photoCache[k] = streamUrl;
    return streamUrl;
  }

  return null;
}

async function openFromRow(row, dayKey) {
  const day = groupedDays.value.find((d) => d.dayKey === dayKey);
  const list = (day?.rows || [])
    .filter((r) => !!r.photo)
    .map((r) => ({ row: r, photo: r.photo }));
  const idx = Math.max(
    0,
    list.findIndex((x) => x.row.__id === row.__id)
  );
  openViewer(list, idx);
}

function openDayGallery(day) {
  const list = (day?.rows || [])
    .filter((r) => !!r.photo)
    .map((r) => ({ row: r, photo: r.photo }));
  openViewer(list, 0);
}

function openViewer(list, index = 0) {
  viewer.list = Array.isArray(list) ? list : [];
  viewer.index = Math.min(
    Math.max(0, index),
    Math.max(0, viewer.list.length - 1)
  );
  viewer.open = true;
  loadCurrentPhoto();
}

function closeViewer() {
  viewer.open = false;
  viewer.loading = false;
  viewer.error = null;
  viewer.src = null;
  viewer.list = [];
  viewer.index = 0;
}

async function loadCurrentPhoto() {
  viewer.loading = true;
  viewer.error = null;
  viewer.src = null;

  const p = viewerPhoto.value;
  if (!p) {
    viewer.loading = false;
    viewer.error = "No hay foto disponible.";
    return;
  }

  try {
    const url = await resolvePhotoUrl(p);
    if (!url) {
      viewer.error = "No se pudo resolver la URL de la foto (signed/stream).";
    } else {
      viewer.src = url;
    }
  } catch (e) {
    viewer.error = e?.message || "Error cargando la foto";
  } finally {
    viewer.loading = false;
  }
}

function prevPhoto() {
  if (viewer.list.length <= 1) return;
  viewer.index = (viewer.index - 1 + viewer.list.length) % viewer.list.length;
  loadCurrentPhoto();
}
function nextPhoto() {
  if (viewer.list.length <= 1) return;
  viewer.index = (viewer.index + 1) % viewer.list.length;
  loadCurrentPhoto();
}

function onViewerError() {
  viewer.error = "No se pudo mostrar la imagen (URL inválida o sin permisos).";
}

function onThumbError(photo) {
  // si el thumb stream falla, no hacemos nada agresivo; el visor intentará signed/stream al abrir
  const k = photoKey(photo);
  if (k && photoCache[k] && photoCache[k].includes("mode=thumb"))
    delete photoCache[k];
}

async function copyViewerLink() {
  try {
    const u = viewer.src || "";
    await navigator.clipboard.writeText(u);
    $q.notify({ type: "positive", message: "Link copiado" });
  } catch {
    $q.notify({ type: "warning", message: "No se pudo copiar" });
  }
}

function openInNewTab() {
  if (!viewer.src) return;
  window.open(viewer.src, "_blank", "noopener,noreferrer");
}

/* ===== UTILS ===== */
function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
function formatDate(ts) {
  return new Date(ts).toLocaleDateString("es-CL");
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDateHuman(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function moodLabel(m) {
  return (
    {
      great: "Excelente",
      good: "Bien",
      ok: "Normal",
      tired: "Cansado",
      bad: "Mal",
    }[m] ||
    m ||
    "—"
  );
}
function moodIcon(m) {
  return (
    {
      great: "mood",
      good: "sentiment_very_satisfied",
      ok: "sentiment_satisfied",
      tired: "sentiment_dissatisfied",
      bad: "sentiment_very_dissatisfied",
    }[m] || "mood"
  );
}
function moodColor(m) {
  return (
    {
      great: "primary",
      good: "positive",
      ok: "info",
      tired: "warning",
      bad: "negative",
    }[m] || "grey"
  );
}
function toHumanMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}
function mapsLink(u) {
  return `https://maps.google.com/?q=${Number(u.lat)},${Number(u.lng)}`;
}
function locToText(u) {
  const lat = Number(u?.lat),
    lng = Number(u?.lng),
    acc = u?.acc;
  const base =
    isFinite(lat) && isFinite(lng)
      ? `lat ${lat.toFixed(5)}, lng ${lng.toFixed(5)}`
      : "—";
  return acc ? `${base} (±${Math.round(acc)}m)` : base;
}
function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ===== INIT ===== */
const subHeader = computed(
  () => `${rows.value.length} registros filtrados · ${dayCount.value} días`
);

onMounted(() => {
  if (rangePreset.value !== "custom") setPresetDates(rangePreset.value);
  reload();
});
</script>

<style scoped>
.header-actions {
  padding: 6px 10px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--q-primary) 6%, transparent);
}
.rk-date :deep(.q-field__control) {
  border-radius: 10px;
}
.day-header {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 12px;
  margin-bottom: 4px;
}
.ellipsis {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rk-thumb {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--q-primary) 18%, transparent);
}

.rk-viewer {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.rk-viewer-bar {
  position: sticky;
  top: 0;
  z-index: 2;
}
.rk-viewer-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 10px;
}
.rk-image-wrap {
  position: relative;
  min-height: 48vh;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--q-primary) 12%, transparent);
}
.rk-image {
  height: 52vh;
}
.rk-viewer-error {
  display: flex;
  align-items: center;
}
.rk-meta {
  border-radius: 14px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--q-primary) 12%, transparent);
  background: color-mix(in srgb, var(--q-primary) 4%, transparent);
}
.rk-note {
  white-space: pre-wrap;
  word-break: break-word;
}

@media print {
  .header-actions,
  .rk-date,
  .q-btn,
  .q-banner {
    display: none !important;
  }
  .q-page {
    padding: 0 !important;
    background: #fff !important;
    color: #000 !important;
  }
}
</style>
