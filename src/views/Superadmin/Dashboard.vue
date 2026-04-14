<template>
  <q-page padding>
    <div class="sa-shell">
      <q-banner class="bg-deep-purple-1 q-mb-md">
        <template #avatar>
          <q-icon name="shield" color="deep-purple" size="40px" />
        </template>
        <div class="text-h6 text-weight-bold">Superadmin — Plataforma Recksy</div>
        <div class="text-caption">
          Vista global de toda la plataforma. Este rol gestiona las empresas
          clientes y los administradores de RR.HH. No opera los datos del día
          a día de ninguna empresa — eso es trabajo del <b>admin_rrhh</b>.
        </div>
      </q-banner>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6 col-lg-3">
          <q-card flat bordered class="metric">
            <q-card-section>
              <div class="text-caption text-grey-7">Empresas activas</div>
              <div class="text-h3 text-weight-bold">{{ stats.companies }}</div>
              <q-icon name="apartment" class="metric-ico text-deep-purple" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-card flat bordered class="metric">
            <q-card-section>
              <div class="text-caption text-grey-7">Admins RR.HH.</div>
              <div class="text-h3 text-weight-bold">{{ stats.rrhh }}</div>
              <q-icon name="badge" class="metric-ico text-primary" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-card flat bordered class="metric">
            <q-card-section>
              <div class="text-caption text-grey-7">Empleados totales</div>
              <div class="text-h3 text-weight-bold">{{ stats.employees }}</div>
              <q-icon name="groups" class="metric-ico text-teal" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-card flat bordered class="metric">
            <q-card-section>
              <div class="text-caption text-grey-7">Tokens DT activos</div>
              <div class="text-h3 text-weight-bold">{{ stats.dtTokens }}</div>
              <q-icon name="gavel" class="metric-ico text-amber-9" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-card flat bordered class="q-mt-lg">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">Acciones rápidas</div>
          <div class="q-gutter-sm">
            <q-btn unelevated color="primary" icon="add_business" label="Nueva empresa" to="/superadmin/empresas/new" />
            <q-btn unelevated color="primary" outline icon="apartment" label="Empresas" to="/superadmin/empresas" />
            <q-btn unelevated color="primary" outline icon="badge" label="Admins RR.HH." to="/superadmin/admins-rrhh" />
            <q-btn unelevated color="deep-purple" icon="download" label="Reportes DT" to="/superadmin/dt/reportes" />
            <q-btn unelevated color="deep-purple" outline icon="history" label="Auditoría" to="/superadmin/dt/auditoria" />
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Modelo de roles</div>
          <q-list dense>
            <q-item>
              <q-item-section avatar><q-icon name="shield" color="deep-purple" /></q-item-section>
              <q-item-section>
                <q-item-label><b>superadmin</b> — tú</q-item-label>
                <q-item-label caption>
                  Gestiona la plataforma: crea empresas y administradores RR.HH.
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="admin_panel_settings" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label><b>admin_rrhh</b> — uno por empresa cliente</q-item-label>
                <q-item-label caption>
                  Administrador de RR.HH. Registra empleados, configura horarios,
                  nómina, aprueba solicitudes y descarga reportes DT <b>sólo</b> de su empresa.
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="person" color="teal" /></q-item-section>
              <q-item-section>
                <q-item-label><b>employee</b> — el trabajador</q-item-label>
                <q-item-label caption>
                  Marca asistencia, ve su historial, sus comprobantes DT, hace solicitudes.
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="gavel" color="amber-9" /></q-item-section>
              <q-item-section>
                <q-item-label><b>dt_inspector</b> — fiscalizador DT</q-item-label>
                <q-item-label caption>
                  Acceso read-only desde red oficial DT o por token externo (mín. 10 días).
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import secureAxios from '@/utils/secureRequest'

const stats = reactive({ companies: 0, rrhh: 0, employees: 0, dtTokens: 0 })

function pickArray(data, ...keys) {
  if (Array.isArray(data)) return data
  for (const k of keys) if (Array.isArray(data?.[k])) return data[k]
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  return []
}

onMounted(async () => {
  try {
    const [companiesRes, usersRes, tokensRes] = await Promise.all([
      secureAxios.get('/companies').catch(() => ({ data: [] })),
      secureAxios.get('/users').catch(() => ({ data: [] })),
      secureAxios.get('/dt/inspector-tokens').catch(() => ({ data: [] })),
    ])
    const cs = pickArray(companiesRes.data, 'companies')
    const us = pickArray(usersRes.data, 'users')
    const ts = pickArray(tokensRes.data, 'rows')
    stats.companies = cs.length
    stats.rrhh = us.filter((u) => u.role === 'admin_rrhh').length
    stats.employees = us.filter((u) => u.role === 'employee').length
    stats.dtTokens = ts.filter((t) => !t.revoked && new Date(t.expiresAt) > new Date()).length
  } catch (err) {
    console.warn('[SuperadminDashboard] stats error:', err?.message)
  }
})
</script>

<style scoped>
.sa-shell { max-width: 1200px; margin: 0 auto; }
.metric { position: relative; overflow: hidden; }
.metric-ico { position: absolute; right: 12px; top: 12px; font-size: 46px; opacity: 0.18; }
</style>
