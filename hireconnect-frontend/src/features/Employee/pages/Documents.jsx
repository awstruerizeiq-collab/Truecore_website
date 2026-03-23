import React, { useState, useEffect } from "react";
import {
  FiFile,
  FiDownload,
  FiEye,
  FiUpload,
  FiCheck,
  FiX,
  FiLoader,
} from "react-icons/fi";

// --------- HELPERS ---------
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const buildAuthHeader = () => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
};

// Map backend enum names to frontend keys
const BACKEND_TO_FRONTEND_MAP = {
  "TENTH_MARKSHEET": "tenthMarksheet",
  "TWELFTH_MARKSHEET": "twelfthMarksheet",
  "GRADUATION_MARKSHEET": "graduationMarksheet",
  "POST_GRADUATION_MARKSHEET": "postGraduationMarksheet",
  "DEGREE_CERTIFICATE": "degreeCertificate",
  "AADHAR_CARD": "aadharCard",
  "PAN_CARD": "panCard",
  "PASSPORT_PHOTO": "passportPhoto",
  "OFFER_LETTER": "offerLetter",
  "EXPERIENCE_LETTER": "experienceLetter"
};

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const parsed = await res.json();

      if (!res.ok) {
        setError(parsed.message || "Login failed");
        setLoading(false);
        return;
      }

      if (parsed?.token) {
        localStorage.setItem("token", `Bearer ${parsed.token}`);
        onLogin();
      } else {
        setError("No token received");
      }
    } catch (err) {
      setError("Login error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto p-4 border rounded shadow"
    >
      <h2 className="text-lg font-semibold mb-4">Login</h2>
      {error && (
        <p className="text-red-600 text-sm mb-2" role="alert">
          {error}
        </p>
      )}
      <input
        type="text"
        placeholder="Username"
        className="w-full border p-2 mb-3 rounded"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoComplete="username"
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full border p-2 mb-3 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  const documentCategories = [
    {
      id: "educational",
      label: "Educational Documents",
      fields: [
        { key: "tenthMarksheet", label: "10th Marksheet", required: true },
        { key: "twelfthMarksheet", label: "12th/Diploma Marksheet", required: true },
        { key: "graduationMarksheet", label: "Graduation Marksheet", required: true },
        { key: "postGraduationMarksheet", label: "Post Graduation Marksheet", required: false },
        { key: "degreeCertificate", label: "Degree Certificate", required: true },
      ],
    },
    {
      id: "identity",
      label: "Identity Documents",
      fields: [
        { key: "aadharCard", label: "Aadhar Card", required: true },
        { key: "panCard", label: "PAN Card", required: true },
        { key: "passportPhoto", label: "Passport Size Photo", required: true },
      ],
    },
    {
      id: "employment",
      label: "Employment Documents",
      fields: [
        { key: "offerLetter", label: "Offer Letter", required: false },
        { key: "experienceLetter", label: "Experience Letter", required: false },
      ],
    },
  ];

  useEffect(() => {
    if (!loggedIn) return;
    fetchDocuments();
  }, [loggedIn]);

  const fetchDocuments = async () => {
    const authHeader = buildAuthHeader();
    if (!authHeader) {
      showMessage("error", "User not logged in.");
      setLoggedIn(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/my-documents`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });

      const parsed = await res.json();
      if (!res.ok) {
        showMessage("error", parsed?.message || "Failed to fetch documents");
        return;
      }

      const docs = parsed?.data || [];

      // Convert backend enum to frontend key
      const normalized = docs.map((doc) => {
        const frontendKey = BACKEND_TO_FRONTEND_MAP[doc.documentType] || doc.documentType;
        
        return {
          id: doc.id,
          documentType: frontendKey, // Use frontend key for matching
          fileName: doc.fileName,
          fileUrl: doc.filePath ? `${API_BASE_URL}${doc.filePath}` : "",
          fileType: doc.fileType || "application/octet-stream",
          uploadedAt: doc.uploadedAt || new Date().toISOString(),
          fileSize: doc.fileSize || 0,
        };
      });

      console.log("Normalized documents:", normalized);
      setDocuments(normalized);
    } catch (err) {
      console.error("Error fetching documents", err);
      showMessage("error", "Failed to fetch documents");
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4500);
  };

  const getDocumentByType = (type) => {
    return documents.find((doc) => doc.documentType === type);
  };

  const handleFileChange = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      showMessage("error", "Only PDF, JPG, JPEG, and PNG files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage("error", "File size must be less than 5MB.");
      e.target.value = "";
      return;
    }

    await uploadDocument(file, docType);
    e.target.value = "";
  };

  const uploadDocument = async (file, documentType) => {
    const authHeader = buildAuthHeader();
    if (!authHeader) {
      showMessage("error", "User not logged in.");
      setLoggedIn(false);
      return;
    }

    try {
      setUploading((p) => ({ ...p, [documentType]: true }));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: "POST",
        headers: { Authorization: authHeader },
        body: formData,
      });

      const parsed = await res.json();
      
      if (!res.ok) {
        const msg = parsed?.message || "Upload failed. Please try again.";
        showMessage("error", msg);
        return;
      }

      const docPayload = parsed?.data || parsed?.document || parsed;
      
      // Convert backend enum to frontend key
      const frontendKey = BACKEND_TO_FRONTEND_MAP[docPayload.documentType] || documentType;

      const newDoc = {
        id: docPayload.id,
        documentType: frontendKey, // Use frontend key
        fileName: docPayload.fileName,
        fileUrl: docPayload.filePath ? `${API_BASE_URL}${docPayload.filePath}` : "",
        fileType: docPayload.fileType || file.type,
        uploadedAt: docPayload.uploadedAt || new Date().toISOString(),
        fileSize: docPayload.fileSize || file.size,
      };

      console.log("New document uploaded:", newDoc);

      // Update documents state - remove old document of same type and add new one
      setDocuments((prevDocs) => {
        const filtered = prevDocs.filter((d) => d.documentType !== frontendKey);
        return [...filtered, newDoc];
      });

      const fieldLabel =
        documentCategories
          .flatMap((cat) => cat.fields)
          .find((f) => f.key === documentType)?.label || documentType;

      showMessage("success", `${fieldLabel} uploaded successfully`);
    } catch (err) {
      console.error("Upload error", err);
      showMessage("error", "Upload failed. Please try again.");
    } finally {
      setUploading((p) => ({ ...p, [documentType]: false }));
    }
  };

  const handleView = (doc) => {
    if (!doc?.fileUrl) return;
    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (doc) => {
    if (!doc?.fileUrl) return;
    const link = document.createElement("a");
    link.href = doc.fileUrl;
    link.download = doc.fileName || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (documentType) => {
    if (!window.confirm("Delete this document?")) return;

    const authHeader = buildAuthHeader();
    if (!authHeader) {
      showMessage("error", "User not logged in.");
      setLoggedIn(false);
      return;
    }

    const doc = getDocumentByType(documentType);
    if (!doc) {
      showMessage("error", "Document not found.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${doc.id}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });

      const parsed = await res.json();
      if (!res.ok) {
        showMessage("error", parsed?.message || "Failed to delete document.");
        return;
      }

      setDocuments((prevDocs) =>
        prevDocs.filter((d) => d.documentType !== documentType)
      );

      showMessage("success", "Document deleted");
    } catch (err) {
      console.error("Delete error", err);
      showMessage("error", "Failed to delete document. Please try again.");
    }
  };

  const getUploadedCount = () => documents.length;

  const getTotalRequired = () =>
    documentCategories.reduce(
      (acc, cat) => acc + cat.fields.filter((f) => f.required).length,
      0
    );

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] px-6 py-6">
      <div className="max-w-9xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] px-6 py-5 flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#111827]">My Documents</h1>
          <p className="text-sm text-[#6B7280]">
            Upload and manage your HR documents for verification.
          </p>
        </div>

        {/* Toast / alert */}
        {message.text && (
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm bg-white ${
              message.type === "success"
                ? "border-emerald-200"
                : "border-rose-200"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === "success" ? "bg-emerald-50" : "bg-rose-50"
              }`}
            >
              {message.type === "success" ? (
                <FiCheck className="text-emerald-600" size={18} />
              ) : (
                <FiX className="text-rose-500" size={18} />
              )}
            </div>
            <span
              className={`text-sm ${
                message.type === "success"
                  ? "text-emerald-700"
                  : "text-rose-700"
              }`}
            >
              {message.text}
            </span>
          </div>
        )}

        {/* Stats row */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-[#E4E7EC] px-5 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#E0ECFF] flex items-center justify-center">
                <FiFile className="text-[#011A8B]" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                  Uploaded
                </p>
                <p className="text-2xl font-semibold text-[#111827]">
                  {getUploadedCount()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E7EC] px-5 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <FiCheck className="text-emerald-600" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                  Required
                </p>
                <p className="text-2xl font-semibold text-[#111827]">
                  {getTotalRequired()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E7EC] px-5 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                <FiUpload className="text-[#4F46E5]" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                  Completion
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-2xl font-semibold text-[#111827]">
                    {getTotalRequired() > 0
                      ? Math.round((getUploadedCount() / getTotalRequired()) * 100)
                      : 0}
                    %
                  </p>
                  <div className="w-32 h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
                    <div
                      className="h-full bg-[#011A8B] rounded-full transition-all"
                      style={{
                        width: `${
                          getTotalRequired() > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (getUploadedCount() / getTotalRequired()) * 100
                                )
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document sections */}
        {documentCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 flex items-center justify-between bg-[#F8FAFF]">
              <div>
                <h2 className="text-sm font-semibold text-[#111827]">
                  {category.label}
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Upload scanned copies or clear photos.
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              {category.fields.map((field) => {
                const doc = getDocumentByType(field.key);
                const isUploading = uploading[field.key];

                return (
                  <div
                    key={field.key}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 hover:shadow-sm transition-shadow"
                  >
                    {/* Left */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          doc ? "bg-emerald-50" : "bg-[#F3F4F6]"
                        }`}
                      >
                        {doc ? (
                          <FiCheck className="text-emerald-600" size={20} />
                        ) : (
                          <FiFile className="text-[#9CA3AF]" size={20} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-[#111827] truncate">
                            {field.label}
                          </h3>
                          {field.required && (
                            <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 border border-rose-100">
                              Required
                            </span>
                          )}
                        </div>

                        {doc ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                            <span className="truncate max-w-[200px]">{doc.fileName}</span>
                            <span className="text-[#D1D5DB]">•</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span className="text-[#D1D5DB]">•</span>
                            <span>
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-[#9CA3AF]">
                            No file uploaded yet.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                      {doc ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleView(doc)}
                            className="inline-flex items-center justify-center rounded-xl border border-transparent bg-[#F3F4F6] px-2.5 py-2 text-xs font-medium text-[#374151] hover:bg-[#E5E7EB]"
                            title="View document"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            className="inline-flex items-center justify-center rounded-xl border border-[#CBD5F5] bg-[#EEF2FF] px-2.5 py-2 text-xs font-medium text-[#011A8B] hover:bg-[#E0E7FF]"
                            title="Download document"
                          >
                            <FiDownload size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(field.key)}
                            className="inline-flex items-center justify-center rounded-xl border border-transparent bg-[#FEF2F2] px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-[#FEE2E2]"
                            title="Delete document"
                          >
                            <FiX size={18} />
                          </button>
                        </>
                      ) : (
                        <label
                          className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer ${
                            isUploading
                              ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
                              : "bg-[#011A8B] text-white hover:bg-[#02106A]"
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <FiLoader
                                className="animate-spin mr-2"
                                size={16}
                              />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FiUpload className="mr-1.5" size={16} />
                              Upload
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(e) => handleFileChange(e, field.key)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Guidelines panel */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm px-6 py-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E0ECFF]">
              <FiFile className="text-[#011A8B]" size={18} />
            </span>
            Upload Guidelines
          </h3>
          <ul className="mt-3 text-xs text-[#4B5563] space-y-1.5">
            <li>• Accepted formats: PDF, JPG, JPEG, PNG</li>
            <li>• Maximum file size: 5MB per document</li>
            <li>• Ensure the uploaded copies are clear and readable</li>
            <li>• All required documents must be uploaded for verification</li>
            <li>• You can replace an existing document by deleting and uploading again</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Documents;