import { useState, useRef, useCallback, useEffect } from "react";
import ReactEasyCrop from "react-easy-crop";
import "./PhotoEditor.css";

function PhotoEditor({ imageSrc, onSave, onCancel }) {
  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(4 / 3);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  // UI state
  const [activeTab, setActiveTab] = useState("crop");
  const [isSaving, setIsSaving] = useState(false);

  // Annotation state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#FF0000");
  const [brushSize, setBrushSize] = useState(3);
  const [annotatedImage, setAnnotatedImage] = useState(imageSrc);
  const [showAnnotationCanvas, setShowAnnotationCanvas] = useState(false);

  // Get image dimensions on load
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setAspect(img.width / img.height);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Callback triggered when user finishes selecting crop area - stores pixel coordinates
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Extract the selected crop area from full image using canvas
  // Returns {blob, url} - blob for saving to server, url for preview in annotation tab
  const createCroppedImage = async (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous"; // Allow cross-origin image loading

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!pixelCrop) {
          reject(new Error("No crop area selected"));
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

      image.onerror = () => reject(new Error("Failed to load image"));
      image.src = imageSrc;
    });
  };

  // Apply crop selection and load result into annotation canvas for drawing
  const handleCropApply = async () => {
    if (!croppedAreaPixels) return;

    setIsSaving(true);
    try {
      const { blob, url } = await createCroppedImage(
        imageSrc,
        croppedAreaPixels
      );
      window.editedImageBlob = blob; // Store blob for final save
      setAnnotatedImage(url); // Store url for redrawing if annotations are cleared
      setShowAnnotationCanvas(true);

      // Load cropped image into canvas for drawing/annotations
      // Use setTimeout to ensure DOM is ready before drawing
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext("2d").drawImage(img, 0, 0);
        };
        img.src = url;
      }, 50);

      setActiveTab("annotate");
    } catch (error) {
      console.error("Crop failed:", error);
      alert("Failed to crop the image");
    } finally {
      setIsSaving(false);
    }
  };

  // Drawing handlers
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

  // Draw line as user moves mouse - continuously stroke from last position to current
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

  // Stop drawing when user releases mouse button
  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };
  // Add text annotation to canvas at fixed position using current color
  const handleAddText = () => {
    const text = prompt("Enter text:");
    if (!text) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.font = "20px Arial";
    ctx.fillStyle = drawingColor;
    ctx.fillText(text, 50, 50); // Fixed position for simplicityr;
    ctx.fillText(text, 50, 50);
  };
  // Clear all drawn annotations and reload the original cropped image
  const handleClearAnnotations = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = annotatedImage; // Use saved cropped image
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear all drawings
      ctx.drawImage(img, 0, 0); // Redraw clean images.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };
  // Save the final edited image - either with annotations or just the crop
  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
      let finalBlob = window.editedImageBlob; // Start with cropped image blob

      // If user added annotations, export canvas as blob instead
      if (showAnnotationCanvas && canvasRef.current) {
        await new Promise((resolve) => {
          canvasRef.current.toBlob((blob) => {
            finalBlob = blob; // Use annotated canvas
            resolve();
          }, "image/jpeg");
        });
      }

      onSave(finalBlob || imageSrc); // Send blob to parent for upload
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Free", value: undefined },
                      {
                        label: "Original",
                        value: imageDimensions.width / imageDimensions.height,
                      },
                      { label: "1:1", value: 1 },
                      { label: "4:3", value: 4 / 3 },
                      { label: "16:9", value: 16 / 9 },
                      { label: "3:4", value: 3 / 4 },
                      { label: "9:16", value: 9 / 16 },
                    ].map((ratio) => (
                      <button
                        key={ratio.label}
                        type="button"
                        onClick={() => setAspect(ratio.value)}
                        className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                          aspect === ratio.value
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-gray-300 hover:border-indigo-400"
                        }`}>
                        {ratio.label}
                      </button>
                    ))}
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
