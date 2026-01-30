import axios from "axios";

const baseUrl = "/api/payroll";

export const payrollApi = {
  async listPeriods({ companyId }) {
    const { data } = await axios.get(`${baseUrl}/periods`, { params: { companyId } });
    return data; // { items: [{ period, status, counts... }] }
  },

  async generate({ companyId, period, employeeIds }) {
    const { data } = await axios.post(`${baseUrl}/generate`, { companyId, period, employeeIds });
    return data; // { ok: true, period, created, updated, skippedIssued }
  },

  async listPayslips({ companyId, period, q, status }) {
    const { data } = await axios.get(`${baseUrl}/payslips`, {
      params: { companyId, period, q, status }
    });
    return data; // { items: [...] }
  },

  async issuePayslip({ payslipId }) {
    const { data } = await axios.post(`${baseUrl}/payslips/${payslipId}/issue`);
    return data; // { ok, payslip }
  },

  async voidPayslip({ payslipId, reason }) {
    const { data } = await axios.post(`${baseUrl}/payslips/${payslipId}/void`, { reason });
    return data; // { ok, payslip }
  },

  async getPdfUrl({ payslipId }) {
    const { data } = await axios.get(`${baseUrl}/payslips/${payslipId}/pdf-url`);
    return data; // { url }
  }
};
