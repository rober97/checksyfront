import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import {
  canAccess,
  hasAllPermissions,
  hasAnyPermission,
  normalizeRole,
  normalizePermissions,
} from '@/utils/permissions'

export function useAccess() {
  const auth = useAuthStore()

  const role = computed(() => auth.user?.role ?? null)
  const permissions = computed(() => normalizePermissions(auth.user?.permissions))

  const hasRole = (r) => {
    const arr = (Array.isArray(r) ? r : [r]).map(normalizeRole)
    return !!role.value && arr.includes(normalizeRole(role.value))
  }
  const hasAnyPerm = (perms = []) => {
    return hasAnyPermission(permissions.value, perms)
  }
  const hasAllPerms = (perms = []) => {
    return hasAllPermissions(permissions.value, perms)
  }

  const can = (opts) => {
    return canAccess(
      { role: role.value, permissions: permissions.value },
      opts
    )
  }

  return { role, permissions, hasRole, hasAnyPerm, hasAllPerms, can }
}
