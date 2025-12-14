import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { authAPI } from "../services/api";
import { photosAPI } from "../services/api";

function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [avatarAnim, setAvatarAnim] = useState(false);
  const [usage, setUsage] = useState({
    usedBytes: 0,
    totalBytes: 1 * 1024 * 1024 * 1024,
  });
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [storagePhotos, setStoragePhotos] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authAPI.getStorageUsage();
        setUsage(res.data);
      } catch {
        // fallback silently
      }
    })();
  }, []);

  const totalStorageMB = Math.round(usage.totalBytes / (1024 * 1024));
  const usedStorageMB = Math.round(usage.usedBytes / (1024 * 1024));
  const percent = Math.min(
    100,
    Math.round((usage.usedBytes / usage.totalBytes) * 100)
  );

  const handleManageStorage = async () => {
    try {
      const res = await photosAPI.getAll();
      setStoragePhotos(res.data.photos);
      setShowStorageModal(true);
    } catch {
      alert("Failed to load storage data");
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await photosAPI.getExport();
      const photos = res.data.photos;
      const csv = [
        ["Title", "Description", "Size (MB)", "Uploaded Date", "URL"].join(","),
        ...photos.map((p) =>
          [
            `"${p.title}"`,
            `"${p.description || ""}"`,
            (p.size / (1024 * 1024)).toFixed(2),
            new Date(p.createdAt).toLocaleDateString(),
            p.blobUrl,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ShutterSaga_Export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      await photosAPI.delete(photoId);
      setStoragePhotos((prev) => prev.filter((p) => p._id !== photoId));
      setUsage((prev) => ({
        ...prev,
        usedBytes:
          prev.usedBytes - storagePhotos.find((p) => p._id === photoId)?.size ||
          0,
      }));
    } catch {
      alert("Failed to delete photo");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20 sm:pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-[0_8px_32px_rgba(99,102,241,0.15)] p-5 sm:p-8 border border-indigo-200/20">
          <h1 className="m-0 text-xl sm:text-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400 bg-clip-text text-transparent">
            Profile
          </h1>

          <div className="mt-4 flex items-center gap-3 sm:gap-4">
            <div
              className={`${
                avatarAnim ? "animate-pulse" : ""
              } w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md overflow-hidden cursor-pointer`}>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full cursor-pointer"
                />
              ) : (
                <span className="cursor-pointer">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400 bg-clip-text text-transparent">
                {user?.username}
              </div>
              <div className="text-slate-500 text-sm sm:text-base">
                {user?.email}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="relative inline-block cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  setMessage("");
                  try {
                    const fd = new FormData();
                    fd.append("avatar", file);
                    await authAPI.updateAvatar(fd);
                    setMessage("Avatar updated.");
                    await refreshUser();
                    setAvatarAnim(true);
                    setTimeout(() => setAvatarAnim(false), 600);
                  } catch {
                    setMessage("Failed to update avatar.");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <span className="inline-block px-4 py-2 rounded-lg border-2 border-indigo-500 text-indigo-600 bg-white font-semibold transition-all cursor-pointer hover:bg-gradient-to-r hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400 hover:text-white hover:shadow-md">
                {uploading ? "Updating..." : "Change Avatar"}
              </span>
            </label>
            {message && <div className="mt-2 text-slate-500">{message}</div>}
          </div>

          <h2 className="mt-8 text-xl font-semibold text-gray-800">
            Storage Usage
          </h2>
          <div className="bg-gradient-to-br from-indigo-500/10 to-pink-400/10 rounded-xl h-4 overflow-hidden mt-3 border border-indigo-500/20">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400 shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 text-slate-600">
            {usedStorageMB} MB used of {Math.round(totalStorageMB / 1024)} GB
          </div>

          <div className="flex gap-3 mt-5">
            <button
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400 text-white font-semibold shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
              onClick={handleManageStorage}>
              Manage Storage
            </button>
            <button
              className="px-4 py-2.5 rounded-xl border-2 border-indigo-500 bg-white text-indigo-600 font-semibold transition-all hover:bg-indigo-50 hover:shadow-md"
              onClick={handleExportData}
              disabled={exporting}>
              {exporting ? "Exporting..." : "Export Data"}
            </button>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800">
              Import from Google Drive
            </h2>
            <p className="text-gray-600 mt-1">
              Connect and import photos in a future update.
            </p>
            <button
              className="mt-3 px-4 py-2.5 rounded-xl border-2 border-indigo-500 bg-white text-indigo-600 font-semibold transition-all hover:bg-gradient-to-r hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400 hover:text-white hover:shadow-md"
              onClick={() => setShowDriveModal(true)}>
              Import from Google Drive{" "}
              <span className="ml-1 text-xs bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                β
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Storage Management Modal */}
      {showStorageModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowStorageModal(false)}>
          <div
            className="bg-white rounded-2xl w-[90%] max-w-xl max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400 bg-clip-text text-transparent">
                Manage Storage
              </h3>
              <button
                className="text-2xl text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowStorageModal(false)}>
                ✕
              </button>
            </div>
            <div className="p-5">
              {storagePhotos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No photos stored
                </p>
              ) : (
                storagePhotos.map((photo) => (
                  <div
                    key={photo._id}
                    className="flex gap-3 items-center p-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg mb-2 transition-colors">
                    <img
                      src={photo.blobUrl}
                      alt={photo.title}
                      className="w-14 h-14 object-cover rounded-lg shadow-sm"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {photo.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(photo.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      className="text-xl hover:scale-110 transition-transform"
                      onClick={() => handleDeletePhoto(photo._id)}>
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Modal */}
      {showDriveModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowDriveModal(false)}>
          <div
            className="bg-white rounded-2xl w-[90%] max-w-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400 bg-clip-text text-transparent">
                Import from Google Drive
              </h3>
              <button
                className="text-2xl text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowDriveModal(false)}>
                ✕
              </button>
            </div>
            <div className="p-5">
              <div className="inline-block bg-yellow-50 border-2 border-yellow-400 rounded-xl px-3 py-2 mb-4 font-semibold text-amber-800">
                🚧 Under Development
              </div>
              <p className="text-gray-700 mb-2">
                This feature is coming soon! We're working on integrating Google
                Drive to make importing your photos seamless.
              </p>
              <p className="text-gray-600">
                In the meantime, you can upload photos directly using the Upload
                page.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
