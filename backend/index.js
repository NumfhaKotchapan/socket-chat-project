// /backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  // ตั้งค่า CORS เพื่ออนุญาตให้ Frontend (Vite, พอร์ต 5731) เชื่อมต่อได้
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// **********************************************
// ** Global State Management (R4, R9) **
// ** เก็บข้อมูลผู้ใช้และกลุ่มในหน่วยความจำของ Server **
// **********************************************

// R4: เก็บรายชื่อผู้ใช้ที่เชื่อมต่อ { socketId: 'username' }
const USER_LIST = {}; 
// R9: เก็บข้อมูลกลุ่ม { groupId: { name: 'Group Name', members: ['socketId1', 'socketId2'] } }
const CHAT_GROUPS = {}; 

/**
 * ฟังก์ชันสำหรับ Broadcast ข้อมูลสถานะ (รายชื่อผู้ใช้/กลุ่ม) ให้ทุกคน
 */
function broadcastStatus() {
    // R4: ส่งรายชื่อผู้ใช้ทั้งหมด
    io.emit('user_list_update', USER_LIST); 
    // R9: ส่งรายชื่อกลุ่มทั้งหมด
    io.emit('group_list_update', CHAT_GROUPS); 
}

io.on('connection', (socket) => {
    console.log(`[CONNECT] A user connected: ${socket.id}`);

    // **********************************************
    // ** Connection & User Setup (R3, R4) **
    // **********************************************
    
    // R3: รับชื่อผู้ใช้เมื่อเชื่อมต่อสำเร็จจาก Frontend
    socket.on('set_username', (username) => {
        USER_LIST[socket.id] = username;
        console.log(`[USER] User ${username} joined.`);
        broadcastStatus();
    });

    // เมื่อผู้ใช้ตัดการเชื่อมต่อ
    socket.on('disconnect', () => {
        const disconnectedUser = USER_LIST[socket.id];
        
        // ลบผู้ใช้ออกจากรายการ
        delete USER_LIST[socket.id];
        
        // R9/R10: ลบผู้ใช้ออกจาก Group ทั้งหมดที่เคยเข้าร่วม
        for (const groupId in CHAT_GROUPS) {
            const group = CHAT_GROUPS[groupId];
            const index = group.members.indexOf(socket.id);
            if (index > -1) {
                group.members.splice(index, 1);
                // ถ้ากลุ่มไม่มีสมาชิกเหลือ ให้ลบกลุ่มทิ้ง
                if (group.members.length === 0) {
                    delete CHAT_GROUPS[groupId];
                    console.log(`[GROUP] Group ${group.name} deleted.`);
                }
            }
        }

        console.log(`[DISCONNECT] User ${disconnectedUser} disconnected.`);
        broadcastStatus();
    });

    // **********************************************
    // ** Private Message Logic (R7) **
    // **********************************************

    // R7: รับข้อความส่วนตัวจากผู้ส่ง
    socket.on('send_private_message', ({ receiverId, message }) => {
        // R5: สร้าง Private Room ID ที่ไม่ซ้ำกัน (เช่น เรียงตาม ID เพื่อให้ Room ID เดียวกันเสมอ)
        const privateRoomId = [socket.id, receiverId].sort().join('-'); 
        
        // ให้ผู้ส่งและผู้รับเข้าร่วม Room (สำคัญสำหรับ R7)
        socket.join(privateRoomId);
        if (io.sockets.sockets.has(receiverId)) {
             io.sockets.sockets.get(receiverId).join(privateRoomId);
        }

        // R7/R5: ส่งข้อความไปเฉพาะสมาชิกใน Room ID นั้น (Sender + Receiver)
        io.to(privateRoomId).emit('new_message', { 
            sender: USER_LIST[socket.id] || 'Unknown', 
            message: message, 
            roomId: privateRoomId,
            type: 'private'
        });
        console.log(`[MSG] Private: ${USER_LIST[socket.id]} -> ${USER_LIST[receiverId]} in Room ${privateRoomId}`);
    });

    // **********************************************
    // ** Group Message Logic (R8, R10, R11) **
    // **********************************************

    // R8: สร้าง Group
    socket.on('create_group', (groupName) => {
        const groupId = `group-${Date.now()}`;
        // R8: ผู้สร้างเป็นสมาชิกคนแรก
        CHAT_GROUPS[groupId] = { name: groupName, members: [socket.id] };
        socket.join(groupId); // ผู้สร้างเข้าร่วม Room ของ Socket.IO ทันที
        
        broadcastStatus(); // R9: อัปเดต Group List ให้ทุกคน

        console.log(`[GROUP] ${USER_LIST[socket.id]} created group ${groupName}`);
    });

    // R10: เข้าร่วม Group
    socket.on('join_group', (groupId) => {
        const user = USER_LIST[socket.id];
        if (CHAT_GROUPS[groupId] && !CHAT_GROUPS[groupId].members.includes(socket.id)) {
            // R10: เพิ่มสมาชิกใน Global State
            CHAT_GROUPS[groupId].members.push(socket.id);
            socket.join(groupId); // R10: เข้า Room ของ Socket.IO
            
            broadcastStatus(); // R9: อัปเดต Group List ให้ทุกคน

            // ส่งข้อความแจ้งใน Group นั้น ๆ (R11)
            io.to(groupId).emit('new_message', { 
                sender: 'System', 
                message: `${user} has joined the group.`, 
                roomId: groupId,
                type: 'group'
            });
            console.log(`[GROUP] ${user} joined group ${CHAT_GROUPS[groupId].name}`);
        }
    });

    // R11: ส่งข้อความ Group
    socket.on('send_group_message', ({ groupId, message }) => {
        // R11/R5: ส่งข้อความไปเฉพาะ Room ID ของ Group นั้น
        io.to(groupId).emit('new_message', { 
            sender: USER_LIST[socket.id] || 'Unknown', 
            message: message, 
            roomId: groupId,
            type: 'group'
        });
        console.log(`[MSG] Group: ${USER_LIST[socket.id]} sent to ${CHAT_GROUPS[groupId]?.name}`);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`\n***************************************`);
    console.log(`* 🚀 Socket.IO Server running on port ${PORT} *`);
    console.log(`***************************************\n`);
});