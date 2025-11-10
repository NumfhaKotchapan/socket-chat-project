// src/components/GroupList.jsx
import React from 'react';

const GroupList = ({ groups, onSelectGroup, onCreateGroup, onJoinGroup, currentSocketId }) => {
    
    const groupEntries = Object.entries(groups);

    const handleCreate = () => {
        const groupName = prompt('Enter a name for the new chat group:');
        if (groupName && groupName.trim()) {
            onCreateGroup(groupName.trim()); // R8
        }
    };

    return (
        <div className="group-list">
            <h4>Chat Groups ({groupEntries.length})</h4>
            <button 
                onClick={handleCreate} 
                style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
            >
                + Create New Group (R8)
            </button>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '5px' }}>
                {groupEntries.map(([id, group]) => {
                    // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นสมาชิกหรือไม่
                    const isMember = group.members.includes(currentSocketId);
                    
                    return (
                        <div 
                            key={id} 
                            style={{ cursor: 'pointer', padding: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onClick={() => onSelectGroup(id, group.name)} // R5: เลือก Group
                        >
                            {/* R9: แสดงชื่อและจำนวนสมาชิก */}
                            <span>{group.name} ({group.members.length} members)</span>
                            
                            {/* R10: ปุ่มเข้าร่วม */}
                            {!isMember ? (
                                <button 
                                    style={{ fontSize: '10px', padding: '3px 5px' }}
                                    onClick={(e) => { e.stopPropagation(); onJoinGroup(id); }} // R10
                                >
                                    Join
                                </button>
                            ) : (
                                <span style={{ fontSize: '10px', color: 'green' }}>✓ Joined</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GroupList;