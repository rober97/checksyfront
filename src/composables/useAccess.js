import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'

export function useAccess() {
  const auth = useAuthStore()

  const role = computed(() => auth.user?.role ?? null)
  const permissions = computed(() => auth.user?.permissions ?? [])

  const hasRole = (r) => {
    const arr = Array.isArray(r) ? r : [r]
    return !!role.value && arr.includes(role.value)
  }
  const hasAnyPerm = (perms = []) => {
    if (!perms.length) return true
    return perms.some(p => permissions.value.includes(p))
  }
  const hasAllPerms = (perms = []) => {
    if (!perms.length) return true
    return perms.every(p => permissions.value.includes(p))
  }

  const can = (opts) => {
    if (!opts) return true
    const okRole = !opts.roles?.length || hasRole(opts.roles)
    const okAny  = !opts.any?.length   || hasAnyPerm(opts.any)
    const okAll  = !opts.all?.length   || hasAllPerms(opts.all)
    return okRole && okAny && okAll
  }

  return { role, permissions, hasRole, hasAnyPerm, hasAllPerms, can }
}
