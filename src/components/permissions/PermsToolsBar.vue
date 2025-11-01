
<template>
  <q-card flat bordered :class="cardTone" class="rk-tools q-pa-sm q-mb-sm">
    <div class="row items-center q-col-gutter-sm">
      <div class="col-12 col-md-6">
        <q-input
          v-model="searchQLocal"
          dense outlined clearable
          placeholder="Buscar permiso (clave, nombre o descripción)"
        />
      </div>

      <div class="col-12 col-md-6 row items-center q-gutter-sm justify-end">
        <q-btn dense flat class="rk-chip" icon="done_all" label="Permitir todo" @click="emitBulk('allow')" :disable="!editable" />
        <q-btn dense flat class="rk-chip" icon="block"    label="Denegar todo"  @click="emitBulk('deny')"  :disable="!editable" />
        <q-btn dense flat class="rk-chip" icon="backspace" label="Heredar todo" @click="emitBulk('inherit')" :disable="!editable" />
        <q-separator vertical class="q-mx-sm" />
        <q-chip square class="rk-stat rk-ok"><q-icon name="check_circle" class="q-mr-xs" />{{ allowCount }}</q-chip>
        <q-chip square class="rk-stat rk-bad"><q-icon name="do_not_disturb_on" class="q-mr-xs" />{{ denyCount }}</q-chip>
        <q-chip square class="rk-stat rk-mid"><q-icon name="change_history" class="q-mr-xs" />{{ inheritCount }}</q-chip>
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  cardTone: { type: String, default: '' },
  editable: { type: Boolean, default: false },
  searchQ: { type: String, default: '' },
  allowCount: { type: Number, default: 0 },
  denyCount: { type: Number, default: 0 },
  inheritCount: { type: Number, default: 0 }
})

const emit = defineEmits(['update:searchQ', 'bulk-set'])

const searchQLocal = ref(props.searchQ)
watch(() => props.searchQ, v => { searchQLocal.value = v })
watch(searchQLocal, v => emit('update:searchQ', v))

const emitBulk = (val) => emit('bulk-set', val)
</script>

<style scoped>
.rk-tools{
  border-radius:18px; border:1px solid rgba(127,127,127,.12);
  box-shadow:0 8px 20px rgba(0,0,0,.05)
}
/* Chips / stats */
.rk-chip{ border-radius:12px; padding:2px 12px; font-weight:600 }
.rk-stat{ border-radius:10px; font-weight:700; letter-spacing:.2px }
.rk-ok  { background:rgba(76,175,80,.12);  color:#2e7d32; border:1px solid rgba(76,175,80,.3) }
.rk-bad { background:rgba(244,67,54,.12);  color:#c62828; border:1px solid rgba(244,67,54,.3) }
.rk-mid { background:rgba(158,158,158,.12); color:#424242; border:1px solid rgba(158,158,158,.3) }
</style>