<template>
  <q-page class="rk-request-page">
    <!-- Header -->
    <PageHeader
      icon="event_note"
      title="Nueva Solicitud"
      subtitle="Solicita vacaciones, permisos, licencia o día compensatorio"
    />

    <div class="rk-request-layout">
      <!-- Main form -->
      <div class="rk-form-col">

        <!-- STEP 1: Tipo de solicitud -->
        <section class="rk-card">
          <div class="rk-card-title">
            <q-icon name="category" color="primary" size="20px" />
            <span>Tipo de solicitud</span>
          </div>
          <div class="rk-tipo-grid">
            <div
              v-for="tipo in tipos"
              :key="tipo.value"
              class="rk-tipo-card"
              :class="{ selected: form.tipo === tipo.value }"
              @click="form.tipo = tipo.value"
            >
              <q-icon :name="tipo.icon" size="28px" />
              <span class="rk-tipo-label">{{ tipo.label }}</span>
              <span class="rk-tipo-hint">{{ tipo.hint }}</span>
              <q-icon v-if="form.tipo === tipo.value" name="check_circle" class="rk-tipo-check" color="positive" />
            </div>
          </div>
        </section>

        <!-- STEP 2: Fechas -->
        <section class="rk-card" :class="{ 'rk-disabled': !form.tipo }">
          <div class="rk-card-title">
            <q-icon name="date_range" color="primary" size="20px" />
            <span>Fechas</span>
            <q-badge v-if="diasHabiles > 0" :color="diasHabiles <= 2 ? 'orange' : 'primary'" class="q-ml-sm">
              {{ diasHabiles }} {{ diasHabiles === 1 ? 'día hábil' : 'días hábiles' }}
            </q-badge>
          </div>

          <!-- Single day toggle -->
          <div class="rk-date-mode">
            <q-btn-toggle
              v-model="dateMode"
              no-caps
              unelevated
              toggle-color="primary"
              :options="[
                { label: 'Un solo día', value: 'single' },
                { label: 'Rango de fechas', value: 'range' }
              ]"
              class="rk-date-toggle"
            />
          </div>

          <!-- Single day mode -->
          <div v-if="dateMode === 'single'" class="rk-date-fields">
            <div class="rk-field">
              <label class="rk-label">Fecha</label>
              <q-input
                v-model="form.fechaInicio"
                type="date"
                outlined
                dense
                :rules="[v => !!v || 'Requerido']"
              />
            </div>

            <!-- Half day option -->
            <div class="rk-half-day">
              <q-toggle v-model="form.medioDia" label="Solo medio día" color="primary" />
              <q-btn-toggle
                v-if="form.medioDia"
                v-model="form.medioDiaPeriodo"
                no-caps
                dense
                unelevated
                toggle-color="primary"
                :options="[
                  { label: 'Mañana', value: 'am' },
                  { label: 'Tarde', value: 'pm' }
                ]"
                class="q-ml-md"
              />
            </div>
          </div>

          <!-- Range mode -->
          <div v-else class="rk-date-fields">
            <div class="rk-date-row">
              <div class="rk-field">
                <label class="rk-label">Desde</label>
                <q-input
                  v-model="form.fechaInicio"
                  type="date"
                  outlined
                  dense
                  :rules="[v => !!v || 'Requerido']"
                />
              </div>
              <div class="rk-field">
                <label class="rk-label">Hasta</label>
                <q-input
                  v-model="form.fechaFin"
                  type="date"
                  outlined
                  dense
                  :rules="[v => !!v || 'Requerido']"
                />
              </div>
            </div>
          </div>

          <!-- Quick presets -->
          <div class="rk-presets">
            <span class="rk-presets-label">Rápido:</span>
            <q-btn outline dense no-caps size="sm" label="Hoy" @click="presetToday" class="rk-preset-btn" v-if="allowsToday" />
            <q-btn outline dense no-caps size="sm" label="Mañana" @click="presetTomorrow" class="rk-preset-btn" />
            <q-btn outline dense no-caps size="sm" label="Próx. semana" @click="presetNextWeek" class="rk-preset-btn" />
          </div>

          <!-- Alerts -->
          <q-banner v-if="!rangoValido" class="q-mt-sm bg-red-1 text-red" rounded dense>
            <template #avatar><q-icon name="error" color="red" /></template>
            La fecha de inicio debe ser anterior o igual a la de fin
          </q-banner>

          <q-banner v-if="overlapAlert" class="q-mt-sm bg-orange-1 text-orange-9" rounded dense>
            <template #avatar><q-icon name="warning" color="orange" /></template>
            Existe traslape con otra solicitud tuya en estas fechas
          </q-banner>

          <q-banner v-if="diasHabiles === 0 && form.fechaInicio" class="q-mt-sm bg-orange-1 text-orange-9" rounded dense>
            <template #avatar><q-icon name="info" color="orange" /></template>
            El rango seleccionado no contiene días hábiles (fines de semana y feriados no cuentan)
          </q-banner>
        </section>

        <!-- STEP 3: Detalles (siempre visible, sin accordion) -->
        <section class="rk-card" :class="{ 'rk-disabled': !form.fechaInicio || diasHabiles <= 0 }">
          <div class="rk-card-title">
            <q-icon name="notes" color="primary" size="20px" />
            <span>Comentario y adjuntos</span>
            <q-badge color="grey" label="Opcional" class="q-ml-sm" />
          </div>

          <q-input
            v-model="form.comentario"
            type="textarea"
            outlined
            dense
            placeholder="Motivo o contexto para tu jefatura..."
            :maxlength="300"
            counter
            autogrow
            rows="2"
            class="q-mb-sm"
          />

          <q-file
            v-model="archivos"
            label="Adjuntar archivos"
            multiple
            outlined
            dense
            use-chips
            max-files="5"
            accept=".pdf,.jpg,.jpeg,.png"
          >
            <template #prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
          <div class="text-caption text-grey q-mt-xs">
            Hasta 5 archivos, max 10 MB cada uno
          </div>
        </section>
      </div>

      <!-- Sidebar: Summary -->
      <div class="rk-summary-col">
        <div class="rk-summary-card rk-sticky">
          <div class="rk-summary-title">Resumen</div>

          <!-- Balances -->
          <div v-if="relevantBalance !== null" class="rk-balance">
            <q-icon :name="balanceIcon" size="20px" color="primary" />
            <span>{{ balanceLabel }}</span>
            <strong class="q-ml-auto">{{ relevantBalance }} días</strong>
          </div>

          <q-separator class="q-my-sm" />

          <!-- Details -->
          <div class="rk-detail-rows">
            <div class="rk-detail-row">
              <span>Tipo</span>
              <strong>{{ tipoLabel || '—' }}</strong>
            </div>
            <div class="rk-detail-row">
              <span>Período</span>
              <strong>{{ rangeDisplayLabel || '—' }}</strong>
            </div>
            <div class="rk-detail-row">
              <span>Días hábiles</span>
              <strong :class="diasHabiles > 0 ? 'text-primary' : ''">{{ diasHabiles || 0 }}</strong>
            </div>
            <div v-if="form.medioDia" class="rk-detail-row">
              <span>Medio día</span>
              <strong>{{ form.medioDiaPeriodo === 'am' ? 'Mañana' : 'Tarde' }}</strong>
            </div>
            <div v-if="retornoLabel !== '—'" class="rk-detail-row">
              <span>Retorno</span>
              <strong>{{ retornoLabel }}</strong>
            </div>
            <div v-if="vacacionesAplica && saldoRestante !== null" class="rk-detail-row">
              <span>Saldo restante</span>
              <strong :class="saldoOk ? 'text-positive' : 'text-negative'">{{ saldoRestante }} días</strong>
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <!-- Validations -->
          <div class="rk-validations">
            <div class="rk-val-item" :class="avisoOk ? 'rk-val-ok' : 'rk-val-warn'">
              <q-icon :name="avisoOk ? 'check_circle' : 'warning'" size="16px" />
              <span v-if="avisoOk">Aviso anticipado OK</span>
              <span v-else>
                Aviso anticipado insuficiente ({{ faltanHabiles }} de {{ avisoMinDiasActual }} días)
                <template v-if="form.tipo === 'permiso' || form.tipo === 'licencia'">
                  <br><small class="text-grey-6">— se permite para este tipo</small>
                </template>
              </span>
            </div>
            <div class="rk-val-item" :class="maxOk ? 'rk-val-ok' : 'rk-val-fail'">
              <q-icon :name="maxOk ? 'check_circle' : 'cancel'" size="16px" />
              <span>Máx. {{ maxDiasConsecutivos }} días consecutivos</span>
            </div>
            <div v-if="vacacionesAplica" class="rk-val-item" :class="saldoOk ? 'rk-val-ok' : 'rk-val-fail'">
              <q-icon :name="saldoOk ? 'check_circle' : 'cancel'" size="16px" />
              <span>Saldo suficiente</span>
            </div>
          </div>

          <!-- Submit -->
          <q-btn
            unelevated
            color="primary"
            icon="send"
            label="Enviar Solicitud"
            :disable="!readyToSend"
            :loading="sending"
            class="full-width q-mt-md rk-submit-btn"
            @click="enviar"
          />

          <!-- Reasons -->
          <div v-if="disableReasons.length > 0 && form.tipo" class="rk-reasons">
            <div v-for="(r, i) in disableReasons" :key="i" class="rk-reason">
              <q-icon name="info" size="14px" color="red" />
              <span>{{ r }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "@/stores/authStore";
import { useRequestsStore } from "@/stores/requests";
import { useCompaniesStore } from "@/stores/companies";
import PageHeader from "@/components/shared/PageHeader.vue";

import {
  toISO,
  fmt,
  businessDaysCount,
  nextBusinessISO,
  sameOrNextBusinessISO,
  addBusinessDays,
} from "@/composables/useBusinessDates";

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();
const requests = useRequestsStore();
const companies = useCompaniesStore();

const sending = ref(false);
const loadingBalances = ref(false);

/* ========== Tipos ========== */
const tipos = [
  { label: "Vacaciones", value: "vacaciones", icon: "beach_access", hint: "Descanso anual" },
  { label: "Compensatorio", value: "compensatorio", icon: "today", hint: "Día ganado" },
  { label: "Permiso", value: "permiso", icon: "event_available", hint: "Personal / trámite" },
  { label: "Licencia", value: "licencia", icon: "medical_services", hint: "Médica" },
];

/* ========== Políticas por tipo ========== */
const avisoMinDiasPorTipo = {
  vacaciones: 5,
  compensatorio: 1,
  permiso: 0,    // puede ser mismo día
  licencia: 0,   // puede ser retroactivo
};

const maxDiasConsecutivos = 15;

/* ========== Form State ========== */
const dateMode = ref("single");

const form = ref({
  tipo: "",
  fechaInicio: "",
  fechaFin: "",
  medioDia: false,
  medioDiaPeriodo: "am",
  comentario: "",
});

const archivos = ref([]);

// Sync single-day mode: when single, keep fechaFin = fechaInicio
watch(dateMode, (mode) => {
  if (mode === "single") {
    form.value.fechaFin = form.value.fechaInicio;
  }
  form.value.medioDia = false;
});

watch(() => form.value.fechaInicio, (v) => {
  if (dateMode.value === "single") {
    form.value.fechaFin = v;
  }
  // Ensure end >= start
  if (form.value.fechaFin && v && v > form.value.fechaFin) {
    form.value.fechaFin = v;
  }
});

/* ========== User / Company ========== */
const userId = computed(() => auth?.user?.id || auth?.user?._id || null);
const companyId = computed(
  () => auth?.user?.company?._id || auth?.user?.company || null
);

/* ========== Balances & holidays ========== */
const saldoVacaciones = ref(null);
const saldoAdmin = ref(null);
const feriados = ref([]);

const vacacionesAplica = computed(() => form.value.tipo === "vacaciones");

const relevantBalance = computed(() => {
  if (form.value.tipo === "vacaciones") return saldoVacaciones.value;
  if (form.value.tipo === "compensatorio") return saldoAdmin.value;
  return null;
});

const balanceIcon = computed(() => {
  if (form.value.tipo === "vacaciones") return "beach_access";
  return "today";
});

const balanceLabel = computed(() => {
  if (form.value.tipo === "vacaciones") return "Saldo vacaciones";
  if (form.value.tipo === "compensatorio") return "Días compensatorios";
  return "";
});

/* ========== Computed ========== */
const tipoLabel = computed(() =>
  tipos.find((t) => t.value === form.value.tipo)?.label || ""
);

const allowsToday = computed(() =>
  form.value.tipo === "permiso" || form.value.tipo === "licencia"
);

const rangoValido = computed(() => {
  const { fechaInicio, fechaFin } = form.value;
  if (!fechaInicio || !fechaFin) return true;
  return fechaInicio <= fechaFin;
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

// Reset medioDia when not single business day
watch(() => diasHabiles.value, (d) => {
  if (d !== 1) form.value.medioDia = false;
});

const rangeDisplayLabel = computed(() => {
  const { fechaInicio, fechaFin } = form.value;
  if (!fechaInicio) return "";
  if (fechaInicio === fechaFin || dateMode.value === "single") return fmt(fechaInicio);
  if (!fechaFin) return fmt(fechaInicio);
  return `${fmt(fechaInicio)} → ${fmt(fechaFin)}`;
});

const retorno = computed(() => {
  const { fechaInicio, fechaFin, medioDia, medioDiaPeriodo } = form.value;
  const end = fechaFin || fechaInicio;
  if (!end) return null;
  if (!medioDia) {
    const ret = nextBusinessISO(end, feriados.value);
    return { date: ret, time: "09:00", label: `${fmt(ret)} 09:00` };
  }
  if (medioDiaPeriodo === "am") {
    const ret = sameOrNextBusinessISO(end, feriados.value);
    return { date: ret, time: "14:00", label: `${fmt(ret)} 14:00` };
  } else {
    const ret = nextBusinessISO(end, feriados.value);
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
  if (!fechaInicio) return false;
  const end = fechaFin || fechaInicio;
  const list = requests.myRequests || [];
  const s = new Date(fechaInicio);
  const e = new Date(end);
  return list.some((r) => {
    if (r.status === "CANCELLED" || r.status === "REJECTED") return false;
    const rs = new Date(r.startDate);
    const re = new Date(r.endDate || r.startDate);
    return !(re < s || rs > e);
  });
});

// Fixed: proper business days between today and start date
const faltanHabiles = computed(() => {
  if (!form.value.fechaInicio) return 0;
  const todayStr = toISO(new Date());
  const startStr = form.value.fechaInicio;
  if (startStr <= todayStr) return 0;
  const ferSet = new Set(feriados.value);
  let c = 0;
  const cursor = new Date(todayStr + "T00:00:00");
  const end = new Date(startStr + "T00:00:00");
  // Count business days from tomorrow up to (not including) start date
  cursor.setDate(cursor.getDate() + 1);
  while (cursor < end) {
    const iso = toISO(cursor);
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6 && !ferSet.has(iso)) {
      c++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return c;
});

const avisoMinDiasActual = computed(() =>
  avisoMinDiasPorTipo[form.value.tipo] ?? 1
);

const avisoOk = computed(() => {
  if (!form.value.fechaInicio) return true;
  // Licencia y permiso no requieren aviso anticipado obligatorio
  if (form.value.tipo === "licencia" || form.value.tipo === "permiso") return true;
  return faltanHabiles.value >= avisoMinDiasActual.value;
});

const maxOk = computed(() => diasHabiles.value <= maxDiasConsecutivos);

const disableReasons = computed(() => {
  const reasons = [];
  if (!form.value.tipo) reasons.push("Selecciona un tipo de solicitud");
  if (!form.value.fechaInicio) reasons.push("Selecciona una fecha");
  if (dateMode.value === "range" && !form.value.fechaFin) reasons.push("Selecciona la fecha de fin");
  if (!rangoValido.value) reasons.push("La fecha de inicio debe ser anterior o igual a la de fin");
  if (form.value.fechaInicio && diasHabiles.value <= 0)
    reasons.push("El rango no contiene días hábiles");
  if (overlapAlert.value) reasons.push("Hay traslape con otra solicitud");
  if (!avisoOk.value)
    reasons.push(
      `Se requieren al menos ${avisoMinDiasActual.value} día(s) hábil(es) de anticipación para ${tipoLabel.value}`
    );
  if (!maxOk.value)
    reasons.push(`Máximo ${maxDiasConsecutivos} días consecutivos`);
  if (vacacionesAplica.value && saldoVacaciones.value != null && !saldoOk.value)
    reasons.push("Saldo de vacaciones insuficiente");
  return reasons;
});

const readyToSend = computed(() => disableReasons.value.length === 0);

/* ========== Presets ========== */
const todayISO = toISO(new Date());

function presetToday() {
  dateMode.value = "single";
  form.value.fechaInicio = todayISO;
  form.value.fechaFin = todayISO;
}

function presetTomorrow() {
  const t = nextBusinessISO(todayISO, feriados.value);
  dateMode.value = "single";
  form.value.fechaInicio = t;
  form.value.fechaFin = t;
}

function presetNextWeek() {
  const d = new Date();
  const day = d.getDay();
  const diffToMon = (8 - day) % 7 || 7;
  d.setDate(d.getDate() + diffToMon);
  const monday = toISO(d);
  const friday = addBusinessDays(monday, 4, feriados.value);
  dateMode.value = "range";
  form.value.fechaInicio = monday;
  form.value.fechaFin = friday;
  form.value.medioDia = false;
}

/* ========== Submit ========== */
async function enviar() {
  if (!readyToSend.value) {
    $q.notify({ type: "negative", message: "Completa todos los campos requeridos" });
    return;
  }

  try {
    sending.value = true;
    const payloadBase = {
      type: form.value.tipo,
      startDate: form.value.fechaInicio,
      endDate: form.value.fechaFin || form.value.fechaInicio,
      halfDay: !!form.value.medioDia,
      halfDayPeriod: form.value.medioDia ? form.value.medioDiaPeriodo : undefined,
      businessDays: diasHabiles.value,
      comment: form.value.comentario || "",
      returnWork: retorno.value ? `${retorno.value.date}T${retorno.value.time}` : null,
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
      message: "Solicitud enviada",
      caption: "Tu jefatura será notificada",
      icon: "check_circle",
    });
    router.push("/solicitudes");
  } catch (e) {
    $q.notify({
      type: "negative",
      message: requests.error || e?.message || "No se pudo enviar",
    });
  } finally {
    sending.value = false;
  }
}

/* ========== Init ========== */
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
    // keep existing values
  } finally {
    loadingBalances.value = false;
  }
}
</script>

<style scoped>
.rk-request-page {
  min-height: 100vh;
  padding: 0 12px 24px;
}

/* Layout */
.rk-request-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 12px;
}

/* Card sections */
.rk-card {
  background: var(--rk-card, #fff);
  border: 1px solid var(--rk-border, rgba(0,0,0,.08));
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
  transition: opacity 0.2s;
}

.body--dark .rk-card {
  background: #101318;
  border-color: rgba(255,255,255,.08);
}

.rk-card.rk-disabled {
  opacity: 0.45;
  pointer-events: none;
}

.rk-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 16px;
}

/* Tipo grid */
.rk-tipo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.rk-tipo-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 10px;
  border: 2px solid rgba(0,0,0,.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  text-align: center;
}

.body--dark .rk-tipo-card {
  border-color: rgba(255,255,255,.1);
}

.rk-tipo-card:hover {
  border-color: var(--q-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
}

.rk-tipo-card.selected {
  border-color: var(--q-primary);
  background: rgba(33, 150, 243, 0.06);
}

.rk-tipo-card .q-icon:first-child {
  color: var(--q-primary);
}

.rk-tipo-label {
  font-weight: 700;
  font-size: 0.85rem;
}

.rk-tipo-hint {
  font-size: 0.72rem;
  opacity: 0.55;
}

.rk-tipo-check {
  position: absolute;
  top: 6px;
  right: 6px;
}

/* Date section */
.rk-date-mode {
  margin-bottom: 14px;
}

.rk-date-toggle {
  border-radius: 8px;
}

.rk-date-toggle :deep(.q-btn) {
  text-transform: none;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 6px 16px;
}

.rk-date-fields {
  margin-bottom: 12px;
}

.rk-date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.rk-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rk-label {
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.6;
}

.rk-half-day {
  display: flex;
  align-items: center;
  margin-top: 8px;
  padding: 10px;
  background: rgba(0,0,0,.02);
  border-radius: 8px;
}

.body--dark .rk-half-day {
  background: rgba(255,255,255,.04);
}

/* Presets */
.rk-presets {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rk-presets-label {
  font-size: 0.78rem;
  font-weight: 600;
  opacity: 0.5;
}

.rk-preset-btn {
  border-radius: 6px;
  text-transform: none;
}

/* Summary sidebar */
.rk-summary-col {
  position: relative;
}

.rk-sticky {
  position: sticky;
  top: 16px;
}

.rk-summary-card {
  background: var(--rk-card, #fff);
  border: 1px solid var(--rk-border, rgba(0,0,0,.08));
  border-radius: 14px;
  padding: 20px;
}

.body--dark .rk-summary-card {
  background: #101318;
  border-color: rgba(255,255,255,.08);
}

.rk-summary-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 12px;
}

/* Balance */
.rk-balance {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(33, 150, 243, 0.06);
  border-radius: 8px;
  font-size: 0.88rem;
}

/* Detail rows */
.rk-detail-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rk-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: 4px 0;
}

.rk-detail-row span:first-child {
  opacity: 0.6;
}

/* Validations */
.rk-validations {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rk-val-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.82rem;
  padding: 4px 0;
}

.rk-val-ok { color: #10b981; }
.rk-val-warn { color: #f59e0b; }
.rk-val-fail { color: #ef4444; }

/* Submit */
.rk-submit-btn {
  text-transform: none;
  font-weight: 700;
  font-size: 1rem;
  padding: 12px;
  border-radius: 10px;
}

/* Reasons */
.rk-reasons {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.06);
  border-radius: 8px;
  border-left: 3px solid #ef4444;
}

.rk-reason {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.78rem;
  color: #991b1b;
  margin-bottom: 4px;
}

.rk-reason:last-child { margin-bottom: 0; }

.body--dark .rk-reason { color: #fca5a5; }
.body--dark .rk-reasons { background: rgba(239, 68, 68, 0.1); }

/* Responsive */
@media (max-width: 1024px) {
  .rk-request-layout {
    grid-template-columns: 1fr;
  }

  .rk-sticky {
    position: static;
  }
}

@media (max-width: 768px) {
  .rk-request-page {
    padding: 0 4px 16px;
  }

  .rk-request-layout {
    padding: 0 4px;
  }

  .rk-tipo-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .rk-date-row {
    grid-template-columns: 1fr;
  }

  .rk-half-day {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .rk-half-day .q-ml-md {
    margin-left: 0 !important;
  }
}
</style>
