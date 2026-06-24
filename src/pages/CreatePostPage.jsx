import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ImagePlus } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";

const MAX = 500;

// Downscale a large image to a reasonable size before storing/sending.
function fileToImageDataUrl(file, max = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CreatePostPage() {
  const { createPost } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [imageUrl, setImageUrl] = useState("");

  const over = content.length > MAX;
  const empty = content.trim().length === 0;

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
      const dataUrl = await fileToImageDataUrl(file);
      setImageUrl(dataUrl);
      toast("Image added.", "accent");
    } catch {
      toast("Couldn't load that image.", "danger");
    }
  };

  const onPost = async () => {
    if (empty) return toast("Your sheet is empty.", "danger");
    if (over)
      return toast(
        `Too long — trim ${content.length - MAX} characters.`,
        "danger",
      );
    const id = await createPost(content, tags, imageUrl);
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
              onClick={() => setImageUrl("")}
              style={{ position: "absolute", top: 8, right: 8 }}
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => fileRef.current?.click()}
            style={{ alignSelf: "flex-start" }}
          >
            <ImagePlus size={16} /> Add image
          </button>
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
    </div>
  );
}
