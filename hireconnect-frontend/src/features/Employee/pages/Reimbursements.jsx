import React, { useState } from "react";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
export default function Reimbursements() {
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    department: "",
    designation: "",
    requestDate: "",
    reimbursementType: "",
    expenseTitle: "",
    expenseDescription: "",
    expenseDate: "",
    expenseAmount: "",
    paymentMode: "",
    bankDetails: "",
    claimReason: "",
    projectName: "",
    managerName: "",
    travelDistance: "",
    gstNumber: "",
    declaration: false,
  });

  const [files, setFiles] = useState({
    receipt: null,
    additionalProof: [],
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // "success" | "error" | null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // clear field error on change
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;

    setFiles((prev) => ({
      ...prev,
      [name]:
        name === "additionalProof"
          ? Array.from(selectedFiles)
          : selectedFiles[0] || null,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.employeeName.trim())
      newErrors.employeeName = "Employee name is required.";
    if (!formData.employeeId.trim())
      newErrors.employeeId = "Employee ID is required.";
    if (!formData.department)
      newErrors.department = "Department is required.";
    if (!formData.designation.trim())
      newErrors.designation = "Designation is required.";
    if (!formData.requestDate)
      newErrors.requestDate = "Date of request is required.";

    if (!formData.reimbursementType)
      newErrors.reimbursementType = "Select a reimbursement type.";

    if (!formData.expenseTitle.trim())
      newErrors.expenseTitle = "Expense title is required.";
    if (!formData.expenseDescription.trim())
      newErrors.expenseDescription = "Expense description is required.";
    if (!formData.expenseDate)
      newErrors.expenseDate = "Expense date is required.";
    if (!formData.expenseAmount)
      newErrors.expenseAmount = "Expense amount is required.";

    if (!files.receipt)
      newErrors.receipt = "Upload at least one bill/receipt.";

    if (!formData.paymentMode)
      newErrors.paymentMode = "Preferred reimbursement mode is required.";

    if (!formData.claimReason.trim())
      newErrors.claimReason = "Reason for claim is required.";

    if (!formData.declaration)
      newErrors.declaration = "You must confirm the declaration.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    setFormData({
      employeeName: "",
      employeeId: "",
      department: "",
      designation: "",
      requestDate: "",
      reimbursementType: "",
      expenseTitle: "",
      expenseDescription: "",
      expenseDate: "",
      expenseAmount: "",
      paymentMode: "",
      bankDetails: "",
      claimReason: "",
      projectName: "",
      managerName: "",
      travelDistance: "",
      gstNumber: "",
      declaration: false,
    });
    setFiles({
      receipt: null,
      additionalProof: [],
    });
    setErrors({});
    setSubmitStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = new FormData();

      // append normal fields
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      // append files
      if (files.receipt) {
        payload.append("receipt", files.receipt);
      }
      if (files.additionalProof && files.additionalProof.length > 0) {
        files.additionalProof.forEach((file, index) => {
          payload.append(`additionalProof_${index}`, file);
        });
      }

      // API call - adjust URL as per your backend
      const res = await fetch("/api/reimbursements", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        throw new Error("Failed to submit reimbursement");
      }

      setSubmitStatus("success");
      handleReset();
    } catch (err) {
      console.error(err);
      setSubmitStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-[#011A8B] mb-4">
        Reimbursements
      </h2>

      <form
        onSubmit={handleSubmit}
        className="w-full rounded-2xl border border-gray-200 shadow-sm bg-white p-6 space-y-6"
      >
        {/* 1. Employee Details */}
        <section>
          <h3 className="text-sm font-semibold text-[#011A8B] mb-3">
            1. Employee Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Employee Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
                placeholder="Enter employee name"
              />
              {errors.employeeName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.employeeName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Employee ID<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
                placeholder="EMP001"
              />
              {errors.employeeId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.employeeId}
                </p>
              )}
            </div>

            {/* Department Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Department<span className="text-red-500">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
              >
                <option value="">Select Department</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>
              {errors.department && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.department}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Designation<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
                placeholder="e.g., Software Engineer"
              />
              {errors.designation && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.designation}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date of Request<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="requestDate"
                value={formData.requestDate}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
              />
              {errors.requestDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.requestDate}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 2. Reimbursement Type */}
        <section>
          <h3 className="text-sm font-semibold text-[#011A8B] mb-3">
            2. Reimbursement Type<span className="text-red-500">*</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            {[
              "Travel",
              "Food",
              "Medical",
              "Office Supplies",
              "Client Meeting",
              "Internet/Phone",
              "Miscellaneous",
            ].map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="reimbursementType"
                  value={type}
                  checked={formData.reimbursementType === type}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
          {errors.reimbursementType && (
            <p className="text-xs text-red-500 mt-1">
              {errors.reimbursementType}
            </p>
          )}
        </section>

        {/* 3. Expense Details */}
        <section>
          <h3 className="text-sm font-semibold text-[#011A8B] mb-3">
            3. Expense Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Expense Title (short name)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="expenseTitle"
                value={formData.expenseTitle}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
                placeholder="e.g., Client meeting lunch, Taxi to client site"
              />
              {errors.expenseTitle && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.expenseTitle}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Expense Description (why you spent)
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                name="expenseDescription"
                value={formData.expenseDescription}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
                placeholder="Explain the purpose of this expense..."
              ></textarea>
              {errors.expenseDescription && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.expenseDescription}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Expense Date<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
              />
              {errors.expenseDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.expenseDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Expense Amount<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="expenseAmount"
                value={formData.expenseAmount}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
                placeholder="Enter amount"
                min="0"
              />
              {errors.expenseAmount && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.expenseAmount}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 4. Receipts / Documents */}
        <section>
          <h3 className="text-sm font-semibold text-[#011A8B] mb-3">
            4. Receipts / Documents
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Upload bill/receipt (PDF, JPG, PNG)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="receipt"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-md file:bg-[#011A8B] file:text-white file:text-xs hover:file:bg-[#02106b]"
              />
              {errors.receipt && (
                <p className="text-xs text-red-500 mt-1">{errors.receipt}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Upload additional proof (tickets, invoices, etc.)
              </label>
              <input
                type="file"
                name="additionalProof"
                multiple
                onChange={handleFileChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-md file:bg-[#011A8B] file:text-white file:text-xs hover:file:bg-[#02106b]"
              />
            </div>
          </div>
        </section>

        {/* 5. Payment Details */}
        <section>
          <h3 className="text-sm font-semibold text-[#011A8B] mb-3">
            5. Payment Details (if needed)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Preferred reimbursement mode
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {["Bank Transfer", "Salary Adjustment"].map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="paymentMode"
                      value={mode}
                      checked={formData.paymentMode === mode}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />
                    <span>{mode}</span>
                  </label>
                ))}
              </div>
              {errors.paymentMode && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.paymentMode}
                </p>
              )}
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Bank details (only if the company asks)
              </label>
              <textarea
                rows={2}
                name="bankDetails"
                value={formData.bankDetails}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
                placeholder="Account Holder Name, Bank Name, Account Number, IFSC Code"
              ></textarea>
            </div>
          </div>
        </section>

        {/* 6. Reason for Claim */}
        <section>
          <h3 className="text-sm font-semibold text-[#011A8B] mb-3">
            6. Reason for Claim<span className="text-red-500">*</span>
          </h3>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              1–2 line explanation
            </label>
            <textarea
              rows={2}
              name="claimReason"
              value={formData.claimReason}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
              placeholder={`e.g., "Purchased office chair for better ergonomic work setup."\n"Client meeting lunch expenses."`}
            ></textarea>
            {errors.claimReason && (
              <p className="text-xs text-red-500 mt-1">
                {errors.claimReason}
              </p>
            )}
          </div>
        </section>

        {/* Optional Fields */}
        <section>
          <h3 className="text-sm font-semibold text-[#011A8B] mb-1">
            📌 Optional Fields
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Some companies require these details.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Project Name / Client Name
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
                placeholder="e.g., Project Apollo / ABC Corp"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Manager Name
              </label>
              <input
                type="text"
                name="managerName"
                value={formData.managerName}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
                placeholder="Enter reporting manager name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Travel Distance (km)
              </label>
              <input
                type="number"
                name="travelDistance"
                value={formData.travelDistance}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
                placeholder="If applicable"
                min="0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                GST Number on Invoice
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#011A8B]/30 focus:border-[#011A8B]"
                placeholder="If available"
              />
            </div>
          </div>
        </section>

        {/* 7. Declaration */}
        <section className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-[#011A8B] mb-3">
            7. Declaration<span className="text-red-500">*</span>
          </h3>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="declaration"
              checked={formData.declaration}
              onChange={handleChange}
              className="mt-1 h-4 w-4"
            />
            <span>
              I confirm that the submitted expenses are valid and work-related.
            </span>
          </label>
          {errors.declaration && (
            <p className="text-xs text-red-500 mt-1">{errors.declaration}</p>
          )}
        </section>

        {/* Status Message */}
        {submitStatus === "success" && (
          <p className="text-sm text-green-600">
            Reimbursement request submitted successfully.
          </p>
        )}
        {submitStatus === "error" && (
          <p className="text-sm text-red-600">
            Something went wrong. Please try again.
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg bg-[#011A8B] text-white hover:bg-[#02106b] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Reimbursement"}
          </button>
        </div>
      </form>
    </div>
  );
}