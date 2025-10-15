import { ref } from "vue";
import { useCompaniesStore } from "@/stores/companies";

export function useCompanies() {
  const companiesStore = useCompaniesStore();
  const empresas = ref([]);
  const empresasRaw = ref([]);
  const horarios = ref([]);
  const loadingEmpresas = ref(false);
  const loadingHorarios = ref(false);

  async function loadEmpresas() {
    loadingEmpresas.value = true;
    try {
      await companiesStore.fetchCompanies();
      empresasRaw.value = (companiesStore.companies || []).map((c) => ({
        id: c._id,
        name: c.name,
      }));
      empresas.value = empresasRaw.value.slice(0, 50);
    } finally {
      loadingEmpresas.value = false;
    }
  }

  function filterEmpresas(val, update) {
    const v = (val || "").toLowerCase();
    update(() => {
      empresas.value = v
        ? empresasRaw.value.filter((e) => e.name.toLowerCase().includes(v)).slice(0, 50)
        : empresasRaw.value.slice(0, 50);
    });
  }

  async function loadHorarios(empresaId) {
    if (!empresaId) { horarios.value = []; return; }
    loadingHorarios.value = true;
    try {
      await companiesStore.fetchWorkSchedulesByCompany(empresaId);
      horarios.value = (companiesStore.workSchedules || []).map((h) => ({
        id: h._id,
        name: h.name,
      }));
    } finally {
      loadingHorarios.value = false;
    }
  }

  return {
    empresas, empresasRaw, horarios,
    loadingEmpresas, loadingHorarios,
    loadEmpresas, loadHorarios, filterEmpresas,
  };
}
