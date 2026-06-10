import React, { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import "./ChatRoom.css";

// Format timestamp
const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Group consecutive messages by same sender
const groupMessages = (messages) => {
  const groups = [];
  let currentGroup = null;
  let lastDate = null;

  messages.forEach((msg) => {
    const msgDate = formatDate(msg.createdAt);
    const senderId = msg.sender?._id || msg.sender;

    if (msgDate !== lastDate) {
      groups.push({
        type: "dateDivider",
        date: msgDate,
        id: `date-${msg._id}`,
      });
      lastDate = msgDate;
      currentGroup = null;
    }

    if (
      currentGroup &&
      currentGroup.senderId === senderId &&
      new Date(msg.createdAt) -
        new Date(
          currentGroup.messages[currentGroup.messages.length - 1].createdAt,
        ) <
        5 * 60 * 1000
    ) {
      currentGroup.messages.push(msg);
    } else {
      currentGroup = {
        type: "group",
        senderId,
        sender: msg.sender,
        messages: [msg],
        id: `group-${msg._id}`,
      };
      groups.push(currentGroup);
    }
  });

  return groups;
};

const ChatRoom = ({ onToggleSidebar, onToggleOnlineUsers }) => {
  const { activeRoom, messages, loadMoreMessages } = useChat();
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  const roomMessages = activeRoom ? messages[activeRoom._id] || [] : [];
  const grouped = groupMessages(roomMessages);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset pagination state when switching rooms
  useEffect(() => {
    if (activeRoom) {
      setPage(1);
      setHasMore(roomMessages.length >= 50);
    }
  }, [activeRoom?._id, roomMessages.length >= 50]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const pagination = await loadMoreMessages(activeRoom._id, nextPage);
    setLoadingMore(false);
    if (pagination) {
      setPage(nextPage);
      setHasMore(pagination.hasMore);
    } else {
      setHasMore(false);
    }
  };

  const lastMessageId = roomMessages[roomMessages.length - 1]?._id;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId]);

  if (!activeRoom) {
    return (
      <div className="chatroom chatroom--empty">
        <div className="chatroom__empty-state">
          <span className="chatroom__empty-icon">◈</span>
          <h2>Welcome to ChatSpace</h2>
          <p>Pick a room from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatroom">
      <div className="chatroom__header">
        <div className="chatroom__header-main">
          <button
            className="chatroom__header-btn"
            onClick={onToggleSidebar}
            title="Rooms"
          >
            ☰
          </button>
          <span className="chatroom__header-hash">#</span>
          <h1 className="chatroom__header-name">{activeRoom.name}</h1>
          <button
            className="chatroom__header-btn chatroom__header-btn--members"
            onClick={onToggleOnlineUsers}
            title="Online Members"
          >
            👥
          </button>
        </div>
        {activeRoom.description && (
          <p className="chatroom__header-desc">{activeRoom.description}</p>
        )}
      </div>

      <div className="chatroom__messages" ref={containerRef}>
        {hasMore && (
          <button
            className="chatroom__load-more-btn"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading older messages..." : "Load older messages"}
          </button>
        )}

        {roomMessages.length === 0 && (
          <div className="chatroom__no-messages">
            <span>🚀</span>
            <p>No messages yet. Be the first to say something!</p>
          </div>
        )}

        {grouped.map((item) => {
          if (item.type === "dateDivider") {
            return (
              <div key={item.id} className="chatroom__date-divider">
                <span>{item.date}</span>
              </div>
            );
          }

          const isOwn =
            item.senderId === user?._id ||
            item.senderId?.toString() === user?._id?.toString();

          return (
            <div
              key={item.id}
              className={`chatroom__group ${isOwn ? "chatroom__group--own" : ""}`}
            >
              {!isOwn && (
                <img
                  className="chatroom__avatar"
                  src={
                    item.sender?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${item.sender?.username}`
                  }
                  alt={item.sender?.username}
                />
              )}
              <div className="chatroom__group-content">
                {!isOwn && (
                  <div className="chatroom__meta">
                    <span className="chatroom__sender">
                      {item.sender?.username}
                    </span>
                    <span className="chatroom__time">
                      {formatTime(item.messages[0].createdAt)}
                    </span>
                  </div>
                )}
                {item.messages.map((msg, i) => (
                  <div
                    key={msg._id}
                    className={`chatroom__bubble ${isOwn ? "chatroom__bubble--own" : ""}`}
                  >
                    <span className="chatroom__bubble-text">{msg.content}</span>
                    {i === item.messages.length - 1 && isOwn && (
                      <span className="chatroom__bubble-time">
                        {formatTime(msg.createdAt)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div className="chatroom__footer">
        <TypingIndicator />
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatRoom;
