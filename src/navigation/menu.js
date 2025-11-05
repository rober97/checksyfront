export const MENU = [
  // ===== ADMIN
  {
    label: 'Administración',
    icon: 'admin_panel_settings',
    access: { roles: ['admin'] },
    children: [
      { label: 'Dashboard', icon: 'dashboard', to: '/admin/dashboard', exact: true },
      { label: 'Usuarios', icon: 'people', to: '/admin/users' },
      { label: 'Permisos', icon: 'lock', to: '/admin/permissions' },
      { label: 'Asistencias', icon: 'assignment_ind', to: '/admin/attendance' },
      { label: 'Empresas', icon: 'apartment', to: '/admin/companies' },
      { label: 'Solicitudes', icon: 'apartment', to: '/admin/requests' },
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
