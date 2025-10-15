// API.role ↔ UI.tipo
export function mapApiRoleToUI(role) {
    return role === "company" ? "empresa" : role === "employee" ? "empleado" : role || "empleado";
}
export function mapUIRoleToApi(ui) {
    return ui === "empresa" ? "company" : ui === "empleado" ? "employee" : ui || "employee";
}

// API → UI (para hidratar formularios)
export function mapFromApi(u = {}) {
    return {
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        email: u.email || "",
        password: "", // no se edita aquí
        tipo: mapApiRoleToUI(u.role),
        empresa: u.company?._id || u.company || null,
        rut: u.rut || "",
        horarioLaboralId: u.workSchedule?._id || u.workSchedule || null,
        status: u.status || "active",
        phone: u.phone || "",
        emergencyContact: u.emergencyContact || "",
        address: {
            line1: u.address?.line1 || "",
            commune: u.address?.commune || "",
            city: u.address?.city || "",
            region: u.address?.region || "",
        },
        permissions: Array.isArray(u.permissions) ? u.permissions.slice() : [],
        payroll: {
            baseSalary: u.payroll?.baseSalary ?? 0,
            contractType: u.payroll?.contractType || "",
            jornada: u.payroll?.jornada || "",
            startDate: u.payroll?.startDate ? String(u.payroll.startDate).slice(0, 10) : "",
            afp: u.payroll?.afp || "",
            saludSistema: u.payroll?.saludSistema || "",
            isaprePlan: u.payroll?.isaprePlan || "",
            isapreUf: u.payroll?.isapreUf ?? 0,
            apv: u.payroll?.apv ?? 0,
            cargasFamiliares: u.payroll?.cargasFamiliares ?? 0,
            banco: u.payroll?.banco || "",
            tipoCuenta: u.payroll?.tipoCuenta || "",
            numeroCuenta: u.payroll?.numeroCuenta || "",
            gratificacion: u.payroll?.gratificacion ?? 0,
            bonoColacion: u.payroll?.bonoColacion ?? 0,
            bonoMovilizacion: u.payroll?.bonoMovilizacion ?? 0,
            descuentoPrestamo: u.payroll?.descuentoPrestamo ?? 0,
        },
    };
}

// UI diff → API patch (renombra claves)
export function buildApiPatch(patchUI = {}) {
    const out = JSON.parse(JSON.stringify(patchUI));

    if ("tipo" in out) {
        out.role = mapUIRoleToApi(out.tipo);
        delete out.tipo;
    }
    if ("empresa" in out) {
        out.company = out.empresa;
        delete out.empresa;
    }
    if ("horarioLaboralId" in out) {
        out.workSchedule = out.horarioLaboralId;
        delete out.horarioLaboralId;
    }

    if (out.payroll) {
        // startDate "" → null para backend
        if (out.payroll.startDate === "") out.payroll.startDate = null;
    }

    // nunca mandar password desde aquí
    if ("password" in out) delete out.password;

    return out;
}
