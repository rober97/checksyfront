// src/stores/payrollRates.store.js (Pinia)
import { defineStore } from "pinia";
import secureAxios from "@/utils/secureRequest"

const safeArr = (v) => (Array.isArray(v) ? v : []);
const toKey = (s) => String(s || "").toLowerCase().trim();

function pickLatestActiveForKey(list) {
  // list ya viene ordenada validFrom desc idealmente; pero igual lo aseguramos
  const sorted = [...list].sort((a, b) => new Date(b.validFrom) - new Date(a.validFrom));
  return sorted.find((x) => x.active) || sorted[0] || null;
}

export const usePayrollRatesStore = defineStore("payrollRates", {
  state: () => ({
    loading: false,

    // entidades globales
    afpEntities: [],
    healthEntities: [],

    // params
    afpParams: [],
    healthParams: [],
    cesantiaParams: [],
    otherDeductionParams: [],

    // tablas “armadas”
    afpRows: [],
    healthRows: [],
    cesantiaRows: [],
    otherDeductionRows: []
  }),

  actions: {
    async loadAll({ companyId = null } = {}) {
      this.loading = true;
      try {
        // 1) entities
        const [afpEnt, healthEnt] = await Promise.all([
          secureAxios.get("/payroll/entities", { params: { type: "AFP" } }),
          secureAxios.get("/payroll/entities", { params: { type: "HEALTH" } })
        ]);

        this.afpEntities = safeArr(afpEnt?.data?.rows);
        this.healthEntities = safeArr(healthEnt?.data?.rows);

        // 2) params
        const cid = companyId === null ? "null" : companyId;

        const [afpP, healthP, cesP, otherP] = await Promise.all([
          secureAxios.get("/payroll/params", { params: { type: "AFP_RATE", scope: "ENTITY", companyId: cid, active: true, limit: 2000 } }),
          secureAxios.get("/payroll/params", { params: { type: "FONASA_RATE", scope: "ENTITY", companyId: cid, active: true, limit: 2000 } }),
          secureAxios.get("/payroll/params", { params: { type: "CESANTIA_RATE", scope: "CONTRACT_TYPE", companyId: cid, active: true, limit: 2000 } }),
          secureAxios.get("/payroll/params", { params: { type: "OTHER_DEDUCTION_RATE", scope: "KEY", companyId: cid, active: true, limit: 2000 } })
        ]);

        this.afpParams = safeArr(afpP?.data?.rows);
        this.healthParams = safeArr(healthP?.data?.rows);
        this.cesantiaParams = safeArr(cesP?.data?.rows);
        this.otherDeductionParams = safeArr(otherP?.data?.rows);

        this.buildTables();
      } finally {
        this.loading = false;
      }
    },

    buildTables() {
      // ===== AFP rows =====
      const paramsByEntity = new Map();
      for (const p of this.afpParams) {
        if (!p?.entityId) continue;
        const k = String(p.entityId);
        if (!paramsByEntity.has(k)) paramsByEntity.set(k, []);
        paramsByEntity.get(k).push(p);
      }

      this.afpRows = this.afpEntities
        .filter((e) => e?.active)
        .map((e) => {
          const list = paramsByEntity.get(String(e._id)) || [];
          const latest = pickLatestActiveForKey(list);

          if (!latest) {
            return {
              rowKey: String(e._id),
              missing: true,
              entityId: String(e._id),
              entityLabel: e.name || e.slug,
              key: toKey(e.slug),
              value: null,
              validFrom: null,
              validTo: null,
              active: false,
              paramId: null
            };
          }

          return {
            rowKey: String(latest._id),
            missing: false,
            paramId: String(latest._id),
            entityId: String(e._id),
            entityLabel: e.name || e.slug,
            key: toKey(latest.key || e.slug),
            value: latest.value,
            validFrom: latest.validFrom,
            validTo: latest.validTo,
            active: !!latest.active,
            metaLabel: latest?.meta?.label || ""
          };
        })
        .sort((a, b) => String(a.key).localeCompare(String(b.key)));

      // ===== HEALTH rows (solo no requiresUf) =====
      const healthEligible = this.healthEntities.filter((e) => e?.active && !e?.meta?.requiresUf);

      const hpByEntity = new Map();
      for (const p of this.healthParams) {
        if (!p?.entityId) continue;
        const k = String(p.entityId);
        if (!hpByEntity.has(k)) hpByEntity.set(k, []);
        hpByEntity.get(k).push(p);
      }

      this.healthRows = healthEligible
        .map((e) => {
          const list = hpByEntity.get(String(e._id)) || [];
          const latest = pickLatestActiveForKey(list);

          if (!latest) {
            return {
              rowKey: String(e._id),
              missing: true,
              entityId: String(e._id),
              entityLabel: e.name || e.slug,
              key: toKey(e.slug),
              value: null,
              validFrom: null,
              validTo: null,
              active: false,
              paramId: null
            };
          }

          return {
            rowKey: String(latest._id),
            missing: false,
            paramId: String(latest._id),
            entityId: String(e._id),
            entityLabel: e.name || e.slug,
            key: toKey(latest.key || e.slug),
            value: latest.value,
            validFrom: latest.validFrom,
            validTo: latest.validTo,
            active: !!latest.active,
            metaLabel: latest?.meta?.label || ""
          };
        })
        .sort((a, b) => String(a.key).localeCompare(String(b.key)));

      // ===== CESANTIA rows =====
      // Para cesantía, mostramos todos los params activos existentes.
      // Si quieres “plantilla” por contractType fijo, lo armamos igual que AFP.
      this.cesantiaRows = this.cesantiaParams
        .map((p) => ({
          rowKey: String(p._id),
          missing: false,
          paramId: String(p._id),
          key: toKey(p.key),
          value: p.value,
          validFrom: p.validFrom,
          validTo: p.validTo,
          active: !!p.active,
          metaLabel: p?.meta?.label || ""
        }))
        .sort((a, b) => String(a.key).localeCompare(String(b.key)));

      // ===== OTHER DEDUCTION rows =====
      this.otherDeductionRows = this.otherDeductionParams
        .map((p) => ({
          rowKey: String(p._id),
          missing: false,
          paramId: String(p._id),
          key: toKey(p.key),
          value: p.value,
          validFrom: p.validFrom,
          validTo: p.validTo,
          active: !!p.active,
          metaLabel: p?.meta?.label || ""
        }))
        .sort((a, b) =>
          String(a.metaLabel || a.key).localeCompare(String(b.metaLabel || b.key))
        );
    },

    async upsert(payload) {
      // payload como el que armamos en la página
      const res = await secureAxios.post("/payroll/params/upsert", payload);
      // recarga para que el cierre anti-solape se refleje
      const cid = payload.companyId === null ? null : payload.companyId;
      await this.loadAll({ companyId: cid });
      return res.data;
    },

    async deactivate(paramId) {
      // Si aún no tienes endpoint DELETE, usa uno de “deactivate”
      // Aquí asumo PATCH /payroll/params/:id/deactivate
      await secureAxios.patch(`/payroll/params/${paramId}/deactivate`);
      // recarga
      await this.loadAll({ companyId: null });
    }
  }
});
