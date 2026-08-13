// src/utils/googleIdentity.js
//
// Carga y montaje del botón oficial de Google Identity Services (GIS).
//
// El botón lo dibuja Google dentro de un iframe, no nosotros: es un requisito
// de sus condiciones de marca y, más concretamente, es lo único que le permite
// entregar el ID token sin sacar al usuario del sitio. Por eso acá no hay un
// <q-btn> con un ícono de Google, sino un contenedor vacío que GIS rellena.

const GSI_SRC = 'https://accounts.google.com/gsi/client'

// El Client ID es público (viaja en el bundle igual que la URL del API, ver
// utils/api.js). La variable de entorno permite apuntar a otro proyecto de
// Google sin recompilar el criterio en el código.
export const GOOGLE_CLIENT_ID =
  process.env.VUE_APP_GOOGLE_CLIENT_ID ||
  '999448546795-il4am2n7bils7uu4eut8aea00h6qjb0q.apps.googleusercontent.com'

// Una sola promesa para toda la app: si Login y Register se montan en la misma
// sesión, el script se baja una vez.
let loaderPromise = null

/** Inyecta el SDK de GIS y resuelve con `window.google.accounts.id`. */
export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id)
  }
  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`)
    const script = existing || document.createElement('script')

    const onLoad = () => {
      if (window.google?.accounts?.id) resolve(window.google.accounts.id)
      else reject(new Error('GIS cargó sin exponer accounts.id'))
    }
    const onError = () => {
      // Reintentar en el próximo montaje: la causa típica es una red caída o un
      // bloqueador, y ambas cosas pueden dejar de pasar.
      loaderPromise = null
      reject(new Error('No se pudo cargar Google Identity Services'))
    }

    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })

    if (!existing) {
      script.src = GSI_SRC
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })

  return loaderPromise
}

/**
 * Inicializa GIS y dibuja el botón dentro de `el`.
 *
 * @param {HTMLElement} el        contenedor donde Google dibuja el botón
 * @param {(credential: string) => void} onCredential  recibe el ID token
 * @param {string} text           'signin_with' | 'signup_with' | 'continue_with'
 * @param {boolean} dark          usa la variante oscura del botón oficial
 * @returns {Promise<void>}
 */
export async function renderGoogleButton({ el, onCredential, text = 'continue_with', dark = false }) {
  if (!el) throw new Error('Falta el contenedor del botón de Google')

  const gis = await loadGoogleIdentity()

  gis.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      if (response?.credential) onCredential(response.credential)
    },
    // One Tap fuera: aparece sola apenas carga la página y, en una pantalla que
    // ya tiene un formulario de registro, se lee como un popup intrusivo.
    auto_select: false,
    cancel_on_tap_outside: true,
    ux_mode: 'popup',
  })

  // GIS acepta entre 200 y 400px; fuera de ese rango dibuja el botón con el
  // ancho por defecto y queda descuadrado respecto de los inputs.
  const width = Math.min(400, Math.max(200, Math.round(el.clientWidth || 320)))

  el.innerHTML = ''
  gis.renderButton(el, {
    type: 'standard',
    // 'outline' sobre fondo oscuro queda como una caja blanca flotando; Google
    // publica 'filled_black' justamente para ese caso.
    theme: dark ? 'filled_black' : 'outline',
    size: 'large',
    shape: 'pill',
    text,
    logo_alignment: 'center',
    width,
  })
}
