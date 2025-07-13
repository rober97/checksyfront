<template>
  <q-card flat bordered class="q-mt-md">
    <q-card-section>
      <div class="text-h6 text-primary">Documentos del Empleado</div>
      <div class="text-subtitle2 text-grey-7">Contratos, anexos, liquidaciones, entre otros</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-btn
        color="primary"
        icon="upload_file"
        label="Subir documento"
        @click="abrirDialogo"
        class="q-mb-md"
      />

      <q-dialog v-model="dialogoSubida">
        <q-card style="min-width: 350px">
          <q-card-section>
            <div class="text-h6">Subir nuevo documento</div>
          </q-card-section>

          <q-card-section>
            <q-input
              filled
              v-model="nuevoDocumento.nombre"
              label="Nombre del documento"
              class="q-mb-md"
            />
            <q-select
              filled
              v-model="nuevoDocumento.tipo"
              :options="tipos"
              label="Tipo de documento"
              class="q-mb-md"
            />
            <input
              type="file"
              ref="inputFile"
              class="q-mb-md"
              @change="manejarArchivo"
              accept=".pdf,.doc,.docx,.jpg,.png"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="primary" v-close-popup />
            <q-btn flat label="Guardar" color="positive" @click="subirDocumento" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-table
        :rows="documentos"
        :columns="columns"
        row-key="id"
        dense
        flat
        bordered
        no-data-label="Sin documentos"
      >
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              icon="visibility"
              flat
              dense
              round
              @click="verDocumento(props.row)"
              color="primary"
            />
            <q-btn
              icon="delete"
              flat
              dense
              round
              color="negative"
              @click="eliminarDocumento(props.row.id)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const documentos = ref([
  {
    id: 1,
    nombre: 'Contrato Trabajo',
    tipo: 'Contrato',
    fecha: '2025-07-01',
    url: '/docs/contrato-trabajo.pdf',
  },
]);

const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', sortable: true },
  { name: 'tipo', label: 'Tipo', field: 'tipo', sortable: true },
  { name: 'fecha', label: 'Fecha', field: 'fecha', sortable: true },
  { name: 'actions', label: 'Acciones', field: 'actions' },
];

const tipos = ['Contrato', 'Liquidación', 'Anexo', 'Otro'];

const dialogoSubida = ref(false);
const nuevoDocumento = ref({ nombre: '', tipo: '', archivo: null });
const inputFile = ref(null);

function abrirDialogo() {
  nuevoDocumento.value = { nombre: '', tipo: '', archivo: null };
  dialogoSubida.value = true;
}

function manejarArchivo(event) {
  const file = event.target.files[0];
  nuevoDocumento.value.archivo = file;
}

function subirDocumento() {
  if (!nuevoDocumento.value.nombre || !nuevoDocumento.value.tipo || !nuevoDocumento.value.archivo) {
    $q.notify({ type: 'negative', message: 'Completa todos los campos' });
    return;
  }

  documentos.value.push({
    id: Date.now(),
    nombre: nuevoDocumento.value.nombre,
    tipo: nuevoDocumento.value.tipo,
    fecha: new Date().toISOString().slice(0, 10),
    url: '#',
  });

  dialogoSubida.value = false;
  $q.notify({ type: 'positive', message: 'Documento agregado' });
}

function verDocumento(doc) {
  window.open(doc.url, '_blank');
}

function eliminarDocumento(id) {
  documentos.value = documentos.value.filter((d) => d.id !== id);
  $q.notify({ type: 'info', message: 'Documento eliminado' });
}
</script>
