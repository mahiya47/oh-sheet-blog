import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  UserRound,
  Flag,
  ShieldOff,
  ChevronDown,
  Search,
  UserPlus,
  MessageCircle,
  X,
} from "lucide-react";
import { useStore } from "../lib/store";
import { useToast } from "../context/ToastContext.jsx";
import Avatar from "../components/Avatar";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import ReportModal from "../components/ReportModal.jsx";
import { getVerifiedVariant } from "../lib/verifiedVariant.js";
import { CREATOR_ID } from "../lib/creator.js";
import { timeAgo } from "../lib/time";

const FOLLOWING_PREVIEW_COUNT = 5;

export default function ChatPage() {
  const store = useStore();
  const {
    currentUser,
    getConversations,
    getDmThread,
    sendDm,
    getFollowingList,
    getSuggestedUsers,
    toggleFollow,
    blockUser,
  } = store;

  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const dmUserId = searchParams.get("dm");

  const [mobileOpen, setMobileOpen] = useState(!!dmUserId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [allFollowingOpen, setAllFollowingOpen] = useState(false);
  const [allFollowingSearch, setAllFollowingSearch] = useState("");

  const [conversations, setConversations] = useState([]);
  const [following, setFollowing] = useState([]);
  const [suggested, setSuggested] = useState([]);

  const [thread, setThread] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(!!dmUserId);

  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollRef = useRef(null);
  const sidePollRef = useRef(null);

  const loadSidebar = async () => {
    try {
      setConversations(await getConversations());
      if (currentUser) {
        const followList = await getFollowingList(currentUser.id);
        setFollowing(followList);
        if (!followList.length) {
          setSuggested(await getSuggestedUsers());
        }
      }
    } catch {}
  };

  const loadThread = async (userId) => {
    try {
      const data = await getDmThread(userId);
      setThread(data);
      const theirMsg = data.find((m) => m.sender.id === Number(userId));
      if (theirMsg) setActiveUser(theirMsg.sender);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    setMenuOpen(false);
    clearInterval(pollRef.current);

    if (dmUserId) {
      setLoading(true);
      setThread([]);
      setActiveUser(
        conversations.find((c) => c.user.id === Number(dmUserId))?.user ||
          following.find((u) => u.id === Number(dmUserId)) ||
          suggested.find((u) => u.id === Number(dmUserId)) ||
          null,
      );
      loadThread(dmUserId);
      pollRef.current = setInterval(() => loadThread(dmUserId), 3000);
    }

    return () => clearInterval(pollRef.current);
  }, [dmUserId]);

  useEffect(() => {
    loadSidebar();
    sidePollRef.current = setInterval(loadSidebar, 3000);
    return () => clearInterval(sidePollRef.current);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadSidebar();
        if (dmUserId) loadThread(dmUserId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [dmUserId]);

  useEffect(() => {
    document.body.classList.add("chat-page-active");
    return () => document.body.classList.remove("chat-page-active");
  }, []);

  const threadCount = thread.length;
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [threadCount, dmUserId]);

  useEffect(() => {
    setMobileOpen(!!dmUserId);
  }, [dmUserId]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !dmUserId) return;
    setSending(true);
    try {
      const msg = await sendDm(dmUserId, input.trim());
      setThread((prev) => [...prev, msg]);
      setInput("");
    } catch {}
    setSending(false);
  };

  const openThread = (userId) => {
    setSearchParams({ dm: userId });
    setMobileOpen(true);
    setAllFollowingOpen(false);
  };

  const backToList = () => {
    setMobileOpen(false);
    setMenuOpen(false);
    setSearchParams({});
  };

  const displayName = (user) => {
    if (!user) return "User";
    return (
      user.displayName ||
      user.name ||
      user.username ||
      user.email?.split("@")[0] ||
      "User"
    );
  };

  const onVisitProfile = () => {
    if (activeUser) navigate(`/profile/${activeUser.id}`);
  };

  const onReport = () => {
    setMenuOpen(false);
    if (activeUser) {
      setReportTarget(activeUser);
    }
  };

  const onBlock = async () => {
    setMenuOpen(false);
    if (!activeUser) return;
    const confirmed = window.confirm(
      `Are you sure you want to block ${displayName(activeUser)}?`,
    );
    if (confirmed && blockUser) {
      await blockUser(activeUser.id);
      toast(`Blocked ${displayName(activeUser)}.`, "danger");
      backToList();
    }
  };

  const onFollowSuggested = async (user) => {
    try {
      await toggleFollow(user.id, false);
      toast(`Followed ${displayName(user)}.`, "accent");
      setSuggested((prev) => prev.filter((u) => u.id !== user.id));
      setFollowing((prev) => [...prev, user]);
    } catch {
      toast("Couldn't follow right now.", "danger");
    }
  };

  const newPeople = following.filter(
    (u) => !conversations.some((c) => c.user.id === u.id),
  );

  const filteredConversations = conversations.filter(
    (c) =>
      displayName(c.user).toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredNewPeople = newPeople.filter(
    (u) =>
      displayName(u).toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const previewNewPeople = filteredNewPeople.slice(0, FOLLOWING_PREVIEW_COUNT);

  const allFollowingFiltered = following.filter(
    (u) =>
      displayName(u).toLowerCase().includes(allFollowingSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(allFollowingSearch.toLowerCase()),
  );

  const hasAnyChatOption =
    filteredConversations.length > 0 || filteredNewPeople.length > 0;

  return (
    <div className={`chat-shell ${mobileOpen ? "chat-shell--open" : ""}`}>
      {/* ============ LIST (always visible on desktop, list-view on mobile) ============ */}
      <aside className="chat-list">
        {/* Section 1: Search */}
        <div className="chat-list-search-wrap">
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "var(--radius)",
                border: "2px solid var(--border)",
                background: "var(--bg)",
                color: "inherit",
                outline: "none",
                fontSize: "0.85rem",
              }}
            />
          </div>
        </div>

        {/* Section 2: Existing conversations (includes Tonald Drump once bot DMs) */}
        {filteredConversations.length > 0 && (
          <>
            <div className="chat-list-label">Messages</div>
            {filteredConversations.map((conv) => (
              <button
                key={conv.user.id}
                type="button"
                className={`chat-list-item ${
                  Number(dmUserId) === conv.user.id
                    ? "chat-list-item--active"
                    : ""
                }`}
                onClick={() => openThread(conv.user.id)}
              >
                <Avatar user={conv.user} size={40} />
                <div className="chat-list-info">
                  <span className="chat-page-author">
                    {displayName(conv.user)}
                    {conv.user?.emailVerified && (
                      <VerifiedBadge
                        size={12}
                        variant={getVerifiedVariant(
                          conv.user,
                          conv.user?.id === CREATOR_ID,
                        )}
                      />
                    )}
                    {conv.unread > 0 && (
                      <span className="chat-unread-badge">{conv.unread}</span>
                    )}
                  </span>
                  <span className="chat-page-time">
                    {conv.lastMessage.slice(0, 30)}
                    {conv.lastMessage.length > 30 ? "…" : ""}
                  </span>
                </div>
              </button>
            ))}
          </>
        )}

        {/* Section 3: Top 5 people you follow (not yet messaged) + More */}
        {filteredNewPeople.length > 0 && (
          <>
            <div
              className="chat-list-label"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>People you follow</span>
              {filteredNewPeople.length > FOLLOWING_PREVIEW_COUNT && (
                <button
                  type="button"
                  className="chat-list-more-btn"
                  onClick={() => setAllFollowingOpen(true)}
                >
                  More
                </button>
              )}
            </div>
            {previewNewPeople.map((u) => (
              <button
                key={u.id}
                type="button"
                className={`chat-list-item ${
                  Number(dmUserId) === u.id ? "chat-list-item--active" : ""
                }`}
                onClick={() => openThread(u.id)}
              >
                <Avatar user={u} size={40} />
                <div className="chat-list-info">
                  <span className="chat-page-author">
                    {displayName(u)}
                    {u.emailVerified && (
                      <VerifiedBadge
                        size={12}
                        variant={getVerifiedVariant(u, u.id === CREATOR_ID)}
                      />
                    )}
                  </span>
                  <span className="chat-page-time">Start a conversation</span>
                </div>
              </button>
            ))}
          </>
        )}

        {/* Fallback: no follows at all yet — show suggestions */}
        {!following.length && suggested.length > 0 && (
          <>
            <div className="chat-list-label">Suggested for you</div>
            {suggested.map((u) => (
              <div key={u.id} className="chat-list-suggest-item">
                <button
                  type="button"
                  className="chat-list-suggest-userbtn"
                  onClick={() => navigate(`/profile/${u.id}`)}
                >
                  <Avatar user={u} size={40} />
                  <div className="chat-list-info">
                    <span className="chat-page-author">{displayName(u)}</span>
                    <span className="chat-page-time">
                      @{u.username || "user"}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="chat-list-follow-btn"
                  onClick={() => onFollowSuggested(u)}
                  aria-label={`Follow ${displayName(u)}`}
                >
                  <UserPlus size={14} />
                </button>
              </div>
            ))}
          </>
        )}

        {searchQuery && !hasAnyChatOption && (
          <div
            style={{
              textAlign: "center",
              padding: "20px 10px",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            No users found matching "{searchQuery}"
          </div>
        )}

        {!searchQuery && !hasAnyChatOption && !suggested.length && (
          <div
            style={{
              textAlign: "center",
              padding: "20px 10px",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            No conversations yet.
          </div>
        )}
      </aside>

      {/* ============ MAIN (chat window / placeholder — hidden entirely on mobile until opened) ============ */}
      <div className="chat-page chat-main">
        {dmUserId ? (
          <>
            <div
              className="chat-page-header"
              style={{
                backgroundImage: activeUser?.coverUrl
                  ? `linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.9)), url(${activeUser.coverUrl})`
                  : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                }}
              >
                <button
                  type="button"
                  className="btn btn-ghost chat-back"
                  onClick={backToList}
                  aria-label="Back to list"
                  style={{ padding: "8px" }}
                >
                  <ArrowLeft size={18} />
                </button>

                <div style={{ position: "relative", flex: 1 }}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <Avatar user={activeUser} size={36} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          textShadow: activeUser?.coverUrl
                            ? "0 2px 4px rgba(0,0,0,0.8)"
                            : "none",
                        }}
                      >
                        {displayName(activeUser)}
                        {activeUser?.emailVerified && (
                          <VerifiedBadge
                            size={14}
                            variant={getVerifiedVariant(
                              activeUser,
                              activeUser?.id === CREATOR_ID,
                            )}
                          />
                        )}
                        <ChevronDown
                          size={14}
                          style={{ opacity: 0.6, marginLeft: 4 }}
                        />
                      </strong>
                      <span
                        className="chat-page-subtitle"
                        style={{
                          opacity: 0.8,
                          textShadow: activeUser?.coverUrl
                            ? "0 1px 3px rgba(0,0,0,0.8)"
                            : "none",
                        }}
                      >
                        Tap for options
                      </span>
                    </div>
                  </button>

                  {menuOpen && (
                    <div
                      className="more-menu"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: 8,
                        minWidth: 180,
                        zIndex: 9999,
                      }}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={onVisitProfile}
                      >
                        <UserRound size={15} /> Visit profile
                      </button>
                      <button type="button" role="menuitem" onClick={onReport}>
                        <Flag size={15} /> Report account
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="danger"
                        onClick={onBlock}
                      >
                        <ShieldOff size={15} /> Block user
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className="chat-page-messages"
              ref={messagesContainerRef}
              onClick={() => setMenuOpen(false)}
            >
              {loading && <div className="chat-page-empty">Loading...</div>}

              {!loading &&
                (thread.length === 0 ? (
                  <div className="chat-page-empty">
                    No messages yet. Say hi! 👋
                  </div>
                ) : (
                  thread.map((msg) => {
                    const isMe =
                      currentUser &&
                      Number(msg.senderId) === Number(currentUser.id);
                    return (
                      <div
                        key={msg.id}
                        className={`chat-page-msg ${isMe ? "chat-page-msg--me" : ""}`}
                      >
                        <div
                          onClick={() =>
                            !isMe && navigate(`/profile/${msg.sender.id}`)
                          }
                          style={{ cursor: isMe ? "default" : "pointer" }}
                        >
                          <Avatar user={msg.sender} size={36} />
                        </div>
                        <div className="chat-page-bubble-wrap">
                          <div className="chat-page-bubble">{msg.content}</div>
                          <span
                            className="chat-page-time"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {timeAgo(msg.createdAt)}
                            {isMe &&
                              (msg.read ? (
                                <CheckCheck size={13} color="#1d9bf0" />
                              ) : (
                                <Check size={13} style={{ opacity: 0.6 }} />
                              ))}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ))}
              <div ref={bottomRef} />
            </div>

            {currentUser ? (
              <form className="chat-page-input-row" onSubmit={send}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message ${displayName(activeUser)}...`}
                  maxLength={1000}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </form>
            ) : (
              <div className="chat-page-login-prompt">
                Log in to join the chat
              </div>
            )}
          </>
        ) : (
          <div className="chat-page-placeholder">
            <MessageCircle size={44} style={{ opacity: 0.35 }} />
            <h3>Your Messages</h3>
            <p>Select a conversation from the list to start chatting.</p>
            <ul className="chat-page-rules">
              <li>Be respectful — no harassment, hate speech, or spam.</li>
              <li>Don't share personal info you're not comfortable sharing.</li>
              <li>Report or block anyone who makes you uncomfortable.</li>
              <li>Messages are private between you and the recipient.</li>
            </ul>
          </div>
        )}
      </div>

      {/* ============ "All following" modal ============ */}
      {allFollowingOpen && (
        <div
          className="chat-allfollowing-overlay"
          onClick={() => setAllFollowingOpen(false)}
        >
          <div
            className="chat-allfollowing-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chat-allfollowing-header">
              <strong>People you follow</strong>
              <button
                type="button"
                onClick={() => setAllFollowingOpen(false)}
                aria-label="Close"
                className="btn btn-ghost"
                style={{ padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ position: "relative", margin: "0 16px 12px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search people you follow..."
                value={allFollowingSearch}
                onChange={(e) => setAllFollowingSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: "var(--radius)",
                  border: "2px solid var(--border)",
                  background: "var(--bg)",
                  color: "inherit",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
            </div>
            <div className="chat-allfollowing-list">
              {allFollowingFiltered.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  No matches.
                </div>
              ) : (
                allFollowingFiltered.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="chat-list-item"
                    onClick={() => openThread(u.id)}
                  >
                    <Avatar user={u} size={40} />
                    <div className="chat-list-info">
                      <span className="chat-page-author">
                        {displayName(u)}
                        {u.emailVerified && (
                          <VerifiedBadge
                            size={12}
                            variant={getVerifiedVariant(u, u.id === CREATOR_ID)}
                          />
                        )}
                      </span>
                      <span className="chat-page-time">
                        @{u.username || "user"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* The Fully Bulletproof Report Modal */}
      {reportTarget && (
        <ReportModal
          username={reportTarget.username || reportTarget.name || "user"}
          onClose={() => setReportTarget(null)}
          onSubmit={async (reason) => {
            try {
              let success = false;

              if (store.createReport) {
                await store.createReport({
                  reportedUserId: reportTarget.id,
                  reason,
                });
                success = true;
              } else if (store.reportUser) {
                try {
                  await store.reportUser({
                    reportedUserId: reportTarget.id,
                    reason,
                  });
                } catch {
                  await store.reportUser(reportTarget.id, reason);
                }
                success = true;
              } else {
                const token = localStorage.getItem("token");
                const apiBase =
                  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

                const res = await fetch(`${apiBase}/reports`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    reportedUserId: reportTarget.id,
                    reason,
                  }),
                });

                if (res.ok) {
                  success = true;
                } else {
                  const res2 = await fetch(`${apiBase}/report`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      reportedUserId: reportTarget.id,
                      reason,
                    }),
                  });
                  if (res2.ok) success = true;
                }
              }

              if (success) {
                toast(
                  `✅ Reported @${reportTarget.username || "user"} successfully.`,
                  "accent",
                );
              } else {
                throw new Error("API completely rejected the request.");
              }
            } catch (error) {
              console.error("Report Error:", error);
              toast("Something went wrong reporting this user.", "danger");
            } finally {
              setReportTarget(null);
            }
          }}
        />
      )}
    </div>
  );
}
