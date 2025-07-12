import { createRouter, createWebHistory } from 'vue-router';

// Importa tus vistas
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import EmployeesView from '../views/EmployeesView.vue';
import AttendanceView from '../views/AttendanceView.vue';
import UserCreateView from '../views/UserCreateView.vue';
const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView
  },
  {
    path: '/employees',
    name: 'Employees',
    component: EmployeesView
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: AttendanceView
  },
  {
    path: '/user',
    name: 'UserCreate',
    component: UserCreateView
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// 🔐 Protección de rutas (puedes personalizar esto luego)
// router.beforeEach((to, from, next) => {
//   const token = localStorage.getItem('token');
//   if (!to.meta.public && !token) {
//     next('/');
//   } else {
//     next();
//   }
// });

export default router;
