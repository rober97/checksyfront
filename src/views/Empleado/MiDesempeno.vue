<!-- src/views/Empleado/MiDesempeno.vue
     Vista del trabajador para su propia evaluación de desempeño.
     Consume las mismas rutas /performance/reviews que el backend ya filtra
     por el usuario autenticado (solo fichas liberadas). Permite además la
     autoevaluación cuando el ciclo está abierto y la tiene habilitada. -->
<template>
  <q-page class="rk-mydesemp q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div>
        <h1 class="rk-mydesemp__title">Mi desempeño</h1>
        <p class="rk-mydesemp__subtitle">Tu evaluación con base objetiva: asistencia real + criterio de la jefatura.</p>
      </div>
      <q-space />
      <q-btn flat round icon="refresh" :loading="loading" @click="reload">
        <q-tooltip>Actualizar</q-tooltip>
      </q-btn>
    </div>

    <!-- Error -->
    <q-banner v-if="error" class="bg-red-1 text-red-9 rounded-borders q-mb-md">
      <template #avatar><q-icon name="error" /></template>
      {{ error }}
      <template #action>
        <q-btn flat color="red-9" label="Reintentar" @click="reload" />
      </template>
    </q-banner>

    <!-- Vacío -->
    <q-banner v-else-if="!loading && !rows.length" class="bg-blue-1 text-blue-9 rounded-borders">
      <template #avatar><q-icon name="info" /></template>
      Aún no tienes evaluaciones publicadas. Cuando RR.HH. publique un ciclo de evaluación,
      tu ficha aparecerá aquí.
    </q-banner>

    <!-- Lista de fichas -->
    <div v-else class="q-gutter-md">
      <q-card v-for="r in rows" :key="r._id" flat bordered class="rk-card">
        <q-card-section class="row items-center">
          <div>
            <div class="text-subtitle1 text-weight-bold">
              {{ r.cycleLabel || 'Ciclo de evaluación' }}
            </div>
            <div class="text-caption text-grey-6">
              <q-chip dense size="sm" :color="reviewStatusColor(r.status)" text-color="white" :label="reviewStatusLabel(r.status)" />
            </div>
          </div>
          <q-space />
          <div v-if="!r._hidden" class="text-center">
            <div class="rk-score" :class="scoreClass(r.finalScore)">{{ fmtScore(r.finalScore) }}</div>
            <div class="text-caption text-grey-6">Nota final</div>
          </div>
        </q-card-section>

        <q-separator />
        <q-card-actions align="right">
          <q-banner v-if="r.status === 'pending_self'" dense class="bg-orange-1 text-orange-9 rounded-borders col">
            <template #avatar><q-icon name="edit_note" /></template>
            Tienes tu autoevaluación pendiente.
          </q-banner>
          <q-banner v-else-if="r._hidden" dense class="bg-grey-2 text-grey-8 rounded-borders col">
            <template #avatar><q-icon name="visibility_off" /></template>
            Tu evaluación aún no ha sido publicada por RR.HH.
          </q-banner>
          <q-space v-else />
          <q-btn
            color="primary" flat
            :icon="r.status === 'pending_self' ? 'rate_review' : 'open_in_full'"
            :label="r.status === 'pending_self' ? 'Autoevaluarme' : 'Ver detalle'"
            @click="openReview(r._id)"
          />
        </q-card-actions>
      </q-card>
    </div>

    <q-inner-loading :showing="loading">
      <q-spinner-orbit size="42px" color="primary" />
    </q-inner-loading>

    <!-- ===== Dialog: detalle de mi ficha ===== -->
    <q-dialog v-model="reviewDialog" :maximized="isSmallScreen">
      <q-card style="min-width: 420px; max-width: 640px">
        <q-card-section class="row items-center">
          <div>
            <div class="text-h6">{{ review?.cycle?.label || 'Mi evaluación' }}</div>
            <div class="text-caption text-grey-6">
              {{ review?.subject?.cargo || '—' }}
              <span v-if="review?.cycle?.rangeStart"> · {{ fmtDate(review.cycle.rangeStart) }} – {{ fmtDate(review.cycle.rangeEnd) }}</span>
            </div>
          </div>
          <q-space />
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="review">
          <!-- Nota final -->
          <div v-if="review.finalScore != null" class="text-center q-mb-md">
            <div class="rk-score rk-score--lg" :class="scoreClass(review.finalScore)">{{ fmtScore(review.finalScore) }}</div>
            <div class="text-caption text-grey-6">Nota final del periodo</div>
          </div>

          <!-- Snapshot objetivo -->
          <template v-if="review.objective">
            <div class="text-subtitle2 text-weight-bold q-mb-xs">Datos objetivos (tu asistencia del periodo)</div>
            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-4 rk-metric">
                <div class="rk-metric__val" :class="scoreClass(review.objective?.puntualidad)">{{ fmtScore(review.objective?.puntualidad) }}</div>
                <div class="rk-metric__lbl">Puntualidad</div>
              </div>
              <div class="col-4 rk-metric">
                <div class="rk-metric__val" :class="scoreClass(review.objective?.asistencia)">{{ fmtScore(review.objective?.asistencia) }}</div>
                <div class="rk-metric__lbl">Asistencia</div>
              </div>
              <div class="col-4 rk-metric">
                <div class="rk-metric__val" :class="scoreClass(review.objective?.consistencia)">{{ fmtScore(review.objective?.consistencia) }}</div>
                <div class="rk-metric__lbl">Consistencia</div>
              </div>
            </div>
            <div v-if="review.objective?.detail" class="text-caption text-grey-6 q-mb-md">
              {{ review.objective.detail.workedDays }} días trabajados
              <template v-if="review.objective.detail.expectedDays"> de {{ review.objective.detail.expectedDays }} esperados</template>,
              {{ review.objective.detail.completeDays }} jornadas completas.
            </div>
          </template>

          <!-- Comentario de la jefatura (si liberado) -->
          <q-banner v-if="review.manager?.comment" dense class="bg-blue-1 text-blue-9 rounded-borders q-mb-md">
            <template #avatar><q-icon name="record_voice_over" /></template>
            “{{ review.manager.comment }}”
          </q-banner>

          <!-- Competencias evaluadas por la jefatura (solo lectura) -->
          <template v-if="managerRatingMap && Object.keys(managerRatingMap).length">
            <div class="text-subtitle2 text-weight-bold q-mb-sm">Evaluación de competencias</div>
            <div v-for="c in competencies" :key="c.key" class="row items-center q-mb-sm">
              <div class="col-6">
                <div class="text-body2">{{ c.label }}</div>
                <div class="text-caption text-grey-6">{{ c.description }}</div>
              </div>
              <div class="col-6 text-right">
                <q-rating :model-value="managerRatingMap[c.key] || 0" :max="5" size="20px" color="primary" readonly />
              </div>
            </div>
            <q-separator class="q-my-md" />
          </template>

          <!-- ===== Autoevaluación ===== -->
          <div class="text-subtitle2 text-weight-bold q-mb-xs">Mi autoevaluación</div>

          <q-banner v-if="!canSelfEvaluate && !selfSubmitted" dense class="bg-grey-2 text-grey-8 rounded-borders q-mb-sm">
            <template #avatar><q-icon name="info" /></template>
            {{ selfDisabledReason }}
          </q-banner>

          <template v-if="canSelfEvaluate || selfSubmitted">
            <div class="text-caption text-grey-6 q-mb-sm">
              Evalúa tu propio desempeño del 1 al 5 en cada competencia.
            </div>
            <div v-for="c in competencies" :key="`self-${c.key}`" class="row items-center q-mb-sm">
              <div class="col-6">
                <div class="text-body2">{{ c.label }}</div>
                <div class="text-caption text-grey-6">{{ c.description }}</div>
              </div>
              <div class="col-6 text-right">
                <q-rating v-model="selfScores[c.key]" :max="5" size="24px" color="primary" :readonly="!canSelfEvaluate" />
              </div>
            </div>
            <q-input
              v-model="selfComment" type="textarea" outlined autogrow dense
              label="Comentario (opcional)" class="q-mt-sm" :readonly="!canSelfEvaluate"
            />
          </template>
        </q-card-section>

        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn
            v-if="canSelfEvaluate"
            color="primary" unelevated icon="save"
            :label="selfSubmitted ? 'Actualizar autoevaluación' : 'Enviar autoevaluación'"
            :loading="acting" @click="submitSelf"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import secureAxios from '@/utils/secureRequest'

const $q = useQuasar()

const loading = ref(false)
const acting = ref(false)
const error = ref(null)
const rows = ref([])

const reviewDialog = ref(false)
const review = ref(null)
const competencies = ref([])
const selfScores = ref({})
const selfComment = ref('')

const isSmallScreen = computed(() => $q.screen.lt.sm)

/* ---------- helpers de formato (mismos criterios que la vista admin) ---------- */
const fmtScore = (v) => (v == null ? '—' : `${Math.round(v)}`)
const scoreClass = (v) => (v == null ? 'text-grey-5' : v >= 70 ? 'text-positive' : v >= 40 ? 'text-orange-8' : 'text-negative')
const reviewStatusColor = (s) => ({ pending_self: 'orange', pending_manager: 'deep-orange', pending_signoff: 'indigo', completed: 'positive' }[s] || 'grey')
const reviewStatusLabel = (s) => ({
  pending_self: 'Autoevaluación pendiente', pending_manager: 'En evaluación', pending_signoff: 'Por visar', completed: 'Completada',
}[s] || s)
const fmtDate = (d) => {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return '' }
}

/* ---------- estado derivado de la ficha abierta ---------- */
const managerRatingMap = computed(() => {
  const map = {}
  for (const r of (review.value?.manager?.ratings || [])) map[r.key] = r.score
  return map
})
const selfSubmitted = computed(() => !!review.value?.self?.submittedAt)
const canSelfEvaluate = computed(() => {
  const c = review.value?.cycle
  return !!c && c.status === 'open' && c.selfEvaluationEnabled === true
})
const selfDisabledReason = computed(() => {
  const c = review.value?.cycle
  if (!c) return 'La autoevaluación no está disponible.'
  if (!c.selfEvaluationEnabled) return 'Este ciclo no contempla autoevaluación del trabajador.'
  if (c.status !== 'open') return 'El ciclo está cerrado: ya no puedes modificar tu autoevaluación.'
  return 'La autoevaluación no está disponible.'
})

/* ---------- data ---------- */
async function reload() {
  loading.value = true
  error.value = null
  try {
    const { data } = await secureAxios.get('/performance/reviews', { params: { mine: 1 } })
    rows.value = data?.data || []
  } catch (e) {
    error.value = e?.response?.data?.message || 'No se pudo cargar tu desempeño'
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function openReview(id) {
  try {
    const { data } = await secureAxios.get(`/performance/reviews/${id}`)
    review.value = data?.data || null
    competencies.value = review.value?.competencies || []
    // Inicializa la autoevaluación con lo previo (o 3 por defecto).
    const prev = {}
    for (const c of competencies.value) prev[c.key] = 3
    for (const r of (review.value?.self?.ratings || [])) prev[r.key] = r.score
    selfScores.value = prev
    selfComment.value = review.value?.self?.comment || ''
    reviewDialog.value = true
  } catch (e) {
    notifyErr(e, 'No se pudo abrir tu ficha')
  }
}

async function submitSelf() {
  acting.value = true
  try {
    const ratings = competencies.value
      .map((c) => ({ key: c.key, score: selfScores.value[c.key] || 0 }))
      .filter((r) => r.score >= 1)
    await secureAxios.post(`/performance/reviews/${review.value._id}/self`, { ratings, comment: selfComment.value })
    $q.notify({ type: 'positive', message: 'Autoevaluación enviada' })
    reviewDialog.value = false
    await reload()
  } catch (e) {
    notifyErr(e, 'No se pudo enviar tu autoevaluación')
  } finally {
    acting.value = false
  }
}

function notifyErr(e, fallback) {
  const msg = e?.response?.data?.message || fallback
  $q.notify({ type: 'negative', message: msg })
}

onMounted(reload)
</script>

<style scoped>
.rk-mydesemp__title { font-size: 22px; font-weight: 800; margin: 0; }
.rk-mydesemp__subtitle { font-size: 13px; color: var(--q-color-grey-7, #666); margin: 2px 0 0; }
.rk-card { border-radius: 12px; }
.rk-metric { text-align: center; }
.rk-metric__val { font-size: 26px; font-weight: 800; line-height: 1; }
.rk-metric__lbl { font-size: 11px; color: #888; margin-top: 2px; }
.rk-score { font-size: 34px; font-weight: 900; line-height: 1; min-width: 72px; text-align: center; }
.rk-score--lg { font-size: 56px; }
</style>
