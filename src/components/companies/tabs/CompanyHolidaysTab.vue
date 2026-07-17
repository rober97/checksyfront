<template>
  <div class="cht-root">
    <div class="cht-layout">

      <!-- LEFT: Add dates -->
      <div class="cht-add-panel">

        <!-- Bulk paste -->
        <div class="cht-card">
          <div class="cht-card-head">
            <div class="cht-card-icon cht-ci--blue"><q-icon name="content_paste" size="15px" /></div>
            <div>
              <div class="cht-card-title">Pegar múltiples fechas</div>
              <div class="cht-card-sub">Separa con coma, espacio o salto de línea</div>
            </div>
          </div>
          <q-input
            v-model="bulkText"
            type="textarea" outlined dense autogrow
            placeholder="2025-01-01, 2025-04-18&#10;2025-05-01"
            class="cht-textarea"
          />
          <div class="cht-card-foot">
            <div class="cht-hint"><q-icon name="info_outline" size="13px" />Formato: <code>YYYY-MM-DD</code></div>
            <q-btn unelevated color="primary" label="Agregar fechas" icon="playlist_add" dense :disable="!bulkText.trim()" @click="applyBulk" />
          </div>
        </div>

        <!-- Single date -->
        <div class="cht-card">
          <div class="cht-card-head">
            <div class="cht-card-icon cht-ci--teal"><q-icon name="event" size="15px" /></div>
            <div>
              <div class="cht-card-title">Agregar una fecha</div>
              <div class="cht-card-sub">Presiona Enter para agregar rápido</div>
            </div>
          </div>
          <div class="cht-single-row">
            <q-input
              v-model="singleDate"
              outlined dense
              mask="####-##-##" fill-mask
              placeholder="YYYY-MM-DD"
              class="cht-single-input"
              @keyup.enter="addSingle"
            />
            <q-btn unelevated color="primary" icon="add" :label="$q.screen.gt.sm ? 'Agregar' : ''" dense @click="addSingle" />
          </div>
        </div>

        <!-- Quick year picker -->
        <div class="cht-card cht-card--flat">
          <div class="cht-quick-head">
            <q-icon name="bolt" size="14px" color="amber" />
            Feriados nacionales Chile
            <q-btn-toggle
              v-model="year"
              :options="yearOptions"
              unelevated dense no-caps size="sm"
              class="cht-year-toggle"
              toggle-color="primary"
            />
            <q-spinner v-if="loading" size="13px" color="primary" />
            <q-space />
            <button type="button" class="cht-qlink" @click="toggleYear">
              <q-icon :name="allYearAdded ? 'remove_done' : 'done_all'" size="13px" />
              {{ allYearAdded ? 'Quitar todos' : 'Cargar todos' }}
            </button>
          </div>
          <div class="cht-quick-chips">
            <button
              v-for="f in yearHolidays" :key="f.date" type="button"
              class="cht-qchip" :class="{ 'is-added': m.includes(f.date) }"
              @click="toggleQuick(f.date)"
            >
              <q-icon :name="m.includes(f.date) ? 'check' : 'add'" size="11px" />
              {{ f.label }}
              <q-tooltip :delay="400">
                {{ f.name }} · {{ f.date }}<template v-if="f.inalienable"> · Irrenunciable</template>
              </q-tooltip>
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT: Calendar view -->
      <div class="cht-list-panel">
        <div class="cht-list-header">
          <div class="cht-list-title">
            Días registrados
            <div class="cht-count-badge">{{ m.length }}</div>
          </div>
          <div class="cht-list-actions">
            <q-btn v-if="m.length > 1" flat dense size="sm" icon="sort" label="Ordenar" color="grey" @click="sortAll" />
            <q-btn v-if="m.length > 0" flat dense size="sm" icon="delete_sweep" label="Limpiar" color="negative" @click="clearAll" />
          </div>
        </div>

        <div v-if="!m.length" class="cht-empty">
          <div class="cht-empty-icon"><q-icon name="event_busy" size="32px" /></div>
          <div class="cht-empty-title">Sin feriados configurados</div>
          <div class="cht-empty-sub">Agrega fechas desde el panel izquierdo</div>
        </div>

        <div v-else class="cht-chips-grid">
          <div
            v-for="d in m"
            :key="d"
            class="cht-chip"
          >
            <div class="cht-chip-cal">
              <div class="cht-chip-month">{{ monthName(d) }}</div>
              <div class="cht-chip-day">{{ dayNum(d) }}</div>
            </div>
            <div class="cht-chip-date">{{ d }}</div>
            <button type="button" class="cht-chip-remove" @click="remove(d)">
              <q-icon name="close" size="12px" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { chileanHolidays, holidayLabel } from '@/utils/chileanHolidays'
import secureAxios from '@/utils/secureRequest'

const props = defineProps({ modelValue: { type: Array, required: true } })
const emit  = defineEmits(['update:modelValue', 'validity'])
const $q    = useQuasar()

const m = computed({
  get: () => props.modelValue || [],
  set: v  => { emit('update:modelValue', v); emit('validity', true) },
})

const bulkText  = ref('')
const singleDate = ref('')
const currentYear = new Date().getFullYear()

const year = ref(currentYear)
const yearOptions = [currentYear, currentYear + 1].map(y => ({ label: String(y), value: y }))

// El calculador local es la fuente por defecto: la pantalla funciona sin red. Si el
// backend responde, sus feriados mandan — cubre los feriados por ley puntual
// (elecciones, censos) que no se pueden derivar del calendario.
const remote = ref({})
const loading = ref(false)

const yearHolidays = computed(() => remote.value[year.value] || chileanHolidays(year.value))
const allYearAdded = computed(() => yearHolidays.value.every(f => m.value.includes(f.date)))

const withLabels = items => items.map(h => ({ ...h, label: holidayLabel(h.date) }))

async function loadYear(y) {
  if (remote.value[y]) return
  loading.value = true
  try {
    const { data } = await secureAxios.get(`/holidays/${y}`)
    const items = Array.isArray(data?.holidays) ? data.holidays : []
    if (items.length) remote.value = { ...remote.value, [y]: withLabels(items) }
  } catch {
    // Silencioso a propósito: el calculador local ya cubre el caso.
  } finally {
    loading.value = false
  }
}

watch(year, loadYear, { immediate: true })

function parse(txt) {
  return (txt || '').split(/[\s,;|\n]+/).map(s => s.trim()).filter(s => /^\d{4}-\d{2}-\d{2}$/.test(s))
}

function applyBulk() {
  const dates = parse(bulkText.value)
  if (!dates.length) { $q.notify({ type: 'warning', message: 'Sin fechas válidas — usa formato YYYY-MM-DD' }); return }
  m.value = [...new Set([...m.value, ...dates])].sort()
  bulkText.value = ''
  $q.notify({ type: 'positive', message: `${dates.length} fecha(s) agregada(s)`, position: 'top' })
}

function addSingle() {
  const v = (singleDate.value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) { $q.notify({ type: 'warning', message: 'Formato inválido. Usa YYYY-MM-DD' }); return }
  if (m.value.includes(v)) { $q.notify({ type: 'info', message: 'La fecha ya está agregada' }); return }
  m.value = [...new Set([...m.value, v])].sort()
  singleDate.value = ''
}

function toggleQuick(date) {
  if (m.value.includes(date)) m.value = m.value.filter(x => x !== date)
  else m.value = [...new Set([...m.value, date])].sort()
}

function toggleYear() {
  const dates = yearHolidays.value.map(f => f.date)
  if (allYearAdded.value) {
    m.value = m.value.filter(d => !dates.includes(d))
    $q.notify({ type: 'info', message: `Feriados de ${year.value} quitados`, position: 'top' })
  } else {
    const nuevos = dates.filter(d => !m.value.includes(d))
    m.value = [...new Set([...m.value, ...dates])].sort()
    $q.notify({ type: 'positive', message: `${nuevos.length} feriado(s) de ${year.value} agregados`, position: 'top' })
  }
}

function remove(d) { m.value = m.value.filter(x => x !== d) }
function sortAll()  { m.value = [...m.value].sort() }
function clearAll() {
  $q.dialog({ message: '¿Limpiar todos los feriados?', ok: { label: 'Sí, limpiar', color: 'negative', unelevated: true }, cancel: { label: 'Cancelar', flat: true } }).onOk(() => m.value = [])
}

const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
const monthName = d => { try { return MONTHS[parseInt(d.slice(5,7)) - 1] || '???' } catch { return '???' } }
const dayNum    = d => { try { return d.slice(8,10) } catch { return '??' } }
</script>

<style scoped>
.cht-root { font-family: inherit; }
.cht-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }

/* Cards */
.cht-add-panel { display: flex; flex-direction: column; gap: 10px; }
.cht-card {
  background: var(--card-background); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.cht-card--flat { background: var(--color-primary-soft); box-shadow: none; border-color: rgba(12, 169, 196,.15); }
.body--dark .cht-card--flat { background: var(--color-primary-soft); border-color: rgba(12, 169, 196,.15); }

.cht-card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.cht-card-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cht-ci--blue { background: var(--color-primary-soft); color: var(--color-primary-dark); border: 1px solid rgba(12, 169, 196,.25); }
.cht-ci--teal { background: var(--color-accent-soft); color: var(--color-accent-dark); border: 1px solid rgba(6, 124, 144,.25); }

.cht-card-title { font-size: .82rem; font-weight: 700; color: var(--text-primary); }
.cht-card-sub { font-size: .71rem; color: #9ca3af; margin-top: 1px; }

.cht-textarea { margin-bottom: 10px; }
.cht-textarea :deep(.q-field__control) { border-radius: 8px; }

.cht-card-foot { display: flex; align-items: center; justify-content: space-between; }
.cht-hint { display: flex; align-items: center; gap: 5px; font-size: .71rem; color: #9ca3af; }
.cht-hint code { background: var(--surface-soft); padding: 1px 5px; border-radius: 4px; font-size: .69rem; color: var(--color-primary-dark); }

.cht-single-row { display: flex; gap: 8px; }
.cht-single-input { flex: 1; }
.cht-single-input :deep(.q-field__control) { border-radius: 8px; }

/* Quick feriados */
.cht-quick-head { display: flex; align-items: center; gap: 6px; font-size: .74rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 9px; }
.cht-year-toggle { border: 1px solid rgba(12, 169, 196,.25); border-radius: 6px; overflow: hidden; }
.cht-year-toggle :deep(.q-btn) { font-size: .68rem; font-weight: 700; padding: 0 7px; min-height: 20px; }
.cht-qlink {
  display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px;
  border: none; background: transparent; border-radius: 5px; cursor: pointer;
  color: var(--color-primary-dark); font-size: .71rem; font-weight: 700; font-family: inherit;
  transition: background .12s;
}
.cht-qlink:hover { background: rgba(12, 169, 196,.12); }
.body--dark .cht-qlink { color: var(--color-primary); }
.cht-quick-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.cht-qchip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border: 1.5px solid rgba(12, 169, 196,.2); border-radius: 6px;
  background: var(--card-background); color: var(--color-primary-dark); font-size: .73rem; font-weight: 700;
  cursor: pointer; transition: all .12s; font-family: inherit;
}
.cht-qchip:hover { background: var(--color-primary-soft); border-color: rgba(12, 169, 196,.4); }
.cht-qchip.is-added { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
.body--dark .cht-qchip { background: var(--color-primary-soft); border-color: rgba(12, 169, 196,.2); color: var(--color-primary); }
.body--dark .cht-qchip.is-added { background: var(--color-primary-dark); color: #fff; border-color: var(--color-primary-dark); }

/* List panel */
.cht-list-panel {
  background: var(--card-background); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04); display: flex; flex-direction: column; gap: 10px;
  min-height: 200px;
}

.cht-list-header { display: flex; align-items: center; justify-content: space-between; }
.cht-list-title { display: flex; align-items: center; gap: 8px; font-size: .84rem; font-weight: 800; color: var(--text-primary); }
.cht-count-badge {
  background: var(--color-primary); color: #fff;
  width: 22px; height: 22px; border-radius: 50%; font-size: .72rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.cht-list-actions { display: flex; gap: 4px; }

.cht-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 28px; flex: 1; }
.cht-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: var(--surface-soft); border: 2px dashed var(--border-color); display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
.cht-empty-title { font-size: .84rem; font-weight: 700; color: var(--text-secondary); }
.cht-empty-sub { font-size: .75rem; color: #9ca3af; }

/* Chips grid — calendar-style */
.cht-chips-grid { display: flex; flex-wrap: wrap; gap: 6px; }

.cht-chip {
  display: flex; align-items: center; gap: 7px;
  padding: 5px 8px 5px 5px;
  background: var(--surface-soft); border: 1px solid var(--border-color); border-radius: 8px;
  transition: border-color .12s;
}
.cht-chip:hover { border-color: rgba(12, 169, 196,.4); }
.body--dark .cht-chip { background: var(--background-color); border-color: var(--border-color); }
.body--dark .cht-chip:hover { border-color: var(--color-primary-dark); }

.cht-chip-cal {
  display: flex; flex-direction: column; align-items: center;
  width: 28px; height: 30px; border-radius: 5px;
  background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-dark) 35%, var(--card-background) 35%, var(--card-background) 100%);
  border: 1px solid rgba(12, 169, 196,.3); overflow: hidden;
}

.cht-chip-month { font-size: .48rem; font-weight: 800; color: #fff; line-height: 1.7; letter-spacing: .02em; }
.cht-chip-day   { font-size: .72rem; font-weight: 800; color: var(--text-primary); line-height: 1.3; }

.cht-chip-date { font-size: .74rem; font-weight: 600; color: var(--text-secondary); font-variant-numeric: tabular-nums; }

.cht-chip-remove {
  width: 18px; height: 18px; border: none; background: transparent; cursor: pointer; border-radius: 4px;
  color: #94a3b8; display: flex; align-items: center; justify-content: center; padding: 0; transition: all .1s;
}
.cht-chip-remove:hover { background: #fee2e2; color: #ef4444; }
.body--dark .cht-chip-remove:hover { background: rgba(239,68,68,.15); color: #f87171; }

@media (max-width: 680px) { .cht-layout { grid-template-columns: 1fr; } }
</style>