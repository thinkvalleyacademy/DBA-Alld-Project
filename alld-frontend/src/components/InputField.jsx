export function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
}) {
  const baseClasses =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500";

  const enabledBg = "bg-white dark:bg-gray-800";
  const disabledBg = "bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-70";

  const finalClasses = `${baseClasses} ${
    disabled ? disabledBg : enabledBg
  }`;

  return (
    <div>
      <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      {type === "textfield" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={3}
          className={finalClasses}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={finalClasses}
        />
      )}
    </div>
  );
}
