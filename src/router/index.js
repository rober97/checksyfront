// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { hasAllPermissions, hasAnyPermission } from '@/utils/permissions'

// ====== Layouts (eager: el shell carga rápido)
import AdminLayout from '@/layouts/AdminLayout.vue'
import CompanyLayout from '@/layouts/EmpresaLayout.vue'
import EmployeeLayout from '@/layouts/EmpleadoLayout.vue'
import InspectorLayout from '@/layouts/InspectorLayout.vue'

// ====== Views (lazy: reduce el bundle inicial)
const HomePublic = () => import(/* webpackChunkName:"public"    */ '@/views/HomePublic.vue')
const Login = () => import(/* webpackChunkName:"public"    */ '@/views/Login.vue')
const Register = () => import(/* webpackChunkName:"public"    */ '@/views/Register.vue')
const NotFound = () => import(/* webpackChunkName:"misc"      */ '@/views/NotFound.vue')
const Dashboard = () => import(/* webpackChunkName:"dashboard" */ '@/views/Dashboard.vue')

const Permissions = () => import(/* webpackChunkName:"admin"     */ '@/views/Admin/Permisos.vue')
const UserManagement = () => import(/* webpackChunkName:"admin"     */ '@/views/Admin/GestionUsuarios.vue')
const GestionHorarios = () => import(/* webpackChunkName:"admin"     */ '@/views/Admin/GestionHorarios.vue')
const AsistenciasEmp = () => import(/* webpackChunkName:"admin"     */ '@/views/Admin/AsistenciasPorEmpleado.vue')
const Payroll = () => import(/* webpackChunkName:"admin"     */ "@/views/Admin//Payroll/PayrollModule.vue")
const PayrollRate = () => import(/* webpackChunkName:"admin"     */ "@/views/Admin//Payroll/PayrollRate.vue")

const CompanyList = () => import(/* webpackChunkName:"empresa"   */ '@/views/Empresa/EmpresaList.vue')
const CompanyForm = () => import(/* webpackChunkName:"empresa"   */ '@/views/Empresa/EmpresaForm.vue')
const CompanyDetail = () => import(/* webpackChunkName:"empresa"   */ '@/views/Empresa/EmpresaDetalle.vue')

const RequestListEmployee = () => import(/* webpackChunkName:"solicitud" */ '@/views/Solicitudes/RequestsListEmployee.vue')

const EmployeeDocs = () => import(/* webpackChunkName:"docs"      */ '@/views/Documentos/DocumentosEmpleado.vue')
const UploadDocument = () => import(/* webpackChunkName:"docs"      */ '@/views/Documentos/SubirDocumento.vue')

const CompanyReport = () => import(/* webpackChunkName:"reportes"  */ '@/views/Empresa/ReporteGeneral.vue')

const RequestList = () => import(/* webpackChunkName:"solicitud" */ '@/views/Solicitudes/SolicitudesList.vue')
const ApproveRequests = () => import(/* webpackChunkName:"solicitud" */ '@/views/Solicitudes/AprobarSolicitudes.vue')
const Attendance = () => import(/* webpackChunkName:"empleado"  */ '@/views/Empleado/MarcarAsistencia.vue')
const History = () => import(/* webpackChunkName:"empleado"  */ '@/views/Empleado/Historial.vue')
const CreateRequest = () => import(/* webpackChunkName:"solicitud" */ '@/views/Solicitudes/CrearSolicitud.vue')
const Configuration = () => import(/* webpackChunkName:"user"      */ '@/views/Usuarios/Configuration.vue')

// ====== DT Compliance (Res. Ex. 38/2024 — Dirección del Trabajo)
const DtReportesDT = () => import(/* webpackChunkName:"dt" */ '@/views/DT/ReportesDT.vue')
const DtTokensInspector = () => import(/* webpackChunkName:"dt" */ '@/views/DT/TokensInspector.vue')
const DtAuditoria = () => import(/* webpackChunkName:"dt" */ '@/views/DT/AuditoriaDT.vue')
const DtLibroAsistencia = () => import(/* webpackChunkName:"dt" */ '@/views/DT/LibroAsistencia.vue')
const EmpComprobante = () => import(/* webpackChunkName:"dt" */ '@/views/Empleado/Comprobante.vue')
const EmpConsentimiento = () => import(/* webpackChunkName:"dt" */ '@/views/Empleado/ConsentimientoDT.vue')
const VerificarComprobante = () => import(/* webpackChunkName:"public" */ '@/views/Public/VerificarComprobante.vue')
const InspectorDashboard = () => import(/* webpackChunkName:"inspector" */ '@/views/Inspector/Dashboard.vue')
const InspectorAsistencias = () => import(/* webpackChunkName:"inspector" */ '@/views/Inspector/Asistencias.vue')

// ====== Superadmin (plataforma)
const SuperadminDashboard = () => import(/* webpackChunkName:"superadmin" */ '@/views/Superadmin/Dashboard.vue')
const SuperadminEmpresas = () => import(/* webpackChunkName:"superadmin" */ '@/views/Superadmin/Empresas.vue')
const SuperadminAdminsRrhh = () => import(/* webpackChunkName:"superadmin" */ '@/views/Superadmin/AdminsRrhh.vue')

// ====== Utilidades de autorización y navegación
const BASE = process.env.BASE_URL || '/'
const APP_TITLE = 'Recksy'
const DEFAULT_PERMS_MODE = 'all' // 'all' | 'any'

const normalizeRole = (r) => String(r || '').toLowerCase()
const hasRequiredRole = (userRole, requiredRoles) => {
  if (!requiredRoles?.length) return true
  const target = normalizeRole(userRole)
  return requiredRoles.map(normalizeRole).includes(target)
}

const hasPermissions = (auth, requiredPerms = [], mode = DEFAULT_PERMS_MODE) => {
  if (!requiredPerms.length) return true
  // Superadmin siempre pasa (dueño de la plataforma).
  if (normalizeRole(auth?.role || auth?.user?.role) === 'superadmin') return true
  const granted = auth?.permissions || auth?.user?.permissions || []
  return mode === 'any'
    ? hasAnyPermission(granted, requiredPerms)
    : hasAllPermissions(granted, requiredPerms)
}

const isInternalPath = (p) => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//')
const safeRedirectOf = (to) => {
  const raw = to?.query?.redirect
  if (!raw) return null
  let val = String(raw)
  try { val = decodeURIComponent(val) } catch (_) { }
  return isInternalPath(val) ? val : null
}

// Landing por rol (modelo 2026):
//   superadmin   → /superadmin/dashboard    (plataforma completa)
//   admin_rrhh   → /rrhh/dashboard          (su empresa)
//   employee     → /employee/dashboard      (sólo él)
//   dt_inspector → /inspector/dashboard     (fiscalización DT)
const roleHome = (role) => {
  switch (normalizeRole(role)) {
    case 'superadmin': return '/superadmin/dashboard'
    case 'admin_rrhh': return '/rrhh/dashboard'
    case 'employee': return '/employee/dashboard'
    case 'dt_inspector': return '/inspector/dashboard'
    // Compat: si el JWT trae roles legacy los mapeamos
    case 'admin': return '/superadmin/dashboard'
    case 'empresa': return '/rrhh/dashboard'
    case 'company': return '/rrhh/dashboard'
    default: return '/'
  }
}

// ====== Definición de rutas
const routes = [
  // Público
  { path: '/', name: 'Home', component: HomePublic, meta: { public: true, title: 'Inicio' } },
  { path: '/login', name: 'Login', component: Login, meta: { public: true, onlyGuests: true, title: 'Iniciar sesión' } },
  { path: '/register', name: 'Register', component: Register, meta: { public: true, onlyGuests: true, title: 'Registro' } },

  // ===== Verificador público DT (Res. Ex. 38/2024) =====
  // Accesible sin login para que cualquiera (incluida la DT) pueda validar un comprobante por su hash.
  { path: '/verificar-comprobante', name: 'VerificarComprobante', component: VerificarComprobante, meta: { public: true, title: 'Verificar comprobante' } },
  { path: '/verificar-comprobante/:hash', name: 'VerificarComprobanteHash', component: VerificarComprobante, props: true, meta: { public: true, title: 'Verificar comprobante' } },

  // Perfil/config (cualquier rol autenticado)
  { path: '/configuration', name: 'ConfigurationRoot', component: Configuration, meta: { requiresAuth: true, title: 'Configuración' } },

  // =====================================================================
  // SUPERADMIN (plataforma — sólo tú)
  // =====================================================================
  {
    path: '/superadmin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['superadmin'] },
    children: [
      { path: '', redirect: { name: 'SuperadminDashboard' } },
      { path: 'dashboard', name: 'SuperadminDashboard', component: SuperadminDashboard, meta: { title: 'Plataforma • Superadmin' } },
      { path: 'empresas', name: 'SuperadminEmpresas', component: SuperadminEmpresas, meta: { title: 'Empresas (plataforma)' } },
      { path: 'empresas/new', name: 'SuperadminEmpresaNew', component: CompanyForm, meta: { title: 'Nueva empresa' } },
      { path: 'empresas/:id', name: 'SuperadminEmpresaDetail', component: CompanyDetail, props: true, meta: { title: 'Detalle empresa' } },
      { path: 'admins-rrhh', name: 'SuperadminAdminsRrhh', component: SuperadminAdminsRrhh, meta: { title: 'Administradores RR.HH.' } },
      // Reportes y herramientas DT globales
      { path: 'dt/reportes', name: 'SuperadminDtReportes', component: DtReportesDT, meta: { title: 'Reportes DT (global)' } },
      { path: 'dt/libro', name: 'SuperadminDtLibro', component: DtLibroAsistencia, meta: { title: 'Libro de Asistencia' } },
      { path: 'dt/tokens', name: 'SuperadminDtTokens', component: DtTokensInspector, meta: { title: 'Tokens fiscalizadores' } },
      { path: 'dt/auditoria', name: 'SuperadminDtAuditoria', component: DtAuditoria, meta: { title: 'Auditoría global' } },
    ]
  },

  // =====================================================================
  // ADMIN RR.HH. (administrador de RR.HH. de UNA empresa cliente)
  // Paths antes eran /admin/*, ahora son /rrhh/*. Usa el mismo AdminLayout.
  // =====================================================================
  {
    path: '/rrhh',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['admin_rrhh'] },
    children: [
      { path: '', redirect: { name: 'RrhhDashboard' } },
      { path: 'dashboard', name: 'RrhhDashboard', component: Dashboard, meta: { title: 'Panel RR.HH.' } },
      { path: 'users', name: 'RrhhUsers', component: UserManagement, meta: { permissions: ['users:read'], title: 'Empleados' } },
      { path: 'permissions', name: 'RrhhPermissions', component: Permissions, meta: { permissions: ['permissions:read'], title: 'Permisos' } },
      { path: 'horarios', name: 'RrhhHorarios', component: GestionHorarios, meta: { permissions: ['schedules:read'], title: 'Horarios' } },
      { path: 'attendance', name: 'RrhhAttendance', component: AsistenciasEmp, meta: { permissions: ['attendance:read'], title: 'Asistencias' } },
      { path: 'empresa', name: 'RrhhEmpresa', component: CompanyDetail, props: true, meta: { title: 'Mi empresa' } },
      { path: 'requests', name: 'RrhhRequests', component: RequestList, props: true, meta: { title: 'Solicitudes' } },
      { path: 'payroll', name: 'RrhhPayroll', component: Payroll, props: true, meta: { title: 'Liquidaciones' } },
      { path: 'payrollRates', name: 'RrhhPayrollRate', component: PayrollRate, props: true, meta: { title: 'Config Nómina' } },
      // DT Compliance de la empresa
      { path: 'dt/reportes', name: 'RrhhDtReportes', component: DtReportesDT, meta: { title: 'Reportes DT' } },
      { path: 'dt/libro', name: 'RrhhDtLibro', component: DtLibroAsistencia, meta: { title: 'Libro de Asistencia' } },
      { path: 'dt/tokens', name: 'RrhhDtTokens', component: DtTokensInspector, meta: { title: 'Fiscalizadores DT' } },
      { path: 'dt/auditoria', name: 'RrhhDtAuditoria', component: DtAuditoria, meta: { title: 'Bitácora' } },
    ]
  },

  // Redirect legacy /admin → /rrhh (simplificado; no hay data vieja)
  { path: '/admin', redirect: '/rrhh/dashboard' },

  // Employee
  {
    path: '/employee',
    component: EmployeeLayout,
    meta: { requiresAuth: true, roles: ['employee'] },
    children: [
      { path: '', redirect: { name: 'EmployeeDashboard' } },
      { path: 'dashboard', name: 'EmployeeDashboard', component: Dashboard, meta: { title: 'Panel • Empleado' } },
      { path: 'attendance', name: 'Attendance', component: Attendance, meta: { title: 'Marcar asistencia' } },
      { path: 'history', name: 'History', component: History, meta: { title: 'Historial' } },
      { path: 'libro', name: 'EmployeeLibro', component: DtLibroAsistencia, meta: { title: 'Mi libro de asistencia' } },
      { path: 'create-request', name: 'CreateRequest', component: CreateRequest, meta: { title: 'Nueva solicitud' } },
      { path: 'documents', name: 'Documents', component: EmployeeDocs, meta: { title: 'Documents' } },
      { path: 'requests', name: 'Requests', component: RequestListEmployee, meta: { title: 'Requests' } },
      // ===== DT Compliance para el trabajador =====
      { path: 'comprobantes', name: 'EmpComprobantes', component: EmpComprobante, meta: { title: 'Mis comprobantes DT' } },
      { path: 'consentimiento', name: 'EmpConsentimiento', component: EmpConsentimiento, meta: { title: 'Consentimiento DT' } },
    ]
  },

  // ===== Fiscalizador DT =====
  {
    path: '/inspector',
    component: InspectorLayout,
    meta: { requiresAuth: true, roles: ['dt_inspector'] },
    children: [
      { path: '', redirect: { name: 'InspectorDashboard' } },
      { path: 'dashboard', name: 'InspectorDashboard', component: InspectorDashboard, meta: { title: 'Fiscalización DT' } },
      { path: 'attendance', name: 'InspectorAttendance', component: InspectorAsistencias, meta: { title: 'Asistencias — DT' } },
      { path: 'audit', name: 'InspectorAudit', component: DtAuditoria, meta: { title: 'Bitácora — DT' } },
      { path: 'reports', name: 'InspectorReports', component: DtReportesDT, meta: { title: 'Reportes DT' } },
    ]
  },

  // 404 catch-all
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound, meta: { public: true, title: 'No encontrado' } }
]

// ====== Router
const router = createRouter({
  history: createWebHistory(BASE),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    return { left: 0, top: 0 }
  },
  // (opcional) clases activas para links si usas estilos propios
  // linkActiveClass: 'is-active',
  // linkExactActiveClass: 'is-active-exact'
})

// ====== Guard global
let triedRestore = false
async function ensureSession() {
  const auth = useAuthStore()
  if (!triedRestore) {
    triedRestore = true
    try { await auth.restore() } catch (_) { }
  }
  return auth
}

// DT Compliance: rutas que el empleado SIEMPRE puede visitar incluso sin
// haber firmado el consentimiento (la pantalla de consent, logout, config).
const CONSENT_BYPASS_NAMES = new Set([
  'EmpConsentimiento',
  'Login',
  'Register',
  'Home',
  'NotFound',
  'VerificarComprobante',
  'VerificarComprobanteHash',
  'ConfigurationRoot',
])

function employeeNeedsConsent(auth) {
  if (normalizeRole(auth?.role) !== 'employee') return false
  const consent = auth?.user?.dtConsent
  // Necesita consent si:
  //  - no tiene dtConsent o no aceptó (acceptedAt vacío)
  //  - o no tiene personalEmail (también obligatorio)
  if (!consent?.acceptedAt) return true
  if (!auth?.user?.personalEmail) return true
  return false
}

router.beforeEach(async (to, from, next) => {
  const auth = await ensureSession()

  const isPublic = to.matched.some(r => r.meta?.public)
  const onlyGuests = to.matched.some(r => r.meta?.onlyGuests)
  const needsAuth = to.matched.some(r => r.meta?.requiresAuth)
  // 1) Si está logueado y cae en páginas solo para invitados (login/register) → a destino seguro
  if (onlyGuests && auth.isAuthenticated) {
    const safe = safeRedirectOf(to) || roleHome(auth.role)
    return next(safe)
  }
  // 2) Si está logueado y entra al Home público → llévalo a su panel
  if (auth.isAuthenticated && to.name === 'Home') {
    const dest = roleHome(auth.role)
    if (to.fullPath !== dest) return next(dest)
  }

  // 3) Rutas públicas siempre pasan
  if (isPublic) return next()

  // 4) Requiere login
  if (needsAuth && !auth.isAuthenticated) {
    const redirect = encodeURIComponent(to.fullPath || '/')
    return next({ name: 'Login', query: { redirect } })
  }

  // 5) Roles requeridos
  const requiredRoles = to.matched.flatMap(r => r.meta?.roles || [])
  if (requiredRoles.length && !hasRequiredRole(auth.role, requiredRoles)) {
    return next({ name: 'NotFound' }) // o tu página 403 si la tienes
  }

  // 6) Permisos requeridos (puedes fijar meta.permMode='any' a nivel de ruta)
  const permMode = to.matched.find(r => r.meta?.permMode)?.meta?.permMode || DEFAULT_PERMS_MODE
  const requiredPerms = to.matched.flatMap(r => r.meta?.permissions || [])
  if (requiredPerms.length && !hasPermissions(auth, requiredPerms, permMode)) {
    return next({ name: 'NotFound' })
  }

  // 7) DT Consent gate (Res. Ex. 38/2024): el empleado debe firmar el
  //    consentimiento ANTES de poder marcar asistencia o usar el sistema.
  //    Lo redirigimos automáticamente a la pantalla de consentimiento.
  if (auth.isAuthenticated && employeeNeedsConsent(auth)) {
    if (!CONSENT_BYPASS_NAMES.has(to.name)) {
      return next({ name: 'EmpConsentimiento' })
    }
  }

  next()
})

// ====== AfterEach: título y limpieza del redirect
router.afterEach((to) => {
  const title = to.meta?.title ? `${to.meta.title} • ${APP_TITLE}` : APP_TITLE
  if (typeof document !== 'undefined') document.title = title

  if (to.query?.redirect && window?.history?.replaceState) {
    const { redirect, ...rest } = to.query
    const params = new URLSearchParams(rest).toString()
    const clean = `${to.path}${params ? `?${params}` : ''}`
    window.history.replaceState({}, '', clean)
  }
})

// ====== Robustez: si falla la carga de un chunk lazy, recarga 1 vez
router.onError((err) => {
  const msg = String(err?.message || '')
  const chunkFailed = /Loading chunk \d+ failed|ChunkLoadError|dynamic import/i.test(msg)
  if (chunkFailed && typeof window !== 'undefined') {
    const key = '__chunk_reload_once__'
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      window.location.reload()
    } else {
      sessionStorage.removeItem(key)
      // deja el error visible en consola si persiste
      // eslint-disable-next-line no-console
      console.error('[Router] Falló recarga tras ChunkLoadError:', err)
    }
  }
})

export default router
