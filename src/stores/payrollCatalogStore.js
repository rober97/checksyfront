import { defineStore } from "pinia";
import secureAxios from "@/utils/secureRequest";

// Helpers defensivos
const asArray = (v) => (Array.isArray(v) ? v : []);

const extractItems = (data) => {
  // Soporta: {success, items}, {success, entities}, array plano
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.entities)) return data.entities;
  return [];
};

const normalizeEntity = (e = {}) => ({
  _id: e._id || e.id || "",
  type: String(e.type || "").toUpperCase(),
  displayName: e.displayName || e.name || "",
  slug: (e.slug || "").toLowerCase(),
  active: e.active !== false,
  meta: e.meta || {},
  ...e,
});

export const usePayrollCatalogStore = defineStore("payrollCatalog", {
  state: () => ({
    // Catálogo global
    afps: [],
    health: [],

    // Estado
    error: null,
    loading: false,

    // cache simple
    loadedAt: null,
  }),

  getters: {
    // Aliases (por si después lo consumes distinto)
    afpOptions: (s) => s.afps,
    healthOptions: (s) => s.health,

    isReady: (s) => (s.afps?.length || 0) > 0 && (s.health?.length || 0) > 0,

    getAfpById: (s) => (id) => s.afps.find((x) => x._id === id),
    getHealthById: (s) => (id) => s.health.find((x) => x._id === id),
    getHealthMetaById: (s) => (id) => s.health.find((x) => x._id === id)?.meta || null,
    getHealthSlugById: (s) => (id) => String(s.health.find((x) => x._id === id)?.slug || "").toUpperCase(),
  },

  actions: {
    async fetchEntitiesByType({ type, active = true }) {
      const t = String(type || "").toUpperCase();
      if (!t) return [];

      const res = await secureAxios.get("/payrollEntity/entities", {
        params: {
          type: t,
          active: active ? "true" : undefined,
        },
      });

      const ok = res?.data?.success ?? true;
      if (!ok) {
        throw new Error(res?.data?.message || "Error fetching payroll entities");
      }

      const raw = extractItems(res?.data);
      return asArray(raw).map(normalizeEntity);
    },

    async fetchAll({ force = false, ttlMs = 60_000 } = {}) {
      // cache
      if (!force && this.loadedAt && Date.now() - this.loadedAt < ttlMs) return;

      this.loading = true;
      this.error = null;

      try {
        const [afps, health] = await Promise.all([
          this.fetchEntitiesByType({ type: "AFP", active: true }),
          this.fetchEntitiesByType({ type: "HEALTH", active: true }),
        ]);

        this.afps = afps;
        this.health = health;
        this.loadedAt = Date.now();
      } catch (err) {
        console.error("[payrollCatalog.fetchAll] error:", err);
        this.error = err?.message || "Error loading payroll catalog";
        this.afps = [];
        this.health = [];
        this.loadedAt = null;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    clear() {
      this.afps = [];
      this.health = [];
      this.error = null;
      this.loading = false;
      this.loadedAt = null;
    },
  },
});