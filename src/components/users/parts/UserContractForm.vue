<template>
  <div class="row q-col-gutter-md rk-contract-grid">
    <div class="col-12">
      <section class="rk-form-section">
        <div class="rk-form-section__header">
          <div class="rk-form-section__icon">
            <q-icon name="work_history" />
          </div>
          <div>
            <div class="rk-form-section__title">Condiciones laborales</div>
            <div class="rk-form-section__subtitle">Base contractual del empleado y fecha efectiva de ingreso.</div>
          </div>
        </div>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-lg-3">
            <q-input
              v-model="local.baseSalary"
              label="Sueldo base (CLP)"
              dense
              outlined
              class="rk-field"
              :rules="[reqNumber]"
              @update:model-value="(v) => (local.baseSalary = normalizeMoney(v))"
              :hint="formatMoney(local.baseSalary)"
            >
              <template #prepend><q-icon name="attach_money" /></template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <q-select
              v-model="local.contractType"
              label="Tipo contrato"
              :options="contractTypes"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
              :rules="[req]"
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <q-select
              v-model="local.jornada"
              label="Jornada"
              :options="jornadas"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
              :rules="[req]"
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <q-input
              v-model="local.startDate"
              label="Fecha ingreso"
              dense
              outlined
              class="rk-field"
              readonly
              :rules="[req, fechaPasada]"
              placeholder="YYYY-MM-DD"
            >
              <template #prepend><q-icon name="event" /></template>
              <template #append>
                <q-icon name="calendar_month" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="local.startDate"
                      mask="YYYY-MM-DD"
                      minimal
                      color="primary"
                    >
                      <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                        <q-btn v-close-popup flat label="Cerrar" color="primary" />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Fecha de término — solo si plazo fijo u obra/faena -->
          <div v-if="requiresEndDate" class="col-12 col-sm-6 col-lg-3">
            <q-input
              v-model="local.endDate"
              label="Fecha de término *"
              dense outlined readonly
              class="rk-field"
              :rules="endDateRules"
              placeholder="YYYY-MM-DD"
              hint="Obligatoria para plazo fijo / obra-faena"
            >
              <template #prepend><q-icon name="event_busy" /></template>
              <template #append>
                <q-icon name="calendar_month" class="cursor-pointer">
                  <q-popup-proxy cover>
                    <q-date v-model="local.endDate" mask="YYYY-MM-DD" minimal color="primary" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6 col-lg-3">
            <q-select
              v-model="local.jornadaArt"
              :options="jornadaArtOptions"
              label="Modalidad de jornada"
              dense outlined
              emit-value map-options
              class="rk-field"
              hint="Art. 22 / Art. 38 Cód. del Trabajo"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- ===== Cargo y lugar de trabajo (Art. 10 N°2 y N°3) ===== -->
    <div class="col-12">
      <section class="rk-form-section">
        <div class="rk-form-section__header">
          <div class="rk-form-section__icon">
            <q-icon name="work_outline" />
          </div>
          <div>
            <div class="rk-form-section__title">Cargo y lugar de trabajo</div>
            <div class="rk-form-section__subtitle">
              Art. 10 N°2 y N°3 — debe quedar literal en el contrato individual.
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="local.cargo"
              label="Cargo *"
              dense outlined clearable
              class="rk-field"
              placeholder="Ej: Asistente administrativo"
              :rules="[req]"
            >
              <template #prepend><q-icon name="badge" /></template>
            </q-input>
          </div>

          <div class="col-12">
            <q-input
              v-model="local.funciones"
              type="textarea"
              label="Funciones específicas *"
              dense outlined
              class="rk-field"
              autogrow
              rows="2"
              placeholder="Describe las tareas principales que realizará el trabajador"
              :rules="[req]"
              hint="Sin esto el contrato puede ser objetado por la DT"
            >
              <template #prepend><q-icon name="assignment" /></template>
            </q-input>
          </div>

          <div class="col-12">
            <q-input
              v-model="local.lugarTrabajo.line1"
              label="Lugar de trabajo / faena *"
              dense outlined clearable
              class="rk-field"
              placeholder="Calle y número de la sede donde prestará servicios"
              :rules="[req]"
              hint="Distinto del domicilio del trabajador"
            >
              <template #prepend><q-icon name="apartment" /></template>
            </q-input>
          </div>

          <div class="col-12 col-sm-4">
            <q-input
              v-model="local.lugarTrabajo.commune"
              label="Comuna"
              dense outlined clearable
              class="rk-field"
            >
              <template #prepend><q-icon name="location_city" /></template>
            </q-input>
          </div>

          <div class="col-12 col-sm-4">
            <q-input
              v-model="local.lugarTrabajo.city"
              label="Ciudad"
              dense outlined clearable
              class="rk-field"
            >
              <template #prepend><q-icon name="map" /></template>
            </q-input>
          </div>

          <div class="col-12 col-sm-4">
            <q-input
              v-model="local.lugarTrabajo.region"
              label="Región"
              dense outlined clearable
              class="rk-field"
            >
              <template #prepend><q-icon name="public" /></template>
            </q-input>
          </div>
        </div>
      </section>
    </div>

    <!-- ✅ AFP dinámico (entityId) -->
    <div class="col-12">
      <section class="rk-form-section">
        <div class="rk-form-section__header">
          <div class="rk-form-section__icon rk-form-section__icon--mint">
            <q-icon name="health_and_safety" />
          </div>
          <div>
            <div class="rk-form-section__title">Previsión y salud</div>
            <div class="rk-form-section__subtitle">Configuración previsional para cálculos y descuentos del trabajador.</div>
          </div>
        </div>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-lg-4">
            <q-select
              v-model="local.afpEntityId"
              label="AFP"
              :options="afpSelectOptions"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
              option-value="value"
              option-label="label"
              :rules="[req]"
              :loading="loadingCatalog"
              :disable="loadingCatalog"
            >
              <template #no-option>
                <div class="q-pa-md text-center">
                  <q-icon name="account_tree" size="32px" class="q-mb-sm" />
                  <div class="text-weight-bold">No hay AFP disponibles</div>
                  <div class="text-caption">Configura el catálogo global de nómina</div>
                </div>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <q-select
              v-model="local.healthEntityId"
              label="Salud"
              :options="healthSelectOptions"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
              option-value="value"
              option-label="label"
              :rules="[req]"
              :loading="loadingCatalog"
              :disable="loadingCatalog"
            >
              <template #no-option>
                <div class="q-pa-md text-center">
                  <q-icon name="medical_services" size="32px" class="q-mb-sm" />
                  <div class="text-weight-bold">No hay opciones de salud</div>
                  <div class="text-caption">Configura el catálogo global de nómina</div>
                </div>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <q-input
              v-model="local.apv"
              label="APV (CLP)"
              dense
              outlined
              class="rk-field"
              @update:model-value="(v) => (local.apv = normalizeMoney(v))"
              :hint="formatMoney(local.apv)"
            />
          </div>

          <!-- ✅ Campos extra SOLO si el meta lo requiere -->
          <div class="col-12 col-sm-6 col-lg-4" v-if="requiresUf">
            <q-input
              v-model="local.isaprePlan"
              label="Plan (Isapre / Salud)"
              dense
              outlined
              class="rk-field"
              :rules="[req]"
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-4" v-if="requiresUf">
            <q-input
              v-model="local.isapreUf"
              label="Plan (UF)"
              dense
              outlined
              class="rk-field"
              :rules="[reqNumber]"
              @update:model-value="(v) => (local.isapreUf = normalizeDecimal(v))"
            />
          </div>

        </div>
      </section>
    </div>

    <!-- ===== Cargas familiares ===== -->
    <div class="col-12">
      <section class="rk-form-section">
        <div class="rk-form-section__header">
          <div class="rk-form-section__icon rk-form-section__icon--mint">
            <q-icon name="family_restroom" />
          </div>
          <div>
            <div class="rk-form-section__title">Cargas familiares</div>
            <div class="rk-form-section__subtitle">
              Causantes acreditados ante la Caja de Compensación o IPS. El tramo se calcula automáticamente.
            </div>
          </div>
        </div>

        <UserCargasForm
          v-model="local.cargasFamiliares"
          :can-upload-doc="canUploadDoc"
          @upload-doc="(e) => emit('upload-cargaDoc', e)"
        />
      </section>
    </div>

    <div class="col-12 col-sm-8">
      <div class="rk-tax-box">
        <div class="rk-tax-box__head">
          <q-icon name="request_quote" size="18px" />
          <div>
            <div class="rk-tax-box__title">Impuesto a la renta</div>
            <div class="rk-tax-box__subtitle">
              Marca si este trabajador debe participar en el cálculo del impuesto único cuando corresponda.
            </div>
          </div>
        </div>

        <div class="rk-tax-box__controls">
          <q-toggle
            v-model="local.incomeTaxApplies"
            color="primary"
            label="Empleado afecto a impuesto"
          />

          <q-input
            v-model="local.incomeTaxNote"
            dense
            outlined
            label="Observación tributaria"
            placeholder="Ej: exento por régimen especial"
            :disable="local.incomeTaxApplies"
          />
        </div>
      </div>
    </div>

    <div class="col-12">
      <section class="rk-form-section">
        <div class="rk-form-section__header">
          <div class="rk-form-section__icon rk-form-section__icon--gold">
            <q-icon name="account_balance_wallet" />
          </div>
          <div>
            <div class="rk-form-section__title">Pago y abono</div>
            <div class="rk-form-section__subtitle">Datos bancarios para depositar remuneraciones al trabajador.</div>
          </div>
        </div>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-lg-4">
            <q-select
              v-model="local.banco"
              label="Banco"
              :options="bancos"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <q-select
              v-model="local.tipoCuenta"
              label="Tipo de cuenta"
              :options="tiposCuenta"
              dense
              outlined
              class="rk-field"
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-lg-4">
            <q-input v-model="local.numeroCuenta" label="N° de cuenta" dense outlined class="rk-field" />
          </div>
        </div>
      </section>
    </div>

    <div class="col-12">
      <q-expansion-item
        class="rk-extra-box"
        dense
        expand-separator
        icon="paid"
        label="Haberes/Descuentos frecuentes (opcional)"
      >
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-6 col-sm-3">
            <q-input
              v-model="local.gratificacion"
              label="Gratificación"
              dense
              outlined
              @update:model-value="(v) => (local.gratificacion = normalizeMoney(v))"
              :hint="formatMoney(local.gratificacion)"
            />
          </div>
          <div class="col-6 col-sm-3">
            <q-input
              v-model="local.bonoColacion"
              label="Colación"
              dense
              outlined
              @update:model-value="(v) => (local.bonoColacion = normalizeMoney(v))"
              :hint="formatMoney(local.bonoColacion)"
            />
          </div>
          <div class="col-6 col-sm-3">
            <q-input
              v-model="local.bonoMovilizacion"
              label="Movilización"
              dense
              outlined
              @update:model-value="(v) => (local.bonoMovilizacion = normalizeMoney(v))"
              :hint="formatMoney(local.bonoMovilizacion)"
            />
          </div>
          <div class="col-6 col-sm-3">
            <q-input
              v-model="local.descuentoPrestamo"
              label="Desc. préstamo"
              dense
              outlined
              @update:model-value="(v) => (local.descuentoPrestamo = normalizeMoney(v))"
              :hint="formatMoney(local.descuentoPrestamo)"
            />
          </div>
        </div>
      </q-expansion-item>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed, nextTick } from "vue";
import { normalizeMoney, normalizeDecimal, formatMoney } from "@/utils/format";
import { req, reqNumber, fechaPasada } from "@/utils/validators";
import UserCargasForm from "./UserCargasForm.vue";

const props = defineProps({
  modelValue: { type: Object, required: true },

  // ✅ dinámicos (vienen del diálogo)
  loadingCatalog: { type: Boolean, default: false },
  afpOptions: { type: Array, default: () => [] },     // [{_id, displayName, slug, meta}]
  healthOptions: { type: Array, default: () => [] },  // [{_id, displayName, slug, meta}]
  healthSelectedMeta: { type: Object, default: null },// meta del seleccionado (requiresUf, etc.)

  // habilita la subida de PDF de cargas (sólo en modo edición)
  canUploadDoc: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "upload-cargaDoc"]);

/* ✅ Listas “estables” (si mañana quieres, las haces dinámicas igual) */
const contractTypes = [
  { label: "Indefinido", value: "indefinido" },
  { label: "Plazo fijo", value: "plazo_fijo" },
  { label: "Part-time", value: "part_time" },
  { label: "Honorarios", value: "honorarios" },
  { label: "Obra o faena", value: "obra_faena" },
];

const jornadas = [
  { label: "Completa", value: "completa" },
  { label: "Parcial", value: "parcial" },
  { label: "Turnos", value: "turnos" },
];

const jornadaArtOptions = [
  { label: "Normal (jornada ordinaria)", value: "normal" },
  { label: "Art. 22 (no fiscalizable)", value: "art22" },
  { label: "Art. 38 (excepciones turno)", value: "art38" },
];

const requiresEndDate = computed(() =>
  ['plazo_fijo', 'obra_faena'].includes(String(local.contractType || '').toLowerCase())
);

const bancos = [
  "BancoEstado",
  "Banco de Chile",
  "Banco BCI",
  "Banco Itaú",
  "Scotiabank",
  "Santander",
  "Falabella",
  "Security",
  "Ripley",
  "Consorcio",
].map((b) => ({ label: b, value: b }));

const tiposCuenta = [
  { label: "Cuenta corriente", value: "corriente" },
  { label: "Cuenta vista", value: "vista" },
  { label: "Cuenta Rut", value: "rut" },
  { label: "Ahorro", value: "ahorro" },
];

/* ✅ opciones para q-select (IDs) */
const afpSelectOptions = computed(() =>
  (props.afpOptions || [])
    .filter(x => x && x._id && x.displayName)
    .map(x => ({ label: x.displayName, value: x._id }))
);

const healthSelectOptions = computed(() =>
  (props.healthOptions || [])
    .filter(x => x && x._id && x.displayName)
    .map(x => ({ label: x.displayName, value: x._id }))
);

const requiresUf = computed(() => !!props.healthSelectedMeta?.requiresUf);

/* ✅ local model — normaliza cargasFamiliares a array y lugarTrabajo a objeto */
function normalizeIncoming(v = {}) {
  const out = { ...v }
  if (!Array.isArray(out.cargasFamiliares)) out.cargasFamiliares = []
  out.lugarTrabajo = {
    line1: '', commune: '', city: '', region: '',
    ...(v?.lugarTrabajo || {}),
  }
  out.jornadaArt = out.jornadaArt || 'normal'
  out.endDate = out.endDate ? String(out.endDate).slice(0, 10) : ''
  return out
}
const local = reactive(normalizeIncoming(props.modelValue));

// Evita el bucle infinito de two-way binding: cuando nosotros emitimos un
// objeto nuevo, el padre re-asigna props.modelValue y este watch volvería a
// pisar `local` (con referencias nuevas de normalizeIncoming), re-disparando
// el emit en cadena. Con este guard ignoramos nuestro propio eco.
let isEmitting = false;

watch(
  () => props.modelValue,
  (v) => {
    if (isEmitting) return;
    Object.assign(local, normalizeIncoming(v));
  }
);

/* Reglas para fecha término */
const endDateRules = computed(() => {
  if (!requiresEndDate.value) return []
  return [
    (v) => !!v || 'Fecha de término obligatoria para este tipo de contrato',
    (v) => {
      if (!v || !local.startDate) return true
      return new Date(v) > new Date(local.startDate) || 'Debe ser posterior a la fecha de ingreso'
    },
  ]
})

watch(
  local,
  (v) => {
    isEmitting = true;
    emit("update:modelValue", { ...v });
    // Se libera tras el flush actual, una vez que el watch de props.modelValue
    // (disparado por nuestro propio emit) ya pasó y fue ignorado.
    nextTick(() => { isEmitting = false; });
  },
  { deep: true }
);

/* ✅ limpieza automática: si salud no requiere UF, borra campos */
watch(
  () => requiresUf.value,
  (need) => {
    if (!need) {
      local.isaprePlan = "";
      local.isapreUf = 0;
    }
  },
  { immediate: true }
);

watch(
  () => local.incomeTaxApplies,
  (enabled) => {
    if (enabled) local.incomeTaxNote = "";
  },
  { immediate: true }
);
</script>

<style scoped>
/* ══════════════════════════════════════════════════
   TOKENS — heredan paleta del modal padre
══════════════════════════════════════════════════ */
.rk-contract-grid {
  --rk-bg:           #ffffff;
  --rk-surface:      #f7f8fc;
  --rk-surface-2:    #eef0f6;
  --rk-border:       rgba(15, 17, 23, 0.08);
  --rk-border-2:     rgba(15, 17, 23, 0.14);
  --rk-text:         #0f1117;
  --rk-text-2:       #5a6482;
  --rk-text-3:       #9aa1b9;
  --rk-accent:       #06b6d4;
  --rk-accent-soft:  rgba(6, 182, 212, 0.10);
  align-items: start;
  color: var(--rk-text);
}

.body--dark .rk-contract-grid {
  --rk-bg:           #141720;
  --rk-surface:      #1a1e2a;
  --rk-surface-2:    #232838;
  --rk-border:       rgba(255, 255, 255, 0.08);
  --rk-border-2:     rgba(255, 255, 255, 0.16);
  --rk-text:         #e8eaf2;
  --rk-text-2:       #8b92ad;
  --rk-text-3:       #555d78;
  --rk-accent-soft:  rgba(6, 182, 212, 0.18);
}

/* ══════════════════════════════════════════════════
   SECTIONS — sobrias, sin gradientes
══════════════════════════════════════════════════ */
.rk-form-section {
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  padding: 14px 16px;
  background: var(--rk-surface);
  transition: border-color 0.15s, background 0.15s;
}
.rk-form-section:hover {
  border-color: var(--rk-border-2);
}

.rk-form-section__header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.rk-form-section__icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--rk-accent);
  background: var(--rk-accent-soft);
  font-size: 16px;
}
/* Las variantes mint/gold ya no hacen falta, pero las dejamos
   neutralizadas por si quedan referencias en el template. */
.rk-form-section__icon--mint,
.rk-form-section__icon--gold {
  color: var(--rk-accent);
  background: var(--rk-accent-soft);
}

.rk-form-section__title {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--rk-text);
  letter-spacing: -0.1px;
}

.rk-form-section__subtitle {
  margin-top: 1px;
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--rk-text-2);
  font-weight: 500;
}

/* ══════════════════════════════════════════════════
   FIELDS — alineados con el sistema del modal
══════════════════════════════════════════════════ */
.rk-field :deep(.q-field__control) {
  min-height: 40px;
  border-radius: 9px;
  background: var(--rk-bg);
}
.rk-field :deep(.q-field__control::before) {
  border-color: var(--rk-border);
}
.rk-field:hover :deep(.q-field__control::before) {
  border-color: var(--rk-border-2);
}
.rk-field :deep(.q-field--focused .q-field__control::after) {
  border-color: var(--rk-accent);
  border-width: 1.5px;
}
.rk-field :deep(.q-field__native),
.rk-field :deep(.q-field__input) {
  font-weight: 500;
  color: var(--rk-text);
  font-size: 13px;
}
.rk-field :deep(.q-field__label) {
  color: var(--rk-text-2);
  font-weight: 500;
  font-size: 12.5px;
}
.rk-field :deep(.q-field__prepend),
.rk-field :deep(.q-field__append) {
  color: var(--rk-text-3);
}
.rk-field :deep(.q-field--focused .q-field__prepend),
.rk-field :deep(.q-field--focused .q-field__append) {
  color: var(--rk-accent);
}
.rk-field :deep(.q-field__messages) { font-size: 10.5px; }
.rk-field :deep(.q-field__hint) {
  color: var(--rk-text-3);
  font-size: 10.5px;
}

/* ══════════════════════════════════════════════════
   TAX BOX — destacado pero neutro
══════════════════════════════════════════════════ */
.rk-tax-box {
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  background: var(--rk-surface);
  padding: 14px 16px;
}

.rk-tax-box__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  color: var(--rk-text);
}
.rk-tax-box__head .q-icon {
  color: var(--rk-accent);
  margin-top: 1px;
}

.rk-tax-box__title {
  font-weight: 700;
  line-height: 1.25;
  font-size: 13px;
  color: var(--rk-text);
}

.rk-tax-box__subtitle {
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--rk-text-2);
  margin-top: 1px;
  font-weight: 500;
}

.rk-tax-box__controls {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(220px, 1fr);
  gap: 10px 12px;
  align-items: center;
}
.rk-tax-box__controls :deep(.q-toggle__label) {
  font-size: 12.5px;
  color: var(--rk-text);
  font-weight: 500;
}

/* ══════════════════════════════════════════════════
   EXTRA BOX (haberes/descuentos)
══════════════════════════════════════════════════ */
.rk-extra-box {
  border-radius: 12px;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  padding: 4px 12px;
}
.rk-extra-box :deep(.q-item) {
  padding-left: 4px;
  padding-right: 4px;
  min-height: 40px;
  color: var(--rk-text);
}
.rk-extra-box :deep(.q-item__label) {
  font-size: 12.5px;
  font-weight: 600;
}
.rk-extra-box :deep(.q-icon) {
  color: var(--rk-accent);
}

@media (max-width: 768px) {
  .rk-tax-box__controls {
    grid-template-columns: 1fr;
  }
  .rk-form-section {
    padding: 12px 14px;
  }
}
</style>
