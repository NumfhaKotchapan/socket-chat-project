import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

// --- Styles (CSS-in-JS) ---
const chatPageStyle = {
  display: 'flex',
  height: '100vh',
  backgroundColor: 'var(--bg-color)',
  color: 'var(--text-color)'
};

const sidebarStyle = {
  width: '300px',
  borderRight: '1px solid var(--border-color)',
  backgroundColor: 'var(--sidebar-bg)',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto'
};

const chatWindowStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column'
};
// --- End Styles ---


function ChatPage() {
  // State นี้สำคัญมาก: บอกว่ากำลังแชทกับใคร
  // เช่น { type: 'private', name: 'Bob' }
  // หรือ { type: 'group', name: 'Developers' }
  const [currentChat, setCurrentChat] = useState(null);

  return (
    <div style={chatPageStyle}>
      <div style={sidebarStyle}>
        <Sidebar onSelectChat={setCurrentChat} />
      </div>

      <div style={chatWindowStyle}>
        <ChatWindow currentChat={currentChat} />
      </div>
    </div>
  );
}

export default ChatPage;