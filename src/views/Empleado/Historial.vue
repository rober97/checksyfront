<template>
  <q-page class="attendance-page">
    <!-- Stats Cards -->
    <StatsCards
      :total-records="rows.length"
      :total-days="dayCount"
      :total-hours="totalWorkedHuman"
    />

    <!-- Range Toolbar -->
    <RangeToolbar
      v-model="rangePreset"
      :range="range"
      :loading="loading"
      @update:range="onRangeUpdate"
      @export="handleExport"
      @refresh="reload"
    />

    <!-- Filters Bar -->
    <FiltersBar
      v-model:search="filter"
      v-model:tipo="filterTipo"
      v-model:mood="filterMood"
      @show-columns="showColumnsDialog = true"
    />

    <!-- Error Alert -->
    <transition name="slide-fade">
      <div v-if="error" class="error-alert">
        <div class="error-icon">
          <q-icon name="error_outline" size="28px" />
        </div>
        <div class="error-content">
          <div class="error-title">Error al cargar datos</div>
          <div class="error-message">{{ error }}</div>
        </div>
        <q-btn
          unelevated
          rounded
          label="Reintentar"
          icon-right="refresh"
          @click="reload"
          class="error-action"
        />
      </div>
    </transition>

    <!-- Main Content -->
    <div class="content-container">
      <!-- Empty State -->
      <div v-if="!loading && rows.length === 0" class="empty-state">
        <div class="empty-illustration">
          <q-icon name="inbox" />
        </div>
        <h3 class="empty-title">No hay registros</h3>
        <p class="empty-text">
          No se encontraron asistencias en el período seleccionado.<br />
          Intenta cambiar el rango de fechas o los filtros aplicados.
        </p>
        <q-btn
          unelevated
          rounded
          color="primary"
          label="Cambiar período"
          icon="tune"
          @click="rangePreset = 'custom'"
          class="empty-action"
        />
      </div>

      <!-- Days List -->
      <div v-else class="days-list">
        <DayCard
          v-for="day in groupedDays"
          :key="day.dayKey"
          :day-name="formatDayName(day.dateISO)"
          :formatted-date="formatDateHuman(day.dateISO)"
          :total-time="day.totalHuman"
          :record-count="day.rows.length"
          :photo-count="day.photosCount"
          @copy="copyDay(day)"
          @download="exportDayCSV(day)"
          @view-photos="openDayGallery(day)"
        >
          <div class="attendance-list">
            <AttendanceRow
              v-for="record in day.rows"
              :key="record.__id"
              :record="record"
              :photo-thumb="thumbSrc(record)"
              @view-photo="openFromRow(record, day.dayKey)"
            />
          </div>
        </DayCard>
      </div>

      <!-- Loading -->
      <q-inner-loading :showing="loading">
        <div class="loading-content">
          <q-spinner-orbit size="60px" color="primary" />
          <div class="loading-text">Cargando registros...</div>
        </div>
      </q-inner-loading>
    </div>

    <!-- Photo Viewer Dialog -->
    <q-dialog
      v-model="viewer.open"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="photo-viewer">
        <div class="viewer-header">
          <div class="viewer-info">
            <h3>{{ viewerTitle }}</h3>
            <p v-if="viewerSubtitle">{{ viewerSubtitle }}</p>
          </div>

          <div class="viewer-actions">
            <q-btn
              flat
              round
              icon="content_copy"
              @click="copyViewerLink"
              color="white"
            >
              <q-tooltip>Copiar enlace</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              icon="open_in_new"
              @click="openInNewTab"
              color="white"
            >
              <q-tooltip>Abrir en nueva pestaña</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              icon="close"
              @click="closeViewer"
              color="white"
            >
              <q-tooltip>Cerrar (ESC)</q-tooltip>
            </q-btn>
          </div>
        </div>

        <div class="viewer-body">
          <button
            v-if="viewer.list.length > 1"
            class="viewer-nav viewer-nav--prev"
            @click="prevPhoto"
          >
            <q-icon name="chevron_left" size="32px" />
          </button>

          <button
            v-if="viewer.list.length > 1"
            class="viewer-nav viewer-nav--next"
            @click="nextPhoto"
          >
            <q-icon name="chevron_right" size="32px" />
          </button>

          <div class="viewer-stage">
            <q-inner-loading :showing="viewer.loading">
              <q-spinner size="60px" color="white" />
            </q-inner-loading>

            <transition name="photo-fade" mode="out-in">
              <q-img
                v-if="viewer.src && !viewer.error"
                :key="viewer.src"
                :src="viewer.src"
                fit="contain"
                class="viewer-image"
                no-spinner
                @error="onViewerError"
              />

              <div v-else-if="viewer.error" class="viewer-error">
                <q-icon name="broken_image" size="80px" />
                <h3>Error al cargar imagen</h3>
                <p>{{ viewer.error }}</p>
                <q-btn
                  unelevated
                  rounded
                  color="white"
                  text-color="dark"
                  icon="refresh"
                  label="Reintentar"
                  @click="loadCurrentPhoto"
                />
              </div>
            </transition>
          </div>
        </div>

        <div v-if="viewer.list.length > 1" class="viewer-filmstrip">
          <div class="filmstrip-scroll">
            <button
              v-for="(r, i) in viewer.list"
              :key="r.__id"
              :class="['filmstrip-thumb', { 'filmstrip-thumb--active': i === viewer.index }]"
              @click="jumpTo(i)"
            >
              <q-img :src="thumbSrc(r)" ratio="1" fit="cover" no-spinner />
              <div class="filmstrip-overlay">
                <q-icon
                  :name="r.tipo === 'entrada' ? 'login' : 'logout'"
                  size="12px"
                />
              </div>
            </button>
          </div>
        </div>
      </q-card>
    </q-dialog>

    <!-- Columns Dialog -->
    <q-dialog v-model="showColumnsDialog">
      <q-card class="columns-dialog">
        <q-card-section class="dialog-header">
          <h3>Mostrar columnas</h3>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="dialog-body">
          <q-list>
            <q-item
              v-for="col in toggleableColumns"
              :key="col.name"
              tag="label"
              class="column-item"
            >
              <q-item-section>
                <q-checkbox
                  v-model="visible[col.name]"
                  :label="col.label"
                  @update:model-value="savePrefs"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/authStore';
import { useAsistenciaStore } from '@/stores/asistenciaStore';
import { API_URL } from '@/utils/api';

import StatsCards from '@/components/StatsCards.vue';
import RangeToolbar from '@/components/RangeToolbar.vue';
import FiltersBar from '@/components/FiltersBar.vue';
import DayCard from '@/components/DayCard.vue';
import AttendanceRow from '@/components/AttendanceRow.vue';

/* ===== CONFIG ===== */
const API_BASE = API_URL.replace(/\/$/, '');
const PHOTO_STREAM_BASE = `${API_BASE}/attendance/photo`;

function buildPhotoUrl(attendanceId, size) {
  if (!attendanceId) return '';
  const base = `${PHOTO_STREAM_BASE}/${encodeURIComponent(String(attendanceId))}/photo`;
  return size ? `${base}?size=${encodeURIComponent(String(size))}` : base;
}

/* ===== SETUP ===== */
const $q = useQuasar();
const auth = useAuthStore();
const asistenciaStore = useAsistenciaStore();

/* ===== STATE ===== */
const rangePreset = ref(localStorage.getItem('hist.preset') || '7d');
const range = ref({ from: null, to: null });
const filter = ref(localStorage.getItem('hist.filter') || '');
const filterTipo = ref(localStorage.getItem('hist.tipo') || null);
const filterMood = ref(localStorage.getItem('hist.mood') || null);
const raw = ref([]);
const loading = ref(false);
const error = ref(null);
const exporting = ref(false);
const showColumnsDialog = ref(false);

/* ===== WATCHERS ===== */
watch(filter, (v) => localStorage.setItem('hist.filter', v || ''));
watch(filterTipo, (v) => localStorage.setItem('hist.tipo', v || ''));
watch(filterMood, (v) => localStorage.setItem('hist.mood', v || ''));

/* ===== COLUMNS ===== */
const allColumns = [
  { name: 'fecha', label: 'Fecha/Hora' },
  { name: 'tipo', label: 'Tipo' },
  { name: 'mood', label: 'Ánimo' },
  { name: 'note', label: 'Nota' },
  { name: 'ubicacion', label: 'Ubicación' },
  { name: 'photo', label: 'Foto' }
];

const visible = ref(JSON.parse(localStorage.getItem('hist.cols') || '{}'));
if (!Object.keys(visible.value).length) {
  allColumns.forEach((c) => (visible.value[c.name] = true));
}

function savePrefs() {
  localStorage.setItem('hist.cols', JSON.stringify(visible.value));
}

const toggleableColumns = computed(() => allColumns);

/* ===== DATA PROCESSING ===== */
const userId = computed(() => auth?.user?.id || auth?.user?._id || null);

const rows = computed(() => {
  const list = (raw.value || []).map((a) => {
    const ts = a.timestamp || a.createdAt || Date.now();
    const dateISO = new Date(ts).toISOString().slice(0, 10);
    const realId = a?._id ? String(a._id) : null;

    return {
      __id: realId || `tmp-${String(ts)}`,
      __realId: realId,
      __dayKey: dateISO,
      dateISO,
      timestamp: ts,
      tipo: a.tipo,
      mood: a.mood || '',
      note: a.note || '',
      ubicacion: a.ubicacion || null,
      photo: a.photo || null
    };
  });

  let filtered = list;

  if (filterTipo.value) filtered = filtered.filter((r) => r.tipo === filterTipo.value);
  if (filterMood.value) filtered = filtered.filter((r) => r.mood === filterMood.value);

  if (filter.value) {
    const q = filter.value.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        (r.tipo || '').includes(q) ||
        (r.mood || '').includes(q) ||
        (r.note || '').toLowerCase().includes(q)
    );
  }

  return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

const groupedDays = computed(() => {
  const map = new Map();
  rows.value.forEach((r) => {
    if (!map.has(r.dateISO)) map.set(r.dateISO, []);
    map.get(r.dateISO).push(r);
  });

  const out = [];
  for (const [dateISO, list] of map.entries()) {
    const dayRows = [...list].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let minutes = 0;
    for (let i = 0; i < dayRows.length - 1; i++) {
      const a = dayRows[i];
      const b = dayRows[i + 1];
      if (a.tipo === 'entrada' && b.tipo === 'salida') {
        minutes += Math.max(0, (new Date(b.timestamp) - new Date(a.timestamp)) / 60000);
        i++;
      }
    }

    const photos = dayRows.filter((r) => !!r.photo && !!r.__realId);

    out.push({
      dayKey: dateISO,
      dateISO,
      rows: dayRows,
      minutes,
      totalHuman: toHumanMinutes(minutes),
      photosCount: photos.length
    });
  }

  return out.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
});

const dayCount = computed(() => groupedDays.value.length);
const totalWorkedHuman = computed(() =>
  toHumanMinutes(groupedDays.value.reduce((acc, d) => acc + d.minutes, 0))
);
const subHeader = computed(() => `${rows.value.length} registros · ${dayCount.value} días trabajados`);

/* ===== RANGE MANAGEMENT ===== */
function setPresetDates(val) {
  const now = new Date();

  if (val === '7d') {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    range.value = { from: s.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  } else if (val === '30d') {
    const s = new Date(now);
    s.setDate(s.getDate() - 29);
    range.value = { from: s.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  } else if (val === 'ytd') {
    const s = new Date(now.getFullYear(), 0, 1);
    range.value = { from: s.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  } else if (val === 'all') {
    range.value = { from: null, to: null };
  }
}

watch(rangePreset, (val) => {
  localStorage.setItem('hist.preset', val);
  if (val !== 'custom') {
    setPresetDates(val);
    reload();
  }
});

function onRangeUpdate(newRange) {
  range.value = newRange;
  reload();
}

/* ===== DATA LOADING ===== */
async function reload() {
  if (!userId.value) {
    error.value = 'No se encontró el usuario.';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const resp = await asistenciaStore.fetchHistorialEmpleado({
      employeeId: userId.value,
      from: range.value?.from || undefined,
      to: range.value?.to || undefined
    });

    raw.value = resp?.asistencias || [];
  } catch (e) {
    error.value = e?.message || 'No se pudo cargar el historial';
  } finally {
    loading.value = false;
  }
}

/* ===== EXPORTS ===== */
function handleExport(type) {
  if (type === 'excel') exportExcel();
  else if (type === 'csv') exportCSV();
  else if (type === 'print') printTable();
}

async function exportExcel() {
  if (!userId.value) return;
  exporting.value = true;
  try {
    await asistenciaStore.exportEmployeeExcel({
      employeeId: userId.value,
      from: range.value?.from || undefined,
      to: range.value?.to || undefined
    });
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'No se pudo exportar' });
  } finally {
    exporting.value = false;
  }
}

function exportDayCSV(day) {
  const header = ['Fecha', 'Hora', 'Tipo', 'Ánimo', 'Nota', 'Lat', 'Lng'];
  const lines = day.rows.map((r) => {
    const d = formatDate(r.timestamp);
    const h = formatTime(r.timestamp);
    const lat = r.ubicacion?.lat ?? '';
    const lng = r.ubicacion?.lng ?? '';
    return [d, h, r.tipo, r.mood, (r.note || '').replace(/\n/g, ' '), lat, lng]
      .map((s) => `"${String(s).replace(/"/g, '""')}"`)
      .join(',');
  });

  downloadText(`asistencia_${day.dateISO}.csv`, [header.join(','), ...lines].join('\n'));
}

function exportCSV() {
  const header = ['Fecha', 'Hora', 'Tipo', 'Ánimo', 'Nota', 'Lat', 'Lng'];
  const lines = rows.value.map((r) => {
    const d = formatDate(r.timestamp);
    const h = formatTime(r.timestamp);
    const lat = r.ubicacion?.lat ?? '';
    const lng = r.ubicacion?.lng ?? '';
    return [d, h, r.tipo, r.mood, (r.note || '').replace(/\n/g, ' '), lat, lng]
      .map((s) => `"${String(s).replace(/"/g, '""')}"`)
      .join(',');
  });

  downloadText('asistencia.csv', [header.join(','), ...lines].join('\n'));
}

function printTable() {
  window.print();
}

function copyDay(day) {
  const lines = day.rows.map((r) => `${formatTime(r.timestamp)} · ${cap(r.tipo)}`);
  const text = `${formatDateHuman(day.dateISO)} · Total: ${day.totalHuman}\n` + lines.join('\n');
  navigator.clipboard.writeText(text);
  $q.notify({ type: 'positive', message: 'Día copiado' });
}

/* ===== PHOTO HANDLING ===== */
const photoUrlCache = reactive(Object.create(null));
const photoCacheKey = (attendanceId, size) => `${attendanceId}::${size || 'full'}`;

function thumbSrc(row) {
  if (!row?.photo || !row?.__realId) return '';
  const ck = photoCacheKey(row.__realId, 96);
  if (!photoUrlCache[ck]) photoUrlCache[ck] = buildPhotoUrl(row.__realId, 96);
  return photoUrlCache[ck];
}

function fullSrc(row) {
  if (!row?.photo || !row?.__realId) return '';
  const ck = photoCacheKey(row.__realId, null);
  if (!photoUrlCache[ck]) photoUrlCache[ck] = buildPhotoUrl(row.__realId);
  return photoUrlCache[ck];
}

const viewer = reactive({
  open: false,
  loading: false,
  error: null,
  src: null,
  list: [],
  index: 0
});

const viewerRow = computed(() => viewer.list[viewer.index] || null);
const viewerTitle = computed(() => {
  const r = viewerRow.value;
  if (!r) return 'Foto';
  return `${cap(r.tipo)} · ${formatDate(r.timestamp)} ${formatTime(r.timestamp)}`;
});
const viewerSubtitle = computed(() => {
  if (viewer.list.length <= 1) return '';
  return `Foto ${viewer.index + 1} de ${viewer.list.length}`;
});

function openFromRow(row, dayKey) {
  const day = groupedDays.value.find((d) => d.dayKey === dayKey);
  const list = (day?.rows || []).filter((r) => !!r.photo && !!r.__realId);
  const idx = Math.max(0, list.findIndex((x) => x.__id === row.__id));
  openViewer(list, idx);
}

function openDayGallery(day) {
  const list = (day?.rows || []).filter((r) => !!r.photo && !!r.__realId);
  openViewer(list, 0);
}

function openViewer(list, index = 0) {
  viewer.list = Array.isArray(list) ? list : [];
  viewer.index = clamp(index, 0, Math.max(0, viewer.list.length - 1));
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

function jumpTo(i) {
  viewer.index = clamp(i, 0, Math.max(0, viewer.list.length - 1));
  loadCurrentPhoto();
}

async function loadCurrentPhoto() {
  viewer.loading = true;
  viewer.error = null;
  viewer.src = null;

  const r = viewerRow.value;
  if (!r?.photo || !r?.__realId) {
    viewer.loading = false;
    viewer.error = 'No hay foto disponible.';
    return;
  }

  try {
    viewer.src = fullSrc(r);
  } catch (e) {
    viewer.error = e?.message || 'Error cargando la foto';
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
  viewer.error = 'No se pudo mostrar la imagen.';
}

async function copyViewerLink() {
  try {
    await navigator.clipboard.writeText(viewer.src || '');
    $q.notify({ type: 'positive', message: 'Link copiado' });
  } catch {
    $q.notify({ type: 'warning', message: 'No se pudo copiar' });
  }
}

function openInNewTab() {
  if (!viewer.src) return;
  window.open(viewer.src, '_blank', 'noopener,noreferrer');
}

function onViewerKeydown(e) {
  if (!viewer.open) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeViewer();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prevPhoto();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    nextPhoto();
  }
}

watch(
  () => viewer.open,
  (isOpen) => {
    if (isOpen) window.addEventListener('keydown', onViewerKeydown, { passive: false });
    else window.removeEventListener('keydown', onViewerKeydown);
  }
);

/* ===== UTILITIES ===== */
function clamp(n, min, max) {
  return Math.min(Math.max(Number(n) || 0, min), max);
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('es-CL');
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function formatDateHuman(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatDayName(iso) {
  const date = new Date(iso + 'T12:00:00');
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

function toHumanMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ===== INIT ===== */
onMounted(() => {
  if (rangePreset.value !== 'custom') setPresetDates(rangePreset.value);
  reload();
});
</script>

<style scoped>
/* ==================== BASE ==================== */
.attendance-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fafbfc 0%, #f4f6f9 100%);
  padding: 48px 32px;
}

body.body--dark .attendance-page {
  background: linear-gradient(180deg, #0a0e1a 0%, #131826 100%);
}

/* ==================== HEADER ==================== */
.page-header {
  margin-bottom: 48px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 42px;
  font-weight: 900;
  letter-spacing: -0.04em;
  margin: 0;
  background: linear-gradient(135deg, #1e293b 0%, #64748b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

body.body--dark .page-title {
  background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
  margin: 0;
  letter-spacing: 0.01em;
}

body.body--dark .page-subtitle {
  color: #94a3b8;
}

/* ==================== ERROR ALERT ==================== */
.error-alert {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 32px;
  margin-bottom: 32px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-left: 4px solid #dc2626;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

body.body--dark .error-alert {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%);
}

.error-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(220, 38, 38, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 16px;
  font-weight: 700;
  color: #991b1b;
  margin-bottom: 4px;
}

body.body--dark .error-title {
  color: #fca5a5;
}

.error-message {
  font-size: 14px;
  color: #64748b;
}

body.body--dark .error-message {
  color: #94a3b8;
}

.error-action {
  flex-shrink: 0;
  font-weight: 700;
}

/* ==================== CONTENT ==================== */
.content-container {
  position: relative;
  min-height: 500px;
}

.days-list {
  max-width: 1400px;
  margin: 0 auto;
}

.attendance-list {
  padding: 8px 0;
}

/* ==================== EMPTY STATE ==================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  text-align: center;
}

.empty-illustration {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 70px;
  color: #6366f1;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
}

body.body--dark .empty-illustration {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  color: #a5b4fc;
}

.empty-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.empty-text {
  font-size: 15px;
  color: #64748b;
  margin: 0 0 32px;
  max-width: 500px;
  line-height: 1.6;
}

body.body--dark .empty-text {
  color: #94a3b8;
}

.empty-action {
  font-weight: 700;
  padding: 14px 32px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* ==================== LOADING ==================== */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 60px;
}

.loading-text {
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
}

body.body--dark .loading-text {
  color: #94a3b8;
}

/* ==================== PHOTO VIEWER ==================== */
.photo-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #000;
}

.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 24px;
}

.viewer-info {
  flex: 1;
  min-width: 0;
  color: white;
}

.viewer-info h3 {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viewer-info p {
  font-size: 13px;
  margin: 0;
  opacity: 0.6;
  font-weight: 500;
}

.viewer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.viewer-body {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.viewer-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
}

.viewer-nav:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.1);
}

.viewer-nav--prev {
  left: 32px;
}

.viewer-nav--next {
  right: 32px;
}

.viewer-stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.viewer-image {
  max-width: 100%;
  max-height: 100%;
}

.viewer-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: white;
  text-align: center;
}

.viewer-error h3 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.viewer-error p {
  font-size: 15px;
  opacity: 0.7;
  margin: 0;
}

.viewer-filmstrip {
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 20px 28px;
  overflow-x: auto;
}

.filmstrip-scroll {
  display: flex;
  gap: 12px;
  min-width: min-content;
}

.filmstrip-thumb {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 14px;
  overflow: hidden;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
  background: transparent;
  padding: 0;
}

.filmstrip-thumb:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

.filmstrip-thumb--active {
  border-color: #fff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5);
}

.filmstrip-overlay {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* ==================== COLUMNS DIALOG ==================== */
.columns-dialog {
  border-radius: 20px;
  overflow: hidden;
  min-width: 400px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

body.body--dark .dialog-header {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.dialog-header h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.dialog-body {
  padding: 8px 0;
}

.column-item {
  padding: 12px 28px;
  transition: background 0.2s;
}

.column-item:hover {
  background: #f8fafc;
}

body.body--dark .column-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

/* ==================== ANIMATIONS ==================== */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.photo-fade-enter-active,
.photo-fade-leave-active {
  transition: opacity 0.3s ease;
}

.photo-fade-enter-from,
.photo-fade-leave-to {
  opacity: 0;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .attendance-page {
    padding: 32px 20px;
  }

  .page-title {
    font-size: 36px;
  }
}

@media (max-width: 768px) {
  .attendance-page {
    padding: 24px 16px;
  }

  .page-header {
    margin-bottom: 32px;
  }

  .page-title {
    font-size: 28px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .error-alert {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .error-action {
    align-self: stretch;
  }

  .viewer-nav {
    width: 48px;
    height: 48px;
  }

  .viewer-nav--prev {
    left: 16px;
  }

  .viewer-nav--next {
    right: 16px;
  }

  .filmstrip-thumb {
    width: 64px;
    height: 64px;
  }

  .columns-dialog {
    min-width: auto;
    width: 100%;
  }
}

@media print {
  .page-header,
  .error-alert,
  .action-btn {
    display: none !important;
  }

  .attendance-page {
    background: white;
    padding: 0;
  }
}
</style>