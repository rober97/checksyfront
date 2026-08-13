// src/utils/appDownload.js
//
// Punto único de verdad para la descarga de la app móvil.
//
// La regla: NADA enlaza directo a Google Play. Todo apunta a /app, y /app
// decide. Los correos de activación ya enviados, los afiches impresos en la
// pared del local y los QR pegados junto al reloj no se pueden editar después:
// si llevaran la URL de Play, el día que salga iOS habría que reimprimirlos
// todos, y un iPhone que escanea un QR de Google Play llega a una página que no
// le sirve.

/** Ficha de la app en Google Play. Solo /app debería usarla. */
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.roberub.recksy'

/**
 * App Store. Cuando salga la build de iOS, se rellena acá y el resto del
 * producto —correos, landing, onboarding— ya apunta al sitio correcto sin
 * tocar una línea más.
 */
export const APP_STORE_URL = ''

/** Ruta pública que resuelve la descarga según el dispositivo. */
export const APP_LANDING_PATH = '/app'

/**
 * Detecta la plataforma del visitante.
 *
 * `maxTouchPoints` es imprescindible para el iPad: desde iPadOS 13 su user
 * agent dice "Macintosh", así que sin ese chequeo un iPad se clasifica como
 * escritorio y nunca ve el aviso de iOS.
 */
export function detectPlatform() {
  if (typeof navigator === 'undefined') return 'desktop'

  const ua = navigator.userAgent || ''
  if (/android/i.test(ua)) return 'android'
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'ios'

  return 'desktop'
}
