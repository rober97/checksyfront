// Paleta de marca por empresa: hash determinista del nombre (o RUT/_id)
// para que cada empresa siempre tenga el mismo color en toda la UI.
// Cada entrada cubre los slots usados por tokens.css y Quasar:
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

// Color por defecto (cuando no hay empresa activa) = paleta original Recksy.
export const DEFAULT_BRAND = PALETTE[0]

function seedFor(company) {
  if (!company) return ''
  if (typeof company === 'string') return company
  return String(company.name || company.rut || company._id || company.id || '')
}

export function getCompanyColor(company) {
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
