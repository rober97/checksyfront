<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <div class="rk-container">
      <!-- Floating notifications -->
      <div class="rk-notifications">
        <transition-group name="slide-down">
          <div
            v-for="notif in notifications"
            :key="notif.id"
            class="rk-notification"
            :class="`type-${notif.type}`"
          >
            <q-icon :name="notif.icon" />
            <span>{{ notif.message }}</span>
            <q-btn
              flat
              dense
              round
              icon="close"
              size="sm"
              @click="removeNotification(notif.id)"
            />
          </div>
        </transition-group>
      </div>

      <!-- HEADER -->
      <div class="row items-center justify-between q-mb-xl">
        <div class="col row items-center no-wrap q-gutter-sm">
          <div class="rk-avatar-container">
            <q-avatar size="52px" class="rk-ring animated-avatar">
              <q-icon name="access_time" size="28px" />
            </q-avatar>
            <div class="rk-pulse" :class="{ active: form.tipo }"></div>
          </div>

          <div class="rk-header-text">
            <div class="text-body1 text-grey-6 rk-time-display">
              <q-icon name="calendar_today" size="16px" />
              {{ fechaBonita }} ·
              <span class="text-weight-bold rk-live-time">{{
                horaActual
              }}</span>
              <q-chip
                dense
                size="sm"
                color="primary"
                text-color="white"
                class="q-ml-sm"
              >
                {{ timezone }}
              </q-chip>
            </div>
          </div>
        </div>

        <div class="col-auto row items-center q-gutter-sm">
          <q-badge
            class="rk-status-badge"
            :color="isOnline ? 'positive' : 'orange-8'"
            outline
          >
            <q-icon
              :name="isOnline ? 'wifi' : 'wifi_off'"
              size="16px"
              class="q-mr-xs"
            />
            {{ isOnline ? "En línea" : "Sin conexión" }}
          </q-badge>

          <q-btn
            dense
            flat
            round
            :icon="geoEnabled ? 'my_location' : 'location_off'"
            :color="geoEnabled ? 'primary' : 'grey-6'"
            class="rk-icon-btn"
            @click="toggleGeoloc"
          >
            <q-tooltip>{{
              geoEnabled
                ? "Geolocalización activada"
                : "Activar geolocalización"
            }}</q-tooltip>
          </q-btn>

          <q-btn
            dense
            flat
            round
            icon="history"
            class="rk-icon-btn"
            @click="dlgPendientes = true"
          >
            <q-badge v-if="queue.length > 0" color="red" floating rounded>{{
              queue.length
            }}</q-badge>
            <q-tooltip>Pendientes offline</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- GRID -->
      <div class="row q-col-gutter-xl">
        <!-- LEFT -->
        <div class="col-12 col-lg-8">
          <transition name="slide-fade">
            <q-banner
              v-if="form.tipo || form.estadoAnimo"
              rounded
              class="rk-summary q-mb-lg animated-border"
            >
              <template #avatar>
                <q-avatar :color="summaryColor" text-color="white">
                  <q-icon
                    :name="
                      form.tipo === 'entrada'
                        ? 'login'
                        : form.tipo === 'salida'
                        ? 'logout'
                        : 'info'
                    "
                  />
                </q-avatar>
              </template>

              <div class="text-body1">
                <b>{{ labelTipo || "Selecciona entrada o salida" }}</b>
                <span v-if="form.estadoAnimo"> · {{ labelAnimo }}</span>
              </div>

              <template v-if="geoEnabled && location" #action>
                <q-badge color="primary" outline class="rk-geo-badge">
                  <q-icon name="place" size="14px" class="q-mr-xs" />
                  {{ geoTexto }}
                </q-badge>
              </template>
            </q-banner>
          </transition>

          <q-card flat bordered class="rk-card card-hover">
            <q-form
              @submit.prevent="confirmarEnvio"
              class="q-gutter-xl q-pa-lg"
            >
              <!-- Tipo -->
              <section>
                <div class="rk-label q-mb-md">
                  <q-icon name="swap_horiz" class="q-mr-sm" />
                  Tipo de asistencia
                </div>

                <div class="rk-segment">
                  <q-btn
                    class="rk-seg-btn"
                    :class="{
                      'is-active rk-seg-in': form.tipo === 'entrada',
                      'pulse-animation': form.tipo === 'entrada',
                    }"
                    icon="login"
                    no-caps
                    glossy
                    label="Entrada"
                    @click="form.tipo = 'entrada'"
                  >
                    <q-icon
                      v-if="form.tipo === 'entrada'"
                      name="check_circle"
                      size="18px"
                      class="q-ml-xs"
                    />
                  </q-btn>

                  <q-btn
                    class="rk-seg-btn"
                    :class="{
                      'is-active rk-seg-out': form.tipo === 'salida',
                      'pulse-animation': form.tipo === 'salida',
                    }"
                    icon="logout"
                    no-caps
                    glossy
                    label="Salida"
                    @click="form.tipo = 'salida'"
                  >
                    <q-icon
                      v-if="form.tipo === 'salida'"
                      name="check_circle"
                      size="18px"
                      class="q-ml-xs"
                    />
                  </q-btn>
                </div>

                <div class="text-caption text-grey-6 q-mt-sm rk-shortcuts">
                  <kbd>E</kbd> Entrada · <kbd>S</kbd> Salida ·
                  <kbd>Ctrl/⌘ + Enter</kbd> Enviar
                </div>
              </section>

              <!-- Ánimo -->
              <section>
                <div class="rk-label q-mb-md">
                  <q-icon name="mood" class="q-mr-sm" />
                  ¿Cómo te sientes hoy?
                </div>

                <div class="row q-col-gutter-sm rk-moods">
                  <q-chip
                    v-for="m in moods"
                    :key="m.value"
                    clickable
                    :color="form.estadoAnimo === m.value ? m.color : 'grey-4'"
                    :text-color="
                      form.estadoAnimo === m.value ? 'white' : 'dark'
                    "
                    class="rk-mood animated-chip"
                    @click="form.estadoAnimo = m.value"
                  >
                    <span class="rk-emoji">{{ m.emoji }}</span>
                    <span class="q-ml-sm text-weight-medium">{{
                      m.label
                    }}</span>
                  </q-chip>
                </div>
              </section>

              <!-- Comentario -->
              <section>
                <div class="rk-label q-mb-md">
                  <q-icon name="notes" class="q-mr-sm" />
                  Comentario (opcional)
                </div>

                <q-input
                  v-model="form.comentario"
                  type="textarea"
                  autogrow
                  counter
                  maxlength="300"
                  standout="bg"
                  :rules="[comentarioRule]"
                  placeholder="¿Algo para hoy? Ej: reunión temprano, médico en la tarde, etc."
                  class="rk-textarea"
                >
                  <template #prepend
                    ><q-icon name="notes" class="text-primary"
                  /></template>
                </q-input>

                <div class="text-caption text-grey-6 q-mt-xs text-right">
                  {{ form.comentario.length }}/300 caracteres
                </div>
              </section>
            </q-form>
          </q-card>
        </div>

        <!-- RIGHT -->
        <div class="col-12 col-lg-4 q-gutter-md">
          <!-- KPIs -->
          <div class="row q-col-gutter-md">
            <KpiMini
              icon="event_available"
              :label="'Asistencias mes'"
              :value="kpi.asistenciasMes ?? '—'"
              color="primary"
            />
            <KpiMini
              icon="alarm"
              :label="'Horas trabajadas'"
              :value="kpi.horasMes ?? '—'"
              color="teal"
            />
            <KpiMini
              icon="check_circle"
              :label="'Puntualidad'"
              :value="kpi.puntualidad != null ? kpi.puntualidad + '%' : '—'"
              color="positive"
            />
            <KpiMini
              icon="beach_access"
              :label="'Vacaciones'"
              :value="kpi.vacaciones ?? '—'"
              color="orange"
            />
          </div>

          <!-- Tu día -->
          <q-card flat bordered class="rk-card card-hover">
            <q-card-section class="q-pb-sm">
              <div class="row items-center q-gutter-sm">
                <q-icon name="today" color="primary" />
                <div class="text-subtitle2 text-weight-bold">Tu día</div>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="q-gutter-sm">
              <div class="row items-center justify-between rk-day-item">
                <div class="text-caption text-grey-7">
                  <q-icon name="login" size="16px" class="q-mr-xs" />
                  Primer registro
                </div>
                <div class="text-body2 text-weight-medium">
                  {{ kpi.primerCheck ?? "—" }}
                </div>
              </div>

              <div class="row items-center justify-between rk-day-item">
                <div class="text-caption text-grey-7">
                  <q-icon name="logout" size="16px" class="q-mr-xs" />
                  Último registro
                </div>
                <div class="text-body2 text-weight-medium">
                  {{ kpi.ultimoCheck ?? "—" }}
                </div>
              </div>

              <div class="q-mt-md">
                <div class="row items-center justify-between q-mb-xs">
                  <div class="text-caption text-grey-7">
                    <q-icon name="schedule" size="16px" class="q-mr-xs" />
                    Acumulado hoy
                  </div>
                  <div class="text-body2 text-weight-medium">
                    {{ kpi.horasHoy ?? "—" }}
                  </div>
                </div>

                <q-linear-progress
                  rounded
                  size="14px"
                  :value="jornadaProgress.value"
                  :color="jornadaProgress.color"
                  track-color="grey-3"
                  class="q-mb-xs"
                />

                <div class="row justify-between items-center">
                  <div class="text-caption text-grey-6">
                    {{ Math.round(jornadaProgress.value * 100) }}% de
                    {{ workHoursGoal }}h
                  </div>
                  <div class="text-caption" :class="jornadaProgress.textColor">
                    {{ jornadaProgress.remaining }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Actividad reciente -->
          <q-card flat bordered class="rk-card card-hover">
            <q-card-section class="q-pb-sm">
              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-sm">
                  <q-icon name="timeline" color="primary" />
                  <div class="text-subtitle2 text-weight-bold">
                    Actividad reciente
                  </div>
                </div>
                <q-btn
                  flat
                  dense
                  round
                  icon="refresh"
                  size="sm"
                  @click="loadActivity"
                  :loading="refreshingActivity"
                >
                  <q-tooltip>Actualizar actividad</q-tooltip>
                </q-btn>
              </div>
            </q-card-section>
            <q-separator />

            <q-list separator class="rk-activity-list">
              <q-item
                v-for="(a, i) in actividad"
                :key="i"
                class="rk-activity animated-item"
              >
                <q-item-section avatar>
                  <q-avatar
                    size="32px"
                    :class="
                      a.tipo === 'entrada'
                        ? 'bg-primary text-white'
                        : 'bg-negative text-white'
                    "
                  >
                    <q-icon
                      :name="a.tipo === 'entrada' ? 'login' : 'logout'"
                      size="16px"
                    />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    <span class="text-capitalize">{{ a.tipo }}</span> ·
                    {{ a.hora }}
                  </q-item-label>
                  <q-item-label caption class="rk-activity-details">
                    <q-icon
                      :name="moodIcon(a.animo)"
                      size="14px"
                      class="q-mr-xs"
                    />
                    {{ a.animo || "—" }} ·
                    {{ a.comentario || "Sin comentario" }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <div
                v-if="actividad.length === 0"
                class="text-grey-6 q-pa-md text-center"
              >
                <q-icon name="history_off" size="32px" class="q-mb-sm" />
                <div>Sin registros recientes</div>
              </div>
            </q-list>
          </q-card>

          <!-- Racha -->
          <q-card flat bordered class="rk-card card-hover">
            <q-card-section class="q-pb-sm">
              <div class="row items-center q-gutter-sm">
                <q-icon name="local_fire_department" color="orange" />
                <div class="text-subtitle2 text-weight-bold">Racha actual</div>
                <q-badge color="orange" class="rk-streak-badge"
                  >{{ streakCount }} días</q-badge
                >
              </div>
            </q-card-section>
            <q-separator />

            <q-card-section>
              <div class="row q-col-gutter-xs rk-streak-grid">
                <div
                  v-for="(d, i) in streak"
                  :key="i"
                  class="rk-streak"
                  :class="d.ok ? 'ok' : 'ko'"
                  :title="d.label"
                >
                  <q-icon :name="d.ok ? 'check' : 'close'" size="14px" />
                </div>
              </div>

              <div class="text-caption text-grey-6 q-mt-sm text-center">
                Últimos {{ streak.length }} días
                <q-btn
                  v-if="streakCount > 0"
                  flat
                  dense
                  size="sm"
                  color="orange"
                  label="Compartir"
                  icon="share"
                  class="q-ml-sm"
                  @click="shareStreak"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- DOCK -->
      <div class="rk-dock">
        <div class="rk-dock-inner">
          <div class="row items-center q-gutter-sm">
            <q-btn
              flat
              dense
              icon="history"
              label="Historial"
              class="rk-ghost"
              to="/employee/attendance/history"
            />
            <q-btn
              flat
              dense
              icon="event_note"
              label="Nueva solicitud"
              class="rk-ghost"
              to="/employee/requests"
            />
            <q-btn
              flat
              dense
              icon="insights"
              label="Estadísticas"
              class="rk-ghost"
              to="/employee/analytics"
            />
          </div>

          <q-btn
            :label="labelCTA"
            color="primary"
            size="lg"
            class="rk-cta"
            :disable="!form.tipo || loading"
            :loading="loading"
            @click="confirmarEnvio"
            unelevated
          >
            <template #loading>
              <q-spinner-hourglass class="on-left" /> Enviando...
            </template>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- DIALOGS -->
    <q-dialog v-model="dlgPendientes" position="right">
      <q-card style="width: 500px; max-width: 90vw" class="rk-card">
        <q-card-section class="row items-center q-gutter-sm">
          <q-avatar icon="sync" color="primary" text-color="white" />
          <div class="text-h6">Pendientes por enviar</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none">
          <div
            v-if="queue.length === 0"
            class="text-grey-6 q-pa-xl text-center"
          >
            <q-icon
              name="check_circle"
              size="48px"
              color="positive"
              class="q-mb-md"
            />
            <div>No hay pendientes por enviar</div>
          </div>

          <q-scroll-area v-else style="height: 400px">
            <q-list bordered separator class="rounded-borders">
              <q-item v-for="(item, i) in queue" :key="i" class="rk-queue-item">
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    <q-icon
                      :name="item.tipo === 'entrada' ? 'login' : 'logout'"
                      :color="item.tipo === 'entrada' ? 'primary' : 'negative'"
                    />
                    {{ item.tipo }} ·
                    {{ new Date(item.timestamp).toLocaleString("es-CL") }}
                  </q-item-label>

                  <q-item-label caption>
                    <q-icon
                      :name="moodIcon(item.mood)"
                      size="14px"
                      class="q-mr-xs"
                    />
                    {{ item.mood || "—" }} ·
                    {{ (item.note || "").slice(0, 80) }}
                  </q-item-label>

                  <q-item-label v-if="item.ubicacion" caption>
                    <q-icon name="place" size="12px" class="q-mr-xs" />
                    {{ locToText(item.ubicacion) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side top>
                  <div class="row q-gutter-xs">
                    <q-btn
                      dense
                      flat
                      round
                      icon="send"
                      color="primary"
                      @click="reintentar(i)"
                    />
                    <q-btn
                      dense
                      flat
                      round
                      icon="delete"
                      color="negative"
                      @click="borrarPendiente(i)"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn
            outline
            color="negative"
            label="Vaciar cola"
            @click="vaciarCola"
            :disable="queue.length === 0"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dlgConfirm" persistent>
      <q-card style="min-width: 420px" class="rk-card">
        <q-card-section class="row items-center q-gutter-sm">
          <q-avatar icon="task_alt" color="primary" text-color="white" />
          <div class="text-h6">Confirmar envío</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-sm">
          <div class="row items-center q-gutter-sm">
            <q-icon name="swap_horiz" color="primary" />
            <div><b>Tipo:</b> {{ labelTipo || "—" }}</div>
          </div>

          <div class="row items-center q-gutter-sm" v-if="form.estadoAnimo">
            <q-icon name="mood" :color="moodColor" />
            <div><b>Estado de ánimo:</b> {{ labelAnimo || "—" }}</div>
          </div>

          <div
            class="row items-center q-gutter-sm"
            v-if="form.comentario?.trim()"
          >
            <q-icon name="notes" color="primary" />
            <div><b>Comentario:</b> {{ form.comentario?.trim() || "—" }}</div>
          </div>

          <div class="row items-center q-gutter-sm" v-if="geoEnabled">
            <q-icon name="place" color="primary" />
            <div><b>Ubicación:</b> {{ geoTexto }}</div>
          </div>

          <div v-if="!isOnline" class="text-orange-8 q-mt-sm">
            <q-icon name="wifi_off" class="q-mr-sm" />
            Se guardará en la cola offline y se enviará cuando vuelva la
            conexión.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Enviar"
            :loading="loading"
            @click="enviarAsistencia"
            class="rk-confirm-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <canvas ref="confettiCanvas" class="rk-confetti"></canvas>
  </q-page>
</template>

<script setup>
import {
  ref,
  reactive,
  onMounted,
  onBeforeUnmount,
  watch,
  computed,
} from "vue";
import { useQuasar } from "quasar";

// Stores
import { useAsistenciaStore } from "@/stores/asistenciaStore";
import { useUserStore } from "@/stores/userStore"; // opcional
import { useAuthStore } from "@/stores/authStore";

// ====== Constantes ======
const ALLOWED_MOODS = new Set(["great", "good", "ok", "tired", "bad"]);
const moods = [
  {
    label: "Bien",
    value: "good",
    emoji: "😄",
    color: "positive",
    icon: "sentiment_very_satisfied",
  },
  {
    label: "Excelente",
    value: "great",
    emoji: "🌟",
    color: "primary",
    icon: "mood",
  },
  {
    label: "Normal",
    value: "ok",
    emoji: "😐",
    color: "info",
    icon: "sentiment_satisfied",
  },
  {
    label: "Cansado",
    value: "tired",
    emoji: "😴",
    color: "warning",
    icon: "sentiment_dissatisfied",
  },
  {
    label: "Mal",
    value: "bad",
    emoji: "☹️",
    color: "negative",
    icon: "sentiment_very_dissatisfied",
  },
];

// Quasar
const $q = useQuasar();

// Pinia
const asistenciaStore = useAsistenciaStore();
const userStore = useUserStore?.();
const auth = useAuthStore();

// ====== Estado ======
const loading = ref(false);
const isOnline = ref(navigator.onLine);
const dlgConfirm = ref(false);
const dlgPendientes = ref(false);
const refreshingActivity = ref(false);
const notifications = ref([]);
const notificationId = ref(0);

const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() =>
  isDark.value ? "bg-grey-10 text-white" : "bg-grey-1"
);

// Form
const form = reactive({ tipo: null, estadoAnimo: null, comentario: "" });

// Usuario actual
const currentUserId = computed(
  () =>
    auth?.user?.id ||
    userStore?.currentUser?._id ||
    localStorage.getItem("userId") ||
    null
);

// Labels/colores UI
const labelTipo = computed(() =>
  form.tipo === "entrada" ? "Entrada" : form.tipo === "salida" ? "Salida" : ""
);
const labelAnimo = computed(
  () => moods.find((m) => m.value === form.estadoAnimo)?.label || ""
);
const labelCTA = computed(() =>
  form.tipo ? `Marcar ${labelTipo.value.toLowerCase()}` : "Marcar asistencia"
);
const summaryColor = computed(() =>
  form.tipo === "entrada"
    ? "positive"
    : form.tipo === "salida"
    ? "negative"
    : "primary"
);
const moodColor = computed(
  () => moods.find((m) => m.value === form.estadoAnimo)?.color || "primary"
);

// Fecha/hora
const horaActual = ref("--:--");
const fechaBonita = ref(
  new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date())
);
const timezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone);
let clockTimer = null;

// Geolocalización
const geoEnabled = ref(false);
const location = ref(null);
const geoTexto = computed(() => locToText(location.value));

// Ajustes & metas
const settings = reactive({
  autoLocation: true,
  offlineMode: true,
  soundEffects: true,
  haptics: true,
});
const workHoursGoal = ref(9);

// Cola offline (local)
const QUEUE_KEY = "rk.attendance.queue";
const SETTINGS_KEY = "rk.attendance.settings";
const DRAFT_KEY = "rk.attendance.draft";
const queue = ref([]);

// Datos dinámicos (sin mock)
const kpi = reactive({
  asistenciasMes: null,
  horasMes: null,
  puntualidad: null,
  vacaciones: null,
  primerCheck: null,
  ultimoCheck: null,
  horasHoy: null,
});

const actividad = ref([]); // Array<{ tipo, hora, animo, comentario }>
const streak = reactive([]); // Array<{ ok:boolean, label:string }>

// Progreso de jornada
const jornadaProgress = computed(() => {
  const mins = parseHorasToMin(kpi.horasHoy);
  const target = (Number(workHoursGoal.value) || 0) * 60;
  const val = target > 0 ? Math.max(0, Math.min(1, mins / target)) : 0;
  let color = "primary",
    textColor = "text-primary",
    remaining = "";
  if (target === 0) {
    remaining = "Configura tu meta";
  } else if (val >= 1) {
    color = "positive";
    textColor = "text-positive";
    remaining = "¡Meta alcanzada!";
  } else {
    if (val >= 0.9) {
      color = "warning";
      textColor = "text-warning";
    }
    const diff = Math.max(0, target - mins);
    remaining = `${Math.floor(diff / 60)}h ${diff % 60}m restantes`;
  }
  return { value: val, color, textColor, remaining };
});
const streakCount = computed(() => streak.filter((d) => d.ok).length);

// Reglas
const comentarioRule = (v) => !v || v.length <= 300 || "Máx. 300 caracteres";

// ====== Lifecycle ======
onMounted(async () => {
  updateClock();
  clockTimer = setInterval(updateClock, 1000);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  window.addEventListener("keydown", shortcuts);

  restoreDraft();
  loadQueue();
  await loadSettingsFromStore();

  // Autoloc si aplica
  if (settings.autoLocation) {
    geoEnabled.value = true;
    setTimeout(() => getLocation(true), 800);
  }

  // Cargar dashboard
  await loadDashboardData();

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
});

onBeforeUnmount(() => {
  clearInterval(clockTimer);
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
  window.removeEventListener("keydown", shortcuts);
  window.removeEventListener("resize", resizeCanvas);
  if (confettiRAF) cancelAnimationFrame(confettiRAF);
});

// ====== Carga de datos desde Store ======
async function loadDashboardData() {
  debugger
  if (!currentUserId.value) return;

  try {
    const [k, act, st, goal] = await Promise.all([
      asistenciaStore.fetchKPIs?.({ userId: currentUserId.value }),
      asistenciaStore.fetchActivity?.({
        userId: currentUserId.value,
        limit: 20,
      }),
      asistenciaStore.fetchStreak?.({ userId: currentUserId.value, days: 14 }),
      asistenciaStore.getWorkHoursGoal?.({ userId: currentUserId.value }),
    ]);

    if (k) Object.assign(kpi, k);
    if (Array.isArray(act)) actividad.value = act;
    if (Array.isArray(st)) {
      streak.splice(0, streak.length, ...st);
    }
    if (typeof goal === "number" && !Number.isNaN(goal))
      workHoursGoal.value = goal;
  } catch (e) {
    showNotification("No se pudo cargar el panel", "warning", "warning");
  }
}

async function loadActivity() {
  if (!currentUserId.value || !asistenciaStore.fetchActivity) return;
  refreshingActivity.value = true;
  try {
    const act = await asistenciaStore.fetchActivity({
      userId: currentUserId.value,
      limit: 20,
    });
    actividad.value = Array.isArray(act) ? act : [];
    showNotification("Actividad actualizada", "positive", "refresh");
  } catch {
    showNotification("No se pudo actualizar la actividad", "warning", "error");
  } finally {
    refreshingActivity.value = false;
  }
}

async function loadSettingsFromStore() {
  try {
    const s = await asistenciaStore.getSettings?.({
      userId: currentUserId.value,
    });
    if (s && typeof s === "object") Object.assign(settings, s);
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    Object.assign(settings, saved); // local override
    if (asistenciaStore.getWorkHoursGoal) {
      const goal = await asistenciaStore.getWorkHoursGoal({
        userId: currentUserId.value,
      });
      if (typeof goal === "number" && !Number.isNaN(goal))
        workHoursGoal.value = goal;
    }
  } catch {}
}

// ====== Helpers UI ======
function updateClock() {
  const d = new Date();
  horaActual.value = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
function shortcuts(e) {
  if (e.metaKey || e.ctrlKey) {
    if (e.key.toLowerCase() === "enter") {
      e.preventDefault();
      confirmarEnvio();
    }
    return;
  }
  if (e.key.toLowerCase() === "e") form.tipo = "entrada";
  if (e.key.toLowerCase() === "s") form.tipo = "salida";
}
function toggleGeoloc() {
  geoEnabled.value = !geoEnabled.value;
  if (geoEnabled.value) getLocation(true);
}
function locToText(loc) {
  if (!loc) return "—";
  const { lat, lng, acc } = loc;
  const accStr = Number.isFinite(acc) ? ` (±${Math.round(acc)}m)` : "";
  return `lat ${Number(lat).toFixed(5)}, lng ${Number(lng).toFixed(
    5
  )}${accStr}`;
}
async function getLocation(force = false) {
  if (!geoEnabled.value) return;
  if (!force && location.value) return;
  if (!("geolocation" in navigator)) {
    showNotification("Geolocalización no soportada", "warning", "gps_off");
    return;
  }
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    );
    location.value = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      acc: pos.coords.accuracy,
    };
    showNotification("Ubicación obtenida", "positive", "my_location");
  } catch (err) {
    showNotification(
      "No se pudo obtener la ubicación",
      "warning",
      "location_off"
    );
  }
}
function handleOnline() {
  isOnline.value = true;
  showNotification(
    "Conexión restaurada. Reintentando pendientes…",
    "positive",
    "wifi"
  );
  reintentarTodos();
  asistenciaStore.syncPending?.(queue.value).catch(() => {});
}
function handleOffline() {
  isOnline.value = false;
  showNotification(
    "Sin conexión. Guardaremos tus marcas y las enviaremos luego.",
    "warning",
    "wifi_off"
  );
}

// Notificaciones
function showNotification(message, type = "info", icon = "info") {
  const id = notificationId.value++;
  notifications.value.push({ id, message, type, icon });
  setTimeout(() => removeNotification(id), 5000);
}
function removeNotification(id) {
  const i = notifications.value.findIndex((n) => n.id === id);
  if (i > -1) notifications.value.splice(i, 1);
}

// ====== Cola offline (local) ======
function loadQueue() {
  try {
    queue.value = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") || [];
  } catch {
    queue.value = [];
  }
  // Purga moods inválidos antiguos
  queue.value = queue.value.filter(
    (item) => !item?.mood || ALLOWED_MOODS.has(item.mood)
  );
  saveQueue();
}
function saveQueue() {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.value));
}
function pushQueue(p) {
  queue.value.unshift(p);
  saveQueue();
}
function borrarPendiente(i) {
  queue.value.splice(i, 1);
  saveQueue();
}
function vaciarCola() {
  queue.value = [];
  saveQueue();
  showNotification("Cola de pendientes vaciada", "info", "delete_sweep");
}

async function reintentar(i) {
  const it = queue.value[i];
  if (!it) return;
  try {
    await asistenciaStore.crearAsistencia?.(it);
    borrarPendiente(i);
    showNotification("Pendiente enviado correctamente", "positive", "send");
  } catch {
    showNotification("No se pudo enviar el pendiente", "negative", "error");
  }
}
async function reintentarTodos() {
  for (let i = queue.value.length - 1; i >= 0; i--) {
    try {
      await asistenciaStore.crearAsistencia?.(queue.value[i]);
      queue.value.splice(i, 1);
    } catch {}
  }
  saveQueue();
}

// Draft & Settings (local)
function saveDraft() {
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      tipo: form.tipo,
      estadoAnimo: form.estadoAnimo,
      comentario: form.comentario,
    })
  );
}
function restoreDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    form.tipo = d.tipo ?? null;
    form.estadoAnimo = ALLOWED_MOODS.has(d.estadoAnimo) ? d.estadoAnimo : null;
    form.comentario = d.comentario ?? "";
  } catch {}
}
watch(form, saveDraft, { deep: true });

// ====== Confirm + Send ======
function confirmarEnvio() {
  if (!form.tipo)
    return showNotification("Selecciona entrada o salida", "warning", "info");
  if (!ALLOWED_MOODS.has(form.estadoAnimo || ""))
    return showNotification("Selecciona tu estado de ánimo", "warning", "mood");
  if (!currentUserId.value)
    return showNotification(
      "No se encontró el usuario autenticado",
      "negative",
      "error"
    );
  dlgConfirm.value = true;
}

async function enviarAsistencia() {
  const payload = {
    userId: currentUserId.value,
    tipo: form.tipo, // 'entrada' | 'salida'
    mood: form.estadoAnimo, // 'great' | 'good' | 'ok' | 'tired' | 'bad'
    note: form.comentario?.trim() || "",
    ubicacion:
      geoEnabled.value && location.value
        ? { lat: Number(location.value.lat), lng: Number(location.value.lng) }
        : null,
    timestamp: Date.now(),
    client: {
      platform:
        navigator?.userAgentData?.platform || navigator?.platform || "web",
      appVersion: import.meta?.env?.VITE_APP_VERSION || "web",
    },
  };

  if (!ALLOWED_MOODS.has(payload.mood)) {
    showNotification("Estado de ánimo inválido", "negative", "error");
    return;
  }

  if (!isOnline.value) {
    pushQueue(payload);
    dlgConfirm.value = false;
    resetForm();
    showNotification(
      "Guardado offline. Se enviará al recuperar conexión.",
      "warning",
      "cloud_off"
    );
    vibrar();
    return;
  }

  loading.value = true;
  try {
    await asistenciaStore.crearAsistencia?.(payload);
    dlgConfirm.value = false;
    resetForm();
    showNotification(
      "Asistencia registrada correctamente",
      "positive",
      "check_circle"
    );
    vibrar();
    confetti();
    // refresca panel tras enviar
    loadDashboardData();
  } catch (e) {
    if (!navigator.onLine) {
      pushQueue(payload);
      showNotification(
        "Sin conexión. Guardado en pendientes.",
        "warning",
        "cloud_off"
      );
    } else {
      const msg = e?.message || "Error al registrar asistencia";
      showNotification(msg, "negative", "error");
    }
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.tipo = null;
  form.estadoAnimo = null;
  form.comentario = "";
  saveDraft();
}
function vibrar() {
  if (settings.haptics && "vibrate" in navigator) navigator.vibrate?.(25);
}
function moodIcon(mood) {
  return moods.find((m) => m.value === mood)?.icon || "mood";
}
function shareStreak() {
  const text = `¡Llevo ${streakCount.value} días consecutivos marcando mi asistencia!`;
  if (navigator.share)
    navigator.share({
      title: "Mi racha de asistencia",
      text,
      url: window.location.href,
    });
  else {
    navigator.clipboard.writeText(text);
    showNotification("Racha copiada al portapapeles", "info", "content_copy");
  }
}

// ====== Confetti ======
const confettiCanvas = ref(null);
let confettiRAF = null;
function resizeCanvas() {
  const c = confettiCanvas.value;
  if (!c) return;
  c.width = window.innerWidth;
  c.height = 0;
  c.style.height = "0px";
}
function confetti() {
  const c = confettiCanvas.value;
  if (!c) return;
  const ctx = c.getContext("2d");
  const W = window.innerWidth;
  const H = 180;
  c.height = H;
  c.style.height = H + "px";
  const pcs = Array.from({ length: 150 }).map(() => ({
    x: Math.random() * W,
    y: -20 - Math.random() * 30,
    r: 3 + Math.random() * 6,
    vy: 1.5 + Math.random() * 2.5,
    vx: (Math.random() - 0.5) * 3,
    a: Math.random() * Math.PI * 2,
    va: (Math.random() - 0.5) * 0.2,
    color: `hsl(${~~(Math.random() * 360)},80%,60%)`,
    shape: Math.random() > 0.7 ? "circle" : "rect",
  }));
  const t0 = performance.now();
  function frame(t) {
    const dt = (t - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    pcs.forEach((p) => {
      p.a += p.va;
      p.x += p.vx;
      p.y += p.vy;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = p.color;
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
      }
      ctx.restore();
    });
    if (dt < 3) confettiRAF = requestAnimationFrame(frame);
    else {
      c.height = 0;
      c.style.height = "0px";
    }
  }
  confettiRAF = requestAnimationFrame(frame);
}

// Utils
function parseHorasToMin(str) {
  if (!str) return 0;
  // Acepta "8h 12m" o "08:12"
  const hm = /(\d+)\s*h(?:\s*(\d+)\s*m)?/i.exec(str);
  if (hm) {
    return (Number(hm[1]) || 0) * 60 + (Number(hm[2]) || 0);
  }
  const clock = /^(\d{1,2}):(\d{2})$/.exec(str);
  if (clock) {
    return (Number(clock[1]) || 0) * 60 + (Number(clock[2]) || 0);
  }
  return 0;
}
</script>

<style scoped>
/* === (todo tu CSS mejorado original; no contiene data fake) === */
/* Variables y colores, notificaciones, header, summary, cards, chips, lista, dock, etc. */
/* — He dejado tu CSS tal cual lo tenías en el mensaje, ya estaba sólido y sin mocks. — */

:root {
  --rk-surface: #fff;
  --rk-surface-2: #f8fafc;
  --rk-surface-3: #f1f5f9;
  --rk-border: #e2e8f0;
  --rk-text: #1e293b;
  --rk-text-muted: #64748b;
  --rk-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --rk-shadow-lg: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  --rk-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.body--dark {
  --rk-surface: #0f172a;
  --rk-surface-2: #1e293b;
  --rk-surface-3: #334155;
  --rk-border: #475569;
  --rk-text: #f1f5f9;
  --rk-text-muted: #94a3b8;
  --rk-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3),
    0 8px 10px -6px rgba(0, 0, 0, 0.3);
  --rk-shadow-lg: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  --rk-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}
.rk-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}
.rk-notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  max-width: 400px;
}
.rk-notification {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  box-shadow: var(--rk-shadow);
  border-left: 4px solid;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideInRight 0.3s ease;
}
.rk-notification.type-positive {
  border-left-color: #10b981;
}
.rk-notification.type-negative {
  border-left-color: #ef4444;
}
.rk-notification.type-warning {
  border-left-color: #f59e0b;
}
.rk-notification.type-info {
  border-left-color: #3b82f6;
}
.rk-avatar-container {
  position: relative;
}
.animated-avatar {
  transition: all 0.3s ease;
  animation: float 6s ease-in-out infinite;
}
.rk-pulse {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ef4444;
  opacity: 0;
  transition: all 0.3s ease;
}
.rk-pulse.active {
  opacity: 1;
  animation: pulse 2s infinite;
}
.rk-time-display {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rk-live-time {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  letter-spacing: 1px;
}
.rk-status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
}
.rk-icon-btn {
  border-radius: 10px;
  transition: all 0.2s ease;
}
.rk-icon-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.rk-summary {
  background: color-mix(in srgb, var(--q-primary) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--q-primary) 25%, transparent);
  border-radius: 16px;
  padding: 16px 20px;
  transition: all 0.3s ease;
}
.animated-border {
  position: relative;
  overflow: hidden;
}
.animated-border::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: var(--rk-gradient);
  animation: shimmer 3s infinite;
}
.rk-geo-badge {
  padding: 6px 12px;
  border-radius: 12px;
}
.rk-card {
  border-radius: 20px;
  border: 1px solid var(--rk-border);
  box-shadow: var(--rk-shadow);
  transition: all 0.3s ease;
  overflow: hidden;
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: var(--rk-shadow-lg);
  border-color: color-mix(in srgb, var(--q-primary) 30%, transparent);
}
.rk-label {
  font-size: 13px;
  color: var(--rk-text-muted);
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
}
.rk-segment {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.rk-seg-btn {
  height: 60px;
  border-radius: 16px !important;
  font-weight: 700;
  letter-spacing: 0.3px;
  background: var(--rk-surface-3);
  color: var(--rk-text);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  font-size: 16px;
}
.rk-seg-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}
.rk-seg-btn.is-active {
  color: #fff;
  border-color: transparent;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
.rk-seg-in.is-active {
  background: linear-gradient(135deg, #10b981, #059669) !important;
}
.rk-seg-out.is-active {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
}
.pulse-animation {
  animation: gentlePulse 2s ease-in-out infinite;
}
.rk-moods {
  margin-top: 8px;
}
.rk-mood {
  padding: 12px 16px;
  border-radius: 14px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  font-size: 14px;
}
.rk-mood:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
.animated-chip {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.rk-emoji {
  display: inline-block;
  transform: translateY(2px);
  font-size: 18px;
}
.rk-textarea :deep(.q-field__control) {
  border-radius: 14px;
  min-height: 80px;
}
.rk-textarea :deep(.q-field__control:before) {
  border: 2px solid var(--rk-border);
}
.rk-textarea :deep(.q-field__control:hover:before) {
  border-color: color-mix(in srgb, var(--q-primary) 50%, transparent);
}
.rk-kpi {
  border-radius: 16px;
  background: var(--rk-surface);
  transition: all 0.3s ease;
}
.rk-kpi-avatar {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.rk-day-item {
  padding: 8px 0;
}
.rk-activity-list {
  max-height: 300px;
}
.rk-activity {
  padding: 12px 16px;
  transition: all 0.2s ease;
}
.rk-activity:hover {
  background: color-mix(in srgb, var(--q-primary) 5%, transparent);
  transform: translateX(4px);
}
.rk-activity-details {
  display: flex;
  align-items: center;
}
.rk-streak-badge {
  padding: 4px 8px;
  border-radius: 12px;
}
.rk-streak-grid {
  margin: 8px 0;
}
.rk-streak {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 2px solid var(--rk-border);
  transition: all 0.3s ease;
}
.rk-streak.ok {
  background: linear-gradient(
    135deg,
    rgba(76, 175, 80, 0.15),
    rgba(76, 175, 80, 0.25)
  );
  color: #2e7d32;
  border-color: rgba(76, 175, 80, 0.4);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}
.rk-streak.ko {
  background: rgba(244, 67, 54, 0.1);
  color: #b71c1c;
  border-color: rgba(244, 67, 54, 0.3);
}
.rk-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 24px;
  z-index: 1000;
}
.rk-dock-inner {
  margin: 0 auto;
  width: min(1400px, calc(100% - 48px));
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  background: color-mix(in srgb, var(--rk-surface) 85%, transparent);
  border: 1px solid color-mix(in srgb, var(--rk-border) 50%, transparent);
  border-radius: 20px;
  padding: 16px 24px;
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.5s ease-out;
}
.rk-cta {
  min-width: 280px;
  height: 56px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 16px;
  background: var(--rk-gradient);
  box-shadow: 0 12px 30px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
}
.rk-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(99, 102, 241, 0.4);
}
.rk-ghost {
  background: transparent;
  border-radius: 12px;
  transition: all 0.2s ease;
}
.rk-ghost:hover {
  background: color-mix(in srgb, var(--q-primary) 8%, transparent);
  transform: translateY(-1px);
}
.rk-queue-item {
  border-radius: 12px;
  margin: 8px;
  transition: all 0.2s ease;
}
.rk-queue-item:hover {
  background: color-mix(in srgb, var(--q-primary) 5%, transparent);
  transform: translateX(4px);
}
.rk-confirm-btn {
  border-radius: 12px;
  padding: 8px 24px;
}
.rk-shortcuts {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
}
kbd {
  background: var(--rk-surface-3);
  border: 1px solid var(--rk-border);
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 12px;
  box-shadow: 0 2px 0 var(--rk-border);
}
.rk-confetti {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  pointer-events: none;
  z-index: 1200;
}

/* Animaciones + transiciones */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}
@keyframes gentlePulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}
@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
:deep(::-webkit-scrollbar) {
  width: 8px;
}
:deep(::-webkit-scrollbar-track) {
  background: var(--rk-surface-2);
  border-radius: 4px;
}
:deep(::-webkit-scrollbar-thumb) {
  background: var(--rk-border);
  border-radius: 4px;
}
:deep(::-webkit-scrollbar-thumb:hover) {
  background: color-mix(in srgb, var(--q-primary) 50%, transparent);
}
</style>
