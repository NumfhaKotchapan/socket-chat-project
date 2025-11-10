import React, { useState, useMemo } from 'react';
import useChatSocket from './hooks/useChatSocket';
import UserList from './components/UserList';         
import GroupList from './components/GroupList';       
import ChatContainer from './components/ChatContainer';

function App() {
  // ---------------------------------
  // 1. State Management (สำคัญมาก!)
  // ---------------------------------
  const [inputUsername, setInputUsername] = useState(''); // input สำหรับฟอร์ม Login
  
  // R5: State สำหรับ Active Chat Room
  const [activeRoomId, setActiveRoomId] = useState(null); 
  const [activeRoomName, setActiveRoomName] = useState('Welcome'); 

  // 2. Hook Call: ดึงค่าและฟังก์ชันทั้งหมดจาก Socket Hook
  const { 
    isInitialized, 
    currentSocketId, 
    messages, 
    users, 
    groups, 
    initialize, 
    sendPrivateMessage, 
    createGroup,
    joinGroup,
    sendGroupMessage
  } = useChatSocket(); // <--- เรียกใช้ Hook เพื่อดึง State และ Functions

  // 3. Logic: Login และเชื่อมต่อ Socket (R3)
  const handleLogin = (e) => {
    e.preventDefault();
    if (inputUsername.trim()) {
      initialize(inputUsername.trim()); // เชื่อมต่อ Socket.IO ด้วยชื่อผู้ใช้
    }
  };

  // Helper: หาชื่อผู้ใช้ปัจจุบัน
  const currentUsername = users[currentSocketId]; 

  // 4. Logic: จัดการการเลือก Room

  // R5, R7: สร้าง Room ID สำหรับ Private Chat เมื่อคลิก
  const handleSelectPrivateChat = (roomId, targetUserName) => {
    setActiveRoomId(roomId);
    setActiveRoomName(`Private Chat with ${targetUserName}`);
  };

  // R5, R11: เลือก Group Chat
  const handleSelectGroupChat = (groupId, groupName) => {
    setActiveRoomId(groupId);
    setActiveRoomName(`Group: ${groupName}`);
  };
  
  // 5. Logic: กรองข้อความสำหรับ Room ที่กำลังเปิดอยู่ (R5, R7, R11)
  const activeRoomMessages = useMemo(() => {
    return messages.filter(msg => msg.roomId === activeRoomId);
  }, [messages, activeRoomId]);


  // ---------------------------------
  // 6. Conditional Rendering: หน้า Login (R3)
  // ---------------------------------
  if (!isInitialized) {
    return (
      <div style={{ padding: '40px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Enter Your Name (R3)</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            value={inputUsername} 
            onChange={(e) => setInputUsername(e.target.value)} 
            placeholder="Your unique name..."
            style={{ padding: '10px', fontSize: '16px' }}
          />
          <button type="submit" disabled={!inputUsername.trim()} style={{ padding: '10px', fontSize: '16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
            Connect to Chat
          </button>
        </form>
      </div>
    );
  }

  // ---------------------------------
  // 7. Main Chat Interface (R4, R9, R5, R6)
  // ---------------------------------
  return (
    <div style={{ display: 'flex', height: '100vh', margin: '10px', gap: '10px' }}>
      
      {/* Sidebar - R4, R9 */}
      <div style={{ width: '250px', borderRight: '1px solid #ccc', paddingRight: '10px' }}>
        <h3>Welcome, {currentUsername}</h3>
        
        {/* R4: รายชื่อผู้ใช้ */}
        <UserList 
          users={users} 
          currentSocketId={currentSocketId} 
          onSelectChat={handleSelectPrivateChat} 
        />
        
        <hr />
        
        {/* R9: รายชื่อกลุ่ม */}
        <GroupList 
          groups={groups} 
          onSelectGroup={handleSelectGroupChat}
          onCreateGroup={createGroup}
          onJoinGroup={joinGroup}
          currentSocketId={currentSocketId}
        />
      </div>

      {/* Main Chat Area - R5, R6 */}
      <div style={{ flexGrow: 1 }}>
        {/* R5, R6, R7, R11: หน้าต่างแชท */}
        <ChatContainer
          roomId={activeRoomId}
          roomName={activeRoomName}
          messages={activeRoomMessages}
          users={users}
          groups={groups}
          currentSocketId={currentSocketId}
          sendPrivateMessage={sendPrivateMessage}
          sendGroupMessage={sendGroupMessage}
        />
      </div>
    </div>
  );
}

export default App;