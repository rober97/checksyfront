<template>
  <div
    class="seg-wrap"
    :class="{ 'is-dark': isDark }"
    role="tablist"
    aria-label="Rango de fechas"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      class="seg-pill"
      :class="{ active: modelValue === opt.value }"
      role="tab"
      :aria-selected="modelValue === opt.value"
      @click="$emit('update:modelValue', opt.value)"
      @keydown.enter.space="$emit('update:modelValue', opt.value)"
      type="button"
    >
      <q-icon v-if="opt.icon" :name="opt.icon" size="16px" class="q-mr-xs" />
      <span class="seg-label">{{ opt.label }}</span>
    </button>

    <!-- slider activo -->
    <span
      v-if="sliderStyle"
      class="seg-slider"
      :style="sliderStyle"
      aria-hidden="true"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useQuasar } from "quasar";

const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  options: {
    type: Array,
    default: () => [], // [{label:'7D', value:'7d', icon?:'bolt'}]
  },
});
const emit = defineEmits(["update:modelValue"]);
const { dark } = useQuasar();
const isDark = computed(() => dark.isActive);

const positions = ref([]); // cache de offsets para slider
const wrapEl = ref(null);

function recalc() {
  if (!wrapEl.value) return;
  const pills = wrapEl.value.querySelectorAll(".seg-pill");
  positions.value = Array.from(pills).map((el) => ({
    left: el.offsetLeft,
    width: el.offsetWidth,
  }));
}
const sliderStyle = computed(() => {
  const i = props.options.findIndex((o) => o.value === props.modelValue);
  const p = positions.value?.[i];
  return p
    ? { transform: `translateX(${p.left}px)`, width: p.width + "px" }
    : null;
});

onMounted(() => {
  wrapEl.value = document.querySelector(".seg-wrap:last-of-type"); // scoped instancia
  recalc();
  window.addEventListener("resize", recalc);
});
onBeforeUnmount(() => window.removeEventListener("resize", recalc));
watch(
  () => props.modelValue,
  () => setTimeout(recalc, 0)
);
watch(
  () => props.options,
  () => setTimeout(recalc, 0)
);
</script>

<style scoped>
.seg-wrap {
  position: relative;
  display: inline-flex;
  gap: 6px;
  padding: 6px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px) saturate(140%);
}
.seg-wrap.is-dark {
  background: rgba(15, 23, 42, 0.35);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
}

.seg-pill {
  position: relative;
  z-index: 1;
  height: 34px;
  min-width: 64px;
  padding: 0 14px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #0f172a;
  font-weight: 700;
  letter-spacing: 0.2px;
  cursor: pointer;
  transition: transform 0.12s ease;
  outline: none;
}
.seg-wrap.is-dark .seg-pill {
  color: #e2e8f0;
}

.seg-pill:hover {
  transform: translateY(-1px);
}
.seg-pill:active {
  transform: translateY(0);
}
.seg-pill:focus-visible {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.6);
  border-radius: 12px;
}

.seg-label {
  font-size: 12px;
  text-transform: uppercase;
}

.seg-pill.active {
  color: #fff;
}
.seg-wrap.is-dark .seg-pill.active {
  color: #fff;
}

.seg-slider {
  position: absolute;
  top: 6px;
  left: 6px;
  height: 34px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.35);
  transition: transform 0.18s cubic-bezier(0.22, 0.9, 0.25, 1), width 0.18s ease;
}
</style>
