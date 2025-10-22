<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <!-- HEADER + BALANCES -->
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

    <!-- KPIs DE SALDO -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-3">
        <q-card flat bordered class="kpi-card">
          <q-card-section class="row items-center justify-between">
            <div class="row items-center">
              <q-avatar color="indigo" text-color="white" icon="beach_access" />
              <div class="q-ml-sm">
                <div class="text-subtitle2">Vacaciones</div>
                <div class="text-caption text-grey-7">Días disponibles</div>
              </div>
            </div>
            <div class="text-h6">{{ saldoVacaciones ?? "—" }}</div>
          </q-card-section>
          <q-linear-progress
            :value="vacProgress.value"
            :color="vacProgress.color"
            rounded
            size="10px"
            class="q-mx-md q-mb-sm"
            track-color="grey-3"
          />
          <div class="text-caption text-grey-7 q-px-md q-pb-sm">
            {{ vacProgress.label }}
          </div>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card flat bordered class="kpi-card">
          <q-card-section class="row items-center justify-between">
            <div class="row items-center">
              <q-avatar color="teal" text-color="white" icon="today" />
              <div class="q-ml-sm">
                <div class="text-subtitle2">Administrativos</div>
                <div class="text-caption text-grey-7">Días disponibles</div>
              </div>
            </div>
            <div class="text-h6">{{ saldoAdmin ?? "—" }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card flat bordered class="kpi-card">
          <q-card-section class="row items-center justify-between">
            <div class="row items-center">
              <q-avatar
                color="orange"
                text-color="white"
                icon="account_balance_wallet"
              />
              <div class="q-ml-sm">
                <div class="text-subtitle2">Afecta saldo</div>
                <div class="text-caption text-grey-7">Según el tipo</div>
              </div>
            </div>
            <q-badge
              outline
              :color="afectaSaldoTipo ? 'negative' : 'grey-7'"
              class="text-uppercase"
              >{{ afectaSaldoTipo ? "Sí" : "No" }}</q-badge
            >
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card flat bordered class="kpi-card">
          <q-card-section class="row items-center justify-between">
            <div class="row items-center">
              <q-avatar
                color="blue"
                text-color="white"
                icon="event_available"
              />
              <div class="q-ml-sm">
                <div class="text-subtitle2">Retorno</div>
                <div class="text-caption text-grey-7">Fecha y hora</div>
              </div>
            </div>
            <div class="text-body1 text-weight-medium">
              {{ retornoLabel }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- PASOS -->
    <q-stepper
      v-model="step"
      flat
      contracted
      color="primary"
      animated
      class="rk-stepper"
    >
      <!-- PASO 1: TIPO -->
      <q-step :name="1" title="Tipo" icon="category" :done="!!form.tipo">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              v-model="form.tipo"
              :options="tipos"
              label="Tipo de solicitud"
              dense
              outlined
              emit-value
              map-options
              :rules="[(v) => !!v || 'Campo obligatorio']"
              @update:model-value="onTipoChange"
            >
              <template #prepend><q-icon name="category" /></template>
            </q-select>
          </div>

          <div class="col-12 col-md-6">
            <q-banner rounded class="q-pa-sm" :class="bannerTipoClass">
              <q-icon
                :name="afectaSaldoTipo ? 'warning' : 'info'"
                class="q-mr-xs"
              />
              {{ tipoHint }}
            </q-banner>
          </div>
        </div>

        <div class="row justify-end q-mt-md">
          <q-btn
            color="primary"
            label="Siguiente"
            @click="goNext(2)"
            :disable="!form.tipo"
          />
        </div>
      </q-step>

      <!-- PASO 2: FECHAS -->
      <q-step
        :name="2"
        title="Rango"
        icon="date_range"
        :done="rangoValido && diasHabiles > 0"
      >
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle2">Selecciona el rango</div>
          <div class="row q-gutter-xs">
            <q-chip clickable outline color="primary" @click="presetTomorrowAM"
              >Mañana AM</q-chip
            >
            <q-chip clickable outline color="primary" @click="presetTomorrowPM"
              >Mañana PM</q-chip
            >
            <q-chip clickable outline color="primary" @click="presetNextWeek"
              >Próx. semana</q-chip
            >
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-input
              v-model="rangeLabel"
              label="Rango de fechas"
              dense
              outlined
              readonly
              :rules="[
                () =>
                  (form.fechaInicio && form.fechaFin) || 'Selecciona un rango',
              ]"
            >
              <template #prepend><q-icon name="date_range" /></template>
              <q-popup-proxy transition-show="scale" transition-hide="scale">
                <q-date
                  v-model="dateRange"
                  range
                  mask="YYYY-MM-DD"
                  :options="dateSelectable"
                  :landscape="$q.screen.gt.sm"
                  today-btn
                  :title="`Selecciona el rango (${diasHabiles} días hábiles)`"
                >
                  <div class="row items-center justify-between q-pa-sm">
                    <div class="text-caption text-grey-7">
                      <q-icon name="event_busy" size="16px" class="q-mr-xs" />
                      Feriados excluidos: {{ feriadosShort }}
                    </div>
                    <div class="row q-gutter-xs">
                      <q-btn flat dense label="Cerrar" v-close-popup />
                      <q-btn
                        color="primary"
                        dense
                        label="Aplicar"
                        @click="applyRange"
                      />
                    </div>
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-input>
          </div>

          <div class="col-12 col-md-4">
            <q-toggle v-model="form.medioDia" label="Medio día" dense />
            <q-select
              v-if="form.medioDia"
              v-model="form.medioDiaPeriodo"
              :options="medioDiaOpts"
              label="Periodo"
              dense
              outlined
              emit-value
              map-options
              class="q-mt-sm"
              :rules="[(v) => !!v || 'Obligatorio']"
            />
          </div>
        </div>

        <div class="q-mt-sm">
          <q-banner
            v-if="!rangoValido"
            class="bg-red-1 text-red-9"
            dense
            rounded
          >
            <q-icon name="error" class="q-mr-xs" /> Inicio debe ser ≤ fin.
          </q-banner>
          <q-banner
            v-if="diasHabiles === 0 && form.fechaInicio && form.fechaFin"
            class="bg-orange-1 text-orange-10"
            dense
            rounded
          >
            <q-icon name="warning" class="q-mr-xs" /> El rango no suma días
            hábiles.
          </q-banner>
          <q-banner
            v-if="overlapAlert"
            class="bg-orange-1 text-orange-10"
            dense
            rounded
          >
            <q-icon name="warning" class="q-mr-xs" /> Tienes solicitudes que se
            traslapan con este rango.
            <q-btn flat dense class="q-ml-sm" label="Ver" to="/solicitudes" />
          </q-banner>
        </div>

        <div class="row justify-between q-mt-md">
          <q-btn flat label="Atrás" @click="goNext(1)" />
          <q-btn
            color="primary"
            label="Siguiente"
            :disable="!canGoStep3"
            @click="goNext(3)"
          />
        </div>
      </q-step>

      <!-- PASO 3: DETALLES -->
      <q-step :name="3" title="Detalles" icon="tune" :done="commentValid">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-input
              v-model="form.comentario"
              label="Comentario (opcional)"
              type="textarea"
              autogrow
              outlined
              dense
              placeholder="Motivo o detalles adicionales para tu jefatura."
              :counter="300"
              :maxlength="300"
            >
              <template #prepend><q-icon name="notes" /></template>
            </q-input>

            <q-file
              v-model="archivos"
              label="Adjuntar respaldo (opcional)"
              multiple
              dense
              outlined
              use-chips
              clear-icon="close"
              class="q-mt-sm"
              :max-files="5"
              accept=".pdf,.jpg,.jpeg,.png,.heic"
            >
              <template #prepend><q-icon name="attach_file" /></template>
            </q-file>

            <div class="text-caption text-grey-7 q-mt-xs">
              Hasta 5 archivos (PDF/Imagen). Máx. 10MB c/u (según política).
            </div>
          </div>

          <!-- PANEL POLÍTICAS + RESUMEN -->
          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-pa-sm">
              <div class="row items-center q-mb-xs">
                <q-icon name="rule" color="primary" class="q-mr-sm" />
                <div class="text-subtitle2">Checklist de políticas</div>
              </div>

              <div class="rk-check">
                <q-icon
                  :name="avisoOk ? 'check_circle' : 'schedule'"
                  :color="avisoOk ? 'positive' : 'orange'"
                  class="q-mr-xs"
                />
                Aviso mínimo: {{ avisoMinLabel }} ({{ faltanHabiles }} hábiles
                de anticipación)
              </div>
              <div class="rk-check">
                <q-icon
                  :name="maxOk ? 'check_circle' : 'error'"
                  :color="maxOk ? 'positive' : 'negative'"
                  class="q-mr-xs"
                />
                Máximo consecutivos: {{ maxConsecutivosLabel }} (solicitas
                {{ diasHabiles }} hábiles)
              </div>
              <div class="rk-check" v-if="vacacionesAplica">
                <q-icon
                  :name="saldoOk ? 'check_circle' : 'error'"
                  :color="saldoOk ? 'positive' : 'negative'"
                  class="q-mr-xs"
                />
                Saldo suficiente: {{ saldoVacacionesLabel }} → quedarán
                {{ saldoRestanteLabel }}
              </div>

              <q-separator class="q-my-sm" />
              <div class="text-caption text-grey-7">
                Retorno: <b>{{ retornoLabel }}</b>
              </div>
            </q-card>
          </div>
        </div>

        <div class="row justify-between q-mt-md">
          <q-btn flat label="Atrás" @click="goNext(2)" />
          <q-btn
            color="primary"
            label="Revisar y Enviar"
            :disable="!readyToReview"
            @click="goNext(4)"
          />
        </div>
      </q-step>

      <!-- PASO 4: REVISIÓN -->
      <q-step :name="4" title="Revisión" icon="visibility">
        <q-card flat bordered class="q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <div class="text-subtitle2 q-mb-sm">Resumen final</div>
              <q-list dense separator>
                <q-item>
                  <q-item-section avatar
                    ><q-icon name="category"
                  /></q-item-section>
                  <q-item-section>Tipo</q-item-section>
                  <q-item-section side>{{ tipoLabel }}</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar
                    ><q-icon name="date_range"
                  /></q-item-section>
                  <q-item-section>Rango</q-item-section>
                  <q-item-section side>{{ rangeLabel || "—" }}</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar
                    ><q-icon name="work_history"
                  /></q-item-section>
                  <q-item-section>Días hábiles</q-item-section>
                  <q-item-section side>{{ diasHabiles }}</q-item-section>
                </q-item>
                <q-item v-if="form.medioDia">
                  <q-item-section avatar
                    ><q-icon name="wb_twilight"
                  /></q-item-section>
                  <q-item-section>Medio día</q-item-section>
                  <q-item-section side>{{
                    form.medioDiaPeriodo.toUpperCase()
                  }}</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar><q-icon name="redo" /></q-item-section>
                  <q-item-section>Retorno</q-item-section>
                  <q-item-section side>{{ retornoLabel }}</q-item-section>
                </q-item>
                <q-item v-if="vacacionesAplica">
                  <q-item-section avatar
                    ><q-icon name="account_balance_wallet"
                  /></q-item-section>
                  <q-item-section>Saldo</q-item-section>
                  <q-item-section side
                    >{{ saldoVacacionesLabel }} →
                    {{ saldoRestanteLabel }}</q-item-section
                  >
                </q-item>
                <q-item>
                  <q-item-section avatar
                    ><q-icon name="notes"
                  /></q-item-section>
                  <q-item-section>Comentario</q-item-section>
                  <q-item-section side>{{
                    form.comentario || "—"
                  }}</q-item-section>
                </q-item>
              </q-list>
            </div>

            <div class="col-12 col-md-4">
              <q-banner
                v-if="disableReasons.length"
                class="bg-red-1 text-red-10"
                rounded
              >
                <div class="text-subtitle2 q-mb-xs">No puedes enviar aún</div>
                <ul class="q-pl-md q-mt-none q-mb-none">
                  <li v-for="(r, i) in disableReasons" :key="i">{{ r }}</li>
                </ul>
              </q-banner>

              <q-banner v-else class="bg-green-1 text-green-10" rounded>
                <q-icon name="check_circle" class="q-mr-xs" /> Todo listo para
                enviar.
              </q-banner>

              <div class="text-caption text-grey-7 q-mt-sm">
                Archivos adjuntos: {{ archivos?.length || 0 }}
              </div>
            </div>
          </div>
        </q-card>

        <div class="row justify-between q-mt-md">
          <q-btn flat label="Atrás" @click="goNext(3)" />
          <q-btn
            color="primary"
            label="Enviar Solicitud"
            icon="send"
            no-caps
            unelevated
            :disable="disableSubmit"
            :loading="sending"
            @click="enviar"
          />
        </div>
      </q-step>
    </q-stepper>

    <!-- DIALOG AYUDA -->
    <q-dialog v-model="helpOpen">
      <q-card style="max-width: 720px">
        <q-card-section>
          <div class="text-h6">¿Cómo hago mi solicitud?</div>
        </q-card-section>
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
            Consejo: usa los <i>presets</i> de un clic (Mañana AM/PM, Próxima
            semana).
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
        </q-card-actions>
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

/* Catálogos (ajusta a tu backend si difiere) */
const tipos = [
  { label: "Vacaciones", value: "vacaciones" },
  { label: "Día Compensatorio", value: "compensatorio" },
  { label: "Permiso Personal", value: "permiso" },
  { label: "Licencia Médica", value: "licencia" },
];
const medioDiaOpts = [
  { label: "AM (mañana)", value: "am" },
  { label: "PM (tarde)", value: "pm" },
];

/* Políticas */
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

/* Store-derived */
const userId = computed(() => auth?.user?.id || auth?.user?._id || null);
const companyId = computed(
  () => auth?.user?.company?._id || auth?.user?.company || null
);

/* Balances y feriados */
const saldoVacaciones = ref(null);
const saldoAdmin = ref(null);
const feriados = ref([]); // ISO 'YYYY-MM-DD'
const feriadosSet = computed(() => new Set(feriados.value));
const feriadosShort = computed(() => {
  if (!feriados.value?.length) return "sin datos";
  return (
    feriados.value.slice(0, 5).join(", ") +
    (feriados.value.length > 5 ? "…" : "")
  );
});
const afectaSaldoTipo = computed(() => form.value.tipo === "vacaciones");

/* Progreso vacaciones */
const vacProgress = computed(() => {
  const s = Number(saldoVacaciones.value ?? 0);
  let color = "positive";
  if (s <= 2) color = "negative";
  else if (s <= 5) color = "warning";
  const label =
    s <= 2 ? "Bajo saldo" : s <= 5 ? "Saldo medio" : "Saldo saludable";
  const value = Math.min(1, Math.max(0, s / 15)); // referencia 15 días
  return { color, label, value };
});

/* CALENDARIO */
const dateRange = ref({ from: "", to: "" });
const rangeLabel = computed(() => {
  if (!form.value.fechaInicio || !form.value.fechaFin) return "";
  return `${form.value.fechaInicio} → ${form.value.fechaFin}`;
});
function dateSelectable() {
  return true;
}
function applyRange() {
  form.value.fechaInicio = dateRange.value.from || "";
  form.value.fechaFin = dateRange.value.to || dateRange.value.from || "";
}

/* VALIDACIONES RANGO / CÁLCULOS */
const rangoValido = computed(() => {
  if (!form.value.fechaInicio || !form.value.fechaFin) return true;
  return new Date(form.value.fechaInicio) <= new Date(form.value.fechaFin);
});

const diasHabiles = computed(() => {
  const s = form.value.fechaInicio;
  const e = form.value.fechaFin;
  if (!s || !e) return 0;
  const start = new Date(s + "T00:00:00");
  const end = new Date(e + "T00:00:00");
  if (start > end) return 0;
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    const iso = toISO(d);
    if (dow === 0 || dow === 6) continue;
    if (feriadosSet.value.has(iso)) continue;
    count++;
  }
  if (form.value.medioDia && count === 1) return 0.5;
  return count;
});

/* Retorno al trabajo */
const retorno = computed(() => {
  const { fechaInicio, fechaFin, medioDia, medioDiaPeriodo } = form.value;
  if (!fechaInicio || !fechaFin) return null;

  const nextBiz = (iso) => {
    let d = new Date(iso + "T00:00:00");
    do {
      d.setDate(d.getDate() + 1);
    } while (isWeekend(d) || feriadosSet.value.has(toISO(d)));
    return toISO(d);
  };
  const sameBiz = (iso) => {
    let d = new Date(iso + "T00:00:00");
    while (isWeekend(d) || feriadosSet.value.has(toISO(d)))
      d.setDate(d.getDate() + 1);
    return toISO(d);
  };

  if (!medioDia) {
    const ret = nextBiz(fechaFin);
    return { date: ret, time: "09:00", label: `${fmt(ret)} 09:00` };
  }
  if (medioDiaPeriodo === "am") {
    const ret = sameBiz(fechaFin);
    return { date: ret, time: "14:00", label: `${fmt(ret)} 14:00` };
  } else {
    const ret = nextBiz(fechaFin);
    return { date: ret, time: "09:00", label: `${fmt(ret)} 09:00` };
  }
});
const retornoLabel = computed(() => retorno.value?.label || "—");

/* Políticas */
const faltanHabiles = computed(() =>
  businessDiff(toISO(new Date()), form.value.fechaInicio, feriadosSet.value)
);
const avisoOk = computed(() =>
  form.value.fechaInicio ? faltanHabiles.value >= avisoMinDias : true
);
const avisoMinLabel = computed(() => `${avisoMinDias} día hábil`);
const maxOk = computed(() => diasHabiles.value <= maxDiasConsecutivos);
const maxConsecutivosLabel = computed(() => `${maxDiasConsecutivos} hábiles`);

/* SALDOS aplicado */
const vacacionesAplica = computed(() => form.value.tipo === "vacaciones");
const saldoVacacionesLabel = computed(() =>
  saldoVacaciones.value == null ? "—" : `${saldoVacaciones.value} día(s)`
);
const saldoRestante = computed(() => {
  if (!vacacionesAplica.value) return null;
  if (saldoVacaciones.value == null) return null;
  const resto = Number(saldoVacaciones.value) - Number(diasHabiles.value || 0);
  return isNaN(resto) ? null : resto;
});
const saldoRestanteLabel = computed(() => {
  if (saldoRestante.value == null) return "—";
  return `${saldoRestante.value} día(s)`;
});
const saldoOk = computed(
  () =>
    !vacacionesAplica.value ||
    saldoVacaciones.value == null ||
    diasHabiles.value <= saldoVacaciones.value
);

/* OVERLAPS */
const overlapAlert = computed(() => {
  if (!form.value.fechaInicio || !form.value.fechaFin) return false;
  const list = requests.myRequests || [];
  const s = new Date(form.value.fechaInicio);
  const e = new Date(form.value.fechaFin);
  return list.some((r) => {
    const rs = new Date(r.startDate);
    const re = new Date(r.endDate || r.startDate);
    return !(re < s || rs > e);
  });
});

/* Habilitación por paso */
const commentValid = computed(() => true);
const canGoStep3 = computed(
  () => rangoValido.value && diasHabiles.value > 0 && !overlapAlert.value
);
const readyToReview = computed(
  () =>
    !!form.value.tipo &&
    rangoValido.value &&
    diasHabiles.value > 0 &&
    commentValid.value
);

/* Motivos de bloqueo para el envío */
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
    reasons.push(`No cumples aviso mínimo (${avisoMinLabel.value}).`);
  if (!maxOk.value)
    reasons.push(
      `Excedes el máximo de días consecutivos (${maxConsecutivosLabel.value}).`
    );
  if (vacacionesAplica.value && saldoVacaciones.value != null && !saldoOk.value)
    reasons.push("Saldo de vacaciones insuficiente.");
  return reasons;
});
const disableSubmit = computed(() => disableReasons.value.length > 0);

/* Hints tipo */
const tipoLabel = computed(
  () => tipos.find((t) => t.value === form.value.tipo)?.label || "—"
);
const tipoHint = computed(() => {
  if (!form.value.tipo) return "Elige un tipo de solicitud.";
  if (form.value.tipo === "vacaciones")
    return "Las vacaciones descuentan de tu saldo disponible.";
  if (form.value.tipo === "compensatorio")
    return "Día compensatorio según horas extra aprobadas.";
  if (form.value.tipo === "permiso")
    return "Permiso personal (no necesariamente afecta saldo).";
  if (form.value.tipo === "licencia")
    return "Licencia médica (adjunta respaldo si es requerido).";
  return "";
});
const bannerTipoClass = computed(() =>
  form.value.tipo === "vacaciones"
    ? "bg-orange-1 text-orange-9"
    : "bg-blue-1 text-blue-10"
);

/* Navegación stepper */
function goNext(n) {
  step.value = n;
}
function onTipoChange() {
  /* hook: reset si quieres */
}

/* Presets */
function presetTomorrowAM() {
  const t = nextBusinessISO(toISO(new Date()), feriadosSet.value);
  form.value.fechaInicio = t;
  form.value.fechaFin = t;
  form.value.medioDia = true;
  form.value.medioDiaPeriodo = "am";
  dateRange.value = { from: t, to: t };
  step.value = 2;
}
function presetTomorrowPM() {
  const t = nextBusinessISO(toISO(new Date()), feriadosSet.value);
  form.value.fechaInicio = t;
  form.value.fechaFin = t;
  form.value.medioDia = true;
  form.value.medioDiaPeriodo = "pm";
  dateRange.value = { from: t, to: t };
  step.value = 2;
}
function presetNextWeek() {
  const d = new Date();
  const day = d.getDay();
  const diffToMon = (8 - day) % 7 || 7;
  d.setDate(d.getDate() + diffToMon);
  const monday = toISO(d);
  const friday = toISO(addDaysSkipping(monday, 4, feriadosSet.value));
  form.value.fechaInicio = monday;
  form.value.fechaFin = friday;
  form.value.medioDia = false;
  dateRange.value = { from: monday, to: friday };
  step.value = 2;
}

/* Envío */
const sending = ref(false);
async function enviar() {
  if (disableSubmit.value) {
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
      await requests.createRequest(fd); // tu store debe admitir multipart
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
    // if (!requests.myRequests?.length && requests.fetchMyRequests) {
    //   await requests.fetchMyRequests();
    // }
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
      // } else if (requests.fetchHolidays) {
      //   await requests.fetchHolidays();
      //   feriados.value = (requests.holidays || [])
      //     .map((d) => d.date || d)
      //     .filter(Boolean);
    } else {
      feriados.value = [];
    }
    debugger;
    // Saldos
    if (requests.fetchBalances) {
      const balance = await requests.fetchBalances();
      debugger;
      saldoVacaciones.value = Number(balance?.VACATION);
      saldoAdmin.value = Number(balance?.ADMIN_DAY);
    } else {
      saldoVacaciones.value = null;
      saldoAdmin.value = null;
    }
  } catch {
    // deja los valores como estén
  } finally {
    loadingBalances.value = false;
  }
}

/* ===== Helpers fechas ===== */
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function fmt(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function isWeekend(d) {
  const g = d.getDay();
  return g === 0 || g === 6;
}
function addDaysSkipping(iso, add, ferSet) {
  let d = new Date(iso + "T00:00:00");
  let moved = 0;
  while (moved < add) {
    d.setDate(d.getDate() + 1);
    if (isWeekend(d) || ferSet?.has(toISO(d))) continue;
    moved++;
  }
  return d;
}
function nextBusinessISO(isoStart, ferSet) {
  let d = new Date(isoStart + "T00:00:00");
  do {
    d.setDate(d.getDate() + 1);
  } while (isWeekend(d) || ferSet?.has(toISO(d)));
  return toISO(d);
}
function businessDiff(isoFrom, isoTo, ferSet) {
  // días hábiles entre from (exclusivo) y to (inclusive)
  const s = new Date(isoFrom + "T00:00:00");
  const e = new Date(isoTo + "T00:00:00");
  if (e <= s) return 0;
  let c = 0;
  for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    d.setDate(d.getDate() + 1);
    if (isWeekend(d) || ferSet?.has(toISO(d))) continue;
    c++;
  }
  return c;
}
</script>

<style scoped>
.kpi-card {
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

.rk-stepper :deep(.q-stepper__tab) {
  border-radius: 10px;
}

.rk-check {
  display: flex;
  align-items: center;
  font-size: 13px;
  margin: 4px 0;
}

.q-banner {
  border-radius: 10px;
}
</style>
