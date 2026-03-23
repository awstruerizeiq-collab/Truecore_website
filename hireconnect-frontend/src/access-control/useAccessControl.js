import { ALL_FEATURE_KEYS } from "./permissions";

const readStoredPermissions = () => {
  const keys = ["featurePermissions", "permissions", "accessControl", "userPermissions"];

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.features)) return parsed.features;
      if (Array.isArray(parsed?.permissions)) return parsed.permissions;
      if (Array.isArray(parsed?.allowedFeatures)) return parsed.allowedFeatures;
    } catch {
      // Ignore malformed stored permissions and fall back to allow-by-default.
    }
  }

  return null;
};

export default function useAccessControl() {
  const storedPermissions = readStoredPermissions();
  const allowAll = !storedPermissions || storedPermissions.length === 0;
  const permissionSet = new Set((storedPermissions || []).map((value) => String(value).trim()).filter(Boolean));

  const canAccessFeature = (featureKey) => {
    if (!featureKey) return true;
    if (allowAll) return true;
    return permissionSet.has(featureKey);
  };

  return {
    canAccessFeature,
    featureKeys: ALL_FEATURE_KEYS,
    allowedFeatures: allowAll ? ALL_FEATURE_KEYS : Array.from(permissionSet),
  };
}
