<!-- src/components/payroll/RatesTable.vue -->
<template>
  <div class="q-pa-md">
    <div class="row items-start q-col-gutter-md q-mb-md">
      <div class="col">
        <div class="text-subtitle1 text-weight-bold">{{ title }}</div>
        <div class="text-caption text-grey-7">{{ subtitle }}</div>
      </div>
      <div class="col-auto" v-if="showCreate">
        <q-btn color="primary" icon="add" label="Crear" @click="$emit('create')" />
      </div>
    </div>

    <q-table
      flat
      bordered
      :rows="rows"
      :columns="columns"
      row-key="rowKey"
      :loading="loading"
      :pagination="{ rowsPerPage: 20 }"
    >
      <template #body-cell-value="props">
        <q-td :props="props" class="text-right">
          <span class="text-weight-bold">
            {{ formatPercent(props.row.value) }}
          </span>
          <span class="text-grey-7"> ({{ props.row.value }})</span>
        </q-td>
      </template>

      <template #body-cell-validFrom="props">
        <q-td :props="props">
          {{ toDate(props.row.validFrom) }}
        </q-td>
      </template>

      <template #body-cell-validTo="props">
        <q-td :props="props">
          {{ props.row.validTo ? toDate(props.row.validTo) : "—" }}
        </q-td>
      </template>

      <template #body-cell-active="props">
        <q-td :props="props">
          <q-badge :color="props.row.active ? 'green' : 'grey'" outline>
            {{ props.row.active ? "ACTIVO" : "INACTIVO" }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            v-if="props.row.missing"
            color="primary"
            outline
            size="sm"
            icon="add"
            label="Crear"
            @click="$emit('create', props.row)"
          />
          <template v-else>
            <q-btn
              color="primary"
              size="sm"
              flat
              icon="edit"
              label="Editar"
              @click="$emit('edit', props.row)"
            />
            <q-btn
              color="negative"
              size="sm"
              flat
              icon="block"
              label="Desactivar"
              @click="$emit('deactivate', props.row)"
            />
          </template>
        </q-td>
      </template>

      <template #no-data>
        <div class="text-grey-7 q-pa-md">
          No hay datos.
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  showCreate: { type: Boolean, default: false }
});

defineEmits(["create", "edit", "deactivate"]);

function toDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.toLocaleDateString("es-CL");
}

function formatPercent(decimal) {
  const n = Number(decimal);
  if (!Number.isFinite(n)) return "—";
  return (n * 100).toFixed(2) + "%";
}
</script>