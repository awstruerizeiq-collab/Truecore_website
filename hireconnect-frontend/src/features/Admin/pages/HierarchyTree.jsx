import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();
const LOCAL_HIERARCHY_KEY = "hireconnect_local_hierarchy_tree";

const loadLocalHierarchy = () => {
  try {
    const raw = localStorage.getItem(LOCAL_HIERARCHY_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveLocalHierarchy = (tree) => {
  try {
    if (!tree) {
      localStorage.removeItem(LOCAL_HIERARCHY_KEY);
      return;
    }
    localStorage.setItem(LOCAL_HIERARCHY_KEY, JSON.stringify(tree));
  } catch {
    // Ignore local storage failures
  }
};

const parseBody = (body) => {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
};

const cloneTree = (tree) => (tree ? JSON.parse(JSON.stringify(tree)) : null);

const findNodeById = (tree, id) => {
  if (!tree) return null;
  if (String(tree.id) === String(id)) return tree;
  for (const child of tree.children || []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
};

const removeNodeById = (tree, id) => {
  if (!tree || !Array.isArray(tree.children)) return false;
  const index = tree.children.findIndex((c) => String(c.id) === String(id));
  if (index >= 0) {
    tree.children.splice(index, 1);
    return true;
  }
  return tree.children.some((c) => removeNodeById(c, id));
};

const removeProjectById = (tree, projectId) => {
  if (!tree) return false;
  if (Array.isArray(tree.projects)) {
    const idx = tree.projects.findIndex((p) => String(p.id) === String(projectId));
    if (idx >= 0) {
      tree.projects.splice(idx, 1);
      return true;
    }
  }
  return (tree.children || []).some((c) => removeProjectById(c, projectId));
};

const localHierarchyFetch = (path, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  const body = parseBody(options.body);
  const tree = cloneTree(loadLocalHierarchy());

  if (path === "/api/hierarchy/root" && method === "GET") {
    if (!tree) return { ok: false, status: 404, payload: { message: "Hierarchy not found" } };
    return { ok: true, status: 200, payload: { success: true, data: tree } };
  }

  if (path === "/api/hierarchy/root" && method === "POST") {
    const newRoot = {
      id: body.id ?? Date.now(),
      name: body.name || "CEO",
      role: body.role || "CEO",
      designation: body.designation || "Chief Executive Officer",
      photo: body.photo || "",
      projects: Array.isArray(body.projects) ? body.projects : [],
      children: Array.isArray(body.children) ? body.children : [],
    };
    saveLocalHierarchy(newRoot);
    return { ok: true, status: 200, payload: { success: true, data: newRoot } };
  }

  const addChildMatch = path.match(/^\/api\/hierarchy\/([^/]+)\/children$/);
  if (addChildMatch && method === "POST") {
    if (!tree) return { ok: false, status: 404, payload: { message: "Hierarchy not found" } };
    const parent = findNodeById(tree, addChildMatch[1]);
    if (!parent) return { ok: false, status: 404, payload: { message: "Parent node not found" } };
    const child = {
      id: body.id ?? Date.now(),
      name: body.name || "Employee",
      role: body.role || "Team Member",
      designation: body.designation || "",
      photo: body.photo || "",
      projects: Array.isArray(body.projects) ? body.projects : [],
      children: Array.isArray(body.children) ? body.children : [],
    };
    parent.children = Array.isArray(parent.children) ? parent.children : [];
    parent.children.push(child);
    saveLocalHierarchy(tree);
    return { ok: true, status: 200, payload: { success: true, data: child } };
  }

  const addProjectMatch = path.match(/^\/api\/hierarchy\/([^/]+)\/projects$/);
  if (addProjectMatch && method === "POST") {
    if (!tree) return { ok: false, status: 404, payload: { message: "Hierarchy not found" } };
    const node = findNodeById(tree, addProjectMatch[1]);
    if (!node) return { ok: false, status: 404, payload: { message: "Node not found" } };
    node.projects = Array.isArray(node.projects) ? node.projects : [];
    const project = {
      id: Date.now(),
      name: body.name || "Project",
      status: body.status || "Planning",
      due: body.due || "TBD",
    };
    node.projects.push(project);
    saveLocalHierarchy(tree);
    return { ok: true, status: 200, payload: { success: true, data: project } };
  }

  const deleteProjectMatch = path.match(/^\/api\/hierarchy\/projects\/([^/]+)$/);
  if (deleteProjectMatch && method === "DELETE") {
    if (!tree) return { ok: false, status: 404, payload: { message: "Hierarchy not found" } };
    const removed = removeProjectById(tree, deleteProjectMatch[1]);
    if (!removed) return { ok: false, status: 404, payload: { message: "Project not found" } };
    saveLocalHierarchy(tree);
    return { ok: true, status: 200, payload: { success: true } };
  }

  const nodeMatch = path.match(/^\/api\/hierarchy\/([^/]+)$/);
  if (nodeMatch && method === "PUT") {
    if (!tree) return { ok: false, status: 404, payload: { message: "Hierarchy not found" } };
    const node = findNodeById(tree, nodeMatch[1]);
    if (!node) return { ok: false, status: 404, payload: { message: "Node not found" } };
    Object.assign(node, body || {});
    saveLocalHierarchy(tree);
    return { ok: true, status: 200, payload: { success: true, data: node } };
  }

  if (nodeMatch && method === "DELETE") {
    if (!tree) return { ok: false, status: 404, payload: { message: "Hierarchy not found" } };
    if (String(tree.id) === String(nodeMatch[1])) {
      return { ok: false, status: 400, payload: { message: "Cannot delete the CEO" } };
    }
    const removed = removeNodeById(tree, nodeMatch[1]);
    if (!removed) return { ok: false, status: 404, payload: { message: "Node not found" } };
    saveLocalHierarchy(tree);
    return { ok: true, status: 200, payload: { success: true } };
  }

  return { ok: false, status: 400, payload: { message: "Unsupported hierarchy action" } };
};

const buildApiUrl = (path) => {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL.replace(/\/+$/, "")}${path}`;
};

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  const authHeader = token
    ? token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`
    : null;
  const headers = {
    "Content-Type": "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(buildApiUrl(path), { ...options, headers });
    let payload = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (path.startsWith("/api/hierarchy") && (!res.ok || res.status >= 500 || res.status === 404)) {
      return localHierarchyFetch(path, options);
    }

    return { ok: res.ok, status: res.status, payload };
  } catch {
    if (path.startsWith("/api/hierarchy")) {
      return localHierarchyFetch(path, options);
    }
    return { ok: false, status: 500, payload: { message: "Internal server error" } };
  }
};

const ROLE_CHILD = {
  CEO: "Manager",
  Manager: "Team Lead",
  "Team Lead": "Team Member",
};

const MANAGER_ROLES = [
  "HR Manager",
  "Finance Manager",
  "Project Manager",
  "IT Manager",
  "Operations Manager",
  "Admin Manager",
  "Sales/BDM Manager",
];

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${second}`.toUpperCase();
};

const canAddChild = (role, designation) => {
  if (role === "Manager") {
    return Boolean(designation);
  }
  return Boolean(ROLE_CHILD[role]);
};

const TreeNode = ({
  node,
  onAdd,
  managerRoles,
  addForm,
  onChangeAddForm,
  onSubmitAddForm,
  onCancelAddForm,
  onEdit,
  onDelete,
  onToggleProjects,
  onStartAddProject,
  onUpdateProjectDraft,
  onSaveProject,
  onDeleteProject,
  onUpdatePhoto,
  expandedProjects,
  addingProjects,
  projectDrafts,
  level = 0,
}) => {
  const hasChildren = node.children.length > 0;
  const allowAdd = canAddChild(node.role, node.designation);
  const isTeamLead = node.role === "Team Lead";
  const showProjects = Boolean(expandedProjects?.[node.id]);
  const isAddingProject = Boolean(addingProjects?.[node.id]);
  const projectDraft = projectDrafts?.[node.id] || { name: "", status: "", due: "" };
  const showManagerAddForm = node.role === "CEO" && addForm?.parentId === node.id;
  const hideManagerRoleBadge =
    node.role === "Manager" && node.designation && node.designation !== "Project Manager";
  const addLabel =
    node.role === "Manager" && node.designation !== "Project Manager"
      ? "Team Member"
      : ROLE_CHILD[node.role];

  return (
    <div className="flex flex-col items-center relative">
      {level > 0 && (
        <div className="w-px h-24 bg-gray-300 absolute top-[-28px] left-1/2 transform -translate-x-1/2"></div>
      )}

      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-md p-6 w-56 text-center hover:shadow-lg transition-all duration-200 hover:border-gray-300">
        <div className="relative mb-4">
          {!node.photo ? (
            <div
              className="w-20 h-20 rounded-full mx-auto border-2 border-dashed border-gray-400 bg-gray-100 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all shadow-sm hover:shadow-md"
              onClick={() => onUpdatePhoto(node.id)}
              title="Click to add photo"
            >
              <span className="text-2xl font-semibold">
                {getInitials(node.name)}
              </span>
              <span className="text-[9px] mt-1 uppercase tracking-wide">
                Upload
              </span>
            </div>
          ) : (
            <img
              src={node.photo}
              alt={node.name}
              className="w-20 h-20 rounded-full mx-auto border-2 border-gray-300 object-cover hover:opacity-90 transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-105"
              onClick={() => onUpdatePhoto(node.id)}
              title="Click to update photo"
            />
          )}
        </div>

        <h3 className="font-bold text-lg text-gray-800 mb-1">{node.name}</h3>
        {!hideManagerRoleBadge && (
          <p className="text-xs text-gray-600 font-medium">{node.role}</p>
        )}
        {node.designation && (
          <p className="text-sm text-gray-700 font-bold mb-4">{node.designation}</p>
        )}

        <div className="flex gap-2 justify-center flex-wrap mt-4">
          {allowAdd && (
            <button
              onClick={() => onAdd(node.id)}
              className="w-11 h-11 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg border-2 border-green-200 flex items-center justify-center text-xl font-semibold shadow-sm hover:shadow-md transition-all"
              title={`Add ${addLabel}`}
            >
              ➕
            </button>
          )}
          <button
            onClick={() => onEdit(node.id)}
            className="w-11 h-11 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg border-2 border-blue-200 flex items-center justify-center text-xl font-semibold shadow-sm hover:shadow-md transition-all"
            title="Edit"
          >
            ✏️
          </button>
          {isTeamLead && (
            <button
              onClick={() => onToggleProjects(node.id)}
              className="w-11 h-11 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg border-2 border-amber-200 flex items-center justify-center text-xl font-semibold shadow-sm hover:shadow-md transition-all"
              title="View projects"
            >
              📋
            </button>
          )}
          {node.role !== "CEO" && (
            <button
              onClick={() => onDelete(node.id)}
              className="w-11 h-11 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg border-2 border-red-200 flex items-center justify-center text-xl font-semibold shadow-sm hover:shadow-md transition-all"
              title="Delete"
            >
              🗑️
            </button>
          )}
        </div>

        {showManagerAddForm && (
          <div className="mt-4 text-left bg-blue-50 rounded-lg border border-blue-200 p-3 space-y-2">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Add Manager
            </div>
            <input
              type="text"
              placeholder="Manager name"
              value={addForm.name}
              onChange={(e) => onChangeAddForm("name", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700"
            />
            <select
              value={addForm.managerRole}
              onChange={(e) => onChangeAddForm("managerRole", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 bg-white"
            >
              <option value="">Select manager role</option>
              {managerRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={onSubmitAddForm}
                className="flex-1 rounded-md border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 text-sm font-semibold py-1.5"
              >
                Save
              </button>
              <button
                onClick={onCancelAddForm}
                className="flex-1 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-sm font-semibold py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isTeamLead && showProjects && (
          <div className="mt-4 text-left bg-amber-50 rounded-lg border border-amber-200 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Projects
              </div>
              <button
                onClick={() => onStartAddProject(node.id)}
                className="w-7 h-7 rounded-full border border-amber-300 text-amber-700 bg-white hover:bg-amber-100 text-sm font-semibold"
                title="Add project"
              >
                +
              </button>
            </div>
            {isAddingProject && (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  placeholder="Project name"
                  value={projectDraft.name}
                  onChange={(e) =>
                    onUpdateProjectDraft(node.id, "name", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700"
                />
                <input
                  type="text"
                  placeholder="Status (e.g., In Progress)"
                  value={projectDraft.status}
                  onChange={(e) =>
                    onUpdateProjectDraft(node.id, "status", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700"
                />
                <input
                  type="text"
                  placeholder="Due date (e.g., Apr 12)"
                  value={projectDraft.due}
                  onChange={(e) =>
                    onUpdateProjectDraft(node.id, "due", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700"
                />
                <button
                  onClick={() => onSaveProject(node.id)}
                  className="w-full rounded-md border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 text-xs font-semibold py-1.5"
                >
                  Save
                </button>
              </div>
            )}
            {node.projects && node.projects.length > 0 ? (
              <div className="mt-2 space-y-2">
                {node.projects.map((project) => (
                  <div
                    key={project.id}
                    className="text-xs text-gray-700 border border-gray-200 rounded-md p-2 bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {project.name}
                        </div>
                        <div className="text-gray-500">{project.status}</div>
                        <div className="text-gray-500">Due: {project.due}</div>
                      </div>
                      <button
                        onClick={() => onDeleteProject(node.id, project.id)}
                        className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                        title="Delete project"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-500">No projects yet.</div>
            )}
          </div>
        )}
      </div>

      {hasChildren && (
        <div className="mt-6 mb-4 relative w-full">
          <div className="h-px bg-gray-300 absolute inset-x-0 top-1/2"></div>
          <div className="w-px h-6 bg-gray-300 absolute left-1/2 top-[-12px] transform -translate-x-1/2"></div>
        </div>
      )}

      {hasChildren && (
        <div className="flex gap-12 mt-8">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onAdd={onAdd}
              managerRoles={managerRoles}
              addForm={addForm}
              onChangeAddForm={onChangeAddForm}
              onSubmitAddForm={onSubmitAddForm}
              onCancelAddForm={onCancelAddForm}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleProjects={onToggleProjects}
              expandedProjects={expandedProjects}
              onStartAddProject={onStartAddProject}
              onUpdateProjectDraft={onUpdateProjectDraft}
              onSaveProject={onSaveProject}
              onDeleteProject={onDeleteProject}
              onUpdatePhoto={onUpdatePhoto}
              addingProjects={addingProjects}
              projectDrafts={projectDrafts}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const HierarchyTree = ({ initialData = null }) => {
  const [tree, setTree] = useState(initialData);
  const idRef = useRef(1000);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [addingProjects, setAddingProjects] = useState({});
  const [projectDrafts, setProjectDrafts] = useState({});
  const [addForm, setAddForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const refreshTree = async () => {
    if (initialData) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await apiFetch("/api/hierarchy/root");
      if (result.ok) {
        const data = result.payload?.data ?? result.payload;
        setTree(data || null);
      } else if (result.status === 404) {
        setTree(null);
      } else {
        throw new Error(result.payload?.message || "Failed to load hierarchy");
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to load hierarchy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addChildNode = async (parentId, newNode) => {
    const result = await apiFetch(`/api/hierarchy/${parentId}/children`, {
      method: "POST",
      body: JSON.stringify(newNode),
    });

    if (!result.ok) {
      throw new Error(result.payload?.message || "Failed to add node");
    }
  };

  const addNode = async (parentId) => {
    if (!tree) return;
    let nextRole = null;
    let targetId = null;
    const findRole = (node) => {
      if (node.id === parentId) {
        nextRole = ROLE_CHILD[node.role];
        targetId = node.id;
        return;
      }
      node.children.forEach(findRole);
    };
    findRole(tree);

    if (!nextRole || targetId == null) return;

    if (nextRole === "Manager") {
      setAddForm({
        parentId,
        name: "",
        managerRole: "",
      });
      return;
    }

    let targetRole = nextRole;
    let namePrompt = `Enter ${nextRole} name:`;
    let designationPrompt = null;

    if (nextRole === "Team Lead" || nextRole === "Team Member") {
      const targetNode = (() => {
        let found = null;
        const walk = (node) => {
          if (node.id === parentId) {
            found = node;
            return;
          }
          node.children.forEach(walk);
        };
        walk(tree);
        return found;
      })();

      if (targetNode?.role === "Manager" && targetNode.designation !== "Project Manager") {
        targetRole = "Team Member";
        namePrompt = "Enter Team Member name:";
        designationPrompt = "Enter designation:";
      } else if (nextRole === "Team Member") {
        namePrompt = "Enter Team Member name:";
        designationPrompt = "Enter designation:";
      }
    }

    const name = prompt(namePrompt);
    if (!name) return;

    let designation = "";
    if (designationPrompt) {
      const designationInput = prompt(designationPrompt);
      if (!designationInput) return;
      designation = designationInput;
    }

    const newNode = {
      id: idRef.current++,
      name,
      role: targetRole,
      designation,
      photo: "",
      children: [],
    };

    try {
      await addChildNode(parentId, newNode);
      await refreshTree();
    } catch (err) {
      alert(err.message || "Failed to add node");
    }
  };

  const updateAddForm = (field, value) => {
    setAddForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const submitAddForm = async () => {
    if (!addForm) return;
    const name = addForm.name.trim();
    const managerRole = addForm.managerRole;
    if (!name || !managerRole) {
      alert("Please enter a manager name and select a role.");
      return;
    }

    const newNode = {
      id: idRef.current++,
      name,
      role: "Manager",
      designation: managerRole,
      photo: "",
      children: [],
    };

    try {
      await addChildNode(addForm.parentId, newNode);
      setAddForm(null);
      await refreshTree();
    } catch (err) {
      alert(err.message || "Failed to add manager");
    }
  };

  const cancelAddForm = () => {
    setAddForm(null);
  };

  const toggleProjects = (nodeId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const startAddProject = (nodeId) => {
    setAddingProjects((prev) => ({ ...prev, [nodeId]: true }));
    setProjectDrafts((prev) => ({
      ...prev,
      [nodeId]: prev[nodeId] || { name: "", status: "", due: "" },
    }));
  };

  const updateProjectDraft = (nodeId, field, value) => {
    setProjectDrafts((prev) => ({
      ...prev,
      [nodeId]: { ...(prev[nodeId] || { name: "", status: "", due: "" }), [field]: value },
    }));
  };

  const saveProject = async (nodeId) => {
    const draft = projectDrafts[nodeId] || {};
    const name = (draft.name || "").trim();
    if (!name) {
      alert("Please enter a project name.");
      return;
    }

    try {
      const result = await apiFetch(`/api/hierarchy/${nodeId}/projects`, {
        method: "POST",
        body: JSON.stringify({
          name,
          status: draft.status?.trim() || "Planning",
          due: draft.due?.trim() || "TBD",
        }),
      });

      if (!result.ok) {
        throw new Error(result.payload?.message || "Failed to add project");
      }

      setAddingProjects((prev) => ({ ...prev, [nodeId]: false }));
      setProjectDrafts((prev) => ({ ...prev, [nodeId]: { name: "", status: "", due: "" } }));
      await refreshTree();
    } catch (err) {
      alert(err.message || "Failed to add project");
    }
  };

  const deleteProject = async (nodeId, projectId) => {
    try {
      const result = await apiFetch(`/api/hierarchy/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!result.ok) {
        throw new Error(result.payload?.message || "Failed to delete project");
      }
      await refreshTree();
    } catch (err) {
      alert(err.message || "Failed to delete project");
    }
  };

  const updatePhoto = useCallback((nodeId) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/") || file.size > 5_000_000) {
        alert("Please select an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        try {
          const result = await apiFetch(`/api/hierarchy/${nodeId}`, {
            method: "PUT",
            body: JSON.stringify({ photo: dataUrl }),
          });
          if (!result.ok) {
            throw new Error(result.payload?.message || "Failed to upload photo");
          }
          await refreshTree();
        } catch (err) {
          alert(err.message || "Failed to upload photo");
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, []);

  const editNode = async (nodeId) => {
    if (!tree) return;
    let currentNode = null;
    const findNode = (node) => {
      if (node.id === nodeId) {
        currentNode = node;
        return;
      }
      node.children.forEach(findNode);
    };
    findNode(tree);
    if (!currentNode) return;

    const name = prompt("Edit name:", currentNode.name);
    const nextName = name || currentNode.name;

    let nextDesignation = currentNode.designation;
    if (currentNode.role === "Team Member") {
      const designation = prompt(
        "Edit designation:",
        currentNode.designation || ""
      );
      if (designation != null && designation !== "") {
        nextDesignation = designation;
      }
    }

    try {
      const result = await apiFetch(`/api/hierarchy/${nodeId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: nextName,
          designation:
            currentNode.role === "Team Member" ? nextDesignation : undefined,
        }),
      });
      if (!result.ok) {
        throw new Error(result.payload?.message || "Failed to update node");
      }
      await refreshTree();
    } catch (err) {
      alert(err.message || "Failed to update node");
    }
  };

  const deleteNode = async (nodeId) => {
    if (!tree) return;
    if (tree.id === nodeId) {
      alert("Cannot delete the CEO");
      return;
    }

    try {
      const result = await apiFetch(`/api/hierarchy/${nodeId}`, {
        method: "DELETE",
      });
      if (!result.ok) {
        throw new Error(result.payload?.message || "Failed to delete node");
      }
      await refreshTree();
    } catch (err) {
      alert(err.message || "Failed to delete node");
    }
  };

  const roleCounts = useMemo(() => {
    if (!tree) {
      return { CEO: 0, Manager: 0, "Team Lead": 0, "Team Member": 0 };
    }
    const counts = { CEO: 0, Manager: 0, "Team Lead": 0, "Team Member": 0 };
    const walk = (node) => {
      counts[node.role] = (counts[node.role] || 0) + 1;
      node.children.forEach(walk);
    };
    walk(tree);
    return counts;
  }, [tree]);

  const startHierarchy = async () => {
    const name = prompt("Enter CEO name:");
    if (!name) return;
    const designation = prompt("Enter CEO designation:") || "Chief Executive Officer";

    try {
      const result = await apiFetch("/api/hierarchy/root", {
        method: "POST",
        body: JSON.stringify({
          name,
          role: "CEO",
          designation,
          photo: "",
        }),
      });
      if (!result.ok) {
        throw new Error(result.payload?.message || "Failed to create hierarchy");
      }
      await refreshTree();
    } catch (err) {
      alert(err.message || "Failed to create hierarchy");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Company Hierarchy
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            CEO → Managers → Team Leads → Team Members
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs text-gray-500">
            <span>CEO: {roleCounts.CEO}</span>
            <span>Managers: {roleCounts.Manager}</span>
            <span>Team Leads: {roleCounts["Team Lead"]}</span>
            <span>Team Members: {roleCounts["Team Member"]}</span>
          </div>
          {loading && (
            <div className="mt-3 text-xs text-gray-500">Loading hierarchy...</div>
          )}
          {errorMessage && (
            <div className="mt-3 text-xs text-red-600">{errorMessage}</div>
          )}
        </div>

        {!tree ? (
          <div className="flex justify-center py-16">
            <button
              onClick={startHierarchy}
              className="px-6 py-3 rounded-full border-2 border-blue-500 bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors shadow-md hover:shadow-lg"
            >
              Start Hierarchy
            </button>
          </div>
        ) : (
          <div className="flex justify-center overflow-x-auto pb-8 px-6">
            <TreeNode
              node={tree}
              onAdd={addNode}
              managerRoles={MANAGER_ROLES}
              addForm={addForm}
              onChangeAddForm={updateAddForm}
              onSubmitAddForm={submitAddForm}
              onCancelAddForm={cancelAddForm}
              onEdit={editNode}
              onDelete={deleteNode}
              onToggleProjects={toggleProjects}
              expandedProjects={expandedProjects}
              onStartAddProject={startAddProject}
              onUpdateProjectDraft={updateProjectDraft}
              onSaveProject={saveProject}
              onDeleteProject={deleteProject}
              onUpdatePhoto={updatePhoto}
              addingProjects={addingProjects}
              projectDrafts={projectDrafts}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HierarchyTree;