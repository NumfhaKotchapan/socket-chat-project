import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAppContext } from '../App';
import ThemeToggle from './ThemeToggle';

// --- Styles ---
const sidebarHeaderStyle = {
  padding: '10px',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};
const listStyle = { listStyle: 'none', padding: 0, margin: 0 };
const listItemStyle = { padding: '10px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' };
const listHeaderStyle = { padding: '10px', background: 'var(--chat-bg)', fontWeight: 'bold' };
const buttonContainerStyle = { display: 'flex', gap: '5px', padding: '10px' }
// --- End Styles ---

function Sidebar({ onSelectChat }) {
  const socket = useSocket();
  const { username } = useAppContext(); // ชื่อของเราเอง
  const [users, setUsers] = useState([]); // (R4)
  const [groups, setGroups] = useState({}); // (R9)

  useEffect(() => {
    // ฟัง event จาก server
    socket.on("user_list", (userList) => {
      setUsers(userList);
    });

    socket.on("group_list", (groupList) => {
      setGroups(groupList);
    });

    // 🔽 2. เพิ่มส่วนนี้: ร้องขอ list "ปัจจุบัน" ทันที 🔽
    socket.emit("get_initial_lists");

    // Cleanup
    return () => {
      socket.off("user_list");
      socket.off("group_list");
    };
  }, [socket]);

  // (R8)
  const handleCreateGroup = () => {
    const groupName = prompt("Enter new group name:");
    if (groupName) {
      socket.emit("create_group", groupName);

      // 🔽 เพิ่มบรรทัดนี้ 🔽
      // สั่งให้ ChatPage เปลี่ยนหน้าต่างแชทไปที่กลุ่มใหม่ทันที
      onSelectChat({ type: 'group', name: groupName });
    }
  };

  // (R10)
  const handleJoinGroup = (groupName) => {
    socket.emit("join_group", groupName);
    onSelectChat({ type: 'group', name: groupName });
  };

  return (
    <>
      <div style={sidebarHeaderStyle}>
        Logged in as: <strong>{username}</strong>
        <ThemeToggle />
      </div>

      <div style={buttonContainerStyle}>
        <button onClick={handleCreateGroup} style={{width: '100%'}}>Create Group</button>
      </div>

      {/* (R4) Private Messages List */}
      <div style={listHeaderStyle}>Private Messages</div>
      <ul style={listStyle}>
        {users.filter(u => u !== username).map(user => (
          <li
            key={user}
            style={listItemStyle}
            onClick={() => onSelectChat({ type: 'private', name: user })}
          >
            {user}
          </li>
        ))}
      </ul>

      {/* (R9) Group Messages List */}
      <div style={listHeaderStyle}>Groups</div>
      <ul style={listStyle}>
        {Object.keys(groups).map(groupName => (
          <li
            key={groupName}
            style={listItemStyle}
            onClick={() => handleJoinGroup(groupName)}
          >
            {groupName} ({groups[groupName].length} members)
          </li>
        ))}
      </ul>
    </>
  );
}

export default Sidebar;