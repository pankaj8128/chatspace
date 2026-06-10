import React, { useState, useRef, useCallback } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import "./MessageInput.css";

const MessageInput = () => {
  const { sendMessage, sendTyping, sendStopTyping, activeRoom } = useChat();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const typingTimeout = useRef(null);
  const isTyping = useRef(false);

  const isGuest = user?.username?.startsWith("guest_");

  const handleChange = (e) => {
    if (isGuest) return;
    setText(e.target.value);

    // Emit typing event
    if (!isTyping.current) {
      isTyping.current = true;
      sendTyping();
    }

    // Reset stop-typing timer
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      sendStopTyping();
    }, 1500);
  };

  const handleSend = useCallback(() => {
    if (isGuest || !text.trim()) return;
    sendMessage(text);
    setText("");
    clearTimeout(typingTimeout.current);
    isTyping.current = false;
    sendStopTyping();
  }, [text, sendMessage, sendStopTyping, isGuest]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeRoom) return null;

  return (
    <div className="message-input">
      <div className={`message-input__wrap ${isGuest ? "message-input__wrap--disabled" : ""}`}>
        <textarea
          className="message-input__textarea"
          placeholder={isGuest ? "Guest view only. Create an account to send messages." : `Message #${activeRoom.name}`}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isGuest}
          rows={1}
          maxLength={1000}
        />
        <button
          className="message-input__send"
          onClick={handleSend}
          disabled={isGuest || !text.trim()}
          title={isGuest ? "Guest cannot send messages" : "Send message (Enter)"}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

const SendIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default MessageInput;
