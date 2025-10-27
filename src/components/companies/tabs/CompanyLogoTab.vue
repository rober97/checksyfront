<template>
  <div class="row q-col-gutter-sm">
    <div class="col-12 col-md-7">
      <div class="text-caption text-grey-7 q-mb-xs">Logo (opcional)</div>
      <q-file
        v-model="fileSync"
        dense
        outlined
        accept="image/*"
        clear-icon="close"
        use-chips
        @update:model-value="onPick"
      />
      <div class="text-caption text-grey-7 q-mt-xs">
        Sugerido: 600×200 (horizontal)
      </div>
    </div>
    <div class="col-12 col-md-5">
      <q-img
        v-if="previewSync || logoSync"
        :src="previewSync || logoSync"
        ratio="16/9"
        class="rounded bordered"
        spinner-color="primary"
      />
      <div v-else class="q-pa-md text-grey-6 bg-grey-2 rounded text-center">
        Sin vista previa
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({ logo: String, file: File, preview: String });
const emit = defineEmits([
  "update:logo",
  "update:file",
  "update:preview",
  "validity",
]);

const logoSync = computed({
  get: () => props.logo,
  set: (v) => emit("update:logo", v),
});
const fileSync = computed({
  get: () => props.file,
  set: (v) => emit("update:file", v),
});
const previewSync = computed({
  get: () => props.preview,
  set: (v) => emit("update:preview", v),
});

function onPick(fileList) {
  const f = Array.isArray(fileList) ? fileList[0] : fileList;
  if (!f) {
    previewSync.value = "";
    emit("validity", true);
    return;
  }
  const r = new FileReader();
  r.onload = (e) => {
    previewSync.value = e.target.result;
    emit("validity", true);
  };
  r.readAsDataURL(f);
}
</script>
