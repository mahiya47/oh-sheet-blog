import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gamepad2 } from "lucide-react";

export default function SnakePage() {
  const navigate = useNavigate();

  return (
    <div
      className="feed-col"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 80px)",
      }}
    >
      {/* Header & Back Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate(-1)}
          style={{ padding: "8px" }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "1.2rem",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          <Gamepad2 size={20} color="var(--accent)" /> Snake
        </h1>
      </div>

      {/* The Game Container */}
      <div
        style={{
          flex: 1,
          width: "100%",
          background: "#000",
          borderRadius: "var(--radius)",
          border: "2px solid var(--border)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <iframe
          src="/snake/index.html"
          title="Snake Game"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}
