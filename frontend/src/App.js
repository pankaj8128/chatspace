import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import AuthPage from './components/Auth/AuthPage';
import AppLayout from './components/Layout/AppLayout';
import './styles/globals.css';

const App = () => {
  const { user, initSocket } = useAuth();

  // Reconnect socket if page is refreshed while logged in
  useEffect(() => {
    if (user) initSocket();
  }, [user, initSocket]);

  if (!user) {
    return <AuthPage />;
  }

  return (
    <ChatProvider>
      <AppLayout />
    </ChatProvider>
  );
};

export default App;
