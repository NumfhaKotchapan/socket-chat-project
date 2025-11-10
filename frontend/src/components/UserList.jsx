// src/components/UserList.jsx
import React from 'react';

// Props ที่รับมา:
// users: รายชื่อผู้ใช้ทั้งหมด { socketId: 'username' }
// currentSocketId: ID ของผู้ใช้ปัจจุบัน
// onSelectChat: ฟังก์ชันสำหรับเริ่ม Private Chat
const UserList = ({ users, currentSocketId, onSelectChat }) => {
    
    // แปลง Object ผู้ใช้ให้เป็น Array
    const userEntries = Object.entries(users);

    return (
        <div className="user-list">
            <h4>Users Online ({userEntries.length})</h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '5px' }}>
                {userEntries.map(([id, name]) => (
                    // R4: แสดงรายชื่อผู้ใช้ทั้งหมด
                    <div 
                        key={id} 
                        style={{ cursor: id === currentSocketId ? 'default' : 'pointer', 
                                 padding: '5px', 
                                 background: id === currentSocketId ? '#f0f0f0' : 'none',
                                 fontWeight: id === currentSocketId ? 'bold' : 'normal'
                                }}
                        // R7: เมื่อคลิก ให้เลือก Private Chat
                        onClick={() => {
                            if (id !== currentSocketId) {
                                // ส่ง Room ID (ID ของผู้ใช้ทั้งสอง) และชื่อผู้รับกลับไป
                                const roomId = [currentSocketId, id].sort().join('-');
                                onSelectChat(roomId, name);
                            }
                        }}
                    >
                        {name} {id === currentSocketId ? ' (You)' : ''}
                    </div>
                ))}
                {userEntries.length === 1 && (
                    <p style={{ margin: '5px', fontSize: '12px', color: '#666' }}>Waiting for other clients...</p>
                )}
            </div>
        </div>
    );
};

export default UserList;