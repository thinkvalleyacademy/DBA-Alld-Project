import { useCallback, useEffect, useState } from "react";
import { List, FileSpreadsheet, Download, X, AlertCircle, CheckCircle, Search } from "lucide-react";
import PageWrapper from "../utility/PageWrapper";

const VoterTable = ({ type, title, fetchFunction, searchFunction, extraParams, enabled = true }) => {
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const pageSize = 10;

  const fetchMembers = useCallback(async (pageNumber = 0, query = "") => {
    try {
      const useSearch = searchFunction && query && query.trim() !== "";
      console.log('[VoterTable] Fetching members - useSearch:', useSearch, 'query:', query, 'extraParams:', extraParams);
      const response = await (useSearch
        ? searchFunction({
            ...extraParams,
            query: query.trim(),
            page: pageNumber,
            size: pageSize,
          })
        : fetchFunction({
            ...extraParams,
            page: pageNumber,
            size: pageSize,
          }));

      const data = response.data.data;

      setMembers(data.members || []);
      setTotalMembers(data.totalMembers || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("[VoterTable] Failed to fetch:", err);
    }
  }, [extraParams, fetchFunction, searchFunction, pageSize]);

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    setAppliedSearchQuery(query);
    setIsSearching(true);
    setPage(0);
    fetchMembers(0, query);
  };

  const handleReset = () => {
    setSearchQuery("");
    setAppliedSearchQuery("");
    setIsSearching(false);
    setPage(0);
    fetchMembers(0, "");
  };

  const fetchAllMembersForDownload = async () => {
    try {
      setDownloadProgress(50);
      const useSearch = searchFunction && isSearching && appliedSearchQuery.trim() !== "";
      const response = await (useSearch ? searchFunction : fetchFunction)({
        ...extraParams,
        ...(useSearch ? { query: appliedSearchQuery.trim() } : {}),
        page: 0,
        size: totalMembers || 10000,
      });
      setDownloadProgress(100);
      return response.data.data.members || [];
    } catch (err) {
      console.error("Failed to fetch all members:", err);
      throw err;
    }
  };

  const handleDownloadClick = () => {
    if (totalMembers === 0) return;
    setShowConfirmModal(true);
  };

  const downloadExcel = async () => {
    setShowConfirmModal(false);
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const XLSX = await import("xlsx");
      const allMembers = await fetchAllMembersForDownload();

      if (!allMembers || allMembers.length === 0) {
        setIsDownloading(false);
        return;
      }

      const worksheetData = allMembers.map((member, index) => ({
        "Sr No.": index + 1,
        "Member ID": member.memberId || "",
        Name: member.name || "",
        "S/O": member.guardianName || "",
        "EN No.": member.enNo || "",
        "COP No.": member.registrationNo || "",
        Mobile: member.mobile || "",
        Address: member.address || "",
        DOB: member.dob || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Voters");

      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 18 },
        { wch: 25 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 35 },
        { wch: 12 },
      ];

      const date = new Date().toISOString().split("T")[0];
      const filename = `${title.replace(/\s+/g, "_")}_${date}_${allMembers.length}_records.xlsx`;

      XLSX.writeFile(workbook, filename);

      setDownloadedCount(allMembers.length);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error downloading Excel:", error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setMembers([]);
      setTotalMembers(0);
      setTotalPages(0);
      setPage(0);
      setSearchQuery("");
      setAppliedSearchQuery("");
      setIsSearching(false);
      return;
    }

    setPage(0);
    fetchMembers(0, appliedSearchQuery);
  }, [enabled, extraParams, fetchMembers, appliedSearchQuery]);

  useEffect(() => {
    if (!enabled || page === 0) return;
    fetchMembers(page, appliedSearchQuery);
  }, [enabled, page, fetchMembers, appliedSearchQuery]);

  const ConfirmModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowConfirmModal(false)}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Export to Excel</h3>
              <p className="text-green-100 text-sm">Download voter data</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-200 font-medium">
                Ready to download {totalMembers.toLocaleString()} records
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                This will export all voter data to an Excel file (.xlsx)
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>
                {totalMembers > 1000
                  ? "Large dataset - download may take a moment"
                  : "Download will start immediately"}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2">Included Fields</p>
            <div className="flex flex-wrap gap-2">
              {["Member ID", "Name", "S/O", "EN No.", "COP No.", "Mobile", "Address", "DOB"].map((field) => (
                <span
                  key={field}
                  className="px-2 py-1 bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-md border border-gray-200 dark:border-gray-500"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-end gap-3">
          <button
            onClick={() => setShowConfirmModal(false)}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={downloadExcel}
            className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all font-medium flex items-center gap-2 shadow-lg shadow-green-500/25"
          >
            <Download className="w-4 h-4" />
            Download Now
          </button>
        </div>
      </div>
    </div>
  );

  const SuccessModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowSuccessModal(false)}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <button
          onClick={() => setShowSuccessModal(false)}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
        <div className="px-6 py-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Download Complete!
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Successfully exported <span className="font-semibold text-green-600 dark:text-green-400">{downloadedCount.toLocaleString()}</span> records to Excel
          </p>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={() => setShowSuccessModal(false)}
            className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  const DownloadingOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 mb-4 relative">
            <svg className="animate-spin w-16 h-16" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                style={{ color: "#10B981" }}
              />
              <path
                className="opacity-75"
                fill="#10B981"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <FileSpreadsheet className="w-6 h-6 text-green-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Preparing Download
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Fetching {totalMembers.toLocaleString()} records...
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{downloadProgress}% complete</p>
        </div>
      </div>
    </div>
  );

  return (
    <PageWrapper>
      {showConfirmModal && <ConfirmModal />}
      {showSuccessModal && <SuccessModal />}
      {isDownloading && <DownloadingOverlay />}

      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        <h1 className="flex items-center text-xl font-semibold gap-2">
          <List className="w-5 h-5" />
          {title}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, ID, COP No..."
                disabled={!enabled || isDownloading}
                className="w-64 px-4 py-2.5 pl-10 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={!enabled || isDownloading || !searchQuery.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            {isSearching && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownloadClick}
            disabled={!enabled || isDownloading || totalMembers === 0}
            className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Export Excel</span>
            <span className="px-2 py-0.5 bg-white/20 rounded-md text-xs font-semibold">
              {totalMembers.toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (extraParams.year) params.set("year", extraParams.year);
              if (extraParams.month) params.set("month", extraParams.month);
              if (isSearching && appliedSearchQuery.trim()) {
                params.set("query", appliedSearchQuery.trim());
              }
              const url = params.toString()
                ? `/voter/print-styled/${type}?${params.toString()}`
                : `/voter/print-styled/${type}`;
              window.open(url, "_blank");
            }}
            disabled={!enabled || totalMembers === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Print List
          </button>
        </div>
      </div>

      {!enabled ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-6 text-sm text-gray-600 dark:text-gray-300">
          Select month and year, then click Generate to load the voter list.
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {isSearching ? (
              <>
                Search results for "<span className="font-medium text-purple-600 dark:text-purple-400">{appliedSearchQuery}</span>" -{" "}
                Showing {members.length === 0 ? 0 : page * pageSize + 1} to{" "}
                {Math.min((page + 1) * pageSize, totalMembers)} of {totalMembers} entries
              </>
            ) : (
              <>
                Showing {members.length === 0 ? 0 : page * pageSize + 1} to{" "}
                {Math.min((page + 1) * pageSize, totalMembers)} of {totalMembers} entries
              </>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {[
                    "Sr No.",
                    "Name",
                    "Member ID",
                    "Guardian Name",
                    "Mobile",
                    "Address",
                    "Registration Type",
                    "C.O.P No",
                    "Enrollment No",
                    "DOB",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {members.map((member, index) => (
                  <tr key={member.memberId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 border-r">{page * pageSize + index + 1}</td>
                    <td className="px-6 py-4 border-r">{member.name}</td>
                    <td className="px-6 py-4 border-r">{member.memberId}</td>
                    <td className="px-6 py-4 border-r">{member.guardianName}</td>
                    <td className="px-6 py-4 border-r">{member.mobile}</td>
                    <td className="px-6 py-4 border-r">{member.address}</td>
                    <td className="px-6 py-4 border-r">{member.registrationType}</td>
                    <td className="px-6 py-4 border-r">{member.registrationNo}</td>
                    <td className="px-6 py-4 border-r">{member.enNo}</td>
                    <td className="px-6 py-4 border-r">{member.dob || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              className="px-4 py-2 border rounded-md"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>

            <span className="text-sm">Page {page + 1} of {totalPages}</span>

            <button
              className="px-4 py-2 border rounded-md"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </PageWrapper>
  );
};

export default VoterTable;
