import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronRight,
  Clock,
  Eye,
  Fingerprint,
  IdCard,
  Plus,
  ScanFace,
  Search,
  Server,
  Shield,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import {
  fetchAccessControlActivity,
  fetchAccessControlDashboard,
  fetchAccessControlModules,
  getCompanyContext,
  saveAccessControlModule,
} from "../services/accessControlService";

const biometricModules = [
  {
    id: "fingerprint",
    title: "Fingerprint",
    description: "Capture and validate employee fingerprints at checkpoints.",
    status: "Active",
    icon: Fingerprint,
  },
  {
    id: "face-recognition",
    title: "Face Recognition",
    description: "Use camera-based identity verification for secure access.",
    status: "Active",
    icon: ScanFace,
  },
  {
    id: "iris-scan",
    title: "Iris Scan",
    description: "High-precision iris identification for restricted areas.",
    status: "Coming Soon",
    icon: Eye,
  },
];

const idBasedModules = [
  {
    id: "id-card-access",
    title: "ID Card Access",
    description: "Grant and monitor access through company ID cards.",
    status: "Active",
    icon: IdCard,
  },
  {
    id: "mobile-app-access",
    title: "Mobile App Access",
    description: "Authorize entry using secure employee mobile credentials.",
    status: "Coming Soon",
    icon: Smartphone,
  },
];

const allModules = [...biometricModules, ...idBasedModules];
const defaultModuleById = Object.fromEntries(allModules.map((module) => [module.id, module]));

const locationOptions = [
  "Head Office",
  "Branch Office",
  "Warehouse",
  "Factory Unit",
  "Remote Site",
];

const formatLastAudit = (lastAudit) => {
  if (!lastAudit) return "No audits yet";
  const date = new Date(lastAudit);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60 * 1000) return "Just now";
  const diffMin = Math.floor(diffMs / (60 * 1000));
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hr ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} days ago`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const buildModuleConfigMap = (items) => {
  const map = {};
  for (const item of Array.isArray(items) ? items : []) {
    map[item.moduleKey] = {
      ...item,
      enabled: Boolean(item.enabled),
      deviceName: item.deviceName || (
        defaultModuleById[item.moduleKey]?.title
          ? `${defaultModuleById[item.moduleKey]?.title || "Access"} Device`
          : "Access Device"
      ),
      location: item.location || locationOptions[0],
      apiKey: item.apiKey || "",
      maskedApiKey: item.maskedApiKey || null,
    };
  }
  return map;
};

const resolveActivityStatus = (entry) => {
  if (entry?.attendanceActivated) return "Success";
  if (entry?.verified) return "Verified";
  return "Failed";
};

function AccessConfigModal({ module, moduleConfig, onClose, onSave, isSaving }) {
  const [enabled, setEnabled] = useState(Boolean(moduleConfig?.enabled));
  const [deviceName, setDeviceName] = useState(moduleConfig?.deviceName || "");
  const [location, setLocation] = useState(moduleConfig?.location || locationOptions[0]);
  const [apiKey, setApiKey] = useState(moduleConfig?.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setEnabled(Boolean(moduleConfig?.enabled));
    setDeviceName(moduleConfig?.deviceName || (module ? `${module.title} Device` : ""));
    setLocation(moduleConfig?.location || locationOptions[0]);
    setApiKey(moduleConfig?.apiKey || "");
  }, [module, moduleConfig]);

  if (!module) return null;
  const ModuleIcon = module.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
              <ModuleIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{module.title}</h3>
              <p className="text-sm text-slate-500">Configuration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Module Status</p>
              <p className="text-xs text-slate-500">{enabled ? "Enabled" : "Disabled"}</p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled((prev) => !prev)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                enabled ? "bg-blue-600" : "bg-slate-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              aria-label="Toggle module"
              disabled={isSaving}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Device Name</label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter device name"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={isSaving}
            >
              {locationOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">API Key</label>
              <button
                type="button"
                onClick={() => setShowApiKey((prev) => !prev)}
                className="text-xs font-medium text-blue-700 hover:text-blue-900"
                disabled={isSaving}
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter device API key"
              disabled={isSaving}
            />
            {moduleConfig?.maskedApiKey ? (
              <p className="mt-1 text-xs text-slate-500">
                Saved key: <span className="font-mono">{moduleConfig.maskedApiKey}</span>
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onSave({ enabled, deviceName, location, apiKey })}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccessControlSystem() {
  const [selectedModule, setSelectedModule] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [moduleConfigs, setModuleConfigs] = useState({});
  const [dashboard, setDashboard] = useState({
    totalModules: allModules.length,
    activePolicies: 0,
    devicesConnected: 0,
    lastAudit: null,
    biometricStats: {},
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const context = getCompanyContext();
    setCompanyId(context.companyId);
  }, []);

  const refreshAccessControlData = useCallback(
    async ({ silent = false } = {}) => {
      if (!companyId) {
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        const [modules, dashboardSummary, activity] = await Promise.all([
          fetchAccessControlModules(companyId),
          fetchAccessControlDashboard(companyId),
          fetchAccessControlActivity(companyId),
        ]);

        setModuleConfigs(buildModuleConfigMap(modules));
        setDashboard({
          totalModules: Number(dashboardSummary?.totalModules || allModules.length),
          activePolicies: Number(dashboardSummary?.activePolicies || 0),
          devicesConnected: Number(dashboardSummary?.devicesConnected || 0),
          lastAudit: dashboardSummary?.lastAudit || null,
          biometricStats: dashboardSummary?.biometricStats || {},
        });
        setRecentActivity(Array.isArray(activity) ? activity : []);
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(error.message || "Unable to load access control data.");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [companyId]
  );

  useEffect(() => {
    if (!companyId) return undefined;
    refreshAccessControlData();
    const intervalId = setInterval(() => {
      refreshAccessControlData({ silent: true });
    }, 10000);
    return () => clearInterval(intervalId);
  }, [companyId, refreshAccessControlData]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = setTimeout(() => setToastMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const getStatusStyles = (status) => {
    if (status === "Success") return "bg-emerald-100 text-emerald-700";
    if (status === "Verified") return "bg-blue-100 text-blue-700";
    if (status === "Pending") return "bg-amber-100 text-amber-700";
    if (status === "Failed") return "bg-rose-100 text-rose-700";
    if (status === "Active") return "bg-blue-100 text-blue-700";
    if (status === "Disabled") return "bg-slate-200 text-slate-700";
    return "bg-slate-100 text-slate-700";
  };

  const getModuleConfig = (module) => {
    const config = moduleConfigs[module.id] || {};
    return {
      enabled: config.enabled ?? module.status === "Active",
      deviceName: config.deviceName || `${module.title} Device`,
      location: config.location || locationOptions[0],
      apiKey: config.apiKey || "",
      maskedApiKey: config.maskedApiKey || null,
    };
  };

  const getModuleStatus = (module) => {
    const config = moduleConfigs[module.id];
    if (!config) return module.status;
    if (config.enabled) return "Active";
    return module.status === "Coming Soon" ? "Coming Soon" : "Disabled";
  };

  const onSaveModuleConfig = async (config) => {
    if (!selectedModule || !companyId) return;
    setSaving(true);
    try {
      await saveAccessControlModule(selectedModule.id, {
        companyId,
        moduleKey: selectedModule.id,
        enabled: Boolean(config.enabled),
        deviceName: config.deviceName,
        location: config.location,
        apiKey: config.apiKey,
      });
      await refreshAccessControlData({ silent: true });
      setSelectedModule(null);
      setToastMessage("Policy settings saved successfully.");
      setErrorMessage("");
    } catch (error) {
      setToastMessage(error.message || "Unable to save module configuration.");
    } finally {
      setSaving(false);
    }
  };

  const kpis = useMemo(
    () => [
      {
        label: "Total Modules",
        value: String(dashboard.totalModules || allModules.length),
        icon: Shield,
        iconClass: "text-blue-700 bg-blue-100",
      },
      {
        label: "Active Policies",
        value: String(dashboard.activePolicies || 0),
        icon: Users,
        iconClass: "text-cyan-700 bg-cyan-100",
      },
      {
        label: "Devices Connected",
        value: String(dashboard.devicesConnected || 0),
        icon: Server,
        iconClass: "text-indigo-700 bg-indigo-100",
      },
      {
        label: "Last Audit",
        value: formatLastAudit(dashboard.lastAudit),
        icon: Clock,
        iconClass: "text-emerald-700 bg-emerald-100",
      },
    ],
    [dashboard]
  );

  const filteredBiometricModules = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return biometricModules;
    return biometricModules.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchTerm]);

  const filteredIdBasedModules = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return idBasedModules;
    return idBasedModules.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchTerm]);

  const ModuleListCard = ({ title, icon: HeaderIcon, modules }) => (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
          <HeaderIcon className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
      </div>

      <div className="space-y-3">
        {modules.length > 0 ? (
          modules.map((module) => {
            const ItemIcon = module.icon;
            const moduleStatus = getModuleStatus(module);
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => setSelectedModule(module)}
                className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-blue-300 hover:bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="rounded-xl bg-blue-100 p-3 text-blue-700 transition group-hover:bg-blue-200">
                  <ItemIcon className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xl font-semibold text-slate-900">{module.title}</p>
                  <p className="truncate text-sm text-slate-600">{module.description}</p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyles(moduleStatus)}`}
                >
                  {moduleStatus}
                </span>

                <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </button>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No modules match your search.
          </div>
        )}
      </div>
    </div>
  );

  if (!companyId && !loading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-rose-700 shadow-sm ring-1 ring-rose-200">
        Company context not found. Please sign in again with a valid company account.
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-100/70 p-4 sm:p-6">
      <div className="rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 p-6 text-white shadow-lg">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-100/90">
          <span>Super Admin</span>
          <span>/</span>
          <span>Security</span>
          <span>/</span>
          <span className="text-white">Access Control</span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Access Control System</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Manage access permissions, roles, and security policies for this company.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <label className="relative min-w-[260px] flex-1 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search access modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-blue-300/40 bg-white/95 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-white focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <button
              type="button"
              onClick={() => refreshAccessControlData()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <Plus className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{kpi.value}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${kpi.iconClass}`}>
                  <KpiIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ModuleListCard title="Biometric Authentication" icon={Fingerprint} modules={filteredBiometricModules} />
        <ModuleListCard title="ID-Based Access" icon={IdCard} modules={filteredIdBasedModules} />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
            <Activity className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-3 py-3 font-semibold">Time</th>
                <th className="px-3 py-3 font-semibold">Action</th>
                <th className="px-3 py-3 font-semibold">Performed By</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && recentActivity.length > 0 ? (
                recentActivity.map((row) => {
                  const status = resolveActivityStatus(row);
                  return (
                    <tr key={row.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-slate-800">
                        {row.message || `${row.moduleKey} verification`}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                        {row.employeeId || "Unknown Employee"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyles(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-500">
                    {loading ? "Loading recent activity..." : "No recent activity available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AccessConfigModal
        module={selectedModule}
        moduleConfig={selectedModule ? getModuleConfig(selectedModule) : null}
        onClose={() => setSelectedModule(null)}
        onSave={onSaveModuleConfig}
        isSaving={saving}
      />

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
