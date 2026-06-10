import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { rooms, activeRoom, joinRoom, createRoom, fetchRooms, roomsLoading } =
    useChat();

  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setCreateError("Room name is required");
      return;
    }
    setCreating(true);
    setCreateError("");
    const result = await createRoom(newRoomName.trim(), newRoomDesc.trim());
    setCreating(false);
    if (result.success) {
      setNewRoomName("");
      setNewRoomDesc("");
      setShowCreate(false);
      joinRoom(result.room);
    } else {
      setCreateError(result.message);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-icon">◈</span>
        <span className="sidebar__brand-name">ChatSpace</span>
      </div>

      <div className="sidebar__section-header">
        <span className="sidebar__section-label">Rooms</span>
        <button
          className="sidebar__icon-btn"
          title="Create room"
          onClick={() => {
            setShowCreate((v) => !v);
            setCreateError("");
          }}
        >
          {showCreate ? "✕" : "+"}
        </button>
      </div>

      {showCreate && (
        <form className="sidebar__create-form" onSubmit={handleCreateRoom}>
          <input
            className="sidebar__input"
            type="text"
            placeholder="Room name"
            value={newRoomName}
            onChange={(e) => {
              setNewRoomName(e.target.value);
              setCreateError("");
            }}
            autoFocus
            maxLength={30}
          />
          <input
            className="sidebar__input"
            type="text"
            placeholder="Description (optional)"
            value={newRoomDesc}
            onChange={(e) => setNewRoomDesc(e.target.value)}
            maxLength={150}
          />
          {createError && (
            <p className="sidebar__create-error">{createError}</p>
          )}
          <button
            className="sidebar__create-btn"
            type="submit"
            disabled={creating}
          >
            {creating ? "Creating…" : "Create Room"}
          </button>
        </form>
      )}

      <div className="sidebar__rooms">
        {roomsLoading && <div className="sidebar__empty">Loading rooms…</div>}
        {!roomsLoading && rooms.length === 0 && (
          <div className="sidebar__empty">No rooms yet. Create one!</div>
        )}
        {rooms.map((room) => (
          <button
            key={room._id}
            className={`sidebar__room-item ${activeRoom?._id === room._id ? "active" : ""}`}
            onClick={() => joinRoom(room)}
          >
            <span className="sidebar__room-hash">#</span>
            <div className="sidebar__room-info">
              <span className="sidebar__room-name">{room.name}</span>
              {room.description && (
                <span className="sidebar__room-desc">{room.description}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="sidebar__user">
        <img
          className="sidebar__user-avatar"
          src={user?.avatar}
          alt={user?.username}
        />
        <div className="sidebar__user-info">
          <span className="sidebar__user-name">{user?.username}</span>
          <span className="sidebar__user-status">
            <span className="sidebar__status-dot" /> Online
          </span>
        </div>
        <button className="sidebar__logout-btn" onClick={logout} title="Logout">
          ⎋
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
