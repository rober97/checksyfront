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
        Administra accesos por <a @click.prevent="goByUser">usuario</a> o por
        <a @click.prevent="goByProfile">perfil</a>. Cada permiso puede quedar en
        <b>Permitir</b>, <b>Heredar</b> o <b>Denegar</b> para que el impacto del cambio
        se entienda antes de guardarlo.
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
          :profiles="filteredProfiles"
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
          v-model:onlyFavs="onlyFavs"
          v-model:onlyChanged="onlyChanged"
          :editable="hasTarget"
          :total-visible="filteredItemsCount"
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
import { usePermissionsStore } from "@/stores/permissionsStore";
import {
  buildPermissionMap,
  countPermissionStates,
  normalizePermissionCatalog,
} from "@/utils/permissions";

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
  if (mode.value === "user") return;
  mode.value = "user";
  onModeChange();
};
const goByProfile = () => {
  if (mode.value === "profile") return;
  mode.value = "profile";
  onModeChange();
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
const filteredProfiles = computed(() => {
  const query = profileQuery.value.trim().toLowerCase();
  if (!query) return profiles.value;
  return profiles.value.filter((profile) =>
    String(profile?.name || "")
      .toLowerCase()
      .includes(query)
  );
});
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
const changedKeysSet = computed(() => {
  const before = baseSnapshot.value || {};
  const after = workingPerms.value || {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed = new Set();
  keys.forEach((key) => {
    if ((before?.[key] || "inherit") !== (after?.[key] || "inherit")) {
      changed.add(key);
    }
  });
  return changed;
});
const filteredItemsCount = computed(() => {
  const query = searchQ.value.trim().toLowerCase();
  return (catalog.value.items || []).filter((item) => {
    const haystack = `${item.key} ${item.label || ""} ${item.description || ""}`.toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (onlyFavs.value && !favsSet.value.has(item.key)) return false;
    if (onlyChanged.value && !changedKeysSet.value.has(item.key)) return false;
    return true;
  }).length;
});

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
const permissionCounts = computed(() => countPermissionStates(workingPerms.value));
const allowCount = computed(() => permissionCounts.value.allow);
const denyCount = computed(() => permissionCounts.value.deny);
const inheritCount = computed(() => permissionCounts.value.inherit);

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

const syncWorkingMaps = (map = {}) => {
  const normalized = buildPermissionMap(catalog.value, map);
  baseSnapshot.value = { ...normalized };
  workingPerms.value = { ...normalized };
};
const hydrateProfiles = (items = []) =>
  (items || []).map((profile) => ({
    ...profile,
    map: buildPermissionMap(catalog.value, profile?.map || {}),
  }));

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
    const [fetchedCatalog, fetchedProfiles] = await Promise.all([
      store.fetchCatalog?.(),
      store.fetchProfiles?.(),
    ]);
    catalog.value = normalizePermissionCatalog(fetchedCatalog || store.catalog || {});
    profiles.value = hydrateProfiles(fetchedProfiles || store.profiles || []);
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
    if (!catalog.value.items?.length) {
      catalog.value = normalizePermissionCatalog(store.catalog || {});
    }
    syncWorkingMaps(map || {});
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
  const p = profiles.value.find((x) => (x.id || x._id) === id);
  syncWorkingMaps(p?.map || {});
  inlineProfileName.value = p?.name || "";
  highlightSource.value = null;
  showDiffs.value = showConflicts.value = showChanges.value = false;
};

/* ===== CRUD Perfiles ===== */
const selectProfile = (id) => {
  selectedProfileId.value = id;
  onPickProfile(id);
};
const promptProfileName = (title, message, value = "") =>
  new Promise((resolve) => {
    $q.dialog({
      title,
      message,
      prompt: {
        model: value,
        type: "text",
        isValid: (input) => !!String(input || "").trim(),
      },
      cancel: true,
      persistent: true,
      ok: { label: "Guardar", color: "primary", unelevated: true },
      cancel: { label: "Cancelar", flat: true },
    })
      .onOk((input) => resolve(String(input || "").trim()))
      .onCancel(() => resolve(null));
  });

const onOpenCreateProfile = async () => {
  const name = await promptProfileName(
    "Nuevo perfil",
    "Ponle un nombre claro, por ejemplo “RRHH”, “Supervisor turnos” o “Lectura nómina”."
  );
  if (!name) return;

  try {
    const list = await store.createProfile?.({
      name,
      map: buildPermissionMap(catalog.value, {}),
    });
    profiles.value = hydrateProfiles(list || store.profiles || []);
    const created =
      profiles.value.find((profile) => profile.name === name) ||
      profiles.value[profiles.value.length - 1];
    if (created) {
      mode.value = "profile";
      selectProfile(created.id || created._id);
    }
    $q.notify({ type: "positive", message: "Perfil creado correctamente." });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e?.message || "No se pudo crear el perfil.",
    });
  }
};

const onDuplicateProfile = async (profile) => {
  const name = await promptProfileName(
    "Duplicar perfil",
    `Se creará una copia editable de "${profile.name}".`,
    `Copia de ${profile.name}`
  );
  if (!name) return;

  try {
    const list = await store.createProfile?.({
      name,
      map: buildPermissionMap(catalog.value, profile?.map || {}),
    });
    profiles.value = hydrateProfiles(list || store.profiles || []);
    const created =
      profiles.value.find((item) => item.name === name) ||
      profiles.value[profiles.value.length - 1];
    if (created) {
      mode.value = "profile";
      selectProfile(created.id || created._id);
    }
    $q.notify({ type: "positive", message: "Perfil duplicado correctamente." });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e?.message || "No se pudo duplicar el perfil.",
    });
  }
};

const onRemoveProfile = (id) => {
  const profile = profiles.value.find((item) => (item.id || item._id) === id);
  $q.dialog({
    title: "Eliminar perfil",
    message: `Se eliminará "${profile?.name || "este perfil"}". Esta acción no se puede deshacer.`,
    cancel: true,
    persistent: true,
    ok: { label: "Eliminar", color: "negative", unelevated: true },
    cancel: { label: "Cancelar", flat: true },
  }).onOk(async () => {
    try {
      const list = await store.deleteProfile?.(id);
      profiles.value = hydrateProfiles(list || store.profiles || []);
      if (selectedProfileId.value === id) {
        selectedProfileId.value = null;
        inlineProfileName.value = "";
        syncWorkingMaps({});
      }
      $q.notify({ type: "positive", message: "Perfil eliminado." });
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e?.message || "No se pudo eliminar el perfil.",
      });
    }
  });
};
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
      const list = await store.updateProfile({
        id,
        name: newName,
        map: workingPerms.value,
      });
      profiles.value = hydrateProfiles(list || store.profiles || []);
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
  const next = buildPermissionMap(catalog.value, workingPerms.value);
  for (const item of catalog.value.items || []) {
    next[item.key] = val;
  }
  workingPerms.value = next;
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
        const list = await store.updateProfile({
          id: p.id || p._id,
          name: inlineProfileName.value || p.name,
          map: workingPerms.value,
        });
        profiles.value = hydrateProfiles(list || store.profiles || []);
      }
    } else {
      return $q.notify({
        type: "warning",
        message: "Seleccione un objetivo (Usuario o Perfil).",
      });
    }
    baseSnapshot.value = buildPermissionMap(catalog.value, workingPerms.value);
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
  workingPerms.value = buildPermissionMap(catalog.value, baseSnapshot.value);
  $q.notify({ type: "info", message: "Cambios descartados." });
};

/* ===== Asistente “Aplicar Perfil” ===== */
const showApplyDialog = ref(false);
const onOpenApplyWizard = () => {
  showApplyDialog.value = true;
};
const onApplyMerged = ({ merged, summary, profileId, policy }) => {
  workingPerms.value = buildPermissionMap(catalog.value, merged);
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
  syncWorkingMaps({});
  highlightSource.value = null;
  showDiffs.value = showConflicts.value = showChanges.value = false;
  nextTick(() => {
    if (mode.value === "user") focusUserSearch();
  });
};
</script>

<style scoped>
/* ── Variables de tema ───────────────────────────────────────────── */
.rk-banner {
  --b-bg:      #ffffff;
  --b-border:  rgba(6,182,212,.14);
  --b-shadow:  0 4px 16px rgba(6,182,212,.07), 0 1px 4px rgba(0,0,0,.04);
  --b-divider: rgba(6,182,212,.18);
  --b-title:   rgba(15,23,42,.85);
  --b-muted:   rgba(15,23,42,.48);
  --b-icon:    #06b6d4;
  --b-h:       44px;
}
.body--dark .rk-banner {
  --b-bg:      rgba(10,16,28,.97);
  --b-border:  rgba(6,182,212,.18);
  --b-shadow:  0 4px 20px rgba(0,0,0,.35);
  --b-divider: rgba(6,182,212,.22);
  --b-title:   rgba(255,255,255,.90);
  --b-muted:   rgba(255,255,255,.45);
  --b-icon:    #22d3ee;
}

/* ── Banner card ─────────────────────────────────────────────────── */
.rk-banner {
  border-radius: 18px;
  border: 1px solid var(--b-border);
  background: var(--b-bg);
  box-shadow: var(--b-shadow);
  margin-bottom: 10px;
}

/* ── Row y grupos ────────────────────────────────────────────────── */
.rk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  min-height: var(--b-h);
}
.rk-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ── Divisor vertical ────────────────────────────────────────────── */
.rk-divider {
  width: 1px;
  height: 24px;
  background: var(--b-divider);
  border-radius: 1px;
  flex-shrink: 0;
}

/* ── Toggle de modo ──────────────────────────────────────────────── */
.rk-modes :deep(.q-btn) {
  border-radius: 10px;
  font-size: .82rem;
  font-weight: 700;
  height: 36px;
  min-height: 36px;
}
.rk-modes :deep(.q-btn--active) {
  box-shadow: 0 4px 12px rgba(6,182,212,.25);
}

/* ── Chips ───────────────────────────────────────────────────────── */
.rk-chip {
  height: 34px;
  border-radius: 999px;
  font-size: .82rem;
  font-weight: 600;
}
.rk-chip-empty {
  color: var(--b-muted);
  border-color: var(--b-divider);
}
.rk-chip :deep(.q-chip__content) { gap: 4px; }

/* ── Inline rename ───────────────────────────────────────────────── */
.rk-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rk-inline :deep(.q-field__control) {
  height: 36px;
  min-height: 36px;
  border-radius: 10px;
  font-size: .83rem;
}
.rk-inline-name { width: 190px; }

/* ── Leyenda ─────────────────────────────────────────────────────── */
.rk-legend {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}
.rk-badge {
  height: 28px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

/* ── Separador vertical ──────────────────────────────────────────── */
.rk-sep { opacity: .3; background: var(--b-divider); }

/* ── Botones de acción ───────────────────────────────────────────── */
.rk-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: .82rem;
  font-weight: 700;
}
.rk-btn-main {
  padding: 0 20px;
  font-weight: 700;
}
.rk-btn-save-inline {
  width: 36px;
  height: 36px;
}

/* ── Layout cuerpo ───────────────────────────────────────────────── */
.rk-body { flex: 1 1 auto; min-height: 0; padding: 0 0 12px; }
.rk-col-side, .rk-col-main {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
