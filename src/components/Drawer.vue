<template>
  <q-drawer
    v-model="isOpen"
    show-if-above
    bordered
    :mini="mini"
    :width="260"
    class="q-drawer--standard full-height"
    :content-class="
      $q.dark.isActive ? 'bg-grey-10 text-white' : 'bg-grey-1 text-dark'
    "
  >
    <!-- Header de usuario -->
    <div
      class="q-pa-md flex items-center"
      :class="mini ? 'justify-center' : 'justify-between'"
    >
      <q-avatar size="40px" color="primary" text-color="white">
        {{ initials }}
      </q-avatar>

      <div v-if="!mini" class="q-ml-sm col">
        <div class="text-subtitle2 ellipsis">{{ user?.name || "Usuario" }}</div>
        <div class="text-caption text-grey">
          {{ role || "—" }}
        </div>
      </div>

      <q-btn
        v-if="!mini"
        flat
        round
        dense
        :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
        @click="toggleDark"
        :aria-label="$q.dark.isActive ? 'Activar claro' : 'Activar oscuro'"
      />
    </div>

    <q-separator />

    <!-- Lista de navegación -->
    <q-scroll-area class="fit">
      <q-list padding>
        <template v-for="(group, gi) in visibleMenu" :key="gi">
          <q-expansion-item
            v-if="group.children?.length"
            :label="group.label"
            :icon="group.icon"
            expand-separator
            header-class="text-weight-medium"
            default-opened
            :dense="mini"
          >
            <template #header>
              <q-item-section avatar v-if="group.icon">
                <q-icon :name="group.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ group.label }}</q-item-label>
              </q-item-section>
            </template>

            <q-item
              v-for="(it, ii) in group.children"
              :key="`${gi}-${ii}`"
              clickable
              :to="it.to"
              :exact="it.exact"
              :active-class="'bg-primary text-white'"
              class="rounded-borders q-mx-sm"
            >
              <q-item-section avatar v-if="it.icon">
                <q-icon :name="it.icon" />
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ it.label }}</q-item-label>
              </q-item-section>

              <q-item-section side v-if="it.badge">
                <q-badge :label="`${it.badge}`" />
              </q-item-section>

              <q-tooltip v-if="mini" anchor="center right" self="center left">
                {{ it.label }}
              </q-tooltip>
            </q-item>
          </q-expansion-item>

          <q-separator class="q-my-sm" />
        </template>
      </q-list>
    </q-scroll-area>

    <!-- Footer acciones -->
    <div class="q-pa-md q-gutter-sm">
      <q-btn
        flat
        no-caps
        class="full-width justify-start"
        icon="logout"
        label="Cerrar sesión"
        @click="onLogout"
      />
    </div>
  </q-drawer>
</template>

<script setup>
import { computed } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useAccess } from "../composables/useAccess";
import { MENU } from "../navigation/menu";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  miniState: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();
const { role, can } = useAccess();

// v-model del drawer
const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});
const mini = computed(() => !!props.miniState);

// Usuario / iniciales
const user = computed(() => auth.user);
const initials = computed(() => {
  const n = auth.user?.name || auth.user?.email || "";
  return n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => (s[0] || "").toUpperCase())
    .join("");
});

// Menú filtrado por acceso
const visibleMenu = computed(() => {
  return MENU.filter((g) => can(g.access))
    .map((g) => ({
      ...g,
      children: (g.children || []).filter((it) => can(it.access)),
    }))
    .filter((g) => (g.children && g.children.length) > 0);
});

function toggleDark() {
  $q.dark.set(!$q.dark.isActive);
}

async function onLogout() {
  await auth.logout(true);
  router.push("/");
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 10px;
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
