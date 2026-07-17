// src/utils/mutual.js

/**
 * Afiliación a mutualidad válida: entidad elegida y tasa adicional ATEP dentro del
 * rango legal de la Ley 16.744 (0% a 3,4%).
 *
 * Vive acá y no dentro de CompanyMutualTab porque CompanyDialog necesita el mismo
 * criterio antes de que el panel se monte — Quasar monta los tab-panels recién al
 * visitarlos, y sin esto el botón de guardar queda bloqueado hasta abrir la pestaña.
 */
export const esMutualValida = (mutual) => {
  const rate = Number(mutual?.additionalRate)
  return !!mutual?.entityId && Number.isFinite(rate) && rate >= 0 && rate <= 3.4
}
