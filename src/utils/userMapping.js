// API.role ↔ UI.tipo
export function mapApiRoleToUI(role) {
    return role === "company" ? "empresa" : role === "employee" ? "empleado" : role || "empleado";
}
export function mapUIRoleToApi(ui) {
    return ui === "empresa" ? "company" : ui === "empleado" ? "employee" : ui || "employee";
}

// API → UI (para hidratar formularios)
export function mapFromApi(u = {}) {
    const empresas = Array.isArray(u.companies)
        ? u.companies.map(c => c?._id || c).filter(Boolean)
        : []
    return {
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        email: u.email || "",
        personalEmail: u.personalEmail || "",
        password: "", // no se edita aquí
        tipo: mapApiRoleToUI(u.role),
        empresa: u.company?._id || u.company || null,
        empresas,
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
        personalData: {
            birthDate: u.personalData?.birthDate ? String(u.personalData.birthDate).slice(0, 10) : null,
            birthPlace: u.personalData?.birthPlace || "",
            nationality: u.personalData?.nationality || "CL",
            gender: u.personalData?.gender || "",
            civilStatus: u.personalData?.civilStatus || "",
            educationLevel: u.personalData?.educationLevel || "",
            profession: u.personalData?.profession || "",
            documentType: u.personalData?.documentType || "rut",
            documentNumber: u.personalData?.documentNumber || "",
            visaType: u.personalData?.visaType || "",
            visaExpiry: u.personalData?.visaExpiry ? String(u.personalData.visaExpiry).slice(0, 10) : null,
            tutorAuthorizationDocId: u.personalData?.tutorAuthorizationDocId || null,
        },
        payroll: {
            baseSalary: u.payroll?.baseSalary ?? 0,
            contractType: u.payroll?.contractType || "",
            jornada: u.payroll?.jornada || "",
            jornadaArt: u.payroll?.jornadaArt || "normal",
            startDate: u.payroll?.startDate ? String(u.payroll.startDate).slice(0, 10) : "",
            endDate: u.payroll?.endDate ? String(u.payroll.endDate).slice(0, 10) : "",
            cargo: u.payroll?.cargo || "",
            funciones: u.payroll?.funciones || "",
            lugarTrabajo: {
                line1: u.payroll?.lugarTrabajo?.line1 || "",
                commune: u.payroll?.lugarTrabajo?.commune || "",
                city: u.payroll?.lugarTrabajo?.city || "",
                region: u.payroll?.lugarTrabajo?.region || "",
            },
            afp: u.payroll?.afp || "",
            afpEntityId: u.payroll?.afpEntityId || null,
            saludSistema: u.payroll?.saludSistema || "",
            healthEntityId: u.payroll?.healthEntityId || null,
            isaprePlan: u.payroll?.isaprePlan || "",
            isapreUf: u.payroll?.isapreUf ?? 0,
            apv: u.payroll?.apv ?? 0,
            cargasFamiliares: Array.isArray(u.payroll?.cargasFamiliares) ? u.payroll.cargasFamiliares : [],
            incomeTaxApplies: u.payroll?.incomeTaxApplies !== false,
            incomeTaxNote: u.payroll?.incomeTaxNote || "",
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
    if ("empresas" in out) {
        out.companies = Array.isArray(out.empresas) ? out.empresas.filter(Boolean) : [];
        delete out.empresas;
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
