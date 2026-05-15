// Tinte global de la app según la empresa activa.
// Sobre-escribe en runtime las CSS vars de tokens.css y las de Quasar
// para que TODO el accent (botones, links, badges, drawer, etc.) refleje
// la identidad de la empresa actual. Los colores semánticos (success,
// warning, danger) NO se tocan.
import { watch } from 'vue'
import { setCssVar } from 'quasar'
import { useAuthStore } from '@/stores/authStore'
import { getCompanyColor, DEFAULT_BRAND } from '@/utils/companyBrand'

function applyTheme(brand) {
  const s = document.body.style
  s.setProperty('--color-primary', brand.bg)
  s.setProperty('--color-primary-light', brand.light)
  s.setProperty('--color-primary-dark', brand.bgAlt)
  s.setProperty('--color-primary-hover', brand.hover)
  s.setProperty('--color-accent', brand.bgAlt)
  s.setProperty('--color-info', brand.light)
  // Quasar CSS vars (las consume internamente q-btn color="primary", etc.)
  s.setProperty('--q-primary', brand.bg)
  s.setProperty('--q-accent', brand.bgAlt)
  s.setProperty('--q-info', brand.light)
  // Helper de Quasar — algunos componentes lo usan en JS
  try { setCssVar('primary', brand.bg) } catch {}
  try { setCssVar('accent', brand.bgAlt) } catch {}
  try { setCssVar('info', brand.light) } catch {}
}

export function useCompanyTheme() {
  const auth = useAuthStore()

  // Aplica el default de inmediato para evitar parpadeo en el primer paint
  applyTheme(DEFAULT_BRAND)

  watch(
    () => auth.activeCompany,
    (company) => {
      const brand = company ? getCompanyColor(company) : DEFAULT_BRAND
      applyTheme(brand)
    },
    { immediate: true, deep: true }
  )
}
