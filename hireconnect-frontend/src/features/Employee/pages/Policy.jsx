import React, { useEffect, useState } from "react";
import axios from "axios";
import { FileText, Download, Eye, X, Image as ImageIcon, AlertCircle } from "lucide-react";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
export default function LeavePolicyPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [tenantCode, setTenantCode] = useState(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get tenant code from localStorage
      const storedTenantCode = localStorage.getItem("tenantCode");

      if (!storedTenantCode) {
        setError("Tenant code not found. Please login again.");
        setLoading(false);
        return;
      }

      console.log("Fetching policies for tenant:", storedTenantCode);
      setTenantCode(storedTenantCode);

      // Fetch policies using the tenant-specific endpoint
      const res = await axios.get(
        `${API_BASE_URL}/api/policies/tenant/${storedTenantCode}`
      );

      console.log("Fetched policies:", res.data);
      setPolicies(res.data);

    } catch (err) {
      console.error("Error fetching policies:", err);
      setError("Failed to load policies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const viewAttachment = (policy) => {
    if (!policy.attachmentPath) return;

    const filename = policy.attachmentPath.split('/')[1];
    const viewUrl = `${API_BASE_URL}/api/policies/view/${tenantCode}/${filename}`;

    setViewingFile({
      url: viewUrl,
      name: policy.attachmentName,
      type: policy.attachmentName?.endsWith('.pdf') ? 'pdf' : 'image',
      policy: policy
    });
    setShowModal(true);
  };

  const downloadAttachment = (policy) => {
    if (!policy.attachmentPath) return;

    const filename = policy.attachmentPath.split('/')[1];
    const downloadUrl = `${API_BASE_URL}/api/policies/download/${tenantCode}/${filename}`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = policy.attachmentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeModal = () => {
    setShowModal(false);
    setViewingFile(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F7FF] p-6">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#011A8B] text-white">
          <FileText />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#011A8B]">
            Company Policies
          </h1>
          <p className="text-sm text-gray-600">
            View and download company policies
          </p>
          {tenantCode && (
            <p className="text-xs text-gray-500 mt-1">
              Tenant: {tenantCode}
            </p>
          )}
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#011A8B] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading policies...</p>
          </div>
        </div>
      )}

      {/* POLICIES GRID */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {policies.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No policies available</p>
              <p className="text-gray-400 text-sm mt-2">
                Your company hasn't created any policies yet
              </p>
            </div>
          )}

          {policies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold text-[#011A8B] mb-2">
                {policy.title}
              </h2>

              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {policy.description}
              </p>

              {/* ATTACHMENT SECTION */}
              {policy.attachmentPath && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {policy.attachmentName?.endsWith('.pdf') ? (
                        <FileText className="w-5 h-5 text-red-500" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-blue-500" />
                      )}
                      <span className="text-sm text-gray-600">
                        {policy.attachmentName}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => viewAttachment(policy)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#011A8B] text-white rounded hover:bg-blue-800 transition text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>

                      <button
                        onClick={() => downloadAttachment(policy)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FILE VIEWER MODAL */}
      {showModal && viewingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                {viewingFile.type === 'pdf' ? (
                  <FileText className="w-6 h-6 text-red-500" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-blue-500" />
                )}
                <div>
                  <h3 className="font-semibold text-lg text-black">
                    {viewingFile.policy.title}
                  </h3>
                  <p className="text-sm text-gray-600">{viewingFile.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadAttachment(viewingFile.policy)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>

                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded transition"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              {viewingFile.type === 'pdf' ? (
                <iframe
                  src={viewingFile.url}
                  className="w-full h-full rounded border-0"
                  title={viewingFile.name}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={viewingFile.url}
                    alt={viewingFile.name}
                    className="max-w-full max-h-full object-contain rounded shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}