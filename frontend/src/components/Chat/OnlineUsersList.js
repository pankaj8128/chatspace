import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import './OnlineUsersList.css';

const OnlineUsersList = () => {
  const { activeRoom, onlineUsers } = useChat();
  const { user } = useAuth();

  if (!activeRoom) return null;

  const users = onlineUsers[activeRoom._id] || [];

  return (
    <aside className="online-users">
      <div className="online-users__header">
        <span className="online-users__label">Online</span>
        <span className="online-users__count">{users.length}</span>
      </div>

      <div className="online-users__list">
        {users.length === 0 && (
          <p className="online-users__empty">No users online</p>
        )}
        {users.map((u) => (
          <div key={u.socketId || u.userId} className="online-users__item">
            <div className="online-users__avatar-wrap">
              <img
                className="online-users__avatar"
                src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`}
                alt={u.username}
              />
              <span className="online-users__dot" />
            </div>
            <span className="online-users__name">
              {u.username}
              {u.userId?.toString() === user?._id?.toString() && (
                <span className="online-users__you"> (you)</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default OnlineUsersList;
