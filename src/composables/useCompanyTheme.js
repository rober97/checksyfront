// Identidad visual única de la app: SIEMPRE cyan (paleta Recksy).
// Antes esto re-tinteaba todo el accent según el brandColor de la empresa
// activa, lo que hacía que la app cambiara de color (p.ej. morado) al
// cambiar de empresa. Ahora se aplica un único color para todas para
// mantener la coherencia de paleta. Los colores semánticos no se tocan.
import { DEFAULT_BRAND } from '@/utils/companyBrand'
import { setCssVar } from 'quasar'

function applyTheme(brand) {
  // Solo fijamos las vars de Quasar (q-btn color="primary", etc.). Las
  // vars --color-* las maneja tokens.css por modo (claro/oscuro), así el
  // modo oscuro conserva su cyan más luminoso. No usamos inline para no
  // pisar el token de modo oscuro.
  try { setCssVar('primary', brand.bg) } catch {}
  try { setCssVar('accent', brand.bgAlt) } catch {}
  try { setCssVar('info', brand.light) } catch {}
}

export function useCompanyTheme() {
  // Color único para toda la app, sin importar la empresa activa.
  applyTheme(DEFAULT_BRAND)
}
