<template>
  <q-page class="rk-attendance-page">
    <!-- Background Effects -->
    <div class="rk-page-bg">
      <div class="rk-grid-pattern"></div>
      <div class="rk-glow-orb rk-orb-1"></div>
      <div class="rk-glow-orb rk-orb-2"></div>
    </div>

    <!-- Floating Notifications -->
    <div class="rk-notifications">
      <transition-group name="slide-down">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          class="rk-notification"
          :class="`type-${notif.type}`"
        >
          <div class="rk-notif-icon">
            <q-icon :name="notif.icon" />
          </div>
          <span class="rk-notif-text">{{ notif.message }}</span>
          <q-btn flat dense round icon="close" size="sm" @click="removeNotification(notif.id)" class="rk-notif-close" />
        </div>
      </transition-group>
    </div>

    <div class="rk-container">
      <!-- Header Premium -->
      <div class="rk-header">
        <div class="rk-header-left">
          <div class="rk-avatar-wrapper">
            <div class="rk-avatar-ring" :class="{ active: form.tipo }">
              <q-avatar size="60px" class="rk-avatar">
                <q-icon name="access_time" size="32px" />
              </q-avatar>
            </div>
            <div class="rk-pulse-dot" :class="{ active: form.tipo }"></div>
          </div>

          <div class="rk-header-info">
            <div class="rk-date-time">
              <q-icon name="calendar_today" size="18px" />
              <span class="rk-date">{{ fechaBonita }}</span>
            </div>
            <div class="rk-live-clock">
              <span class="rk-time">{{ horaActual }}</span>
              <q-chip dense size="sm" class="rk-timezone-chip">{{ timezone }}</q-chip>
            </div>
          </div>
        </div>

        <div class="rk-header-right">
          <q-badge class="rk-status-badge" :class="{ online: isOnline }">
            <q-icon :name="isOnline ? 'wifi' : 'wifi_off'" size="16px" />
            <span>{{ isOnline ? "En línea" : "Sin conexión" }}</span>
          </q-badge>

          <button class="rk-icon-btn" :class="{ active: geoEnabled }" @click="toggleGeoloc">
            <q-icon :name="geoEnabled ? 'my_location' : 'location_off'" />
            <q-tooltip>{{ geoEnabled ? "Geolocalización activada" : "Activar geolocalización" }}</q-tooltip>
          </button>

          <button class="rk-icon-btn rk-icon-btn-badge" @click="dlgPendientes = true">
            <q-icon name="history" />
            <div v-if="queue.length > 0" class="rk-badge-dot">{{ queue.length }}</div>
            <q-tooltip>Pendientes offline</q-tooltip>
          </button>
        </div>
      </div>

      <!-- Summary Banner -->
      <transition name="slide-fade">
        <div v-if="form.tipo || form.estadoAnimo" class="rk-summary-banner">
          <div class="rk-summary-icon" :class="`type-${form.tipo}`">
            <q-icon :name="form.tipo === 'entrada' ? 'login' : form.tipo === 'salida' ? 'logout' : 'info'" />
          </div>
          <div class="rk-summary-content">
            <div class="rk-summary-kicker">Resumen de asistencia</div>
            <div class="rk-summary-heading">
              <strong class="rk-summary-title">{{ labelTipo || "Selecciona una opción" }}</strong>
              <span v-if="form.estadoAnimo" class="rk-summary-subtitle">{{ labelAnimo }}</span>
            </div>
            <div class="rk-summary-help">
              Revisa los datos y usa el botón principal para confirmar el marcaje.
            </div>
          </div>
          <div v-if="geoEnabled && location" class="rk-summary-geo">
            <q-icon name="place" size="16px" />
            <span>{{ geoTexto }}</span>
          </div>
        </div>
      </transition>

      <!-- Main Grid -->
      <div class="rk-main-grid">
        <!-- Left Column - Form -->
        <div class="rk-form-section">
          <div class="rk-form-card">
            <q-form @submit.prevent="confirmarEnvio" class="rk-form">
              <!-- Tipo de Asistencia -->
              <section class="rk-form-section-item">
                <div class="rk-section-header">
                  <div class="rk-section-icon"><q-icon name="swap_horiz" /></div>
                  <h3 class="rk-section-title">Tipo de asistencia</h3>
                </div>

                <div class="rk-type-selector">
                  <button type="button" class="rk-type-btn" :class="{ active: form.tipo === 'entrada', 'type-entrada': form.tipo === 'entrada' }" @click="form.tipo = 'entrada'">
                    <div class="rk-type-icon"><q-icon name="login" /></div>
                    <span class="rk-type-label">Entrada</span>
                    <div v-if="form.tipo === 'entrada'" class="rk-type-check"><q-icon name="check_circle" /></div>
                    <div class="rk-type-shine"></div>
                  </button>

                  <button type="button" class="rk-type-btn" :class="{ active: form.tipo === 'salida', 'type-salida': form.tipo === 'salida' }" @click="form.tipo = 'salida'">
                    <div class="rk-type-icon"><q-icon name="logout" /></div>
                    <span class="rk-type-label">Salida</span>
                    <div v-if="form.tipo === 'salida'" class="rk-type-check"><q-icon name="check_circle" /></div>
                    <div class="rk-type-shine"></div>
                  </button>
                </div>

                <div class="rk-shortcuts-hint">
                  <kbd>E</kbd> Entrada · <kbd>S</kbd> Salida · <kbd>Ctrl/⌘ + Enter</kbd> Enviar
                </div>
              </section>

              <!-- Estado de Ánimo -->
              <section class="rk-form-section-item">
                <div class="rk-section-header">
                  <div class="rk-section-icon"><q-icon name="mood" /></div>
                  <h3 class="rk-section-title">¿Cómo te sientes hoy?</h3>
                </div>

                <div class="rk-moods-grid">
                  <button
                    type="button"
                    v-for="m in moods"
                    :key="m.value"
                    class="rk-mood-btn"
                    :class="{ active: form.estadoAnimo === m.value, [`mood-${m.value}`]: form.estadoAnimo === m.value }"
                    @click="form.estadoAnimo = m.value"
                  >
                    <span class="rk-mood-emoji">{{ m.emoji }}</span>
                    <span class="rk-mood-label">{{ m.label }}</span>
                  </button>
                </div>
              </section>

              <!-- Comentario -->
              <section class="rk-form-section-item">
                <div class="rk-section-header">
                  <div class="rk-section-icon"><q-icon name="notes" /></div>
                  <h3 class="rk-section-title">Comentario (opcional)</h3>
                </div>

                <q-input
                  v-model="form.comentario"
                  type="textarea"
                  autogrow
                  counter
                  maxlength="300"
                  standout
                  :rules="[comentarioRule]"
                  placeholder="¿Algo para hoy? Ej: reunión temprano, médico en la tarde, etc."
                  class="rk-textarea"
                >
                  <template #prepend><q-icon name="edit_note" /></template>
                </q-input>

                <div class="rk-char-counter">{{ form.comentario.length }}/300 caracteres</div>
              </section>
            </q-form>
          </div>
        </div>

        <!-- Right Column - Info Cards -->
        <div class="rk-info-section">
          <!-- KPIs Mini -->
          <div class="rk-kpis-grid">
            <div class="rk-kpi-mini">
              <div class="rk-kpi-icon rk-icon-primary"><q-icon name="event_available" /></div>
              <div class="rk-kpi-content">
                <span class="rk-kpi-label">Asistencias mes</span>
                <strong class="rk-kpi-value">{{ kpi.asistenciasMes ?? '—' }}</strong>
              </div>
            </div>
            <div class="rk-kpi-mini">
              <div class="rk-kpi-icon rk-icon-teal"><q-icon name="alarm" /></div>
              <div class="rk-kpi-content">
                <span class="rk-kpi-label">Horas trabajadas</span>
                <strong class="rk-kpi-value">{{ kpi.horasMes ?? '—' }}</strong>
              </div>
            </div>
            <div class="rk-kpi-mini">
              <div class="rk-kpi-icon rk-icon-green"><q-icon name="check_circle" /></div>
              <div class="rk-kpi-content">
                <span class="rk-kpi-label">Puntualidad</span>
                <strong class="rk-kpi-value">{{ kpi.puntualidad != null ? kpi.puntualidad + '%' : '—' }}</strong>
              </div>
            </div>
            <div class="rk-kpi-mini">
              <div class="rk-kpi-icon rk-icon-orange"><q-icon name="beach_access" /></div>
              <div class="rk-kpi-content">
                <span class="rk-kpi-label">Vacaciones</span>
                <strong class="rk-kpi-value">{{ kpi.vacaciones ?? '—' }}</strong>
              </div>
            </div>
          </div>

          <!-- Tu Día -->
          <div class="rk-info-card">
            <div class="rk-card-header">
              <div class="rk-card-header-icon"><q-icon name="today" /></div>
              <h4 class="rk-card-title">Tu día</h4>
            </div>
            <div class="rk-card-body">
              <div class="rk-day-item">
                <div class="rk-day-label"><q-icon name="login" size="16px" /><span>Primer registro</span></div>
                <strong class="rk-day-value">{{ kpi.primerCheck ?? "—" }}</strong>
              </div>
              <div class="rk-day-item">
                <div class="rk-day-label"><q-icon name="logout" size="16px" /><span>Último registro</span></div>
                <strong class="rk-day-value">{{ kpi.ultimoCheck ?? "—" }}</strong>
              </div>
              <div class="rk-progress-section">
                <div class="rk-progress-header">
                  <div class="rk-progress-label"><q-icon name="schedule" size="16px" /><span>Acumulado hoy</span></div>
                  <strong class="rk-progress-value">{{ kpi.horasHoy ?? "—" }}</strong>
                </div>
                <div class="rk-progress-bar-wrapper">
                  <div class="rk-progress-bar">
                    <div class="rk-progress-fill" :class="`color-${jornadaProgress.color}`" :style="{ width: `${jornadaProgress.value * 100}%` }">
                      <div class="rk-progress-shine"></div>
                    </div>
                  </div>
                </div>
                <div class="rk-progress-footer">
                  <span class="rk-progress-percent">{{ Math.round(jornadaProgress.value * 100) }}% de {{ workHoursGoal }}h</span>
                  <span class="rk-progress-remaining" :class="jornadaProgress.textColor">{{ jornadaProgress.remaining }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actividad Reciente -->
          <div class="rk-info-card">
            <div class="rk-card-header">
              <div class="rk-card-header-content">
                <div class="rk-card-header-icon"><q-icon name="timeline" /></div>
                <h4 class="rk-card-title">Actividad reciente</h4>
              </div>
              <button class="rk-refresh-btn" @click="loadActivity" :disabled="refreshingActivity">
                <q-icon name="refresh" :class="{ 'rotate-animation': refreshingActivity }" />
                <q-tooltip>Actualizar</q-tooltip>
              </button>
            </div>
            <div class="rk-activity-list">
              <div v-for="(a, i) in actividad" :key="i" class="rk-activity-item">
                <div class="rk-activity-avatar" :class="`type-${a.tipo}`">
                  <q-icon :name="a.tipo === 'entrada' ? 'login' : 'logout'" />
                </div>
                <div class="rk-activity-content">
                  <div class="rk-activity-title"><span class="rk-activity-type">{{ a.tipo }}</span> · {{ a.hora }}</div>
                  <div class="rk-activity-details">
                    <q-icon :name="moodIcon(a.animo)" size="14px" />
                    <span>{{ a.animo || "—" }}</span> ·
                    <span class="rk-activity-note">{{ a.comentario || "Sin comentario" }}</span>
                  </div>
                </div>
              </div>
              <div v-if="actividad.length === 0" class="rk-empty-activity">
                <q-icon name="history_off" />
                <p>Sin registros recientes</p>
              </div>
            </div>
          </div>

          <!-- Racha -->
          <div class="rk-info-card rk-streak-card">
            <div class="rk-card-header">
              <div class="rk-card-header-content">
                <div class="rk-card-header-icon rk-icon-fire"><q-icon name="local_fire_department" /></div>
                <h4 class="rk-card-title">Racha actual</h4>
              </div>
              <q-badge class="rk-streak-badge">{{ streakCount }} días</q-badge>
            </div>
            <div class="rk-card-body">
              <div class="rk-streak-grid">
                <div v-for="(d, i) in streak" :key="i" class="rk-streak-day" :class="{ ok: d.ok }" :title="d.label">
                  <q-icon :name="d.ok ? 'check' : 'close'" size="16px" />
                </div>
              </div>
              <div class="rk-streak-footer">
                <span>Últimos {{ streak.length }} días</span>
                <button v-if="streakCount > 0" class="rk-share-btn" @click="shareStreak">
                  <q-icon name="share" size="16px" /><span>Compartir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Action Dock -->
    <div class="rk-dock">
      <div class="rk-dock-content">
        <div class="rk-dock-links">
          <router-link to="/employee/attendance/history" class="rk-dock-link"><q-icon name="history" /><span>Historial</span></router-link>
          <router-link to="/employee/requests" class="rk-dock-link"><q-icon name="event_note" /><span>Solicitudes</span></router-link>
          <router-link to="/employee/analytics" class="rk-dock-link"><q-icon name="insights" /><span>Estadísticas</span></router-link>
        </div>
        <button class="rk-submit-btn" :disabled="!form.tipo || loading" :class="{ loading: loading }" @click="confirmarEnvio">
          <q-icon v-if="!loading" name="check_circle" />
          <q-spinner-hourglass v-else />
          <span class="rk-submit-copy">
            <strong>{{ loading ? "Enviando..." : labelCTA }}</strong>
            <small>{{ form.tipo ? "Abre el resumen final antes de confirmar" : "Selecciona entrada o salida para continuar" }}</small>
          </span>
          <div class="rk-submit-shine"></div>
        </button>
      </div>
    </div>

    <!-- Dialogs -->
    <q-dialog v-model="dlgPendientes" position="right" class="rk-dialog">
      <div class="rk-dialog-card">
        <div class="rk-dialog-header">
          <div class="rk-dialog-header-content">
            <div class="rk-dialog-icon"><q-icon name="sync" /></div>
            <h3 class="rk-dialog-title">Pendientes por enviar</h3>
          </div>
          <button class="rk-dialog-close" v-close-popup><q-icon name="close" /></button>
        </div>
        <div class="rk-dialog-body">
          <div v-if="queue.length === 0" class="rk-empty-queue">
            <q-icon name="check_circle" />
            <p>No hay pendientes por enviar</p>
          </div>
          <div v-else class="rk-queue-list">
            <div v-for="(item, i) in queue" :key="i" class="rk-queue-item">
              <div class="rk-queue-info">
                <div class="rk-queue-title">
                  <q-icon :name="item.tipo === 'entrada' ? 'login' : 'logout'" :class="`type-${item.tipo}`" />
                  <span>{{ item.tipo }}</span> ·
                  <span class="rk-queue-date">{{ new Date(item.timestamp).toLocaleString("es-CL") }}</span>
                </div>
                <div class="rk-queue-details">
                  <q-icon :name="moodIcon(item.mood)" size="14px" />
                  <span>{{ item.mood || "—" }}</span> ·
                  <span class="rk-queue-note">{{ (item.note || "").slice(0, 80) }}</span>
                </div>
                <div v-if="item.ubicacion" class="rk-queue-location">
                  <q-icon name="place" size="12px" />
                  <span>{{ locToText(item.ubicacion) }}</span>
                </div>
              </div>
              <div class="rk-queue-actions">
                <button class="rk-queue-action-btn" @click="reintentar(i)"><q-icon name="send" /></button>
                <button class="rk-queue-action-btn rk-btn-danger" @click="borrarPendiente(i)"><q-icon name="delete" /></button>
              </div>
            </div>
          </div>
        </div>
        <div class="rk-dialog-footer">
          <button class="rk-dialog-btn" v-close-popup>Cerrar</button>
          <button class="rk-dialog-btn rk-btn-danger" @click="vaciarCola" :disabled="queue.length === 0">Vaciar cola</button>
        </div>
      </div>
    </q-dialog>

    <q-dialog v-model="dlgConfirm" persistent class="rk-dialog">
      <div class="rk-dialog-card rk-confirm-card">
        <div class="rk-dialog-header">
          <div class="rk-dialog-icon rk-icon-confirm"><q-icon name="task_alt" /></div>
          <div class="rk-dialog-title-wrap">
            <h3 class="rk-dialog-title">Confirmar asistencia</h3>
            <p class="rk-dialog-subtitle">Verifica este resumen antes de registrar el marcaje.</p>
          </div>
        </div>
        <div class="rk-dialog-body">
          <div class="rk-confirm-list">
            <div class="rk-confirm-item rk-confirm-item--highlight">
              <q-icon name="swap_horiz" />
              <div class="rk-confirm-text">
                <span class="rk-confirm-label">Tipo</span>
                <strong>{{ labelTipo || "—" }}</strong>
              </div>
            </div>
            <div v-if="form.estadoAnimo" class="rk-confirm-item">
              <q-icon name="mood" />
              <div class="rk-confirm-text">
                <span class="rk-confirm-label">Estado de ánimo</span>
                <strong>{{ labelAnimo || "—" }}</strong>
              </div>
            </div>
            <div v-if="form.comentario?.trim()" class="rk-confirm-item">
              <q-icon name="notes" />
              <div class="rk-confirm-text">
                <span class="rk-confirm-label">Comentario</span>
                <strong>{{ form.comentario?.trim() || "—" }}</strong>
              </div>
            </div>
            <div v-if="geoEnabled" class="rk-confirm-item">
              <q-icon name="place" />
              <div class="rk-confirm-text">
                <span class="rk-confirm-label">Ubicación</span>
                <strong>{{ geoTexto }}</strong>
              </div>
            </div>
          </div>
          <div v-if="!isOnline" class="rk-offline-warning">
            <q-icon name="wifi_off" />
            <span>Se guardará en la cola offline y se enviará cuando vuelva la conexión.</span>
          </div>
        </div>
        <div class="rk-dialog-footer">
          <button class="rk-dialog-btn" v-close-popup>Cancelar</button>
          <button class="rk-dialog-btn rk-btn-primary" :disabled="loading" @click="enviarAsistencia">
            <q-spinner-hourglass v-if="loading" size="18px" class="q-mr-sm" />
            <span>{{ loading ? "Enviando..." : "Marcar asistencia" }}</span>
          </button>
        </div>
      </div>
    </q-dialog>

    <canvas ref="confettiCanvas" class="rk-confetti"></canvas>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, computed } from "vue";
import { useQuasar } from "quasar";
import { useAsistenciaStore } from "@/stores/asistenciaStore";
import { useUserStore } from "@/stores/userStore";
import { useAuthStore } from "@/stores/authStore";

const ALLOWED_MOODS = new Set(["great", "good", "ok", "tired", "bad"]);
const moods = [
  { label: "Excelente", value: "great", emoji: "🌟", color: "primary", icon: "mood" },
  { label: "Bien", value: "good", emoji: "😄", color: "positive", icon: "sentiment_very_satisfied" },
  { label: "Normal", value: "ok", emoji: "😐", color: "info", icon: "sentiment_satisfied" },
  { label: "Cansado", value: "tired", emoji: "😴", color: "warning", icon: "sentiment_dissatisfied" },
  { label: "Mal", value: "bad", emoji: "☹️", color: "negative", icon: "sentiment_very_dissatisfied" },
];

const $q = useQuasar();
const asistenciaStore = useAsistenciaStore();
const userStore = useUserStore?.();
const auth = useAuthStore();

const loading = ref(false);
const isOnline = ref(navigator.onLine);
const dlgConfirm = ref(false);
const dlgPendientes = ref(false);
const refreshingActivity = ref(false);
const notifications = ref([]);
const notificationId = ref(0);

const form = reactive({ tipo: null, estadoAnimo: null, comentario: "" });

const currentUserId = computed(() => auth?.user?.id || userStore?.currentUser?._id || localStorage.getItem("userId") || null);
const labelTipo = computed(() => form.tipo === "entrada" ? "Entrada" : form.tipo === "salida" ? "Salida" : "");
const labelAnimo = computed(() => moods.find((m) => m.value === form.estadoAnimo)?.label || "");
const labelCTA = computed(() => form.tipo ? `Marcar ${labelTipo.value.toLowerCase()}` : "Marcar asistencia");

const horaActual = ref("--:--:--");
const fechaBonita = ref(new Intl.DateTimeFormat("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date()));
const timezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone);
let clockTimer = null;

const geoEnabled = ref(false);
const location = ref(null);
const geoTexto = computed(() => locToText(location.value));

const settings = reactive({ autoLocation: true, offlineMode: true, soundEffects: true, haptics: true });
const workHoursGoal = ref(9);

const QUEUE_KEY = "rk.attendance.queue";
const SETTINGS_KEY = "rk.attendance.settings";
const DRAFT_KEY = "rk.attendance.draft";
const queue = ref([]);

const kpi = reactive({ asistenciasMes: null, horasMes: null, puntualidad: null, vacaciones: null, primerCheck: null, ultimoCheck: null, horasHoy: null });
const actividad = ref([]);
const streak = reactive([]);

const jornadaProgress = computed(() => {
  const mins = parseHorasToMin(kpi.horasHoy);
  const target = (Number(workHoursGoal.value) || 0) * 60;
  const val = target > 0 ? Math.max(0, Math.min(1, mins / target)) : 0;
  let color = "primary", textColor = "text-primary", remaining = "";
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
const comentarioRule = (v) => !v || v.length <= 300 || "Máx. 300 caracteres";

onMounted(async () => {
  updateClock();
  clockTimer = setInterval(updateClock, 1000);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  window.addEventListener("keydown", shortcuts);
  restoreDraft();
  loadQueue();
  await loadSettingsFromStore();
  if (settings.autoLocation) {
    geoEnabled.value = true;
    setTimeout(() => getLocation(true), 800);
  }
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

async function loadDashboardData() {
  if (!currentUserId.value) return;
  try {
    const [k, act, st, goal] = await Promise.all([
      asistenciaStore.fetchKPIs?.({ userId: currentUserId.value }),
      asistenciaStore.fetchActivity?.({ userId: currentUserId.value, limit: 20 }),
      asistenciaStore.fetchStreak?.({ userId: currentUserId.value, days: 14 }),
      asistenciaStore.getWorkHoursGoal?.({ userId: currentUserId.value }),
    ]);
    if (k) Object.assign(kpi, k);
    if (Array.isArray(act)) actividad.value = act;
    if (Array.isArray(st)) streak.splice(0, streak.length, ...st);
    if (typeof goal === "number" && !Number.isNaN(goal)) workHoursGoal.value = goal;
  } catch (e) {
    showNotification("No se pudo cargar el panel", "warning", "warning");
  }
}

async function loadActivity() {
  if (!currentUserId.value || !asistenciaStore.fetchActivity) return;
  refreshingActivity.value = true;
  try {
    const act = await asistenciaStore.fetchActivity({ userId: currentUserId.value, limit: 20 });
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
    const s = await asistenciaStore.getSettings?.({ userId: currentUserId.value });
    if (s && typeof s === "object") Object.assign(settings, s);
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    Object.assign(settings, saved);
    if (asistenciaStore.getWorkHoursGoal) {
      const goal = await asistenciaStore.getWorkHoursGoal({ userId: currentUserId.value });
      if (typeof goal === "number" && !Number.isNaN(goal)) workHoursGoal.value = goal;
    }
  } catch {}
}

function updateClock() {
  const d = new Date();
  horaActual.value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
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
  return `lat ${Number(lat).toFixed(5)}, lng ${Number(lng).toFixed(5)}${accStr}`;
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
      navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
    );
    location.value = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy };
    showNotification("Ubicación obtenida", "positive", "my_location");
  } catch (err) {
    showNotification("No se pudo obtener la ubicación", "warning", "location_off");
  }
}

function handleOnline() {
  isOnline.value = true;
  showNotification("Conexión restaurada. Reintentando pendientes…", "positive", "wifi");
  reintentarTodos();
  asistenciaStore.syncPending?.(queue.value).catch(() => {});
}

function handleOffline() {
  isOnline.value = false;
  showNotification("Sin conexión. Guardaremos tus marcas y las enviaremos luego.", "warning", "wifi_off");
}

function showNotification(message, type = "info", icon = "info") {
  const id = notificationId.value++;
  notifications.value.push({ id, message, type, icon });
  setTimeout(() => removeNotification(id), 5000);
}

function removeNotification(id) {
  const i = notifications.value.findIndex((n) => n.id === id);
  if (i > -1) notifications.value.splice(i, 1);
}

function loadQueue() {
  try {
    queue.value = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") || [];
  } catch {
    queue.value = [];
  }
  queue.value = queue.value.filter((item) => !item?.mood || ALLOWED_MOODS.has(item.mood));
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

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ tipo: form.tipo, estadoAnimo: form.estadoAnimo, comentario: form.comentario }));
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

function confirmarEnvio() {
  if (!form.tipo) return showNotification("Selecciona entrada o salida", "warning", "info");
  if (!ALLOWED_MOODS.has(form.estadoAnimo || "")) return showNotification("Selecciona tu estado de ánimo", "warning", "mood");
  if (!currentUserId.value) return showNotification("No se encontró el usuario autenticado", "negative", "error");
  dlgConfirm.value = true;
}

async function enviarAsistencia() {
  const payload = {
    userId: currentUserId.value,
    tipo: form.tipo,
    mood: form.estadoAnimo,
    note: form.comentario?.trim() || "",
    ubicacion: geoEnabled.value && location.value ? { lat: Number(location.value.lat), lng: Number(location.value.lng) } : null,
    timestamp: Date.now(),
    client: { platform: navigator?.userAgentData?.platform || navigator?.platform || "web", appVersion: import.meta?.env?.VITE_APP_VERSION || "web" },
  };

  if (!ALLOWED_MOODS.has(payload.mood)) {
    showNotification("Estado de ánimo inválido", "negative", "error");
    return;
  }

  if (!isOnline.value) {
    pushQueue(payload);
    dlgConfirm.value = false;
    resetForm();
    showNotification("Guardado offline. Se enviará al recuperar conexión.", "warning", "cloud_off");
    vibrar();
    return;
  }

  loading.value = true;
  try {
    await asistenciaStore.crearAsistencia?.(payload);
    dlgConfirm.value = false;
    resetForm();
    showNotification("Asistencia registrada correctamente", "positive", "check_circle");
    vibrar();
    confetti();
    loadDashboardData();
  } catch (e) {
    if (!navigator.onLine) {
      pushQueue(payload);
      showNotification("Sin conexión. Guardado en pendientes.", "warning", "cloud_off");
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
  if (navigator.share) {
    navigator.share({ title: "Mi racha de asistencia", text, url: window.location.href });
  } else {
    navigator.clipboard.writeText(text);
    showNotification("Racha copiada al portapapeles", "info", "content_copy");
  }
}

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

function parseHorasToMin(str) {
  if (!str) return 0;
  const hm = /(\d+)\s*h(?:\s*(\d+)\s*m)?/i.exec(str);
  if (hm) return (Number(hm[1]) || 0) * 60 + (Number(hm[2]) || 0);
  const clock = /^(\d{1,2}):(\d{2})$/.exec(str);
  if (clock) return (Number(clock[1]) || 0) * 60 + (Number(clock[2]) || 0);
  return 0;
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Space+Mono:wght@700&display=swap');

/* === VARIABLES === */
.rk-attendance-page {
  --color-primary: #06b6d4;
  --color-primary-light: #22d3ee;
  --color-accent: #14b8a6;
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --surface-1: rgba(255, 255, 255, 0.95);
  --surface-2: rgba(6, 182, 212, 0.04);
  --surface-3: rgba(6, 182, 212, 0.08);
  --border-1: rgba(6, 182, 212, 0.12);
  --border-2: rgba(6, 182, 212, 0.2);
  --text-primary: rgba(15, 23, 42, 0.95);
  --text-secondary: rgba(15, 23, 42, 0.7);
  --text-muted: rgba(15, 23, 42, 0.5);
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, rgba(243, 244, 246, 0.8), rgba(249, 250, 251, 0.8));
  font-family: 'Sora', -apple-system, sans-serif;
  padding: 24px 24px 120px 24px;
}

.body--dark .rk-attendance-page {
  --surface-1: rgba(17, 24, 39, 0.95);
  --surface-2: rgba(6, 182, 212, 0.06);
  --surface-3: rgba(6, 182, 212, 0.1);
  --border-1: rgba(6, 182, 212, 0.15);
  --border-2: rgba(6, 182, 212, 0.25);
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  background: linear-gradient(135deg, rgba(10, 14, 20, 0.95), rgba(15, 20, 25, 0.95));
}

/* === BACKGROUND === */
.rk-page-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.rk-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(var(--border-1) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-1) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.3;
}

.rk-glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.06;
}

.rk-orb-1 {
  width: 500px;
  height: 500px;
  top: -100px;
  right: -100px;
  background: radial-gradient(circle, var(--color-primary), transparent 60%);
}

.rk-orb-2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  left: -100px;
  background: radial-gradient(circle, var(--color-accent), transparent 60%);
}

/* === NOTIFICATIONS === */
.rk-notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  max-width: 400px;
}

.rk-notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 10px;
  background: var(--surface-1);
  backdrop-filter: blur(20px);
  border: 1.5px solid var(--border-1);
  border-left: 4px solid;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.15);
  animation: slideInRight 0.3s ease;
}

.rk-notification.type-positive { border-left-color: var(--color-success); }
.rk-notification.type-negative { border-left-color: var(--color-danger); }
.rk-notification.type-warning { border-left-color: var(--color-warning); }
.rk-notification.type-info { border-left-color: var(--color-primary); }

.rk-notif-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 8px;
}

.rk-notif-text {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.rk-notif-close {
  opacity: 0.5;
  transition: opacity 0.2s;
}

.rk-notif-close:hover {
  opacity: 1;
}

/* === CONTAINER === */
.rk-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* === HEADER === */
.rk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  margin-bottom: 28px;
  background: var(--surface-1);
  backdrop-filter: blur(20px);
  border: 1.5px solid var(--border-1);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.12);
  animation: fadeInDown 0.6s ease;
}

.rk-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.rk-avatar-wrapper {
  position: relative;
}

.rk-avatar-ring {
  position: relative;
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid var(--border-1);
  transition: all 0.3s ease;
}

.rk-avatar-ring.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.1);
  animation: ringPulse 2s ease-in-out infinite;
}

.rk-avatar {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
}

.rk-pulse-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  background: var(--color-danger);
  border-radius: 50%;
  border: 2px solid var(--surface-1);
  opacity: 0;
  transition: opacity 0.3s;
}

.rk-pulse-dot.active {
  opacity: 1;
  animation: pulse 2s infinite;
}

.rk-date-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.rk-live-clock {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rk-time {
  font-size: 1.4rem;
  font-weight: 800;
  font-family: 'Space Mono', monospace;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.rk-timezone-chip {
  background: var(--surface-2);
  color: var(--text-primary);
  padding: 4px 10px;
  border-radius: 8px;
}

.rk-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rk-status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(245, 158, 11, 0.1);
  border: 1.5px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-warning);
}

.rk-status-badge.online {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: var(--color-success);
}

.rk-icon-btn {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border: 1.5px solid var(--border-1);
  border-radius: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.rk-icon-btn:hover {
  background: var(--surface-3);
  border-color: var(--border-2);
  color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
}

.rk-icon-btn.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-color: transparent;
  color: #fff;
}

.rk-badge-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  background: var(--color-danger);
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 800;
  color: #fff;
}

/* === SUMMARY BANNER === */
.rk-summary-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  margin-bottom: 28px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(242, 250, 255, 0.96)),
    var(--surface-1);
  border: 1.5px solid rgba(6, 182, 212, 0.18);
  border-left: 5px solid var(--color-primary);
  border-radius: 20px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
  animation: slideDown 0.4s ease;
}

.rk-summary-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: #fff;
}

.rk-summary-icon.type-entrada {
  background: linear-gradient(135deg, var(--color-success), #16a34a);
}

.rk-summary-icon.type-salida {
  background: linear-gradient(135deg, var(--color-danger), #dc2626);
}

.rk-summary-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-primary);
}

.rk-summary-kicker {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.rk-summary-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.rk-summary-title {
  font-size: 1.05rem;
  font-weight: 800;
}

.rk-summary-subtitle {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.18);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-primary);
}

.rk-summary-help {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.rk-summary-geo {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 320px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* === MAIN GRID === */
.rk-main-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 28px;
  margin-bottom: 28px;
}

/* === FORM SECTION === */
.rk-form-card {
  background: var(--surface-1);
  backdrop-filter: blur(20px);
  border: 1.5px solid var(--border-1);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.12);
  transition: all 0.3s ease;
}

.rk-form-card:hover {
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.15);
}

.rk-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.rk-form-section-item {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rk-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rk-section-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 10px;
  color: var(--color-primary);
}

.rk-section-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

/* === TYPE SELECTOR === */
.rk-type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.rk-type-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  background: var(--surface-2);
  border: 2px solid var(--border-1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.rk-type-btn:hover {
  background: var(--surface-3);
  border-color: var(--border-2);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(6, 182, 212, 0.15);
}

.rk-type-btn.active.type-entrada {
  background: linear-gradient(135deg, var(--color-success), #16a34a);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
}

.rk-type-btn.active.type-salida {
  background: linear-gradient(135deg, var(--color-danger), #dc2626);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
}

.rk-type-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-3);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.rk-type-icon .q-icon {
  font-size: 28px;
}

.rk-type-btn.active .rk-type-icon {
  background: rgba(255, 255, 255, 0.2);
}

.rk-type-label {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.rk-type-btn.active .rk-type-label {
  color: #fff;
}

.rk-type-check {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: scaleIn 0.3s ease;
}

.rk-type-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.rk-type-btn:hover .rk-type-shine {
  left: 100%;
}

.rk-shortcuts-hint {
  font-size: 0.85rem;
  font-family: 'Space Mono', monospace;
  color: var(--text-muted);
  text-align: center;
}

kbd {
  padding: 3px 8px;
  background: var(--surface-3);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  font-size: 0.8rem;
  box-shadow: 0 2px 0 var(--border-1);
}

/* === MOODS GRID === */
.rk-moods-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.rk-mood-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--surface-2);
  border: 2px solid var(--border-1);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.rk-mood-btn:hover {
  background: var(--surface-3);
  border-color: var(--border-2);
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 16px rgba(6, 182, 212, 0.12);
}

.rk-mood-btn.active {
  border-color: transparent;
  color: #fff;
  box-shadow: 0 8px 20px rgba(6, 182, 212, 0.25);
}

.rk-mood-btn.mood-great { background: linear-gradient(135deg, var(--color-primary), #0891b2); }
.rk-mood-btn.mood-good { background: linear-gradient(135deg, var(--color-success), #16a34a); }
.rk-mood-btn.mood-ok { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.rk-mood-btn.mood-tired { background: linear-gradient(135deg, var(--color-warning), #d97706); }
.rk-mood-btn.mood-bad { background: linear-gradient(135deg, var(--color-danger), #dc2626); }

.rk-mood-emoji {
  font-size: 2rem;
}

.rk-mood-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.rk-mood-btn.active .rk-mood-label {
  color: #fff;
}

/* === TEXTAREA === */
.rk-textarea :deep(.q-field__control) {
  min-height: 100px;
  border-radius: 14px;
  background: var(--surface-2);
  border: 1.5px solid var(--border-1);
}

.rk-textarea :deep(.q-field__control):hover {
  border-color: var(--border-2);
}

.rk-char-counter {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: right;
}

/* === KPIS GRID === */
.rk-kpis-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.rk-kpi-mini {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--surface-1);
  border: 1.5px solid var(--border-1);
  border-radius: 14px;
  transition: all 0.3s ease;
}

.rk-kpi-mini:hover {
  border-color: var(--border-2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.12);
}

.rk-kpi-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.rk-icon-primary { background: rgba(6, 182, 212, 0.12); color: var(--color-primary); }
.rk-icon-teal { background: rgba(20, 184, 166, 0.12); color: var(--color-accent); }
.rk-icon-green { background: rgba(34, 197, 94, 0.12); color: var(--color-success); }
.rk-icon-orange { background: rgba(245, 158, 11, 0.12); color: var(--color-warning); }

.rk-kpi-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.rk-kpi-value {
  display: block;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

/* === INFO CARDS === */
.rk-info-card {
  background: var(--surface-1);
  backdrop-filter: blur(20px);
  border: 1.5px solid var(--border-1);
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.08);
  transition: all 0.3s ease;
}

.rk-info-card:hover {
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.12);
}

.rk-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1.5px solid var(--border-1);
}

.rk-card-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rk-card-header-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 10px;
  color: var(--color-primary);
}

.rk-icon-fire {
  background: rgba(245, 158, 11, 0.12);
  color: var(--color-warning);
}

.rk-card-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.rk-refresh-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.rk-refresh-btn:hover {
  background: var(--surface-3);
  color: var(--color-primary);
}

.rotate-animation {
  animation: rotate 1s linear infinite;
}

.rk-card-body {
  padding: 20px;
}

/* === DAY ITEMS === */
.rk-day-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-1);
}

.rk-day-item:last-child {
  border-bottom: none;
}

.rk-day-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.rk-day-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* === PROGRESS SECTION === */
.rk-progress-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1.5px solid var(--border-1);
}

.rk-progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.rk-progress-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.rk-progress-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.rk-progress-bar-wrapper {
  margin-bottom: 10px;
}

.rk-progress-bar {
  position: relative;
  width: 100%;
  height: 16px;
  background: var(--surface-2);
  border-radius: 8px;
  overflow: hidden;
}

.rk-progress-fill {
  position: relative;
  height: 100%;
  border-radius: 8px;
  transition: width 0.6s ease;
  overflow: hidden;
}

.rk-progress-fill.color-primary { background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light)); }
.rk-progress-fill.color-warning { background: linear-gradient(90deg, var(--color-warning), #d97706); }
.rk-progress-fill.color-positive { background: linear-gradient(90deg, var(--color-success), #16a34a); }

.rk-progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

.rk-progress-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
}

.rk-progress-percent {
  color: var(--text-muted);
}

.rk-progress-remaining {
  font-weight: 700;
}

.text-primary { color: var(--color-primary); }
.text-warning { color: var(--color-warning); }
.text-positive { color: var(--color-success); }

/* === ACTIVITY LIST === */
.rk-activity-list {
  max-height: 320px;
  overflow-y: auto;
}

.rk-activity-list::-webkit-scrollbar {
  width: 6px;
}

.rk-activity-list::-webkit-scrollbar-track {
  background: var(--surface-2);
  border-radius: 3px;
}

.rk-activity-list::-webkit-scrollbar-thumb {
  background: var(--border-1);
  border-radius: 3px;
}

.rk-activity-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-1);
  transition: all 0.2s ease;
}

.rk-activity-item:hover {
  background: var(--surface-2);
  transform: translateX(4px);
}

.rk-activity-item:last-child {
  border-bottom: none;
}

.rk-activity-avatar {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #fff;
  flex-shrink: 0;
}

.rk-activity-avatar.type-entrada { background: linear-gradient(135deg, var(--color-success), #16a34a); }
.rk-activity-avatar.type-salida { background: linear-gradient(135deg, var(--color-danger), #dc2626); }

.rk-activity-content {
  flex: 1;
}

.rk-activity-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.rk-activity-type {
  text-transform: capitalize;
}

.rk-activity-details {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.rk-activity-note {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rk-empty-activity {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.rk-empty-activity .q-icon {
  font-size: 48px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.rk-empty-activity p {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin: 0;
}

/* === STREAK CARD === */
.rk-streak-badge {
  padding: 6px 12px;
  background: rgba(245, 158, 11, 0.12);
  color: var(--color-warning);
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
}

.rk-streak-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.rk-streak-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border: 1.5px solid var(--border-1);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.rk-streak-day.ok {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.25));
  border-color: rgba(34, 197, 94, 0.4);
  color: var(--color-success);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.rk-streak-day:not(.ok) {
  color: var(--text-muted);
}

.rk-streak-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.rk-share-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  color: var(--color-warning);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rk-share-btn:hover {
  background: var(--surface-3);
  transform: translateY(-2px);
}

/* === FLOATING DOCK === */
.rk-dock {
  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  z-index: 1000;
  pointer-events: none;
}

.rk-dock-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  pointer-events: all;
}

.rk-dock-links {
  display: flex;
  gap: 12px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1.5px solid var(--border-1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(6, 182, 212, 0.15);
  animation: slideUp 0.5s ease;
}

.body--dark .rk-dock-links {
  background: rgba(17, 24, 39, 0.85);
}

.rk-dock-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: transparent;
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.rk-dock-link:hover {
  background: var(--surface-2);
  transform: translateY(-2px);
}

.rk-submit-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 320px;
  min-height: 72px;
  padding: 0 28px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border: none;
  border-radius: 20px;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow:
    0 18px 40px rgba(6, 182, 212, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  transition: all 0.3s ease;
  overflow: hidden;
  animation: slideUp 0.5s ease 0.1s both;
}

.rk-submit-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(6, 182, 212, 0.4);
}

.rk-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.rk-submit-btn .q-icon {
  font-size: 24px;
}

.rk-submit-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
  text-align: left;
}

.rk-submit-copy strong {
  font-size: 1.02rem;
  font-weight: 800;
}

.rk-submit-copy small {
  margin-top: 4px;
  font-size: 0.76rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.86);
}

.rk-submit-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 3s infinite;
}

/* === DIALOGS === */
.rk-dialog :deep(.q-dialog__backdrop) {
  backdrop-filter: blur(8px);
  background: rgba(10, 14, 20, 0.7);
}

.rk-dialog-card {
  width: min(500px, 95vw);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(247, 250, 252, 0.98)),
    var(--surface-1);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.2);
}

.rk-dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1.5px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(240, 249, 255, 0.95), rgba(255, 255, 255, 0.9));
}

.rk-dialog-header-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rk-dialog-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 12px;
  color: #fff;
}

.rk-icon-confirm {
  background: linear-gradient(135deg, var(--color-success), #16a34a);
}

.rk-dialog-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.rk-dialog-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rk-dialog-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.rk-dialog-close {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-3);
  border: 1px solid var(--border-1);
  border-radius: 10px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.rk-dialog-close:hover {
  background: var(--surface-2);
  color: var(--text-primary);
  transform: rotate(90deg);
}

.rk-dialog-body {
  padding: 28px;
  background: rgba(255, 255, 255, 0.9);
}

.rk-empty-queue {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.rk-empty-queue .q-icon {
  font-size: 64px;
  color: var(--color-success);
  margin-bottom: 16px;
}

.rk-empty-queue p {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.rk-queue-list {
  max-height: 400px;
  overflow-y: auto;
}

.rk-queue-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: 14px;
  transition: all 0.2s ease;
}

.rk-queue-item:hover {
  background: var(--surface-3);
  transform: translateX(4px);
}

.rk-queue-info {
  flex: 1;
}

.rk-queue-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.rk-queue-title .type-entrada { color: var(--color-success); }
.rk-queue-title .type-salida { color: var(--color-danger); }

.rk-queue-date {
  font-weight: 400;
  color: var(--text-muted);
}

.rk-queue-details,
.rk-queue-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.rk-queue-note {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rk-queue-actions {
  display: flex;
  gap: 8px;
}

.rk-queue-action-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-3);
  border: 1px solid var(--border-1);
  border-radius: 10px;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.rk-queue-action-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  transform: translateY(-2px);
}

.rk-queue-action-btn.rk-btn-danger { color: var(--color-danger); }
.rk-queue-action-btn.rk-btn-danger:hover { background: var(--color-danger); border-color: var(--color-danger); }

.rk-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  border-top: 1.5px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.94));
}

.rk-dialog-btn {
  min-height: 48px;
  padding: 11px 24px;
  background: #fff;
  border: 1.5px solid rgba(148, 163, 184, 0.35);
  border-radius: 14px;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rk-dialog-btn:hover {
  background: #f8fafc;
  transform: translateY(-2px);
}

.rk-dialog-btn.rk-btn-primary {
  min-width: 200px;
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  border-color: transparent;
  color: #fff;
  box-shadow:
    0 14px 30px rgba(6, 182, 212, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.rk-dialog-btn.rk-btn-primary:hover {
  box-shadow: 0 18px 34px rgba(6, 182, 212, 0.34);
}

.rk-dialog-btn.rk-btn-danger {
  background: var(--color-danger);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.rk-dialog-btn.rk-btn-danger:hover {
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.rk-dialog-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.rk-confirm-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rk-confirm-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  background: rgba(248, 250, 252, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.rk-confirm-item--highlight {
  background: linear-gradient(135deg, rgba(236, 254, 255, 0.96), rgba(240, 249, 255, 0.98));
  border-color: rgba(6, 182, 212, 0.24);
}

.rk-confirm-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rk-confirm-label {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.rk-confirm-item .q-icon {
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.rk-confirm-item strong {
  color: var(--text-primary);
  font-weight: 700;
  line-height: 1.35;
}

.rk-offline-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  padding: 14px 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1.5px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  font-size: 0.85rem;
  color: var(--color-warning);
}

.rk-offline-warning .q-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

/* === CONFETTI === */
.rk-confetti {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
  z-index: 9999;
}

/* === ANIMATIONS === */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* === TRANSITIONS === */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from { opacity: 0; transform: translateY(-20px); }
.slide-down-leave-to { opacity: 0; transform: translateY(-20px); }

.slide-fade-enter-active { transition: all 0.3s ease; }
.slide-fade-leave-active { transition: all 0.2s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateY(-10px); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* === RESPONSIVE === */
@media (max-width: 1200px) {
  .rk-main-grid {
    grid-template-columns: 1fr 360px;
  }
}

@media (max-width: 1023px) {
  .rk-main-grid {
    grid-template-columns: 1fr;
  }

  .rk-info-section {
    order: -1;
  }

  .rk-kpis-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 767px) {
  .rk-attendance-page {
    padding: 16px 16px 100px 16px;
  }

  .rk-header {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }

  .rk-header-left {
    width: 100%;
  }

  .rk-header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .rk-time {
    font-size: 1.2rem;
  }

  .rk-summary-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .rk-summary-geo {
    max-width: 100%;
  }

  .rk-form-card {
    padding: 24px 20px;
  }

  .rk-type-selector {
    grid-template-columns: 1fr;
  }

  .rk-moods-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .rk-kpis-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .rk-streak-grid {
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
  }

  .rk-dock-content {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .rk-dock-links {
    flex-wrap: wrap;
    justify-content: center;
  }

  .rk-submit-btn {
    width: 100%;
    min-width: auto;
    min-height: 68px;
  }

  .rk-dialog-card {
    width: 100vw;
    height: 100vh;
    max-width: none;
    border-radius: 0;
  }

  .rk-queue-list {
    max-height: calc(100vh - 200px);
  }
}

@media (max-width: 599px) {
  .rk-moods-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .rk-kpis-grid {
    grid-template-columns: 1fr;
  }

  .rk-dock-links {
    flex-direction: column;
    padding: 12px 16px;
  }

  .rk-dock-link {
    width: 100%;
    justify-content: center;
  }
}

/* === ACCESSIBILITY === */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* === DARK MODE REFINEMENTS === */
.body--dark .rk-header,
.body--dark .rk-form-card,
.body--dark .rk-info-card {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.body--dark .rk-dock-links {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.body--dark .rk-submit-btn {
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);
}

.body--dark .rk-submit-btn:hover:not(:disabled) {
  box-shadow: 0 12px 32px rgba(6, 182, 212, 0.5);
}

.body--dark .rk-summary-banner {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(17, 24, 39, 0.92));
  border-color: rgba(34, 211, 238, 0.22);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
}

.body--dark .rk-summary-subtitle {
  background: rgba(34, 211, 238, 0.14);
  border-color: rgba(34, 211, 238, 0.22);
}

.body--dark .rk-summary-geo {
  background: rgba(15, 23, 42, 0.82);
  border-color: rgba(148, 163, 184, 0.16);
}

.body--dark .rk-dialog-card {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(17, 24, 39, 0.97));
  border-color: rgba(148, 163, 184, 0.14);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.body--dark .rk-dialog-header {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.94));
  border-bottom-color: rgba(148, 163, 184, 0.12);
}

.body--dark .rk-dialog-body,
.body--dark .rk-dialog-footer {
  background: rgba(15, 23, 42, 0.94);
}

.body--dark .rk-dialog-footer {
  border-top-color: rgba(148, 163, 184, 0.12);
}

.body--dark .rk-dialog-btn {
  background: rgba(30, 41, 59, 0.82);
  border-color: rgba(148, 163, 184, 0.18);
}

.body--dark .rk-dialog-btn:hover {
  background: rgba(51, 65, 85, 0.9);
}

.body--dark .rk-confirm-item {
  background: rgba(30, 41, 59, 0.72);
  border-color: rgba(148, 163, 184, 0.14);
}

.body--dark .rk-confirm-item--highlight {
  background: linear-gradient(135deg, rgba(8, 145, 178, 0.18), rgba(14, 116, 144, 0.22));
  border-color: rgba(34, 211, 238, 0.24);
}
</style>
