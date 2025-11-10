// src/components/ChatContainer.jsx
import React, { useState, useEffect, useRef } from 'react';

// เราจะใช้ Animate.css ที่ติดตั้งไว้
// NOTE: อย่าลืมติดตั้งและ import 'animate.css' ใน main.jsx

const ChatContainer = ({
    roomId,
    roomName,
    messages,
    currentSocketId,
    users,
    groups,
    sendPrivateMessage,
    sendGroupMessage,
}) => {
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);

    // เลื่อนลงไปล่างสุดเมื่อมีข้อความใหม่
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ตรวจสอบว่า Room ปัจจุบันเป็น Group Chat หรือ Private Chat
    const isGroupChat = roomId && roomId.startsWith('group-');
    
    // ตรวจสอบว่าผู้ใช้เป็นสมาชิกของ Group Chat หรือไม่ (สำหรับ R11)
    const isMemberOfActiveGroup = isGroupChat 
        ? groups[roomId]?.members.includes(currentSocketId) 
        : true; // Private Chat ถือว่าเป็นสมาชิกอยู่แล้ว

    // ---------------------------------
    // Logic การตรวจจับคำพิเศษที่ Frontend (ตามที่ตกลงกัน)
    // ---------------------------------
    const SPECIAL_WORDS = {
        'สวัสดี': 'animate__animated animate__heartBeat',
        'พลุ': 'animate__animated animate__tada',
        'OMG': 'animate__animated animate__wobble'
    };

    const checkSpecialEffects = (message) => {
        const messageUpper = message.toUpperCase();
        for (const [keyword, effectName] of Object.entries(SPECIAL_WORDS)) {
            if (messageUpper.includes(keyword.toUpperCase())) {
                return effectName;
            }
        }
        return null; 
    };
    
    // ---------------------------------
    // R7, R11: การส่งข้อความ
    // ---------------------------------
    const handleSubmit = (e) => {
        e.preventDefault();
        const message = inputMessage.trim();
        if (!roomId || !message) return;

        if (isGroupChat) {
            sendGroupMessage(roomId, message); // R11
        } else {
            // หา ID ผู้รับจาก Room ID (Private Chat)
            const receiverId = roomId.split('-').find(id => id !== currentSocketId);
            console.log("Test sending private message to:", receiverId);
            sendPrivateMessage(receiverId, message); // R7
        }
        setInputMessage('');
    };
    
    const currentUsername = users[currentSocketId];
    const isDisabled = !roomId || (isGroupChat && !isMemberOfActiveGroup);

    return (
        <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2>{roomName}</h2>
            
            {/* R6: Chat Window */}
            <div className="chat-window" style={{ flexGrow: 1, border: '1px solid #ccc', padding: '10px', overflowY: 'auto', marginBottom: '10px' }}>
                {messages.map((msg, index) => {
                    const isSender = msg.sender === currentUsername;
                    // ตรวจสอบเอฟเฟกต์ที่ Frontend
                    const effectClass = checkSpecialEffects(msg.message); 

                    return (
                        <div 
                            key={index} 
                            style={{ textAlign: isSender ? 'right' : 'left', marginBottom: '5px' }}
                        >
                            {/* R7, R11: แสดงข้อความ */}
                            <span
                                className={effectClass} // ใช้ Class เอฟเฟกต์
                                style={{ 
                                    display: 'inline-block',
                                    padding: '5px 10px', 
                                    borderRadius: '15px', 
                                    background: isSender ? '#dcf8c6' : '#fff',
                                    border: '1px solid #ddd'
                                }}
                            >
                                {!isSender && <strong>{msg.sender}: </strong>}
                                {msg.message}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* R6: Chat Box */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '5px' }}>
                <input 
                    name="message"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={!roomId 
                        ? "Select a user or group to start chat." 
                        : isGroupChat && !isMemberOfActiveGroup 
                            ? "Join the group to send messages."
                            : "Type a message..."
                    }
                    disabled={isDisabled}
                    style={{ flexGrow: 1, padding: '8px' }}
                />
                <button 
                    type="submit" 
                    disabled={isDisabled || !inputMessage.trim()} 
                    style={{ padding: '8px 15px' }}
                >
                    Send
                </button>
            </form>
            {isGroupChat && !isMemberOfActiveGroup && (
                <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>*You must join the group to send messages. (R11)</p>
            )}
        </div>
    );
};

export default ChatContainer;