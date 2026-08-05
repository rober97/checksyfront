<!-- src/views/Superadmin/ParametrosLegales.vue
     Configurador de los parámetros legales del sistema (jornada máxima, tope y
     recargo de horas extra, gratificación, desconexión).

     Cada cambio se guarda como una VIGENCIA NUEVA: la anterior se cierra, no se
     pisa. Así, cuando cambia la ley, las liquidaciones y reportes del pasado
     siguen calculándose con el valor que regía entonces — que es justamente lo
     que un fiscalizador espera ver. -->
<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h4 text-weight-bold">Parámetros legales</div>
        <div class="text-grey-7">
          Los valores que la ley fija y el sistema usa para calcular. Cambian sin tocar código.
        </div>
      </div>
      <q-btn flat round icon="refresh" :loading="store.loading" @click="reload">
        <q-tooltip>Recargar</q-tooltip>
      </q-btn>
    </div>

    <q-banner rounded class="bg-blue-1 text-blue-9 q-mb-md">
      <template #avatar><q-icon name="history_edu" color="primary" /></template>
      Al guardar un valor se crea una <b>vigencia nueva desde la fecha que indiques</b> y se
      cierra la anterior. Nada se sobrescribe: una liquidación de un mes pasado seguirá
      usando el valor que regía en ese momento.
    </q-banner>

    <q-banner v-if="usingFallback.length" rounded class="bg-orange-1 text-orange-10 q-mb-md">
      <template #avatar><q-icon name="warning" color="orange" /></template>
      {{ usingFallback.length }} parámetro(s) aún no están cargados en base de datos y se
      están resolviendo con el respaldo del código:
      <b>{{ usingFallback.map(i => i.label).join(', ') }}</b>.
      El sistema calcula bien igual, pero no podrás versionarlos hasta cargarlos.
      <template #action>
        <q-btn flat no-caps color="orange-10" label="Cargar en base de datos" :loading="seeding" @click="seed" />
      </template>
    </q-banner>

    <div class="row q-col-gutter-md">
      <div v-for="item in store.items" :key="item.type" class="col-12 col-md-6">
        <q-card flat bordered class="lp-card">
          <q-card-section>
            <div class="row items-start justify-between no-wrap">
              <div class="col">
                <div class="text-subtitle1 text-weight-bold">{{ item.label }}</div>
                <div class="text-caption text-grey-7">
                  <q-badge v-if="item.isLegal" color="primary" outline :label="item.legalRef" />
                  <q-badge v-else color="grey-7" outline label="Criterio de la empresa (no legal)" />
                </div>
              </div>
              <div class="text-right">
                <div class="lp-value">{{ formatValue(item.current.value) }}</div>
                <div class="text-caption text-grey-7">{{ item.unit }}</div>
              </div>
            </div>

            <div class="text-caption text-grey-8 q-mt-sm">{{ item.help }}</div>

            <div class="row items-center q-gutter-xs q-mt-sm">
              <q-chip dense square :color="sourceMeta(item).color" text-color="white" :icon="sourceMeta(item).icon">
                {{ sourceMeta(item).label }}
              </q-chip>
              <span class="text-caption text-grey-7">
                Vigente desde {{ prettyDate(item.current.validFrom) }}
              </span>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="between">
            <q-btn flat dense no-caps icon="history" label="Historial" @click="openHistory(item)" />
            <q-btn unelevated dense no-caps color="primary" icon="edit" label="Nueva vigencia" @click="openEdit(item)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <div v-if="!store.loading && !store.items.length" class="text-center text-grey-7 q-pa-xl">
      No se pudieron cargar los parámetros. {{ store.error }}
    </div>

    <!-- Nueva vigencia -->
    <q-dialog v-model="edit.open" persistent>
      <q-card style="min-width: 460px; max-width: 94vw">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold">{{ edit.item?.label }}</div>
          <div class="text-caption text-grey-7">
            {{ edit.item?.legalRef }} · valor actual:
            <b>{{ formatValue(edit.item?.current?.value) }} {{ edit.item?.unit }}</b>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model.number="edit.value"
            type="number" outlined dense
            :label="`Nuevo valor (${edit.item?.unit || ''}) *`"
            :min="edit.item?.floor ?? undefined"
            :max="edit.item?.ceiling ?? undefined"
            :hint="boundsHint(edit.item)"
            step="any"
          />
          <q-input
            v-model="edit.validFrom"
            outlined dense class="q-mt-md"
            label="Vigente desde *"
            readonly
            hint="Desde este día rige el valor nuevo; el anterior queda cerrado el día previo."
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover>
                  <q-date v-model="edit.validFrom" mask="YYYY-MM-DD" minimal>
                    <div class="row justify-end"><q-btn v-close-popup label="OK" color="primary" flat /></div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input
            v-model="edit.label"
            outlined dense class="q-mt-md"
            label="Referencia (opcional)"
            placeholder="Ej: Ley 21.XXX publicada el ..."
            maxlength="120"
          />

          <q-banner dense rounded class="bg-grey-2 text-grey-9 q-mt-md">
            <q-icon name="info" size="16px" class="q-mr-xs" />
            Afecta a todas las empresas de la plataforma. Queda registrado en la bitácora
            con tu usuario.
          </q-banner>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn unelevated no-caps color="primary" label="Guardar vigencia" :loading="saving" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Historial -->
    <q-dialog v-model="history.open">
      <q-card style="min-width: 520px; max-width: 94vw">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold">{{ history.item?.label }}</div>
          <div class="text-caption text-grey-7">Vigencias registradas, de la más reciente a la más antigua</div>
        </q-card-section>
        <q-separator />
        <q-list separator>
          <q-item v-for="(t, i) in history.item?.timeline || []" :key="i">
            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ formatValue(t.value) }} {{ history.item?.unit }}
              </q-item-label>
              <q-item-label caption>
                {{ prettyDate(t.validFrom) }} → {{ t.validTo ? prettyDate(t.validTo) : 'sin término' }}
                <template v-if="t.label"> · {{ t.label }}</template>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge
                :color="t.source === 'payroll_param' ? 'primary' : 'grey-6'"
                :label="t.source === 'payroll_param' ? 'Base de datos' : 'Respaldo del código'"
              />
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import secureAxios from '@/utils/secureRequest'
import { useLegalParamsStore } from '@/stores/legalParams'

const $q = useQuasar()
const store = useLegalParamsStore()

const saving = ref(false)
const seeding = ref(false)

// Parámetros que todavía se resuelven con el respaldo del código.
const usingFallback = computed(() =>
  store.items.filter((i) => String(i.current?.source || '').startsWith('fallback'))
)

function formatValue(v) {
  if (!Number.isFinite(Number(v))) return '—'
  const n = Number(v)
  return Number.isInteger(n) ? String(n) : n.toLocaleString('es-CL', { maximumFractionDigits: 2 })
}

function prettyDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function sourceMeta(item) {
  const isDb = item.current?.source === 'payroll_param'
  return isDb
    ? { color: 'primary', icon: 'storage', label: 'Cargado en base de datos' }
    : { color: 'grey-7', icon: 'code', label: 'Respaldo del código' }
}

function boundsHint(item) {
  if (!item) return ''
  const parts = []
  if (Number.isFinite(item.floor)) parts.push(`mínimo ${item.floor}`)
  if (Number.isFinite(item.ceiling)) parts.push(`máximo ${item.ceiling}`)
  if (!parts.length) return ''
  const extra = item.isLegal ? ` (${item.legalRef})` : ''
  return `Permitido: ${parts.join(' · ')}${extra}`
}

const edit = reactive({ open: false, item: null, value: null, validFrom: '', label: '' })
const history = reactive({ open: false, item: null })

function isoToday() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function openEdit(item) {
  edit.item = item
  edit.value = item.current?.value ?? null
  edit.validFrom = isoToday()
  edit.label = ''
  edit.open = true
}

function openHistory(item) {
  history.item = item
  history.open = true
}

async function save() {
  const v = Number(edit.value)
  if (!Number.isFinite(v)) {
    $q.notify({ type: 'warning', message: 'Indica un valor numérico' })
    return
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(edit.validFrom)) {
    $q.notify({ type: 'warning', message: 'Indica desde cuándo rige' })
    return
  }
  saving.value = true
  try {
    await store.update(edit.item.type, { value: v, validFrom: edit.validFrom, label: edit.label })
    edit.open = false
    $q.notify({ type: 'positive', message: 'Vigencia registrada', position: 'top-right' })
    await reload()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err?.response?.data?.message || 'No se pudo guardar',
      position: 'top-right',
    })
  } finally {
    saving.value = false
  }
}

async function seed() {
  seeding.value = true
  try {
    await secureAxios.post('/legal-params/seed')
    $q.notify({ type: 'positive', message: 'Parámetros cargados en base de datos', position: 'top-right' })
    await reload()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err?.response?.data?.message || 'No se pudieron cargar',
      position: 'top-right',
    })
  } finally {
    seeding.value = false
  }
}

async function reload() {
  await store.fetch({ force: true })
}

onMounted(reload)
</script>

<style scoped>
.lp-card { border-radius: 12px; height: 100%; }
.lp-value { font-size: 26px; font-weight: 800; line-height: 1; }
</style>
