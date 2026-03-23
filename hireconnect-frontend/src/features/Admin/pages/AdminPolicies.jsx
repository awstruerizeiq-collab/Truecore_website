import React, { useState, useEffect } from "react";
import axios from "axios";
import { Upload, X, FileText, Image, Eye, Download, AlertCircle } from "lucide-react";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
export default function AdminPolicies() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState(null);
    const [policies, setPolicies] = useState([]);
    const [viewingFile, setViewingFile] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [tenantCode, setTenantCode] = useState(null);
    const [error, setError] = useState(null);

    const API = `${API_BASE_URL}/api/policies`;

    useEffect(() => {
        // Get and validate tenant code on component mount
        const storedTenantCode = localStorage.getItem("tenantCode");

        if (!storedTenantCode) {
            setError("Tenant code not found. Please login again.");
            return;
        }

        console.log("Admin tenant code:", storedTenantCode);
        setTenantCode(storedTenantCode);
        loadPolicies(storedTenantCode);
    }, []);

    const loadPolicies = async (code) => {
        try {
            const res = await axios.get(`${API}/tenant/${code}`);
            console.log("Loaded policies:", res.data);
            setPolicies(res.data);
        } catch (error) {
            console.error("Error loading policies:", error);
            setError("Failed to load policies");
        }
    };

    const savePolicy = async () => {
        if (!title || !description) {
            alert("Please fill in title and description");
            return;
        }

        if (!tenantCode) {
            alert("Tenant code not found. Please login again.");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("tenantCode", tenantCode);

        if (file) {
            formData.append("file", file);
        }

        try {
            console.log("Saving policy with tenant code:", tenantCode);

            const response = await axios.post(API, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("Policy saved:", response.data);

            setTitle("");
            setDescription("");
            setFile(null);

            loadPolicies(tenantCode);
            alert("Policy saved successfully!");
        } catch (error) {
            console.error("Error saving policy:", error);
            alert("Failed to save policy: " + (error.response?.data || error.message));
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(selectedFile.type)) {
                alert("Only PDF and image files (JPG, PNG) are allowed");
                return;
            }

            if (selectedFile.size > 10 * 1024 * 1024) {
                alert("File size must be less than 10MB");
                return;
            }

            setFile(selectedFile);
        }
    };

    const removeFile = () => {
        setFile(null);
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

    if (error && !tenantCode) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-800">Error</h3>
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* TENANT INFO */}
            {tenantCode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                        <strong>Active Tenant:</strong> {tenantCode}
                    </p>
                </div>
            )}

            {/* TITLE CARD */}
            <div className="bg-white p-4 rounded shadow">
                <label className="block font-semibold mb-2 text-black">
                    Policy Title
                </label>
                <input
                    className="border w-full p-2 rounded text-black"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter policy title"
                />
            </div>

            {/* DESCRIPTION CARD */}
            <div className="bg-white p-4 rounded shadow">
                <label className="block font-semibold mb-2 text-black">
                    Description
                </label>
                <textarea
                    rows="5"
                    className="border w-full p-2 rounded text-black"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter policy description"
                />
            </div>

            {/* FILE UPLOAD CARD */}
            <div className="bg-white p-4 rounded shadow">
                <label className="block font-semibold mb-2 text-black">
                    Attachment (Optional)
                </label>

                {!file ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                PDF, PNG, JPG (MAX. 10MB)
                            </p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={handleFileChange}
                        />
                    </label>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                        <div className="flex items-center gap-3">
                            {file.type === 'application/pdf' ? (
                                <FileText className="w-6 h-6 text-red-500" />
                            ) : (
                                <Image className="w-6 h-6 text-blue-500" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-black">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={removeFile}
                            className="p-1 hover:bg-gray-200 rounded transition"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                )}
            </div>

            <button
                onClick={savePolicy}
                className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 transition"
            >
                Save Policy
            </button>

            {/* POLICY LIST */}
            <div className="bg-white shadow rounded p-4">
                <h3 className="font-bold mb-4 text-black text-lg">
                    Saved Policies ({tenantCode})
                </h3>

                {policies.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No policies created yet</p>
                ) : (
                    <div className="space-y-3">
                        {policies.map((p) => (
                            <div key={p.id} className="border-b pb-3 last:border-b-0">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <strong className="text-black">{p.title}</strong>
                                        <p className="text-gray-600 text-sm mt-1">{p.description}</p>
                                        <p className="text-xs text-gray-400 mt-1">Tenant: {p.tenantCode}</p>

                                        {p.attachmentName && (
                                            <div className="flex items-center gap-2 mt-3">
                                                <div className="flex items-center gap-2 flex-1">
                                                    {p.attachmentName.endsWith('.pdf') ? (
                                                        <FileText className="w-4 h-4 text-red-500" />
                                                    ) : (
                                                        <Image className="w-4 h-4 text-blue-500" />
                                                    )}
                                                    <span className="text-xs text-gray-500">{p.attachmentName}</span>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => viewAttachment(p)}
                                                        className="flex items-center gap-1 px-2 py-1 bg-blue-900 text-white rounded text-xs hover:bg-blue-800 transition"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </button>

                                                    <button
                                                        onClick={() => downloadAttachment(p)}
                                                        className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FILE VIEWER MODAL */}
            {showModal && viewingFile && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-3">
                                {viewingFile.type === 'pdf' ? (
                                    <FileText className="w-6 h-6 text-red-500" />
                                ) : (
                                    <Image className="w-6 h-6 text-blue-500" />
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