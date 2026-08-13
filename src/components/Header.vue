<template>
  <q-header reveal elevated class="rk-header">
    <!-- Barra del ambiente de prueba. Va DENTRO del QHeader (y no colgada del
         layout) para que Quasar incluya su alto al calcular el offset del
         contenido; fuera de aquí sumaría un scroll permanente en cada pantalla.
         Se oculta sola cuando la cuenta ya no está en período de prueba (ni en
         el ambiente de ejemplo ni en la empresa real creada durante la prueba). -->
    <DemoBanner />

    <!-- Main Header Bar -->
    <div class="rk-header-bar">
      <!-- Left Section -->
      <div class="rk-header-left">
        <button class="rk-menu-btn" @click="$emit('toggle-drawer')">
          <q-icon name="menu" />
          <div class="rk-btn-ripple"></div>
        </button>

        <!-- Compact Recksy home icon + Company switcher.
             Solo para superadmin: él opera sobre múltiples empresas y
             necesita el "volver al home plataforma" + el selector de empresa.
             Los demás roles (admin_rrhh, employee, dt_inspector) tienen 1
             empresa fija y navegan por el drawer — el chrome del header
             queda limpio. -->
        <template v-if="isSuperadmin">
          <CompanySwitcher />
        </template>
      </div>

      <!-- Right Section -->
      <div class="rk-header-right">
        <!-- Search Button -->
        <button class="rk-action-btn" @click="openCommand">
          <q-icon name="search" />
          <q-tooltip class="rk-tooltip">
            Buscar ({{ isMac ? "⌘" : "Ctrl" }} + K)
          </q-tooltip>
        </button>

        <!-- Theme Toggle -->
        <button class="rk-action-btn" @click="toggleDark">
          <q-icon :name="darkIcon" />
          <div class="rk-theme-indicator"></div>
          <q-tooltip class="rk-tooltip">{{ darkTip }}</q-tooltip>
        </button>

        <!-- Notifications -->
        <div class="rk-notif-wrapper">
          <button
            class="rk-action-btn rk-notif-btn"
            :class="{ 'has-unread': unreadCount > 0, 'has-pending': unreadCount === 0 && pendingActionCount > 0 }"
            @click="notifOpen = !notifOpen"
          >
            <q-icon name="notifications" />
            <div v-if="unreadCount > 0" class="rk-notif-badge">
              <span>{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
              <div class="rk-badge-pulse"></div>
            </div>
            <div v-else-if="pendingActionCount > 0" class="rk-notif-dot">
              <div class="rk-notif-dot-pulse"></div>
            </div>
          </button>

          <!-- Notifications Menu -->
          <q-menu
            v-model="notifOpen"
            no-parent-event
            anchor="bottom right"
            self="top right"
            :offset="[0, 8]"
            class="rk-notif-menu"
          >
            <div class="rk-notif-panel">
              <div class="rk-notif-header">
                <div class="rk-notif-title-section">
                  <div class="rk-notif-icon">
                    <q-icon name="notifications_active" />
                  </div>
                  <div>
                    <h4 class="rk-notif-title">Notificaciones</h4>
                    <p class="rk-notif-subtitle">{{ unreadCount }} sin leer</p>
                  </div>
                </div>
                <button
                  v-if="notifications.length > 0"
                  class="rk-mark-read-btn"
                  @click="markAllRead"
                >
                  <q-icon name="done_all" />
                  <span>Marcar leídas</span>
                </button>
              </div>

              <div class="rk-notif-list">
                <div
                  v-for="n in notifications"
                  :key="n.id"
                  class="rk-notif-item"
                  :class="{
                    'rk-notif-unread': !n.read,
                    'rk-notif-pending': n.action === 'confirm-missed-exit' && !n.resolved,
                    'rk-notif-resolved': n.action === 'confirm-missed-exit' && n.resolved,
                  }"
                  @click="openNotif(n)"
                >
                  <div class="rk-notif-item-icon">
                    <q-icon :name="n.icon || 'notifications_active'" />
                  </div>
                  <div class="rk-notif-item-content">
                    <h5 class="rk-notif-item-title">{{ n.title }}</h5>
                    <p class="rk-notif-item-body">{{ n.body }}</p>
                    <div class="rk-notif-item-meta">
                      <span class="rk-notif-item-time">{{ n.time || 'Hace un momento' }}</span>
                      <span
                        v-if="n.action === 'confirm-missed-exit' && !n.resolved"
                        class="rk-notif-tag rk-notif-tag-warning"
                      >
                        <q-icon name="error" size="12px" />
                        Salida pendiente
                      </span>
                      <span
                        v-else-if="n.action === 'confirm-missed-exit' && n.resolved"
                        class="rk-notif-tag rk-notif-tag-success"
                      >
                        <q-icon name="check_circle" size="12px" />
                        Resuelta
                      </span>
                    </div>
                  </div>
                  <div v-if="!n.read" class="rk-notif-item-dot"></div>
                </div>

                <div
                  v-if="notifications.length === 0 && !notifLoading && !notifError"
                  class="rk-notif-empty"
                >
                  <div class="rk-empty-icon">
                    <q-icon name="notifications_off" />
                  </div>
                  <p class="rk-empty-text">No tienes notificaciones</p>
                </div>

                <div v-if="notifLoading && notifications.length === 0" class="rk-notif-empty">
                  <q-spinner color="primary" size="24px" />
                  <p class="rk-empty-text">Cargando...</p>
                </div>

                <div v-if="notifError && notifications.length === 0" class="rk-notif-empty">
                  <div class="rk-empty-icon">
                    <q-icon name="error_outline" />
                  </div>
                  <p class="rk-empty-text">No se pudieron cargar</p>
                  <q-btn
                    flat
                    dense
                    no-caps
                    color="primary"
                    icon="refresh"
                    label="Reintentar"
                    @click="tryFetchNotifications"
                  />
                </div>
              </div>
            </div>
          </q-menu>
        </div>

        <!-- Page Actions Slot -->
        <div class="rk-page-actions">
          <slot name="actions" />
        </div>

        <!-- User Avatar Menu -->
        <UserAvatarMenu />
      </div>
    </div>

    <!-- Command Palette -->
    <q-dialog
      v-model="commandOpen"
      persistent
      transition-show="jump-down"
      transition-hide="jump-up"
      class="rk-command-dialog"
    >
      <div class="rk-command-palette">
        <span class="rk-command-glow" aria-hidden="true"></span>

        <!-- Buscador -->
        <div class="rk-command-header">
          <div class="rk-command-search">
            <span class="rk-search-tile">
              <q-icon name="search" />
            </span>
            <input
              v-model="query"
              type="text"
              placeholder="Buscar páginas, acciones, documentos…"
              autofocus
              class="rk-search-input"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="activate()"
              @keydown.esc="commandOpen = false"
            />
            <button
              v-if="query"
              type="button"
              class="rk-search-clear"
              aria-label="Limpiar búsqueda"
              @click="query = ''"
            >
              <q-icon name="close" />
            </button>
            <div v-else class="rk-search-kbd">
              <kbd>{{ isMac ? "⌘" : "Ctrl" }}</kbd>
              <kbd>K</kbd>
            </div>
          </div>
        </div>

        <!-- Resultados -->
        <div class="rk-command-results">
          <div v-if="results.length > 0" class="rk-results-section">
            <div class="rk-results-label">
              <span>{{ query ? "Coincidencias" : "Accesos rápidos" }}</span>
              <span class="rk-results-count">{{ results.length }}</span>
            </div>
            <div
              v-for="(opt, i) in results"
              :key="opt.key"
              class="rk-command-item"
              :class="{ active: i === hi }"
              @click="exec(opt)"
              @mouseenter="hi = i"
            >
              <span class="rk-command-bar" aria-hidden="true"></span>
              <div class="rk-command-item-icon">
                <q-icon :name="opt.icon" />
              </div>
              <div class="rk-command-item-content">
                <h5 class="rk-command-item-label">{{ opt.label }}</h5>
                <p class="rk-command-item-desc">{{ opt.desc }}</p>
              </div>
              <kbd v-if="opt.kbd" class="rk-command-kbd">{{ opt.kbd }}</kbd>
              <span class="rk-command-enter" aria-hidden="true">
                <q-icon name="keyboard_return" />
              </span>
            </div>
          </div>

          <div v-else class="rk-command-empty">
            <div class="rk-empty-icon">
              <q-icon name="search_off" />
            </div>
            <p class="rk-empty-text">Sin resultados para “{{ query }}”</p>
            <p class="rk-empty-hint">Prueba con otro término o revisa el menú lateral</p>
          </div>
        </div>

        <!-- Pie -->
        <div class="rk-command-footer">
          <div class="rk-command-hints">
            <div class="rk-hint-item">
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              <span>Navegar</span>
            </div>
            <div class="rk-hint-item">
              <kbd>↵</kbd>
              <span>Abrir</span>
            </div>
            <div class="rk-hint-item">
              <kbd>Esc</kbd>
              <span>Cerrar</span>
            </div>
          </div>
          <span class="rk-command-brand">RECKSY</span>
        </div>
      </div>
    </q-dialog>

    <!-- Resolver de salida olvidada (desde la web) -->
    <q-dialog v-model="resolverOpen" persistent>
      <q-card style="min-width:340px;max-width:440px;border-radius:16px">
        <q-card-section class="row items-center no-wrap">
          <q-icon name="logout" color="warning" size="26px" class="q-mr-sm" />
          <div>
            <div class="text-h6">Registrar salida olvidada</div>
            <div class="text-caption text-grey-7">Entrada: {{ resolverEntradaLabel }}</div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <div>
            <div class="text-caption text-grey-7 q-mb-xs">Hora de salida</div>
            <input
              type="datetime-local"
              v-model="resolverForm.timestamp"
              style="width:100%;padding:9px 11px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;background:transparent;color:inherit"
            />
          </div>
          <q-input v-model="resolverForm.note" label="Comentario (opcional)" outlined dense autogrow />
          <div class="text-caption text-grey-6">
            La salida debe ser posterior a la entrada y anterior a la siguiente entrada registrada.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup :disable="resolverSaving" />
          <q-btn
            unelevated color="primary" icon="save" label="Registrar salida"
            :loading="resolverSaving" :disable="!resolverCanSubmit"
            @click="submitMissedExit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Loading Bar -->
    <q-ajax-bar ref="ajax" position="top" size="3px" color="primary" />
  </q-header>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { Dark, useQuasar } from "quasar";
import { storeToRefs } from "pinia";
import UserAvatarMenu from "@/components/UserAvatarMenu.vue";
import CompanySwitcher from "@/components/CompanySwitcher.vue";
import DemoBanner from "@/components/demo/DemoBanner.vue";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationsStore } from "@/stores/notificationsStore";

defineEmits(["toggle-drawer"]);

const $q = useQuasar();
const router = useRouter();
const themeStore = useThemeStore();

/* Theme */
const darkIcon = computed(() =>
  $q.dark.isActive ? "dark_mode" : "light_mode"
);
const darkTip = computed(() =>
  $q.dark.isActive ? "Modo oscuro" : "Modo claro"
);

function toggleDark() {
  const v = !$q.dark.isActive;
  Dark.set(v);
  themeStore.isDark = v;
  localStorage.setItem("darkMode", String(v));
  $q.notify({
    type: "info",
    message: v ? "Modo oscuro activado" : "Modo claro activado",
    icon: v ? "dark_mode" : "light_mode",
  });
}

function goHome() {
  router.push("/");
}

/* Notifications */
const notifOpen = ref(false);
const notificationsStore = useNotificationsStore();
const authStore = useAuthStore();

// Solo superadmin ve el home button y el selector de empresa en el header.
// Para admin_rrhh / employee / dt_inspector la empresa es fija y la navegación
// vive en el drawer.
const isSuperadmin = computed(
  () => String(authStore.user?.role || "").toLowerCase() === "superadmin"
);
const {
  items: notifications,
  unreadCount,
  loading: notifLoading,
  error: notifError,
  pendingMissedExits,
} = storeToRefs(notificationsStore);

const pendingActionCount = computed(() => pendingMissedExits.value.length);

let notifPoll = null;

function tryFetchNotifications() {
  if (!authStore.user?.id && !authStore.user?._id) return;
  notificationsStore.fetchLatest().catch(() => {});
}

onMounted(() => {
  tryFetchNotifications();
  notifPoll = setInterval(tryFetchNotifications, 60_000);
});

onBeforeUnmount(() => {
  if (notifPoll) clearInterval(notifPoll);
});

watch(
  () => authStore.user?.id || authStore.user?._id,
  (uid) => {
    if (uid) tryFetchNotifications();
    else notificationsStore.reset();
  },
  { immediate: true }
);

watch(notifOpen, (open) => {
  if (open) tryFetchNotifications();
});

async function markAllRead() {
  await notificationsStore.markAllAsRead();
  $q.notify({
    type: "positive",
    message: "Todas las notificaciones marcadas como leídas",
    icon: "done_all",
  });
}

function openNotif(n) {
  if (!n.read) notificationsStore.markAsRead(n.id).catch(() => {});
  notifOpen.value = false;
  if (n.action === "confirm-missed-exit" && !n.resolved) {
    openMissedExitResolver(n);
    return;
  }
  // Objeción del trabajador a una modificación: llevamos al empleador a la
  // página de asistencias, abriendo el historial de ese trabajador y el
  // diálogo "sostener / revertir" sobre la marca objetada (con el contexto
  // original vs. modificado que exige la decisión).
  if (n.action === "resolve-objection") {
    const attendanceId = n.meta?.attendanceId || null;
    const employeeId = n.meta?.employeeId || n.meta?.employee?.id || null;
    if (attendanceId) {
      router.push({
        path: "/rrhh/attendance",
        query: {
          resolveObjection: String(attendanceId),
          ...(employeeId ? { employeeId: String(employeeId) } : {}),
        },
      });
      return;
    }
  }
  // Resto de notificaciones accionables: navegamos al lugar donde se resuelven
  // (el mismo destino que los CTA de los correos). Si no hay destino conocido,
  // caemos al toast informativo.
  const dest = notifDestination(n);
  if (dest) {
    router.push(dest);
    return;
  }
  $q.notify({
    type: n.resolved ? "positive" : "info",
    message: n.title,
    caption: n.body,
    icon: n.icon,
  });
}

/**
 * Resuelve a dónde llevar al usuario cuando clickea una notificación accionable.
 * Devuelve un location object para router.push, o null si no hay destino
 * (ahí openNotif cae al toast informativo). El mapeo espeja los CTA de los
 * correos y se decide por el `kind`/`action` de la notificación (no por el rol),
 * porque una misma persona puede recibir avisos de aprobador y de trabajador.
 */
function notifDestination(n) {
  const kind = n.meta?.kind || null;
  const action = n.action || n.meta?.action || null;
  const requestId = n.meta?.requestId || null;

  // Solicitud nueva por aprobar → panel de solicitudes (aprobador).
  if (action === "review-request" || kind === "REQUEST_PENDING") {
    return {
      path: "/rrhh/requests",
      query: requestId ? { requestId: String(requestId) } : undefined,
    };
  }
  // Resultado de mi solicitud (aprobada/rechazada) → mis solicitudes (trabajador).
  if (kind === "REQUEST_DECISION") {
    return {
      path: "/employee/requests",
      query: requestId ? { requestId: String(requestId) } : undefined,
    };
  }
  return null;
}

/* Resolver de salida olvidada (desde la web) */
const resolverOpen = ref(false);
const resolverSaving = ref(false);
const resolverTarget = ref(null);
const resolverForm = reactive({ timestamp: "", note: "" });

function tsToLocalInput(d) {
  if (!d) return "";
  const dd = new Date(d);
  if (isNaN(dd)) return "";
  const pad = (x) => String(x).padStart(2, "0");
  return `${dd.getFullYear()}-${pad(dd.getMonth() + 1)}-${pad(dd.getDate())}T${pad(dd.getHours())}:${pad(dd.getMinutes())}`;
}

function openMissedExitResolver(n) {
  const entradaTs =
    n.meta?.attendance?.timestamp || n.meta?.attendanceTimestamp || null;
  resolverTarget.value = {
    attendanceId: n.meta?.attendanceId || n.meta?.attendance?.id || null,
    entradaTs,
  };
  // Sugerencia: entrada + 8h; si cae en el futuro, usar "ahora".
  let def = entradaTs
    ? new Date(new Date(entradaTs).getTime() + 8 * 3600 * 1000)
    : new Date();
  if (def.getTime() > Date.now()) def = new Date();
  resolverForm.timestamp = tsToLocalInput(def);
  resolverForm.note = "";
  if (!resolverTarget.value.attendanceId) {
    $q.notify({ type: "negative", message: "No se pudo identificar la marca de entrada." });
    return;
  }
  resolverOpen.value = true;
}

const resolverEntradaLabel = computed(() => {
  const ts = resolverTarget.value?.entradaTs;
  if (!ts) return "—";
  return new Date(ts).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
});

const resolverCanSubmit = computed(
  () => !!resolverTarget.value?.attendanceId && !!resolverForm.timestamp
);

async function submitMissedExit() {
  if (!resolverCanSubmit.value) return;
  resolverSaving.value = true;
  try {
    const iso = new Date(resolverForm.timestamp).toISOString();
    await notificationsStore.resolveMissedExit({
      attendanceId: resolverTarget.value.attendanceId,
      timestamp: iso,
      note: resolverForm.note,
    });
    $q.notify({ type: "positive", message: "Salida registrada. Asistencia corregida.", icon: "check_circle" });
    resolverOpen.value = false;
  } catch (err) {
    $q.notify({
      type: "negative",
      message: err?.response?.data?.message || "No se pudo registrar la salida",
    });
  } finally {
    resolverSaving.value = false;
  }
}

/* Command Palette */
const commandOpen = ref(false);
const query = ref("");
const hi = ref(0);
const isMac = (navigator?.platform || "").toUpperCase().includes("MAC");

// Comandos disponibles según el rol del usuario activo. Se resuelven en
// runtime contra las rutas reales del router (ver src/router/index.js).
const baseCommands = computed(() => {
  const role = (authStore.user?.role || "").toLowerCase();
  const home = roleHomeFor(role);

  const cmds = [
    {
      key: "home",
      icon: "home",
      label: "Inicio",
      desc: "Ir a tu panel",
      to: home,
    },
    {
      key: "perfil",
      icon: "person",
      label: "Mi perfil",
      desc: "Editar información personal",
      to: "/profile",
    },
    {
      key: "config",
      icon: "settings",
      label: "Configuración",
      desc: "Ajustes y preferencias",
      to: "/configuration",
    },
  ];

  if (role === "admin_rrhh") {
    cmds.push(
      { key: "rrhh-empleados", icon: "group", label: "Empleados", desc: "Gestionar empleados", to: "/rrhh/users" },
      { key: "rrhh-horarios", icon: "schedule", label: "Horarios", desc: "Gestión de horarios", to: "/rrhh/horarios" },
      { key: "rrhh-asistencias", icon: "fact_check", label: "Asistencias", desc: "Asistencias por empleado", to: "/rrhh/attendance" },
      { key: "rrhh-empresa", icon: "business", label: "Mi empresa", desc: "Datos de tu empresa", to: "/rrhh/empresa" },
      { key: "rrhh-solicitudes", icon: "assignment", label: "Solicitudes", desc: "Solicitudes de empleados", to: "/rrhh/requests" },
      { key: "rrhh-payroll", icon: "request_quote", label: "Liquidaciones", desc: "Procesar nómina", to: "/rrhh/payroll" },
      { key: "rrhh-payroll-rates", icon: "tune", label: "Config Nómina", desc: "Tarifas y conceptos", to: "/rrhh/payrollRates" },
      { key: "rrhh-dt-reportes", icon: "summarize", label: "Reportes DT", desc: "Reportes Dirección del Trabajo", to: "/rrhh/dt/reportes" },
      { key: "rrhh-dt-libro", icon: "menu_book", label: "Libro de Asistencia", desc: "Libro DT", to: "/rrhh/dt/libro" },
      { key: "rrhh-dt-tokens", icon: "vpn_key", label: "Fiscalizadores DT", desc: "Tokens DT", to: "/rrhh/dt/tokens" },
      { key: "rrhh-dt-auditoria", icon: "history", label: "Bitácora", desc: "Auditoría de cambios", to: "/rrhh/dt/auditoria" },
    );
  } else if (role === "superadmin" || role === "admin") {
    cmds.push(
      { key: "sa-empresas", icon: "business", label: "Empresas (plataforma)", desc: "Listado global", to: "/superadmin/empresas" },
      { key: "sa-empresa-new", icon: "add_business", label: "Nueva empresa", desc: "Crear empresa", to: "/superadmin/empresas/new" },
      { key: "sa-admins-rrhh", icon: "admin_panel_settings", label: "Administradores RR.HH.", desc: "Gestionar admins", to: "/superadmin/admins-rrhh" },
      { key: "sa-dt-reportes", icon: "summarize", label: "Reportes DT (global)", desc: "Reportes plataforma", to: "/superadmin/dt/reportes" },
      { key: "sa-dt-libro", icon: "menu_book", label: "Libro de Asistencia", desc: "Libro DT global", to: "/superadmin/dt/libro" },
      { key: "sa-dt-tokens", icon: "vpn_key", label: "Tokens fiscalizadores", desc: "Tokens DT", to: "/superadmin/dt/tokens" },
      { key: "sa-dt-auditoria", icon: "history", label: "Auditoría global", desc: "Bitácora de plataforma", to: "/superadmin/dt/auditoria" },
    );
  } else if (role === "employee") {
    cmds.push(
      { key: "emp-attendance", icon: "fingerprint", label: "Marcar asistencia", desc: "Registrar entrada/salida", to: "/employee/attendance" },
      { key: "emp-history", icon: "history", label: "Historial", desc: "Mis marcas anteriores", to: "/employee/history" },
      { key: "emp-libro", icon: "menu_book", label: "Mi libro de asistencia", desc: "Libro DT", to: "/employee/libro" },
      { key: "emp-create-request", icon: "add_circle", label: "Nueva solicitud", desc: "Crear solicitud", to: "/employee/create-request" },
      { key: "emp-requests", icon: "assignment", label: "Mis solicitudes", desc: "Estado de solicitudes", to: "/employee/requests" },
      { key: "emp-documents", icon: "description", label: "Mis documentos", desc: "Documentos personales", to: "/employee/documents" },
      { key: "emp-comprobantes", icon: "receipt_long", label: "Mis comprobantes DT", desc: "Comprobantes Res. 38/2024", to: "/employee/comprobantes" },
      { key: "emp-consent", icon: "verified_user", label: "Consentimiento DT", desc: "Firma de consentimiento", to: "/employee/consentimiento" },
    );
  } else if (role === "dt_inspector") {
    cmds.push(
      { key: "ins-attendance", icon: "fact_check", label: "Asistencias — DT", desc: "Revisar asistencias", to: "/inspector/attendance" },
      { key: "ins-audit", icon: "history", label: "Bitácora — DT", desc: "Auditoría", to: "/inspector/audit" },
      { key: "ins-reports", icon: "summarize", label: "Reportes DT", desc: "Reportes de fiscalización", to: "/inspector/reports" },
    );
  }

  // Cambio de empresa: SOLO superadmin (un admin_rrhh tiene una sola empresa
  // por ley laboral CL — su contexto es fijo y no se cambia desde aquí).
  // Las empresas reales se buscan/cambian desde el dropdown del CompanySwitcher
  // (que llama a /companies/search con paginación). En ⌘K dejamos un atajo
  // que abre ese dropdown para mantener la consistencia.
  if (role === "superadmin") {
    cmds.push({
      key: "switch-company-open",
      icon: "swap_horiz",
      label: "Cambiar empresa activa",
      desc: "Abrir selector de empresa (todas las empresas de la plataforma)",
      openCompanySwitcher: true,
    });
  }

  return cmds;
});

// Mismo mapping que el router (roleHome) pero local al header.
function roleHomeFor(role) {
  switch (String(role || "").toLowerCase()) {
    case "superadmin": return "/superadmin/dashboard";
    case "admin_rrhh": return "/rrhh/dashboard";
    case "employee": return "/employee/dashboard";
    case "dt_inspector": return "/inspector/dashboard";
    case "admin": return "/superadmin/dashboard";
    case "empresa":
    case "company": return "/rrhh/dashboard";
    default: return "/";
  }
}

const results = computed(() => {
  const q = (query.value || "").toLowerCase();
  const all = baseCommands.value;
  if (!q) return all;
  return all.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q) ||
      c.key.toLowerCase().includes(q)
  );
});

function openCommand() {
  commandOpen.value = true;
  query.value = "";
  hi.value = 0;
}

// Al filtrar, la lista se acorta: el índice resaltado debe volver al inicio
// o quedaría apuntando fuera de rango (Enter no haría nada).
watch(results, () => {
  hi.value = 0;
});

function move(dir) {
  const len = results.value.length;
  if (len === 0) return;
  hi.value = (hi.value + dir + len) % len;
  // El diálogo está teletransportado a <body>: se busca desde document.
  nextTick(() => {
    document
      .querySelector(".rk-command-item.active")
      ?.scrollIntoView({ block: "nearest" });
  });
}

function activate() {
  const it = results.value[hi.value];
  if (it) exec(it);
}

async function exec(opt) {
  commandOpen.value = false;
  if (opt.openCompanySwitcher) {
    // Dispara click sobre el chip del header para que abra su dropdown.
    // El dropdown ya maneja búsqueda + recientes contra /companies/search.
    nextTick(() => {
      const trigger = document.querySelector('.rk-pill-trigger.is-clickable');
      if (trigger) trigger.click();
    });
    return;
  }
  if (opt.to) router.push(opt.to);
}

function onGlobalKey(e) {
  const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
  if (isCmdK) {
    e.preventDefault();
    openCommand();
  }
}

/* Network status */
const isOnline = ref(navigator.onLine);
function onOnline() {
  isOnline.value = true;
}
function onOffline() {
  isOnline.value = false;
  $q.notify({
    type: "warning",
    message: "Sin conexión a internet",
    icon: "wifi_off",
  });
}

onMounted(() => {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  window.addEventListener("keydown", onGlobalKey);
  
  const saved = localStorage.getItem("darkMode");
  if (saved !== null) {
    const v = saved === "true";
    Dark.set(v);
    themeStore.isDark = v;
  } else {
    localStorage.setItem("darkMode", String(Dark.isActive));
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("online", onOnline);
  window.removeEventListener("offline", onOffline);
  window.removeEventListener("keydown", onGlobalKey);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');

/* Theme Variables */
.rk-header {
  --header-bg: rgba(255, 255, 255, 0.92);
  --header-border: color-mix(in srgb, var(--color-primary, #0CA9C4) 12%, transparent);
  --text-primary: rgba(15, 23, 42, 0.95);
  --text-secondary: rgba(15, 23, 42, 0.7);
  --text-muted: rgba(15, 23, 42, 0.5);
  --surface-1: color-mix(in srgb, var(--color-primary, #0CA9C4) 6%, transparent);
  --surface-2: color-mix(in srgb, var(--color-primary, #0CA9C4) 10%, transparent);
  --border-1: color-mix(in srgb, var(--color-primary, #0CA9C4) 18%, transparent);
  backdrop-filter: saturate(1.2) blur(16px);
  border-bottom: 1.5px solid var(--header-border);
  background: var(--header-bg);
  font-family: 'Sora', -apple-system, sans-serif;
}

.body--dark .rk-header {
  --header-bg: rgba(10, 14, 20, 0.92);
  --header-border: color-mix(in srgb, var(--color-primary, #0CA9C4) 22%, transparent);
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --surface-1: color-mix(in srgb, var(--color-primary, #0CA9C4) 10%, transparent);
  --surface-2: color-mix(in srgb, var(--color-primary, #0CA9C4) 16%, transparent);
  --border-1: color-mix(in srgb, var(--color-primary, #0CA9C4) 24%, transparent);
}

/* Header Bar */
.rk-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 20px;
  min-height: 64px;
}

/* Left Section */
.rk-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Menu Button */
.rk-menu-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--text-primary);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.rk-menu-btn:hover {
  background: var(--surface-1);
  color: var(--color-primary-light);
}

.rk-menu-btn .q-icon {
  font-size: 22px;
  z-index: 1;
}

.rk-btn-ripple {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, var(--color-primary), transparent 70%);
  opacity: 0;
  transform: scale(0);
  transition: all 0.6s ease;
}

.rk-menu-btn:active .rk-btn-ripple {
  opacity: 0.3;
  transform: scale(1);
}

/* Compact home button (Recksy logo) */
.rk-home-btn {
  position: relative;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border: none;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary, #0CA9C4) 30%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: visible;
  flex-shrink: 0;
}

.rk-home-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--color-primary, #0CA9C4) 45%, transparent);
}

.rk-home-btn:active {
  transform: translateY(0);
}

.rk-home-btn .q-icon {
  font-size: 20px;
  color: #fff;
  z-index: 1;
}

.rk-home-pulse {
  position: absolute;
  inset: -3px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 12px;
  opacity: 0;
  filter: blur(6px);
  animation: brandPulse 3s ease-in-out infinite;
}

@keyframes brandPulse {
  0%, 100% { opacity: 0; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(1.15); }
}

/* Right Section */
.rk-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Action Buttons */
.rk-action-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.rk-action-btn:hover {
  background: var(--surface-1);
  color: var(--color-primary-light);
}

.rk-action-btn .q-icon {
  font-size: 20px;
}

/* Theme Indicator */
.rk-theme-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  background: var(--color-primary);
  border-radius: 50%;
  border: 1.5px solid var(--header-bg);
}

/* Notification Badge */
.rk-notif-wrapper {
  position: relative;
}

.rk-notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  background: var(--color-danger);
  border: 2px solid var(--header-bg);
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 800;
  color: #fff;
  z-index: 2;
}

.rk-badge-pulse {
  position: absolute;
  inset: -2px;
  background: var(--color-danger);
  border-radius: 10px;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  70% {
    opacity: 0.6;
    transform: scale(1.5);
  }
}

/* Punto ámbar para acciones pendientes (no leídas = 0, pero hay tareas sin resolver) */
.rk-notif-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 10px;
  height: 10px;
  background: var(--color-warning);
  border: 2px solid var(--header-bg);
  border-radius: 50%;
  z-index: 2;
}

.rk-notif-dot-pulse {
  position: absolute;
  inset: -2px;
  background: var(--color-warning);
  border-radius: 50%;
  animation: badgePulse 2s ease-in-out infinite;
}

/* Glow del icono cuando hay notificaciones que atender */
.rk-notif-btn.has-unread .q-icon {
  color: var(--color-danger);
  animation: bellShake 2.4s ease-in-out infinite;
}

.rk-notif-btn.has-unread {
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.45);
  animation: bellGlow 2.4s ease-in-out infinite;
}

.rk-notif-btn.has-pending .q-icon {
  color: var(--color-warning);
}

@keyframes bellGlow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.18);
  }
}

@keyframes bellShake {
  0%, 50%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-10deg); }
  20%, 40% { transform: rotate(10deg); }
}

/* Notifications Menu */
.rk-notif-menu {
  margin-top: 8px;
}

.rk-notif-panel {
  width: 400px;
  max-width: 95vw;
  background: var(--header-bg);
  backdrop-filter: blur(20px);
  border: 1.5px solid var(--border-1);
  border-radius: 16px;
  overflow: hidden;
}

.rk-notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px;
  border-bottom: 1.5px solid var(--border-1);
}

.rk-notif-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rk-notif-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(12, 169, 196, 0.3);
}

.rk-notif-icon .q-icon {
  font-size: 20px;
  color: #fff;
}

.rk-notif-title {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0 0 2px 0;
  color: var(--text-primary);
}

.rk-notif-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 600;
}

.rk-mark-read-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.rk-mark-read-btn:hover {
  background: var(--surface-2);
  color: var(--color-primary-light);
}

.rk-mark-read-btn .q-icon {
  font-size: 16px;
}

/* Notification List */
.rk-notif-list {
  max-height: 400px;
  overflow-y: auto;
}

.rk-notif-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.rk-notif-item:hover {
  background: var(--surface-1);
}

.rk-notif-item:last-child {
  border-bottom: none;
}

.rk-notif-unread {
  background: var(--surface-1);
}

.rk-notif-item-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 8px;
  flex-shrink: 0;
}

.rk-notif-item-icon .q-icon {
  font-size: 18px;
  color: var(--color-primary-light);
}

.rk-notif-item-content {
  flex: 1;
}

.rk-notif-item-title {
  font-size: 0.92rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--text-primary);
  line-height: 1.4;
}

.rk-notif-item-body {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 6px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rk-notif-item-time {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.rk-notif-item-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.rk-notif-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.rk-notif-tag-warning {
  background: var(--color-warning-soft);
  border-color: rgba(217, 119, 6, 0.3);
  color: var(--color-warning);
}

.rk-notif-tag-success {
  background: var(--color-success-soft);
  border-color: rgba(22, 163, 74, 0.3);
  color: var(--color-success);
}

.rk-notif-pending {
  border-left: 3px solid var(--color-warning);
}

.rk-notif-resolved {
  border-left: 3px solid var(--color-success);
}

.rk-notif-item-dot {
  width: 8px;
  height: 8px;
  background: var(--color-danger);
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

/* Empty State */
.rk-notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.rk-empty-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-1);
  border-radius: 16px;
  margin-bottom: 16px;
}

.rk-empty-icon .q-icon {
  font-size: 32px;
  color: var(--text-muted);
}

.rk-empty-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}

.rk-empty-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

/* Tooltip */
.rk-tooltip {
  background: rgba(12, 169, 196, 0.95);
  backdrop-filter: blur(10px);
  font-size: 0.85rem;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
}

/* Page Actions */
.rk-page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Responsive */
@media (max-width: 767px) {
  .rk-header-bar {
    padding: 10px 16px;
    min-height: 56px;
  }

  .rk-notif-panel {
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
    border: none;
    border-top: 1.5px solid var(--border-1);
  }
}

@media (max-width: 599px) {
  .rk-header-left {
    gap: 8px;
  }

  .rk-home-btn {
    width: 34px;
    height: 34px;
  }

  .rk-home-btn .q-icon {
    font-size: 18px;
  }

  .rk-action-btn {
    width: 36px;
    height: 36px;
  }

  .rk-action-btn .q-icon {
    font-size: 18px;
  }
}
</style>

<!--
  Estilos NO scoped para el command palette y el menú de notificaciones.
  Quasar teletransporta q-dialog/q-menu a <body>: los nodos conservan el
  atributo de scope, pero NO los CSS vars locales de `.rk-header` (se heredan
  por cascada y ese ancestro ya no existe). Por eso aquí se redefinen las
  variables sobre los propios paneles, a partir de los tokens globales.
-->
<style>
/* Variables para los paneles teletransportados (antes quedaban sin resolver
   y el fondo se volvía transparente). */
.rk-command-palette,
.rk-notif-panel {
  --rk-pop-surface: var(--card-background, #fff);
  --rk-pop-soft: color-mix(in srgb, var(--color-primary, #0ca9c4) 8%, transparent);
  --rk-pop-soft-strong: color-mix(in srgb, var(--color-primary, #0ca9c4) 14%, transparent);
  --rk-pop-border: color-mix(in srgb, var(--color-primary, #0ca9c4) 18%, transparent);
  --rk-pop-hairline: color-mix(in srgb, var(--color-primary, #0ca9c4) 12%, transparent);
  --rk-pop-brand: linear-gradient(135deg, var(--color-primary, #0ca9c4), var(--color-accent, #0893aa));

  /* Compatibilidad con las reglas scoped que aún consumen estos nombres */
  --header-bg: var(--card-background, #fff);
  --surface-1: color-mix(in srgb, var(--color-primary, #0ca9c4) 7%, transparent);
  --surface-2: color-mix(in srgb, var(--color-primary, #0ca9c4) 12%, transparent);
  --border-1: color-mix(in srgb, var(--color-primary, #0ca9c4) 18%, transparent);
}

body.body--dark .rk-command-palette,
body.body--dark .rk-notif-panel {
  --rk-pop-hairline: rgba(255, 255, 255, 0.08);
  --rk-pop-border: color-mix(in srgb, var(--color-primary, #0ca9c4) 26%, transparent);
  --border-1: color-mix(in srgb, var(--color-primary, #0ca9c4) 26%, transparent);
}

/* ===== Command palette ===== */
.rk-command-dialog .q-dialog__backdrop {
  backdrop-filter: saturate(1.1) blur(10px);
  background: rgba(8, 12, 18, 0.55);
}

/* Una paleta de comandos vive arriba, no centrada en la pantalla */
.rk-command-dialog .q-dialog__inner {
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
}

.rk-command-palette {
  position: relative;
  width: min(660px, 94vw);
  background: var(--rk-pop-surface);
  border: 1.5px solid var(--rk-pop-border);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(8, 12, 18, 0.28), 0 6px 18px rgba(8, 12, 18, 0.12);
  font-family: 'Sora', -apple-system, sans-serif;
  color: var(--text-primary);
}

body.body--dark .rk-command-palette {
  box-shadow: 0 36px 90px rgba(0, 0, 0, 0.7);
}

/* Resplandor de marca: da profundidad sin ensuciar el fondo */
.rk-command-glow {
  position: absolute;
  top: -110px;
  left: 50%;
  transform: translateX(-50%);
  width: 380px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse,
    color-mix(in srgb, var(--color-primary, #0ca9c4) 26%, transparent),
    transparent 70%
  );
  filter: blur(24px);
  pointer-events: none;
}

/* ----- Buscador ----- */
.rk-command-header {
  position: relative;
  padding: 14px;
  border-bottom: 1.5px solid var(--rk-pop-hairline);
}

.rk-command-search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 8px 8px;
  border-radius: 16px;
  background: var(--rk-pop-soft);
  border: 1.5px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.rk-command-search:focus-within {
  border-color: var(--rk-pop-border);
  box-shadow: 0 0 0 4px var(--rk-pop-soft);
}

.rk-search-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: var(--rk-pop-brand);
  box-shadow: 0 4px 12px rgba(12, 169, 196, 0.32);
}

.rk-search-tile .q-icon {
  font-size: 19px;
  color: #fff;
}

.rk-command-search .rk-search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'Sora', -apple-system, sans-serif;
}

.rk-command-search .rk-search-input::placeholder {
  color: var(--text-muted);
  font-weight: 500;
}

.rk-search-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: var(--rk-pop-soft-strong);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.rk-search-clear:hover {
  background: var(--color-primary, #0ca9c4);
  color: #fff;
}

.rk-search-clear .q-icon {
  font-size: 14px;
}

.rk-command-search .rk-search-kbd {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.rk-command-search .rk-search-kbd kbd,
.rk-command-kbd,
.rk-hint-item kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: var(--rk-pop-surface);
  border: 1px solid var(--rk-pop-border);
  border-bottom-width: 2px;
  border-radius: 7px;
  font-size: 0.72rem;
  font-family: 'Space Mono', ui-monospace, monospace;
  font-weight: 700;
  line-height: 1;
  color: var(--text-secondary);
}

/* ----- Resultados ----- */
.rk-command-results {
  position: relative;
  max-height: min(52vh, 420px);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.rk-command-results::-webkit-scrollbar {
  width: 8px;
}

.rk-command-results::-webkit-scrollbar-thumb {
  background: var(--rk-pop-soft-strong);
  border-radius: 99px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.rk-results-section {
  padding: 8px;
}

.rk-results-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 6px;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.rk-results-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 99px;
  background: var(--rk-pop-soft-strong);
  color: var(--color-primary, #0ca9c4);
  font-size: 0.68rem;
  letter-spacing: 0;
}

.rk-command-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}

.rk-command-item.active {
  background: var(--rk-pop-soft);
  transform: translateX(2px);
}

/* Barra de acento a la izquierda del elemento activo */
.rk-command-bar {
  position: absolute;
  left: 3px;
  top: 50%;
  width: 3px;
  height: 22px;
  border-radius: 99px;
  background: var(--rk-pop-brand);
  transform: translateY(-50%) scaleY(0);
  opacity: 0;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.rk-command-item.active .rk-command-bar {
  transform: translateY(-50%) scaleY(1);
  opacity: 1;
}

.rk-command-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--rk-pop-soft-strong);
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.rk-command-item.active .rk-command-item-icon {
  background: var(--rk-pop-brand);
  box-shadow: 0 4px 12px rgba(12, 169, 196, 0.35);
}

.rk-command-item-icon .q-icon {
  font-size: 20px;
  color: var(--color-primary, #0ca9c4);
  transition: color 0.18s ease;
}

.rk-command-item.active .rk-command-item-icon .q-icon {
  color: #fff;
}

.rk-command-item-content {
  flex: 1;
  min-width: 0;
}

.rk-command-item-label {
  font-size: 0.92rem;
  font-weight: 700;
  margin: 0 0 2px 0;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rk-command-item-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Pista "↵" sólo en el elemento activo */
.rk-command-enter {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: var(--rk-pop-soft-strong);
  color: var(--color-primary, #0ca9c4);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.rk-command-enter .q-icon {
  font-size: 14px;
}

.rk-command-item.active .rk-command-enter {
  opacity: 1;
  transform: translateX(0);
}

/* ----- Vacío ----- */
.rk-command-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 44px 24px;
  text-align: center;
}

.rk-command-empty .rk-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  border-radius: 20px;
  background: var(--rk-pop-soft);
  border: 1.5px dashed var(--rk-pop-border);
}

.rk-command-empty .rk-empty-icon .q-icon {
  font-size: 30px;
  color: var(--color-primary, #0ca9c4);
  opacity: 0.7;
}

.rk-command-empty .rk-empty-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.rk-command-empty .rk-empty-hint {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 0;
}

/* ----- Pie ----- */
.rk-command-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1.5px solid var(--rk-pop-hairline);
  background: var(--rk-pop-soft);
}

.rk-command-hints {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.rk-hint-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  color: var(--text-muted);
  font-weight: 600;
}

.rk-command-brand {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 2px;
  background: var(--rk-pop-brand);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.75;
}

@media (max-width: 767px) {
  .rk-command-dialog .q-dialog__inner {
    padding-top: 0;
  }

  .rk-command-palette {
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
    border: none;
  }

  .rk-command-brand {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rk-command-item,
  .rk-command-bar,
  .rk-command-enter,
  .rk-command-item-icon {
    transition: none;
  }
}
</style>
