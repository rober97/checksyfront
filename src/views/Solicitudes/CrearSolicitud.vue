<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <!-- HEADER -->
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <q-icon name="event_note" class="q-mr-sm" size="28px" color="primary" />
        <div class="column">
          <div class="text-h6" :class="headerTextClass">Nueva Solicitud</div>
          <div class="text-caption text-grey-6">
            Selecciona tipo, rango y revisa tu saldo antes de enviar.
          </div>
        </div>
      </div>
      <div class="row items-center q-gutter-xs">
        <q-btn dense round icon="help_outline" @click="helpOpen = true">
          <q-tooltip>¿Cómo funciona?</q-tooltip>
        </q-btn>
        <q-btn
          dense
          round
          icon="refresh"
          @click="reloadData"
          :loading="loadingBalances"
        >
          <q-tooltip>Actualizar saldos y feriados</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- KPIs -->
    <KpiBalances
      :saldo-vacaciones="saldoVacaciones"
      :saldo-admin="saldoAdmin"
      :afecta-saldo-tipo="afectaSaldoTipo"
      :retorno-label="retornoLabel"
    />

    <!-- STEPPER -->
    <!-- STEPPER -->
    <q-stepper
      v-model="step"
      flat
      contracted
      color="primary"
      animated
      class="rk-stepper"
    >
      <q-step :name="1" title="Tipo" icon="category" :done="!!form.tipo">
        <StepTipo v-model="form" :tipos="tipos" @next="goNext" />
      </q-step>

      <q-step
        :name="2"
        title="Rango"
        icon="date_range"
        :done="rangoValido && diasHabiles > 0"
      >
        <StepRango
          v-model="form"
          :feriados="feriados"
          :overlap-alert="overlapAlert"
          :rango-valido="rangoValido"
          :dias-habiles="diasHabiles"
          @next="goNext"
          @back="goNext"
        />
      </q-step>

      <q-step :name="3" title="Detalles" icon="tune" :done="diasHabiles > 0">
        <StepDetalles
          v-model="form"
          v-model:files="archivos"
          :feriados="feriados"
          :saldo-vacaciones="saldoVacaciones"
          :aviso-min-dias="avisoMinDias"
          :max-dias-consecutivos="maxDiasConsecutivos"
          @next="goNext"
          @back="goNext"
        />
      </q-step>

      <q-step :name="4" title="Revisión" icon="visibility">
        <StepRevision
          :form="form"
          :tipos="tipos"
          :dias-habiles="diasHabiles"
          :retorno-label="retornoLabel"
          :vacaciones-aplica="vacacionesAplica"
          :saldo-vacaciones-label="saldoVacacionesLabel"
          :saldo-restante-label="saldoRestanteLabel"
          :disable-reasons="disableReasons"
          :files-count="archivos?.length || 0"
          :sending="sending"
          @back="goNext"
          @enviar="enviar"
        />
      </q-step>
    </q-stepper>

    <!-- DIALOG AYUDA -->
    <q-dialog v-model="helpOpen">
      <q-card style="max-width: 720px">
        <q-card-section
          ><div class="text-h6">¿Cómo hago mi solicitud?</div></q-card-section
        >
        <q-separator />
        <q-card-section class="q-gutter-sm">
          <div><b>1)</b> Elige <i>Tipo de solicitud</i>.</div>
          <div>
            <b>2)</b> Selecciona <i>Rango de fechas</i>; el sistema calcula
            <i>días hábiles</i> y tu <i>retorno</i>.
          </div>
          <div>
            <b>3)</b> Agrega <i>comentario</i> y <i>adjuntos</i> (si aplica).
          </div>
          <div>
            <b>4)</b> Revisa el <i>resumen</i> y presiona <i>Enviar</i>.
          </div>
          <q-separator />
          <div class="text-caption text-grey-8">
            Consejo: usa los <i>presets</i> (Mañana AM/PM, Próxima semana).
          </div>
        </q-card-section>
        <q-card-actions align="right"
          ><q-btn flat label="Cerrar" v-close-popup
        /></q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "@/stores/authStore";
import { useRequestsStore } from "@/stores/requests";
import { useCompaniesStore } from "@/stores/companies";

import KpiBalances from "@/components/requests/KpiBalances.vue";
import StepTipo from "@/components/requests/StepTipo.vue";
import StepRango from "@/components/requests/StepRango.vue";
import StepDetalles from "@/components/requests/StepDetalles.vue";
import StepRevision from "@/components/requests/StepRevision.vue";

import {
  toISO,
  fmt,
  businessDaysCount,
  nextBusinessISO,
  sameOrNextBusinessISO,
} from "@/composables/useBusinessDates";

/* Base */
const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();
const requests = useRequestsStore();
const companies = useCompaniesStore();

/* Tema */
const pageBgClass = computed(() =>
  $q.dark.isActive ? "bg-grey-10 text-white" : "bg-grey-1"
);
const headerTextClass = computed(() =>
  $q.dark.isActive ? "text-white" : "text-primary"
);

/* Estado general */
const step = ref(1);
const helpOpen = ref(false);
const loadingBalances = ref(false);

/* Catálogos */
const tipos = [
  { label: "Vacaciones", value: "vacaciones" },
  { label: "Día Compensatorio", value: "compensatorio" },
  { label: "Permiso Personal", value: "permiso" },
  { label: "Licencia Médica", value: "licencia" },
];
const avisoMinDias = 1;
const maxDiasConsecutivos = 15;

/* Form + archivos */
const form = ref({
  tipo: "",
  fechaInicio: "",
  fechaFin: "",
  medioDia: false,
  medioDiaPeriodo: "am",
  comentario: "",
});
const archivos = ref([]);

/* User/company */
const userId = computed(() => auth?.user?.id || auth?.user?._id || null);
const companyId = computed(
  () => auth?.user?.company?._id || auth?.user?.company || null
);

/* Balances y feriados */
const saldoVacaciones = ref(null);
const saldoAdmin = ref(null);
const feriados = ref([]);

/* Derivados */
const afectaSaldoTipo = computed(() => form.value.tipo === "vacaciones");

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

const vacacionesAplica = computed(() => form.value.tipo === "vacaciones");
const saldoVacacionesLabel = computed(() =>
  saldoVacaciones.value == null ? "—" : `${saldoVacaciones.value} día(s)`
);
const saldoRestante = computed(() => {
  if (!vacacionesAplica.value || saldoVacaciones.value == null) return null;
  const resto = Number(saldoVacaciones.value) - Number(diasHabiles.value || 0);
  return isNaN(resto) ? null : resto;
});
const saldoRestanteLabel = computed(() =>
  saldoRestante.value == null ? "—" : `${saldoRestante.value} día(s)`
);
const saldoOk = computed(
  () =>
    !vacacionesAplica.value ||
    saldoVacaciones.value == null ||
    diasHabiles.value <= saldoVacaciones.value
);

/* Overlaps */
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

/* Políticas */
const faltanHabiles = computed(() => {
  if (!form.value.fechaInicio) return 0;
  // hoy -> inicio (exclusivo-inclusivo)
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

/* Razones bloqueo envío */
const disableReasons = computed(() => {
  const reasons = [];
  if (!form.value.tipo) reasons.push("Selecciona un tipo de solicitud.");
  if (!form.value.fechaInicio || !form.value.fechaFin)
    reasons.push("Selecciona un rango de fechas.");
  if (!rangoValido.value)
    reasons.push("El inicio debe ser anterior o igual al fin.");
  if (diasHabiles.value <= 0)
    reasons.push("El rango no contiene días hábiles.");
  if (overlapAlert.value)
    reasons.push("Tu rango se traslapa con otra solicitud.");
  if (!avisoOk.value)
    reasons.push(`No cumples aviso mínimo (${avisoMinDias} día hábil).`);
  if (!maxOk.value)
    reasons.push(
      `Excedes el máximo de días consecutivos (${maxDiasConsecutivos} hábiles).`
    );
  if (vacacionesAplica.value && saldoVacaciones.value != null && !saldoOk.value)
    reasons.push("Saldo de vacaciones insuficiente.");
  return reasons;
});

/* Navegación */
function goNext(n) {
  step.value = n;
}

/* Envío */
const sending = ref(false);
async function enviar() {
  if (disableReasons.value.length) {
    $q.notify({
      type: "negative",
      message: "Revisa los requisitos antes de enviar.",
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
      await requests.createRequest(fd); // multipart
    } else {
      await requests.createRequest(payloadBase); // JSON
    }

    $q.notify({ type: "positive", message: "Solicitud enviada correctamente" });
    router.push("/solicitudes");
  } catch (e) {
    const msg =
      requests.error || e?.message || "No se pudo enviar la solicitud";
    $q.notify({ type: "negative", message: msg });
  } finally {
    sending.value = false;
  }
}

/* Carga inicial */
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
    debugger;
    // Feriados
    if (companyId.value && companies.fetchCompanyHolidays) {
      await companies.fetchCompanyHolidays(companyId.value);
      feriados.value = (companies.holidays || [])
        .map((d) => (typeof d === "string" ? d : d.date))
        .filter(Boolean);
    } else {
      feriados.value = [];
    }
    // Saldos
    if (requests.fetchBalances) {
      const balance = await requests.fetchBalances();
      saldoVacaciones.value = Number(balance?.VACATION);
      saldoAdmin.value = Number(balance?.ADMIN_DAY);
    } else {
      saldoVacaciones.value = null;
      saldoAdmin.value = null;
    }
  } catch {
    // deja valores tal cual
  } finally {
    loadingBalances.value = false;
  }
}
</script>

<style scoped>
.rk-stepper :deep(.q-stepper__tab) {
  border-radius: 10px;
}
</style>
