import React from 'react';
import { useChat } from '../../context/ChatContext';
import './TypingIndicator.css';

const TypingIndicator = () => {
  const { activeRoom, typingUsers } = useChat();
  if (!activeRoom) return null;

  const typers = activeRoom ? [...(typingUsers[activeRoom._id] || [])] : [];
  if (typers.length === 0) return <div className="typing-indicator typing-indicator--empty" />;

  let label;
  if (typers.length === 1) label = `${typers[0]} is typing`;
  else if (typers.length === 2) label = `${typers[0]} and ${typers[1]} are typing`;
  else label = `${typers.length} people are typing`;

  return (
    <div className="typing-indicator">
      <span className="typing-dots">
        <span /><span /><span />
      </span>
      <span className="typing-text">{label}</span>
    </div>
  );
};

export default TypingIndicator;
