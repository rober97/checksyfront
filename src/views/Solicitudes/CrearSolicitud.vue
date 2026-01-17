<template>
  <q-page class="request-page" :class="pageBgClass">
    <!-- HERO HEADER -->
    <!-- <div class="hero-header">
      <div class="hero-content">
        <div class="hero-icon">
          <q-icon name="event_note" size="42px" />
        </div>
        <div>
          <h1 class="hero-title">Nueva Solicitud de Ausencia</h1>
          <p class="hero-subtitle">
            Configura tu solicitud. Revisaremos disponibilidad y políticas automáticamente.
          </p>
        </div>
      </div>
      <div class="hero-actions">
        <q-btn flat round icon="help_outline" size="md" @click="helpOpen = true">
          <q-tooltip>Ayuda</q-tooltip>
        </q-btn>
        <q-btn 
          flat round icon="refresh" size="md"
          @click="reloadData"
          :loading="loadingBalances"
        >
          <q-tooltip>Actualizar datos</q-tooltip>
        </q-btn>
      </div>
    </div> -->

    <!-- PROGRESS TRACKER -->
    <div class="progress-tracker">
      <div class="progress-step" :class="{ active: !!form.tipo, complete: !!form.tipo }">
        <div class="step-indicator">
          <q-icon :name="form.tipo ? 'check' : 'category'" />
        </div>
        <span class="step-label">Tipo</span>
      </div>
      <div class="progress-line" :class="{ active: !!form.tipo }" />
      
      <div class="progress-step" :class="{ active: !!form.fechaInicio, complete: rangoValido && diasHabiles > 0 }">
        <div class="step-indicator">
          <q-icon :name="rangoValido && diasHabiles > 0 ? 'check' : 'date_range'" />
        </div>
        <span class="step-label">Fechas</span>
      </div>
      <div class="progress-line" :class="{ active: rangoValido && diasHabiles > 0 }" />
      
      <div class="progress-step" :class="{ active: readyToSend, complete: readyToSend }">
        <div class="step-indicator">
          <q-icon :name="readyToSend ? 'check' : 'send'" />
        </div>
        <span class="step-label">Enviar</span>
      </div>
    </div>

    <!-- MAIN FORM CONTAINER -->
    <div class="form-container">
      <!-- LEFT COLUMN: FORM -->
      <div class="form-column">
        
        <!-- SECTION 1: TIPO -->
        <div class="form-section" :class="{ expanded: !form.tipo }">
          <div class="section-header" @click="toggleSection('tipo')">
            <div class="section-info">
              <q-icon name="category" size="24px" class="section-icon" />
              <div>
                <div class="section-title">Tipo de Solicitud</div>
                <div class="section-subtitle">
                  {{ form.tipo ? tipoLabel : 'Selecciona el motivo de tu ausencia' }}
                </div>
              </div>
            </div>
            <q-icon 
              :name="expandedSections.tipo ? 'expand_less' : 'expand_more'" 
              size="24px"
              class="toggle-icon"
            />
          </div>
          
          <div v-show="expandedSections.tipo" class="section-content">
            <div class="tipo-grid">
              <div 
                v-for="tipo in tipos" 
                :key="tipo.value"
                class="tipo-card"
                :class="{ selected: form.tipo === tipo.value }"
                @click="selectTipo(tipo.value)"
              >
                <q-icon :name="tipoIcons[tipo.value]" size="32px" />
                <div class="tipo-label">{{ tipo.label }}</div>
                <q-icon v-if="form.tipo === tipo.value" name="check_circle" class="check-icon" />
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 2: FECHAS -->
        <div class="form-section" :class="{ expanded: form.tipo && !form.fechaInicio, disabled: !form.tipo }">
          <div class="section-header" @click="form.tipo && toggleSection('fechas')">
            <div class="section-info">
              <q-icon name="date_range" size="24px" class="section-icon" />
              <div>
                <div class="section-title">Rango de Fechas</div>
                <div class="section-subtitle">
                  {{ rangeDisplayLabel || 'Define cuándo estarás ausente' }}
                </div>
              </div>
            </div>
            <div class="section-badges">
              <q-badge v-if="diasHabiles > 0" :color="diasBadgeColor" class="days-badge">
                {{ diasHabiles }} {{ diasHabiles === 1 ? 'día' : 'días' }}
              </q-badge>
              <q-icon 
                :name="expandedSections.fechas ? 'expand_less' : 'expand_more'" 
                size="24px"
                class="toggle-icon"
              />
            </div>
          </div>
          
          <div v-show="expandedSections.fechas" class="section-content">
            <!-- Date Picker Inline -->
            <div class="date-picker-container">
              <q-date
                v-model="dateRange"
                range
                mask="YYYY-MM-DD"
                :events="feriados"
                event-color="red-5"
                :options="dateSelectable"
                :first-day-of-week="1"
                minimal
                flat
                class="full-width"
              />
            </div>

            <!-- Quick Presets -->
            <div class="presets-container">
              <div class="presets-label">Accesos rápidos</div>
              <div class="presets-grid">
                <q-btn 
                  outline 
                  no-caps 
                  class="preset-btn"
                  @click="presetTomorrow('am')"
                >
                  <q-icon name="wb_sunny" size="18px" class="q-mr-xs" />
                  Mañana AM
                </q-btn>
                <q-btn 
                  outline 
                  no-caps 
                  class="preset-btn"
                  @click="presetTomorrow('pm')"
                >
                  <q-icon name="nights_stay" size="18px" class="q-mr-xs" />
                  Mañana PM
                </q-btn>
                <q-btn 
                  outline 
                  no-caps 
                  class="preset-btn"
                  @click="presetNextWeek"
                >
                  <q-icon name="date_range" size="18px" class="q-mr-xs" />
                  Próxima semana
                </q-btn>
              </div>
            </div>

            <!-- Half Day Toggle -->
            <div v-if="isSingleBusinessDay" class="half-day-section">
              <q-toggle
                v-model="form.medioDia"
                label="Solicitar solo medio día"
                color="primary"
              />
              <q-select
                v-if="form.medioDia"
                v-model="form.medioDiaPeriodo"
                :options="[
                  { label: 'Mañana (AM)', value: 'am' },
                  { label: 'Tarde (PM)', value: 'pm' }
                ]"
                emit-value
                map-options
                outlined
                dense
                class="q-mt-sm"
              />
            </div>

            <!-- Alerts -->
            <q-banner v-if="overlapAlert" class="q-mt-md" dense rounded>
              <template #avatar>
                <q-icon name="warning" color="warning" />
              </template>
              Existe un traslape con otra solicitud tuya en este rango
            </q-banner>
          </div>
        </div>

        <!-- SECTION 3: DETALLES -->
        <div class="form-section" :class="{ disabled: !rangoValido || diasHabiles <= 0 }">
          <div class="section-header" @click="rangoValido && diasHabiles > 0 && toggleSection('detalles')">
            <div class="section-info">
              <q-icon name="notes" size="24px" class="section-icon" />
              <div>
                <div class="section-title">Detalles Adicionales</div>
                <div class="section-subtitle">Comentarios y adjuntos (opcional)</div>
              </div>
            </div>
            <q-icon 
              :name="expandedSections.detalles ? 'expand_less' : 'expand_more'" 
              size="24px"
              class="toggle-icon"
            />
          </div>
          
          <div v-show="expandedSections.detalles" class="section-content">
            <q-input
              v-model="form.comentario"
              type="textarea"
              outlined
              placeholder="Agrega contexto o motivo para tu jefatura..."
              :maxlength="300"
              counter
              autogrow
              class="q-mb-md"
            />

            <q-file
              v-model="archivos"
              label="Adjuntar archivos (opcional)"
              multiple
              outlined
              use-chips
              max-files="5"
              accept=".pdf,.jpg,.jpeg,.png"
            >
              <template #prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
            <div class="text-caption text-grey-7 q-mt-xs">
              Hasta 5 archivos. Máximo 10MB cada uno.
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN: SUMMARY & VALIDATION -->
      <div class="summary-column">
        <!-- LIVE SUMMARY CARD -->
        <div class="summary-card sticky-summary">
          <div class="summary-header">
            <q-icon name="summarize" size="24px" />
            <span>Resumen</span>
          </div>

          <!-- Balances Display -->
          <div class="balances-section">
            <div class="balance-item" v-if="vacacionesAplica">
              <div class="balance-label">
                <q-icon name="beach_access" size="20px" />
                Saldo Vacaciones
              </div>
              <div class="balance-value">
                {{ saldoVacaciones ?? '—' }} días
              </div>
            </div>
            <div class="balance-item" v-if="!vacacionesAplica">
              <div class="balance-label">
                <q-icon name="today" size="20px" />
                Días Administrativos
              </div>
              <div class="balance-value">
                {{ saldoAdmin ?? '—' }} días
              </div>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- Request Details -->
          <div class="summary-details">
            <div class="detail-row">
              <span class="detail-label">Tipo</span>
              <span class="detail-value">{{ tipoLabel || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Días hábiles</span>
              <span class="detail-value highlight">{{ diasHabiles || 0 }}</span>
            </div>
            <div class="detail-row" v-if="retornoLabel !== '—'">
              <span class="detail-label">Retorno</span>
              <span class="detail-value">{{ retornoLabel }}</span>
            </div>
            <div class="detail-row" v-if="vacacionesAplica && saldoRestante !== null">
              <span class="detail-label">Saldo restante</span>
              <span class="detail-value" :class="saldoOk ? 'positive' : 'negative'">
                {{ saldoRestante }} días
              </span>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- Policy Validation -->
          <div class="validation-section">
            <div class="validation-title">Validación de Políticas</div>
            
            <div class="validation-item" :class="avisoOk ? 'valid' : 'invalid'">
              <q-icon :name="avisoOk ? 'check_circle' : 'cancel'" />
              <span>Aviso anticipado ({{ faltanHabiles }} días)</span>
            </div>

            <div class="validation-item" :class="maxOk ? 'valid' : 'invalid'">
              <q-icon :name="maxOk ? 'check_circle' : 'cancel'" />
              <span>Días consecutivos (máx. {{ maxDiasConsecutivos }})</span>
            </div>

            <div v-if="vacacionesAplica" class="validation-item" :class="saldoOk ? 'valid' : 'invalid'">
              <q-icon :name="saldoOk ? 'check_circle' : 'cancel'" />
              <span>Saldo suficiente</span>
            </div>
          </div>

          <!-- Submit Button -->
          <q-btn
            class="submit-btn"
            color="primary"
            size="lg"
            no-caps
            unelevated
            :disable="!readyToSend"
            :loading="sending"
            @click="enviar"
          >
            <q-icon name="send" class="q-mr-sm" />
            Enviar Solicitud
          </q-btn>

          <!-- Error Messages -->
          <div v-if="disableReasons.length > 0" class="error-messages">
            <div v-for="(reason, i) in disableReasons" :key="i" class="error-item">
              <q-icon name="info" size="16px" />
              {{ reason }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- HELP DIALOG -->
    <q-dialog v-model="helpOpen">
      <q-card class="help-dialog">
        <q-card-section class="help-header">
          <div class="text-h6">¿Cómo funciona?</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="help-content">
          <div class="help-step">
            <div class="help-number">1</div>
            <div>
              <strong>Selecciona el tipo</strong>
              <p>Elige entre vacaciones, permiso, licencia o día compensatorio</p>
            </div>
          </div>
          <div class="help-step">
            <div class="help-number">2</div>
            <div>
              <strong>Define las fechas</strong>
              <p>Usa el calendario o los accesos rápidos. El sistema calcula días hábiles automáticamente</p>
            </div>
          </div>
          <div class="help-step">
            <div class="help-number">3</div>
            <div>
              <strong>Revisa y envía</strong>
              <p>Verifica que cumples las políticas en el panel de resumen y envía tu solicitud</p>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Entendido" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "@/stores/authStore";
import { useRequestsStore } from "@/stores/requests";
import { useCompaniesStore } from "@/stores/companies";

import {
  toISO,
  fmt,
  businessDaysCount,
  nextBusinessISO,
  sameOrNextBusinessISO,
  addBusinessDays,
} from "@/composables/useBusinessDates";

/* Base */
const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();
const requests = useRequestsStore();
const companies = useCompaniesStore();

/* Tema */
const pageBgClass = computed(() =>
  $q.dark.isActive ? "bg-grey-10 text-white" : ""
);

/* Estado */
const helpOpen = ref(false);
const loadingBalances = ref(false);
const sending = ref(false);

/* Secciones expandibles */
const expandedSections = ref({
  tipo: true,
  fechas: false,
  detalles: false
});

function toggleSection(section) {
  expandedSections.value[section] = !expandedSections.value[section];
}

/* Catálogos */
const tipos = [
  { label: "Vacaciones", value: "vacaciones" },
  { label: "Día Compensatorio", value: "compensatorio" },
  { label: "Permiso Personal", value: "permiso" },
  { label: "Licencia Médica", value: "licencia" },
];

const tipoIcons = {
  vacaciones: "beach_access",
  compensatorio: "today",
  permiso: "event_available",
  licencia: "medical_services"
};

const avisoMinDias = 1;
const maxDiasConsecutivos = 15;

/* Form */
const form = ref({
  tipo: "",
  fechaInicio: "",
  fechaFin: "",
  medioDia: false,
  medioDiaPeriodo: "am",
  comentario: "",
});

const archivos = ref([]);
const dateRange = ref({ from: "", to: "" });

/* User/company */
const userId = computed(() => auth?.user?.id || auth?.user?._id || null);
const companyId = computed(
  () => auth?.user?.company?._id || auth?.user?.company || null
);

/* Balances y feriados */
const saldoVacaciones = ref(null);
const saldoAdmin = ref(null);
const feriados = ref([]);

/* Computed */
const tipoLabel = computed(() =>
  tipos.find(t => t.value === form.value.tipo)?.label || ''
);

const vacacionesAplica = computed(() => form.value.tipo === "vacaciones");

const rangoValido = computed(() => {
  const { fechaInicio, fechaFin } = form.value;
  if (!fechaInicio || !fechaFin) return true;
  return new Date(fechaInicio) <= new Date(fechaFin);
});

const diasHabiles = computed(() => {
  let count = businessDaysCount(
    form.value.fechaInicio,
    form.value.fechaFin,
    feriados.value
  );
  if (form.value.medioDia && count === 1) return 0.5;
  return count;
});

const diasBadgeColor = computed(() => {
  if (diasHabiles.value === 0) return 'grey';
  if (diasHabiles.value <= 2) return 'orange';
  if (diasHabiles.value <= 5) return 'primary';
  return 'positive';
});

const rangeDisplayLabel = computed(() => {
  const { fechaInicio, fechaFin } = form.value;
  if (!fechaInicio) return '';
  if (fechaInicio === fechaFin) return fmt(fechaInicio);
  return `${fmt(fechaInicio)} → ${fmt(fechaFin)}`;
});

const isSingleBusinessDay = computed(() => {
  const count = businessDaysCount(
    form.value.fechaInicio,
    form.value.fechaFin,
    feriados.value
  );
  return count === 1;
});

const retorno = computed(() => {
  const { fechaInicio, fechaFin, medioDia, medioDiaPeriodo } = form.value;
  if (!fechaInicio || !fechaFin) return null;
  if (!medioDia) {
    const ret = nextBusinessISO(fechaFin, feriados.value);
    return { date: ret, time: "09:00", label: `${fmt(ret)} 09:00` };
  }
  if (medioDiaPeriodo === "am") {
    const ret = sameOrNextBusinessISO(fechaFin, feriados.value);
    return { date: ret, time: "14:00", label: `${fmt(ret)} 14:00` };
  } else {
    const ret = nextBusinessISO(fechaFin, feriados.value);
    return { date: ret, time: "09:00", label: `${fmt(ret)} 09:00` };
  }
});

const retornoLabel = computed(() => retorno.value?.label || "—");

const saldoRestante = computed(() => {
  if (!vacacionesAplica.value || saldoVacaciones.value == null) return null;
  const resto = Number(saldoVacaciones.value) - Number(diasHabiles.value || 0);
  return isNaN(resto) ? null : resto;
});

const saldoOk = computed(
  () =>
    !vacacionesAplica.value ||
    saldoVacaciones.value == null ||
    diasHabiles.value <= saldoVacaciones.value
);

const overlapAlert = computed(() => {
  const { fechaInicio, fechaFin } = form.value;
  if (!fechaInicio || !fechaFin) return false;
  const list = requests.myRequests || [];
  const s = new Date(fechaInicio);
  const e = new Date(fechaFin);
  return list.some((r) => {
    const rs = new Date(r.startDate);
    const re = new Date(r.endDate || r.startDate);
    return !(re < s || rs > e);
  });
});

const faltanHabiles = computed(() => {
  if (!form.value.fechaInicio) return 0;
  const today = toISO(new Date());
  let c = 0;
  const ferSet = new Set(feriados.value);
  const start = new Date(today + "T00:00:00");
  const end = new Date(form.value.fechaInicio + "T00:00:00");
  if (end <= start) return 0;
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    d.setDate(d.getDate() + 1);
    const iso = toISO(d);
    if (d.getDay() === 0 || d.getDay() === 6 || ferSet.has(iso)) continue;
    c++;
  }
  return c;
});

const avisoOk = computed(() =>
  form.value.fechaInicio ? faltanHabiles.value >= avisoMinDias : true
);

const maxOk = computed(() => diasHabiles.value <= maxDiasConsecutivos);

const disableReasons = computed(() => {
  const reasons = [];
  if (!form.value.tipo) reasons.push("Selecciona un tipo de solicitud");
  if (!form.value.fechaInicio || !form.value.fechaFin)
    reasons.push("Selecciona un rango de fechas");
  if (!rangoValido.value)
    reasons.push("La fecha de inicio debe ser anterior a la de fin");
  if (diasHabiles.value <= 0)
    reasons.push("El rango no contiene días hábiles");
  if (overlapAlert.value)
    reasons.push("Existe un traslape con otra solicitud");
  if (!avisoOk.value)
    reasons.push(`Debes avisar con al menos ${avisoMinDias} día hábil de anticipación`);
  if (!maxOk.value)
    reasons.push(`No puedes solicitar más de ${maxDiasConsecutivos} días consecutivos`);
  if (vacacionesAplica.value && saldoVacaciones.value != null && !saldoOk.value)
    reasons.push("Saldo de vacaciones insuficiente");
  return reasons;
});

const readyToSend = computed(() => disableReasons.value.length === 0);

/* Functions */
function selectTipo(tipo) {
  form.value.tipo = tipo;
  expandedSections.value.tipo = false;
  expandedSections.value.fechas = true;
}

function dateSelectable(dateStr) {
  const iso = String(dateStr).replace(/\//g, "-");
  const d = new Date(iso + "T00:00:00");
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  return !feriados.value?.includes(iso);
}

const todayISO = toISO(new Date());

function presetTomorrow(period = 'am') {
  const t = nextBusinessISO(todayISO, feriados.value);
  form.value.fechaInicio = t;
  form.value.fechaFin = t;
  form.value.medioDia = true;
  form.value.medioDiaPeriodo = period;
  dateRange.value = { from: t, to: t };
}

function presetNextWeek() {
  const d = new Date();
  const day = d.getDay();
  const diffToMon = (8 - day) % 7 || 7;
  d.setDate(d.getDate() + diffToMon);
  const monday = toISO(d);
  const friday = addBusinessDays(monday, 4, feriados.value);
  form.value.fechaInicio = monday;
  form.value.fechaFin = friday;
  form.value.medioDia = false;
  dateRange.value = { from: monday, to: friday };
}

watch(dateRange, (val) => {
  if (val?.from) {
    form.value.fechaInicio = val.from;
    form.value.fechaFin = val.to || val.from;
  }
}, { deep: true });

async function enviar() {
  if (!readyToSend.value) {
    $q.notify({
      type: "negative",
      message: "Completa todos los requisitos antes de enviar",
    });
    return;
  }

  try {
    sending.value = true;
    const payloadBase = {
      type: form.value.tipo,
      startDate: form.value.fechaInicio,
      endDate: form.value.fechaFin,
      halfDay: !!form.value.medioDia,
      halfDayPeriod: form.value.medioDia
        ? form.value.medioDiaPeriodo
        : undefined,
      businessDays: diasHabiles.value,
      comment: form.value.comentario || "",
      returnWork: retorno.value
        ? `${retorno.value.date}T${retorno.value.time}`
        : null,
    };

    const hasFiles = archivos.value && archivos.value.length;
    if (hasFiles) {
      const fd = new FormData();
      Object.entries(payloadBase).forEach(
        ([k, v]) => v != null && fd.append(k, String(v))
      );
      archivos.value.forEach((f, i) =>
        fd.append("attachments", f, f.name || `file_${i}`)
      );
      await requests.createRequest(fd);
    } else {
      await requests.createRequest(payloadBase);
    }

    $q.notify({ 
      type: "positive", 
      message: "Solicitud enviada correctamente",
      icon: "check_circle"
    });
    router.push("/solicitudes");
  } catch (e) {
    const msg =
      requests.error || e?.message || "No se pudo enviar la solicitud";
    $q.notify({ type: "negative", message: msg });
  } finally {
    sending.value = false;
  }
}

onMounted(async () => {
  await reloadData();
  try {
    if (!requests.myRequests?.length && requests.fetchMyRequests) {
      await requests.fetchMyRequests();
    }
  } catch {}
});

async function reloadData() {
  loadingBalances.value = true;
  try {
    if (companyId.value && companies.fetchCompanyHolidays) {
      await companies.fetchCompanyHolidays(companyId.value);
      feriados.value = (companies.holidays || [])
        .map((d) => (typeof d === "string" ? d : d.date))
        .filter(Boolean);
    } else {
      feriados.value = [];
    }

    if (requests.fetchBalances) {
      const balance = await requests.fetchBalances();
      saldoVacaciones.value = Number(balance?.VACATION);
      saldoAdmin.value = Number(balance?.ADMIN_DAY);
    } else {
      saldoVacaciones.value = null;
      saldoAdmin.value = null;
    }
  } catch {
    // mantiene valores
  } finally {
    loadingBalances.value = false;
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

.request-page {
  font-family: 'Outfit', sans-serif;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  padding: 2rem 1.5rem;
}

/* ========== HERO HEADER ========== */
.hero-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2.5rem;
  padding: 1.5rem 0;
}

.hero-content {
  display: flex;
  gap: 1.25rem;
  align-items: center;
}

.hero-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
  font-weight: 400;
}

.hero-actions {
  display: flex;
  gap: 0.5rem;
}

/* ========== PROGRESS TRACKER ========== */
.progress-tracker {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.step-indicator {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 24px;
  color: #94a3b8;
}

.progress-step.active .step-indicator {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transform: scale(1.1);
}

.progress-step.complete .step-indicator {
  background: #10b981;
  color: white;
}

.step-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.progress-step.active .step-label {
  color: #667eea;
  font-weight: 600;
}

.progress-line {
  width: 120px;
  height: 3px;
  background: #e2e8f0;
  margin: 0 1rem;
  transition: all 0.3s ease;
  position: relative;
  top: -18px;
}

.progress-line.active {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

/* ========== MAIN FORM CONTAINER ========== */
.form-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* ========== FORM SECTIONS ========== */
.form-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;
}

.form-section.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.form-section.expanded {
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
  border: 2px solid #667eea;
}

.section-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.section-header:hover {
  background: #f8fafc;
}

.section-info {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex: 1;
}

.section-icon {
  color: #667eea;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.section-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.section-badges {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.days-badge {
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.toggle-icon {
  color: #94a3b8;
  transition: transform 0.3s ease;
}

.section-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== TIPO GRID ========== */
.tipo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.tipo-card {
  padding: 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: white;
}

.tipo-card:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
}

.tipo-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.tipo-card .q-icon:first-child {
  color: #667eea;
  transition: transform 0.3s ease;
}

.tipo-card.selected .q-icon:first-child {
  transform: scale(1.2);
}

.tipo-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
  text-align: center;
}

.check-icon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: #10b981;
  font-size: 20px;
}

/* ========== DATE PICKER ========== */
.date-picker-container {
  margin-bottom: 1.5rem;
}

.date-picker-container :deep(.q-date) {
  box-shadow: none;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
}

.presets-container {
  margin-top: 1rem;
}

.presets-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.75rem;
}

.presets-grid {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.preset-btn {
  border-radius: 12px;
  font-weight: 500;
  border-width: 2px;
}

.half-day-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

/* ========== SUMMARY COLUMN ========== */
.summary-column {
  position: relative;
}

.sticky-summary {
  position: sticky;
  top: 2rem;
}

.summary-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.summary-header .q-icon {
  color: #667eea;
}

/* ========== BALANCES ========== */
.balances-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
}

.balance-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #475569;
  font-size: 0.875rem;
}

.balance-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

/* ========== SUMMARY DETAILS ========== */
.summary-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.detail-value.highlight {
  color: #667eea;
  font-size: 1.125rem;
}

.detail-value.positive {
  color: #10b981;
}

.detail-value.negative {
  color: #ef4444;
}

/* ========== VALIDATION ========== */
.validation-section {
  margin-top: 1rem;
}

.validation-title {
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.validation-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.validation-item.valid {
  color: #10b981;
}

.validation-item.invalid {
  color: #ef4444;
}

.validation-item .q-icon {
  font-size: 18px;
}

/* ========== SUBMIT BUTTON ========== */
.submit-btn {
  width: 100%;
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 14px;
  font-weight: 600;
  font-size: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.5);
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.5;
}

/* ========== ERROR MESSAGES ========== */
.error-messages {
  margin-top: 1rem;
  padding: 1rem;
  background: #fef2f2;
  border-radius: 12px;
  border-left: 4px solid #ef4444;
}

.error-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #991b1b;
  margin-bottom: 0.5rem;
}

.error-item:last-child {
  margin-bottom: 0;
}

.error-item .q-icon {
  color: #ef4444;
  flex-shrink: 0;
}

/* ========== HELP DIALOG ========== */
.help-dialog {
  min-width: 500px;
  border-radius: 20px;
}

.help-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.help-content {
  padding: 2rem;
}

.help-step {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.help-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.help-step strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #1e293b;
}

.help-step p {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 1024px) {
  .form-container {
    grid-template-columns: 1fr;
  }

  .sticky-summary {
    position: static;
  }

  .progress-tracker {
    flex-direction: column;
    gap: 1rem;
  }

  .progress-line {
    width: 3px;
    height: 60px;
    top: 0;
  }
}

@media (max-width: 768px) {
  .request-page {
    padding: 1rem;
  }

  .hero-header {
    flex-direction: column;
    gap: 1rem;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .tipo-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .help-dialog {
    min-width: 90vw;
  }
}
</style>