import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Hash } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import Feed from "../components/Feed.jsx";

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const { searchLive } = useStore();
  const [results, setResults] = useState({ users: [], tags: [], posts: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) return;
    let active = true;
    setLoading(true);
    searchLive(q).then((data) => {
      if (active) {
        setResults({
          users: data.users || [],
          tags: data.tags || [],
          posts: data.posts || [],
        });
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [q]);

  if (!q.trim()) {
    return (
      <div className="empty">
        <p>Type something in the search bar to find sheets and people.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <p
        style={{
          textAlign: "center",
          padding: "40px",
          color: "var(--text-dim)",
        }}
      >
        Searching…
      </p>
    );
  }

  const { users, tags, posts } = results;

  const displayName = (u) =>
    u.name || u.username || u.email?.split("@")[0] || "User";

  return (
    <>
      <h1 style={{ textTransform: "uppercase", fontSize: "1.3rem" }}>
        Results for “{q}”
      </h1>

      {users.length > 0 && (
        <section className="panel">
          <h2 className="panel-head">People ({users.length})</h2>
          {users.map((u) => (
            <Link
              key={u.id}
              to={`/profile/${u.id}`}
              className="mini-row"
              style={{ display: "flex", gap: 12, alignItems: "center" }}
            >
              <Avatar user={u} size={36} />
              <span>
                <span
                  className="display"
                  style={{
                    color: "var(--text)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontWeight: 700,
                  }}
                >
                  {displayName(u)}
                  {u.emailVerified && <VerifiedBadge size={13} />}
                </span>
                <span className="meta">
                  @{u.username || u.email?.split("@")[0]}
                </span>
              </span>
            </Link>
          ))}
        </section>
      )}

      {tags.length > 0 && (
        <section className="panel">
          <h2 className="panel-head">Tags ({tags.length})</h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              padding: "8px 0",
            }}
          >
            {tags.map((t) => (
              <Link key={t.id} to={`/tag/${t.name}`} className="tag">
                <Hash size={12} style={{ verticalAlign: "middle" }} />
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <h2
        style={{
          textTransform: "uppercase",
          fontSize: "1rem",
          color: "var(--text-muted)",
        }}
      >
        Sheets ({posts.length})
      </h2>
      <Feed posts={posts} emptyTitle={`No sheets match “${q}”.`} />
    </>
  );
}
