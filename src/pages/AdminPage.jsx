import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  Users,
  FileText,
  MessageSquare,
  Globe,
  Flag,
  LifeBuoy,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { CREATOR_ID } from "../lib/creator.js";
import Avatar from "../components/Avatar.jsx";

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "users", label: "Users", icon: Users },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "chat", label: "Global Chat", icon: Globe },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "support", label: "Support", icon: LifeBuoy },
];

export default function AdminPage() {
  const { currentUser, ...store } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  if (!currentUser || currentUser.id !== CREATOR_ID) {
    return <Navigate to="/feed" replace />;
  }

  const load = async () => {
    setLoading(true);
    if (tab === "overview") {
      setStats(await store.adminGetStats());
    } else if (tab === "users") {
      setData(await store.adminListUsers(query));
    } else if (tab === "posts") {
      setData(await store.adminListPosts(query));
    } else if (tab === "comments") {
      setData(await store.adminListComments(query));
    } else if (tab === "chat") {
      setData(await store.adminListChat(query));
    } else if (tab === "reports") {
      setData(await store.adminGetReports());
    } else if (tab === "support") {
      setData(await store.adminGetSupport());
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tab]);

  const onSearch = (e) => {
    e.preventDefault();
    load();
  };

  const confirmAndRun = async (message, action) => {
    if (!window.confirm(message)) return;
    const ok = await action();
    if (ok) {
      toast("Done.", "accent");
      load();
    } else {
      toast("Something went wrong.", "danger");
    }
  };

  const row = (children, key) => (
    <div
      key={key}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      {children}
    </div>
  );

  return (
    <div>
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/feed" className="nav-logo wordmark">
            Oh <span>sheet!</span>
          </Link>
        </div>
        <div className="nav-right">
          <Link to="/feed" className="btn btn-ghost">
            <ArrowLeft size={16} /> Back to feed
          </Link>
        </div>
      </nav>

      <div className="settings">
        <aside className="settings-side">
          <h2>Admin</h2>
          <nav>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`tab ${tab === id ? "active" : ""}`}
                onClick={() => {
                  setTab(id);
                  setQuery("");
                }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="settings-main">
          {tab === "overview" && (
            <>
              <h3>Overview</h3>
              {stats ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 12,
                  }}
                >
                  {[
                    ["Total users", stats.users],
                    ["Total posts", stats.posts],
                    ["Open reports", stats.openReports],
                    ["Open tickets", stats.openTickets],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="panel"
                      style={{ padding: 16, textAlign: "center" }}
                    >
                      <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
                        {value}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hint">Loading…</p>
              )}
            </>
          )}

          {["users", "posts", "comments", "chat"].includes(tab) && (
            <>
              <h3>{TABS.find((t) => t.id === tab).label}</h3>
              <form
                onSubmit={onSearch}
                style={{ display: "flex", gap: 8, marginBottom: 16 }}
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${tab}…`}
                />
                <button type="submit" className="btn btn-ghost">
                  Search
                </button>
              </form>

              {loading ? (
                <p className="hint">Loading…</p>
              ) : data.length === 0 ? (
                <p className="hint">Nothing found.</p>
              ) : (
                <div className="panel">
                  {tab === "users" &&
                    data.map((u) =>
                      row(
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              minWidth: 0,
                            }}
                          >
                            <Avatar user={u} size={36} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700 }}>
                                {u.name}{" "}
                                {u.deletedAt && (
                                  <span
                                    style={{
                                      color: "var(--danger)",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    (soft-deleted)
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                @{u.username} · {u.email} · {u._count.posts}{" "}
                                posts
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() =>
                              confirmAndRun(
                                `Permanently delete ${u.name}? This can't be undone.`,
                                () => store.adminDeleteUser(u.id),
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </>,
                        u.id,
                      ),
                    )}

                  {tab === "posts" &&
                    data.map((p) =>
                      row(
                        <>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700 }}>
                              @{p.author?.username}
                            </div>
                            <div
                              style={{
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 400,
                              }}
                            >
                              {p.content}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() =>
                              confirmAndRun("Delete this post?", () =>
                                store.adminDeletePost(p.id),
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </>,
                        p.id,
                      ),
                    )}

                  {tab === "comments" &&
                    data.map((c) =>
                      row(
                        <>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700 }}>
                              @{c.user?.username} on "{c.post?.title}"
                            </div>
                            <div style={{ fontSize: "0.85rem" }}>
                              {c.content}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() =>
                              confirmAndRun("Delete this comment?", () =>
                                store.adminDeleteComment(c.id),
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </>,
                        c.id,
                      ),
                    )}

                  {tab === "chat" &&
                    data.map((m) =>
                      row(
                        <>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700 }}>
                              @{m.user?.username}
                            </div>
                            <div style={{ fontSize: "0.85rem" }}>
                              {m.content}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() =>
                              confirmAndRun("Delete this message?", () =>
                                store.adminDeleteChatMessage(m.id),
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </>,
                        m.id,
                      ),
                    )}
                </div>
              )}
            </>
          )}

          {tab === "reports" && (
            <>
              <h3>Reports</h3>
              {loading ? (
                <p className="hint">Loading…</p>
              ) : data.length === 0 ? (
                <p className="hint">No reports.</p>
              ) : (
                <div className="panel">
                  {data.map((r) =>
                    row(
                      <>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>
                            {r.reportedUser ? (
                              <Link to={`/profile/${r.reportedUser.id}`}>
                                @{r.reportedUser.username}
                              </Link>
                            ) : (
                              <span style={{ color: "var(--text-dim)" }}>
                                [deleted user]
                              </span>
                            )}{" "}
                            reported by{" "}
                            {r.reporter
                              ? `@${r.reporter.username}`
                              : "[deleted user]"}
                          </div>
                          <div style={{ fontSize: "0.85rem" }}>
                            {r.reason} ·{" "}
                            <span style={{ color: "var(--text-muted)" }}>
                              {r.status}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() =>
                              confirmAndRun("Mark reviewed?", () =>
                                store.adminUpdateReport(r.id, "reviewed"),
                              )
                            }
                          >
                            Reviewed
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() =>
                              confirmAndRun("Dismiss report?", () =>
                                store.adminUpdateReport(r.id, "dismissed"),
                              )
                            }
                          >
                            Dismiss
                          </button>
                        </div>
                      </>,
                      r.id,
                    ),
                  )}
                </div>
              )}
            </>
          )}

          {tab === "support" && (
            <>
              <h3>Support tickets</h3>
              {loading ? (
                <p className="hint">Loading…</p>
              ) : data.length === 0 ? (
                <p className="hint">No tickets.</p>
              ) : (
                <div className="panel">
                  {data.map((t) =>
                    row(
                      <>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>{t.subject}</div>
                          <div style={{ fontSize: "0.85rem" }}>
                            {t.email} · {t.message.slice(0, 80)}
                            {t.message.length > 80 ? "…" : ""}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {t.status}
                          </div>
                        </div>
                        {t.status !== "resolved" && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() =>
                              confirmAndRun("Mark resolved?", () =>
                                store.adminUpdateSupport(t.id, "resolved"),
                              )
                            }
                          >
                            Resolve
                          </button>
                        )}
                      </>,
                      t.id,
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
