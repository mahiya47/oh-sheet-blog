export default function ProfileSkeleton() {
  return (
    <section className="profile" aria-hidden="true">
      <div className="skel" style={{ height: 150, borderRadius: 0 }} />
      <div className="profile-info">
        <div className="profile-top">
          <div
            className="skel skel-circle"
            style={{ width: 104, height: 104, marginTop: -52 }}
          />
          <div className="skel" style={{ width: 90, height: 36 }} />
        </div>

        <div
          className="skel skel-line"
          style={{ width: 180, height: 22, marginTop: 8 }}
        />
        <div className="skel skel-line" style={{ width: 120, marginTop: 8 }} />
        <div
          className="skel skel-line"
          style={{ width: "70%", marginTop: 10 }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <div
            className="skel"
            style={{ width: 90, height: 28, borderRadius: 8 }}
          />
          <div
            className="skel"
            style={{ width: 90, height: 28, borderRadius: 8 }}
          />
        </div>
      </div>

      <div className="profile-tabs">
        <div
          className="skel skel-line"
          style={{ width: 60, margin: "14px 0 14px 20px" }}
        />
        <div
          className="skel skel-line"
          style={{ width: 60, margin: "14px 0" }}
        />
      </div>
    </section>
  );
}
