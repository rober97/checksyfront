<template>
  <div class="q-gutter-sm">
    <q-uploader
      label="Adjuntar archivo"
      :factory="customFactory"
      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      multiple
      max-file-size="5242880"  <!-- 5 MB -->
      :hide-upload-btn="true"
      :auto-upload="false"
      @added="onFilesAdded"
      @removed="onFilesRemoved"
    >
      <template v-slot:list="scope">
        <q-item v-for="file in scope.files" :key="file.name" class="q-mb-sm">
          <q-item-section avatar>
            <q-icon name="insert_drive_file" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ file.name }}</q-item-label>
            <q-item-label caption>{{ formatSize(file.size) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn dense flat icon="close" @click="scope.removeFile(file)" />
          </q-item-section>
        </q-item>
      </template>
    </q-uploader>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['files-updated']);
const selectedFiles = ref([]);

function formatSize(size) {
  const kb = size / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
}

function onFilesAdded(files) {
  selectedFiles.value = files;
  emit('files-updated', files);
}

function onFilesRemoved() {
  selectedFiles.value = [];
  emit('files-updated', []);
}

function customFactory() {
  // No sube nada aún, solo usa como manejador visual
  return {
    url: '',
    method: '',
    withCredentials: false,
    headers: {},
  };
}
</script>
