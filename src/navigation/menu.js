export const MENU = [
  // ===== ADMIN
  {
    label: 'Administración',
    icon: 'admin_panel_settings',
    access: { roles: ['admin'] },
    children: [
      { label: 'Dashboard', icon: 'dashboard', to: '/admin/dashboard', exact: true },
      { label: 'Usuarios', icon: 'people', to: '/admin/users', access: { all: ['users:read'] } },
      { label: 'Permisos', icon: 'lock', to: '/admin/permissions', access: { all: ['permissions:read'] } },
      { label: 'Asistencias', icon: 'assignment_ind', to: '/admin/attendance', access: { all: ['attendance:read'] } },
      { label: 'Empresas', icon: 'apartment', to: '/admin/companies', access: { all: ['companies:read'] } },
      { label: 'Solicitudes', icon: 'assignment', to: '/admin/requests', access: { all: ['companies:read'] } },
      { label: 'Liquidaciones', icon: 'payments', to: '/admin/payroll', access: { all: ['companies:read'] } },
      { label: 'Configuración Nómina', icon: 'percent', to: '/admin/payrollRates', access: { all: ['companies:read'] } },
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
      { label: 'Mis documentos', icon: 'post_add', to: '/employee/documents' },
      { label: 'Mis solicitudes', icon: 'apartment', to: '/employee/requests' },
    ]
  },
]
