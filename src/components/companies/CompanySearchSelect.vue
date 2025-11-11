<template>
  <q-select
    ref="selRef"
    v-model="innerValue"
    :label="label"
    :options="options"
    option-value="_id"
    option-label="name"
    dense
    outlined
    clearable
    use-input
    fill-input
    hide-selected
    emit-value
    map-options
    :loading="loading"
    :input-debounce="debounceMs"
    @filter="onFilter"
    :rules="rules"
    :hint="hint"
    popup-content-style="min-width: 420px"
    @popup-show="isOpen = true"
    @popup-hide="isOpen = false"
    class="rk-company-search"
    :class="{ 'rk-company-search--open': isOpen }"
  >
    <template #prepend>
      <q-icon name="business" class="rk-company-search__icon" />
    </template>

    <!-- Opción mejorada -->
    <template #option="scope">
      <q-item v-bind="scope.itemProps" class="rk-company-search__option">
        <q-item-section avatar>
          <q-avatar square size="32px" class="rk-company-search__logo">
            <img v-if="scope.opt.logo" :src="scope.opt.logo" alt="logo" />
            <q-icon v-else name="apartment" class="rk-company-search__logo-icon" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="rk-company-search__name">{{ scope.opt.name }}</q-item-label>
          <q-item-label caption class="rk-company-search__rut">{{ scope.opt.rut || "—" }}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="scope.opt.status === 'active'" class="rk-company-search__status">
          <q-badge outline color="positive" label="Activa" />
        </q-item-section>
      </q-item>
    </template>

    <!-- Sin opciones: diseño mejorado -->
    <template #no-option>
      <div class="rk-company-search__empty">
        <div class="rk-company-search__empty-content">
          <q-icon 
            name="search_off" 
            size="32px" 
            class="rk-company-search__empty-icon" 
          />
          <div class="rk-company-search__empty-text">
            <div class="text-grey-7">
              {{
                hasSearched
                  ? `Sin resultados para «${displayQuery}»`
                  : `Escribe al menos ${minChars} caracteres para buscar.`
              }}
            </div>
          </div>
          <q-space />
          <q-btn
            v-if="allowCreate && hasSearched && displayQuery"
            flat
            dense
            no-caps
            padding="xs sm"
            class="rk-company-search__create-btn"
            icon="add_business"
            :label="`Crear «${displayQuery}»`"
            @click.stop="openCreate(displayQuery)"
          />
        </div>
      </div>
    </template>

    <!-- Loading state mejorado -->
    <template #loading>
      <q-spinner-oval size="24px" class="rk-company-search__spinner" />
    </template>
  </q-select>

  <!-- Diálogo de creación -->
  <CompanyDialog 
    v-model="dlgOpen" 
    :editData="prefill" 
    @saved="onCreated" 
    @error="onCreationError"
  />
</template>

<script setup>
import { ref, watch, computed, nextTick } from "vue";
import { useQuasar } from "quasar";
import secureAxios from "@/utils/secureRequest";
import CompanyDialog from "@/components/companies/CompanyDialog.vue";

/* props */
const props = defineProps({
  modelValue: [String, Object],
  label: { type: String, default: "Empresa" },
  rules: { type: Array, default: () => [] },
  hint: { type: String, default: "" },
  minChars: { type: Number, default: 2 },
  debounceMs: { type: Number, default: 250 },
  allowCreate: { type: Boolean, default: true },
  autoSelectCreated: { type: Boolean, default: true },
});
const emit = defineEmits(["update:modelValue", "created", "creation-error"]);

const $q = useQuasar();

/* v-model */
const innerValue = ref(props.modelValue ?? null);
watch(
  () => props.modelValue,
  (v) => {
    innerValue.value = v;
  }
);
watch(innerValue, (v) => {
  suppressNextEmptyFilter.value = true; // evita limpiar tras seleccionar
  emit("update:modelValue", v);
});

/* estado */
const selRef = ref(null);
const isOpen = ref(false);
const options = ref([]);
const loading = ref(false);
const query = ref("");
const lastSearched = ref("");

/* derivados */
const hasSearched = computed(() => lastSearched.value.length >= props.minChars);
const displayQuery = computed(
  () => (hasSearched.value ? lastSearched.value : query.value) || ""
);

/* anti-loop / rendimiento */
const cache = new Map(); // q -> items[]
let inFlight = null; // AbortController
const suppressNextEmptyFilter = ref(false);

function onFilter(val, update) {
  const q = (val || "").trim();

  // evita limpiar por fill-input tras seleccionar
  if (q === "" && suppressNextEmptyFilter.value) {
    suppressNextEmptyFilter.value = false;
    return update(() => {}); // conserva opciones
  }

  query.value = q;

  // mínimo caracteres
  if (q.length < props.minChars) {
    if (options.value.length && hasSearched.value && isOpen.value) {
      return update(() => {}); // conserva lista previa
    }
    if (inFlight) {
      inFlight.abort();
      inFlight = null;
    }
    return update(() => {
      options.value = [];
    });
  }

  // cache inmediata
  if (cache.has(q)) {
    return update(() => {
      options.value = cache.get(q) || [];
      lastSearched.value = q;
    });
  }

  // request nueva
  if (inFlight) inFlight.abort();
  inFlight = new AbortController();
  update(() => {
    loading.value = true;
  });
  (async () => {
    try {
      const { data } = await secureAxios.get("/companies/search", {
        params: { q, limit: 10 },
        signal: inFlight.signal,
      });
      const items = Array.isArray(data?.items) ? data.items : [];
      cache.set(q, items);
      options.value = items;
      lastSearched.value = q;
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.message !== "canceled") {
        options.value = [];
        console.error("Error buscando empresas:", err);
      }
    } finally {
      inFlight = null;
      loading.value = false;
    }
  })();
}

/* crear nueva empresa - mejorado */
const dlgOpen = ref(false);
const prefill = ref(null);
const creating = ref(false);

function openCreate(name) {
  prefill.value = { 
    name: (name || "").trim(),
    status: "active"
  };
  dlgOpen.value = true;
  creating.value = true;
}

function normalizeCompany(payload) {
  const c = payload?.company || payload?.item || payload;
  return c && c._id && c.name ? c : null;
}

function upsertOption(company) {
  const idx = options.value.findIndex((x) => x._id === company._id);
  if (idx >= 0) {
    options.value.splice(idx, 1, company);
  } else {
    options.value.unshift(company);
  }
  // refresca cache para la última búsqueda
  if (lastSearched.value) {
    cache.set(lastSearched.value, [...options.value]);
  }
}

async function onCreated(payload) {
  const company = normalizeCompany(payload);
  dlgOpen.value = false;
  creating.value = false;
  
  if (!company) {
    $q.notify({
      type: "negative",
      message: "Error al crear la empresa",
      position: "top",
    });
    emit("creation-error", payload);
    return;
  }

  // A) agregar/actualizar en lista
  upsertOption(company);
  
  // B) seleccionar automáticamente si está habilitado
  if (props.autoSelectCreated) {
    // Usar nextTick para asegurar que el DOM esté actualizado
    await nextTick();
    innerValue.value = company._id;
    
    // Notificar al padre
    emit("created", company);
    
    // C) cerrar popup para feedback inmediato
    try {
      selRef.value?.hidePopup?.();
    } catch (err) {
      console.warn("No se pudo cerrar el popup:", err);
    }
    
    // Feedback visual
    $q.notify({
      type: "positive",
      message: `Empresa "${company.name}" creada y seleccionada`,
      position: "top",
      timeout: 2000,
    });
  } else {
    // Solo notificar creación sin seleccionar
    emit("created", company);
    $q.notify({
      type: "positive",
      message: `Empresa "${company.name}" creada exitosamente`,
      position: "top",
      timeout: 2000,
    });
  }
}

function onCreationError(error) {
  creating.value = false;
  emit("creation-error", error);
}
</script>

<style scoped>
/* ===== ESTILOS ELEGANTES PARA COMPANY SEARCH SELECT ===== */

.rk-company-search {
  --rk-cs-border-radius: 12px;
  --rk-cs-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  --rk-cs-shadow-hover: 0 4px 20px rgba(0, 0, 0, 0.12);
  --rk-cs-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.rk-company-search :deep(.q-field__control) {
  border-radius: var(--rk-cs-border-radius);
  transition: var(--rk-cs-transition);
}

.rk-company-search :deep(.q-field--focused .q-field__control) {
  box-shadow: var(--rk-cs-shadow);
  border-color: var(--q-primary);
}

.rk-company-search--open :deep(.q-field__control) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

/* Icono del campo */
.rk-company-search__icon {
  color: var(--q-primary);
  opacity: 0.7;
  transition: var(--rk-cs-transition);
}

.rk-company-search :deep(.q-field--focused) .rk-company-search__icon {
  opacity: 1;
  transform: scale(1.05);
}

/* Opciones de la lista */
.rk-company-search__option {
  padding: 10px 12px;
  border-radius: 10px;
  margin: 3px 8px;
  transition: var(--rk-cs-transition);
  border: 1px solid transparent;
  cursor: pointer;
}

.rk-company-search__option:hover {
  background: color-mix(in srgb, var(--q-primary) 6%, transparent);
  border-color: color-mix(in srgb, var(--q-primary) 20%, transparent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rk-company-search__option.q-item--active {
  background: color-mix(in srgb, var(--q-primary) 10%, transparent);
  border-color: color-mix(in srgb, var(--q-primary) 30%, transparent);
}

/* Logo de empresa */
.rk-company-search__logo {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: var(--rk-cs-transition);
}

.rk-company-search__option:hover .rk-company-search__logo {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.rk-company-search__logo-icon {
  color: var(--q-grey-6);
}

/* Textos de la opción */
.rk-company-search__name {
  font-weight: 600;
  font-size: 0.92rem;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.rk-company-search__rut {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  opacity: 0.8;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Estado de la empresa */
.rk-company-search__status {
  min-width: auto;
}

/* Estado vacío */
.rk-company-search__empty {
  padding: 12px 8px;
}

.rk-company-search__empty-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, 
    color-mix(in srgb, var(--q-grey-2) 60%, transparent),
    color-mix(in srgb, var(--q-grey-1) 40%, transparent)
  );
  border: 1px solid color-mix(in srgb, var(--q-grey-4) 50%, transparent);
  backdrop-filter: blur(10px);
}

.rk-company-search__empty-icon {
  color: var(--q-grey-5);
  flex-shrink: 0;
  opacity: 0.8;
}

.rk-company-search__empty-text {
  flex: 1;
  min-width: 0;
  font-size: 0.9rem;
}

.rk-company-search__empty-text .text-grey-7 {
  font-weight: 500;
  line-height: 1.4;
}

/* Botón de creación - DISEÑO SUPERIOR */
.rk-company-search__create-btn {
  background: linear-gradient(135deg, 
    var(--q-primary), 
    color-mix(in srgb, var(--q-primary) 70%, #3a7bd5)
  );
  color: white !important;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.82rem;
  text-transform: none;
  letter-spacing: 0.4px;
  box-shadow: 
    0 4px 14px color-mix(in srgb, var(--q-primary) 35%, transparent),
    0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  padding: 8px 16px;
  position: relative;
  overflow: hidden;
}

.rk-company-search__create-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.6s ease;
}

.rk-company-search__create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 25px color-mix(in srgb, var(--q-primary) 45%, transparent),
    0 4px 8px rgba(0, 0, 0, 0.15);
}

.rk-company-search__create-btn:hover::before {
  left: 100%;
}

.rk-company-search__create-btn:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px color-mix(in srgb, var(--q-primary) 30%, transparent);
}

.rk-company-search__create-btn :deep(.q-btn__content) {
  gap: 8px;
  position: relative;
  z-index: 1;
}

.rk-company-search__create-btn :deep(.q-icon) {
  font-size: 1.1em;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* Spinner de carga */
.rk-company-search__spinner {
  color: var(--q-primary);
}

/* Mejoras para modo oscuro */
.body--dark .rk-company-search__empty-content {
  background: linear-gradient(135deg, 
    color-mix(in srgb, var(--q-grey-9) 40%, transparent),
    color-mix(in srgb, var(--q-grey-8) 30%, transparent)
  );
  border-color: color-mix(in srgb, var(--q-grey-7) 30%, transparent);
}

.body--dark .rk-company-search__logo-icon {
  color: var(--q-grey-5);
}

.body--dark .rk-company-search__empty-icon {
  color: var(--q-grey-6);
}

/* Mejoras específicas para el dropdown */
.rk-company-search :deep(.q-menu) {
  border-radius: 0 0 12px 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid color-mix(in srgb, var(--q-primary) 15%, transparent);
  border-top: none;
  margin-top: -1px;
  overflow: hidden;
}

.rk-company-search :deep(.q-virtual-scroll__content) {
  padding: 8px 4px;
}

/* Responsive */
@media (max-width: 600px) {
  .rk-company-search__empty-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
    padding: 20px 16px;
  }
  
  .rk-company-search__create-btn {
    width: 100%;
    justify-content: center;
    margin-top: 8px;
  }
  
  .rk-company-search :deep(.q-menu) {
    min-width: calc(100vw - 32px) !important;
    max-width: calc(100vw - 32px) !important;
    left: 16px !important;
    right: 16px !important;
  }
}

/* Animación sutil para nuevas opciones */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rk-company-search__option {
  animation: fadeInUp 0.3s ease-out;
}
</style>