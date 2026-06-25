import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { useStore } from "../lib/store";
import Avatar from "../components/Avatar";
import { timeAgo } from "../lib/time";

export default function ChatPage() {
  const { getChatMessages, sendChatMessage, currentUser } = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const load = async () => {
    try {
      const data = await getChatMessages();
      setMessages(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 8000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendChatMessage(input.trim());
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } catch {}
    setSending(false);
  };

  const displayName = (user) => {
    if (!user) return "User";
    return user.name || user.username || user.email?.split("@")[0] || "User";
  };

  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <h1>🌐 Global Chat</h1>
        <span className="chat-page-subtitle">
          Messages disappear after 24 hrs · max 1000
        </span>
      </div>

      <div className="chat-page-messages">
        {loading && <div className="chat-page-empty">Loading messages...</div>}
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
              <Avatar
                user={{
                  name: msgUser?.name,
                  username: msgUser?.username,
                  email: msgUser?.email,
                  avatarUrl: msgUser?.avatarUrl,
                  id: msgUser?.id,
                }}
                size={36}
              />
              <div className="chat-page-bubble-wrap">
                {!isMe && (
                  <span className="chat-page-author">
                    {displayName(msgUser)}
                  </span>
                )}
                <div className="chat-page-bubble">{msg.content}</div>
                <span className="chat-page-time">{timeAgo(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {currentUser ? (
        <form className="chat-page-input-row" onSubmit={send}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something to everyone..."
            maxLength={300}
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
  );
}
