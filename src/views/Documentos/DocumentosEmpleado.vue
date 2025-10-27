<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <q-card flat bordered class="rk-docs-card q-mt-md">
      <!-- Header: saludo + accesos rápidos -->
      <q-card-section class="row items-center justify-between q-pb-sm">
        <div class="row items-center">
          <q-avatar
            color="primary"
            text-color="white"
            size="42px"
            class="q-mr-md"
            font-size="18px"
          >
            {{ initials(userName) }}
          </q-avatar>
          <div>
            <div
              class="text-h6 text-weight-medium"
              :class="isDark ? 'text-white' : 'text-primary'"
            >
              Hola, {{ firstName(userName) }}
            </div>
            <div
              class="text-caption"
              :class="isDark ? 'text-grey-4' : 'text-grey-7'"
            >
              Aquí están tus documentos personales (liquidaciones, contratos y
              más)
            </div>
          </div>
        </div>

        <div class="row q-gutter-sm items-center">
          <q-btn
            v-if="latestPayslip"
            color="primary"
            unelevated
            icon="receipt_long"
            @click="verDocumento(latestPayslip)"
            :label="`Última liquidación (${latestPayslip.period})`"
            class="q-px-md"
          />
          <q-btn
            flat
            dense
            icon="folder_open"
            label="Ver todos"
            @click="scrollToList"
            class="text-weight-medium"
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Controles: tabs, búsqueda, filtros rápidos -->
      <q-card-section class="q-pt-md q-pb-sm">
        <div class="row items-center q-gutter-md">
          <q-tabs
            v-model="tabType"
            dense
            class="col-grow"
            active-color="primary"
            indicator-color="primary"
            align="left"
            narrow-indicator
          >
            <q-tab name="payroll" label="Liquidaciones" icon="payments" />
            <q-tab name="contract" label="Contratos" icon="feed" />
            <q-tab
              name="certificate"
              label="Certificados"
              icon="workspace_premium"
            />
            <q-tab name="other" label="Otros" icon="description" />
            <q-tab name="all" label="Todos" icon="folder_open" />
          </q-tabs>

          <q-btn-toggle
            v-model="viewMode"
            dense
            rounded
            unelevated
            :class="isDark ? 'bg-grey-9' : 'bg-grey-3'"
            :options="[
              { label: 'Tarjetas', icon: 'view_module', value: 'cards' },
              { label: 'Lista', icon: 'view_list', value: 'list' },
            ]"
          />
        </div>

        <div class="row q-col-gutter-sm q-mt-md">
          <div class="col-12 col-md-5">
            <q-input
              dense
              filled
              v-model.trim="q"
              debounce="300"
              placeholder="Buscar por nombre o comentario…"
              :color="isDark ? 'grey-3' : 'primary'"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
              <template #append>
                <q-btn
                  v-if="q"
                  dense
                  flat
                  icon="close"
                  @click="q = ''"
                  size="sm"
                />
              </template>
            </q-input>
          </div>
          <div class="col-6 col-md-2">
            <q-select
              dense
              filled
              v-model="year"
              :options="yearsOptions"
              label="Año"
              clearable
              :color="isDark ? 'grey-3' : 'primary'"
              emit-value
              map-options
            />
          </div>
          <div class="col-6 col-md-3">
            <q-input
              dense
              filled
              v-model="period"
              label="Período (YYYY-MM)"
              mask="####-##"
              clearable
              :color="isDark ? 'grey-3' : 'primary'"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date v-model="period" mask="YYYY-MM" minimal>
                      <div class="row items-center justify-end">
                        <q-btn
                          v-close-popup
                          label="Cerrar"
                          color="primary"
                          flat
                        />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-2 flex items-center">
            <q-btn
              class="full-width"
              color="primary"
              outline
              icon="refresh"
              label="Actualizar"
              @click="reload"
              :loading="store.loading"
            />
          </div>
        </div>

        <!-- Filtros activos -->
        <div class="q-mt-sm" v-if="hasActiveFilters">
          <div
            class="text-caption q-mb-xs"
            :class="isDark ? 'text-grey-4' : 'text-grey-7'"
          >
            Filtros activos:
          </div>
          <q-chip
            v-if="period"
            dense
            color="primary"
            text-color="white"
            removable
            @remove="period = ''"
            icon="event"
          >
            Período: {{ period }}
          </q-chip>
          <q-chip
            v-if="year"
            dense
            color="secondary"
            text-color="white"
            removable
            @remove="year = null"
            icon="calendar_today"
          >
            Año: {{ year }}
          </q-chip>
          <q-chip
            v-if="q"
            dense
            :color="isDark ? 'grey-7' : 'grey-6'"
            text-color="white"
            removable
            @remove="q = ''"
            icon="search"
          >
            Búsqueda: “{{ q }}”
          </q-chip>
          <q-btn
            v-if="hasActiveFilters"
            flat
            dense
            size="sm"
            color="grey"
            icon="clear_all"
            label="Limpiar todo"
            @click="limpiarFiltros"
            class="q-ml-sm"
          />
        </div>
      </q-card-section>

      <!-- Quick KPI -->
      <q-card-section class="q-pt-none q-pb-md">
        <div class="row q-col-gutter-sm">
          <div class="col-6 col-sm-3">
            <q-card
              flat
              bordered
              class="rk-kpi cursor-pointer"
              :class="isDark ? 'bg-dark' : 'bg-grey-1'"
              @click="tabType = 'all'"
            >
              <q-card-section class="row items-center q-pa-md">
                <q-icon
                  name="description"
                  size="24px"
                  :color="isDark ? 'grey-4' : 'grey-7'"
                  class="q-mr-sm"
                />
                <div>
                  <div
                    class="text-caption"
                    :class="isDark ? 'text-grey-4' : 'text-grey-7'"
                  >
                    Total documentos
                  </div>
                  <div class="text-h6 text-weight-medium">
                    {{ rowsFiltradas.length }}
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card
              flat
              bordered
              class="rk-kpi cursor-pointer"
              :class="isDark ? 'bg-dark' : 'bg-grey-1'"
              @click="tabType = 'payroll'"
            >
              <q-card-section class="row items-center q-pa-md">
                <q-icon
                  name="payments"
                  size="24px"
                  :color="isDark ? 'grey-4' : 'grey-7'"
                  class="q-mr-sm"
                />
                <div>
                  <div
                    class="text-caption"
                    :class="isDark ? 'text-grey-4' : 'text-grey-7'"
                  >
                    Liquidaciones
                  </div>
                  <div class="text-h6 text-weight-medium">
                    {{ countByType("payroll") }}
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card
              flat
              bordered
              class="rk-kpi cursor-pointer"
              :class="isDark ? 'bg-dark' : 'bg-grey-1'"
              @click="tabType = 'contract'"
            >
              <q-card-section class="row items-center q-pa-md">
                <q-icon
                  name="feed"
                  size="24px"
                  :color="isDark ? 'grey-4' : 'grey-7'"
                  class="q-mr-sm"
                />
                <div>
                  <div
                    class="text-caption"
                    :class="isDark ? 'text-grey-4' : 'text-grey-7'"
                  >
                    Contratos
                  </div>
                  <div class="text-h6 text-weight-medium">
                    {{ countByType("contract") }}
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card
              flat
              bordered
              class="rk-kpi cursor-pointer"
              :class="isDark ? 'bg-dark' : 'bg-grey-1'"
              @click="tabType = 'certificate'"
            >
              <q-card-section class="row items-center q-pa-md">
                <q-icon
                  name="workspace_premium"
                  size="24px"
                  :color="isDark ? 'grey-4' : 'grey-7'"
                  class="q-mr-sm"
                />
                <div>
                  <div
                    class="text-caption"
                    :class="isDark ? 'text-grey-4' : 'text-grey-7'"
                  >
                    Certificados
                  </div>
                  <div class="text-h6 text-weight-medium">
                    {{ countByType("certificate") }}
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <!-- Lista / Tarjetas -->
      <q-card-section class="q-pt-none" ref="listSection">
        <!-- Loading state -->
        <div v-if="store.loading" class="q-pa-lg text-center">
          <q-spinner-gears size="40px" color="primary" />
          <div
            class="q-mt-md text-caption"
            :class="isDark ? 'text-grey-4' : 'text-grey-7'"
          >
            Cargando documentos...
          </div>
        </div>

        <!-- Empty state -->
        <q-banner
          v-else-if="rowsFiltradas.length === 0"
          inline-actions
          :class="isDark ? 'bg-grey-9 text-grey-4' : 'bg-grey-2 text-grey-9'"
          class="q-pa-lg rounded-borders"
        >
          <template #avatar>
            <q-icon name="folder_off" color="grey" size="28px" />
          </template>
          <div class="text-body1">
            No encontramos documentos con los filtros actuales.
          </div>
          <div class="text-caption q-mt-sm">
            Prueba quitando el período, cambiando la pestaña de tipo o ajustando
            la búsqueda.
          </div>
          <template #action>
            <q-btn
              flat
              dense
              label="Limpiar filtros"
              @click="limpiarFiltros"
              color="primary"
              icon="clear_all"
            />
          </template>
        </q-banner>

        <!-- Vista en tarjetas -->
        <div v-else-if="viewMode === 'cards'" class="row q-col-gutter-md">
          <div
            v-for="doc in rowsFiltradas"
            :key="doc.id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card
              class="rk-doc-card hoverable"
              bordered
              :class="isDark ? 'bg-grey-9' : ''"
            >
              <q-card-section class="row items-center no-wrap q-pb-sm">
                <q-avatar
                  :icon="iconoTipo(doc.type)"
                  :color="getTypeColor(doc.type)"
                  text-color="white"
                  size="42px"
                  font-size="20px"
                />
                <div class="q-ml-sm col">
                  <div
                    class="text-weight-medium ellipsis-2-lines"
                    style="max-height: 2.8em"
                  >
                    {{ doc.name }}
                  </div>
                  <div
                    class="text-caption"
                    :class="isDark ? 'text-grey-4' : 'text-grey-7'"
                  >
                    {{ labelDeTipo(doc.type) }} · {{ doc.period || "—" }}
                  </div>
                  <div
                    v-if="doc.comment"
                    class="text-caption text-italic q-mt-xs ellipsis"
                  >
                    {{ doc.comment }}
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-actions align="between" class="q-px-md q-py-sm">
                <q-btn
                  flat
                  dense
                  icon="visibility"
                  label="Ver"
                  @click="verDocumento(doc)"
                  color="primary"
                  class="text-weight-medium"
                />
                <q-btn
                  flat
                  dense
                  icon="download"
                  label="Descargar"
                  @click="descargarDocumento(doc)"
                  :color="isDark ? 'grey-4' : 'grey-7'"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <!-- Vista en lista -->
        <q-table
          v-else
          :rows="rowsFiltradas"
          :columns="columns"
          row-key="id"
          flat
          dense
          bordered
          :loading="store.loading"
          no-data-label="Sin documentos"
          :rows-per-page-options="[10, 20, 50]"
          :class="isDark ? 'bg-grey-9' : ''"
          :card-class="isDark ? 'bg-grey-9' : ''"
          table-header-class="text-weight-medium"
          :grid="$q.screen.xs"
        >
          <template #body-cell-name="p">
            <q-td :props="p">
              <div class="row items-center no-wrap">
                <q-avatar
                  :icon="iconoTipo(p.row.type)"
                  :color="getTypeColor(p.row.type)"
                  text-color="white"
                  size="32px"
                  font-size="16px"
                  class="q-mr-sm"
                />
                <div class="col">
                  <div class="text-weight-medium">{{ p.row.name }}</div>
                  <div
                    class="text-caption"
                    :class="isDark ? 'text-grey-4' : 'text-grey-7'"
                  >
                    {{ p.row.comment || "—" }}
                  </div>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-period="p">
            <q-td :props="p">
              <div>
                <div>{{ p.row.period || "—" }}</div>
                <div
                  class="text-caption"
                  :class="isDark ? 'text-grey-4' : 'text-grey-7'"
                >
                  {{ fmtDate(p.row.createdAt) }}
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="p">
            <q-td :props="p" class="text-right">
              <q-btn
                size="sm"
                flat
                round
                icon="visibility"
                @click="verDocumento(p.row)"
                color="primary"
                class="q-mr-xs"
              />
              <q-btn
                size="sm"
                flat
                round
                icon="file_download"
                @click="descargarDocumento(p.row)"
                :color="isDark ? 'grey-4' : 'grey-7'"
              />
            </q-td>
          </template>

          <!-- Vista grid para móviles -->
          <template #item="props">
            <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3">
              <q-card class="rk-doc-card hoverable" bordered>
                <q-card-section class="row items-center no-wrap">
                  <q-avatar
                    :icon="iconoTipo(props.row.type)"
                    :color="getTypeColor(props.row.type)"
                    text-color="white"
                    size="36px"
                  />
                  <div class="q-ml-sm col">
                    <div class="text-weight-medium ellipsis">
                      {{ props.row.name }}
                    </div>
                    <div class="text-caption text-grey-7">
                      {{ labelDeTipo(props.row.type) }} ·
                      {{ props.row.period || "—" }}
                    </div>
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-actions align="between">
                  <q-btn
                    flat
                    dense
                    icon="visibility"
                    @click="verDocumento(props.row)"
                    color="primary"
                  />
                  <q-btn
                    flat
                    dense
                    icon="download"
                    @click="descargarDocumento(props.row)"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </template>

          <template #loading>
            <q-inner-loading showing>
              <q-spinner-gears size="32px" color="primary" />
            </q-inner-loading>
          </template>
        </q-table>
      </q-card-section>

      <!-- Visor -->
      <q-dialog v-model="dialogViewer" maximized persistent>
        <q-card class="rk-docs-viewer">
          <q-bar :class="isDark ? 'bg-grey-9 text-white' : 'bg-grey-3'">
            <q-icon
              :name="currentDoc ? iconoTipo(currentDoc.type) : 'description'"
              class="q-mr-sm"
            />
            <div class="text-subtitle2 ellipsis">
              {{ currentDoc?.name || "Documento" }}
            </div>
            <q-space />
            <q-btn
              dense
              flat
              icon="file_download"
              @click="currentDoc && descargarDocumento(currentDoc)"
              :disable="!currentDoc"
            />
            <q-btn dense flat icon="close" v-close-popup />
          </q-bar>

          <q-card-section class="rk-viewer-body">
            <q-inner-loading :showing="loadingViewer">
              <q-spinner-gears size="36px" color="primary" />
              <div class="q-mt-md text-caption">Cargando documento...</div>
            </q-inner-loading>

            <iframe
              v-if="safeUrl && !loadingViewer"
              :src="safeUrl"
              class="rk-viewer-frame"
              @load="onIframeLoaded"
            ></iframe>

            <div v-else-if="!loadingViewer" class="q-pa-lg text-center">
              <q-icon
                name="error_outline"
                size="48px"
                color="orange"
                class="q-mb-md"
              />
              <div class="text-h6 q-mb-sm">No se pudo cargar el documento</div>
              <div class="text-body1 q-mb-md">
                El documento no está disponible o no se puede mostrar en el
                visor.
              </div>
              <q-btn
                color="primary"
                icon="file_download"
                label="Descargar documento"
                @click="currentDoc && descargarDocumento(currentDoc)"
                :disable="!currentDoc"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useQuasar } from "quasar";
import { useDocumentStore } from "@/stores/documentStore";
import { useUserStore } from "@/stores/userStore";

const pageBgClass = computed(() => isDark.value ? 'bg-grey-10 text-white' : 'bg-grey-1')

/* Props (opcional) */
const props = defineProps({
  employeeId: { type: [String, Number], required: false },
});

const $q = useQuasar();
const store = useDocumentStore();
const userStore = useUserStore();

/* ====== Estado UI ====== */
const tabType = ref("payroll"); // pestaña activa por defecto
const viewMode = ref("cards"); // cards | list
const q = ref("");
const year = ref(null);
const period = ref(new Date().toISOString().slice(0, 7)); // YYYY-MM
const loadingUi = ref(false);

const dialogViewer = ref(false);
const loadingViewer = ref(false);
const currentDoc = ref(null);
const safeUrl = ref("");

const listSection = ref(null);

/* ====== Datos / Columns ====== */
const columns = [
  {
    name: "name",
    label: "Documento",
    field: "name",
    sortable: true,
    align: "left",
  },
  {
    name: "type",
    label: "Tipo",
    field: (r) => labelDeTipo(r.type),
    sortable: true,
    align: "left",
  },
  {
    name: "period",
    label: "Período",
    field: "period",
    sortable: true,
    align: "left",
  },
  {
    name: "createdAt",
    label: "Cargado",
    field: (r) => fmtDate(r.createdAt),
    sortable: true,
  },
  { name: "actions", label: "Acciones", field: "id", align: "right" },
];

/* ====== Helpers ====== */
const isDark = computed(() => $q.dark.isActive);
const userName = computed(() =>
  userStore?.user?.firstName
    ? `${userStore.user.firstName} ${userStore.user.lastName || ""}`.trim()
    : "Usuario"
);

function initials(name = "") {
  const [a = "", b = ""] = name.split(" ");
  return ((a[0] || "") + (b[0] || "")).toUpperCase() || "U";
}
function firstName(name = "") {
  return (name || "Usuario").split(" ")[0];
}

const typeOptions = [
  { label: "Liquidación", value: "payroll" },
  { label: "Contrato", value: "contract" },
  { label: "Certificado", value: "certificate" },
  { label: "Otro", value: "other" },
];
const labelDeTipo = (v) =>
  typeOptions.find((t) => t.value === v)?.label || v || "—";
const iconoTipo = (v) =>
  v === "payroll"
    ? "payments"
    : v === "contract"
    ? "feed"
    : v === "certificate"
    ? "workspace_premium"
    : "description";

const getTypeColor = (type) => {
  const colors = {
    payroll: "primary",
    contract: "secondary",
    certificate: "positive",
    other: "grey",
  };
  return colors[type] || "grey";
};

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");
const prettySize = (n) => {
  if (n == null) return "—";
  const kb = n / 1024,
    mb = kb / 1024;
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${Math.ceil(kb)} KB`;
};

function resolveEmployeeId() {
  // 1) prop > 2) userStore.user?._id o userStore.user?.id
  return props.employeeId ?? userStore?.user?._id ?? userStore?.user?.id;
}

/* ====== Cómputos ====== */
const rows = computed(() => store.byEmployee(resolveEmployeeId()));
const yearsOptions = computed(() => {
  const allPeriods = (store.items || []).map((d) => d.period).filter(Boolean);
  const years = Array.from(
    new Set(allPeriods.map((p) => (p || "").slice(0, 4)))
  )
    .filter(Boolean)
    .sort((a, b) => b - a)
    .map((year) => ({ label: year, value: year }));
  return years;
});
const rowsFiltradas = computed(() => {
  const t = tabType.value;
  const qq = (q.value || "").trim().toLowerCase();
  return rows.value
    .filter((r) => (t === "all" ? true : r.type === t))
    .filter(
      (r) => !year.value || (r.period || "").startsWith(String(year.value))
    )
    .filter((r) => !period.value || r.period === period.value)
    .filter(
      (r) =>
        !qq ||
        r.name?.toLowerCase().includes(qq) ||
        r.comment?.toLowerCase().includes(qq)
    )
    .sort(
      (a, b) =>
        (b.period || "").localeCompare(a.period || "") ||
        new Date(b.createdAt) - new Date(a.createdAt)
    );
});

const latestPayslip = computed(() => {
  return rows.value
    .filter((r) => r.type === "payroll" && r.period)
    .sort((a, b) => b.period.localeCompare(a.period))[0];
});

const hasActiveFilters = computed(() => {
  return (
    !!q.value || !!year.value || !!period.value || tabType.value !== "payroll"
  );
});

/* ====== Ciclo de vida ====== */
onMounted(() => {
  reload();
});

// Auto-scroll al cambiar filtros
watch([tabType, year, period], () => {
  if (rowsFiltradas.value.length > 0) {
    nextTick(scrollToList);
  }
});

/* ====== Acciones ====== */
async function reload() {
  try {
    loadingOn();
    await store.fetchByEmployee({
      employeeId: resolveEmployeeId(),
      period: period.value || undefined,
      type: tabType.value === "all" ? undefined : tabType.value,
      q: q.value || undefined,
    });
  } catch (e) {
    notifyErr(e);
  } finally {
    loadingOff();
  }
}

function limpiarFiltros() {
  q.value = "";
  year.value = null;
  period.value = "";
  tabType.value = "payroll";
  reload();
}

function scrollToList() {
  const el = listSection.value?.$el || listSection.value;
  if (el?.scrollIntoView) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function verDocumento(row) {
  try {
    loadingViewer.value = true;
    safeUrl.value = "";
    currentDoc.value = row;
    const url = await store.getSignedUrl(row.id);
    safeUrl.value = url;
    dialogViewer.value = true;
  } catch (e) {
    loadingViewer.value = false;
    notifyErr(e);
    dialogViewer.value = false;
  }
}

function onIframeLoaded() {
  loadingViewer.value = false;
}

async function descargarDocumento(row) {
  try {
    loadingOn();
    const url = await store.getSignedUrl(row.id);

    // Crear enlace temporal para descarga
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = row.name || "documento";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Notificación de éxito
    $q.notify({
      type: "positive",
      message: `Descargando ${row.name}`,
      timeout: 2000,
      position: "top",
    });
  } catch (e) {
    notifyErr(e);
  } finally {
    loadingOff();
  }
}

/* ====== KPI ====== */
function countByType(t) {
  return rowsFiltradas.value.filter((r) => r.type === t).length;
}

/* ====== UX helpers ====== */
function notifyErr(e) {
  const msg = e?.message || store.error || "Ocurrió un error";
  console.error("[EmployeeSelfDocuments]", e);
  $q.notify({
    type: "negative",
    message: msg,
    position: "top",
    timeout: 5000,
    actions: [{ icon: "close", color: "white" }],
  });
}

function loadingOn() {
  loadingUi.value = true;
}

function loadingOff() {
  loadingUi.value = false;
}
</script>

<style scoped lang="scss">
.rk-docs-card {
  border-radius: 16px;
  position: relative;
  transition: all 0.3s ease;
}

.rk-kpi {
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.hoverable {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
}

.rk-doc-card {
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;

  .q-card__section:first-child {
    flex-grow: 1;
  }
}

.rk-docs-viewer {
  background: #0b0b0b;
  color: #fff;
}

.rk-viewer-body {
  height: calc(100vh - 44px);
  padding: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rk-viewer-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: #1a1a1a;
}

// Mejoras de responsive
@media (max-width: 600px) {
  .rk-docs-card .q-card__section {
    padding: 16px;
  }

  .rk-kpi .q-card__section {
    padding: 12px;
  }
}

// Mejoras para modo oscuro
.body--dark {
  .rk-docs-card {
    background: #1e1e1e;
  }

  .rk-kpi {
    background: #2d2d2d;
    border-color: #404040;
  }

  .hoverable:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
}

// Utilidades de texto
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
