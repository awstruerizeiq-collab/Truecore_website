import React, { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Pencil, Plus, Shield, Trash2, UserCog } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RoleFormModal from "../components/RoleFormModal.jsx";
import UserFormModal from "../components/UserFormModal.jsx";
import {
  fetchCompanies,
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  deleteUserByTenant,
  fetchCurrentUser,
  fetchRoles,
  fetchUsersByTenant,
  updateRole,
  updateUser,
  updateUserStatus,
  updateUserStatusByTenant,
} from "../services/userRoleService.js";

const TABS = {
  USERS: "users",
  ROLES: "roles",
};

export default function UserRoleManagement() {
  const [activeTab, setActiveTab] = useState(TABS.USERS);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [rolesReadOnly, setRolesReadOnly] = useState(false);

  const can = (perm) => permissions.includes("*") || permissions.includes(perm);
  const selectedCompany = useMemo(
    () => companies.find((company) => String(company.id) === String(selectedCompanyId)) || null,
    [companies, selectedCompanyId]
  );

  const loadAll = async () => {
    setLoading(true);
    try {
      const me = await fetchCurrentUser();
      const companyData = await fetchCompanies();
      const activeCompanies = companyData.filter((company) => company.status !== "suspended");
      const selectedFromState = activeCompanies.find((company) => String(company.id) === String(selectedCompanyId));
      const currentCompany = selectedFromState || activeCompanies[0] || null;
      if (currentCompany && String(currentCompany.id) !== String(selectedCompanyId)) {
        setSelectedCompanyId(String(currentCompany.id));
      }

      const usersData = currentCompany?.tenantCode
        ? await fetchUsersByTenant(currentCompany.tenantCode)
        : [];
      const rolesData = await fetchRoles(usersData);
      const perms = me?.permissions || [];

      setPermissions(perms);
      localStorage.setItem("userPermissions", JSON.stringify(perms));
      setCompanies(activeCompanies);
      setRoles(rolesData);
      setUsers(usersData);
      setRolesReadOnly((rolesData || []).every((r) => r.source === "derived"));
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [selectedCompanyId]);

  const onCreateUser = () => {
    if (!selectedCompany) {
      toast.error("Select a company to manage users");
      return;
    }
    setEditingUser(null);
    setUserModalOpen(true);
  };

  const onEditUser = (user) => {
    setEditingUser(user);
    setUserModalOpen(true);
  };

  const submitUser = async (payload) => {
    setSaving(true);
    try {
      const scopedPayload = {
        ...payload,
        companyId: String(selectedCompany?.id || payload.companyId || ""),
        companyName: selectedCompany?.displayName || payload.companyName || "",
        tenantCode: selectedCompany?.tenantCode || payload.tenantCode || "",
      };
      if (editingUser) {
        await updateUser(editingUser._id, scopedPayload);
        toast.success("User updated");
      } else {
        await createUser(scopedPayload);
        toast.success("User created");
      }
      setUserModalOpen(false);
      setEditingUser(null);
      await loadAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Unable to save user");
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      if (selectedCompany?.tenantCode) {
        await deleteUserByTenant(user._id, selectedCompany.tenantCode);
      } else {
        await deleteUser(user._id);
      }
      toast.success("User deleted");
      await loadAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Unable to delete user");
    }
  };

  const toggleStatus = async (user) => {
    try {
      const nextStatus = user.status === "active" ? "inactive" : "active";
      if (selectedCompany?.tenantCode) {
        await updateUserStatusByTenant(user._id, nextStatus, selectedCompany.tenantCode);
      } else {
        await updateUserStatus(user._id, nextStatus);
      }
      toast.success(`User ${nextStatus === "active" ? "activated" : "deactivated"}`);
      await loadAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Unable to update status");
    }
  };

  const submitRole = async (payload) => {
    setSaving(true);
    try {
      if (editingRole) {
        await updateRole(editingRole._id, payload);
        toast.success("Role updated");
      } else {
        await createRole(payload);
        toast.success("Role created");
      }
      setRoleModalOpen(false);
      setEditingRole(null);
      await loadAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Unable to save role");
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async (id) => {
    if (!window.confirm("Delete this role?")) return;
    try {
      await deleteRole(id);
      toast.success("Role deleted");
      await loadAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Unable to delete role");
    }
  };

  const pageTitle = useMemo(
    () => (activeTab === TABS.USERS ? "User Management" : "Role Management"),
    [activeTab]
  );

  return (
    <div className="px-4 md:px-6 py-6 space-y-4">
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="rounded-2xl bg-white border border-slate-200 p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50">
            <Shield size={14} /> RBAC
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">User & Role Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage users, roles, and permissions from one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <TabButton
            active={activeTab === TABS.USERS}
            onClick={() => setActiveTab(TABS.USERS)}
            label="Users"
          />
          <TabButton
            active={activeTab === TABS.ROLES}
            onClick={() => setActiveTab(TABS.ROLES)}
            label="Roles"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={16} className="text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900">Companies</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {companies.map((company) => {
            const active = String(company.id) === String(selectedCompanyId);
            return (
              <button
                key={company.id}
                type="button"
                onClick={() => setSelectedCompanyId(String(company.id))}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                  active
                    ? "bg-[#0b2ba9] text-white border-[#0b2ba9]"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {company.displayName}
              </button>
            );
          })}
          {companies.length === 0 ? (
            <p className="text-sm text-slate-500">No active companies found</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{pageTitle}</h3>
            {selectedCompany ? (
              <p className="text-xs text-slate-500 mt-1">
                Showing data for <span className="font-semibold">{selectedCompany.displayName}</span>
              </p>
            ) : null}
          </div>
          {activeTab === TABS.USERS && can("create_user") ? (
            <button
              onClick={onCreateUser}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b2ba9] text-white text-sm font-semibold hover:bg-[#0a2491]"
            >
              <Plus size={16} /> Add User
            </button>
          ) : null}
          {activeTab === TABS.ROLES && can("assign_role") && !rolesReadOnly ? (
            <button
              onClick={() => {
                setEditingRole(null);
                setRoleModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b2ba9] text-white text-sm font-semibold hover:bg-[#0a2491]"
            >
              <Plus size={16} /> Add Role
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center text-slate-500">
            <Loader2 className="animate-spin mr-2" size={18} /> Loading...
          </div>
        ) : activeTab === TABS.USERS ? (
          <UsersTable
            users={users}
            can={can}
            onEdit={onEditUser}
            onDelete={removeUser}
            onToggleStatus={toggleStatus}
          />
        ) : (
          <RolesTable
            roles={roles}
            can={can}
            readOnly={rolesReadOnly}
            onEdit={(role) => {
              setEditingRole(role);
              setRoleModalOpen(true);
            }}
            onDelete={removeRole}
          />
        )}
      </div>

      <UserFormModal
        open={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={submitUser}
        roles={roles}
        editingUser={editingUser}
        selectedCompany={selectedCompany}
        loading={saving}
      />

      <RoleFormModal
        open={roleModalOpen}
        onClose={() => {
          setRoleModalOpen(false);
          setEditingRole(null);
        }}
        onSubmit={submitRole}
        editingRole={editingRole}
        loading={saving}
      />
    </div>
  );
}

function UsersTable({ users, can, onEdit, onDelete, onToggleStatus }) {
  if (!can("view_user")) {
    return <NoAccess />;
  }

  return (
    <div className="overflow-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-t border-slate-100">
              <Td>{u.name}</Td>
              <Td>{u.email}</Td>
              <Td>{u.role?.roleName || "-"}</Td>
              <Td>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    u.status === "active"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {u.status}
                </span>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  {can("edit_user") ? (
                    <>
                      <button
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50"
                        onClick={() => onEdit(u)}
                        title="Edit User"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50"
                        onClick={() => onToggleStatus(u)}
                        title={u.status === "active" ? "Deactivate User" : "Activate User"}
                      >
                        <UserCog size={14} />
                      </button>
                    </>
                  ) : null}
                  {can("delete_user") ? (
                    <button
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(u)}
                      title="Delete User"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
              </Td>
            </tr>
          ))}
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-slate-500">
                No users found
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function RolesTable({ roles, can, readOnly, onEdit, onDelete }) {
  if (!can("view_user")) {
    return <NoAccess />;
  }

  return (
    <div className="overflow-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <Th>Role</Th>
            <Th>Permissions</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role._id} className="border-t border-slate-100">
              <Td>{role.roleName}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {(role.permissions || []).map((p) => (
                    <span key={p} className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs border border-blue-200">
                      {p}
                    </span>
                  ))}
                </div>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  {can("assign_role") && !readOnly ? (
                    <button
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50"
                      onClick={() => onEdit(role)}
                      title="Edit Role"
                    >
                      <Pencil size={14} />
                    </button>
                  ) : null}
                  {can("assign_role") && !readOnly ? (
                    <button
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(role._id)}
                      title="Delete Role"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
              </Td>
            </tr>
          ))}
          {roles.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center py-8 text-slate-500">
                No roles found
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {readOnly ? (
        <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
          Role editing is disabled in compatibility mode because `/api/roles` is not available on the current backend.
        </div>
      ) : null}
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
        active
          ? "bg-[#0b2ba9] text-white border-[#0b2ba9]"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function Th({ children }) {
  return <th className="text-left px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }) {
  return <td className="px-4 py-3">{children}</td>;
}

function NoAccess() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 text-sm">
      You do not have permission to view this section.
    </div>
  );
}
