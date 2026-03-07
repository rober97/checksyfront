<template>
  <div class="rk-wrap">
    <!-- Header -->
    <div class="rk-top">
      <div class="rk-title">
        <q-icon name="receipt_long" />
        <div>
          <div class="rk-h1">Conceptos de liquidación</div>
          <div class="rk-h2">
            Define qué se paga y qué se descuenta en las liquidaciones de la empresa.
          </div>
        </div>
      </div>

      <div class="rk-state" :class="store.validation?.ok ? 'ok' : 'warn'">
        <q-icon :name="store.validation?.ok ? 'verified' : 'report_problem'" />
        <span>{{ store.validation?.ok ? "Configuración lista" : "Faltan mínimos" }}</span>
      </div>
    </div>

    <div class="rk-note">
      <q-icon name="info" />
      <div>
        Esto es <b>por empresa</b>. Si faltan conceptos mínimos, <b>no podrás emitir liquidaciones</b>.
      </div>
    </div>

    <!-- Error backend -->
    <q-banner v-if="store.error" class="rk-banner rk-banner--error" rounded>
      <template #avatar><q-icon name="warning" /></template>
      <div>
        <b>Ocurrió un problema</b>
        <div class="rk-muted">{{ store.error }}</div>
      </div>
    </q-banner>

    <!-- Missing config (human friendly) -->
    <q-banner v-if="missingListPretty.length" class="rk-banner rk-banner--warn" rounded>
      <template #avatar><q-icon name="report" /></template>
      <div>
        <b>Te falta configuración mínima</b>
        <div class="rk-muted">Agrega o activa lo siguiente:</div>
        <ul class="rk-missing">
          <li v-for="m in missingListPretty" :key="m">{{ m }}</li>
        </ul>
      </div>
    </q-banner>

    <!-- Stepper -->
    <q-stepper v-model="step" flat bordered animated class="rk-stepper">
      <q-step :name="1" title="Elegir una plantilla" icon="layers" :done="step > 1">
        <div class="rk-grid">
          <div class="rk-card">
            <div class="rk-card-title">
              <q-icon name="file_download" />
              <span>Aplicar plantilla</span>
              <q-space />
              <q-btn flat dense icon="help" @click="showHelp('plantilla')" />
            </div>

            <div class="rk-form">
              <q-select
                v-model="templateId"
                :options="templateOptions"
                outlined
                dense
                :loading="store.loading"
                label="Plantilla"
                hint="Recomendado: plantilla con mínimos legales"
                emit-value
                map-options
              />

              <q-select
                v-model="applyMode"
                :options="applyModeOptsEs"
                outlined
                dense
                label="Cómo aplicar"
                hint="Elige si quieres mantener tus conceptos o reemplazarlos"
                emit-value
                map-options
              />

              <div class="rk-actions">
                <q-btn
                  unelevated
                  color="primary"
                  icon="download"
                  label="Aplicar plantilla"
                  :disable="!companyId || !templateId || store.loading"
                  @click="applyTemplate"
                />
                <q-btn
                  outline
                  color="primary"
                  icon="fact_check"
                  label="Revisar mínimos"
                  :disable="!companyId || store.loading"
                  @click="validate"
                />
              </div>
            </div>
          </div>

          <div class="rk-card">
            <div class="rk-card-title">
              <q-icon name="lightbulb" />
              <span>Guía rápida</span>
            </div>

            <div class="rk-mini">
              <div class="rk-mini-item">
                <q-icon name="add_circle" />
                <div>
                  <b>Haberes</b>
                  <div class="rk-muted">Sumas al pago (sueldo base, gratificación, bonos).</div>
                </div>
              </div>

              <div class="rk-mini-item">
                <q-icon name="remove_circle" />
                <div>
                  <b>Descuentos</b>
                  <div class="rk-muted">Restas al pago (AFP, salud, cesantía u otros).</div>
                </div>
              </div>

              <div class="rk-mini-item">
                <q-icon name="route" />
                <div>
                  <b>Origen del valor</b>
                  <div class="rk-muted">Desde contrato / cálculo automático / parámetros.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row justify-end q-mt-md">
          <q-btn color="primary" label="Siguiente" icon-right="chevron_right" @click="step = 2" />
        </div>
      </q-step>

      <q-step :name="2" title="Revisar y editar" icon="list_alt" :done="step > 2">
        <div class="rk-toolbar">
          <q-input
            v-model="q"
            dense
            outlined
            placeholder="Buscar por código o nombre…"
            class="rk-search"
            clearable
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>

          <q-btn outline icon="add" label="Crear concepto" @click="openCreate" />
          <q-btn
            outline
            icon="fact_check"
            label="Revisar mínimos"
            :disable="store.loading"
            @click="validate"
          />
        </div>

        <q-table
          flat
          :rows="filteredRows"
          :columns="colsEs"
          row-key="_id"
          :loading="store.loading"
          separator="horizontal"
          class="rk-table"
          :pagination="{ rowsPerPage: 12 }"
          rows-per-page-label="Registros por página:"
          no-data-label="No hay conceptos aún"
          loading-label="Cargando…"
        >
          <template #body-cell_habilitado="p">
            <q-td :props="p">
              <q-toggle
                v-model="p.row.active"
                @update:model-value="queuePatch(p.row, { active: p.row.active })"
              />
            </q-td>
          </template>

          <template #body-cell_tipo="p">
            <q-td :props="p">
              <q-chip
                dense
                :icon="p.row.kind === 'EARNING' ? 'add_circle' : 'remove_circle'"
                :label="p.row.kind === 'EARNING' ? 'Haber' : 'Descuento'"
              />
            </q-td>
          </template>

          <template #body-cell_origen="p">
            <q-td :props="p">
              <q-chip dense icon="input" :label="origenLabel(p.row.valueType)" />
              <div class="rk-muted rk-small q-mt-xs" v-if="origenHint(p.row)">
                {{ origenHint(p.row) }}
              </div>
            </q-td>
          </template>

          <template #body-cell_imponible="p">
            <q-td :props="p">
              <span class="rk-bool" :class="p.row.taxable ? 'yes' : 'no'">
                <q-icon :name="p.row.taxable ? 'check_circle' : 'cancel'" />
                {{ p.row.taxable ? "Sí" : "No" }}
              </span>
            </q-td>
          </template>

          <template #body-cell_prorratea="p">
            <q-td :props="p">
              <span class="rk-bool" :class="p.row.prorate ? 'yes' : 'no'">
                <q-icon :name="p.row.prorate ? 'check_circle' : 'cancel'" />
                {{ p.row.prorate ? "Sí" : "No" }}
              </span>
            </q-td>
          </template>

          <template #body-cell_orden="p">
            <q-td :props="p">
              <q-input
                v-model.number="p.row.order"
                type="number"
                dense
                outlined
                style="width: 110px"
                @update:model-value="queuePatch(p.row, { order: Number(p.row.order || 100) })"
              />
            </q-td>
          </template>

          <template #body-cell_acciones="p">
            <q-td :props="p" class="text-right">
              <q-btn dense flat round icon="edit" @click="openEdit(p.row)" />
            </q-td>
          </template>
        </q-table>

        <div class="row justify-between q-mt-md">
          <q-btn flat icon="chevron_left" label="Volver" @click="step = 1" />
          <q-btn color="primary" label="Siguiente" icon-right="chevron_right" @click="step = 3" />
        </div>
      </q-step>

      <q-step :name="3" title="Validar y guardar" icon="task_alt">
        <div class="rk-grid">
          <div class="rk-card">
            <div class="rk-card-title">
              <q-icon name="summarize" />
              <span>Resumen</span>
            </div>

            <div class="rk-summary">
              <div class="rk-summary-row">
                <span>Conceptos activos</span>
                <b>{{ store.activeCount }}</b>
              </div>
              <div class="rk-summary-row">
                <span>Haberes</span>
                <b>{{ store.earningsCount }}</b>
              </div>
              <div class="rk-summary-row">
                <span>Descuentos</span>
                <b>{{ store.deductionsCount }}</b>
              </div>
              <div class="rk-summary-row">
                <span>Estado</span>
                <b>{{ store.validation?.ok ? "Listo" : "Faltan mínimos" }}</b>
              </div>
            </div>

            <div class="rk-actions q-mt-md">
              <q-btn
                outline
                color="primary"
                icon="fact_check"
                label="Revisar mínimos"
                :disable="store.loading"
                @click="validate"
              />
              <q-btn
                unelevated
                color="primary"
                icon="save"
                :label="patches.length ? `Guardar cambios (${patches.length})` : 'Guardar cambios'"
                :disable="!patches.length || store.loading"
                @click="saveBulk"
              />
            </div>
          </div>

          <div class="rk-card">
            <div class="rk-card-title">
              <q-icon name="help_outline" />
              <span>Consejo</span>
            </div>
            <div class="rk-muted">
              Si quieres que quede “como debe”, parte por:
              <b>Aplicar plantilla</b> → ajustar → <b>Revisar mínimos</b> → guardar.
            </div>
          </div>
        </div>

        <div class="row justify-start q-mt-md">
          <q-btn flat icon="chevron_left" label="Volver" @click="step = 2" />
        </div>
      </q-step>
    </q-stepper>

    <!-- Save bar -->
    <div class="rk-savebar" v-if="patches.length">
      <div class="rk-savebar-left">
        <q-icon name="edit_note" />
        <div>
          <b>Tienes cambios pendientes</b>
          <div class="rk-muted">{{ patches.length }} cambio(s) sin guardar</div>
        </div>
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="save"
        :label="`Guardar (${patches.length})`"
        :disable="store.loading"
        @click="saveBulk"
      />
    </div>

    <!-- Dialog create/edit -->
    <q-dialog v-model="dlg">
      <q-card style="width: 780px; max-width: 92vw; border-radius: 16px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-weight-bold">
            {{ editingId ? "Editar concepto" : "Nuevo concepto" }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-banner class="rk-banner rk-banner--info" rounded>
            <template #avatar><q-icon name="info" /></template>
            <div class="rk-muted">
              Elige <b>Tipo</b> y <b>De dónde sale el valor</b>. No necesitas escribir “claves raras”.
              Solo usa “Avanzado” si sabes lo que haces.
            </div>
          </q-banner>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-4">
              <q-input v-model="edit.code" outlined dense label="Código (único)" />
            </div>
            <div class="col-12 col-sm-8">
              <q-input v-model="edit.name" outlined dense label="Nombre visible" />
            </div>

            <div class="col-12 col-sm-4">
              <q-select
                v-model="edit.kind"
                :options="kindOptsEs"
                outlined
                dense
                emit-value
                map-options
                label="Tipo"
              />
            </div>

            <div class="col-12 col-sm-4">
              <q-select
                v-model="edit.valueType"
                :options="valueTypeOptsEs"
                outlined
                dense
                emit-value
                map-options
                label="De dónde sale el valor"
              />
            </div>

            <div class="col-12 col-sm-4">
              <q-input v-model.number="edit.order" type="number" outlined dense label="Orden (prioridad)" />
            </div>
          </div>

          <q-separator />

          <!-- PATH: selector amigable -->
          <div v-if="edit.valueType === 'PATH'" class="rk-form">
            <q-select
              v-model="pathChoice"
              :options="contractFieldOptions"
              outlined
              dense
              label="Campo del contrato"
              hint="Ej: sueldo base, gratificación, colación…"
              emit-value
              map-options
            />
            <q-slide-transition>
              <div v-if="pathChoice === '__CUSTOM__'">
                <q-input
                  v-model="edit.valuePath"
                  outlined
                  dense
                  label="Ruta avanzada (opcional)"
                  hint="Solo si sabes exactamente qué ruta usa tu sistema"
                />
              </div>
            </q-slide-transition>
          </div>

          <!-- PARAM: (lo dejamos simple, con opción avanzada) -->
          <div v-else-if="edit.valueType === 'PARAM'" class="rk-form">
            <q-select
              v-model="paramChoice"
              :options="paramPresetOptions"
              outlined
              dense
              label="Parámetro"
              hint="Ej: UF, sueldo mínimo…"
              emit-value
              map-options
            />
            <q-slide-transition>
              <div v-if="paramChoice === '__CUSTOM__'" class="row q-col-gutter-sm">
                <div class="col-12 col-sm-4">
                  <q-input v-model="edit.param.type" outlined dense label="Tipo" />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="edit.param.scope" outlined dense label="Alcance" />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="edit.param.key" outlined dense label="Clave" />
                </div>
              </div>
            </q-slide-transition>
          </div>

          <!-- CALC: selector amigable -->
          <div v-else-if="edit.valueType === 'CALC'" class="rk-form">
            <q-select
              v-model="calcChoice"
              :options="calcPresetOptions"
              outlined
              dense
              label="Cálculo automático"
              hint="Selecciona el cálculo, no lo escribas"
              emit-value
              map-options
            />
            <q-slide-transition>
              <div v-if="calcChoice === '__CUSTOM__'">
                <q-input
                  v-model="edit.calcKey"
                  outlined
                  dense
                  label="Clave avanzada (opcional)"
                  hint="Solo si sabes exactamente el nombre interno"
                />
              </div>
            </q-slide-transition>
          </div>

          <!-- Toggles -->
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-4">
              <q-toggle v-model="edit.active" label="Habilitado" />
            </div>
            <div class="col-12 col-sm-4">
              <q-toggle v-model="edit.taxable" label="Imponible" />
            </div>
            <div class="col-12 col-sm-4">
              <q-toggle v-model="edit.prorate" label="Prorratea" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" label="Guardar" @click="saveOne" :disable="store.loading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Help -->
    <q-dialog v-model="helpDlg">
      <q-card style="width: 620px; max-width: 92vw; border-radius: 16px">
        <q-card-section class="row items-center">
          <div class="text-weight-bold">Ayuda</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="rk-muted" style="line-height: 1.6">
          <div v-if="helpKey === 'plantilla'">
            <b>Agregar sin borrar:</b> mantiene tus conceptos y agrega los que falten.<br />
            <b>Reemplazar todo:</b> deja la empresa exactamente como la plantilla.
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { usePayrollConceptsStore } from "@/stores/payrollConceptsStore";

const $q = useQuasar();
const store = usePayrollConceptsStore();

const props = defineProps({
  companyId: { type: String, required: true },
});

const step = ref(1);
const q = ref("");
const templateId = ref(null);
const applyMode = ref("merge");
const patches = ref([]);

// Help
const helpDlg = ref(false);
const helpKey = ref("plantilla");
function showHelp(key) {
  helpKey.value = key;
  helpDlg.value = true;
}

// Dialog
const dlg = ref(false);
const editingId = ref(null);

// UI selectors (friendly choices)
const calcChoice = ref(null);
const pathChoice = ref(null);
const paramChoice = ref(null);

const edit = ref({
  code: "",
  name: "",
  kind: "EARNING",     // backend values (no se muestran)
  valueType: "PATH",   // backend values (no se muestran)
  valuePath: "",
  param: { type: "", scope: "", key: "" },
  calcKey: "",
  taxable: false,
  prorate: false,
  active: true,
  order: 100,
});

// Opciones UI (ES)
const applyModeOptsEs = [
  { label: "Agregar sin borrar (recomendado)", value: "merge" },
  { label: "Reemplazar todo", value: "replace" },
];

const kindOptsEs = [
  { label: "Haber (suma al pago)", value: "EARNING" },
  { label: "Descuento (resta al pago)", value: "DEDUCTION" },
];

const valueTypeOptsEs = [
  { label: "Desde contrato", value: "PATH" },
  { label: "Cálculo automático", value: "CALC" },
  { label: "Desde parámetros", value: "PARAM" },
];

// Catálogo amigable (puedes ampliar cuando quieras)
const contractFieldOptions = [
  { label: "Sueldo base", value: "baseSalary" },
  { label: "Gratificación", value: "gratification" },
  { label: "Colación", value: "mealAllowance" },
  { label: "Movilización", value: "transportAllowance" },
  { label: "Bono", value: "bonus" },
  { label: "Otro (avanzado)", value: "__CUSTOM__" },
];

const calcPresetOptions = [
  { label: "AFP (descuento trabajador)", value: "AFP_WORKER" },
  { label: "Salud (descuento trabajador)", value: "HEALTH_WORKER" },
  { label: "Seguro de cesantía (trabajador)", value: "CESANTIA_WORKER" },
  // puedes agregar empleador si aplica:
  // { label: "Seguro de cesantía (empleador)", value: "CESANTIA_EMPLOYER" },
  { label: "Otro (avanzado)", value: "__CUSTOM__" },
];

const paramPresetOptions = [
  { label: "UF (empresa)", value: "UF__COMPANY" },
  { label: "Sueldo mínimo (empresa)", value: "MIN_WAGE__COMPANY" },
  { label: "Otro (avanzado)", value: "__CUSTOM__" },
];

// Tabla (ES)
const colsEs = [
  { name: "habilitado", label: "Habilitado", field: "active", align: "left" },
  { name: "code", label: "Código", field: "code", align: "left", sortable: true },
  { name: "name", label: "Nombre", field: "name", align: "left", sortable: true },
  { name: "tipo", label: "Tipo", field: "kind", align: "left" },
  { name: "origen", label: "De dónde sale", field: "valueType", align: "left" },
  { name: "imponible", label: "Imponible", field: "taxable", align: "left" },
  { name: "prorratea", label: "Prorratea", field: "prorate", align: "left" },
  { name: "orden", label: "Orden", field: "order", align: "left", sortable: true },
  { name: "acciones", label: "", field: "actions", align: "right" },
];

const templateOptions = computed(() =>
  (store.templates || []).map((t) => ({
    label: t.name || t.code || t._id,
    value: t._id,
  }))
);

const filteredRows = computed(() => {
  const rows = store.items || [];
  const term = (q.value || "").trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((r) => {
    const a = String(r.code || "").toLowerCase();
    const b = String(r.name || "").toLowerCase();
    return a.includes(term) || b.includes(term);
  });
});

// ---- Missing list (human friendly) ----
function origenLabel(valueType) {
  if (valueType === "PATH") return "Desde contrato";
  if (valueType === "PARAM") return "Desde parámetros";
  if (valueType === "CALC") return "Cálculo automático";
  return "Sin definir";
}

function kindLabel(kind) {
  return kind === "EARNING" ? "Haber" : kind === "DEDUCTION" ? "Descuento" : "Sin definir";
}

function prettyFromValuePath(path) {
  const found = contractFieldOptions.find((x) => x.value === path);
  return found?.label || path || "";
}

function prettyFromCalcKey(key) {
  const found = calcPresetOptions.find((x) => x.value === key);
  return found?.label || key || "";
}

// convierte textos tipo:
// "Falta concepto activo: sueldo base (EARNING PATH valuePath=baseSalary taxable=true)"
function prettyMissingLine(line) {
  const s = String(line || "");

  // nombre
  const nameMatch = s.match(/Falta concepto activo:\s*([^(]+)\s*\(/i);
  const name = nameMatch ? nameMatch[1].trim() : "";

  // kind / valueType / keys
  const kind = s.includes("EARNING") ? "EARNING" : s.includes("DEDUCTION") ? "DEDUCTION" : null;
  const valueType = s.includes(" PATH ") || s.includes("(EARNING PATH") || s.includes("(DEDUCTION PATH")
    ? "PATH"
    : s.includes(" CALC ") || s.includes("(EARNING CALC") || s.includes("(DEDUCTION CALC")
    ? "CALC"
    : s.includes(" PARAM ") || s.includes("(EARNING PARAM") || s.includes("(DEDUCTION PARAM")
    ? "PARAM"
    : null;

  const valuePathMatch = s.match(/valuePath=([A-Za-z0-9_.-]+)/);
  const calcKeyMatch = s.match(/calcKey=([A-Za-z0-9_.-]+)/);
  const taxable = /taxable=true/i.test(s);

  const parts = [];
  if (name) parts.push(name);
  if (kind) parts.push(`(${kindLabel(kind)})`);
  if (valueType) parts.push(`— ${origenLabel(valueType)}`);

  if (valueType === "PATH" && valuePathMatch?.[1]) {
    parts.push(`— ${prettyFromValuePath(valuePathMatch[1])}`);
  }
  if (valueType === "CALC" && calcKeyMatch?.[1]) {
    parts.push(`— ${prettyFromCalcKey(calcKeyMatch[1])}`);
  }
  if (taxable) parts.push("— Imponible");

  return parts.length ? parts.join(" ") : s;
}

const missingListPretty = computed(() => {
  const m = store.validation?.missing || {};
  const raw = [];

  if (Array.isArray(m)) raw.push(...m);
  else {
    for (const [k, v] of Object.entries(m)) {
      if (Array.isArray(v)) v.forEach((x) => raw.push(`${k}: ${x}`));
      else if (v) raw.push(String(v));
    }
  }

  // Limpia el prefijo "concepts:" y lo hace humano
  return raw.map((x) => {
    const line = String(x).replace(/^concepts:\s*/i, "");
    return prettyMissingLine(line);
  });
});

// ---- Dialog: mantener select sincronizado con datos reales ----
function syncSelectorsFromEdit() {
  // PATH
  if (edit.value.valueType === "PATH") {
    const known = contractFieldOptions.some((o) => o.value === edit.value.valuePath);
    pathChoice.value = known ? edit.value.valuePath : "__CUSTOM__";
  } else pathChoice.value = null;

  // CALC
  if (edit.value.valueType === "CALC") {
    const known = calcPresetOptions.some((o) => o.value === edit.value.calcKey);
    calcChoice.value = known ? edit.value.calcKey : "__CUSTOM__";
  } else calcChoice.value = null;

  // PARAM
  if (edit.value.valueType === "PARAM") {
    // intento mapear 2 presets
    const key = (edit.value.param?.key || "").toUpperCase();
    if (key === "UF") paramChoice.value = "UF__COMPANY";
    else if (key === "MIN_WAGE") paramChoice.value = "MIN_WAGE__COMPANY";
    else paramChoice.value = "__CUSTOM__";
  } else paramChoice.value = null;
}

watch(
  () => edit.value.valueType,
  () => {
    // al cambiar origen, resetea campos no usados (evita basura)
    if (edit.value.valueType !== "PATH") edit.value.valuePath = "";
    if (edit.value.valueType !== "CALC") edit.value.calcKey = "";
    if (edit.value.valueType !== "PARAM") edit.value.param = { type: "", scope: "", key: "" };
    syncSelectorsFromEdit();
  }
);

watch(pathChoice, (v) => {
  if (edit.value.valueType !== "PATH") return;
  if (v && v !== "__CUSTOM__") edit.value.valuePath = v;
  if (v === "__CUSTOM__" && !edit.value.valuePath) edit.value.valuePath = "";
});

watch(calcChoice, (v) => {
  if (edit.value.valueType !== "CALC") return;
  if (v && v !== "__CUSTOM__") edit.value.calcKey = v;
  if (v === "__CUSTOM__" && !edit.value.calcKey) edit.value.calcKey = "";
});

watch(paramChoice, (v) => {
  if (edit.value.valueType !== "PARAM") return;
  if (v === "UF__COMPANY") edit.value.param = { type: "MONEY", scope: "COMPANY", key: "UF" };
  else if (v === "MIN_WAGE__COMPANY") edit.value.param = { type: "MONEY", scope: "COMPANY", key: "MIN_WAGE" };
  else if (v === "__CUSTOM__" && !edit.value.param) edit.value.param = { type: "", scope: "", key: "" };
});

// ---- Load ----
async function reload() {
  await Promise.allSettled([
    store.fetchConcepts(props.companyId),
    store.fetchTemplates(),
    store.validateCompanyPayroll(props.companyId),
  ]);
}

onMounted(reload);

// ---- Actions ----
async function applyTemplate() {
  try {
    await store.applyTemplate({
      companyId: props.companyId,
      templateId: templateId.value,
      mode: applyMode.value,
    });
    await store.validateCompanyPayroll(props.companyId);
    $q.notify({ type: "positive", message: "Plantilla aplicada", icon: "check_circle", position: "top" });
    step.value = 2;
  } catch (e) {
    $q.notify({ type: "negative", message: e?.message || "Error aplicando plantilla", icon: "error", position: "top" });
  }
}

async function validate() {
  try {
    await store.validateCompanyPayroll(props.companyId);
    $q.notify({
      type: store.validation?.ok ? "positive" : "warning",
      message: store.validation?.ok ? "Configuración lista" : "Faltan mínimos",
      position: "top",
    });
  } catch (e) {
    $q.notify({ type: "negative", message: e?.message || "Error revisando mínimos", position: "top" });
  }
}

function queuePatch(row, patch) {
  const id = row._id;
  const idx = patches.value.findIndex((p) => p._id === id);
  if (idx === -1) patches.value.push({ _id: id, ...patch });
  else patches.value[idx] = { ...patches.value[idx], ...patch };
}

async function saveBulk() {
  try {
    await store.bulkUpdate({ companyId: props.companyId, patches: patches.value });
    patches.value = [];
    await store.validateCompanyPayroll(props.companyId);
    $q.notify({ type: "positive", message: "Cambios guardados", icon: "save", position: "top" });
  } catch (e) {
    $q.notify({ type: "negative", message: e?.message || "Error guardando", icon: "error", position: "top" });
  }
}

function openCreate() {
  editingId.value = null;
  edit.value = {
    code: "",
    name: "",
    kind: "EARNING",
    valueType: "PATH",
    valuePath: "baseSalary",
    param: { type: "", scope: "", key: "" },
    calcKey: "",
    taxable: true,
    prorate: false,
    active: true,
    order: 100,
  };
  syncSelectorsFromEdit();
  dlg.value = true;
}

function openEdit(row) {
  editingId.value = row._id;
  edit.value = JSON.parse(JSON.stringify(row));
  edit.value.param = edit.value.param || { type: "", scope: "", key: "" };
  syncSelectorsFromEdit();
  dlg.value = true;
}

async function saveOne() {
  try {
    if (!edit.value.code || !edit.value.name) {
      return $q.notify({ type: "warning", message: "Código y nombre son requeridos", position: "top" });
    }

    // Validaciones amigables
    if (edit.value.valueType === "PATH" && !edit.value.valuePath) {
      return $q.notify({ type: "warning", message: "Debes elegir un campo del contrato", position: "top" });
    }
    if (edit.value.valueType === "CALC" && !edit.value.calcKey) {
      return $q.notify({ type: "warning", message: "Debes elegir un cálculo automático", position: "top" });
    }
    if (
      edit.value.valueType === "PARAM" &&
      (!edit.value.param?.type || !edit.value.param?.scope || !edit.value.param?.key)
    ) {
      return $q.notify({ type: "warning", message: "Debes elegir un parámetro o completar el modo avanzado", position: "top" });
    }

    await store.upsertConcept({ companyId: props.companyId, concept: edit.value });
    dlg.value = false;
    await store.validateCompanyPayroll(props.companyId);
    $q.notify({ type: "positive", message: "Concepto guardado", position: "top" });
  } catch (e) {
    $q.notify({ type: "negative", message: e?.message || "Error guardando concepto", position: "top" });
  }
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap");

.rk-wrap {
  font-family: "Sora", -apple-system, sans-serif;
  padding: 14px;
}

.rk-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.rk-title {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.rk-h1 {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.2;
}

.rk-h2 {
  margin-top: 4px;
  opacity: 0.7;
  font-size: 0.9rem;
}

.rk-state {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.9rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.rk-state.ok {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
  border-color: rgba(34, 197, 94, 0.25);
}

.rk-state.warn {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.25);
}

.rk-note {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px;
  border-radius: 12px;
  background: rgba(6, 182, 212, 0.06);
  border: 1px solid rgba(6, 182, 212, 0.16);
  margin-bottom: 12px;
}

.rk-banner {
  margin-bottom: 12px;
}

.rk-banner--warn {
  background: rgba(245, 158, 11, 0.08);
}

.rk-banner--error {
  background: rgba(239, 68, 68, 0.08);
}

.rk-banner--info {
  background: rgba(59, 130, 246, 0.08);
}

.rk-muted {
  opacity: 0.75;
}

.rk-small {
  font-size: 0.8rem;
}

.rk-missing {
  margin: 8px 0 0 16px;
}

.rk-stepper {
  border-radius: 14px;
}

.rk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.rk-card {
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 14px;
  background: rgba(255, 255, 255, 0.9);
}

.body--dark .rk-card {
  background: rgba(15, 23, 42, 0.65);
  border-color: rgba(255, 255, 255, 0.12);
}

.rk-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  margin-bottom: 10px;
}

.rk-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rk-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.rk-mini {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rk-mini-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 12px;
  background: rgba(6, 182, 212, 0.05);
  border: 1px solid rgba(6, 182, 212, 0.12);
}

.rk-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.rk-search {
  min-width: 260px;
  flex: 1;
}

.rk-table {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.rk-bool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
}

.rk-bool.yes {
  color: #16a34a;
}

.rk-bool.no {
  color: rgba(15, 23, 42, 0.55);
}

.body--dark .rk-bool.no {
  color: rgba(255, 255, 255, 0.65);
}

.rk-summary {
  display: grid;
  gap: 10px;
}

.rk-summary-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
}

.body--dark .rk-summary-row {
  background: rgba(255, 255, 255, 0.06);
}

.rk-savebar {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(6, 182, 212, 0.25);
  backdrop-filter: blur(10px);
}

.rk-savebar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 900px) {
  .rk-grid {
    grid-template-columns: 1fr;
  }
}
</style>