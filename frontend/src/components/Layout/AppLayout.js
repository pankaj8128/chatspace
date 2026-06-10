import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatRoom from '../Chat/ChatRoom';
import OnlineUsersList from '../Chat/OnlineUsersList';
import { useChat } from '../../context/ChatContext';
import './AppLayout.css';

const AppLayout = () => {
  const { activeRoom } = useChat();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

  // Auto-close drawers when the room changes
  useEffect(() => {
    setShowSidebar(false);
    setShowOnlineUsers(false);
  }, [activeRoom?._id]);

  return (
    <div
      className={`app-layout ${activeRoom ? 'app-layout--has-active-room' : ''} ${
        showSidebar ? 'app-layout--show-sidebar' : ''
      } ${showOnlineUsers ? 'app-layout--show-users' : ''}`}
    >
      <Sidebar />
      <main className="app-layout__main">
        <ChatRoom
          onToggleSidebar={() => setShowSidebar((prev) => !prev)}
          onToggleOnlineUsers={() => setShowOnlineUsers((prev) => !prev)}
        />
      </main>
      {activeRoom && <OnlineUsersList />}

      {/* Backdrop overlay for drawers on mobile */}
      {(showSidebar || showOnlineUsers) && (
        <div
          className="app-layout__overlay"
          onClick={() => {
            setShowSidebar(false);
            setShowOnlineUsers(false);
          }}
        />
      )}
    </div>
  );
};

export default AppLayout;
