import React from "react";

export default function SalaryComponentsForm({
  components,
  values,
  errors,
  onChange,
  getCalculatedAmount,
  loading,
  errorMessage,
  missingMessage,
  isEditableComponent,
}) {
  if (loading) {
    return <p className="text-sm text-gray-600">Loading payslip configuration...</p>;
  }

  if (errorMessage) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
        {errorMessage}
      </p>
    );
  }

  if (missingMessage) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-700">
        {missingMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {components.map((item) => {
        const key = item.id;
        const entry = values[key] || { valueType: "amount", value: "" };
        const normalizedValueType =
          String(entry.valueType || "amount").trim().toLowerCase() === "percentage"
            ? "percentage"
            : "amount";
        const editable = typeof isEditableComponent === "function"
          ? isEditableComponent(item)
          : true;
        return (
          <div key={key} className="rounded-xl border border-gray-200 bg-white p-3">
            <label className="mb-2 block text-xs font-semibold text-gray-700">
              {item.componentName}
            </label>
            {editable ? (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <select
                  value={normalizedValueType}
                  onChange={(e) => onChange(key, "valueType", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm text-gray-900 focus:border-[#011A8B] focus:ring-[#011A8B]"
                >
                  <option value="amount">Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
                <input
                  type="number"
                  step="any"
                  value={entry.value}
                  onChange={(e) => onChange(key, "value", e.target.value)}
                  placeholder={normalizedValueType === "percentage" ? "Enter 0 to 100" : "Enter amount"}
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm text-gray-900 focus:border-[#011A8B] focus:ring-[#011A8B]"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="w-full rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-sm text-gray-600">
                  {normalizedValueType === "percentage" ? "Percentage" : "Amount"}
                </div>
                <div className="w-full rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-sm text-gray-600">
                  {entry.value === "" ? "0" : entry.value}
                </div>
              </div>
            )}
            {typeof getCalculatedAmount === "function" ? (
              <p className="mt-2 text-xs text-gray-600">
                Calculated Amount: {Number(getCalculatedAmount(item) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </p>
            ) : null}
            {errors[key] ? (
              <p className="mt-2 text-xs font-medium text-red-600">{errors[key]}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}