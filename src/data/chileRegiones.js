// Dataset oficial de regiones y comunas de Chile (división político-administrativa).
// 16 regiones, ordenadas de norte a sur (convención chilena).
// Usado por los selectores de dirección en cascada Región -> Comuna.

export const REGIONES_COMUNAS = [
  {
    region: "Arica y Parinacota",
    comunas: ["Arica", "Camarones", "General Lagos", "Putre"],
  },
  {
    region: "Tarapacá",
    comunas: [
      "Alto Hospicio", "Camiña", "Colchane", "Huara", "Iquique", "Pica",
      "Pozo Almonte",
    ],
  },
  {
    region: "Antofagasta",
    comunas: [
      "Antofagasta", "Calama", "María Elena", "Mejillones", "Ollagüe",
      "San Pedro de Atacama", "Sierra Gorda", "Taltal", "Tocopilla",
    ],
  },
  {
    region: "Atacama",
    comunas: [
      "Alto del Carmen", "Caldera", "Chañaral", "Copiapó", "Diego de Almagro",
      "Freirina", "Huasco", "Tierra Amarilla", "Vallenar",
    ],
  },
  {
    region: "Coquimbo",
    comunas: [
      "Andacollo", "Canela", "Combarbalá", "Coquimbo", "Illapel", "La Higuera",
      "La Serena", "Los Vilos", "Monte Patria", "Ovalle", "Paihuano",
      "Punitaqui", "Río Hurtado", "Salamanca", "Vicuña",
    ],
  },
  {
    region: "Valparaíso",
    comunas: [
      "Algarrobo", "Cabildo", "Calera", "Calle Larga", "Cartagena",
      "Casablanca", "Catemu", "Concón", "El Quisco", "El Tabo", "Hijuelas",
      "Isla de Pascua", "Juan Fernández", "La Cruz", "La Ligua", "Limache",
      "Llaillay", "Los Andes", "Nogales", "Olmué", "Panquehue", "Papudo",
      "Petorca", "Puchuncaví", "Putaendo", "Quillota", "Quilpué", "Quintero",
      "Rinconada", "San Antonio", "San Esteban", "San Felipe", "Santa María",
      "Santo Domingo", "Valparaíso", "Villa Alemana", "Viña del Mar", "Zapallar",
    ],
  },
  {
    region: "Metropolitana de Santiago",
    comunas: [
      "Alhué", "Buin", "Calera de Tango", "Cerrillos", "Cerro Navia", "Colina",
      "Conchalí", "Curacaví", "El Bosque", "El Monte", "Estación Central",
      "Huechuraba", "Independencia", "Isla de Maipo", "La Cisterna",
      "La Florida", "La Granja", "La Pintana", "La Reina", "Lampa", "Las Condes",
      "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "María Pinto",
      "Melipilla", "Ñuñoa", "Padre Hurtado", "Paine", "Pedro Aguirre Cerda",
      "Peñaflor", "Peñalolén", "Pirque", "Providencia", "Pudahuel",
      "Puente Alto", "Quilicura", "Quinta Normal", "Recoleta", "Renca",
      "San Bernardo", "San Joaquín", "San José de Maipo", "San Miguel",
      "San Pedro", "San Ramón", "Santiago", "Talagante", "Tiltil", "Vitacura",
    ],
  },
  {
    region: "O'Higgins",
    comunas: [
      "Chépica", "Chimbarongo", "Codegua", "Coinco", "Coltauco", "Doñihue",
      "Graneros", "La Estrella", "Las Cabras", "Litueche", "Lolol", "Machalí",
      "Malloa", "Marchihue", "Mostazal", "Nancagua", "Navidad", "Olivar",
      "Palmilla", "Paredones", "Peralillo", "Peumo", "Pichidegua", "Pichilemu",
      "Placilla", "Pumanque", "Quinta de Tilcoco", "Rancagua", "Rengo",
      "Requínoa", "San Fernando", "San Vicente", "Santa Cruz",
    ],
  },
  {
    region: "Maule",
    comunas: [
      "Cauquenes", "Chanco", "Colbún", "Constitución", "Curepto", "Curicó",
      "Empedrado", "Hualañé", "Licantén", "Linares", "Longaví", "Maule",
      "Molina", "Parral", "Pelarco", "Pelluhue", "Pencahue", "Rauco", "Retiro",
      "Río Claro", "Romeral", "Sagrada Familia", "San Clemente", "San Javier",
      "San Rafael", "Talca", "Teno", "Vichuquén", "Villa Alegre", "Yerbas Buenas",
    ],
  },
  {
    region: "Ñuble",
    comunas: [
      "Bulnes", "Chillán", "Chillán Viejo", "Cobquecura", "Coelemu", "Coihueco",
      "El Carmen", "Ninhue", "Ñiquén", "Pemuco", "Pinto", "Portezuelo",
      "Quillón", "Quirihue", "Ranquil", "San Carlos", "San Fabián",
      "San Ignacio", "San Nicolás", "Treguaco", "Yungay",
    ],
  },
  {
    region: "Biobío",
    comunas: [
      "Alto Biobío", "Antuco", "Arauco", "Cabrero", "Cañete", "Chiguayante",
      "Concepción", "Contulmo", "Coronel", "Curanilahue", "Florida", "Hualpén",
      "Hualqui", "Laja", "Lebu", "Los Álamos", "Los Ángeles", "Lota", "Mulchén",
      "Nacimiento", "Negrete", "Penco", "Quilaco", "Quilleco", "San Pedro de la Paz",
      "San Rosendo", "Santa Bárbara", "Santa Juana", "Talcahuano", "Tirúa",
      "Tomé", "Tucapel", "Yumbel",
    ],
  },
  {
    region: "La Araucanía",
    comunas: [
      "Angol", "Carahue", "Cholchol", "Collipulli", "Cunco", "Curacautín",
      "Curarrehue", "Ercilla", "Freire", "Galvarino", "Gorbea", "Lautaro",
      "Loncoche", "Lonquimay", "Los Sauces", "Lumaco", "Melipeuco",
      "Nueva Imperial", "Padre Las Casas", "Perquenco", "Pitrufquén", "Pucón",
      "Purén", "Renaico", "Saavedra", "Temuco", "Teodoro Schmidt", "Toltén",
      "Traiguén", "Victoria", "Vilcún", "Villarrica",
    ],
  },
  {
    region: "Los Ríos",
    comunas: [
      "Corral", "Futrono", "La Unión", "Lago Ranco", "Lanco", "Los Lagos",
      "Máfil", "Mariquina", "Paillaco", "Panguipulli", "Río Bueno", "Valdivia",
    ],
  },
  {
    region: "Los Lagos",
    comunas: [
      "Ancud", "Calbuco", "Castro", "Chaitén", "Chonchi", "Cochamó",
      "Curaco de Vélez", "Dalcahue", "Fresia", "Frutillar", "Futaleufú",
      "Hualaihué", "Llanquihue", "Los Muermos", "Maullín", "Osorno", "Palena",
      "Puerto Montt", "Puerto Octay", "Puerto Varas", "Puqueldón", "Purranque",
      "Puyehue", "Queilén", "Quellón", "Quemchi", "Quinchao", "Río Negro",
      "San Juan de la Costa", "San Pablo",
    ],
  },
  {
    region: "Aysén",
    comunas: [
      "Aysén", "Chile Chico", "Cisnes", "Cochrane", "Coyhaique", "Guaitecas",
      "Lago Verde", "O'Higgins", "Río Ibáñez", "Tortel",
    ],
  },
  {
    region: "Magallanes",
    comunas: [
      "Antártica", "Cabo de Hornos", "Laguna Blanca", "Natales", "Porvenir",
      "Primavera", "Punta Arenas", "Río Verde", "San Gregorio", "Timaukel",
      "Torres del Paine",
    ],
  },
];

// Lista plana de nombres de región (para el selector de Región).
export const REGIONES = REGIONES_COMUNAS.map((r) => r.region);

// Lista plana de todas las comunas (orden alfabético).
export const COMUNAS = REGIONES_COMUNAS.flatMap((r) => r.comunas).sort((a, b) =>
  a.localeCompare(b, "es")
);

// Índice comuna -> región, normalizado, para autocompletar la región.
const COMUNA_TO_REGION = REGIONES_COMUNAS.reduce((acc, r) => {
  r.comunas.forEach((c) => {
    acc[normalize(c)] = r.region;
  });
  return acc;
}, {});

// Quita acentos y normaliza para comparaciones/búsquedas tolerantes.
export function normalize(str) {
  return (str || "")
    .toString()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .trim();
}

// Comunas de una región dada (todas si no hay región).
export function comunasByRegion(region) {
  if (!region) return COMUNAS;
  const entry = REGIONES_COMUNAS.find((r) => normalize(r.region) === normalize(region));
  return entry ? entry.comunas : COMUNAS;
}

// Región a la que pertenece una comuna (null si no se reconoce).
export function regionForComuna(comuna) {
  return COMUNA_TO_REGION[normalize(comuna)] || null;
}
