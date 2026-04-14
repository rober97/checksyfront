<template>
  <q-page padding>
    <div class="inspector-shell">
      <q-banner class="bg-blue-1 q-mb-md">
        <template #avatar><q-icon name="gavel" color="primary" size="32px" /></template>
        <div class="text-subtitle1 text-weight-medium">Panel de Fiscalización — Dirección del Trabajo</div>
        <div class="text-caption">
          Acceso conforme a la Resolución Exenta N°38/2024. Todas las acciones realizadas
          desde este panel quedan registradas en la bitácora inmutable.
        </div>
      </q-banner>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6 col-lg-3">
          <q-card flat bordered class="metric-card">
            <q-card-section>
              <div class="text-caption text-grey-7">Registros consultables</div>
              <div class="text-h4 text-weight-bold">{{ stats.total || '—' }}</div>
              <q-icon name="fact_check" class="metric-ico text-primary" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-card flat bordered class="metric-card">
            <q-card-section>
              <div class="text-caption text-grey-7">Con modificación</div>
              <div class="text-h4 text-weight-bold">{{ stats.modified || '0' }}</div>
              <q-icon name="edit_note" class="metric-ico text-warning" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-card flat bordered class="metric-card">
            <q-card-section>
              <div class="text-caption text-grey-7">Integridad OK</div>
              <div class="text-h4 text-weight-bold">{{ stats.integrityOk || '—' }}</div>
              <q-icon name="verified" class="metric-ico text-positive" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <q-card flat bordered class="metric-card">
            <q-card-section>
              <div class="text-caption text-grey-7">Integridad rota</div>
              <div class="text-h4 text-weight-bold">{{ stats.integrityBroken || '0' }}</div>
              <q-icon name="dangerous" class="metric-ico text-negative" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-card flat bordered class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Acciones rápidas</div>
          <div class="q-gutter-sm q-mt-sm">
            <q-btn unelevated color="primary" icon="fact_check" label="Ver asistencias" to="/inspector/attendance" />
            <q-btn unelevated color="primary" outline icon="history" label="Bitácora" to="/inspector/audit" />
            <q-btn unelevated color="primary" outline icon="download" label="Reportes DT" to="/inspector/reports" />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import secureAxios from '@/utils/secureRequest'

const stats = reactive({ total: 0, modified: 0, integrityOk: 0, integrityBroken: 0 })

onMounted(async () => {
  try {
    const { data } = await secureAxios.get('/dt/inspect/attendance?limit=200')
    stats.total = data.total || data.rows?.length || 0
    stats.modified = (data.rows || []).filter((r) => r.modified).length
    stats.integrityOk = (data.rows || []).filter((r) => r.integrityOk).length
    stats.integrityBroken = (data.rows || []).filter((r) => r.integrityOk === false).length
  } catch {}
})
</script>

<style scoped>
.inspector-shell { max-width: 1200px; margin: 0 auto; }
.metric-card { position: relative; overflow: hidden; }
.metric-ico {
  position: absolute;
  right: 12px;
  top: 12px;
  font-size: 42px;
  opacity: 0.25;
}
</style>
