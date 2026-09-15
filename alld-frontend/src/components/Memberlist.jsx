import { useCallback, useEffect, useState, useRef } from "react";
import { SquareCheckBig, ThumbsUp, List, Download, FileSpreadsheet, X, AlertCircle, CheckCircle } from "lucide-react";
import IconButton from "./IconButton";
import PageWrapper from "../utility/PageWrapper";
import apiService from "./apiService";
import { getMemberStatusMeta } from "../utility/memberStatus";

const MemberList = ({ memberType = 1, title = "Member List" }) => {
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [exportError, setExportError] = useState(null);
  const pageSize = 10;
  
  // Prevent duplicate export requests
  const exportInProgressRef = useRef(false);

  const fetchMembers = useCallback(async (pageNumber = 0) => {
    try {
      const response = await apiService.memberList({
        page: pageNumber,
        size: pageSize,
        memberType
      });

      const data = response.data.data;
      setMembers(data.members || []);
      setTotalMembers(data.totalMembers || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  }, [memberType, pageSize]);

  const handleDownloadClick = () => {
    if (totalMembers === 0) return;
    setShowConfirmModal(true);
  };

  /**
   * Optimized server-side Excel export
   * Downloads Excel file directly from backend (Apache POI with streaming)
   */
  const downloadExcel = async () => {
    if (exportInProgressRef.current) {
      console.warn('Export already in progress, ignoring duplicate request');
      return;
    }

    setShowConfirmModal(false);
    setIsDownloading(true);
    setDownloadProgress(0);
    setExportError(null);
    exportInProgressRef.current = true;

    try {
      // Use server-side Excel export - much faster for large datasets
      const response = await apiService.exportMembersToExcel({
        memberType
      }, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(percentCompleted);
          }
        }
      });

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Members_${memberType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadedCount(totalMembers);
      setShowSuccessModal(true);

    } catch (error) {
      console.error("Error downloading Excel:", error);
      setExportError(error.message || 'Failed to download Excel');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      exportInProgressRef.current = false;
    }
  };

  useEffect(() => {
    fetchMembers(page);
  }, [fetchMembers, page]);

  // Confirmation Modal Component
  const ConfirmModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowConfirmModal(false)}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Export to Excel</h3>
              <p className="text-green-100 text-sm">Download member data</p>
            </div>
          </div>
        </div>

        {/* Body */}
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
                This will export all member data to an Excel file (.xlsx)
              </p>
            </div>
          </div>

          {/* Info box */}
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

          {/* Data preview */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-2">Included Fields</p>
            <div className="flex flex-wrap gap-2">
              {["Name", "Father Name", "COP No.", "Enrollment No.", "Reg. Type", "Address", "City", "Mobile", "Membership Date", "Subscription", "Voter"].map((field) => (
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

        {/* Footer */}
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

  // Success Modal Component
  const SuccessModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowSuccessModal(false)}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden transform transition-all">
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

  // Downloading Progress Overlay
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
                style={{ color: '#10B981' }}
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
            Generating Excel File
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Server is processing {totalMembers.toLocaleString()} records...
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {downloadProgress > 0 ? `${downloadProgress}% complete` : 'Starting download...'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            This may take a few moments for large datasets
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <PageWrapper>
      {/* Modals */}
      {showConfirmModal && <ConfirmModal />}
      {showSuccessModal && <SuccessModal />}
      {isDownloading && <DownloadingOverlay />}

      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        <h1 className="flex items-center text-xl font-semibold gap-2">
          <List className="w-5 h-5" />
          {title}
        </h1>

        <div className="flex items-center gap-3">
          {/* Enhanced Download Excel Button */}
          <button
            type="button"
            onClick={handleDownloadClick}
            disabled={isDownloading || totalMembers === 0}
            className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-green-500/25"
          >
            <FileSpreadsheet className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Export Excel</span>
            <span className="px-2 py-0.5 bg-white/20 rounded-md text-xs font-semibold">
              {totalMembers.toLocaleString()}
            </span>
          </button>

            <button
              type="button"
              onClick={() => window.open(`/welfare/list/download?memberType=${memberType}`, "_blank")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              <Download className="w-4 h-4" />
              Download List
            </button>
        
        </div>
      </div>

      {/* Entries info */}
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Showing {members.length === 0 ? 0 : page * pageSize + 1} to{" "}
        {Math.min((page + 1) * pageSize, totalMembers)} of {totalMembers} entries
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              {[
                "Sr No.",
                "Name",
                "Member ID",
                "Guardian Name",
                "Registration Type",
                "Registration No",
                "Status",
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
              <tr
                key={member.memberId}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {page * pageSize + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {member.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {member.memberId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {member.guardianName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {member.registrationType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {member.registrationNo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {(() => {
                    const statusMeta = getMemberStatusMeta(member.status);
                    const statusIcon =
                      statusMeta.status === "ACTIVE" ? SquareCheckBig : ThumbsUp;

                    return (
                      <IconButton
                        title={statusMeta.iconButtonTitle}
                        icon={statusIcon}
                        backgroundColor={statusMeta.iconButtonBackgroundColor}
                        hoverColor={statusMeta.iconButtonHoverColor}
                      />
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 gap-4 text-gray-900 dark:text-gray-100">
        <button
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span className="px-2 py-2 text-sm font-medium">
          Page {page + 1} of {totalPages}
        </span>
        <button
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </PageWrapper>
  );
};

export default MemberList;
