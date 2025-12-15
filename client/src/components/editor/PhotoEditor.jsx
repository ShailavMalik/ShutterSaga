import { useState, useRef, useCallback } from "react";
import ReactEasyCrop from "react-easy-crop";
import "./PhotoEditor.css";

function PhotoEditor({ imageSrc, onSave, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [activeTab, setActiveTab] = useState("crop"); // crop, annotate
  const [isSaving, setIsSaving] = useState(false);

  // Annotation states
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#FF0000");
  const [brushSize, setBrushSize] = useState(3);
  const [annotatedImage, setAnnotatedImage] = useState(imageSrc);
  const [showAnnotationCanvas, setShowAnnotationCanvas] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create canvas image from blob for cropping
  const createCroppedImage = async (imageSrc, crop) => {
    const image = new Image();
    image.src = imageSrc;

    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          resolve({ blob, url });
        }, "image/jpeg");
      };
    });
  };

  const handleCropApply = async () => {
    setIsSaving(true);
    try {
      const { blob, url } = await createCroppedImage(
        imageSrc,
        croppedAreaPixels
      );
      setAnnotatedImage(url);
      setActiveTab("annotate");
      setShowAnnotationCanvas(true);
      // Store blob for later use
      window.editedImageBlob = blob;
    } catch (error) {
      console.error("Cropping failed:", error);
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

  const initializeAnnotationCanvas = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.target) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = e.target.src;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
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
                  aspect={4 / 3}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={true}
                />
              </div>

              <div className="mt-6 space-y-4">
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
              disabled={isSaving}
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
