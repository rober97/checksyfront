import { ref, reactive } from "vue";
import { normalizeMoney, normalizeDecimal } from "@/utils/format";

export function getEmptyUserForm() {
    return {
        firstName: "",
        lastName: "",
        email: "",
        tipo: "empleado",
        company: null,
        rut: "",
        horarioLaboralId: null,
        status: "active",
        phone: "",
        emergencyContact: "",
        address: { line1: "", commune: "", city: "", region: "" },
        permissions: [],
        payroll: {
            baseSalary: 0,
            contractType: "",
            jornada: "",
            startDate: "",
            afp: "",
            saludSistema: "",
            isaprePlan: "",
            isapreUf: 0,
            apv: 0,
            cargasFamiliares: 0,
            banco: "",
            tipoCuenta: "",
            numeroCuenta: "",
            gratificacion: 0,
            bonoColacion: 0,
            bonoMovilizacion: 0,
            descuentoPrestamo: 0,
        },
    };
}

export function normalizeUserPatch(p) {
    if (p?.payroll) {
        const pp = p.payroll;
        [
            "baseSalary",
            "apv",
            "gratificacion",
            "bonoColacion",
            "bonoMovilizacion",
            "descuentoPrestamo",
        ].forEach((k) => {
            if (pp[k] !== undefined) pp[k] = normalizeMoney(pp[k]);
        });
        if (pp.isapreUf !== undefined) pp.isapreUf = Number(normalizeDecimal(pp.isapreUf));
    }
}

// badge helpers (opcional para centralizar estilo/semántica)
export function statusNice(s) {
    return ({ active: "Activo", inactive: "Inactivo", suspended: "Suspendido" }[s] || s || "—");
}
export function statusColor(s) {
    return s === "active" ? "positive" : s === "inactive" ? "grey" : "warning";
}

// fechas amigables (para audit)
export function friendly(d) {
    if (!d) return "—";
    try {
        return new Intl.DateTimeFormat("es-CL", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(d));
    } catch {
        return "—";
    }
}
