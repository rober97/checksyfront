import { defineStore } from "pinia";
import secureAxios from "@/utils/secureRequest";

const baseUrl = "/payroll";

function toQuery(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null && value !== "")
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function pickItems(resData) {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  return resData.items || resData.data || [];
}

function pickPayslipPayload(resData) {
  return (
    resData?.payslip ||
    resData?.data?.payslip ||
    resData?.item ||
    resData?.data?.item ||
    null
  );
}

function buildEmployeeName(firstName = "", lastName = "", fallback = "") {
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || fallback || "Sin nombre";
}

function normalizeEmployee(item = {}) {
  const source =
    (item.employee && typeof item.employee === "object" && item.employee) ||
    (item.employeeId && typeof item.employeeId === "object" && item.employeeId) ||
    {};

  const id =
    source._id ||
    source.id ||
    (typeof item.employeeId === "string" ? item.employeeId : "") ||
    item.employee?._id ||
    item.employee?.id ||
    "";

  return {
    id,
    firstName: source.firstName || "",
    lastName: source.lastName || "",
    name: buildEmployeeName(
      source.firstName,
      source.lastName,
      source.name || item.employeeName || item.name || ""
    ),
    rut: source.rut || item.employeeRut || "",
    email: source.email || item.employeeEmail || "",
  };
}

function normalizeLine(line = {}, index = 0) {
  return {
    id: line._id || line.id || `${line.code || "line"}-${index}`,
    code: line.code || "",
    name: line.name || line.label || "Concepto",
    type: line.type || line.kind || "",
    qty: toNumber(line.qty, 1),
    amount: toNumber(line.amount),
    taxable: Boolean(line.taxable),
    detail: line.detail || "",
    category: line.category || "",
    meta: line.meta || {},
  };
}

function normalizePeriodSummary(item = {}) {
  const counts = item.counts || item.summary || {};
  const draft = toNumber(item.draft ?? counts.draft ?? counts.drafts ?? counts.pending);
  const issued = toNumber(
    item.issued ?? counts.issued ?? counts.published ?? counts.emitted
  );
  const voidCount = toNumber(item.void ?? counts.void ?? counts.voided);
  const total = toNumber(
    item.total ?? counts.total ?? counts.totalPayslips,
    draft + issued + voidCount
  );

  return {
    ...item,
    period: item.period || "",
    status: item.status || (draft > 0 ? "DRAFT" : issued > 0 ? "PUBLISHED" : "CLOSED"),
    total,
    draft,
    issued,
    void: voidCount,
  };
}

function normalizePayslip(item = {}) {
  const employee = normalizeEmployee(item);
  const snapshot = item.snapshot || {};
  const totals = item.totals || {};
  const daysExpected = toNumber(snapshot.expectedDays ?? item.daysExpected);
  const daysPaid = toNumber(snapshot.paidDays ?? item.daysPaid);
  const daysAbsent = toNumber(
    snapshot.absentDays ?? item.daysAbsent,
    Math.max(daysExpected - daysPaid, 0)
  );
  const totalEarn = toNumber(totals.haberes ?? item.totalEarn ?? item.totalHaberes);
  const totalDeduct = toNumber(
    totals.descuentos ?? item.totalDeduct ?? item.totalDiscount
  );
  const totalNet = toNumber(
    totals.liquido ?? item.totalNet ?? item.net,
    totalEarn - totalDeduct
  );
  const lines = asArray(item.lines)
    .map((line, index) => normalizeLine(line, index))
    .sort((a, b) => toNumber(a.meta?.order) - toNumber(b.meta?.order));

  return {
    ...item,
    id: item._id || item.id || "",
    _id: item._id || item.id || "",
    employee,
    employeeId: employee.id || item.employeeId || "",
    employeeName: employee.name,
    employeeRut: employee.rut,
    employeeEmail: employee.email,
    period: item.period || snapshot.period || "",
    status: item.status || "DRAFT",
    documentId: item.documentId || item.document?._id || null,
    daysExpected,
    daysPaid,
    daysAbsent,
    totalEarn,
    totalDeduct,
    totalNet,
    totals: {
      haberes: totalEarn,
      descuentos: totalDeduct,
      liquido: totalNet,
    },
    lines,
    warnings: asArray(snapshot.warnings),
    snapshot: {
      ...snapshot,
      expectedDays: daysExpected,
      paidDays: daysPaid,
      absentDays: daysAbsent,
    },
  };
}

export const usePayrollStore = defineStore("payroll", {
  state: () => ({
    loading: false,
    loadingCount: 0,
    error: "",
    periods: [],
    payslips: [],
    lastGenerateResult: null,
  }),

  getters: {
    byPeriod: (state) => (period) => state.periods.find((row) => row.period === period),
    payslipsByStatus: (state) => (status) =>
      state.payslips.filter((row) => row.status === status),
  },

  actions: {
    _startLoading() {
      this.loadingCount += 1;
      this.loading = true;
    },

    _stopLoading() {
      this.loadingCount = Math.max(0, this.loadingCount - 1);
      this.loading = this.loadingCount > 0;
    },

    _setError(error, fallback) {
      this.error =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallback ||
        "Error";
    },

    _upsertPayslip(item) {
      const normalized = normalizePayslip(item);
      const index = this.payslips.findIndex(
        (row) => row.id === normalized.id || row._id === normalized.id
      );

      if (index === -1) this.payslips.unshift(normalized);
      else this.payslips.splice(index, 1, normalized);

      return normalized;
    },

    async fetchPeriods({ companyId }) {
      if (!companyId) throw new Error("companyId requerido");

      this._startLoading();
      this.error = "";
      try {
        const { data } = await secureAxios.get(`${baseUrl}/periods`, {
          params: toQuery({ companyId }),
        });

        this.periods = pickItems(data)
          .map(normalizePeriodSummary)
          .sort((a, b) => String(b.period || "").localeCompare(String(a.period || "")));

        return this.periods;
      } catch (error) {
        this._setError(error, "Error cargando períodos");
        throw error;
      } finally {
        this._stopLoading();
      }
    },

    async generatePeriod({ companyId, period, employeeIds }) {
      if (!companyId) throw new Error("companyId requerido");
      if (!period) throw new Error("period requerido");

      this._startLoading();
      this.error = "";
      try {
        const { data } = await secureAxios.post(`${baseUrl}/generate`, {
          companyId,
          period,
          employeeIds: Array.isArray(employeeIds) ? employeeIds : undefined,
        });

        this.lastGenerateResult = data;
        return data;
      } catch (error) {
        this._setError(error, "Error generando liquidaciones");
        throw error;
      } finally {
        this._stopLoading();
      }
    },

    async fetchPayslips({ companyId, period, q, status }) {
      if (!companyId) throw new Error("companyId requerido");

      this._startLoading();
      this.error = "";
      try {
        const { data } = await secureAxios.get(`${baseUrl}/`, {
          params: toQuery({ companyId, period, q, status }),
        });

        this.payslips = pickItems(data).map(normalizePayslip);
        return this.payslips;
      } catch (error) {
        this._setError(error, "Error cargando liquidaciones");
        throw error;
      } finally {
        this._stopLoading();
      }
    },

    async issuePayslip({ payslipId }) {
      if (!payslipId) throw new Error("payslipId requerido");

      this._startLoading();
      this.error = "";
      try {
        const { data } = await secureAxios.post(`${baseUrl}/${payslipId}/issue`);
        const updated = pickPayslipPayload(data);
        if (updated) this._upsertPayslip(updated);
        return data;
      } catch (error) {
        this._setError(error, "Error emitiendo liquidación");
        throw error;
      } finally {
        this._stopLoading();
      }
    },

    async voidPayslip({ payslipId, reason }) {
      if (!payslipId) throw new Error("payslipId requerido");

      this._startLoading();
      this.error = "";
      try {
        const { data } = await secureAxios.post(`${baseUrl}/${payslipId}/void`, {
          reason: reason || "",
        });

        const updated = pickPayslipPayload(data);
        if (updated) this._upsertPayslip(updated);
        return data;
      } catch (error) {
        this._setError(error, "Error anulando liquidación");
        throw error;
      } finally {
        this._stopLoading();
      }
    },

    async getPdfUrl({ payslipId }) {
      if (!payslipId) throw new Error("payslipId requerido");

      try {
        const { data } = await secureAxios.get(`${baseUrl}/${payslipId}/pdf-url`);
        return data?.url || data?.data?.url || "";
      } catch (error) {
        this._setError(error, "Error obteniendo PDF");
        throw error;
      }
    },
  },
});
