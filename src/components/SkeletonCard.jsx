export default function SkeletonCard() {
  return (
    <article className="sheet skeleton-card" aria-hidden="true">
      <header
        className="sheet-head"
        style={{ "--head": "var(--border, #333)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="skel skel-circle" />
          <div>
            <div className="skel skel-line" style={{ width: 120 }} />
            <div
              className="skel skel-line"
              style={{ width: 80, marginTop: 6 }}
            />
          </div>
        </div>
      </header>
      <div className="sheet-body">
        <div className="skel skel-line" style={{ width: "90%" }} />
        <div
          className="skel skel-line"
          style={{ width: "70%", marginTop: 8 }}
        />
        <div
          className="skel skel-line"
          style={{ width: "40%", marginTop: 8 }}
        />
      </div>
    </article>
  );
}
