<!-- src/views/Admin/PerformanceModule.vue
     Evaluación de desempeño (Fase A) + Clima del equipo (ánimo agregado).
     Modelo híbrido: snapshot objetivo (asistencia) + evaluación cualitativa
     de la jefatura. El clima va decoupleado y SIEMPRE anónimo. -->
<template>
  <q-page class="rk-perf q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div>
        <h1 class="rk-perf__title">Desempeño</h1>
        <p class="rk-perf__subtitle">Evaluación con base objetiva: asistencia real + criterio de la jefatura.</p>
      </div>
      <q-space />
      <q-btn flat round icon="refresh" :loading="loading" @click="reloadAll">
        <q-tooltip>Actualizar</q-tooltip>
      </q-btn>
    </div>

    <q-tabs v-model="tab" class="text-primary" align="left" narrow-indicator dense>
      <q-tab name="evals" icon="workspace_premium" label="Evaluaciones" />
      <q-tab name="climate" icon="mood" label="Clima del equipo" />
    </q-tabs>
    <q-separator class="q-mb-md" />

    <!-- ================= EVALUACIONES ================= -->
    <div v-if="tab === 'evals'">
      <div class="row items-center q-gutter-sm q-mb-md">
        <q-select
          v-model="selectedCycleId"
          :options="cycleOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          dense outlined
          label="Ciclo de evaluación"
          style="min-width: 240px"
          @update:model-value="loadCycleDetail"
        />
        <q-btn color="primary" unelevated icon="add" label="Nuevo ciclo" @click="showCreate = true" />
        <q-space />
        <template v-if="currentCycle">
          <q-chip :color="statusColor(currentCycle.status)" text-color="white" :label="cycleStatusLabel(currentCycle.status)" />
          <q-btn
            v-if="currentCycle.status === 'draft'"
            color="positive" unelevated icon="play_arrow" label="Abrir ciclo"
            :loading="acting" @click="openCycle"
          />
          <q-btn
            v-if="currentCycle.status === 'open'"
            color="primary" outline icon="autorenew" label="Regenerar fichas"
            :loading="acting" @click="openCycle"
          />
          <q-btn
            v-if="currentCycle.status !== 'closed'"
            color="negative" outline icon="lock" label="Cerrar y publicar"
            :loading="acting" @click="confirmClose"
          />
        </template>
      </div>

      <q-banner v-if="!cycles.length && !loading" class="bg-blue-1 text-blue-9 rounded-borders q-mb-md">
        <template #avatar><q-icon name="info" /></template>
        Aún no hay ciclos de evaluación. Crea el primero (por defecto trimestral) y ábrelo para generar las fichas de cada trabajador.
      </q-banner>

      <q-card v-if="currentCycle" flat bordered>
        <q-table
          :rows="reviews"
          :columns="reviewColumns"
          row-key="_id"
          :loading="loadingDetail"
          flat
          :pagination="{ rowsPerPage: 15 }"
          no-data-label="Sin fichas. Abre el ciclo para generarlas."
        >
          <template #body-cell-objective="props">
            <q-td :props="props">
              <span :class="scoreClass(props.row.objective?.score)">{{ fmtScore(props.row.objective?.score) }}</span>
            </q-td>
          </template>
          <template #body-cell-final="props">
            <q-td :props="props">
              <span :class="scoreClass(props.row.finalScore)" class="text-weight-bold">{{ fmtScore(props.row.finalScore) }}</span>
            </q-td>
          </template>
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip dense size="sm" :color="reviewStatusColor(props.row.status)" text-color="white" :label="reviewStatusLabel(props.row.status)" />
              <q-icon v-if="props.row.releasedToWorker" name="visibility" size="16px" class="q-ml-xs text-grey-6">
                <q-tooltip>Visible para el trabajador</q-tooltip>
              </q-icon>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn dense flat round icon="rate_review" color="primary" @click="openReview(props.row._id)">
                <q-tooltip>Evaluar / ver ficha</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- ================= CLIMA DEL EQUIPO ================= -->
    <div v-else>
      <q-card flat bordered class="q-pa-md">
        <div class="row items-center q-mb-sm">
          <div class="text-subtitle1 text-weight-bold">Ánimo del equipo (últimos 30 días)</div>
          <q-space />
          <q-icon name="lock" size="16px" class="text-grey-6 q-mr-xs" />
          <span class="text-caption text-grey-6">Siempre anónimo y agregado</span>
        </div>

        <div v-if="loadingMood" class="q-pa-lg text-center text-grey-6">
          <q-spinner size="28px" /> Cargando…
        </div>

        <q-banner v-else-if="!mood || mood.suppressed" class="bg-grey-2 text-grey-8 rounded-borders">
          <template #avatar><q-icon name="visibility_off" /></template>
          No hay datos suficientes para mostrar el clima sin comprometer el anonimato
          (se requieren al menos {{ mood?.minRequired || 4 }} personas con marcas en el periodo).
        </q-banner>

        <div v-else>
          <div class="row items-center q-col-gutter-md q-mb-md">
            <div class="col-auto">
              <div class="rk-mood-index" :class="scoreClass(mood.indexScore)">{{ mood.indexScore }}</div>
              <div class="text-caption text-grey-6 text-center">Índice de ánimo</div>
            </div>
            <div class="col">
              <div v-for="m in moodBars" :key="m.key" class="row items-center q-mb-xs">
                <div class="col-2 text-caption">{{ m.emoji }} {{ m.label }}</div>
                <div class="col">
                  <q-linear-progress :value="m.pct" :color="m.color" rounded size="14px" />
                </div>
                <div class="col-1 text-caption text-right">{{ m.count }}</div>
              </div>
            </div>
          </div>
          <div class="text-caption text-grey-6">
            {{ mood.totalMarks }} marcas de {{ mood.distinctUsers }} personas.
          </div>
        </div>
      </q-card>
    </div>

    <!-- ===== Dialog: crear ciclo ===== -->
    <q-dialog v-model="showCreate">
      <q-card style="min-width: 360px">
        <q-card-section><div class="text-h6">Nuevo ciclo de evaluación</div></q-card-section>
        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-sm">
            <q-input class="col" v-model.number="createForm.year" type="number" dense outlined label="Año" />
            <q-select class="col" v-model="createForm.quarter" :options="[1,2,3,4]" dense outlined label="Trimestre" emit-value map-options />
          </div>
          <div>
            <div class="text-caption text-grey-7 q-mb-xs">Ponderación del puntaje final</div>
            <div class="row items-center q-gutter-sm">
              <q-input class="col" v-model.number="createForm.wObj" type="number" dense outlined label="Objetivo %" />
              <q-input class="col" v-model.number="createForm.wQual" type="number" dense outlined label="Cualitativo %" />
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">Lo objetivo (asistencia) no debería dominar. Sugerido 30/70.</div>
          </div>
          <q-toggle v-model="createForm.selfEnabled" label="Incluir autoevaluación del trabajador" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" unelevated label="Crear" :loading="acting" @click="createCycle" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ===== Dialog: ficha / evaluación ===== -->
    <q-dialog v-model="reviewDialog" :maximized="isSmallScreen">
      <q-card style="min-width: 420px; max-width: 640px">
        <q-card-section class="row items-center">
          <div>
            <div class="text-h6">{{ review?.subject?.fullName || 'Ficha' }}</div>
            <div class="text-caption text-grey-6">{{ review?.subject?.cargo || '—' }} · {{ review?.subject?.rut || '' }}</div>
          </div>
          <q-space />
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="review">
          <!-- Snapshot objetivo -->
          <div class="text-subtitle2 text-weight-bold q-mb-xs">Datos objetivos (asistencia del periodo)</div>
          <div class="row q-col-gutter-sm q-mb-md">
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

          <!-- Autoevaluación (solo lectura, si existe) -->
          <q-banner v-if="review.self?.submittedAt" dense class="bg-blue-1 text-blue-9 rounded-borders q-mb-md">
            El trabajador se autoevaluó con {{ fmtScore(review.self.score) }}.
            <span v-if="review.self.comment">“{{ review.self.comment }}”</span>
          </q-banner>

          <!-- Evaluación de la jefatura -->
          <div class="text-subtitle2 text-weight-bold q-mb-sm">Evaluación de competencias</div>
          <div v-for="c in competencies" :key="c.key" class="row items-center q-mb-sm">
            <div class="col-6">
              <div class="text-body2">{{ c.label }}</div>
              <div class="text-caption text-grey-6">{{ c.description }}</div>
            </div>
            <div class="col-6 text-right">
              <q-rating v-model="managerScores[c.key]" :max="5" size="22px" color="primary" :readonly="cycleClosed" />
            </div>
          </div>
          <q-input
            v-model="managerComment" type="textarea" outlined autogrow dense
            label="Comentario de la jefatura" class="q-mt-sm" :readonly="cycleClosed"
          />
        </q-card-section>

        <q-separator />
        <q-card-actions align="right">
          <q-btn v-if="review && review.releasedToWorker" flat color="grey" icon="visibility_off" label="Ocultar al trabajador" @click="toggleRelease(false)" />
          <q-btn v-else-if="review" flat color="grey" icon="visibility" label="Mostrar al trabajador" @click="toggleRelease(true)" />
          <q-space />
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn
            v-if="!cycleClosed"
            color="primary" unelevated icon="save" label="Guardar evaluación"
            :loading="acting" @click="submitManager"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/authStore'
import secureAxios from '@/utils/secureRequest'

const $q = useQuasar()
const auth = useAuthStore()

const tab = ref('evals')
const loading = ref(false)
const acting = ref(false)
const loadingDetail = ref(false)
const loadingMood = ref(false)

const cycles = ref([])
const selectedCycleId = ref(null)
const currentCycle = ref(null)
const reviews = ref([])

const competencies = ref([])
const mood = ref(null)

const showCreate = ref(false)
const now = new Date()
const createForm = ref({
  year: now.getFullYear(),
  quarter: Math.floor(now.getMonth() / 3) + 1,
  wObj: 30,
  wQual: 70,
  selfEnabled: true,
})

const reviewDialog = ref(false)
const review = ref(null)
const managerScores = ref({})
const managerComment = ref('')

// companyId explícito (necesario cuando el rol es superadmin).
const companyId = computed(() => auth.activeCompany || null)
const cycleClosed = computed(() => currentCycle.value?.status === 'closed')
const isSmallScreen = computed(() => $q.screen.lt.sm)

const cycleOptions = computed(() =>
  cycles.value.map((c) => ({ value: c._id, label: c.period?.label || `${c.period?.year} Q${c.period?.quarter || ''}` }))
)

const reviewColumns = [
  { name: 'subject', label: 'Trabajador', field: (r) => r.subject?.fullName, align: 'left', sortable: true },
  { name: 'cargo', label: 'Cargo', field: (r) => r.subject?.cargo || '—', align: 'left' },
  { name: 'objective', label: 'Objetivo', field: (r) => r.objective?.score, align: 'center' },
  { name: 'final', label: 'Nota final', field: (r) => r.finalScore, align: 'center' },
  { name: 'status', label: 'Estado', field: 'status', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

/* ---------- helpers de formato ---------- */
const fmtScore = (v) => (v == null ? '—' : `${Math.round(v)}`)
const scoreClass = (v) => (v == null ? 'text-grey-5' : v >= 70 ? 'text-positive' : v >= 40 ? 'text-orange-8' : 'text-negative')
const statusColor = (s) => ({ draft: 'grey', open: 'primary', closed: 'blue-grey' }[s] || 'grey')
const cycleStatusLabel = (s) => ({ draft: 'Borrador', open: 'Abierto', closed: 'Cerrado' }[s] || s)
const reviewStatusColor = (s) => ({ pending_self: 'orange', pending_manager: 'deep-orange', pending_signoff: 'indigo', completed: 'positive' }[s] || 'grey')
const reviewStatusLabel = (s) => ({
  pending_self: 'Autoevaluación', pending_manager: 'Por evaluar', pending_signoff: 'Por visar', completed: 'Completada',
}[s] || s)

const MOOD_META = {
  great: { label: 'Excelente', emoji: '😄', color: 'positive' },
  good: { label: 'Bien', emoji: '🙂', color: 'light-green' },
  ok: { label: 'Normal', emoji: '😐', color: 'amber' },
  tired: { label: 'Cansado', emoji: '😪', color: 'orange' },
  bad: { label: 'Mal', emoji: '😟', color: 'negative' },
}
const moodBars = computed(() => {
  if (!mood.value || mood.value.suppressed) return []
  const total = mood.value.totalMarks || 1
  return Object.entries(mood.value.byMood || {}).map(([key, count]) => ({
    key, count, pct: count / total, ...MOOD_META[key],
  }))
})

/* ---------- data ---------- */
async function loadCycles() {
  loading.value = true
  try {
    const params = companyId.value ? { companyId: companyId.value } : {}
    const { data } = await secureAxios.get('/performance/cycles', { params })
    cycles.value = data?.data || []
    if (cycles.value.length && !selectedCycleId.value) {
      selectedCycleId.value = cycles.value[0]._id
      await loadCycleDetail()
    }
  } catch (e) {
    notifyErr(e, 'No se pudieron cargar los ciclos')
  } finally {
    loading.value = false
  }
}

async function loadCycleDetail() {
  if (!selectedCycleId.value) return
  loadingDetail.value = true
  try {
    const { data } = await secureAxios.get(`/performance/cycles/${selectedCycleId.value}`)
    currentCycle.value = data?.data?.cycle || null
    reviews.value = data?.data?.reviews || []
  } catch (e) {
    notifyErr(e, 'No se pudo cargar el ciclo')
  } finally {
    loadingDetail.value = false
  }
}

async function loadTemplates() {
  try {
    const params = companyId.value ? { companyId: companyId.value } : {}
    const { data } = await secureAxios.get('/performance/templates', { params })
    competencies.value = data?.data?.competencies || []
  } catch (e) {
    // no bloqueante
  }
}

async function loadMood() {
  loadingMood.value = true
  try {
    const params = companyId.value ? { companyId: companyId.value } : {}
    const { data } = await secureAxios.get('/attendance/mood/aggregate', { params })
    mood.value = data?.data || null
  } catch (e) {
    notifyErr(e, 'No se pudo cargar el clima')
  } finally {
    loadingMood.value = false
  }
}

async function reloadAll() {
  await Promise.all([loadCycles(), loadTemplates(), loadMood()])
}

/* ---------- acciones ---------- */
async function createCycle() {
  acting.value = true
  try {
    const body = {
      year: createForm.value.year,
      quarter: createForm.value.quarter,
      cadence: 'quarterly',
      selfEvaluationEnabled: createForm.value.selfEnabled,
      weights: {
        objective: (Number(createForm.value.wObj) || 30) / 100,
        qualitative: (Number(createForm.value.wQual) || 70) / 100,
      },
    }
    if (companyId.value) body.companyId = companyId.value
    const { data } = await secureAxios.post('/performance/cycles', body)
    showCreate.value = false
    $q.notify({ type: 'positive', message: 'Ciclo creado' })
    await loadCycles()
    selectedCycleId.value = data?.data?._id
    await loadCycleDetail()
  } catch (e) {
    notifyErr(e, 'No se pudo crear el ciclo')
  } finally {
    acting.value = false
  }
}

async function openCycle() {
  if (!currentCycle.value) return
  acting.value = true
  try {
    const { data } = await secureAxios.post(`/performance/cycles/${currentCycle.value._id}/open`)
    const d = data?.data || {}
    const parts = []
    if (d.reviewsCreated) parts.push(`${d.reviewsCreated} generadas`)
    if (d.reviewsUpdated) parts.push(`${d.reviewsUpdated} actualizadas`)
    $q.notify({ type: 'positive', message: `Fichas: ${parts.join(' · ') || 'sin cambios'}` })
    await loadCycleDetail()
  } catch (e) {
    notifyErr(e, 'No se pudo abrir el ciclo')
  } finally {
    acting.value = false
  }
}

function confirmClose() {
  $q.dialog({
    title: 'Cerrar y publicar',
    message: 'Se calcularán las notas finales y los resultados quedarán visibles para los trabajadores. Esta acción no se puede deshacer.',
    cancel: true,
    ok: { label: 'Cerrar ciclo', color: 'negative' },
  }).onOk(closeCycle)
}

async function closeCycle() {
  acting.value = true
  try {
    await secureAxios.post(`/performance/cycles/${currentCycle.value._id}/close`)
    $q.notify({ type: 'positive', message: 'Ciclo cerrado y publicado' })
    await loadCycleDetail()
  } catch (e) {
    notifyErr(e, 'No se pudo cerrar el ciclo')
  } finally {
    acting.value = false
  }
}

async function openReview(id) {
  try {
    const { data } = await secureAxios.get(`/performance/reviews/${id}`)
    review.value = data?.data || null
    // Inicializa los ratings con la evaluación previa de la jefatura (o 3 por defecto).
    const prev = {}
    for (const c of competencies.value) prev[c.key] = 3
    for (const r of (review.value?.manager?.ratings || [])) prev[r.key] = r.score
    managerScores.value = prev
    managerComment.value = review.value?.manager?.comment || ''
    reviewDialog.value = true
  } catch (e) {
    notifyErr(e, 'No se pudo abrir la ficha')
  }
}

async function submitManager() {
  acting.value = true
  try {
    const ratings = competencies.value.map((c) => ({ key: c.key, score: managerScores.value[c.key] || 0 }))
      .filter((r) => r.score >= 1)
    await secureAxios.post(`/performance/reviews/${review.value._id}/manager`, { ratings, comment: managerComment.value })
    $q.notify({ type: 'positive', message: 'Evaluación guardada' })
    reviewDialog.value = false
    await loadCycleDetail()
  } catch (e) {
    notifyErr(e, 'No se pudo guardar la evaluación')
  } finally {
    acting.value = false
  }
}

async function toggleRelease(value) {
  try {
    await secureAxios.post(`/performance/reviews/${review.value._id}/release`, { released: value })
    review.value.releasedToWorker = value
    $q.notify({ type: 'positive', message: value ? 'Visible para el trabajador' : 'Oculto al trabajador' })
    await loadCycleDetail()
  } catch (e) {
    notifyErr(e, 'No se pudo actualizar la visibilidad')
  }
}

function notifyErr(e, fallback) {
  const msg = e?.response?.data?.message || fallback
  $q.notify({ type: 'negative', message: msg })
}

onMounted(reloadAll)
</script>

<style scoped>
.rk-perf__title { font-size: 22px; font-weight: 800; margin: 0; }
.rk-perf__subtitle { font-size: 13px; color: var(--q-color-grey-7, #666); margin: 2px 0 0; }
.rk-metric { text-align: center; }
.rk-metric__val { font-size: 26px; font-weight: 800; line-height: 1; }
.rk-metric__lbl { font-size: 11px; color: #888; margin-top: 2px; }
.rk-mood-index { font-size: 44px; font-weight: 900; line-height: 1; min-width: 96px; text-align: center; }
</style>
