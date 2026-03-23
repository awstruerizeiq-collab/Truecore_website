import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Star } from "lucide-react";

// Helper to resolve API base URL for both local & production
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};


const API_BASE_URL = getApiBaseUrl();

const BookDemoPage = () => {
const [formData, setFormData] = useState({
  fullName: "",
  workEmail: "",
  password: "",  
  phoneCountryCode: "IN +91",
  phoneNumber: "",
  companyName: "",
  role: "",
});

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    type: null, // "success" | "error" | null
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitStatus({ type: null, message: "" });
  };

  const validate = () => {
  const newErrors = {};

  if (!formData.fullName.trim()) {
    newErrors.fullName = "Full name is required";
  }

  if (!formData.workEmail.trim()) {
    newErrors.workEmail = "Work email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) {
    newErrors.workEmail = "Enter a valid email address";
  }

  // ADD PASSWORD VALIDATION
  if (!formData.password || !formData.password.trim()) {
    newErrors.password = "Password is required";
  } else if (formData.password.length < 6) {
    newErrors.password = "Password must be at least 6 characters";
  }

  if (!formData.phoneNumber.trim()) {
    newErrors.phoneNumber = "Phone number is required";
  } else if (!/^\d{7,15}$/.test(formData.phoneNumber.replace(/\s+/g, ""))) {
    newErrors.phoneNumber = "Enter a valid phone number (7–15 digits)";
  }

  if (!formData.companyName.trim()) {
    newErrors.companyName = "Company name is required";
  }

  if (!formData.role || formData.role === "Select Role") {
    newErrors.role = "Please select your role";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitStatus({ type: null, message: "" });

  const isValid = validate();
  if (!isValid) return;

  setSubmitting(true);

  try {
   const payload = {
  fullName: formData.fullName.trim(),
  companyEmail: formData.workEmail.trim(),
  password: formData.password.trim(),
  phoneNumber: `${formData.phoneCountryCode} ${formData.phoneNumber}`.trim(),
  companyName: formData.companyName.trim(),
  designation: formData.role,
};


    const endpoint = API_BASE_URL
      ? `${API_BASE_URL.replace(/\/+$/, "")}/api/company/demo-register`
      : "/api/company/demo-register";

    // ADD THIS DEBUG LOG
    console.log("Sending to endpoint:", endpoint);
    console.log("Payload:", payload);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type");
    let data = {};
    if (contentType && contentType.includes("application/json")) {
      data = await res.json().catch(() => ({}));
    } else {
      const text = await res.text().catch(() => "");
      data = text ? { message: text } : {};
    }

    if (!res.ok) {
      throw new Error(
        data.message || "Failed to submit demo request. Please try again."
      );
    }

    setSubmitStatus({
      type: "success",
      message:
        data.message ||
        "Your demo request has been submitted. Our team will reach out shortly.",
    });

    setFormData({
  fullName: "",
  workEmail: "",
  password: "",
  phoneCountryCode: "IN +91",
  phoneNumber: "",
  companyName: "",
  role: "",
});

    setErrors({});
  } catch (err) {
    setSubmitStatus({
      type: "error",
      message:
        err.message ||
        "Something went wrong while submitting the form. Please try again.",
    });
  } finally {
    setSubmitting(false);
  }
};


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* NAVBAR */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
          <img
            src="/assets/Logo_Truerize.png"
            alt="Truerize Logo"
            className="h-20 w-auto object-contain"
          />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              TRUERIZE
            </span>
            <span
              className="font-extrabold text-xl tracking-tight"
              style={{ color: "#000080" }}
            >
              HRMS
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="text-sm font-bold text-slate-500 hover:text-[#000080] flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl flex flex-col md:flex-row overflow-hidden">
          {/* LEFT SIDE */}
          <div className="w-full md:w-5/12 bg-indigo-900 p-8 md:p-12 flex flex-col justify-between text-white">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Experience the Future of Work
              </h2>

              <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                See how Truerize HRMS empowers your workforce. From smart
                recruitment to automated payroll, we unify your entire employee
                lifecycle into one seamless platform.
              </p>

              <div className="mb-4 font-bold text-white text-lg">
                In this personalized session:
              </div>

              <ul className="space-y-4">
                {[
                  "Deep dive into features relevant to your needs",
                  "Expert consultation on HR workflow automation",
                  "Custom pricing and implementation roadmap",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1 min-w-[20px] text-yellow-400">
                      <Check strokeWidth={4} size={16} />
                    </div>
                    <span className="text-indigo-50 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12 pt-8 border-t border-indigo-700">
              <div className="flex text-yellow-400 mb-2">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
              </div>
              <p className="text-indigo-100 italic text-sm mb-4 leading-relaxed">
                "We reduced our onboarding time by 60% within the first month.
                The support team is incredible and the interface is actually fun
                to use."
              </p>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Sarah Jenkins</div>
                  <div className="text-xs text-indigo-300">
                    VP of People, TechFlow
                  </div>
                </div>
                <div className="flex gap-2 text-indigo-400">
                  <ChevronLeft
                    className="cursor-pointer hover:text-white transition"
                    size={20}
                  />
                  <ChevronRight
                    className="cursor-pointer hover:text-white transition"
                    size={20}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: FORM */}
          <div className="w-full md:w-7/12 bg-white p-8 md:p-12">
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-slate-800">
                  Schedule your free tour
                </h3>
                <p className="text-slate-500 text-sm">
                  Fill in the details below and our team will get in touch
                  shortly.
                </p>
              </div>

              {submitStatus.type && (
                <div
                  className={`mb-2 rounded-xl px-4 py-2 text-sm ${
                    submitStatus.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {submitStatus.message}
                </div>
              )}

              {/* Row 1: Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full border rounded p-2.5 outline-none transition focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500 ${
                      errors.fullName
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-500">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="workEmail"
                    placeholder="john@company.com"
                    value={formData.workEmail}
                    onChange={handleChange}
                    className={`w-full border rounded p-2.5 outline-none transition focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500 ${
                      errors.workEmail
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.workEmail && (
                    <p className="text-xs text-red-500">{errors.workEmail}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full border rounded p-2.5 outline-none transition focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>


              {/* Row 2: Phone */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <select
                    name="phoneCountryCode"
                    value={formData.phoneCountryCode}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-l p-2.5 bg-gray-50 text-slate-700 focus:outline-none border-r-0 w-28"
                  >
                    <option>IN +91</option>
                    <option>US +1</option>
                    <option>UK +44</option>
                    <option>AE +971</option>
                  </select>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="98765 43210"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`w-full border rounded-r p-2.5 outline-none transition focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500 ${
                      errors.phoneNumber
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Row 3: Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Your company name"
                    className={`w-full border rounded p-2.5 outline-none transition focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500 ${
                      errors.companyName
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-red-500">
                      {errors.companyName}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4: Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Your Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`w-full border rounded p-2.5 bg-white text-slate-600 outline-none transition focus:ring-2 focus:ring-indigo-500 ${
                      errors.role
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Role</option>
                    <option>HR Manager / Director</option>
                    <option>Founder / CEO</option>
                    <option>Finance / Admin</option>
                    <option>IT / Operations</option>
                    <option>Other</option>
                  </select>
                  {errors.role && (
                    <p className="text-xs text-red-500">{errors.role}</p>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "SCHEDULE MY DEMO"}
                </button>
                <p className="text-center text-xs text-slate-400 mt-4">
                  No credit card required. Your data is secure with us.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDemoPage;
