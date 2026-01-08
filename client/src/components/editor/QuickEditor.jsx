import { useState, useRef, useEffect, useCallback } from "react";
import ReactEasyCrop from "react-easy-crop";
import { photosAPI } from "../../services/api";
import "./QuickEditor.css";

function QuickEditor({ imageSrc, photoId, onClose, onApply }) {
  const [activeTab, setActiveTab] = useState("crop");
  const canvasRef = useRef(null);
  const filterCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#FF0000");
  const [brushSize, setBrushSize] = useState(3);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [viewZoom, setViewZoom] = useState(1);

  // Crop states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [localImageUrl, setLocalImageUrl] = useState(null);
  const [displayImage, setDisplayImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [aspect, setAspect] = useState(4 / 3); // Default aspect ratio

  // Fetch image via proxy to avoid CORS issues
  useEffect(() => {
    let currentUrl = null;

    const fetchImage = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        // Use proxy endpoint if photoId is provided
        if (photoId) {
          const response = await photosAPI.getImageProxy(photoId);
          const localUrl = URL.createObjectURL(response.data);
          currentUrl = localUrl;
          setLocalImageUrl(localUrl);
          setDisplayImage(localUrl);
        } else if (imageSrc) {
          // For local files (blob URLs or data URLs), use directly
          if (imageSrc.startsWith("blob:") || imageSrc.startsWith("data:")) {
            setLocalImageUrl(imageSrc);
            setDisplayImage(imageSrc);
          } else {
            // Try direct fetch for other URLs
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            const localUrl = URL.createObjectURL(blob);
            currentUrl = localUrl;
            setLocalImageUrl(localUrl);
            setDisplayImage(localUrl);
          }
        }
      } catch (error) {
        console.error("Failed to fetch image:", error);
        setLoadError("Failed to load image for editing. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();

    // Cleanup blob URL on unmount or when imageSrc/photoId changes
    return () => {
      if (currentUrl && currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [imageSrc, photoId]);

  // Load image dimensions and set natural aspect ratio
  useEffect(() => {
    if (!localImageUrl) return;

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      // Set initial aspect ratio based on image's natural dimensions
      setAspect(img.width / img.height);
    };
    img.src = localImageUrl;
  }, [localImageUrl]);

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !displayImage) return;

    const img = new Image();

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      // Draw scaled to contain within canvas size if styles apply
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    };

    img.onerror = (e) => {
      console.error("Failed to load image for canvas:", e);
    };

    img.src = displayImage;
  }, [displayImage]);

  const initializeFilterCanvas = useCallback(() => {
    const canvas = filterCanvasRef.current;
    if (!canvas || !displayImage) return;

    const img = new Image();

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    };

    img.onerror = (e) => {
      console.error("Failed to load image for filter canvas:", e);
    };

    img.src = displayImage;
  }, [displayImage]);

  // Initialize canvas when switching to annotate tab
  useEffect(() => {
    if (activeTab === "annotate" && displayImage) {
      initializeCanvas();
    }
  }, [activeTab, displayImage, initializeCanvas]);

  // Initialize filter canvas when switching to filters tab
  useEffect(() => {
    if (activeTab === "filters" && displayImage) {
      initializeFilterCanvas();
    }
  }, [activeTab, displayImage, initializeFilterCanvas]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create cropped image from canvas
  const createCroppedImage = useCallback(async () => {
    if (!croppedAreaPixels || !localImageUrl) return null;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        ctx.drawImage(
          img,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          "image/jpeg",
          0.95
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = localImageUrl;
    });
  }, [croppedAreaPixels, localImageUrl]);

  const handleCropApply = async () => {
    if (!croppedAreaPixels) {
      alert("Please select an area to crop");
      return;
    }

    setIsProcessing(true);

    try {
      const croppedUrl = await createCroppedImage();
      if (croppedUrl) {
        setDisplayImage(croppedUrl);
        setActiveTab("annotate");
      }
    } catch (error) {
      console.error("Crop failed:", error);
      alert("Failed to crop image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");

    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");

    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  // Touch event handlers for mobile support
  const handleCanvasTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleCanvasTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleCanvasTouchEnd = () => {
    handleCanvasMouseUp();
  };

  const handleAddText = () => {
    const text = prompt("Enter text:");
    if (!text) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.font = "40px Arial";
    ctx.fillStyle = drawingColor;
    ctx.textBaseline = "top";
    ctx.fillText(text, 20, 20);
  };

  const handleClearCanvas = () => {
    initializeCanvas();
  };

  const applyFilters = () => {
    const canvas = filterCanvasRef.current;
    if (!canvas) return;

    // First reinitialize canvas with original image
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Apply filters
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Brightness
        let r = data[i] * (brightness / 100);
        let g = data[i + 1] * (brightness / 100);
        let b = data[i + 2] * (brightness / 100);

        // Contrast
        const contrastFactor = contrast / 100;
        r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;

        // Saturation
        const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
        const satFactor = saturation / 100;
        r = gray + satFactor * (r - gray);
        g = gray + satFactor * (g - gray);
        b = gray + satFactor * (b - gray);

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }

      ctx.putImageData(imgData, 0, 0);
    };
    img.src = displayImage;
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    initializeFilterCanvas();
  };

  const notifySaved = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1600);
  };

  const handleSave = async () => {
    // If on crop tab, create cropped image directly
    if (activeTab === "crop") {
      if (!croppedAreaPixels) {
        alert("Please select an area to crop first");
        return;
      }
      setIsProcessing(true);
      try {
        const croppedUrl = await createCroppedImage();
        if (croppedUrl) {
          // Convert blob URL to blob
          const response = await fetch(croppedUrl);
          const blob = await response.blob();
          URL.revokeObjectURL(croppedUrl);
          await Promise.resolve(onApply(blob));
          notifySaved();
        }
      } catch (error) {
        console.error("Save failed:", error);
        alert("Failed to save cropped image");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // For annotate and filters tabs, use canvas
    const canvas =
      activeTab === "filters" ? filterCanvasRef.current : canvasRef.current;
    if (!canvas) {
      alert("No edits to save");
      return;
    }

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          try {
            await Promise.resolve(onApply(blob));
            notifySaved();
          } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save image");
          }
        } else {
          alert("Failed to save image");
        }
      },
      "image/jpeg",
      0.95
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Failed to Load Image
          </h3>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.18),transparent_25%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.16),transparent_25%)] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.18)] w-full max-w-2xl sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200/80 p-3 sm:p-4 flex justify-between items-center gap-2 bg-linear-to-r from-white via-white to-indigo-50/40">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">
              QE
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold leading-tight">
                Quick Edit
              </h2>
              <p className="text-xs text-gray-500">
                Crop, annotate, and enhance your photo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl shrink-0">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab("crop")}
            className={`flex-1 min-w-max py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-base transition-colors whitespace-nowrap ${
              activeTab === "crop"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            ✂️ Crop
          </button>
          <button
            onClick={() => setActiveTab("annotate")}
            className={`flex-1 min-w-max py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-base transition-colors whitespace-nowrap ${
              activeTab === "annotate"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            🖌️ Draw & Annotate
          </button>
          <button
            onClick={() => setActiveTab("filters")}
            className={`flex-1 min-w-max py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-base transition-colors whitespace-nowrap ${
              activeTab === "filters"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            🎨 Filters
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 sm:p-6">
          {showSaved && (
            <div className="mb-3 w-full animate-fade-in">
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-linear-to-r from-green-50 to-emerald-50 px-3 py-2 text-sm text-green-700 shadow-sm">
                <span role="img" aria-label="success">
                  ✅
                </span>
                <span>Image saved successfully.</span>
              </div>
            </div>
          )}

          {activeTab === "crop" && localImageUrl && (
            <div className="space-y-4">
              <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gray-100 rounded-lg overflow-hidden">
                <ReactEasyCrop
                  image={localImageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={true}
                  objectFit="contain"
                />
              </div>

              <div className="space-y-4">
                {/* Aspect Ratio Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAspect(undefined)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        aspect === undefined
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-300 hover:border-indigo-400"
                      }`}>
                      Free
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAspect(
                          imageDimensions.width / imageDimensions.height
                        )
                      }
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        aspect ===
                        imageDimensions.width / imageDimensions.height
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-300 hover:border-indigo-400"
                      }`}>
                      Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspect(1)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        aspect === 1
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-300 hover:border-indigo-400"
                      }`}>
                      1:1
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspect(4 / 3)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        aspect === 4 / 3
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-300 hover:border-indigo-400"
                      }`}>
                      4:3
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspect(16 / 9)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        aspect === 16 / 9
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-300 hover:border-indigo-400"
                      }`}>
                      16:9
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspect(3 / 4)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        aspect === 3 / 4
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-300 hover:border-indigo-400"
                      }`}>
                      3:4
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspect(9 / 16)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        aspect === 9 / 16
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-300 hover:border-indigo-400"
                      }`}>
                      9:16
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoom ({zoom.toFixed(1)}x)
                  </label>
                  <input
                    type="range"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    min={1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "annotate" && displayImage && (
            <div className="space-y-4">
              <div className="qe-canvas-wrap">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onTouchStart={handleCanvasTouchStart}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasTouchEnd}
                  className="qe-canvas cursor-crosshair"
                  style={{
                    maxHeight: "420px",
                    transform: `scale(${viewZoom})`,
                    transformOrigin: "top left",
                    touchAction: "none",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  View Zoom ({viewZoom.toFixed(1)}x)
                </label>
                <input
                  type="range"
                  value={viewZoom}
                  onChange={(e) => setViewZoom(parseFloat(e.target.value))}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Drawing controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={drawingColor}
                    onChange={(e) => setDrawingColor(e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brush ({brushSize}px)
                  </label>
                  <input
                    type="range"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={handleAddText}
                  className="self-end bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  Add Text
                </button>

                <button
                  onClick={handleClearCanvas}
                  className="self-end bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  Clear
                </button>
              </div>
            </div>
          )}

          {activeTab === "filters" && displayImage && (
            <div className="space-y-6">
              {/* Canvas for filter preview */}
              <div className="qe-canvas-wrap">
                <canvas
                  ref={filterCanvasRef}
                  className="qe-canvas"
                  style={{
                    maxHeight: "360px",
                    transform: `scale(${viewZoom})`,
                    transformOrigin: "top left",
                    touchAction: "none",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  View Zoom ({viewZoom.toFixed(1)}x)
                </label>
                <input
                  type="range"
                  value={viewZoom}
                  onChange={(e) => setViewZoom(parseFloat(e.target.value))}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brightness: {brightness}%
                </label>
                <input
                  type="range"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  min={50}
                  max={150}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contrast: {contrast}%
                </label>
                <input
                  type="range"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  min={50}
                  max={150}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saturation: {saturation}%
                </label>
                <input
                  type="range"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  min={0}
                  max={200}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={resetFilters}
                  className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors bg-white">
                  Reset to Original
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors">
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-3 sm:p-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg font-medium text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            Cancel
          </button>
          {activeTab === "crop" && (
            <>
              <button
                onClick={handleCropApply}
                disabled={isProcessing}
                className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm sm:text-base hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {isProcessing ? "Processing..." : "Apply Crop & Edit More"}
              </button>
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg font-medium text-sm sm:text-base hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {isProcessing ? "Saving..." : "Save Crop"}
              </button>
            </>
          )}
          {(activeTab === "annotate" || activeTab === "filters") && (
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg font-medium text-sm sm:text-base hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {isProcessing ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickEditor;
