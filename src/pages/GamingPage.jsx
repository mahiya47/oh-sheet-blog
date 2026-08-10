import { Link } from "react-router-dom";
import { Gamepad2, Sparkles } from "lucide-react";

export default function GamingPage() {
  return (
    <div className="feed-col">
      <h1
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textTransform: "uppercase",
          fontSize: "1.4rem",
          marginBottom: 20,
        }}
      >
        <Gamepad2 size={26} color="var(--accent)" /> Oh Sheet! Arcade
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {/* Card 1: Snake Game */}
        <Link
          to="/snake"
          className="panel"
          style={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
            overflow: "hidden",
            padding: 0,
            transition: "transform 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          {/* Thumbnail Container */}
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              background: "var(--surface-2, rgba(255,255,255,0.05))",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* 👇 UPDATED: Added your thumbnail image tag here */}
            <img
              src="/snake-thumbnail.jpg"
              alt="Snake Game"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div style={{ padding: 14 }}>
            <h3
              style={{
                margin: 0,
                fontSize: "1.1rem",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              Snake
            </h3>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              The classic retro arcade game. Eat apples, get long, don't crash!
            </p>
          </div>
        </Link>

        {/* Card 2: Coming Soon Placeholder */}
        <div
          className="panel"
          style={{
            display: "block",
            overflow: "hidden",
            padding: 0,
            opacity: 0.5,
            cursor: "not-allowed",
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              background: "var(--surface-2, rgba(255,255,255,0.02))",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={40} color="var(--text-muted)" />
          </div>
          <div style={{ padding: 14 }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>More Coming Soon</h3>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              New games are actively in development. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
