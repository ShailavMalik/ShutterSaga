import { useState, useRef, useCallback, useEffect } from "react";
import ReactEasyCrop from "react-easy-crop";
import "./PhotoEditor.css";

function PhotoEditor({ imageSrc, onSave, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [activeTab, setActiveTab] = useState("crop"); // crop, annotate
  const [isSaving, setIsSaving] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [aspect, setAspect] = useState(4 / 3); // Default aspect ratio

  // Annotation states
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#FF0000");
  const [brushSize, setBrushSize] = useState(3);
  const [annotatedImage, setAnnotatedImage] = useState(imageSrc);
  const [showAnnotationCanvas, setShowAnnotationCanvas] = useState(false);

  // Load image dimensions and set natural aspect ratio
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      // Set initial aspect ratio based on image's natural dimensions
      setAspect(img.width / img.height);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create canvas image from blob for cropping
  const createCroppedImage = async (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!pixelCrop) {
          reject(new Error("No crop area defined"));
          return;
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve({ blob, url });
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          "image/jpeg",
          0.95
        );
      };

      image.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      image.src = imageSrc;
    });
  };

  const handleCropApply = async () => {
    if (!croppedAreaPixels) {
      console.error("No crop area defined");
      return;
    }

    setIsSaving(true);
    try {
      const { blob, url } = await createCroppedImage(
        imageSrc,
        croppedAreaPixels
      );

      // Store blob for later use
      window.editedImageBlob = blob;
      setAnnotatedImage(url);
      setShowAnnotationCanvas(true);
      setActiveTab("annotate");

      // Initialize canvas with the cropped image after state updates
      requestAnimationFrame(() => {
        setTimeout(() => {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
            };
            img.onerror = (err) => {
              console.error("Failed to load cropped image for canvas:", err);
            };
            img.src = url;
          }
        }, 50);
      });
    } catch (error) {
      console.error("Cropping failed:", error);
      alert("Failed to crop the image. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Annotation canvas handlers
  const handleCanvasMouseDown = (e) => {
    if (activeTab !== "annotate") return;
    const canvas = canvasRef.current;
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
    if (!isDrawing || activeTab !== "annotate") return;
    const canvas = canvasRef.current;
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

  const initializeAnnotationCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !annotatedImage) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = annotatedImage;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const handleAddText = () => {
    const text = prompt("Enter text:");
    if (!text) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.font = "20px Arial";
    ctx.fillStyle = drawingColor;
    ctx.fillText(text, 50, 50);
  };

  const handleClearAnnotations = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = annotatedImage;

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
      let finalBlob = window.editedImageBlob;

      // If annotations were made, export from canvas
      if (showAnnotationCanvas && canvasRef.current) {
        await new Promise((resolve) => {
          canvasRef.current.toBlob((blob) => {
            finalBlob = blob;
            resolve();
          }, "image/jpeg");
        });
      }

      onSave(finalBlob || imageSrc);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Photo</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("crop")}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === "crop"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            ✂️ Crop
          </button>
          <button
            onClick={() => setActiveTab("annotate")}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === "annotate"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            🖌️ Annotate
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === "crop" && (
            <div className="p-6">
              <div className="relative w-full h-96">
                <ReactEasyCrop
                  image={imageSrc}
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

              <div className="mt-6 space-y-4">
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
                    Zoom
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

          {activeTab === "annotate" && (
            <div className="p-6">
              {showAnnotationCanvas ? (
                <div className="space-y-4">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    className="w-full border border-gray-300 rounded-lg cursor-crosshair bg-white"
                    style={{ maxHeight: "400px" }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                        Brush Size
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
                      onClick={handleClearAnnotations}
                      className="self-end bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    First, crop your image to proceed with annotations
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>

          {activeTab === "crop" && (
            <button
              onClick={handleCropApply}
              disabled={isSaving || !croppedAreaPixels}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {isSaving ? "Processing..." : "Apply Crop"}
            </button>
          )}

          {activeTab === "annotate" && (
            <button
              onClick={handleFinalSave}
              disabled={isSaving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
              {isSaving ? "Saving..." : "Save & Upload"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoEditor;
