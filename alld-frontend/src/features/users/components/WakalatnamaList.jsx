import { useEffect, useState } from "react";
import { SquareCheckBig, ThumbsUp, List, Hourglass } from "lucide-react";
import { FaCheck } from "react-icons/fa6";
import IconButton from "../../../components/IconButton";
import PageWrapper from "../../../utility/PageWrapper";
import apiService from "../../../components/apiService";

const WakalatnamaList = () => {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [entries, setEntries] = useState([]);
  const [totalEntry, setTotalEntry] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const fetchEntries = async (pageNumber = 0) => {
    try {
      const response = await apiService.wakalatnamaList({
        page: pageNumber,
        size: pageSize,
        sortBy: "id",
      });
      const data = response.data.data;
      setEntries(data.content || []);
      setTotalEntry(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch list:", err);
    }
  };

  useEffect(() => {
    fetchEntries(page);
  }, [page]);

  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleEdit = (entry) => alert(`Edit entry: ${entry.id}`);

  return (
    <PageWrapper>
      
      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        <h1 className="flex items-center text-xl font-semibold gap-2">
          <List className="w-5 h-5" />
          Wakalatnama List
        </h1>
      </div>

     
      <div className="text-sm text-gray-700 dark:text-gray-300 mb-4">
        Showing {entries.length === 0 ? 0 : page * pageSize + 1} to{" "}
        {Math.min((page + 1) * pageSize, totalEntry)} of {totalEntry} entries
      </div>

  
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              {[
                "Sr No.",
                "Wakalatnama ID",
                "Entry ID",
                "Is Client",
                "Payment Status",
                "Create Date",
                "Status",
                "Action",
              ].map((head) => (
                <th
                  key={head}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {entries.map((entry, index) => (
              <tr
                key={entry.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {page * pageSize + index + 1}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {entry.orderId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {entry.entryId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {entry.isClient ? "Direct" : "No"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {entry.paymentStatus === "PAID" ? (
                    <IconButton
                      title="PAID"
                      icon={FaCheck}
                      backgroundColor="green"
                      hoverColor="#16A34A"
                      onClick={() => {}}
                    />
                  ) : (
                    <IconButton
                      title="PENDING"
                      icon={Hourglass}
                      backgroundColor="grey"
                      hoverColor="#16A34A"
                      onClick={() => {}}
                    />
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {new Date(entry.createdDate).toLocaleDateString("en-IN")}
                </td>

                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {entry.status === "ACTIVE" ? (
                    <IconButton
                      title="ACTIVE"
                      icon={SquareCheckBig}
                      backgroundColor="green"
                      hoverColor="#16A34A"
                    />
                  ) : (
                    <IconButton
                      title="DEACTIVE"
                      icon={ThumbsUp}
                      backgroundColor="grey"
                      hoverColor="#16A34A"
                    />
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 relative">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen(
                          dropdownOpen === entry.id ? null : entry.id
                        );
                      }}
                    >
                      Action
                    </button>

                    {dropdownOpen === entry.id && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            onClick={() => handleEdit(entry)}
                          >
                            Print
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6 gap-4 text-gray-900 dark:text-gray-100">
        <button
          className={`px-4 py-2 border rounded-md text-sm font-medium transition ${
            page === 0
              ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>

        <span className="px-2 py-2 text-sm font-medium">
          Page {page + 1} of {totalPages}
        </span>

        <button
          className={`px-4 py-2 border rounded-md text-sm font-medium transition ${
            page + 1 >= totalPages
              ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          disabled={page + 1 >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </PageWrapper>
  );
};

export default WakalatnamaList;
