import { useState, useEffect, useRef } from "react";
import { Send, X } from "lucide-react";
import { useStore } from "../lib/store";
import { useChat } from "../context/ChatContext";
import Avatar from "./Avatar";
import { timeAgo } from "../lib/time";

export default function ChatRoom() {
  const { getChatMessages, sendChatMessage, currentUser } = useStore();
  const { chatOpen, setChatOpen } = useChat();
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
    if (chatOpen) {
      load();
      pollRef.current = setInterval(load, 8000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [chatOpen]);

  useEffect(() => {
    if (chatOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

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

  if (!chatOpen) return null;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span>🌐 Global Chat</span>
        <span className="chat-subtitle">Messages last 24 hrs · max 1000</span>
        <button onClick={() => setChatOpen(false)} aria-label="Close chat">
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
                  <span className="chat-author">{displayName(msg.user)}</span>
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
  );
}
