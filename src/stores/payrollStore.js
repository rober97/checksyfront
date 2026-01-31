import { defineStore } from "pinia";
import secureAxios from "@/utils/secureRequest";

const baseUrl = "/payroll"; // OJO: secureAxios normalmente ya tiene baseURL "/api"

function toQuery(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
}

// Normaliza payloads típicos: { success, items } o { items } o data directo
function pickItems(resData) {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  return resData.items || resData.data || [];
}

export const usePayrollStore = defineStore("payroll", {
  state: () => ({
    loading: false,
    error: "",

    periods: [],
    payslips: [],
    lastGenerateResult: null,
  }),

  getters: {
    byPeriod: (s) => (period) => s.periods.find((p) => p.period === period),
    payslipsByStatus: (s) => (status) => s.payslips.filter((x) => x.status === status),
  },

  actions: {
    _setError(e, fallback) {
      this.error =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        fallback ||
        "Error";
    },

    // =========================
    // PERIODOS
    // GET /api/payroll/periods?companyId=...
    // =========================
    async fetchPeriods({ companyId }) {
      if (!companyId) throw new Error("companyId requerido");
      this.loading = true;
      this.error = "";
      try {
        const { data } = await secureAxios.get(`${baseUrl}/periods`, {
          params: toQuery({ companyId }),
        });

        // Puede venir { items: [...] } o { success, items } o { data: [...] }
        this.periods = pickItems(data);
        return this.periods;
      } catch (e) {
        this._setError(e, "Error cargando períodos");
        throw e;
      } finally {
        this.loading = false;
      }
    },

    // =========================
    // GENERAR
    // POST /api/payroll/generate
    // body: { companyId, period, employeeIds }
    // =========================
    async generatePeriod({ companyId, period, employeeIds }) {
      if (!companyId) throw new Error("companyId requerido");
      if (!period) throw new Error("period requerido");

      this.loading = true;
      this.error = "";
      try {
        const { data } = await secureAxios.post(`${baseUrl}/generate`, {
          companyId,
          period,
          employeeIds: Array.isArray(employeeIds) ? employeeIds : undefined,
        });

        this.lastGenerateResult = data;

        // opcional: refrescar periodos si quieres
        // await this.fetchPeriods({ companyId });

        return data;
      } catch (e) {
        this._setError(e, "Error generando liquidaciones");
        throw e;
      } finally {
        this.loading = false;
      }
    },

    // =========================
    // LISTAR LIQUIDACIONES
    // GET /api/payroll/?companyId=&period=&q=&status=
    // (tu router actual: router.get("/", listPayslips))
    // =========================
    async fetchPayslips({ companyId, period, q, status }) {
      if (!companyId) throw new Error("companyId requerido");

      this.loading = true;
      this.error = "";
      try {
        const { data } = await secureAxios.get(`${baseUrl}/`, {
          params: toQuery({ companyId, period, q, status }),
        });

        this.payslips = pickItems(data);
        return this.payslips;
      } catch (e) {
        this._setError(e, "Error cargando liquidaciones");
        throw e;
      } finally {
        this.loading = false;
      }
    },

    // =========================
    // EMITIR
    // POST /api/payroll/:id/issue
    // =========================
    async issuePayslip({ payslipId }) {
      if (!payslipId) throw new Error("payslipId requerido");

      this.loading = true;
      this.error = "";
      try {
        const { data } = await secureAxios.post(`${baseUrl}/${payslipId}/issue`);

        // actualizar local si viene payslip
        const updated = data?.payslip || data?.data?.payslip || data?.item;
        if (updated) {
          const idx = this.payslips.findIndex(
            (x) => x.id === payslipId || x._id === payslipId
          );
          if (idx !== -1) this.payslips[idx] = updated;
        }

        return data;
      } catch (e) {
        this._setError(e, "Error emitiendo liquidación");
        throw e;
      } finally {
        this.loading = false;
      }
    },

    // =========================
    // ANULAR
    // POST /api/payroll/:id/void  body: { reason }
    // =========================
    async voidPayslip({ payslipId, reason }) {
      if (!payslipId) throw new Error("payslipId requerido");

      this.loading = true;
      this.error = "";
      try {
        const { data } = await secureAxios.post(`${baseUrl}/${payslipId}/void`, {
          reason: reason || "",
        });

        const updated = data?.payslip || data?.data?.payslip || data?.item;
        if (updated) {
          const idx = this.payslips.findIndex(
            (x) => x.id === payslipId || x._id === payslipId
          );
          if (idx !== -1) this.payslips[idx] = updated;
        }

        return data;
      } catch (e) {
        this._setError(e, "Error anulando liquidación");
        throw e;
      } finally {
        this.loading = false;
      }
    },

    // =========================
    // PDF URL
    // GET /api/payroll/:id/pdf-url
    // =========================
    async getPdfUrl({ payslipId }) {
      if (!payslipId) throw new Error("payslipId requerido");
      try {
        const { data } = await secureAxios.get(`${baseUrl}/${payslipId}/pdf-url`);
        return data?.url || data?.data?.url || "";
      } catch (e) {
        this._setError(e, "Error obteniendo PDF");
        throw e;
      }
    },
  },
});
