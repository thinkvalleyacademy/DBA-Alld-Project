import React, { useEffect, useState } from "react";
import apiService from "../../../components/apiService";
import publicApiService from "../../../components/publicApiService";

const buildImageUrl = (notice) => {
  const baseUrl = notice.imageUrl || (notice.imagePath ? `/dba-alld/files/${notice.imagePath}` : "");
  if (!baseUrl) return "";
  const version = notice.cacheVersion || "";
  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
};

function PublicNoticeManager() {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [notices, setNotices] = useState([]);

  const loadNotices = async () => {
    setIsLoading(true);
    try {
      const response = await publicApiService.getPublicNoticeImages();
      const rows = response?.data?.data || [];
      setNotices(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setStatus({ type: "error", message: "Failed to load current notices." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!name.trim()) {
      setStatus({ type: "error", message: "Image name is required." });
      return;
    }

    if (!imageFile) {
      setStatus({ type: "error", message: "Please select an image file." });
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("image", imageFile);

    setIsSubmitting(true);
    try {
      await apiService.uploadPublicNoticeImage(formData);
      setStatus({ type: "success", message: "Image uploaded successfully." });
      setName("");
      setImageFile(null);
      const fileInput = document.getElementById("public-notice-image-input");
      if (fileInput) fileInput.value = "";
      await loadNotices();
    } catch (error) {
      const message = error?.response?.data?.message || "Upload failed. Please try again.";
      setStatus({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, noticeName) => {
    const confirmDelete = window.confirm(`Delete "${noticeName || "this notice image"}"?`);
    if (!confirmDelete) return;

    setStatus({ type: "", message: "" });
    setDeletingId(id);
    try {
      await apiService.deletePublicNoticeImage(id);
      setStatus({ type: "success", message: "Image deleted successfully." });
      await loadNotices();
    } catch (error) {
      const message = error?.response?.data?.message || "Delete failed. Please try again.";
      setStatus({ type: "error", message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearCache = async () => {
    const confirmClear = window.confirm("Clear server cache now?");
    if (!confirmClear) return;

    setStatus({ type: "", message: "" });
    setClearingCache(true);
    try {
      await apiService.clearServerCache();
      setStatus({ type: "success", message: "Server cache cleared." });
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to clear server cache.";
      setStatus({ type: "error", message });
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-800">Public Notice Images</h1>
        <p className="text-sm text-gray-600 mt-1">
          Upload named images that will be shown on the public landing page.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Image Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Example: Election Notice March 2026"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Select Image</label>
            <input
              id="public-notice-image-input"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-cyan-700 disabled:opacity-60"
            >
              {isSubmitting ? "Uploading..." : "Upload Notice Image"}
            </button>
            <button
              type="button"
              onClick={handleClearCache}
              disabled={clearingCache}
              className="bg-gray-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
            >
              {clearingCache ? "Clearing..." : "Clear Cache"}
            </button>
            {status.message && (
              <span className={`text-sm ${status.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {status.message}
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Uploaded Images</h2>
        {isLoading ? (
          <p className="text-sm text-gray-600 mt-3">Loading...</p>
        ) : notices.length === 0 ? (
          <p className="text-sm text-gray-600 mt-3">No images uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {notices.map((notice) => (
              <div key={notice.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={buildImageUrl(notice)}
                  alt={notice.name || "Public notice"}
                  className="w-full h-44 object-cover"
                  loading="lazy"
                />
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-800">{notice.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {notice.createdDate ? new Date(notice.createdDate).toLocaleString() : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDelete(notice.id, notice.name)}
                    disabled={deletingId === notice.id}
                    className="mt-3 w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deletingId === notice.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicNoticeManager;
