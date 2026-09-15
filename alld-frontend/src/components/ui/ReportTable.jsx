const ReportTable = ({ title, columns, data, totalLabel, totalField, totalColSpan }) => {
  const calculateTotal = (items, field) => items.reduce((sum, item) => sum + (item[field] || 0), 0);

  return (
    <div className="mb-8">
      {title && (
        <div className="text-md font-bold text-gray-700 dark:text-gray-300 mb-3 print:text-black print:font-bold">{title}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 dark:border-gray-600 print:border-gray-400 mb-4">
          <thead className="bg-gray-50 dark:bg-gray-700 print:bg-gray-100">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="border border-gray-300 dark:border-gray-600 print:border-gray-400 p-3 text-left text-sm font-bold text-gray-700 dark:text-gray-300 print:text-black print:font-bold">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIdx) => (
              <tr key={item.id || rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="border border-gray-300 dark:border-gray-600 print:border-gray-400 p-3 text-sm text-gray-800 dark:text-gray-200 print:text-black">
                    {col.render ? col.render(item, rowIdx) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {totalField && (
            <tfoot className="bg-gray-50 dark:bg-gray-700 print:bg-gray-100">
              <tr>
                <td colSpan={totalColSpan} className="border border-gray-300 dark:border-gray-600 print:border-gray-400 p-3 text-sm font-bold text-gray-700 dark:text-gray-300 text-right print:text-black print:font-bold">
                  {totalLabel}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 print:border-gray-400 p-3 text-sm font-bold text-gray-800 dark:text-gray-200 print:text-black print:font-bold">
                  ₹{calculateTotal(data, totalField).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default ReportTable;
