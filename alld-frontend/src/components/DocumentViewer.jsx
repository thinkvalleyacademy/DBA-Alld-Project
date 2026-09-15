import { X, Download, Maximize2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getFileServerBaseUrl } from "../constants/fileServer";

const FILE_SERVER_URL = getFileServerBaseUrl();

const DocumentViewer = ({ isOpen, onClose, documentPath, documentName }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !documentPath) {
      return;
    }

    let isMounted = true;
    let currentBlobUrl = null;

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken");
        const fullUrl = `${FILE_SERVER_URL}/${documentPath}`;

        const response = await fetch(fullUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status}`);
        }

        const blob = await response.blob();
        currentBlobUrl = URL.createObjectURL(blob);

        if (isMounted) {
          setBlobUrl(currentBlobUrl);
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDocument();

    return () => {
      isMounted = false;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [isOpen, documentPath]);

  if (!isOpen || !documentPath) return null;

  const fileExtension = documentPath.split(".").pop().toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension);
  const isPdf = fileExtension === "pdf";

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const fullUrl = `${FILE_SERVER_URL}/${documentPath}`;
      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = documentName || "document";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] ${isFullscreen ? "p-0" : "p-4"}`}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col ${isFullscreen ? "w-full h-full" : "w-full max-w-4xl max-h-[90vh]"}`}
      >
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">
              {documentName || "Document"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              disabled={loading}
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white disabled:opacity-50"
              title="Download document"
              disabled={loading}
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading document...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">
                Error loading document: {error}
              </p>
              <button
                onClick={handleDownload}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Try Downloading Instead
              </button>
            </div>
          ) : blobUrl ? (
            isImage ? (
              <img
                src={blobUrl}
                alt={documentName}
                className="max-w-full max-h-full object-contain p-4"
              />
            ) : isPdf ? (
              <iframe
                src={blobUrl}
                title={documentName}
                className="w-full h-full border-none"
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Unable to preview this file type
                </p>
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Download File
                </button>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No document loaded
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
