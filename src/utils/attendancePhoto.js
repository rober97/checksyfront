// src/utils/attendancePhoto.js
// Carga de fotos de asistencia desde el endpoint protegido
// GET /attendance/photo/:id/photo  (requiere Bearer token).
//
// Como <img>/<q-img> no pueden enviar el header Authorization, descargamos
// la imagen como blob vía secureAxios y la exponemos como object URL.
// Se cachea por (id, size) para no re-descargar la misma miniatura/foto.
import secureAxios from '@/utils/secureRequest'

const cache = new Map() // key -> { url } | { promise }

function keyOf(attendanceId, size) {
  return `${attendanceId}::${size || 'full'}`
}

/**
 * Devuelve un object URL (blob:) para la foto de una marca.
 * @param {string} attendanceId  _id de la asistencia
 * @param {number} [size]        ancho del thumbnail; omitir = original
 * @returns {Promise<string>}    object URL listo para usar como src
 */
export async function fetchAttendancePhotoUrl(attendanceId, size) {
  if (!attendanceId) return ''
  const k = keyOf(attendanceId, size)

  const hit = cache.get(k)
  if (hit?.url) return hit.url
  if (hit?.promise) return hit.promise

  const promise = (async () => {
    const res = await secureAxios.get(
      `/attendance/photo/${encodeURIComponent(String(attendanceId))}/photo`,
      {
        params: size ? { size } : {},
        responseType: 'blob',
      }
    )
    const url = URL.createObjectURL(res.data)
    cache.set(k, { url })
    return url
  })()

  cache.set(k, { promise })
  try {
    return await promise
  } catch (err) {
    cache.delete(k) // permite reintentar luego
    throw err
  }
}

/** Libera todos los object URLs creados (llamar al desmontar vistas grandes). */
export function revokeAllAttendancePhotos() {
  for (const v of cache.values()) {
    if (v?.url) URL.revokeObjectURL(v.url)
  }
  cache.clear()
}
