import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Hash, Search } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import { getVerifiedVariant } from "../lib/verifiedVariant.js";
import { CREATOR_ID } from "../lib/creator.js";
import Feed from "../components/Feed.jsx";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const { searchLive } = useStore();
  const [inputValue, setInputValue] = useState(q);
  const [results, setResults] = useState({ users: [], tags: [], posts: [] });
  const [loading, setLoading] = useState(false);

  // keep the input in sync if the URL changes from elsewhere
  useEffect(() => {
    setInputValue(q);
  }, [q]);

  useEffect(() => {
    if (!q.trim()) {
      setResults({ users: [], tags: [], posts: [] });
      return;
    }
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

  const onSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    setParams(trimmed ? { q: trimmed } : {});
  };

  const { users, tags, posts } = results;

  const displayName = (u) =>
    u.name || u.username || u.email?.split("@")[0] || "User";

  return (
    <>
      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "var(--surface)",
          border: "2px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "0 12px",
          height: 46,
        }}
      >
        <Search size={18} style={{ opacity: 0.6, flexShrink: 0 }} />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search sheets or people…"
          aria-label="Search"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text)",
            fontSize: "0.95rem",
          }}
        />
      </form>

      {!q.trim() ? (
        <div className="empty">
          <p>Type something in the search bar to find sheets and people.</p>
        </div>
      ) : loading ? (
        <p
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-dim)",
          }}
        >
          Searching…
        </p>
      ) : (
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
                      {u.emailVerified && (
                        <VerifiedBadge
                          size={13}
                          variant={getVerifiedVariant(u, u.id === CREATOR_ID)}
                        />
                      )}
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
      )}
    </>
  );
}
