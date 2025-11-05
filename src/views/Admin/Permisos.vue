<!-- src/views/Admin/AdminPermsPage.vue -->
<template>
  <q-page class="q-pa-md" :class="pageBg">
    <!-- ===== Encabezado ===== -->
    <PageHeader
      icon="vpn_key"
      title="Permisos"
      help-text="AYUDA"
      :help-to="{ name: 'help.permissions' }"
    >
      <template #subtitle>
        Gestione por <a @click.prevent="goByUser">Usuario</a> o por
        <a @click.prevent="goByProfile">Perfil</a>. Defina “Permitir / Heredar /
        Denegar”.
      </template>

      <!-- opcional -->
      <!--
      <template #actions>
        <q-btn flat dense icon="sync" label="Sincronizar" @click="syncPerms" />
      </template>
      -->
    </PageHeader>

    <!-- ===== Banner de estado + Acciones ===== -->
    <q-card
      flat
      bordered
      :class="['rk-banner', 'rk-bar', cardTone]"
      class="q-pa-sm q-px-md q-py-sm"
    >
      <div class="rk-row">
        <!-- IZQUIERDA -->
        <div class="rk-group">
          <q-btn-toggle
            v-model="mode"
            :options="modeOpts"
            unelevated
            rounded
            toggle-color="primary"
            size="sm"
            class="rk-modes rk-item"
            content-class="rk-center"
            @update:model-value="onModeChange"
          />

          <div class="rk-divider"></div>

          <template v-if="mode === 'user'">
            <q-chip
              v-if="selectedUser"
              color="primary"
              text-color="white"
              class="rk-chip rk-item"
            >
              <q-icon name="person" class="q-mr-xs" /> Usuario:
              {{ currentUserLabel || "—" }}
            </q-chip>
            <q-chip v-else outline class="rk-chip rk-chip-empty rk-item">
              <q-icon name="warning" class="q-mr-xs" /> Seleccione un usuario en
              la columna izquierda.
            </q-chip>
          </template>

          <template v-else>
            <q-chip
              v-if="selectedProfileId"
              color="deep-purple"
              text-color="white"
              class="rk-chip rk-item"
            >
              <q-icon name="label" class="q-mr-xs" /> Perfil:
              {{ currentProfileName || "—" }}
            </q-chip>
            <q-chip v-else outline class="rk-chip rk-chip-empty rk-item">
              <q-icon name="add_circle_outline" class="q-mr-xs" /> Seleccione o
              cree un perfil.
            </q-chip>

            <div v-if="selectedProfileId" class="rk-inline rk-item">
              <q-input
                v-model="inlineProfileName"
                dense
                outlined
                standout
                color="deep-purple"
                class="rk-inline-name"
                :label="`Renombrar perfil`"
              />
              <q-btn
                dense
                flat
                round
                icon="save"
                color="deep-purple"
                :disable="!canSaveInline"
                @click="saveInlineProfileName"
                class="rk-btn-save-inline"
                content-class="rk-center"
              />
            </div>
          </template>
        </div>

        <!-- DERECHA -->
        <div class="rk-group">
          <div class="rk-legend rk-item">
            <q-badge outline color="info" class="rk-badge">Diferencia</q-badge>
            <q-badge outline color="negative" class="rk-badge"
              >Conflicto</q-badge
            >
            <q-badge outline color="orange" class="rk-badge"
              >Modificado</q-badge
            >
            <q-badge outline color="amber" class="rk-badge">Favorito</q-badge>
          </div>

          <q-separator vertical class="rk-sep" />

          <q-btn
            flat
            label="Descartar"
            :disable="!dirty || saving"
            class="rk-btn rk-item"
            icon="close"
            @click="onDiscard"
            content-class="rk-center"
          />
          <q-btn
            unelevated
            color="primary"
            :loading="saving"
            icon="save"
            rounded
            label="Guardar"
            :disable="!dirty || !hasTarget"
            class="rk-btn rk-btn-main rk-item"
            @click="onSave"
            content-class="rk-center"
          />
        </div>
      </div>
    </q-card>

    <!-- ===== Cuerpo ===== -->
    <section class="rk-body row q-col-gutter-md">
      <!-- ===== Sidebar ===== -->
      <aside class="rk-col-side col-12 col-lg-3">
        <PermsSidebar
          ref="sidebarRef"
          :card-tone="cardTone"
          :mode="mode"
          v-model:userQuery="userQuery"
          :user-options="userOptions"
          :selected-user="selectedUser"
          @search-users="onSearchUsers"
          @pick-user="onPickUser"
          v-model:profileQuery="profileQuery"
          :profiles="profiles"
          :selected-profile-id="selectedProfileId"
          @pick-profile="onPickProfile"
          @open-create-profile="onOpenCreateProfile"
          @duplicate-profile="onDuplicateProfile"
          @remove-profile="onRemoveProfile"
          @preview-profile="onPreviewProfile"
          :profile-options="profileOptions"
          v-model:profileToApply="profileToApply"
          @open-apply-wizard="onOpenApplyWizard"
          v-model:highlightSource="highlightSource"
          :highlight-options="highlightOptions"
          v-model:showDiffs="showDiffs"
          v-model:showConflicts="showConflicts"
          v-model:showChanges="showChanges"
        />
      </aside>

      <!-- ===== Main ===== -->
      <main class="rk-col-main col-12 col-lg-9">
        <PermsToolsBar
          :card-tone="cardTone"
          v-model:searchQ="searchQ"
          :editable="hasTarget"
          :allow-count="allowCount"
          :deny-count="denyCount"
          :inherit-count="inheritCount"
          @bulk-set="onBulkSet"
        />

        <PermsMatrix
          :card-tone="cardTone"
          :mode="mode"
          :has-target="hasTarget"
          :loading="loadingMatrix"
          :editable="hasTarget"
          :catalog="catalog"
          :working-perms="workingPerms"
          :base-snapshot="baseSnapshot"
          :search-q="searchQ"
          :only-favs="onlyFavs"
          :only-changed="onlyChanged"
          :favs="favsArray"
          :collapsed="collapsedArray"
          :tri-options="triOptions"
          :highlight-source="highlightSource"
          :highlight-compare-map="highlightCompareMap"
          @toggle-cat="onToggleCat"
          @toggle-fav="onToggleFav"
          @set-perm="onSetPerm"
          @set-category="onSetCategory"
          @request-focus-user-search="focusUserSearch"
          @request-create-profile="onOpenCreateProfile"
        />
      </main>
    </section>

    <!-- ===== Asistente & Ayuda ===== -->
    <PermsApplyProfileDialog
      v-model="showApplyDialog"
      :profiles="profiles"
      :catalog="catalog"
      :working-perms="workingPerms"
      :default-profile-id="profileToApply"
      :initial-policy="'fill'"
      @applied="onApplyMerged"
    />

    <PermsHelpDialog v-model="showHelp" />
  </q-page>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from "vue";
import { useQuasar } from "quasar";
import { usePermissionsStore } from "@/stores/permissionsStore"; // FIX: re-integrate store

import PermsSidebar from "@/components/permissions/PermsSidebar.vue";
import PermsToolsBar from "@/components/permissions/PermsToolsBar.vue";
import PermsMatrix from "@/components/permissions/PermsMatrix.vue";
import PermsApplyProfileDialog from "@/components/permissions/PermsApplyProfileDialog.vue";
import PermsHelpDialog from "@/components/permissions/PermsHelpDialog.vue";
import PageHeader from "@/components/shared/PageHeader.vue";

/* ===== Quasar + store ===== */
const $q = useQuasar();
const store = usePermissionsStore();

const goByUser = () => {
  /* navega a pestaña/route Usuario */
};
const goByProfile = () => {
  /* navega a pestaña/route Perfil */
};

/* ===== Modo ===== */
const mode = ref("user"); // 'user' | 'profile'
const modeOpts = [
  { label: "Usuario", value: "user", icon: "person" },
  { label: "Perfil", value: "profile", icon: "label" },
];

/* ===== Tema ===== */
const isDark = computed(() => $q.dark.isActive);
const pageBg = computed(() =>
  isDark.value ? "bg-grey-10 text-white" : "bg-grey-1"
);
const cardTone = computed(() =>
  isDark.value ? "bg-grey-9  text-white" : "bg-white"
);
const headTone = computed(() => (isDark.value ? "text-white" : "text-primary"));

/* ===== Sidebar state ===== */
const userQuery = ref("");
const userOptions = ref([]); // [{label, meta, value}]
const selectedUser = ref(null);

const profileQuery = ref("");
const profiles = ref([]); // [{id/_id, name, map}]
const selectedProfileId = ref(null);
const profileOptions = computed(() =>
  profiles.value.map((p) => ({ label: p.name, value: p.id || p._id }))
);
const profileToApply = ref(null); // usado para highlight/apply
const inlineProfileName = ref("");

/* ===== Refs to children ===== */
const sidebarRef = ref(null);

/* ===== Header computed ===== */
const currentUserLabel = computed(() => {
  const u = userOptions.value.find((x) => x.value === selectedUser.value);
  return u?.label || "";
});
const currentProfileName = computed(() => {
  const p = profiles.value.find(
    (x) => (x.id || x._id) === selectedProfileId.value
  );
  return p?.name || "";
});
const canSaveInline = computed(
  () =>
    !!selectedProfileId.value &&
    inlineProfileName.value.trim() &&
    inlineProfileName.value.trim() !== currentProfileName.value.trim()
);

/* ===== Catálogo + mapas ===== */
const catalog = ref({ categories: [], items: [] });
const workingPerms = ref({}); // key -> 'allow' | 'deny' | 'inherit'
const baseSnapshot = ref({}); // snapshot para comparar/salvar
const loadingMatrix = ref(false);

/* ===== Tri-estado ===== */
const triOptions = [
  { label: "Permitir", value: "allow", icon: "check_circle" },
  { label: "Heredar", value: "inherit", icon: "change_history" },
  { label: "Denegar", value: "deny", icon: "do_not_disturb_on" },
];

/* ===== Filtros (ToolsBar) ===== */
const searchQ = ref("");
const onlyFavs = ref(false);
const onlyChanged = ref(false);

/* ===== Favoritos / Colapsados (persistencia local) ===== */
const FAVS_KEY = "rk.perm.favs";
const COLL_KEY = "rk.perm.collapsed";
const favsSet = ref(
  new Set(JSON.parse(localStorage.getItem(FAVS_KEY) || "[]"))
);
const collapsedSet = ref(
  new Set(JSON.parse(localStorage.getItem(COLL_KEY) || "[]"))
);
const favsArray = computed(() => Array.from(favsSet.value));
const collapsedArray = computed(() => Array.from(collapsedSet.value));
const persistFavs = () =>
  localStorage.setItem(FAVS_KEY, JSON.stringify(Array.from(favsSet.value)));
const persistCollapsed = () =>
  localStorage.setItem(
    COLL_KEY,
    JSON.stringify(Array.from(collapsedSet.value))
  );

/* ===== Dirty & contadores ===== */
const hasTarget = computed(
  () =>
    (mode.value === "user" && !!selectedUser.value) ||
    (mode.value === "profile" && !!selectedProfileId.value)
);
const saving = ref(false);
const dirty = computed(
  () =>
    JSON.stringify(workingPerms.value) !== JSON.stringify(baseSnapshot.value)
);
const allowCount = computed(
  () => Object.values(workingPerms.value).filter((v) => v === "allow").length
);
const denyCount = computed(
  () => Object.values(workingPerms.value).filter((v) => v === "deny").length
);
const inheritCount = computed(
  () => Object.values(workingPerms.value).filter((v) => v === "inherit").length
);

/* ===== Highlight ===== */
const highlightSource = ref(null); // null | 'base' | 'profile'
const showDiffs = ref(false);
const showConflicts = ref(false);
const showChanges = ref(false);
const highlightOptions = computed(() => {
  const base = [
    { label: "Ninguno", value: null },
    { label: "Base inicial", value: "base" },
  ];
  if (profileToApply.value)
    base.push({ label: "Perfil seleccionado", value: "profile" });
  return base;
});
const highlightCompareMap = computed(() => {
  if (highlightSource.value !== "profile" || !profileToApply.value) return {};
  const p = profiles.value.find(
    (x) => (x.id || x._id) === profileToApply.value
  );
  return { ...(p?.map || {}) };
});

/* ===== Helpers ===== */
const debounce = (fn, wait = 250) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
};
const focusUserSearch = () =>
  nextTick(() => {
    // FIX: focus real del input en el sidebar
    sidebarRef.value?.focusSearch?.();
  });

/* ===== Init: fetch catalog + profiles from store ===== */
const init = async () => {
  try {
    loadingMatrix.value = true;
    await Promise.all([store.fetchCatalog?.(), store.fetchProfiles?.()]);
    if (store.catalog) catalog.value = store.catalog;
    if (store.profiles) profiles.value = store.profiles;
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e?.message || "No se pudo cargar catálogo o perfiles.",
    });
  } finally {
    loadingMatrix.value = false;
  }
};
onMounted(init);

/* ===== Usuarios (via store) ===== */
const onSearchUsers = debounce(async (q) => {
  try {
    const list = await (store.searchUsers?.(q || userQuery.value) || []);
    userOptions.value = (list || []).map((u) => ({
      label:
        `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.name || u.email,
      meta: u.email,
      value: u._id,
    }));
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e?.message || "No se pudo buscar usuarios.",
    });
  }
}, 250);

watch(userQuery, (q) => onSearchUsers(q)); // FIX: dispara búsqueda al escribir

const onPickUser = async (id) => {
  try {
    selectedUser.value = id;
    loadingMatrix.value = true;
    // Cargar permisos usuario y (si falta) catálogo
    const map = await store.fetchUserPermissions?.(id);
    if (store.catalog && !catalog.value.items?.length)
      catalog.value = store.catalog;
    baseSnapshot.value = { ...(map || {}) };
    workingPerms.value = { ...(map || {}) };
    highlightSource.value = null;
    showDiffs.value = showConflicts.value = showChanges.value = false;
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e?.message || "No se pudieron cargar permisos del usuario.",
    });
  } finally {
    loadingMatrix.value = false;
  }
};

const onPickProfile = (id) => {
  selectedProfileId.value = id;
  loadingMatrix.value = true;
  setTimeout(() => {
    const p = profiles.value.find((x) => (x.id || x._id) === id);
    baseSnapshot.value = { ...(p?.map || {}) };
    workingPerms.value = { ...(p?.map || {}) };
    inlineProfileName.value = p?.name || "";
    highlightSource.value = null;
    showDiffs.value = showConflicts.value = showChanges.value = false;
    loadingMatrix.value = false;
  }, 50);
};

/* ===== CRUD Perfiles ===== */
const onOpenCreateProfile = () =>
  $q.notify({ type: "info", message: "Crear perfil (conectar backend)." });
const onDuplicateProfile = (p) =>
  $q.notify({
    type: "info",
    message: `Duplicar "${p.name}" (conectar backend).`,
  });
const onRemoveProfile = (id) =>
  $q.notify({
    type: "warning",
    message: "Eliminar perfil (conectar backend).",
  });
const onPreviewProfile = (p) => {
  profileToApply.value = p.id || p._id;
  highlightSource.value = "profile";
  showDiffs.value = true;
  showConflicts.value = true;
};

/* ===== Inline rename profile ===== */
const saveInlineProfileName = async () => {
  if (!canSaveInline.value) return;
  try {
    const id = selectedProfileId.value;
    const p = profiles.value.find((x) => (x.id || x._id) === id);
    const newName = inlineProfileName.value || p?.name;
    if (store.updateProfile) {
      profiles.value = await store.updateProfile({
        id,
        name: newName,
        map: workingPerms.value,
      });
    } else {
      const idx = profiles.value.findIndex((x) => (x.id || x._id) === id);
      if (idx >= 0)
        profiles.value[idx] = { ...profiles.value[idx], name: newName };
    }
    $q.notify({ type: "positive", message: "Nombre de perfil actualizado." });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e?.message || "No se pudo renombrar el perfil.",
    });
  }
};

/* ===== Matriz events ===== */
const onSetPerm = ({ key, val }) => {
  workingPerms.value = { ...workingPerms.value, [key]: val };
};
const onSetCategory = ({ keys, val }) => {
  const m = { ...workingPerms.value };
  for (const k of keys) m[k] = val;
  workingPerms.value = m;
};
const onToggleFav = (k) => {
  const s = new Set(favsSet.value);
  s.has(k) ? s.delete(k) : s.add(k);
  favsSet.value = s;
  persistFavs();
};
const onToggleCat = (name) => {
  const s = new Set(collapsedSet.value);
  s.has(name) ? s.delete(name) : s.add(name);
  collapsedSet.value = s;
  persistCollapsed();
};
const onBulkSet = (val) => {
  const m = {};
  for (const it of catalog.value.items || []) m[it.key] = val;
  workingPerms.value = m;
};

/* ===== Guardar / Descartar ===== */
const onSave = async () => {
  try {
    saving.value = true;
    if (mode.value === "user" && selectedUser.value) {
      await store.saveUserPermissions?.(selectedUser.value, workingPerms.value);
    } else if (mode.value === "profile" && selectedProfileId.value) {
      const p = profiles.value.find(
        (x) => (x.id || x._id) === selectedProfileId.value
      );
      if (p && store.updateProfile) {
        profiles.value = await store.updateProfile({
          id: p.id || p._id,
          name: inlineProfileName.value || p.name,
          map: workingPerms.value,
        });
      }
    } else {
      return $q.notify({
        type: "warning",
        message: "Seleccione un objetivo (Usuario o Perfil).",
      });
    }
    baseSnapshot.value = { ...workingPerms.value };
    $q.notify({
      type: "positive",
      message: "Permisos guardados correctamente.",
    });
  } catch (e) {
    $q.notify({ type: "negative", message: e?.message || "Error al guardar." });
  } finally {
    saving.value = false;
  }
};
const onDiscard = () => {
  workingPerms.value = { ...baseSnapshot.value };
  $q.notify({ type: "info", message: "Cambios descartados." });
};

/* ===== Asistente “Aplicar Perfil” ===== */
const showApplyDialog = ref(false);
const onOpenApplyWizard = () => {
  showApplyDialog.value = true;
};
const onApplyMerged = ({ merged, summary, profileId, policy }) => {
  workingPerms.value = merged;
  highlightSource.value = null;
  showDiffs.value = false;
  showConflicts.value = false;
  showChanges.value = true;
  $q.notify({
    type: "positive",
    message: `Perfil aplicado (${policy}). Cambios: ${summary.totalChanged}`,
  });
};

/* ===== Ayuda ===== */
const showHelp = ref(false);
const onOpenHelp = () => {
  showHelp.value = true;
};

/* ===== Cambiar modo ===== */
const onModeChange = () => {
  selectedUser.value = null;
  selectedProfileId.value = null;
  inlineProfileName.value = "";
  workingPerms.value = {};
  baseSnapshot.value = {};
  highlightSource.value = null;
  showDiffs.value = showConflicts.value = showChanges.value = false;
  nextTick(() => {
    if (mode.value === "user") focusUserSearch();
  });
};
</script>

<style scoped>
/* ===== Layout 100vh con scrolls internos ===== */
.rk-perm {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-attachment: fixed;
}
.rk-head {
  flex: 0 0 auto;
  padding: 12px 10px;
  border-radius: 16px;
  margin: 12px;
  margin-bottom: 8px;
  background: linear-gradient(
    180deg,
    rgba(120, 120, 120, 0.1),
    rgba(120, 120, 120, 0.03)
  );
  backdrop-filter: blur(10px) saturate(1.15);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.rk-banner {
  flex: 0 0 auto;
  margin: 0 12px 8px;
  border-radius: 18px;
  border: 1px solid rgba(127, 127, 127, 0.12);
  background: linear-gradient(
    180deg,
    rgba(127, 127, 127, 0.05),
    rgba(127, 127, 127, 0.02)
  );
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
}
.rk-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 0 12px 12px;
}
.rk-col-side,
.rk-col-main {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.rk-modes :deep(.q-btn) {
  border-radius: 12px;
}
.rk-modes :deep(.q-btn--active) {
  box-shadow: 0 6px 14px rgba(33, 150, 243, 0.25);
}

/* Decoración y microinteracciones */
.rk-logo {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: radial-gradient(
    circle at 30% 20%,
    rgba(33, 150, 243, 0.38),
    rgba(33, 150, 243, 0) 68%
  );
  border: 1px solid rgba(33, 150, 243, 0.28);
  color: var(--q-primary);
  box-shadow: inset 0 0 16px rgba(33, 150, 243, 0.15);
}
.rk-sub {
  font-size: 0.8rem;
  opacity: 0.82;
  margin-top: -1px;
}
.rk-ghost {
  border-radius: 10px;
  transition: transform 0.08s ease, background 0.15s ease;
}
.rk-ghost:hover {
  transform: translateY(-1px);
  background: rgba(127, 127, 127, 0.06);
}
.rk-divider {
  width: 1px;
  height: 24px;
  background: rgba(127, 127, 127, 0.18);
  margin: 0 6px;
}
.rk-tight {
  padding: 2px 8px;
}
.rk-inline-name {
  width: 220px;
}

/* Leyenda */
.rk-legend :deep(.q-badge) {
  border-radius: 8px;
  backdrop-filter: saturate(1.1);
}

/* Theming */
.body--light .rk-head {
  background: linear-gradient(
    180deg,
    rgba(33, 150, 243, 0.08),
    rgba(33, 150, 243, 0.02)
  );
}
.body--dark .rk-head {
  background: linear-gradient(
    180deg,
    rgba(33, 150, 243, 0.12),
    rgba(33, 150, 243, 0.04)
  );
}

/* ===== CONFIG DE ALTURA UNIFORME ===== */
.rk-bar { --rk-h: 40px; }               /* alto total de la barra */
.rk-bar .rk-row {
  display:flex; align-items:center; justify-content:space-between; gap:16px;
}
.rk-bar .rk-group { display:flex; align-items:center; gap:12px; }
.rk-divider { width:1px; height:24px; background:rgba(255,255,255,.15); border-radius:1px; }

/* ===== Forzar altura y centrado en TODO ===== */
.rk-bar :deep(.rk-item),
.rk-bar :deep(.q-btn),
.rk-bar :deep(.q-btn-toggle),
.rk-bar :deep(.q-chip),
.rk-bar :deep(.q-input),
.rk-bar :deep(.q-field),
.rk-bar :deep(.q-field__control) {
  height: var(--rk-h) !important;
  min-height: var(--rk-h) !important;
  display: inline-flex !important;
  align-items: center !important;
  margin: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  line-height: 1 !important;
  vertical-align: middle !important;
}

/* Contenido interno realmente centrado */
.rk-bar :deep(.q-btn__content,
              .q-btn-toggle__content,
              .q-chip__content,
              .q-field__native,
              .q-field__control,
              .q-icon,
              .rk-center) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
}

/* Botón Guardar: elimina el “bajón” por min-height en em */
.rk-bar :deep(.q-btn.q-btn--rectangle) { min-height: var(--rk-h) !important; }
.rk-bar :deep(.rk-btn-main) { padding-inline:18px; transform: translateY(0) !important; }

/* ===== Badges (que se veían bajos) ===== */
.rk-bar :deep(.rk-legend) { display:flex; gap:8px; }
.rk-bar :deep(.rk-badge) {
  height: var(--rk-h) !important;      /* mismos 40px para alinear baseline */
  display:inline-flex !important;
  align-items:center !important;
  justify-content:center !important;
  padding:0 12px !important;
  line-height:1 !important;
  border-radius:999px !important;
}

/* Separador vertical al centro */
.rk-bar :deep(.rk-sep) { align-self:center; height: var(--rk-h) !important; opacity:.35; }

/* Renombrado inline */
.rk-inline { display:flex; align-items:center; gap:8px; }
.rk-inline .q-input { width: 190px; }

</style>
