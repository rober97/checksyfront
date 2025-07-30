import { createRouter, createWebHistory } from 'vue-router';

// Layouts
import AdminLayout from '@/layouts/AdminLayout.vue';
import CompanyLayout from '@/layouts/EmpresaLayout.vue';
import EmployeeLayout from '@/layouts/EmpleadoLayout.vue';

// Public views
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue';
import NotFound from '@/views/NotFound.vue';

// General views
import Dashboard from '@/views/Dashboard.vue';

// Admin views
import Permissions from '@/views/Admin/Permisos.vue';
import UserManagement from '@/views/Admin/GestionUsuarios.vue';
import GestionHorarios from '@/views/Admin/GestionHorarios.vue' // 👈 importa la vista
import AsistenciaPorEmpleado from '@/views/Admin/AsistenciasPorEmpleado.vue'
// Company views
import CompanyList from '@/views/Empresa/EmpresaList.vue';
import CompanyForm from '@/views/Empresa/EmpresaForm.vue';
import CompanyDetail from '@/views/Empresa/EmpresaDetalle.vue';
import EmployeeList from '@/views/Empleado/EmpleadoList.vue';
import EmployeeForm from '@/views/Empleado/EmpleadoForm.vue';
import EmployeeDetail from '@/views/Empleado/EmpleadoDetalle.vue';
import EmployeeDocuments from '@/views/Documentos/DocumentosEmpleado.vue';
import UploadDocument from '@/views/Documentos/SubirDocumento.vue';
import CompanyReport from '@/views/Empresa/ReporteGeneral.vue';
import RequestList from '@/views/Solicitudes/SolicitudesList.vue';
import ApproveRequests from '@/views/Solicitudes/AprobarSolicitudes.vue';

// Employee views
import Attendance from '@/views/Empleado/MarcarAsistencia.vue';
import History from '@/views/Empleado/Historial.vue';
import CreateRequest from '@/views/Solicitudes/CrearSolicitud.vue';

const routes = [
  // 🌐 Public Routes
  {
    path: '/',
    component: () => import('@/views/HomePublic.vue'),
    meta: { public: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { public: true }
  },
  {
    path: '/configuration',
    component: () => import('@/views/Usuarios/Configuration.vue'),
    meta: { requiresAuth: true } // si tu app requiere login
  },
  // 🛠 Admin Routes
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      { path: 'dashboard', name: 'AdminDashboard', component: Dashboard },
      { path: 'users', name: 'UserManagement', component: UserManagement },
      { path: 'permissions', name: 'Permissions', component: Permissions },
      { path: 'horarios', name: 'HorariosList', component: GestionHorarios },
      { path: 'attendance', name: 'AsistenciaList', component: AsistenciaPorEmpleado },
      // Company management
      { path: 'companies', name: 'CompanyListAdmin', component: CompanyList },
      { path: 'company/new', name: 'CompanyFormAdmin', component: CompanyForm },
      { path: 'company/:id', name: 'CompanyDetailAdmin', component: CompanyDetail },
    ],
    meta: { role: 'Administrador' }
  },

  {
    path: '/user',
    component: AdminLayout,
    children: [
      { path: 'configuration', name: 'Configuration', component: () => import('@/views/Usuarios/Configuration.vue') },
    ]
  },

  // 🏢 Company Routes
  {
    path: '/company',
    component: CompanyLayout,
    children: [
      { path: 'dashboard', name: 'CompanyDashboard', component: Dashboard },
      { path: 'companies', name: 'CompanyList', component: CompanyList },
      { path: 'company/new', name: 'CompanyForm', component: CompanyForm },
      { path: 'company/:id', name: 'CompanyDetail', component: CompanyDetail },
      { path: 'employees', name: 'EmployeeList', component: EmployeeList },
      { path: 'employee/new', name: 'EmployeeForm', component: EmployeeForm },
      { path: 'employee/:id', name: 'EmployeeDetail', component: EmployeeDetail },
      { path: 'documents/:id', name: 'EmployeeDocuments', component: EmployeeDocuments },
      { path: 'upload-document/:id', name: 'UploadDocument', component: UploadDocument },
      { path: 'report', name: 'CompanyReport', component: CompanyReport },
      { path: 'requests', name: 'RequestList', component: RequestList },
      { path: 'approve-requests', name: 'ApproveRequests', component: ApproveRequests },
    ],
    meta: { role: 'Empresa' }
  },

  // 👤 Employee Routes
  {
    path: '/employee',
    component: EmployeeLayout,
    children: [
      { path: 'dashboard', name: 'EmployeeDashboard', component: Dashboard },
      { path: 'attendance', name: 'Attendance', component: Attendance },
      { path: 'history', name: 'History', component: History },
      { path: 'create-request', name: 'CreateRequest', component: CreateRequest },
    ],
    meta: { role: 'Empleado' }
  },

  // ❌ 404
  {
    path: '/:catchAll(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { public: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 🔐 Route Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (to.meta.public) {
    next();
  } else if (!token) {
    next('/');
  } else if (to.meta.role && to.meta.role !== userRole) {
    next('/');
  } else {
    next();
  }
});

export default router;
