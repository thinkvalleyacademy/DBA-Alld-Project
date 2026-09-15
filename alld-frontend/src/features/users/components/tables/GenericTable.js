import { useState ,useEffect} from "react";
import { TrashIcon } from "@heroicons/react/24/outline";


function GenericTable({ columns, data, noDataLabel, onEdit, onDelete, onDetails,itemsPerPage = 10,classesData }) {
  const [sortConfig, setSortConfig] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const filteredData = data.filter((item) =>
    columns.some((col) =>
      (item[col.key] || "").toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const sortedData = [...filteredData];
  if (sortConfig !== null) {
    sortedData.sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig?.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = (item) => {
    if (window.confirm("Are you sure you want to delete this?")) {
      onDelete(item);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedItems.length} selected ${noDataLabel}?`)) {
      selectedItems.forEach((item) => onDelete(item));
      setSelectedItems([]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(paginatedData);
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItems((prev) =>
      prev.some((i) => i === item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  const exportCSV = () => {
    const header = columns.map((col) => col.header).join(",");
    const rows = data.map((item) =>
      columns.map((col) => `"${item[col.key] || ""}"`).join(",")
    );
    const csvContent = [header, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${noDataLabel}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  // useEffect(() => {
  //   console.log("DEBUG - classes prop received in StudentRegistrationForm:", classesData);
  // }, [classesData]);
  

  return (
    <div className="overflow-x-auto">
      {/* Search and Actions */}
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-3 py-1 rounded shadow-sm"
        />

        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Delete Selected ({selectedItems.length})
            </button>
          )}
          <button
            onClick={exportCSV}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">
              <input
                type="checkbox"
                checked={
                  selectedItems.length === paginatedData.length &&
                  paginatedData.length > 0
                }
                onChange={handleSelectAll}
              />
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => requestSort(col.key)}
                className="border px-2 py-1 text-left cursor-pointer hover:bg-gray-200"
              >
                {col.header}
                {sortConfig?.key === col.key && (
                  <span>{sortConfig.direction === "ascending" ? " 🔼" : " 🔽"}</span>
                )}
              </th>
            ))}
            {(onDetails || onDelete) && (
              <th className="border px-2 py-1 text-left">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    onChange={() => handleSelectItem(item)}
                  />
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="border px-2 py-1">
                    {item[col.key]}
                  </td>
                ))}
                
                
                {(onDetails || onDelete) && (
                  <td className="border px-2 py-1 flex gap-2">
                    {onDetails && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDetails(item);
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Details"
                      >
                        <span className="underline text-sm">Details</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + 2}
                className="text-center py-2 text-gray-500"
              >
                No {noDataLabel} found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-4 items-center gap-2 text-sm">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default GenericTable;
