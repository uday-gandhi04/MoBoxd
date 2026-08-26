import { useState, useContext, useRef, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Cropper from "react-easy-crop";
import {
  MOMENT_CATEGORIES,
} from "../constants/categories";

// ============================================================
// IMAGE CROP HELPERS
// ============================================================

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () =>
      resolve(image)
    );

    image.addEventListener("error", (error) =>
      reject(error)
    );

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
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          return;
        }

        blob.name = "cropped.jpeg";
        resolve(blob);
      },
      "image/jpeg"
    );
  });
}


// ============================================================
// CREATE POST MODAL
// ============================================================

const CreatePostModal = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  // ==========================================================
  // MOMENT DATA
  // ==========================================================

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");

  const [category, setCategory] =
    useState("Other");

  const [tags, setTags] = useState("");

  const [rating, setRating] = useState(5);

  const [visibility, setVisibility] =
    useState("PUBLIC");

  // ==========================================================
  // RELATED LINK
  // ==========================================================

  const [showRelatedLink, setShowRelatedLink] =
    useState(false);

  const [linkType, setLinkType] =
    useState("OTHER");

  const [relatedLink, setRelatedLink] =
    useState("");

  // ==========================================================
  // IMAGE / CROP STATE
  // ==========================================================

  const [imageSrc, setImageSrc] =
    useState(null);

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] = useState(null);

  const [isCropping, setIsCropping] =
    useState(false);

  const [imageFile, setImageFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const { user } =
    useContext(AuthContext);

  const fileInputRef = useRef(null);

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const categories = MOMENT_CATEGORIES;

  const linkTypes = [
    {
      value: "PLACE",
      label: "Place",
      icon: "bi-geo-alt",
    },
    {
      value: "MUSIC",
      label: "Music",
      icon: "bi-music-note-beamed",
    },
    {
      value: "MOVIE_TV",
      label: "Movie / TV",
      icon: "bi-film",
    },
    {
      value: "BOOK",
      label: "Book",
      icon: "bi-book",
    },
    {
      value: "GAME",
      label: "Game",
      icon: "bi-controller",
    },
    {
      value: "PRODUCT",
      label: "Product",
      icon: "bi-bag",
    },
    {
      value: "ARTICLE",
      label: "Article",
      icon: "bi-link-45deg",
    },
    {
      value: "OTHER",
      label: "Other",
      icon: "bi-globe",
    },
  ];

  // ==========================================================
  // RESET
  // ==========================================================

  const handleClose = () => {
    setTitle("");
    setCaption("");
    setCategory("Other");
    setTags("");
    setRating(5);
    setVisibility("PUBLIC");

    setShowRelatedLink(false);
    setLinkType("OTHER");
    setRelatedLink("");

    setImageSrc(null);
    setImageFile(null);
    setImagePreview(null);

    setIsCropping(false);
    setError("");

    onClose();
  };

  // ==========================================================
  // CROPPER
  // ==========================================================

  const onCropComplete = useCallback(
    (croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(
        croppedAreaPixels
      );
    },
    []
  );

  const handleImageChange = (e) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.addEventListener(
      "load",
      () => {
        setImageSrc(
          reader.result
        );

        setIsCropping(true);
      }
    );

    reader.readAsDataURL(file);
  };

  const handleCropImage = async () => {
    try {
      if (
        !imageSrc ||
        !croppedAreaPixels
      ) {
        return;
      }

      const croppedBlob =
        await getCroppedImg(
          imageSrc,
          croppedAreaPixels
        );

      setImageFile(croppedBlob);

      setImagePreview(
        URL.createObjectURL(
          croppedBlob
        )
      );

      setIsCropping(false);

    } catch (error) {
      console.error(error);

      setError(
        "Failed to crop image."
      );
    }
  };

  // ==========================================================
  // RATING
  // ==========================================================

  const handleRatingClick = (
    starValue
  ) => {
    if (
      rating === starValue
    ) {
      setRating(
        starValue - 0.5
      );
    } else {
      setRating(
        starValue
      );
    }
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      setError(
        "Please select an image."
      );
      return;
    }

    if (!title.trim()) {
      setError(
        "Please give your moment a title."
      );
      return;
    }

    if (
      showRelatedLink &&
      relatedLink.trim()
    ) {
      try {
        new URL(
          relatedLink.trim()
        );
      } catch {
        setError(
          "Please enter a valid URL."
        );
        return;
      }
    }

    setLoading(true);
    setError("");

    // --------------------------------------------------------
    // Convert comma-separated tags into clean array
    // --------------------------------------------------------

    const parsedTags = tags
      .split(",")
      .map((tag) =>
        tag.trim().toLowerCase()
      )
      .filter(Boolean)
      .filter(
        (tag, index, array) =>
          array.indexOf(tag) ===
          index
      )
      .slice(0, 10);

    const formData =
      new FormData();

    formData.append(
      "title",
      title.trim()
    );

    formData.append(
      "caption",
      caption.trim()
    );

    formData.append(
      "category",
      category
    );

    formData.append(
      "authorRating",
      rating
    );

    formData.append(
      "visibility",
      visibility
    );

    formData.append(
      "image",
      imageFile
    );

    // Tags as JSON
    formData.append(
      "tags",
      JSON.stringify(parsedTags)
    );

    // Related link
    if (
      showRelatedLink &&
      relatedLink.trim()
    ) {
      formData.append(
        "relatedLink",
        relatedLink.trim()
      );

      formData.append(
        "linkType",
        linkType
      );
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",

            Authorization:
              `Bearer ${user.token}`,
          },
        }
      );

      setLoading(false);

      onPostCreated();

      handleClose();

    } catch (err) {
      console.error(
        "Error creating moment:",
        err
      );

      setError(
        err.response?.data
          ?.message ||
        "Error creating moment."
      );

      setLoading(false);
    }
  };

  // ==========================================================
  // EARLY RETURN
  // ==========================================================

  if (!isOpen) {
    return null;
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">

      <div className="bg-moboxd-bg border border-[#2A2A35] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-center justify-between p-4 border-b border-[#2A2A35]">

          <h2 className="text-lg font-bold text-white">
            {isCropping
              ? "Crop Image"
              : "Create New Moment"}
          </h2>

          <button
            type="button"
            onClick={
              isCropping
                ? () =>
                    setIsCropping(
                      false
                    )
                : handleClose
            }
            className="text-moboxd-muted hover:text-white transition-colors cursor-pointer"
          >
            <i
              className={
                isCropping
                  ? "bi bi-arrow-left"
                  : "bi bi-x-lg"
              }
            ></i>
          </button>

        </div>

        {/* ==================================================
            CROPPER
        ================================================== */}

        {isCropping ? (
          <div className="flex flex-col h-[500px]">

            <div className="relative flex-1 w-full bg-black">

              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 5}
                onCropChange={setCrop}
                onCropComplete={
                  onCropComplete
                }
                onZoomChange={setZoom}
              />

            </div>

            <div className="p-4 bg-[#1A1A21] border-t border-[#2A2A35]">

              <button
                type="button"
                onClick={
                  handleCropImage
                }
                className="w-full bg-moboxd-accent hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors"
              >
                Done Cropping
              </button>

            </div>

          </div>
        ) : (

          <>
            {/* ==================================================
                FORM
            ================================================== */}

            <div className="p-6 overflow-y-auto custom-scrollbar">

              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-sm mb-5">
                  {error}
                </div>
              )}

              <form
                id="createForm"
                onSubmit={handleSubmit}
                className="flex flex-col gap-6"
              >

                {/* ==================================================
                    IMAGE
                ================================================== */}

                <div>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={
                      handleImageChange
                    }
                  />

                  <div
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
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

                {/* ==================================================
                    TITLE
                ================================================== */}

                <div>

                  <label className="text-sm font-bold text-moboxd-muted mb-2 block">
                    Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                    maxLength={120}
                    required
                    className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-3 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent transition-colors"
                    placeholder="What is this moment about?"
                  />

                  <div className="flex justify-end mt-1">
                    <span className="text-[11px] text-moboxd-muted">
                      {title.length}/120
                    </span>
                  </div>

                </div>

                {/* ==================================================
                    CAPTION
                ================================================== */}

                <div>

                  <label className="text-sm font-bold text-moboxd-muted mb-2 block">
                    Caption
                    <span className="font-normal ml-1">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-3 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent transition-colors resize-none h-24"
                    placeholder="Tell people a little more..."
                    value={caption}
                    onChange={(e) =>
                      setCaption(
                        e.target.value
                      )
                    }
                    maxLength={1000}
                  />

                </div>

                {/* ==================================================
                    CATEGORY
                ================================================== */}

                <div>

                  <label className="text-sm font-bold text-moboxd-muted mb-2 block">
                    Category
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                    {categories.map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            setCategory(
                              cat
                            )
                          }
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border cursor-pointer ${
                            category ===
                            cat
                              ? "bg-[#2A2A35] text-moboxd-accent border-moboxd-accent/40"
                              : "bg-transparent text-moboxd-muted border-[#2A2A35] hover:border-moboxd-muted"
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}

                  </div>

                </div>

                {/* ==================================================
                    TAGS
                ================================================== */}

                <div>

                  <label className="text-sm font-bold text-moboxd-muted mb-2 block">
                    Tags
                    <span className="font-normal ml-1">
                      (optional)
                    </span>
                  </label>

                  <input
                    type="text"
                    value={tags}
                    onChange={(e) =>
                      setTags(
                        e.target.value
                      )
                    }
                    maxLength={200}
                    className="w-full bg-[#1A1A21] border border-[#2A2A35] rounded-xl p-3 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent transition-colors"
                    placeholder="spiti, dhaba, travel"
                  />

                  <p className="text-xs text-moboxd-muted mt-1.5">
                    Add up to 10 tags separated by commas.
                  </p>

                </div>

                {/* ==================================================
                    RELATED LINK
                ================================================== */}

                <div>

                  {!showRelatedLink ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowRelatedLink(
                          true
                        )
                      }
                      className="w-full border border-dashed border-[#3A3A48] hover:border-moboxd-accent rounded-xl p-4 flex items-center gap-3 text-left transition-colors"
                    >

                      <div className="w-10 h-10 rounded-lg bg-[#1A1A21] flex items-center justify-center">
                        <i className="bi bi-link-45deg text-xl text-moboxd-accent"></i>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-white">
                          Add related link
                        </p>

                        <p className="text-xs text-moboxd-muted mt-0.5">
                          Connect this moment to a place, song, movie, book, etc.
                        </p>
                      </div>

                    </button>
                  ) : (

                    <div className="border border-[#2A2A35] rounded-xl p-4 bg-[#1A1A21]">

                      <div className="flex items-center justify-between mb-4">

                        <div>
                          <p className="text-sm font-bold text-white">
                            Related Link
                          </p>

                          <p className="text-xs text-moboxd-muted">
                            Optional
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowRelatedLink(
                              false
                            );

                            setRelatedLink("");

                            setLinkType(
                              "OTHER"
                            );
                          }}
                          className="text-moboxd-muted hover:text-white"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>

                      </div>

                      {/* Link Type */}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">

                        {linkTypes.map(
                          (type) => (
                            <button
                              key={
                                type.value
                              }
                              type="button"
                              onClick={() =>
                                setLinkType(
                                  type.value
                                )
                              }
                              className={`p-2 rounded-lg border text-xs font-medium transition ${
                                linkType ===
                                type.value
                                  ? "border-moboxd-accent bg-[#2A2A35] text-moboxd-accent"
                                  : "border-[#2A2A35] text-moboxd-muted hover:border-moboxd-muted"
                              }`}
                            >
                              <i
                                className={`bi ${type.icon} mr-1`}
                              ></i>

                              {type.label}
                            </button>
                          )
                        )}

                      </div>

                      {/* URL */}

                      <input
                        type="url"
                        value={relatedLink}
                        onChange={(e) =>
                          setRelatedLink(
                            e.target.value
                          )
                        }
                        className="w-full bg-[#0F0F14] border border-[#2A2A35] rounded-lg p-3 text-white placeholder-moboxd-muted/50 focus:outline-none focus:border-moboxd-accent"
                        placeholder="https://..."
                      />

                    </div>
                  )}

                </div>

                {/* ==================================================
                    VISIBILITY
                ================================================== */}

                <div>

                  <label className="text-sm font-bold text-moboxd-muted mb-2 block">
                    Visibility
                  </label>

                  <div className="grid grid-cols-3 gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        setVisibility(
                          "PUBLIC"
                        )
                      }
                      className={`p-3 rounded-xl border transition ${
                        visibility ===
                        "PUBLIC"
                          ? "bg-[#2A2A35] text-moboxd-accent border-[#2A2A35]"
                          : "border-[#2A2A35] text-moboxd-muted"
                      }`}
                    >
                      <i className="bi bi-globe mr-2"></i>
                      Public
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setVisibility(
                          "FOLLOWERS"
                        )
                      }
                      className={`p-3 rounded-xl border transition ${
                        visibility ===
                        "FOLLOWERS"
                          ? "bg-[#2A2A35] text-moboxd-accent border-[#2A2A35]"
                          : "border-[#2A2A35] text-moboxd-muted"
                      }`}
                    >
                      <i className="bi bi-people mr-2"></i>
                      Followers
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setVisibility(
                          "PRIVATE"
                        )
                      }
                      className={`p-3 rounded-xl border transition ${
                        visibility ===
                        "PRIVATE"
                          ? "bg-[#2A2A35] text-moboxd-accent border-[#2A2A35]"
                          : "border-[#2A2A35] text-moboxd-muted"
                      }`}
                    >
                      <i className="bi bi-lock mr-2"></i>
                      Private
                    </button>

                  </div>

                  <p className="text-xs text-moboxd-muted mt-2">
                    {visibility ===
                      "PUBLIC" &&
                      "Visible to everyone."}

                    {visibility ===
                      "FOLLOWERS" &&
                      "Only your followers can view this moment."}

                    {visibility ===
                      "PRIVATE" &&
                      "Hidden from feeds and profiles. Share using a direct link."}
                  </p>

                </div>

                {/* ==================================================
                    RATING
                ================================================== */}

                <div>

                  <label className="text-sm font-bold text-moboxd-muted mb-2 block">
                    Your Rating
                  </label>

                  <div className="flex items-center gap-1 text-2xl text-moboxd-accent">

                    {[1, 2, 3, 4, 5].map(
                      (star) => {
                        let iconClass =
                          "bi-star";

                        if (
                          rating >=
                          star
                        ) {
                          iconClass =
                            "bi-star-fill";
                        } else if (
                          rating ===
                          star - 0.5
                        ) {
                          iconClass =
                            "bi-star-half";
                        }

                        return (
                          <i
                            key={star}
                            className={`bi ${iconClass} cursor-pointer hover:scale-110 transition-transform`}
                            onClick={() =>
                              handleRatingClick(
                                star
                              )
                            }
                          ></i>
                        );
                      }
                    )}

                    <span className="text-white text-lg font-bold ml-3">
                      {rating.toFixed(
                        1
                      )}
                    </span>

                  </div>

                </div>

              </form>

            </div>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="p-4 border-t border-[#2A2A35]">

              <button
                type="submit"
                form="createForm"
                disabled={loading}
                className="w-full bg-moboxd-accent hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading
                  ? "Sharing..."
                  : "Share Moment"}
              </button>

            </div>

          </>
        )}

      </div>

    </div>
  );
};

export default CreatePostModal;