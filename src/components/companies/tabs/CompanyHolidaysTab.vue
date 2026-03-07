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
            <q-btn unelevated color="indigo" label="Agregar fechas" icon="playlist_add" dense :disable="!bulkText.trim()" @click="applyBulk" />
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
            <q-btn unelevated color="indigo" icon="add" :label="$q.screen.gt.sm ? 'Agregar' : ''" dense @click="addSingle" />
          </div>
        </div>

        <!-- Quick year picker -->
        <div class="cht-card cht-card--flat">
          <div class="cht-quick-head">
            <q-icon name="bolt" size="14px" color="amber" />
            Feriados nacionales Chile {{ currentYear }}
          </div>
          <div class="cht-quick-chips">
            <button v-for="f in chFeriados" :key="f.date" class="cht-qchip" :class="{ 'is-added': m.includes(f.date) }" @click="toggleQuick(f.date)">
              <q-icon :name="m.includes(f.date) ? 'check' : 'add'" size="11px" />
              {{ f.label }}
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
            <button class="cht-chip-remove" @click="remove(d)">
              <q-icon name="close" size="12px" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

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

const chFeriados = [
  { date: `${currentYear}-01-01`, label: '1 Ene' },
  { date: `${currentYear}-04-18`, label: '18 Abr' },
  { date: `${currentYear}-04-19`, label: '19 Abr' },
  { date: `${currentYear}-05-01`, label: '1 May' },
  { date: `${currentYear}-05-21`, label: '21 May' },
  { date: `${currentYear}-06-29`, label: '29 Jun' },
  { date: `${currentYear}-07-16`, label: '16 Jul' },
  { date: `${currentYear}-08-15`, label: '15 Ago' },
  { date: `${currentYear}-09-18`, label: '18 Sep' },
  { date: `${currentYear}-09-19`, label: '19 Sep' },
  { date: `${currentYear}-10-31`, label: '31 Oct' },
  { date: `${currentYear}-11-01`, label: '1 Nov' },
  { date: `${currentYear}-12-08`, label: '8 Dic' },
  { date: `${currentYear}-12-25`, label: '25 Dic' },
]

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
  background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.body--dark .cht-card { background: #1e293b; border-color: #1e2d3d; }
.cht-card--flat { background: #fafbff; box-shadow: none; border-color: #e0e7ff; }
.body--dark .cht-card--flat { background: rgba(99,102,241,.04); border-color: rgba(99,102,241,.15); }

.cht-card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.cht-card-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cht-ci--blue { background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe; }
.cht-ci--teal { background: #f0fdfa; color: #0d9488; border: 1px solid #99f6e4; }
.body--dark .cht-ci--blue { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.25); color: #93c5fd; }
.body--dark .cht-ci--teal { background: rgba(13,148,136,.12); border-color: rgba(13,148,136,.25); color: #2dd4bf; }

.cht-card-title { font-size: .82rem; font-weight: 700; color: #111827; }
.body--dark .cht-card-title { color: #f1f5f9; }
.cht-card-sub { font-size: .71rem; color: #9ca3af; margin-top: 1px; }

.cht-textarea { margin-bottom: 10px; }
.cht-textarea :deep(.q-field__control) { border-radius: 8px; }

.cht-card-foot { display: flex; align-items: center; justify-content: space-between; }
.cht-hint { display: flex; align-items: center; gap: 5px; font-size: .71rem; color: #9ca3af; }
.cht-hint code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: .69rem; color: #4f46e5; }

.cht-single-row { display: flex; gap: 8px; }
.cht-single-input { flex: 1; }
.cht-single-input :deep(.q-field__control) { border-radius: 8px; }

/* Quick feriados */
.cht-quick-head { display: flex; align-items: center; gap: 5px; font-size: .74rem; font-weight: 700; color: #374151; margin-bottom: 9px; }
.body--dark .cht-quick-head { color: #d1d5db; }
.cht-quick-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.cht-qchip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border: 1.5px solid #e0e7ff; border-radius: 6px;
  background: #fff; color: #4f46e5; font-size: .73rem; font-weight: 700;
  cursor: pointer; transition: all .12s; font-family: inherit;
}
.cht-qchip:hover { background: #eef2ff; border-color: #a5b4fc; }
.cht-qchip.is-added { background: #4f46e5; border-color: #4f46e5; color: #fff; }
.body--dark .cht-qchip { background: rgba(99,102,241,.08); border-color: rgba(99,102,241,.2); color: #a5b4fc; }
.body--dark .cht-qchip.is-added { background: #4f46e5; color: #fff; border-color: #4f46e5; }

/* List panel */
.cht-list-panel {
  background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04); display: flex; flex-direction: column; gap: 10px;
  min-height: 200px;
}
.body--dark .cht-list-panel { background: #1e293b; border-color: #1e2d3d; }

.cht-list-header { display: flex; align-items: center; justify-content: space-between; }
.cht-list-title { display: flex; align-items: center; gap: 8px; font-size: .84rem; font-weight: 800; color: #111827; }
.body--dark .cht-list-title { color: #f1f5f9; }
.cht-count-badge {
  background: #4f46e5; color: #fff;
  width: 22px; height: 22px; border-radius: 50%; font-size: .72rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.cht-list-actions { display: flex; gap: 4px; }

.cht-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 28px; flex: 1; }
.cht-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: #f8fafc; border: 2px dashed #e2e8f0; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
.body--dark .cht-empty-icon { background: #0f172a; border-color: #1e293b; }
.cht-empty-title { font-size: .84rem; font-weight: 700; color: #374151; }
.body--dark .cht-empty-title { color: #94a3b8; }
.cht-empty-sub { font-size: .75rem; color: #9ca3af; }

/* Chips grid — calendar-style */
.cht-chips-grid { display: flex; flex-wrap: wrap; gap: 6px; }

.cht-chip {
  display: flex; align-items: center; gap: 7px;
  padding: 5px 8px 5px 5px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  transition: border-color .12s;
}
.cht-chip:hover { border-color: #a5b4fc; }
.body--dark .cht-chip { background: #0f172a; border-color: #1e293b; }
.body--dark .cht-chip:hover { border-color: #4f46e5; }

.cht-chip-cal {
  display: flex; flex-direction: column; align-items: center;
  width: 28px; height: 30px; border-radius: 5px;
  background: linear-gradient(180deg, #4f46e5 0%, #4f46e5 35%, #fff 35%, #fff 100%);
  border: 1px solid #c7d2fe; overflow: hidden;
}
.body--dark .cht-chip-cal { background: linear-gradient(180deg, #4f46e5 0%, #4f46e5 35%, #1e293b 35%, #1e293b 100%); border-color: rgba(99,102,241,.4); }

.cht-chip-month { font-size: .48rem; font-weight: 800; color: #fff; line-height: 1.7; letter-spacing: .02em; }
.cht-chip-day   { font-size: .72rem; font-weight: 800; color: #374151; line-height: 1.3; }
.body--dark .cht-chip-day { color: #e2e8f0; }

.cht-chip-date { font-size: .74rem; font-weight: 600; color: #374151; font-variant-numeric: tabular-nums; }
.body--dark .cht-chip-date { color: #94a3b8; }

.cht-chip-remove {
  width: 18px; height: 18px; border: none; background: transparent; cursor: pointer; border-radius: 4px;
  color: #94a3b8; display: flex; align-items: center; justify-content: center; padding: 0; transition: all .1s;
}
.cht-chip-remove:hover { background: #fee2e2; color: #ef4444; }
.body--dark .cht-chip-remove:hover { background: rgba(239,68,68,.15); color: #f87171; }

@media (max-width: 680px) { .cht-layout { grid-template-columns: 1fr; } }
</style>