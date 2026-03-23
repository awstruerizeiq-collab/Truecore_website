import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  IndianRupee,
  Calendar,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  BarChart3,
  Laptop,
  Users2, // New icon for hierarchy
} from "lucide-react";
import {
  getAllowedSidebarItems,
  resolveAccessContext,
} from "../../../lib/planAccessConfig.js";

/* ICON MAP */
const iconMap = {
  grid: LayoutGrid,
  users: Users,
  rupee: IndianRupee,
  calendar: Calendar,
  file: FileText,
  help: HelpCircle,
  bell: Bell,
  performance: BarChart3,
  laptop: Laptop,
  hierarchy: Users2,
};

/* MENU ITEMS */
const MENU_ITEMS = [
  { id: "home", label: "Manager Home", icon: "grid", path: "/admin", exact: true, routeKey: "dashboard" },
  { id: "hierarchy", label: "Company Hierarchy", icon: "hierarchy", path: "/admin/hierarchy", routeKey: "companyHierarchy" },
  { id: "employees", label: "Manage Employees", icon: "users", path: "/admin/employees", routeKey: "manageEmployee" },
  { id: "performance", label: "Performance Dashboard", icon: "performance", path: "/admin/performance", routeKey: "performance" },
  { id: "finance", label: "Finance Hub", icon: "rupee", path: "/admin/finance", routeKey: "financeHub" },
  { id: "attendance", label: "Attendance", icon: "calendar", path: "/admin/attendance", routeKey: "attendance" },
  { id: "documents", label: "Documents", icon: "file", path: "/admin/documents", routeKey: "document" },
  { id: "support", label: "Support", icon: "help", path: "/admin/support", routeKey: "support" },
  { id: "notifications", label: "Notifications", icon: "bell", path: "/admin/notifications", routeKey: "notifications" },
  { id: "policies", label: "Policies", icon: "file", path: "/admin/policies", routeKey: "policies" },
  { id: "assets", label: "Assets", icon: "laptop", path: "/admin/assets", routeKey: "assets" },
];

/* HIERARCHY TREE DATA */
const initialData = {
  id: 1,
  name: "Arjun Kumar",
  designation: "CEO",
  photo: "https://i.pravatar.cc/150?img=1",
  children: [
    {
      id: 2,
      name: "Prem",
      designation: "Engineering Manager",
      photo: "https://i.pravatar.cc/150?img=2",
      children: [
        {
          id: 3,
          name: "You",
          designation: "Software Engineer",
          photo: "https://i.pravatar.cc/150?img=3",
          children: []
        }
      ]
    }
  ]
};

let idCounter = 100;

const TreeNode = ({ node, onAdd, onEdit, onDelete, collapsed }) => {
  return (
    <div className={`flex flex-col items-center relative ${collapsed ? 'scale-75' : ''}`}>
      {/* NODE */}
      <div className="bg-white rounded-xl shadow-md px-3 py-2 w-32 text-center border border-gray-200">
        <img
          src={node.photo}
          alt={node.name}
          className="w-12 h-12 rounded-full mx-auto object-cover border-2 border-blue-500"
        />
        <p className="mt-1 font-semibold text-xs truncate">{node.name}</p>
        <p className="text-xs text-gray-500 truncate">{node.designation}</p>

        {!collapsed && (
          <div className="flex justify-center gap-1 mt-1">
            <button
              onClick={() => onAdd(node.id)}
              className="text-green-600 hover:text-green-800 text-xs p-0.5"
              title="Add Subordinate"
            >
              ➕
            </button>
            <button
              onClick={() => onEdit(node.id)}
              className="text-blue-600 hover:text-blue-800 text-xs p-0.5"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(node.id)}
              className="text-red-600 hover:text-red-800 text-xs p-0.5"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* CHILDREN */}
      {node.children.length > 0 && (
        <div className={`flex gap-4 mt-4 ${collapsed ? 'gap-2' : ''}`}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [hierarchy, setHierarchy] = useState(initialData);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const accessContext = resolveAccessContext();
  const allowedMenuItems = getAllowedSidebarItems(accessContext.role, accessContext.plan, MENU_ITEMS);

  const isActive = (item) => {
    const p = pathname.toLowerCase();
    const base = item.path.toLowerCase();

    if (item.id === "home") {
      return p === "/admin" || p.includes("/admin/dashboard");
    }
    return item.exact ? p === base : p.startsWith(base);
  };

  const addNode = (id) => {
    const name = prompt("Enter subordinate name:");
    const designation = prompt("Enter designation:");

    if (!name || !designation) return;

    const newNode = {
      id: idCounter++,
      name,
      designation,
      photo: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
      children: []
    };

    const addRecursively = (node) => {
      if (node.id === id) {
        node.children.push(newNode);
      } else {
        node.children.forEach(addRecursively);
      }
    };

    const updated = structuredClone(hierarchy);
    addRecursively(updated);
    setHierarchy(updated);
  };

  const editNode = (id) => {
    const editRecursively = (node) => {
      if (node.id === id) {
        const newName = prompt("Edit name:", node.name);
        const newDesignation = prompt("Edit designation:", node.designation);
        if (newName) node.name = newName;
        if (newDesignation) node.designation = newDesignation;
      } else {
        node.children.forEach(editRecursively);
      }
    };

    const updated = structuredClone(hierarchy);
    editRecursively(updated);
    setHierarchy(updated);
  };

  const deleteNode = (id) => {
    if (hierarchy.id === id) {
      alert("Cannot delete CEO!");
      return;
    }

    const deleteRecursively = (node) => {
      node.children = node.children.filter((child) => {
        if (child.id === id) return false;
        deleteRecursively(child);
        return true;
      });
    };

    const updated = structuredClone(hierarchy);
    deleteRecursively(updated);
    setHierarchy(updated);
  };

  return (
    <aside
      className={`sticky top-0 h-screen bg-white shadow-md flex flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-72"
        }`}
    >
      {/* HEADER */}
      <div className="flex items-center px-4 py-4 border-b">
        <div className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-2"}`}>
          <img
            src="/assets/HRMS_Logo_bg.png"
            alt="Logo"
            className="h-14 w-14 object-contain"
          />

          {!collapsed && (
            <span className="text-[25px] font-black leading-none text-[#001A7D]">
              TrueCore<span className="text-[#3B82F6]">HR</span>
            </span>
          )}
        </div>
      </div>

      {/* COLLAPSE BUTTON */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute top-[70%] -right-3 bg-[#011A8B] text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1 z-10"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto mt-3 px-2">
        <ul className="space-y-1">
          {allowedMenuItems.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActive(item);

            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${active
                    ? "bg-[#011A8B] text-white shadow-md"
                    : "text-gray-700 hover:bg-[#EEF2FF] hover:text-[#011A8B]"
                    } ${collapsed ? "justify-center px-2 py-3" : ""}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* HIERARCHY TREE SECTION - Only visible when not collapsed */}
      {!collapsed && allowedMenuItems.some((item) => item.id === "hierarchy") && (
        <div className="border-t p-4 bg-gray-50 mt-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users2 className="w-4 h-4" />
              Org Chart
            </h3>
            <button
              onClick={() => setShowHierarchy(!showHierarchy)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showHierarchy ? 'Hide' : 'Show'}
            </button>
          </div>

          {showHierarchy && (
            <div className="max-h-48 overflow-auto border rounded-lg p-2 bg-white">
              <div className="flex justify-center">
                <TreeNode
                  node={hierarchy}
                  onAdd={addNode}
                  onEdit={editNode}
                  onDelete={deleteNode}
                  collapsed={false}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
