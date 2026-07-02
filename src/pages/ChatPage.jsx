import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, ArrowLeft, Globe, Mail } from "lucide-react";
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
    getConversations,
    getDmThread,
    sendDm,
    getFollowingList,
  } = useStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const dmUserId = searchParams.get("dm"); // ?dm=<userId> opens that thread

  const [tab, setTab] = useState(dmUserId ? "dms" : "global");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [following, setFollowing] = useState([]);
  const [thread, setThread] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // ---- loaders ----
  const loadGlobal = async () => {
    try {
      setMessages(await getChatMessages());
    } catch {}
    setLoading(false);
  };

  const loadConversations = async () => {
    try {
      setConversations(await getConversations());
      if (currentUser) setFollowing(await getFollowingList(currentUser.id));
    } catch {}
    setLoading(false);
  };

  const loadThread = async (userId) => {
    try {
      const data = await getDmThread(userId);
      setThread(data);
      // figure out the other user from any of their messages
      const theirMsg = data.find((m) => m.sender.id === Number(userId));
      if (theirMsg) setActiveUser(theirMsg.sender);
    } catch {}
    setLoading(false);
  };

  // ---- polling: depends on what's visible ----
  useEffect(() => {
    setLoading(true);
    clearInterval(pollRef.current);

    if (tab === "global") {
      loadGlobal();
      markChatSeen();
      pollRef.current = setInterval(() => {
        loadGlobal();
        markChatSeen();
      }, 8000);
    } else if (dmUserId) {
      loadThread(dmUserId);
      pollRef.current = setInterval(() => loadThread(dmUserId), 8000);
    } else {
      loadConversations();
      pollRef.current = setInterval(loadConversations, 8000);
    }

    return () => clearInterval(pollRef.current);
  }, [tab, dmUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thread]);

  // ---- actions ----
  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      if (tab === "global") {
        const msg = await sendChatMessage(input.trim());
        setMessages((prev) => [...prev, msg]);
        markChatSeen();
      } else if (dmUserId) {
        const msg = await sendDm(dmUserId, input.trim());
        setThread((prev) => [...prev, msg]);
      }
      setInput("");
    } catch {}
    setSending(false);
  };

  const openThread = (userId) => {
    setThread([]);
    setActiveUser(null);
    setSearchParams({ dm: userId });
    setTab("dms");
  };

  const backToList = () => {
    setSearchParams({});
    setThread([]);
    setActiveUser(null);
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

  const switchTab = (t) => {
    if (t === "global") setSearchParams({});
    setTab(t);
    setLoading(true);
  };

  // people you follow that you have no conversation with yet
  const newPeople = following.filter(
    (u) => !conversations.some((c) => c.user.id === u.id),
  );

  // ---- render ----
  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`btn ${tab === "global" ? "btn-accent" : "btn-ghost"}`}
            onClick={() => switchTab("global")}
          >
            <Globe size={15} /> Global
          </button>
          <button
            type="button"
            className={`btn ${tab === "dms" ? "btn-accent" : "btn-ghost"}`}
            onClick={() => switchTab("dms")}
          >
            <Mail size={15} /> DMs
          </button>
        </div>
        {tab === "global" && (
          <span className="chat-page-subtitle">
            Messages disappear after 24 hrs · max 1000
          </span>
        )}
        {tab === "dms" && dmUserId && activeUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={backToList}
              aria-label="Back to conversations"
            >
              <ArrowLeft size={16} />
            </button>
            <Avatar user={activeUser} size={28} />
            <strong>
              {displayName(activeUser)}
              {activeUser?.emailVerified && <VerifiedBadge size={14} />}
            </strong>
          </div>
        )}
      </div>

      {/* ---- GLOBAL TAB ---- */}
      {tab === "global" && (
        <div className="chat-page-messages">
          {loading && (
            <div className="chat-page-empty">Loading messages...</div>
          )}
          {!loading && messages.length === 0 && (
            <div className="chat-page-empty">No messages yet. Say hi! 👋</div>
          )}
          {messages.map((msg) => {
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
                      {msgUser?.emailVerified && <VerifiedBadge size={12} />}
                    </span>
                  )}
                  <div className="chat-page-bubble">{msg.content}</div>
                  <span className="chat-page-time">
                    {timeAgo(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ---- DMS TAB: conversation list + people you follow ---- */}
      {tab === "dms" && !dmUserId && (
        <div className="chat-page-messages">
          {loading && <div className="chat-page-empty">Loading...</div>}
          {!loading && conversations.length === 0 && newPeople.length === 0 && (
            <div className="chat-page-empty">
              No conversations yet. Follow people to message them!
            </div>
          )}

          {conversations.map((conv) => (
            <button
              key={conv.user.id}
              type="button"
              className="chat-page-msg"
              style={{
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: "10px 0",
              }}
              onClick={() => openThread(conv.user.id)}
            >
              <Avatar user={conv.user} size={40} />
              <div className="chat-page-bubble-wrap" style={{ flex: 1 }}>
                <span className="chat-page-author">
                  {displayName(conv.user)}
                  {conv.user?.emailVerified && <VerifiedBadge size={12} />}
                  {conv.unread > 0 && (
                    <span
                      style={{
                        marginLeft: 6,
                        background: "var(--accent, #3eff8b)",
                        color: "#000",
                        borderRadius: 10,
                        padding: "1px 7px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                      }}
                    >
                      {conv.unread}
                    </span>
                  )}
                </span>
                <div
                  className="chat-page-bubble"
                  style={{ opacity: conv.unread ? 1 : 0.7 }}
                >
                  {conv.lastMessage.slice(0, 60)}
                  {conv.lastMessage.length > 60 ? "…" : ""}
                </div>
                <span className="chat-page-time">{timeAgo(conv.lastAt)}</span>
              </div>
            </button>
          ))}

          {!loading && newPeople.length > 0 && (
            <>
              <div
                className="chat-page-subtitle"
                style={{ margin: "16px 0 8px", opacity: 0.7 }}
              >
                People you follow
              </div>
              {newPeople.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="chat-page-msg"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: "10px 0",
                  }}
                  onClick={() => openThread(u.id)}
                >
                  <Avatar user={u} size={40} />
                  <div className="chat-page-bubble-wrap">
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
          <div ref={bottomRef} />
        </div>
      )}

      {/* ---- DMS TAB: open thread ---- */}
      {tab === "dms" && dmUserId && (
        <div className="chat-page-messages">
          {loading && <div className="chat-page-empty">Loading...</div>}
          {!loading && thread.length === 0 && (
            <div className="chat-page-empty">No messages yet. Say hi! 👋</div>
          )}
          {thread.map((msg) => {
            const isMe = currentUser && msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`chat-page-msg ${isMe ? "chat-page-msg--me" : ""}`}
              >
                <Avatar user={msg.sender} size={36} />
                <div className="chat-page-bubble-wrap">
                  <div className="chat-page-bubble">{msg.content}</div>
                  <span className="chat-page-time">
                    {timeAgo(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ---- input row ---- */}
      {currentUser ? (
        tab === "global" || dmUserId ? (
          <form className="chat-page-input-row" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                tab === "global"
                  ? "Say something to everyone..."
                  : `Message ${displayName(activeUser)}...`
              }
              maxLength={tab === "global" ? 300 : 1000}
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
        ) : null
      ) : (
        <div className="chat-page-login-prompt">Log in to join the chat</div>
      )}
    </div>
  );
}
