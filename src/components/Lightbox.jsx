import { X } from "lucide-react";

export default function Lightbox({ src, onClose }) {
  if (!src) return null;

  return (
    <div
      className="overlay"
      onClick={onClose}
      style={{
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          background: "rgba(0,0,0,0.5)",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          borderRadius: 12,
          objectFit: "contain",
        }}
      />
    </div>
  );
}
