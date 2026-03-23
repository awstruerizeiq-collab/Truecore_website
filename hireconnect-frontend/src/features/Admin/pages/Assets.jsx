import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

/* -------------------- Safe API base URL resolver -------------------- */
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

/* -------------------- Tenant helpers -------------------- */
const getTenantContext = () => {
    const tenantCode = (localStorage.getItem("tenantCode") || "").trim();
    const companyIdRaw = (localStorage.getItem("companyId") || "").trim();

    const companyId =
        companyIdRaw && companyIdRaw !== "null" && companyIdRaw !== "undefined"
            ? Number(companyIdRaw)
            : null;

    return { tenantCode, companyId };
};

const getTenantHeaders = () => {
    const { tenantCode, companyId } = getTenantContext();
    return {
        ...(tenantCode ? { "X-Tenant-Code": tenantCode } : {}),
        ...(companyId ? { "X-Company-Id": String(companyId) } : {}),
    };
};

const ASSET_TYPES = [
    { value: "laptop", label: "Laptop" },
    { value: "mobile", label: "Mobile Phone" },
    { value: "tablet", label: "Tablet" },
    { value: "sim", label: "SIM Card" },
    { value: "other", label: "Other" },
];

const labelForType = (type) =>
    ASSET_TYPES.find((t) => t.value === type)?.label || type;

export default function AdminAssets() {
    // IMPORTANT:
    // assetsRaw = whatever backend returns
    // visibleAssets = filtered (only employees in this tenant+company)
    const [assetsRaw, setAssetsRaw] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // add | edit | view
    const [selectedAsset, setSelectedAsset] = useState(null);

    const [selectedAssets, setSelectedAssets] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const [formData, setFormData] = useState({
        employeeId: "",
        employeeName: "",
        department: "",
        dateJoining: "",
        assetType: "laptop",
        makeModel: "",
        serialNumber: "",
        accessories: "",
        condition: "New",
    });

    /* -------------------- AUTH TOKEN -------------------- */
    const getAuthToken = () => {
        const t = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!t) return null;
        return t.startsWith("Bearer ") ? t.replace("Bearer ", "") : t;
    };

    /* -------------------- EMPLOYEE IDS ALLOWED (tenant+company) -------------------- */
    const allowedEmployeeIdSet = useMemo(() => {
        const set = new Set();
        employees.forEach((e) => {
            if (e?.id != null) set.add(String(e.id));
        });
        return set;
    }, [employees]);

    /* -------------------- FILTER ASSETS SAFELY (NO CLASH) --------------------
       Only show assets whose employeeId exists in employees list of this tenant+company
    -------------------------------------------------------------------------- */
    const visibleAssets = useMemo(() => {
        const base = Array.isArray(assetsRaw) ? assetsRaw : [];
        // If employees not loaded yet, don't show anything to avoid leaking other-company rows
        if (!allowedEmployeeIdSet || allowedEmployeeIdSet.size === 0) return [];
        return base.filter((a) => allowedEmployeeIdSet.has(String(a.employeeId)));
    }, [assetsRaw, allowedEmployeeIdSet]);

    /* -------------------- LOCAL STATS (from visibleAssets) -------------------- */
    const stats = useMemo(() => {
        const s = {
            totalAssets: visibleAssets.length,
            laptops: 0,
            mobiles: 0,
            tablets: 0,
            simCards: 0,
            others: 0,
        };

        for (const a of visibleAssets) {
            const t = String(a.assetType || "").toLowerCase();
            if (t === "laptop") s.laptops += 1;
            else if (t === "mobile") s.mobiles += 1;
            else if (t === "tablet") s.tablets += 1;
            else if (t === "sim") s.simCards += 1;
            else s.others += 1;
        }
        return s;
    }, [visibleAssets]);

    /* -------------------- FETCH EMPLOYEES (TENANT+COMPANY) -------------------- */
    const fetchEmployees = async () => {
        try {
            const token = getAuthToken();
            const { tenantCode, companyId } = getTenantContext();

            if (!tenantCode || !companyId) {
                console.warn("Tenant Code / Company ID missing in localStorage.");
                setEmployees([]);
                return;
            }

            const res = await fetch(`${API_BASE_URL}/api/users/tenant/employees`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...getTenantHeaders(),
                },
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) {
                throw new Error(json.message || `Failed to load employees (${res.status})`);
            }

            const list = Array.isArray(json.data) ? json.data : [];

            // If backend already filters, this is fine.
            // If not, we still do a safe local filter (companyId)
            const filtered = companyId
                ? list.filter((u) => Number(u.companyId) === Number(companyId) || u.companyId == null)
                : list;

            setEmployees(filtered);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setEmployees([]);
            alert(err.message || "Failed to load employees");
        }
    };

    /* -------------------- FETCH ASSETS (send tenant headers) -------------------- */
    const fetchAssets = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();

            const res = await fetch(`${API_BASE_URL}/api/assets`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    ...getTenantHeaders(), // ✅ keep sending
                },
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) {
                throw new Error(json.message || `Failed to load assets (${res.status})`);
            }

            const list = Array.isArray(json.data) ? json.data : [];
            setAssetsRaw(list);
        } catch (err) {
            console.error("Error fetching assets:", err);
            setAssetsRaw([]);
            alert(err.message || "Error loading assets");
        } finally {
            setLoading(false);
        }
    };

    /* -------------------- SEARCH ASSETS (send tenant headers) -------------------- */
    const searchAssets = async (search, type) => {
        try {
            setLoading(true);
            const token = getAuthToken();

            const res = await fetch(
                `${API_BASE_URL}/api/assets/search?search=${encodeURIComponent(search)}&type=${type}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        ...getTenantHeaders(), // ✅ keep sending
                    },
                }
            );

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) return;

            const list = Array.isArray(json.data) ? json.data : [];
            setAssetsRaw(list);
        } catch (err) {
            console.error("Error searching assets:", err);
        } finally {
            setLoading(false);
        }
    };

    /* -------------------- Initial load -------------------- */
    useEffect(() => {
        // Load employees first, then assets.
        // This avoids showing other-company assets while employees list is still empty.
        (async () => {
            await fetchEmployees();
            await fetchAssets();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* -------------------- Debounced search -------------------- */
    useEffect(() => {
        const timer = setTimeout(() => {
            searchAssets(searchTerm, filterType);
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, filterType]);

    /* -------------------- When visibleAssets changes: cleanup selections -------------------- */
    useEffect(() => {
        const visibleIds = new Set(visibleAssets.map((a) => a.id));
        setSelectedAssets((prev) => prev.filter((id) => visibleIds.has(id)));
        setSelectAll(false);
    }, [visibleAssets]);

    /* -------------------- EMPLOYEE SELECT -> AUTO FILL -------------------- */
    const handleEmployeeSelect = (e) => {
        const selectedId = e.target.value;
        const employee = employees.find((emp) => String(emp.id) === String(selectedId));

        if (employee) {
            setFormData((prev) => ({
                ...prev,
                employeeId: String(employee.id),
                employeeName: employee.fullName || employee.name || employee.email || "",
                department: employee.department || "",
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                employeeId: "",
                employeeName: "",
                department: "",
            }));
        }
    };

    /* -------------------- MODAL OPEN/CLOSE -------------------- */
    const handleOpenModal = async (mode, asset = null) => {
        setModalMode(mode);
        setSelectedAsset(asset);

        if (mode === "add") {
            await fetchEmployees(); // refresh tenant employees before issuing
            setFormData({
                employeeId: "",
                employeeName: "",
                department: "",
                dateJoining: "",
                assetType: "laptop",
                makeModel: "",
                serialNumber: "",
                accessories: "",
                condition: "New",
            });
        }

        if (asset && mode === "edit") {
            setFormData({
                employeeId: asset.employeeId,
                employeeName: asset.employeeName,
                department: asset.department,
                dateJoining: asset.dateIssued,
                assetType: asset.assetType,
                makeModel: asset.makeModel,
                serialNumber: asset.serialNumber,
                accessories: asset.accessories || "",
                condition: asset.condition,
            });
        }

        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedAsset(null);
    };

    /* -------------------- SUBMIT ADD / EDIT -------------------- */
    const handleSubmit = async () => {
        if (
            !formData.employeeId ||
            !formData.employeeName ||
            !formData.department ||
            !formData.dateJoining ||
            !formData.makeModel ||
            !formData.serialNumber
        ) {
            alert("Please fill in all required fields");
            return;
        }

        // ✅ HARD BLOCK: do not allow issuing asset to employee outside tenant list
        if (!allowedEmployeeIdSet.has(String(formData.employeeId))) {
            alert("Invalid employee for this company. Please select the correct employee.");
            return;
        }

        try {
            const token = getAuthToken();
            let res;

            if (modalMode === "add") {
                res = await fetch(`${API_BASE_URL}/api/assets`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        ...getTenantHeaders(),
                    },
                    body: JSON.stringify(formData),
                });
            } else if (modalMode === "edit") {
                res = await fetch(`${API_BASE_URL}/api/assets/${selectedAsset.id}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        ...getTenantHeaders(),
                    },
                    body: JSON.stringify(formData),
                });
            } else return;

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) {
                throw new Error(json.message || "Operation failed");
            }

            alert(json.message || "Saved successfully");
            handleCloseModal();
            await fetchAssets();
        } catch (err) {
            console.error("Error submitting form:", err);
            alert(err.message || "Error saving asset");
        }
    };

    /* -------------------- DELETE SINGLE -------------------- */
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this asset record?")) return;

        try {
            const token = getAuthToken();
            const res = await fetch(`${API_BASE_URL}/api/assets/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    ...getTenantHeaders(),
                },
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) {
                throw new Error(json.message || "Delete failed");
            }

            alert(json.message || "Deleted successfully");
            await fetchAssets();
        } catch (err) {
            console.error("Error deleting asset:", err);
            alert(err.message || "Error deleting asset");
        }
    };

    /* -------------------- BULK DELETE -------------------- */
    const handleDeleteSelected = async () => {
        if (selectedAssets.length === 0) {
            alert("Please select at least one asset to delete");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedAssets.length} asset(s)?`)) return;

        try {
            const token = getAuthToken();
            const res = await fetch(`${API_BASE_URL}/api/assets/bulk-delete`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    ...getTenantHeaders(),
                },
                body: JSON.stringify({ ids: selectedAssets }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) {
                throw new Error(json.message || "Bulk delete failed");
            }

            alert(json.message || "Deleted successfully");
            setSelectedAssets([]);
            setSelectAll(false);
            await fetchAssets();
        } catch (err) {
            console.error("Error deleting assets:", err);
            alert(err.message || "Error deleting assets");
        }
    };

    /* -------------------- SELECT CHECKBOXES (based on visibleAssets) -------------------- */
    const handleSelectAsset = (id) => {
        setSelectedAssets((prev) => {
            if (prev.includes(id)) {
                setSelectAll(false);
                return prev.filter((sid) => sid !== id);
            }
            return [...prev, id];
        });
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedAssets([]);
            setSelectAll(false);
        } else {
            setSelectedAssets(visibleAssets.map((a) => a.id));
            setSelectAll(true);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards (FILTERED) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <p className="text-3xl font-bold text-[#011A8B] mb-1">{stats.totalAssets}</p>
                    <p className="text-gray-600 text-sm">Total Assets</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <p className="text-3xl font-bold text-green-600 mb-1">{stats.laptops}</p>
                    <p className="text-gray-600 text-sm">Laptops</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <p className="text-3xl font-bold text-gray-600 mb-1">{stats.mobiles}</p>
                    <p className="text-gray-600 text-sm">Mobile Phones</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <p className="text-3xl font-bold text-red-600 mb-1">
                        {stats.tablets + stats.simCards + stats.others}
                    </p>
                    <p className="text-gray-600 text-sm">Other Assets</p>
                </div>
            </div>

            {/* Asset List Section */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-[#011A8B]">Asset List</h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Currently showing {visibleAssets.length} assets
                                {selectedAssets.length > 0 && ` • ${selectedAssets.length} selected`}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {selectedAssets.length > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                    <Trash2 size={20} />
                                    Delete Selected ({selectedAssets.length})
                                </button>
                            )}

                            <button
                                onClick={() => handleOpenModal("add")}
                                className="flex items-center gap-2 px-4 py-2 bg-[#011A8B] text-white rounded-lg hover:bg-[#012060] transition"
                            >
                                <Plus size={20} />
                                Issue New Asset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by name, ID, model, or serial number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#011A8B] focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#011A8B] focus:border-transparent"
                            >
                                <option value="all">All Asset Types</option>
                                {ASSET_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterType("all");
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table (FILTERED) */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#011A8B]">
                            <tr>
                                <th className="px-3 py-3 text-left w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-[#011A8B] focus:ring-[#011A8B]"
                                    />
                                </th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-white">Employee</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-white">Department</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-white">Asset Type</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-white">Make/Model</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-white">Serial No.</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-white">Condition</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-white">Date</th>
                                <th className="px-3 py-3 text-left text-sm font-semibold text-white">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                                        Loading assets...
                                    </td>
                                </tr>
                            ) : visibleAssets.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                                        No assets found for this company
                                    </td>
                                </tr>
                            ) : (
                                visibleAssets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-3 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedAssets.includes(asset.id)}
                                                onChange={() => handleSelectAsset(asset.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-[#011A8B] focus:ring-[#011A8B]"
                                            />
                                        </td>

                                        <td className="px-3 py-3">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{asset.employeeName}</div>
                                                <div className="text-xs text-gray-500">ID: {asset.employeeId}</div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-3 text-sm text-gray-900">{asset.department}</td>

                                        <td className="px-3 py-3 text-sm text-gray-900">{labelForType(asset.assetType)}</td>

                                        <td className="px-3 py-3 text-sm text-gray-900">{asset.makeModel}</td>

                                        <td className="px-3 py-3 text-xs text-gray-900 font-mono">{asset.serialNumber}</td>

                                        <td className="px-3 py-3">
                                            <span className="text-sm text-gray-900">{asset.condition}</span>
                                        </td>

                                        <td className="px-3 py-3 text-sm text-gray-900">{asset.dateIssued}</td>

                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleOpenModal("view", asset)}
                                                    className="px-2 py-1 bg-[#011A8B] text-white text-xs rounded hover:bg-[#012060]"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal("edit", asset)}
                                                    className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(asset.id)}
                                                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 bg-[#011A8B] flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">
                                {modalMode === "add"
                                    ? "Issue New Asset"
                                    : modalMode === "edit"
                                        ? "Edit Asset"
                                        : "Asset Details"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-white hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>

                        {modalMode === "view" ? (
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Employee Name</p>
                                        <p className="font-medium">{selectedAsset?.employeeName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Employee ID</p>
                                        <p className="font-medium">{selectedAsset?.employeeId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Department</p>
                                        <p className="font-medium">{selectedAsset?.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Date Issued</p>
                                        <p className="font-medium">{selectedAsset?.dateIssued}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Asset Type</p>
                                        <p className="font-medium">{labelForType(selectedAsset?.assetType)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Make/Model</p>
                                        <p className="font-medium">{selectedAsset?.makeModel}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Serial Number</p>
                                        <p className="font-medium font-mono">{selectedAsset?.serialNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Condition</p>
                                        <p className="font-medium">{selectedAsset?.condition}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600">Accessories</p>
                                        <p className="font-medium">{selectedAsset?.accessories || "None"}</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="space-y-6">
                                    {/* Employee Selection */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Employee</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Select Employee *
                                                </label>
                                                <select
                                                    value={formData.employeeId}
                                                    onChange={handleEmployeeSelect}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#011A8B] focus:border-transparent"
                                                    disabled={modalMode === "edit"}
                                                >
                                                    <option value="">-- Select an Employee --</option>
                                                    {employees.map((emp) => (
                                                        <option key={emp.id} value={emp.id}>
                                                            {(emp.fullName || emp.name || emp.email || "Employee")} (ID: {emp.id}) -{" "}
                                                            {emp.department || "N/A"}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selected Employee Preview */}
                                    {formData.employeeId && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                                Selected Employee Details
                                            </h3>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Name:</p>
                                                    <p className="font-medium">{formData.employeeName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Employee ID:</p>
                                                    <p className="font-medium">{formData.employeeId}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Department:</p>
                                                    <p className="font-medium">{formData.department || "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Asset Details */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Date of Issue *
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.dateJoining}
                                                    onChange={(e) => setFormData({ ...formData, dateJoining: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#011A8B] focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Asset Type *
                                                </label>
                                                <select
                                                    value={formData.assetType}
                                                    onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#011A8B] focus:border-transparent"
                                                >
                                                    {ASSET_TYPES.map((type) => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Make/Model *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.makeModel}
                                                    onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#011A8B] focus:border-transparent"
                                                    placeholder="e.g., Dell Latitude 5430"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Serial No./Asset Tag *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.serialNumber}
                                                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#011A8B] focus:border-transparent"
                                                    placeholder="Enter serial number"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Condition at Issue *
                                                </label>
                                                <select
                                                    value={formData.condition}
                                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#011A8B] focus:border-transparent"
                                                >
                                                    <option value="New">New</option>
                                                    <option value="Good">Good</option>
                                                    <option value="Fair">Fair</option>
                                                </select>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Accessories (Charger, Case, SIM, etc.)
                                                </label>
                                                <textarea
                                                    value={formData.accessories}
                                                    onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#011A8B] focus:border-transparent"
                                                    rows="2"
                                                    placeholder="Enter accessories provided with the asset"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="px-4 py-2 bg-[#011A8B] text-white rounded-lg hover:bg-[#012060]"
                                    >
                                        {modalMode === "add" ? "Issue Asset" : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}