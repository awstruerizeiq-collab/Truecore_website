import rbacApi from "../../../lib/rbacApi.js";

const ALL_PERMISSIONS = ["create_user", "edit_user", "delete_user", "view_user", "assign_role"];

const permissionMapByRole = {
  GLOBAL_ADMIN: ALL_PERMISSIONS,
  SUPER_ADMIN: ALL_PERMISSIONS,
  COMPANY_ADMIN: ["view_user", "edit_user"],
  ADMIN: ["view_user", "edit_user"],
  TEAM_LEAD: ["view_user"],
  EMPLOYEE: [],
};

const normalizeRoleName = (value) => String(value || "").trim().toUpperCase().replace(/\s+/g, "_");

const derivePermissionsFromRole = (roleValue) => {
  const key = normalizeRoleName(roleValue);
  return permissionMapByRole[key] || [];
};

const unwrapData = (res) => res?.data?.data ?? res?.data ?? null;

const normalizeUser = (u) => {
  const roleName = normalizeRoleName(u?.role?.roleName || u?.role || "EMPLOYEE");
  const statusValue = String(u?.status || "inactive").trim().toLowerCase();
  return {
    ...u,
    _id: String(u?._id ?? u?.id ?? ""),
    name: u?.name || u?.fullName || "",
    email: u?.email || "",
    role: {
      _id: u?.role?._id ? String(u.role._id) : roleName,
      roleName,
      permissions: u?.role?.permissions || derivePermissionsFromRole(roleName),
    },
    status: statusValue === "active" ? "active" : statusValue === "inactive" ? "inactive" : "inactive",
    tenantCode: u?.tenantCode || "",
    companyId: u?.companyId != null ? String(u.companyId) : "",
    companyName: u?.companyName || "",
  };
};

const normalizeCompany = (company) => ({
  id: String(company?.id ?? ""),
  displayName: company?.displayName || company?.legalName || `Company ${company?.id ?? ""}`,
  legalName: company?.legalName || "",
  tenantCode: company?.tenantCode || "",
  status: String(company?.status || "").toLowerCase(),
});

const deriveRolesFromUsers = (users) => {
  const bucket = new Map();
  (users || []).forEach((user) => {
    const roleName = normalizeRoleName(user?.role?.roleName || user?.role || "EMPLOYEE");
    if (!bucket.has(roleName)) {
      bucket.set(roleName, {
        _id: roleName,
        roleName,
        permissions: derivePermissionsFromRole(roleName),
        source: "derived",
      });
    }
  });
  return Array.from(bucket.values());
};

export const fetchCurrentUser = async () => {
  try {
    const res = await rbacApi.get("/api/auth/me");
    const data = unwrapData(res) || {};
    const roleValue = data?.role?.roleName || data?.role || localStorage.getItem("userRole");
    const permissions =
      Array.isArray(data?.permissions) && data.permissions.length > 0
        ? data.permissions
        : derivePermissionsFromRole(roleValue);
    return {
      ...data,
      role: normalizeRoleName(roleValue),
      permissions,
    };
  } catch {
    const storedRole = localStorage.getItem("userRole") || localStorage.getItem("role") || "EMPLOYEE";
    return {
      role: normalizeRoleName(storedRole),
      permissions: derivePermissionsFromRole(storedRole),
    };
  }
};

export const fetchUsers = async () => {
  const res = await rbacApi.get("/api/users");
  const raw = unwrapData(res);
  const list = Array.isArray(raw) ? raw : [];
  return list.map(normalizeUser);
};

export const fetchCompanies = async () => {
  const res = await rbacApi.get("/api/global-admin/companies");
  const raw = unwrapData(res);
  const list = Array.isArray(raw) ? raw : [];
  return list.map(normalizeCompany);
};

export const fetchUsersByTenant = async (tenantCode) => {
  if (!tenantCode) return [];
  try {
    const res = await rbacApi.get("/api/users/tenant", {
      headers: {
        "X-Tenant-Code": tenantCode,
      },
    });
    const raw = unwrapData(res);
    const list = Array.isArray(raw) ? raw : [];
    return list.map(normalizeUser);
  } catch {
    const allUsers = await fetchUsers();
    return allUsers.filter((user) => String(user.tenantCode || "").trim() === String(tenantCode).trim());
  }
};

export const createUser = async (payload) => {
  const roleValue = normalizeRoleName(payload.role);
  const normalizedPayload = {
    ...payload,
    role: roleValue,
    status: String(payload.status || "active").toUpperCase(),
  };
  const res = await rbacApi.post("/api/users", normalizedPayload);
  const data = unwrapData(res);
  return data ? normalizeUser(data) : data;
};

export const updateUser = async (id, payload) => {
  const roleValue = normalizeRoleName(payload.role);
  const normalizedPayload = {
    ...payload,
    role: roleValue,
    status: String(payload.status || "active").toUpperCase(),
  };
  const requestConfig = payload?.tenantCode
    ? { headers: { "X-Tenant-Code": payload.tenantCode } }
    : undefined;
  const path = payload?.tenantCode ? `/api/users/tenant/${id}` : `/api/users/${id}`;
  const res = await rbacApi.put(path, normalizedPayload, requestConfig);
  const data = unwrapData(res);
  return data ? normalizeUser(data) : data;
};

export const deleteUser = async (id) => {
  const res = await rbacApi.delete(`/api/users/${id}`);
  return unwrapData(res);
};

export const deleteUserByTenant = async (id, tenantCode) => {
  const res = await rbacApi.delete(`/api/users/tenant/${id}`, {
    headers: {
      "X-Tenant-Code": tenantCode,
    },
  });
  return unwrapData(res);
};

export const updateUserStatus = async (id, status) => {
  try {
    const res = await rbacApi.patch(`/api/users/${id}/status`, { status });
    const data = unwrapData(res);
    return data ? normalizeUser(data) : data;
  } catch {
    const res = await rbacApi.put(`/api/users/${id}`, { status: String(status).toUpperCase() });
    const data = unwrapData(res);
    return data ? normalizeUser(data) : data;
  }
};

export const updateUserStatusByTenant = async (id, status, tenantCode) => {
  const res = await rbacApi.put(
    `/api/users/tenant/${id}`,
    { status: String(status).toUpperCase() },
    {
      headers: {
        "X-Tenant-Code": tenantCode,
      },
    }
  );
  const data = unwrapData(res);
  return data ? normalizeUser(data) : data;
};

export const fetchRoles = async (usersSeed = null) => {
  try {
    const res = await rbacApi.get("/api/roles");
    const raw = unwrapData(res);
    const list = Array.isArray(raw) ? raw : [];
    return list.map((r) => ({
      _id: String(r._id || r.id || r.roleName),
      roleName: normalizeRoleName(r.roleName),
      permissions: Array.isArray(r.permissions) ? r.permissions : derivePermissionsFromRole(r.roleName),
      source: "api",
    }));
  } catch {
    const users = Array.isArray(usersSeed) ? usersSeed : await fetchUsers();
    return deriveRolesFromUsers(users);
  }
};

export const createRole = async (payload) => {
  const res = await rbacApi.post("/api/roles", payload);
  return unwrapData(res);
};

export const updateRole = async (id, payload) => {
  const res = await rbacApi.put(`/api/roles/${id}`, payload);
  return unwrapData(res);
};

export const deleteRole = async (id) => {
  const res = await rbacApi.delete(`/api/roles/${id}`);
  return unwrapData(res);
};

