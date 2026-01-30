import { defineStore } from "pinia";
import { payrollApi } from "@/services/payrollApi";

export const usePayrollStore = defineStore("payroll", {
  state: () => ({
    loading: false,
    error: "",
    periods: [],
    payslips: [],
    lastGenerateResult: null,
  }),

  getters: {
    byPeriod: (s) => (period) => s.periods.find(p => p.period === period),
    payslipsByStatus: (s) => (status) => s.payslips.filter(x => x.status === status),
  },

  actions: {
    async fetchPeriods({ companyId }) {
      this.loading = true;
      this.error = "";
      try {
        const res = await payrollApi.listPeriods({ companyId });
        this.periods = res?.items || [];
        return this.periods;
      } catch (e) {
        this.error = e?.response?.data?.message || e?.message || "Error cargando períodos";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async generatePeriod({ companyId, period, employeeIds }) {
      this.loading = true;
      this.error = "";
      try {
        const res = await payrollApi.generate({ companyId, period, employeeIds });
        this.lastGenerateResult = res;
        return res;
      } catch (e) {
        this.error = e?.response?.data?.message || e?.message || "Error generando liquidaciones";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async fetchPayslips({ companyId, period, q, status }) {
      this.loading = true;
      this.error = "";
      try {
        const res = await payrollApi.listPayslips({ companyId, period, q, status });
        this.payslips = res?.items || [];
        return this.payslips;
      } catch (e) {
        this.error = e?.response?.data?.message || e?.message || "Error cargando liquidaciones";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async issuePayslip({ payslipId }) {
      this.loading = true;
      this.error = "";
      try {
        const res = await payrollApi.issuePayslip({ payslipId });
        // actualizar local
        const idx = this.payslips.findIndex(x => x.id === payslipId || x._id === payslipId);
        if (idx !== -1 && res?.payslip) this.payslips[idx] = res.payslip;
        return res;
      } catch (e) {
        this.error = e?.response?.data?.message || e?.message || "Error emitiendo liquidación";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async voidPayslip({ payslipId, reason }) {
      this.loading = true;
      this.error = "";
      try {
        const res = await payrollApi.voidPayslip({ payslipId, reason });
        const idx = this.payslips.findIndex(x => x.id === payslipId || x._id === payslipId);
        if (idx !== -1 && res?.payslip) this.payslips[idx] = res.payslip;
        return res;
      } catch (e) {
        this.error = e?.response?.data?.message || e?.message || "Error anulando liquidación";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async getPdfUrl({ payslipId }) {
      const res = await payrollApi.getPdfUrl({ payslipId });
      return res?.url || "";
    }
  }
});
