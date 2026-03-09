import { defineStore } from "pinia";
import secureAxios from "@/utils/secureRequest";

const asArray = (v) => (Array.isArray(v) ? v : []);

const extractItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.concepts)) return data.concepts;
  return [];
};

export const usePayrollConceptsStore = defineStore("payrollConcepts", {
  state: () => ({
    items: [],
    templates: [],

    validation: null, // { ok, missing, warnings }
    loading: false,
    error: null,
  }),

  getters: {
    activeCount: (s) => (s.items || []).filter((x) => x.active).length,
    earningsCount: (s) => (s.items || []).filter((x) => x.active && x.kind === "EARNING").length,
    deductionsCount: (s) => (s.items || []).filter((x) => x.active && x.kind === "DEDUCTION").length,
  },

  actions: {
    async fetchConcepts(companyId) {
      if (!companyId) { this.items = []; return; }
      this.loading = true; this.error = null;
      try {
        const res = await secureAxios.get(`/companies/${companyId}/payroll/concepts`);
        const ok = res?.data?.success ?? true;
        if (!ok) throw new Error(res?.data?.message || "Error fetching concepts");
        this.items = asArray(extractItems(res?.data));
      } catch (e) {
        console.error("[payrollConcepts.fetchConcepts] error:", e);
        this.error = e?.message || "Error fetching concepts";
        this.items = [];
      } finally {
        this.loading = false;
      }
    },

    async fetchTemplates() {
      this.loading = true; this.error = null;
      try {
        const res = await secureAxios.get(`/payrollConceptTemplate/concept-templates`);
        const ok = res?.data?.success ?? true;
        if (!ok) throw new Error(res?.data?.message || "Error fetching templates");
        this.templates = asArray(extractItems(res?.data));
      } catch (e) {
        console.error("[payrollConcepts.fetchTemplates] error:", e);
        this.error = e?.message || "Error fetching templates";
        this.templates = [];
      } finally {
        this.loading = false;
      }
    },

    async applyTemplate({ companyId, templateId, mode = "merge" }) {
      // mode: "replace" | "merge"
      this.loading = true; this.error = null;
      try {
        const res = await secureAxios.post(`/companies/${companyId}/payroll/concepts/apply-template`, {
          templateId, mode
        });
        const ok = res?.data?.success ?? true;
        if (!ok) throw new Error(res?.data?.message || "Error applying template");
        // backend debería devolver conceptos resultantes
        this.items = asArray(extractItems(res?.data));
        return res?.data;
      } catch (e) {
        console.error("[payrollConcepts.applyTemplate] error:", e);
        this.error = e?.response?.data?.message || e?.message || "Error applying template";
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async upsertConcept({ companyId, concept }) {
      this.loading = true; this.error = null;
      try {
        const res = await secureAxios.post(`/companies/${companyId}/payroll/concepts/upsert`, concept);
        const ok = res?.data?.success ?? true;
        if (!ok) throw new Error(res?.data?.message || "Error saving concept");
        const saved = res?.data?.item || res?.data?.concept || res?.data;
        const idx = (this.items || []).findIndex((x) => x._id === saved._id);
        if (idx === -1) this.items.unshift(saved);
        else this.items.splice(idx, 1, saved);
        return saved;
      } catch (e) {
        console.error("[payrollConcepts.upsertConcept] error:", e);
        this.error = e?.response?.data?.message || e?.message || "Error saving concept";
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async deleteConcept({ companyId, conceptId }) {
      this.loading = true;
      this.error = null;

      try {
        if (!companyId) throw new Error("companyId is required");
        if (!conceptId) throw new Error("conceptId is required");

        const res = await secureAxios.delete(
          `/companies/${companyId}/payroll/concepts/${conceptId}`
        );

        const ok = res?.data?.success ?? true;
        if (!ok) throw new Error(res?.data?.message || "Error deleting concept");

        this.items = asArray(this.items).filter((x) => x._id !== conceptId);

        return res?.data;
      } catch (e) {
        console.error("[payrollConcepts.deleteConcept] error:", e);
        this.error =
          e?.response?.data?.message || e?.message || "Error deleting concept";
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async bulkUpdate({ companyId, patches }) {
      this.loading = true; this.error = null;
      try {
        const res = await secureAxios.patch(`/companies/${companyId}/payroll/concepts/bulk`, { patches });
        const ok = res?.data?.success ?? true;
        if (!ok) throw new Error(res?.data?.message || "Error bulk update");
        this.items = asArray(extractItems(res?.data));
        return res?.data;
      } catch (e) {
        console.error("[payrollConcepts.bulkUpdate] error:", e);
        this.error = e?.response?.data?.message || e?.message || "Error bulk update";
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async validateCompanyPayroll(companyId) {
      this.loading = true; this.error = null;
      debugger
      try {
        const res = await secureAxios.get(`/companies/${companyId}/payroll/validate`);
        const ok = res?.data?.success ?? true;
        if (!ok) throw new Error(res?.data?.message || "Error validating payroll");
        this.validation = res?.data?.validation || res?.data;
        return this.validation;
      } catch (e) {
        console.error("[payrollConcepts.validateCompanyPayroll] error:", e);
        this.error = e?.response?.data?.message || e?.message || "Error validating payroll";
        this.validation = null;
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },
  },
});