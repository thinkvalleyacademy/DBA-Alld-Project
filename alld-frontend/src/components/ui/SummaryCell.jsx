const SummaryCell = ({ label, value, isHeader = false }) => (
  <td className={`border border-gray-300 dark:border-gray-600 print:border-gray-400 p-3 text-sm ${
    isHeader
      ? 'font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 print:bg-gray-100 print:text-black print:font-bold'
      : 'text-gray-800 dark:text-gray-200 text-center print:text-black'
  } ${!isHeader && value?.includes('₹') ? 'font-bold print:font-bold' : ''}`}>
    {label || value}
  </td>
);

export default SummaryCell;
