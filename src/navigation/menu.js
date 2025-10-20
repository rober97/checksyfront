export const MENU = [
  // ===== ADMIN
  {
    label: 'Administración',
    icon: 'admin_panel_settings',
    access: { roles: ['admin'] },
    children: [
      { label: 'Dashboard', icon: 'dashboard', to: '/admin/dashboard', exact: true },
      { label: 'Users', icon: 'people', to: '/admin/users' },
      { label: 'Permisos', icon: 'lock', to: '/admin/permissions' },
      { label: 'Asistencias', icon: 'assignment_ind', to: '/admin/attendance' },
      { label: 'Empresas', icon: 'apartment', to: '/admin/companies' },
      { label: 'Horarios', icon: 'schedule', to: '/admin/horarios', exact: true },
    ]
  },

  // ===== EMPRESA
  {
    label: 'Empresa',
    icon: 'business',
    access: { roles: ['Empresa'] },
    children: [
      { label: 'Dashboard', icon: 'dashboard', to: '/company/dashboard' },
      { label: 'Employees', icon: 'badge', to: '/company/employees' },
      { label: 'Report', icon: 'bar_chart', to: '/company/report' },
      { label: 'Requests', icon: 'assignment', to: '/company/requests' },
    ]
  },

  // ===== EMPLEADO
  {
    label: 'Mi espacio',
    icon: 'person',
    access: { roles: ['employee'] },
    children: [
      { label: 'Dashboard', icon: 'dashboard', to: '/employee/dashboard' },
      { label: 'Marcar asistencia', icon: 'access_time', to: '/employee/attendance' },
      { label: 'Mi historial', icon: 'history', to: '/employee/history' },
      { label: 'Nueva solicitud', icon: 'post_add', to: '/employee/create-request' },
    ]
  },
]
