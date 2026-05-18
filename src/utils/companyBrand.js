// Paleta de marca por empresa.
// 1) Si la empresa tiene `brandColor` configurado (hex #RRGGBB) → se usa ese
//    color como base y se derivan light/dark/hover por manipulación HSL.
// 2) Si no → hash determinista del nombre/RUT/_id sobre una paleta fija.
//
// Estructura común retornada:
//   bg     → --color-primary, --q-primary
//   bgAlt  → --color-primary-dark, --color-accent, --q-accent
//   light  → --color-primary-light, --color-info, --q-info
//   hover  → --color-primary-hover
//   fg     → texto sobre el color

const PALETTE = [
  { bg: '#06b6d4', bgAlt: '#0891b2', light: '#22d3ee', hover: '#0ea5e9', fg: '#ffffff' }, // cyan
  { bg: '#8b5cf6', bgAlt: '#7c3aed', light: '#a78bfa', hover: '#9333ea', fg: '#ffffff' }, // violet
  { bg: '#f59e0b', bgAlt: '#d97706', light: '#fbbf24', hover: '#ea7c00', fg: '#ffffff' }, // amber
  { bg: '#10b981', bgAlt: '#059669', light: '#34d399', hover: '#0ca678', fg: '#ffffff' }, // emerald
  { bg: '#ef4444', bgAlt: '#dc2626', light: '#f87171', hover: '#e63232', fg: '#ffffff' }, // red
  { bg: '#ec4899', bgAlt: '#db2777', light: '#f472b6', hover: '#dc3a8a', fg: '#ffffff' }, // pink
  { bg: '#3b82f6', bgAlt: '#2563eb', light: '#60a5fa', hover: '#2c70df', fg: '#ffffff' }, // blue
  { bg: '#14b8a6', bgAlt: '#0d9488', light: '#2dd4bf', hover: '#0f9e8a', fg: '#ffffff' }, // teal
  { bg: '#f97316', bgAlt: '#ea580c', light: '#fb923c', hover: '#e55c00', fg: '#ffffff' }, // orange
  { bg: '#6366f1', bgAlt: '#4f46e5', light: '#818cf8', hover: '#4338ca', fg: '#ffffff' }, // indigo
]

// Paleta sugerida para el color picker de la empresa (los 'bg' de PALETTE).
export const SUGGESTED_BRAND_COLORS = PALETTE.map(p => p.bg)

// Color por defecto (cuando no hay empresa activa) = paleta original Recksy.
export const DEFAULT_BRAND = PALETTE[0]

const HEX_RE = /^#[0-9a-fA-F]{6}$/

function seedFor(company) {
  if (!company) return ''
  if (typeof company === 'string') return company
  return String(company.name || company.rut || company._id || company.id || '')
}

function readBrandColor(company) {
  if (!company || typeof company !== 'object') return ''
  const c = String(company.brandColor || '').trim()
  return HEX_RE.test(c) ? c : ''
}

/* =========================
   Color math (hex ↔ HSL)
========================= */
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function rgbToHex(r, g, b) {
  const to = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToRgb({ h, s, l }) {
  h /= 360; s /= 100; l /= 100
  if (s === 0) {
    const v = l * 255
    return { r: v, g: v, b: v }
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  }
}

function shiftLightness(hex, delta) {
  const hsl = rgbToHsl(hexToRgb(hex))
  hsl.l = Math.max(0, Math.min(100, hsl.l + delta))
  const { r, g, b } = hslToRgb(hsl)
  return rgbToHex(r, g, b)
}

// Luminancia relativa simple para decidir si el texto contra ese fondo debe
// ser blanco u oscuro. Fórmula aproximada (no WCAG estricta pero suficiente).
function pickForeground(hex) {
  const { r, g, b } = hexToRgb(hex)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.62 ? '#0f172a' : '#ffffff'
}

function deriveBrandFromHex(hex) {
  return {
    bg: hex,
    bgAlt: shiftLightness(hex, -10),
    light: shiftLightness(hex, 10),
    hover: shiftLightness(hex, -5),
    fg: pickForeground(hex),
  }
}

/* =========================
   API pública
========================= */
export function getCompanyColor(company) {
  // 1) Color custom configurado por la empresa
  const custom = readBrandColor(company)
  if (custom) return deriveBrandFromHex(custom)

  // 2) Hash determinista del nombre/RUT
  const seed = seedFor(company)
  if (!seed) return DEFAULT_BRAND
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function getCompanyInitial(company) {
  const name = String(company?.name || '').trim()
  if (!name) return '?'
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Helper expuesto por si la UI necesita derivar shades en preview.
export { deriveBrandFromHex }
