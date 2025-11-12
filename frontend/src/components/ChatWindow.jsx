import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAppContext } from '../App'; // 🛑 (1) นำเข้า useAppContext
import ChatInput from './ChatInput';

// --- Styles (ถูกปรับให้ใช้ CSS Variables อย่างเต็มที่) ---

const GLOBAL_FONT = 'Poppins, sans-serif';

const chatWindowHeaderStyle = {
  padding: '15px 20px',
  borderBottom: '1px solid var(--border-color)', // 🛑 (3)
  background: 'var(--sidebar-bg)', // 🛑 (3)
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontFamily: GLOBAL_FONT,
  color: 'var(--text-color)', // 🛑 (3)
};

const messagesContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
  background: 'var(--chat-bg)', // 🛑 (3)
};

const messagesListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const messageStyle = {
  marginBottom: '0px',
  padding: '10px 15px',
  borderRadius: '18px 18px 18px 0',
  maxWidth: '65%',
  background: 'var(--message-bg)', // 🛑 (3)
  wordWrap: 'break-word',
  alignSelf: 'flex-start',
  color: 'var(--text-color)', // 🛑 (3)
  fontFamily: GLOBAL_FONT,
  fontSize: '15px',
};

const messageMeStyle = {
  ...messageStyle,
  background: 'var(--message-me-bg)', // 🛑 (3)
  alignSelf: 'flex-end',
  borderRadius: '18px 18px 0 18px',
  color: 'var(--message-me-text-color, #FFFFFF)',
};

const messageSenderStyle = {
  fontSize: '0.75em',
  fontWeight: '600',
  marginBottom: '4px',
  color: 'var(--system-message-color)', // 🛑 (3)
};

const systemMessageStyle = {
  alignSelf: 'center',
  background: 'var(--system-message-bg, rgba(76, 110, 245, 0.1))',
  color: 'var(--system-message-color, #4C6EF5)',
  padding: '6px 15px',
  borderRadius: '18px',
  fontStyle: 'normal',
  fontSize: '0.85em',
  fontWeight: '500',
  marginTop: '5px',
  marginBottom: '10px',
};

// --- End Styles ---

function ChatWindow({ currentChat }) {
  const socket = useSocket();
  const { username, currentChat: contextChat, theme, toggleTheme } = useAppContext(); // 🛑 (1)

  const SERVER_URL =
    import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3001`;

  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // 🔽 FIX 1: แยก "ข้อความต้อนรับ" ออกมา
  useEffect(() => {
    const handleServerMessage = (message) => {
      setMessages((prev) => [...prev, { type: 'system', content: message }]);
    };

    socket.on('server_message', handleServerMessage);
    return () => {
      socket.off('server_message', handleServerMessage);
    };
  }, [socket]);

  // 🌟 Feature 4: DB (ดึงประวัติแชท)
  useEffect(() => {
    setMessages([]);

    if (currentChat) {
      let apiUrl = '';

      if (currentChat.type === 'private') {
        apiUrl = `${SERVER_URL}/api/messages/private/${username}/${currentChat.name}`;
      } else {
        apiUrl = `${SERVER_URL}/api/messages/group/${currentChat.name}`;
      }

      fetch(apiUrl)
        .then((res) => res.json())
        .then((history) => {
          const formattedHistory = history.map((msg) => ({
            ...msg,
            type: 'chat',
          }));
          setMessages((prevMessages) => [...formattedHistory, ...prevMessages]);
        })
        .catch((err) => console.error('Failed to fetch history:', err));
    }
  }, [currentChat, username]);

  // Effect สำหรับรับ "ข้อความสด"
  useEffect(() => {
    const handlePrivateMessage = ({ from, message }) => {
      if (
        currentChat &&
        currentChat.type === 'private' &&
        (from === currentChat.name || from === username)
      ) {
        setMessages((prev) => [...prev, { type: 'chat', sender: from, content: message }]);
      }
    };

    const handleGroupMessage = ({ from, message,room }) => {
      if (currentChat && currentChat.type === 'group' && room === currentChat.name) {
        setMessages((prev) => [...prev, { type: 'chat', sender: from, content: message }]);
      }
    };

    socket.on('private_message', handlePrivateMessage);
    socket.on('group_message', handleGroupMessage);

    return () => {
      socket.off('private_message', handlePrivateMessage);
      socket.off('group_message', handleGroupMessage);
    };
  }, [socket, currentChat, username]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- ส่วน Render ---
  if (!currentChat) {
    return (
      <div
        style={{
          ...messagesContainerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: GLOBAL_FONT,
        }}
      >
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <>
      <div style={chatWindowHeaderStyle}>
        <h3>
          # {currentChat.name}{' '}
          ({currentChat.type === 'group' ? 'Group Message' : 'Direct Message'})
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '14px' }}>
          <button
            onClick={toggleTheme} // 🛑 (2)
            style={{
              padding: '8px 15px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: 'var(--toggle-botton-bg)',
              color: 'var(--accent-text)',
              cursor: 'pointer',
              fontFamily: GLOBAL_FONT,
            }}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>

      <div style={messagesContainerStyle}>
        <div style={messagesListStyle}>
          {messages.map((msg, index) => {
            if (msg.type === 'system') {
              return <div key={index} style={systemMessageStyle}>{msg.content}</div>;
            }

            const isMe = msg.sender === username;
            return (
              <div
                key={index}
                style={isMe ? messageMeStyle : messageStyle}
                className={isMe ? 'message-me' : 'message-other'}
              >
                {!isMe && <div style={messageSenderStyle}>{msg.sender}</div>}
                {msg.content}
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <ChatInput currentChat={currentChat} />
    </>
  );
}

export default ChatWindow;
