import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAppContext } from '../App';

// --- Styles ---
const inputFormStyle = {
  display: 'flex',
  padding: '10px',
  borderTop: '1px solid var(--border-color)',
  background: 'var(--sidebar-bg)'
};
const inputStyle = { flex: 1, marginRight: '10px' };
// --- End Styles ---

function ChatInput({ currentChat }) {
  const [message, setMessage] = useState("");
  const socket = useSocket();
  const { setShowSnow } = useAppContext(); // 🌟 Feature 2

  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessage(text);

    // 🌟 Feature 2: Check for "Christmas"
    if (text.toLowerCase().includes("christmas")) {
      setShowSnow(true);
    } else {
      setShowSnow(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !currentChat) return;

    // (R7)
    if (currentChat.type === 'private') {
      socket.emit("private_message", {
        to: currentChat.name,
        message: message.trim()
      });
    }

    // (R11)
    if (currentChat.type === 'group') {
      socket.emit("group_message", {
        room: currentChat.name,
        message: message.trim()
      });
    }

    setMessage(""); // เคลียร์ input
    setShowSnow(false); // ปิดหิมะหลังส่ง
  };

  return (
    <form onSubmit={handleSubmit} style={inputFormStyle}>
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={handleInputChange}
        style={inputStyle}
      />
      <button type="submit">Send</button>
    </form>
  );
}

export default ChatInput;