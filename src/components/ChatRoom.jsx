import { useState, useEffect, useRef, useContext } from "react";
import { Send, MessageCircle, X } from "lucide-react";
import { StoreContext } from "../lib/store";
import Avatar from "./Avatar";
import { timeAgo } from "../lib/time";

export default function ChatRoom() {
  const { getChatMessages, sendChatMessage, currentUser } =
    useContext(StoreContext);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const load = async () => {
    try {
      const data = await getChatMessages();
      setMessages(data);
    } catch {}
  };

  useEffect(() => {
    if (open) {
      load();
      pollRef.current = setInterval(load, 8000); // poll every 8s
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

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

  const displayName = (user) =>
    user.name || user.username || user.email?.split("@")[0] || "User";

  return (
    <>
      {/* Floating button */}
      <button
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open global chat"
      >
        <MessageCircle size={22} />
        <span>Chat</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>🌐 Global Chat</span>
            <span className="chat-subtitle">
              Messages last 24 hrs · max 1000
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={16} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">No messages yet. Say hi! 👋</div>
            )}
            {messages.map((msg) => {
              const isMe = currentUser && msg.userId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`chat-msg ${isMe ? "chat-msg--me" : ""}`}
                >
                  {!isMe && (
                    <Avatar
                      avatarUrl={msg.user.avatarUrl}
                      name={displayName(msg.user)}
                      size={28}
                    />
                  )}
                  <div className="chat-bubble-wrap">
                    {!isMe && (
                      <span className="chat-author">
                        {displayName(msg.user)}
                      </span>
                    )}
                    <div className="chat-bubble">{msg.content}</div>
                    <span className="chat-time">{timeAgo(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {currentUser ? (
            <form className="chat-input-row" onSubmit={send}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Say something..."
                maxLength={300}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </form>
          ) : (
            <div className="chat-login-prompt">Log in to join the chat</div>
          )}
        </div>
      )}
    </>
  );
}
