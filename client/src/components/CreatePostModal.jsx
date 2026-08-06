import { useState, useContext, useRef, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Cropper from "react-easy-crop";

// --- Helper function to extract the cropped image ---
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

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

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Canvas is empty");
        return;
      }
      blob.name = "cropped.jpeg";
      resolve(blob);
    }, "image/jpeg");
  });
}
// ----------------------------------------------------

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Other");
  const [rating, setRating] = useState(5);
  const [visibility, setVisibility] = useState("PUBLIC");
  
  // Cropper State
  const [imageSrc, setImageSrc] = useState(null); 
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  
  // Final Form State
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const categories = ["Food", "Places", "Music", "Entertainment", "Other"];

  // Reset entirely when closing
  const handleClose = () => {
    setCaption("");
    setCategory("Other");
    setRating(5);
    setVisibility("PUBLIC");
    setImageSrc(null);
    setImageFile(null);
    setImagePreview(null);
    setIsCropping(false);
    setError("");
    onClose();
  };

  // ALL HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result);
        setIsCropping(true); 
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropImage = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      setImageFile(croppedBlob); 
      setImagePreview(URL.createObjectURL(croppedBlob)); 
      setIsCropping(false); 
    } catch (e) {
      console.error(e);
      setError("Failed to crop image.");
    }
  };

  const handleRatingClick = (starValue) => {
    if (rating === starValue) {
      setRating(starValue - 0.5);
    } else {
      setRating(starValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError("Please select an image.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("category", category);
    formData.append("authorRating", rating);
    formData.append("visibility", visibility);
    formData.append("image", imageFile);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/posts`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      });

      setLoading(false);
      onPostCreated();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating moment.");
      setLoading(false);
    }
  };

  // --- EARLY RETURN MOVED DOWN HERE ---
  if (!isOpen) return null;
  // ------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-moboxd-bg border border-[#2A2A35] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A35]">
          <h2 className="text-lg font-bold text-white">
            {isCropping ? "Crop Image" : "Create New Moment"}
          </h2>
          <button
            onClick={isCropping ? () => setIsCropping(false) : handleClose}
            className="text-moboxd-muted hover:text-white transition-colors cursor-pointer"
          >
            <i className={isCropping ? "bi bi-arrow-left" : "bi bi-x-lg"}></i>
          </button>
        </div>

        {/* --- CROPPER VIEW --- */}
        {isCropping ? (
          <div className="flex flex-col h-[500px]">
            <div className="relative flex-1 w-full bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 5} 
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-4 bg-[#1A1A21] border-t border-[#2A2A35]">
              <button
                onClick={handleCropImage}
                className="w-full bg-moboxd-accent hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors"
              >
                Done Cropping
              </button>
            </div>
          </div>
        ) : (
          /* --- FORM VIEW --- */
          <>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <form id="createForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Image Upload Zone */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className={`w-full aspect-[4/5] max-h-[400px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden mx-auto ${
                      imagePreview 
                        ? "border-[#2A2A35]" 
                        : "border-moboxd-muted/40 hover:border-moboxd-accent bg-[#1A1A21]"
                    }`}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <i className="bi bi-image text-3xl text-moboxd-muted mb-2"></i>
                        <span className="text-moboxd-muted font-medium">Upload Photo</span>
                        <span className="text-xs text-moboxd-muted mt-1">or click to browse</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Caption Input */}
                <div>
                  <label className="text-sm font-bold text-moboxd-muted mb-2 block">Caption</label>
                  <textarea
                    className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-3 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent transition-colors resize-none h-24"
                    placeholder="What's this moment about?"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    required
                  />
                </div>

                {/* Category Pills */}
                <div>
                  <label className="text-sm font-bold text-moboxd-muted mb-2 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border cursor-pointer ${
                          category === cat 
                            ? "bg-[#2A2A35] text-moboxd-accent border-[#2A2A35]" 
                            : "bg-transparent text-moboxd-muted border-moboxd-muted/30 hover:border-moboxd-muted"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility Options */}
                <div>
                  <label className="text-sm font-bold text-moboxd-muted mb-2 block">Visibility</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibility("PUBLIC")}
                      className={`p-3 rounded-xl border transition ${
                        visibility === "PUBLIC" ? "bg-[#2A2A35] text-moboxd-accent border-[#2A2A35]" : "border-[#2A2A35] text-moboxd-muted"
                      }`}
                    >
                      <i className="bi bi-globe mr-2"></i> Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility("FOLLOWERS")}
                      className={`p-3 rounded-xl border transition ${
                        visibility === "FOLLOWERS" ? "bg-[#2A2A35] text-moboxd-accent border-[#2A2A35]" : "border-[#2A2A35] text-moboxd-muted"
                      }`}
                    >
                      <i className="bi bi-people mr-2"></i> Followers
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility("PRIVATE")}
                      className={`p-3 rounded-xl border transition ${
                        visibility === "PRIVATE" ? "bg-[#2A2A35] text-moboxd-accent border-[#2A2A35]" : "border-[#2A2A35] text-moboxd-muted"
                      }`}
                    >
                      <i className="bi bi-lock mr-2"></i> Private
                    </button>
                  </div>
                  <p className="text-xs text-moboxd-muted mt-2">
                    {visibility === "PUBLIC" && "Visible to everyone."}
                    {visibility === "FOLLOWERS" && "Only your followers can view this moment."}
                    {visibility === "PRIVATE" && "Hidden from feeds and profiles. Share using a direct link."}
                  </p>
                </div>

                {/* Letterboxd Style Rating Stars */}
                <div>
                  <label className="text-sm font-bold text-moboxd-muted mb-2 block">Your Rating</label>
                  <div className="flex items-center gap-1 text-2xl text-moboxd-accent">
                    {[1, 2, 3, 4, 5].map((star) => {
                      let iconClass = "bi-star";
                      if (rating >= star) iconClass = "bi-star-fill";
                      else if (rating === star - 0.5) iconClass = "bi-star-half";

                      return (
                        <i
                          key={star}
                          className={`bi ${iconClass} cursor-pointer hover:scale-110 transition-transform`}
                          onClick={() => handleRatingClick(star)}
                        ></i>
                      );
                    })}
                    <span className="text-white text-lg font-bold ml-3">{rating.toFixed(1)}</span>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2A2A35]">
              <button
                type="submit"
                form="createForm"
                disabled={loading}
                className="w-full bg-moboxd-accent hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Sharing..." : "Share Moment"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreatePostModal;