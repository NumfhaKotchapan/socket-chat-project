import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAppContext } from '../App';
import ChatInput from './ChatInput';

// --- Styles (เหมือนเดิม) ---
const chatWindowHeaderStyle = { padding: '10px', borderBottom: '1px solid var(--border-color)', background: 'var(--sidebar-bg)' };
const messagesContainerStyle = { flex: 1, overflowY: 'auto', padding: '10px', background: 'var(--chat-bg)' };
const messageStyle = { marginBottom: '10px', padding: '8px 12px', borderRadius: '8px', maxWidth: '70%', background: 'var(--message-bg)', wordWrap: 'break-word' };
const messageMeStyle = { ...messageStyle, background: 'var(--message-me-bg)', alignSelf: 'flex-end' };
const messageSenderStyle = { fontSize: '0.8em', fontWeight: 'bold', marginBottom: '4px' };
const systemMessageStyle = { ...messageStyle, alignSelf: 'center', background: 'none', color: 'var(--system-message-color)', fontStyle: 'italic' };
const messagesListStyle = { display: 'flex', flexDirection: 'column', gap: '5px' }
// --- End Styles ---

function ChatWindow({ currentChat }) {
  const socket = useSocket();
  const { username } = useAppContext();
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // 🔽 FIX 1: แยก "ข้อความต้อนรับ" ออกมา (ถูกต้อง)
  useEffect(() => {
    const handleServerMessage = (message) => {
      setMessages(prev => [...prev, { type: 'system', content: message }]);
    };
    socket.on("server_message", handleServerMessage);
    return () => {
      socket.off("server_message", handleServerMessage);
    };
  }, [socket]);
  // 🔼 สิ้นสุด FIX 1

  // 🌟 Feature 4: DB (ดึงประวัติแชท) (ถูกต้อง)
  useEffect(() => {
    setMessages([]); 
    if (currentChat) {
      let apiUrl = "";
      if (currentChat.type === 'private') {
        apiUrl = `http://localhost:3001/api/messages/private/${username}/${currentChat.name}`;
      } else {
        apiUrl = `http://localhost:3001/api/messages/group/${currentChat.name}`;
      }

      fetch(apiUrl)
        .then(res => res.json())
        .then(history => {
          const formattedHistory = history.map(msg => ({
            ...msg,
            type: 'chat'
          }));
          // 🔽 FIX 2: (ถูกต้อง)
          setMessages(prevMessages => [...formattedHistory, ...prevMessages]);
        })
        .catch(err => console.error("Failed to fetch history:", err));
    }
  }, [currentChat, username]);


  // Effect สำหรับรับ "ข้อความสด"
  useEffect(() => {
    const handlePrivateMessage = ({ from, message }) => {
      if (currentChat && currentChat.type === 'private' && (from === currentChat.name || from === username)) {
        setMessages(prev => [...prev, { type: 'chat', sender: from, content: message }]);
      }
    };

    // 🔽 FIX 3: แก้ไข Bug ข้อความกลุ่ม Broadcast
    const handleGroupMessage = ({ from, message, room }) => { // 1. รับ 'room' จาก payload
      // ตรวจสอบว่าข้อความนี้มาจากกลุ่มที่เราเปิดอยู่หรือไม่
      if (
        currentChat && 
        currentChat.type === 'group' &&
        currentChat.name === room // 2. เพิ่มการตรวจสอบนี้
      ) {
        setMessages(prev => [...prev, { type: 'chat', sender: from, content: message }]);
      }
    };
    // 🔼 สิ้นสุด FIX 3

    socket.on("private_message", handlePrivateMessage);
    socket.on("group_message", handleGroupMessage); // socket จะเรียก handleGroupMessage ที่แก้ไขแล้ว

    return () => {
      socket.off("private_message", handlePrivateMessage);
      socket.off("group_message", handleGroupMessage);
    };
  }, [socket, currentChat, username]); // Dependencies ถูกต้องแล้ว

  // Auto-scroll (ถูกต้อง)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- ส่วน Render (เหมือนเดิม) ---
  if (!currentChat) {
    return <div style={{...messagesContainerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Select a chat to start messaging</div>;
  }

  return (
    <>
      <div style={chatWindowHeaderStyle}>
        <h3>Chat with: {currentChat.name} ({currentChat.type})</h3>
      </div>
      
      <div style={messagesContainerStyle}>
        <div style={messagesListStyle}>
          {messages.map((msg, index) => {
            if (msg.type === 'system') {
              return <div key={index} style={systemMessageStyle}>{msg.content}</div>;
            }
            const isMe = msg.sender === username;
            return (
              <div key={index} style={isMe ? messageMeStyle : messageStyle}>
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