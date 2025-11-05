<template>
  <div class="row q-col-gutter-md q-mb-md">
    <div class="col-12 col-md-3">
      <q-card flat bordered class="rk-kpi">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center">
            <q-avatar color="indigo" text-color="white" icon="beach_access" />
            <div class="q-ml-sm">
              <div class="text-subtitle2">Vacaciones</div>
              <div class="text-caption text-grey-7">Días disponibles</div>
            </div>
          </div>
          <div class="text-h6">{{ saldoVacaciones ?? "—" }}</div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-md-3">
      <q-card flat bordered class="rk-kpi">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center">
            <q-avatar color="teal" text-color="white" icon="today" />
            <div class="q-ml-sm">
              <div class="text-subtitle2">Administrativos</div>
              <div class="text-caption text-grey-7">Días disponibles</div>
            </div>
          </div>
          <div class="text-h6">{{ saldoAdmin ?? "—" }}</div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-md-3">
      <q-card flat bordered class="rk-kpi">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center">
            <q-avatar color="orange" text-color="white" icon="account_balance_wallet" />
            <div class="q-ml-sm">
              <div class="text-subtitle2">Afecta saldo</div>
              <div class="text-caption text-grey-7">Según el tipo</div>
            </div>
          </div>
          <q-badge outline :color="afectaSaldoTipo ? 'negative' : 'grey-7'" class="text-uppercase">
            {{ afectaSaldoTipo ? 'Sí' : 'No' }}
          </q-badge>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12 col-md-3">
      <q-card flat bordered class="rk-kpi">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center">
            <q-avatar color="blue" text-color="white" icon="event_available" />
            <div class="q-ml-sm">
              <div class="text-subtitle2">Retorno</div>
              <div class="text-caption text-grey-7">Fecha y hora</div>
            </div>
          </div>
          <div class="text-body1 text-weight-medium">{{ retornoLabel }}</div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
defineProps({
  saldoVacaciones: Number,
  saldoAdmin: Number,
  afectaSaldoTipo: Boolean,
  retornoLabel: { type: String, default: '—' }
});
</script>

<style scoped>
.rk-kpi {
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}
</style>
