import React from "react";

function Table({ headers, data, renderRow }) {
  return (
    <table className="w-full text-sm border-collapse text-gray-900 dark:text-gray-100">
      <thead>
        <tr className="bg-gray-100">
          {headers.map((header, index) => (
            <th key={index} className="border px-2 py-1 text-left">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((row, index) => renderRow(row, index))
        ) : (
          <tr>
            <td colSpan={headers.length} className="text-center py-2 text-gray-500">
              No data available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default Table;