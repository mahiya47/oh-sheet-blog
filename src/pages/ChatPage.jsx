import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, ArrowLeft, Globe, Check, CheckCheck } from "lucide-react";
import { useStore } from "../lib/store";
import Avatar from "../components/Avatar";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import { timeAgo } from "../lib/time";

export default function ChatPage() {
  const {
    getChatMessages,
    sendChatMessage,
    currentUser,
    markChatSeen,
    getChatUnread,
    getConversations,
    getDmThread,
    sendDm,
    getFollowingList,
  } = useStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const dmUserId = searchParams.get("dm"); // null = global

  // mobile: is a chat open (vs the list)?
  const [mobileOpen, setMobileOpen] = useState(!!dmUserId);

  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [following, setFollowing] = useState([]);
  const [globalUnread, setGlobalUnread] = useState(0);
  const [thread, setThread] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const sidePollRef = useRef(null);

  const isGlobal = !dmUserId;

  // ---- loaders ----
  const loadGlobal = async () => {
    try {
      setMessages(await getChatMessages());
    } catch {}
    setLoading(false);
  };

  const loadSidebar = async () => {
    try {
      setConversations(await getConversations());
      if (currentUser) setFollowing(await getFollowingList(currentUser.id));
      setGlobalUnread(await getChatUnread());
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

  // ---- main chat polling ----
  useEffect(() => {
    setLoading(true);
    clearInterval(pollRef.current);

    if (isGlobal) {
      loadGlobal();
      markChatSeen();
      setGlobalUnread(0);
      pollRef.current = setInterval(() => {
        loadGlobal();
        markChatSeen();
      }, 8000);
    } else {
      setThread([]);
      setActiveUser(
        // instantly show name from sidebar data if we have it
        conversations.find((c) => c.user.id === Number(dmUserId))?.user ||
          following.find((u) => u.id === Number(dmUserId)) ||
          null,
      );
      loadThread(dmUserId);
      pollRef.current = setInterval(() => loadThread(dmUserId), 8000);
    }

    return () => clearInterval(pollRef.current);
  }, [dmUserId]);

  // ---- sidebar polling (always) ----
  useEffect(() => {
    loadSidebar();
    sidePollRef.current = setInterval(loadSidebar, 8000);
    return () => clearInterval(sidePollRef.current);
  }, []);

  // ---- actions ----
  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      if (isGlobal) {
        const msg = await sendChatMessage(input.trim());
        setMessages((prev) => [...prev, msg]);
        markChatSeen();
      } else {
        const msg = await sendDm(dmUserId, input.trim());
        setThread((prev) => [...prev, msg]);
      }
      setInput("");
    } catch {}
    setSending(false);
  };

  const openGlobal = () => {
    setSearchParams({});
    setMobileOpen(true);
  };

  const openThread = (userId) => {
    setSearchParams({ dm: userId });
    setMobileOpen(true);
  };

  const backToList = () => setMobileOpen(false);

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

  const newPeople = following.filter(
    (u) => !conversations.some((c) => c.user.id === u.id),
  );

  // ---- render ----
  return (
    <div className={`chat-shell ${mobileOpen ? "chat-shell--open" : ""}`}>
      {/* ============ CHAT AREA (left) ============ */}
      <div className="chat-page chat-main">
        <div className="chat-page-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost chat-back"
              onClick={backToList}
              aria-label="Back to list"
            >
              <ArrowLeft size={16} />
            </button>
            {isGlobal ? (
              <>
                <Globe size={20} />
                <div>
                  <strong>Global Chat</strong>
                  <div className="chat-page-subtitle">
                    Messages disappear after 24 hrs · max 1000
                  </div>
                </div>
              </>
            ) : (
              <>
                <Avatar user={activeUser} size={28} />
                <strong>
                  {displayName(activeUser)}
                  {activeUser?.emailVerified && <VerifiedBadge size={14} />}
                </strong>
              </>
            )}
          </div>
        </div>

        <div className="chat-page-messages">
          {loading && <div className="chat-page-empty">Loading...</div>}

          {/* global messages */}
          {isGlobal &&
            !loading &&
            (messages.length === 0 ? (
              <div className="chat-page-empty">No messages yet. Say hi! 👋</div>
            ) : (
              messages.map((msg) => {
                const isMe = currentUser && msg.userId === currentUser.id;
                const msgUser = msg.user || (isMe ? currentUser : null);
                return (
                  <div
                    key={msg.id}
                    className={`chat-page-msg ${isMe ? "chat-page-msg--me" : ""}`}
                  >
                    <Avatar user={msgUser} size={36} />
                    <div className="chat-page-bubble-wrap">
                      {!isMe && (
                        <span className="chat-page-author">
                          {displayName(msgUser)}
                          {msgUser?.emailVerified && (
                            <VerifiedBadge size={12} />
                          )}
                        </span>
                      )}
                      <div className="chat-page-bubble">{msg.content}</div>
                      <span className="chat-page-time">
                        {timeAgo(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            ))}

          {/* dm thread */}
          {!isGlobal &&
            !loading &&
            (thread.length === 0 ? (
              <div className="chat-page-empty">No messages yet. Say hi! 👋</div>
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
                    <Avatar user={msg.sender} size={36} />
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
              placeholder={
                isGlobal
                  ? "Say something to everyone..."
                  : `Message ${displayName(activeUser)}...`
              }
              maxLength={isGlobal ? 300 : 1000}
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
          <div className="chat-page-login-prompt">Log in to join the chat</div>
        )}
      </div>

      {/* ============ LIST (right sidebar / mobile full screen) ============ */}
      <aside className="chat-list">
        {/* global entry */}
        <button
          type="button"
          className={`chat-list-item ${isGlobal ? "chat-list-item--active" : ""}`}
          onClick={openGlobal}
        >
          <span className="chat-list-globe">
            <Globe size={20} />
          </span>
          <div className="chat-list-info">
            <span className="chat-page-author">
              Global Chat
              {globalUnread > 0 && (
                <span className="chat-unread-badge">{globalUnread}</span>
              )}
            </span>
            <span className="chat-page-time">Everyone's here</span>
          </div>
        </button>

        <div className="chat-list-divider" />

        {/* conversations */}
        {conversations.map((conv) => (
          <button
            key={conv.user.id}
            type="button"
            className={`chat-list-item ${
              Number(dmUserId) === conv.user.id ? "chat-list-item--active" : ""
            }`}
            onClick={() => openThread(conv.user.id)}
          >
            <Avatar user={conv.user} size={40} />
            <div className="chat-list-info">
              <span className="chat-page-author">
                {displayName(conv.user)}
                {conv.user?.emailVerified && <VerifiedBadge size={12} />}
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

        {/* people you follow */}
        {newPeople.length > 0 && (
          <>
            <div className="chat-list-label">People you follow</div>
            {newPeople.map((u) => (
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
                    {u.emailVerified && <VerifiedBadge size={12} />}
                  </span>
                  <span className="chat-page-time">Start a conversation</span>
                </div>
              </button>
            ))}
          </>
        )}
      </aside>
    </div>
  );
}
