const VALID_PERMISSION_STATES = new Set(["allow", "deny", "inherit"]);

export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export function normalizePermission(permission) {
  return String(permission || "").trim().toLowerCase();
}

export function normalizePermissions(input) {
  const values = Array.isArray(input) ? input : input ? [input] : [];
  return [...new Set(values.map(normalizePermission).filter(Boolean))];
}

export function permissionMatches(grantedPermission, requiredPermission) {
  const granted = normalizePermission(grantedPermission);
  const required = normalizePermission(requiredPermission);

  if (!granted || !required) return false;
  if (granted === "*" || granted === required) return true;

  if (granted.endsWith(":*")) {
    return required.startsWith(granted.slice(0, -1));
  }

  if (required.endsWith(":*")) {
    return granted.startsWith(required.slice(0, -1));
  }

  return false;
}

export function hasPermission(grantedPermissions, requiredPermission) {
  return normalizePermissions(grantedPermissions).some((granted) =>
    permissionMatches(granted, requiredPermission)
  );
}

export function hasAnyPermission(grantedPermissions, requiredPermissions = []) {
  const required = normalizePermissions(requiredPermissions);
  if (!required.length) return true;
  return required.some((permission) =>
    hasPermission(grantedPermissions, permission)
  );
}

export function hasAllPermissions(grantedPermissions, requiredPermissions = []) {
  const required = normalizePermissions(requiredPermissions);
  if (!required.length) return true;
  return required.every((permission) =>
    hasPermission(grantedPermissions, permission)
  );
}

export function canAccess({ role, permissions } = {}, access = {}) {
  if (!access) return true;

  const requiredRoles = Array.isArray(access.roles)
    ? access.roles.map(normalizeRole).filter(Boolean)
    : [];
  const requiredPermissions = Array.isArray(access.permissions)
    ? access.permissions
    : [];
  const requiredAny = Array.isArray(access.any) ? access.any : [];
  const requiredAll = Array.isArray(access.all) ? access.all : [];
  const mode =
    access.permMode === "any" || access.mode === "any" ? "any" : "all";

  const okRole =
    !requiredRoles.length || requiredRoles.includes(normalizeRole(role));
  if (!okRole) return false;

  const okDeclaredPermissions = requiredPermissions.length
    ? mode === "any"
      ? hasAnyPermission(permissions, requiredPermissions)
      : hasAllPermissions(permissions, requiredPermissions)
    : true;

  if (!okDeclaredPermissions) return false;
  if (!hasAnyPermission(permissions, requiredAny)) return false;
  if (!hasAllPermissions(permissions, requiredAll)) return false;

  return true;
}

export function normalizePermissionCatalog(catalog = {}) {
  const seen = new Set();
  const items = (catalog.items || [])
    .map((item) => ({
      ...item,
      key: String(item?.key || "").trim(),
      category: String(item?.category || "General").trim() || "General",
      label: String(item?.label || "").trim(),
      description: String(item?.description || "").trim(),
    }))
    .filter((item) => item.key && !seen.has(item.key) && seen.add(item.key));

  const categorySet = new Set(
    (catalog.categories || []).map((category) => String(category || "").trim())
  );
  items.forEach((item) => categorySet.add(item.category));

  return {
    categories: [...categorySet].filter(Boolean),
    items,
  };
}

export function normalizePermissionState(value) {
  return VALID_PERMISSION_STATES.has(value) ? value : "inherit";
}

export function buildPermissionMap(catalog = {}, map = {}) {
  const next = {};

  for (const item of catalog.items || []) {
    next[item.key] = normalizePermissionState(map?.[item.key]);
  }

  for (const key of Object.keys(map || {})) {
    if (!(key in next)) {
      next[key] = normalizePermissionState(map[key]);
    }
  }

  return next;
}

export function countPermissionStates(map = {}) {
  return Object.values(map).reduce(
    (acc, value) => {
      const state = normalizePermissionState(value);
      acc[state] += 1;
      return acc;
    },
    { allow: 0, deny: 0, inherit: 0 }
  );
}
