import { useState, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Other");
  const [rating, setRating] = useState(5);
  const [visibility, setVisibility] = useState("PUBLIC");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const categories = ["Food", "Places", "Music", "Entertainment", "Other"];

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Letterboxd Rating Logic
  const handleRatingClick = (starValue) => {
    // If the star clicked is already the current rating, drop it by 0.5
    if (rating === starValue) {
      setRating(starValue - 0.5);
    } else {
      // Otherwise, set it to the full star value clicked
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

      // Reset form and close
      setCaption("");
      setCategory("Other");
      setRating(5);
      setImageFile(null);
      setImagePreview(null);
      setLoading(false);
      onPostCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating moment.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-moboxd-bg border border-[#2A2A35] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A35]">
          <h2 className="text-lg font-bold text-white">Create New Moment</h2>
          <button
            onClick={onClose}
            className="text-moboxd-muted hover:text-white transition-colors cursor-pointer"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form
            id="createForm"
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
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
                className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${imagePreview ? "border-[#2A2A35]" : "border-moboxd-muted/40 hover:border-moboxd-accent bg-[#1A1A21]"}`}
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
                    <span className="text-moboxd-muted font-medium">
                      Upload Photo
                    </span>
                    <span className="text-xs text-moboxd-muted mt-1">
                      or click to browse
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Caption Input */}
            <div>
              <label className="text-sm font-bold text-moboxd-muted mb-2 block">
                Caption
              </label>
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
              <label className="text-sm font-bold text-moboxd-muted mb-2 block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border cursor-pointer ${category === cat ? "bg-[#2A2A35] text-moboxd-accent border-[#2A2A35]" : "bg-transparent text-moboxd-muted border-moboxd-muted/30 hover:border-moboxd-muted"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility Options */}

            <div>
              <label className="text-sm font-bold text-moboxd-muted mb-2 block">
                Visibility
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility("PUBLIC")}
                  className={`p-3 rounded-xl border transition ${
                    visibility === "PUBLIC"
                      ? "bg-[#2A2A35] text-moboxd-accent border-[#2A2A35]"
                      : "border-[#2A2A35] text-moboxd-muted"
                  }`}
                >
                  <i className="bi bi-globe mr-2"></i>
                  Public
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("FOLLOWERS")}
                  className={`p-3 rounded-xl border transition ${
                    visibility === "FOLLOWERS"
                      ? "bg-[#2A2A35] text-moboxd-accent border-[#2A2A35]"
                      : "border-[#2A2A35] text-moboxd-muted"
                  }`}
                >
                  <i className="bi bi-people mr-2"></i>
                  Followers
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("PRIVATE")}
                  className={`p-3 rounded-xl border transition ${
                    visibility === "PRIVATE"
                      ? "bg-[#2A2A35] text-moboxd-accent border-[#2A2A35]"
                      : "border-[#2A2A35] text-moboxd-muted"
                  }`}
                >
                  <i className="bi bi-lock mr-2"></i>
                  Private
                </button>
              </div>

              <p className="text-xs text-moboxd-muted mt-2">
                {visibility === "PUBLIC" && "Visible to everyone."}

                {visibility === "FOLLOWERS" &&
                  "Only your followers can view this moment."}

                {visibility === "PRIVATE" &&
                  "Hidden from feeds and profiles. Share using a direct link."}
              </p>
            </div>

            {/* Letterboxd Style Rating Stars */}
            <div>
              <label className="text-sm font-bold text-moboxd-muted mb-2 block">
                Your Rating
              </label>
              <div className="flex items-center gap-1 text-2xl text-moboxd-accent">
                {[1, 2, 3, 4, 5].map((star) => {
                  // Determine whether the star should be full, half, or empty
                  let iconClass = "bi-star";
                  if (rating >= star) {
                    iconClass = "bi-star-fill";
                  } else if (rating === star - 0.5) {
                    iconClass = "bi-star-half";
                  }

                  return (
                    <i
                      key={star}
                      className={`bi ${iconClass} cursor-pointer hover:scale-110 transition-transform`}
                      onClick={() => handleRatingClick(star)}
                    ></i>
                  );
                })}
                {/* Dynamically format to 1 decimal place (e.g., 4.0 or 4.5) */}
                <span className="text-white text-lg font-bold ml-3">
                  {rating.toFixed(1)}
                </span>
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
      </div>
    </div>
  );
};

export default CreatePostModal;
