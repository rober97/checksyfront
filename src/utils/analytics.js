// src/utils/analytics.js
//
// Analítica web propia (sin Google Analytics ni terceros). Dispara un "beacon"
// ligero al backend cada vez que un visitante abre una página PÚBLICA de
// recksy.com. No usa secureAxios porque el visitante anónimo no tiene token.
//
// Privacidad: el identificador de visitante es un id aleatorio guardado en el
// navegador; no contiene datos personales y no se puede usar para identificar
// a la persona. Sólo sirve para contar visitantes únicos.
import { API_URL } from './api'

const VID_KEY = 'rk_vid' // visitante (persistente, localStorage)
const SID_KEY = 'rk_sid' // sesión (por pestaña, sessionStorage)

function randomId() {
  try {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  } catch { /* noop */ }
  return 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getVisitorId() {
  try {
    let id = localStorage.getItem(VID_KEY)
    if (!id) {
      id = randomId()
      localStorage.setItem(VID_KEY, id)
    }
    return id
  } catch {
    // Modo incógnito estricto / storage bloqueado: id efímero por carga.
    return randomId()
  }
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SID_KEY)
    if (!id) {
      id = randomId()
      sessionStorage.setItem(SID_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

/**
 * Registra una visita a una página pública. Nunca lanza: cualquier fallo se
 * traga en silencio para no afectar la navegación.
 * @param {string} path Ruta visitada (sin query, para no enviar datos sensibles)
 */
export function trackPageview(path) {
  try {
    const body = JSON.stringify({
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      path: String(path || '/').split('?')[0].slice(0, 300),
      referrer: (typeof document !== 'undefined' ? document.referrer : '') || '',
    })

    const url = `${API_URL}/analytics/collect`

    // fetch con keepalive: sobrevive a que el usuario cambie de página.
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'omit',
      mode: 'cors',
    }).catch(() => { /* silencioso */ })
  } catch {
    /* silencioso: el tracking jamás rompe la web */
  }
}
