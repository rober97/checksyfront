// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// ====== Layouts (eager: el shell carga rápido)
import AdminLayout from '@/layouts/AdminLayout.vue'
import CompanyLayout from '@/layouts/EmpresaLayout.vue'
import EmployeeLayout from '@/layouts/EmpleadoLayout.vue'

// ====== Views (lazy: reduce el bundle inicial)
const HomePublic      = () => import(/* webpackChunkName:"public"    */ '@/views/HomePublic.vue')
const Login           = () => import(/* webpackChunkName:"public"    */ '@/views/Login.vue')
const Register        = () => import(/* webpackChunkName:"public"    */ '@/views/Register.vue')
const NotFound        = () => import(/* webpackChunkName:"misc"      */ '@/views/NotFound.vue')
const Dashboard       = () => import(/* webpackChunkName:"dashboard" */ '@/views/Dashboard.vue')

const Permissions     = () => import(/* webpackChunkName:"admin"     */ '@/views/Admin/Permisos.vue')
const UserManagement  = () => import(/* webpackChunkName:"admin"     */ '@/views/Admin/GestionUsuarios.vue')
const GestionHorarios = () => import(/* webpackChunkName:"admin"     */ '@/views/Admin/GestionHorarios.vue')
const AsistenciasEmp  = () => import(/* webpackChunkName:"admin"     */ '@/views/Admin/AsistenciasPorEmpleado.vue')

const CompanyList     = () => import(/* webpackChunkName:"empresa"   */ '@/views/Empresa/EmpresaList.vue')
const CompanyForm     = () => import(/* webpackChunkName:"empresa"   */ '@/views/Empresa/EmpresaForm.vue')
const CompanyDetail   = () => import(/* webpackChunkName:"empresa"   */ '@/views/Empresa/EmpresaDetalle.vue')

const EmployeeList    = () => import(/* webpackChunkName:"empleado"  */ '@/views/Empleado/EmpleadoList.vue')
const EmployeeForm    = () => import(/* webpackChunkName:"empleado"  */ '@/views/Empleado/EmpleadoForm.vue')
const EmployeeDetail  = () => import(/* webpackChunkName:"empleado"  */ '@/views/Empleado/EmpleadoDetalle.vue')

const EmployeeDocs    = () => import(/* webpackChunkName:"docs"      */ '@/views/Documentos/DocumentosEmpleado.vue')
const UploadDocument  = () => import(/* webpackChunkName:"docs"      */ '@/views/Documentos/SubirDocumento.vue')

const CompanyReport   = () => import(/* webpackChunkName:"reportes"  */ '@/views/Empresa/ReporteGeneral.vue')

const RequestList     = () => import(/* webpackChunkName:"solicitud" */ '@/views/Solicitudes/SolicitudesList.vue')
const ApproveRequests = () => import(/* webpackChunkName:"solicitud" */ '@/views/Solicitudes/AprobarSolicitudes.vue')
const Attendance      = () => import(/* webpackChunkName:"empleado"  */ '@/views/Empleado/MarcarAsistencia.vue')
const History         = () => import(/* webpackChunkName:"empleado"  */ '@/views/Empleado/Historial.vue')
const CreateRequest   = () => import(/* webpackChunkName:"solicitud" */ '@/views/Solicitudes/CrearSolicitud.vue')
const Configuration   = () => import(/* webpackChunkName:"user"      */ '@/views/Usuarios/Configuration.vue')

// ====== Utilidades de autorización y navegación
const BASE = process.env.BASE_URL || '/'
const APP_TITLE = 'Recksy'
const DEFAULT_PERMS_MODE = 'all' // 'all' | 'any'

const normalizeRole   = (r) => String(r || '').toLowerCase()
const hasRequiredRole = (userRole, requiredRoles) => {
  if (!requiredRoles?.length) return true
  const target = normalizeRole(userRole)
  return requiredRoles.map(normalizeRole).includes(target)
}

// const hasPermissions = (auth, requiredPerms = [], mode = DEFAULT_PERMS_MODE) => {
//   if (!requiredPerms.length) return true
//   const check = (p) => auth?.hasPermission?.(p) === true
//   return mode === 'any' ? requiredPerms.some(check) : requiredPerms.every(check)
// }

const hasPermissions = (auth, requiredPerms = [], mode = DEFAULT_PERMS_MODE) => {
  if (!requiredPerms.length) return true
  const check = (p) => auth?.hasPermission?.(p) === true
  return true
}

const isInternalPath = (p) => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//')
const safeRedirectOf = (to) => {
  const raw = to?.query?.redirect
  if (!raw) return null
  let val = String(raw)
  try { val = decodeURIComponent(val) } catch(_) {}
  return isInternalPath(val) ? val : null
}

const roleHome = (role) => {
  console.log('ROL', role)
  debugger
  switch (normalizeRole(role)) {
    case 'admin':    return '/admin/dashboard'
    case 'empresa':  return '/company/dashboard'
    case 'employee': return '/employee/dashboard'
    default:         return '/'
  }
}

// ====== Definición de rutas
const routes = [
  // Público
  { path: '/',          name: 'Home',     component: HomePublic, meta: { public: true, title: 'Inicio' } },
  { path: '/login',     name: 'Login',    component: Login,      meta: { public: true, onlyGuests: true, title: 'Iniciar sesión' } },
  { path: '/register',  name: 'Register', component: Register,   meta: { public: true, onlyGuests: true, title: 'Registro' } },

  // Perfil/config (cualquier rol autenticado)
  { path: '/configuration', name: 'ConfigurationRoot', component: Configuration, meta: { requiresAuth: true, title: 'Configuración' } },

  // Admin
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      { path: '',            redirect: { name: 'AdminDashboard' } },
      { path: 'dashboard',   name: 'AdminDashboard',      component: Dashboard,      meta: { title: 'Panel • Admin' } },
      { path: 'users',       name: 'UserManagement',      component: UserManagement, meta: { permissions: ['users:read'],       title: 'Usuarios' } },
      { path: 'permissions', name: 'Permissions',         component: Permissions,    meta: { permissions: ['permissions:read'], title: 'Permisos' } },
      { path: 'horarios',    name: 'HorariosList',        component: GestionHorarios,meta: { permissions: ['schedules:read'],   title: 'Horarios' } },
      { path: 'attendance',  name: 'AsistenciaList',      component: AsistenciasEmp, meta: { permissions: ['attendance:read'],  title: 'Asistencias' } },
      { path: 'companies',   name: 'CompanyListAdmin',    component: CompanyList,    meta: { permissions: ['companies:read'],   title: 'Empresas' } },
      { path: 'company/new', name: 'CompanyFormAdmin',    component: CompanyForm,    meta: { permissions: ['companies:create'], title: 'Nueva empresa' } },
      { path: 'company/:id', name: 'CompanyDetailAdmin',  component: CompanyDetail,  props: true, meta: { permissions: ['companies:read'], title: 'Detalle empresa' } },
    ]
  },

  // Company
  {
    path: '/company',
    component: CompanyLayout,
    meta: { requiresAuth: true, roles: ['empresa'] },
    children: [
      { path: '',               redirect: { name: 'CompanyDashboard' } },
      { path: 'dashboard',      name: 'CompanyDashboard',   component: Dashboard,     meta: { title: 'Panel • Empresa' } },
      { path: 'companies',      name: 'CompanyList',        component: CompanyList,   meta: { permissions: ['companies:read'],   title: 'Empresas' } },
      { path: 'company/new',    name: 'CompanyForm',        component: CompanyForm,   meta: { permissions: ['companies:create'], title: 'Nueva empresa' } },
      { path: 'company/:id',    name: 'CompanyDetail',      component: CompanyDetail, props: true, meta: { permissions: ['companies:read'], title: 'Detalle empresa' } },
      { path: 'employees',      name: 'EmployeeList',       component: EmployeeList,  meta: { permissions: ['employees:read'],   title: 'Empleados' } },
      { path: 'employee/new',   name: 'EmployeeForm',       component: EmployeeForm,  meta: { permissions: ['employees:create'], title: 'Nuevo empleado' } },
      { path: 'employee/:id',   name: 'EmployeeDetail',     component: EmployeeDetail,props: true, meta: { permissions: ['employees:read'],  title: 'Detalle empleado' } },
      { path: 'documents/:id',  name: 'EmployeeDocuments',  component: EmployeeDocs,  props: true, meta: { permissions: ['documents:read'],  title: 'Documentos' } },
      { path: 'upload-document/:id', name: 'UploadDocument',component: UploadDocument,props: true, meta: { permissions: ['documents:create'],title: 'Subir documento' } },
      { path: 'report',         name: 'CompanyReport',      component: CompanyReport, meta: { permissions: ['reports:read'],     title: 'Reporte' } },
      { path: 'requests',       name: 'RequestList',        component: RequestList,   meta: { permissions: ['requests:read'],    title: 'Solicitudes' } },
      { path: 'approve-requests', name: 'ApproveRequests',  component: ApproveRequests, meta: { permissions: ['requests:approve'], title: 'Aprobar solicitudes' } },
    ]
  },

  // Employee
  {
    path: '/employee',
    component: EmployeeLayout,
    meta: { requiresAuth: true, roles: ['employee'] },
    children: [
      { path: '',              redirect: { name: 'EmployeeDashboard' } },
      { path: 'dashboard',     name: 'EmployeeDashboard', component: Dashboard,   meta: { title: 'Panel • Empleado' } },
      { path: 'attendance',    name: 'Attendance',        component: Attendance,  meta: { title: 'Marcar asistencia' } },
      { path: 'history',       name: 'History',           component: History,     meta: { title: 'Historial' } },
      { path: 'create-request',name: 'CreateRequest',     component: CreateRequest, meta: { title: 'Nueva solicitud' } },
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
    try { await auth.restore() } catch (_) {}
  }
  return auth
}

router.beforeEach(async (to, from, next) => {
  const auth = await ensureSession()

  const isPublic   = to.matched.some(r => r.meta?.public)
  const onlyGuests = to.matched.some(r => r.meta?.onlyGuests)
  const needsAuth  = to.matched.some(r => r.meta?.requiresAuth)
  debugger
  // 1) Si está logueado y cae en páginas solo para invitados (login/register) → a destino seguro
  if (onlyGuests && auth.isAuthenticated) {
    debugger
    const safe = safeRedirectOf(to) || roleHome(auth.role)
    return next(safe)
  }
  // 2) Si está logueado y entra al Home público → llévalo a su panel
  if (auth.isAuthenticated && to.name === 'Home') {
    debugger
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
    debugger
    return next({ name: 'NotFound' }) // o tu página 403 si la tienes
  }

  // 6) Permisos requeridos (puedes fijar meta.permMode='any' a nivel de ruta)
  const permMode = to.matched.find(r => r.meta?.permMode)?.meta?.permMode || DEFAULT_PERMS_MODE
  const requiredPerms = to.matched.flatMap(r => r.meta?.permissions || [])
  if (requiredPerms.length && !hasPermissions(auth, requiredPerms, permMode)) {
    debugger
    return next({ name: 'NotFound' })
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
