<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <q-card flat bordered class="rk-docs-card q-mt-md">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6" :class="isDark ? 'text-white' : 'text-primary'">
            Liquidaciones
          </div>
          <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">
            Gestiona períodos: genera borradores, revisa y emite PDFs.
          </div>
        </div>

        <div class="row q-gutter-sm items-center">
          <q-input
            dense filled
            v-model="period"
            label="Período (YYYY-MM)"
            mask="####-##"
            style="width: 160px"
            :color="isDark ? 'grey-3' : 'primary'"
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="period" mask="YYYY-MM" minimal>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Cerrar" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-btn
            :color="isDark ? 'primary-7' : 'primary'"
            unelevated
            icon="bolt"
            label="Generar borradores"
            no-caps
            :loading="store.loading"
            @click="generate"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-table
          flat bordered dense
          row-key="period"
          :rows="periodRows"
          :columns="columns"
          :loading="store.loading"
          no-data-label="Sin períodos"
          :class="isDark ? 'bg-grey-9' : ''"
        >
          <template #body-cell-status="p">
            <q-td :props="p">
              <q-chip dense :color="statusColor(p.row.status)" text-color="white" size="sm">
                {{ p.row.status || "—" }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-counts="p">
            <q-td :props="p">
              <div class="row q-gutter-xs">
                <q-chip dense color="grey-6" text-color="white" size="sm">
                  Total {{ p.row.total || 0 }}
                </q-chip>
                <q-chip dense color="orange" text-color="white" size="sm">
                  Draft {{ p.row.draft || 0 }}
                </q-chip>
                <q-chip dense color="positive" text-color="white" size="sm">
                  Emitidas {{ p.row.issued || 0 }}
                </q-chip>
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="p">
            <q-td :props="p" class="text-right">
              <q-btn
                flat dense icon="open_in_new"
                :color="isDark ? 'primary-4' : 'primary'"
                @click="goPeriod(p.row.period)"
              >
                <q-tooltip>Ver período</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template #loading>
            <q-inner-loading showing>
              <q-spinner-gears size="40px" :color="isDark ? 'primary-4' : 'primary'" />
            </q-inner-loading>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { usePayrollStore } from "@/stores/payrollStore";
import { lastMonthPeriod, isValidPeriod } from "@/utils/payrollPeriod";
import { useUserStore } from "@/stores/userStore";

const $q = useQuasar();
const router = useRouter();
const store = usePayrollStore();
const userStore = useUserStore();

const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() => (isDark.value ? "bg-grey-10 text-white" : "bg-grey-1"));

const period = ref(lastMonthPeriod());

function companyId() {
  // ajusta según tu sesión: empresa activa / user.companyId / etc.
  return userStore?.user?.companyId || userStore?.user?.company?._id || userStore?.user?.company || null;
}

const columns = [
  { name: "period", label: "Período", field: "period", sortable: true, align: "left" },
  { name: "status", label: "Estado", field: "status", sortable: true, align: "left" },
  { name: "counts", label: "Resumen", field: "counts", align: "left" },
  { name: "actions", label: "Acciones", field: "actions", align: "right" },
];

const periodRows = computed(() => store.periods || []);

function statusColor(status) {
  if (status === "CLOSED") return "grey-8";
  if (status === "PUBLISHED") return "positive";
  if (status === "DRAFT") return "orange";
  return isDark.value ? "grey-7" : "grey";
}

async function load() {
  const cid = companyId();
  if (!cid) return;
  await store.fetchPeriods({ companyId: cid });
}

async function generate() {
  const cid = companyId();
  if (!cid) {
    return $q.notify({ type: "negative", message: "No se encontró empresa activa", position: "top" });
  }
  if (!isValidPeriod(period.value)) {
    return $q.notify({ type: "warning", message: "Período inválido (YYYY-MM)", position: "top" });
  }

  try {
    const res = await store.generatePeriod({ companyId: cid, period: period.value });
    $q.notify({
      type: "positive",
      message: `Generado ${period.value} (creados: ${res?.created ?? 0}, actualizados: ${res?.updated ?? 0})`,
      position: "top",
      timeout: 2000
    });
    await load();
    goPeriod(period.value);
  } catch (e) {
    $q.notify({ type: "negative", message: store.error || "Error generando", position: "top" });
  }
}

function goPeriod(p) {
  router.push({ name: "payroll-period", params: { period: p } });
}

onMounted(load);
</script>
