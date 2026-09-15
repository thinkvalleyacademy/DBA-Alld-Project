import { useEffect, useState } from "react";
import { SquareCheckBig, ThumbsUp, List, RefreshCcw } from "lucide-react";
import PageWrapper from "../../../utility/PageWrapper";
import apiService from "../../../components/apiService";
import IconButton from "../../../components/IconButton";

const AffidavitList = () => {
  const [entryList, setList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    const response = await apiService.affidavitList();
    setList(response.data.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPages = Math.ceil(entryList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = entryList.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage((prev) => prev - 1);
  const handleNext = () =>
    currentPage < totalPages && setCurrentPage((prev) => prev + 1);

  return (
    <PageWrapper>
      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        <h1 className="flex items-center text-xl font-semibold gap-2">
          <List className="w-5 h-5" />
          Affidavit Entry List
        </h1>

        <div className="flex gap-2">
          <IconButton
            title="List"
            icon={List}
            backgroundColor="#615CA8"
            hoverColor="#16A34A"
            onClick={() => alert("List clicked!")}
          />
          <IconButton
            title="Refresh"
            icon={RefreshCcw}
            backgroundColor="grey"
            hoverColor="bg-green-600"
            onClick={fetchData}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 mt-10">
        <div className="flex flex-wrap gap-2">
          {["CSV", "Excel", "PDF", "Print"].map((btn) => (
            <button
              key={btn}
              className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md 
                         bg-white dark:bg-gray-800 
                         hover:bg-gray-50 dark:hover:bg-gray-700 
                         text-sm font-medium text-gray-900 dark:text-gray-100 
                         transition"
            >
              {btn}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              {[
                "Sr No.",
                "Affi. No",
                "Coupon No",
                "Advocate info",
                "Name/Mobile",
                "Address",
                "Status",
                "Date",
              ].map((head) => (
                <th
                  key={head}
                  className="px-4 py-3 text-left text-xs font-medium 
                             text-gray-500 dark:text-gray-300 uppercase tracking-wider 
                             border-r border-gray-200 dark:border-gray-700"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentData.map((user, index) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {startIndex + index + 1}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {user.affidavitNo}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {user.couponNo}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {`${user.memberId}, ${user.advocateName}, ${user.advocateMobile}`}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {`${user.name}, ${user.mobile}`}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {user.address}
                </td>

                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {user.status === "ACTIVE" ? (
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

                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {new Date(user.createdDate).toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination */}
      <div className="flex justify-between items-center mt-6 text-gray-900 dark:text-gray-100">
        <p className="text-sm">
          Showing <b>{startIndex + 1}</b> to{" "}
          <b>{Math.min(startIndex + itemsPerPage, entryList.length)}</b> of{" "}
          <b>{entryList.length}</b> entries
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={`px-4 py-2 border rounded-md text-sm font-medium transition ${
              currentPage === 1
                ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
            }`}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-2 border rounded-md text-sm font-medium transition ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 border rounded-md text-sm font-medium transition ${
              currentPage === totalPages
                ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AffidavitList;
