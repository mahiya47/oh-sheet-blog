import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, ImagePlus, VideoIcon, Crop as CropIcon } from "lucide-react";
import Cropper from "react-easy-crop";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";

const MAX = 500;
const MAX_VIDEO_MB = 20; // keep base64 overhead reasonable against the server's body limit

// Mobile-friendly portrait ratio — matches how images render in the feed card
const CROP_ASPECT = 4 / 5;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Crops the image to the pixel box react-easy-crop gives us, then
// downsizes the result the same way the old fileToImageDataUrl did.
async function getCroppedImageDataUrl(imageSrc, cropPixels, max = 800) {
  const img = await loadImage(imageSrc);

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropPixels.width;
  cropCanvas.height = cropPixels.height;
  const cropCtx = cropCanvas.getContext("2d");
  cropCtx.drawImage(
    img,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height,
  );

  const scale = Math.min(
    1,
    max / Math.max(cropCanvas.width, cropCanvas.height),
  );
  const w = Math.round(cropCanvas.width * scale);
  const h = Math.round(cropCanvas.height * scale);
  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  outCanvas.getContext("2d").drawImage(cropCanvas, 0, 0, w, h);

  return outCanvas.toDataURL("image/jpeg", 0.7);
}

export default function CreatePostPage() {
  const { createPost } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const videoFileRef = useRef(null);
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Crop modal state
  const [cropSrc, setCropSrc] = useState(null); // raw uploaded image, pre-crop
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const over = content.length > MAX;
  const empty = content.trim().length === 0 && !imageUrl && !videoUrl;

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const onTagKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setVideoUrl(""); // image and video are mutually exclusive
      setCropSrc(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch {
      toast("Couldn't load that image.", "danger");
    }
    e.target.value = ""; // allow picking the same file again later
  };

  const onPickVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast("Please pick a video file.", "danger");
      e.target.value = "";
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_VIDEO_MB) {
      toast(`Video too large — keep it under ${MAX_VIDEO_MB}MB.`, "danger");
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageUrl(""); // image and video are mutually exclusive
      setCropSrc(null);
      setVideoUrl(dataUrl);
      toast("Video added.", "accent");
    } catch {
      toast("Couldn't load that video.", "danger");
    }
    e.target.value = "";
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onConfirmCrop = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    try {
      const dataUrl = await getCroppedImageDataUrl(cropSrc, croppedAreaPixels);
      setImageUrl(dataUrl);
      setCropSrc(null);
      toast("Image added.", "accent");
    } catch {
      toast("Couldn't crop that image.", "danger");
    }
  };

  const onCancelCrop = () => {
    setCropSrc(null);
  };

  const onEditCurrentImage = () => {
    if (imageUrl) {
      setCropSrc(imageUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const onPost = async () => {
    if (empty) return toast("Your sheet is empty.", "danger");
    if (over)
      return toast(
        `Too long — trim ${content.length - MAX} characters.`,
        "danger",
      );
    const id = await createPost(content, tags, imageUrl, null, videoUrl);
    if (id) {
      toast("Sheet posted!", "accent");
      navigate("/feed");
    } else {
      toast("Could not post.", "danger");
    }
  };

  return (
    <div className="editor">
      <div className="editor-head">
        <h1>Create a sheet</h1>
        <button
          type="button"
          className="icon-btn"
          onClick={() => navigate("/feed")}
          aria-label="Close editor"
        >
          <X size={18} />
        </button>
      </div>

      <div className="field">
        <label htmlFor="sheet-content">Content</label>
        <textarea
          id="sheet-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thought, lesson, or snippet…"
          autoFocus
        />
        <span className={`char-count ${over ? "over" : ""}`}>
          {content.length} / {MAX}
        </span>
      </div>

      <div className="field">
        <label htmlFor="sheet-tags">Tags</label>
        <input
          id="sheet-tags"
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={onTagKey}
          placeholder="Type a tag and press Enter (max 5)"
        />
        {tags.length > 0 && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}
          >
            {tags.map((t) => (
              <span
                key={t}
                className="tag"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                #{t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    padding: 0,
                    display: "inline-flex",
                  }}
                  aria-label={`Remove ${t}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <label>Image (optional)</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onPickImage}
        />
        {imageUrl ? (
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={imageUrl}
              alt="preview"
              style={{
                maxWidth: "100%",
                borderRadius: "var(--radius)",
                border: "2px solid var(--border)",
              }}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={onEditCurrentImage}
              style={{ position: "absolute", top: 8, right: 44 }}
              aria-label="Re-crop image"
              title="Re-crop"
            >
              <CropIcon size={16} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setImageUrl("")}
              style={{ position: "absolute", top: 8, right: 8 }}
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          !videoUrl && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fileRef.current?.click()}
              style={{ alignSelf: "flex-start" }}
            >
              <ImagePlus size={16} /> Add image
            </button>
          )
        )}
      </div>

      <div className="field">
        <label>Video (optional, max {MAX_VIDEO_MB}MB)</label>
        <input
          ref={videoFileRef}
          type="file"
          accept="video/*"
          hidden
          onChange={onPickVideo}
        />
        {videoUrl ? (
          <div style={{ position: "relative", display: "inline-block" }}>
            <video
              src={videoUrl}
              controls
              style={{
                maxWidth: "100%",
                maxHeight: 400,
                borderRadius: "var(--radius)",
                border: "2px solid var(--border)",
                display: "block",
              }}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setVideoUrl("")}
              style={{ position: "absolute", top: 8, right: 8 }}
              aria-label="Remove video"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          !imageUrl && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => videoFileRef.current?.click()}
              style={{ alignSelf: "flex-start" }}
            >
              <VideoIcon size={16} /> Add video
            </button>
          )
        )}
      </div>

      <div className="editor-foot">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate("/feed")}
        >
          Discard
        </button>
        <button
          type="button"
          className="btn btn-accent"
          onClick={onPost}
          disabled={empty || over}
        >
          Post sheet
        </button>
      </div>

      {cropSrc && (
        <div className="overlay" onClick={onCancelCrop}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 420,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ position: "relative", width: "100%", height: 420 }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={CROP_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div style={{ padding: "var(--space-4)" }}>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={onConfirmCrop}
                  style={{ flex: 1 }}
                >
                  Crop & use
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onCancelCrop}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
