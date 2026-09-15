import React from 'react';

const FormDateInput = ({ label, icon: Icon, value, onChange, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {Icon && <Icon className="inline mr-2 text-gray-500 dark:text-gray-400" />}
      {label}{required && '*'}
    </label>
    <input
      type="date"
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

export default FormDateInput;
