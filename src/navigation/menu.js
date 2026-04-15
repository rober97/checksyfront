// Menú dinámico por rol.
//
// Modelo de roles (2026):
//   superadmin   → Plataforma (empresas, admins RR.HH., reportes DT globales)
//   admin_rrhh   → RR.HH. de UNA empresa (empleados, horarios, nómina, reportes DT)
//   employee     → Su espacio (asistencia, solicitudes, comprobantes, consentimiento)
//   dt_inspector → Usa el layout Inspector (no carga este menú)
//
// Cada grupo declara `access: { roles: [...] }` para filtrarse automáticamente
// según el rol del usuario autenticado.
export const MENU = [
  // ============================================================
  // SUPERADMIN — plataforma
  // ============================================================
  {
    label: 'Plataforma',
    icon: 'shield',
    access: { roles: ['superadmin'] },
    children: [
      { label: 'Dashboard', icon: 'dashboard', to: '/superadmin/dashboard', exact: true },
      { label: 'Empresas', icon: 'apartment', to: '/superadmin/empresas' },
      { label: 'Administradores RR.HH.', icon: 'badge', to: '/superadmin/admins-rrhh' },
    ]
  },
  {
    label: 'Dirección del Trabajo (global)',
    icon: 'gavel',
    access: { roles: ['superadmin'] },
    children: [
      { label: 'Reportes DT', icon: 'download', to: '/superadmin/dt/reportes' },
      { label: 'Libro de Asistencia', icon: 'menu_book', to: '/superadmin/dt/libro' },
      { label: 'Tokens fiscalizadores', icon: 'vpn_key', to: '/superadmin/dt/tokens' },
      { label: 'Auditoría global', icon: 'history', to: '/superadmin/dt/auditoria' },
    ]
  },

  // ============================================================
  // ADMIN RR.HH. — sólo su empresa
  // ============================================================
  {
    label: 'Recursos Humanos',
    icon: 'admin_panel_settings',
    access: { roles: ['admin_rrhh'] },
    children: [
      { label: 'Dashboard', icon: 'dashboard', to: '/rrhh/dashboard', exact: true },
      { label: 'Empleados', icon: 'people', to: '/rrhh/users' },
      { label: 'Permisos', icon: 'lock', to: '/rrhh/permissions' },
      { label: 'Horarios', icon: 'schedule', to: '/rrhh/horarios' },
      { label: 'Asistencias', icon: 'assignment_ind', to: '/rrhh/attendance' },
      { label: 'Mi empresa', icon: 'apartment', to: '/rrhh/empresa' },
      { label: 'Solicitudes', icon: 'assignment', to: '/rrhh/requests' },
      { label: 'Liquidaciones', icon: 'payments', to: '/rrhh/payroll' },
      { label: 'Config Nómina', icon: 'percent', to: '/rrhh/payrollRates' },
    ]
  },
  {
    label: 'Dirección del Trabajo',
    icon: 'gavel',
    access: { roles: ['admin_rrhh'] },
    children: [
      { label: 'Reportes DT', icon: 'download', to: '/rrhh/dt/reportes' },
      { label: 'Libro de Asistencia', icon: 'menu_book', to: '/rrhh/dt/libro' },
      { label: 'Fiscalizadores DT', icon: 'badge', to: '/rrhh/dt/tokens' },
      { label: 'Bitácora', icon: 'history', to: '/rrhh/dt/auditoria' },
    ]
  },

  // ============================================================
  // EMPLEADO — su espacio
  // ============================================================
  {
    label: 'Mi espacio',
    icon: 'person',
    access: { roles: ['employee'] },
    children: [
      { label: 'Dashboard', icon: 'dashboard', to: '/employee/dashboard' },
      { label: 'Marcar asistencia', icon: 'access_time', to: '/employee/attendance' },
      { label: 'Mi historial', icon: 'history', to: '/employee/history' },
      { label: 'Mi libro de asistencia', icon: 'menu_book', to: '/employee/libro' },
      { label: 'Mis comprobantes DT', icon: 'receipt_long', to: '/employee/comprobantes' },
      // "Consentimiento DT" se omite a propósito del menú: es un trámite de
      // primer uso. El router redirige automáticamente al empleado a esta
      // pantalla si todavía no firmó. Una vez firmado queda accesible desde
      // /employee/consentimiento para quien quiera revisarlo.
      { label: 'Nueva solicitud', icon: 'post_add', to: '/employee/create-request' },
      { label: 'Mis documentos', icon: 'description', to: '/employee/documents' },
      { label: 'Mis solicitudes', icon: 'assignment', to: '/employee/requests' },
    ]
  },
]
