import { useState } from "react";
import { photosAPI } from "../services/api";

function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [defaultCaption, setDefaultCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setSelectedFiles(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
    setMessage({ type: "", text: "" });
  }

  function clearSelectedFile() {
    setSelectedFiles([]);
    setPreviews([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedFiles.length) {
      setMessage({ type: "error", text: "Please select photos to upload" });
      return;
    }

    if (!title.trim()) {
      setMessage({ type: "error", text: "Please give your photo a title" });
      return;
    }

    setIsUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("photos", file));
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("defaultCaption", defaultCaption.trim());

      await photosAPI.upload(formData);

      setMessage({ type: "success", text: "Photos uploaded successfully! 🎉" });
      setSelectedFiles([]);
      setPreviews([]);
      setTitle("");
      setDescription("");
      setDefaultCaption("");
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to upload photos. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20 sm:pb-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-gray-200">
          <h1 className="m-0 text-2xl sm:text-3xl font-bold bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Upload Photos
          </h1>
          <p className="text-gray-500 mt-2 mb-6 sm:mb-8 text-sm sm:text-base">
            Share your beautiful moments with the world
          </p>

          {message.text && (
            <div
              className={`${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : message.type === "error"
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200"
              } p-4 rounded-xl mb-6 text-center font-medium`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              {previews.length ? (
                <div>
                  <div className="grid grid-cols-3 gap-3">
                    {previews.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-xl border border-gray-200 shadow-md"
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium transition-all hover:bg-red-50 hover:text-red-600 hover:cursor-pointer border border-gray-200">
                    Clear all
                  </button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-purple-300 rounded-2xl px-5 py-16 text-center transition-all flex flex-col items-center gap-3 bg-purple-50/50 hover:border-purple-500 hover:bg-purple-50 group">
                    <span className="text-6xl group-hover:scale-110 transition-transform">
                      📤
                    </span>
                    <span className="text-gray-700 font-semibold text-lg">
                      Click to select images
                    </span>
                    <span className="text-sm text-gray-500">
                      JPEG, PNG, GIF, WebP (max 10MB each)
                    </span>
                  </div>
                </label>
              )}
            </div>

            <div className="mb-5">
              <label
                htmlFor="title"
                className="block mb-2 text-gray-700 font-medium">
                Title <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your photo a title"
                required
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>

            <div className="mb-5">
              <label
                htmlFor="description"
                className="block mb-2 text-gray-700 font-medium">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)"
                rows={3}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all resize-y min-h-25"
              />
            </div>

            <div className="mb-8">
              <label
                htmlFor="defaultCaption"
                className="block mb-2 text-gray-700 font-medium">
                Default caption for batch
              </label>
              <input
                type="text"
                id="defaultCaption"
                value={defaultCaption}
                onChange={(e) => setDefaultCaption(e.target.value)}
                placeholder="Optional caption applied to all selected photos"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-4 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl text-base font-semibold shadow-lg shadow-purple-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-300 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              disabled={isUploading || !selectedFiles.length}>
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Uploading...
                </span>
              ) : (
                "Upload Photos"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
