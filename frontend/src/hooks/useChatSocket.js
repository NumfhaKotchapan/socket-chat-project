import { useState, useEffect, useCallback } from "react";
import { socket } from "../services/socket";

const useChatSocket = () => {
    // ---------------------------------
    // State สำหรับเก็บข้อมูล (แก้ไขชื่อตัวแปรให้ตรงกับที่ใช้)
    // ---------------------------------
    const [isInitialized, setIsInitialized] = useState(socket.connected); // สถานะการเชื่อมต่อ
    const [currentSocketId, setCurrentSocketId] = useState(null);       // ID ของ Socket ปัจจุบัน
    const [messages, setMessages] = useState([]);                       // ข้อความทั้งหมด
    const [users, setUsers] = useState({});                             // R4: รายชื่อผู้ใช้ {socketId: username}
    const [groups, setGroups] = useState({});                           // R9: รายชื่อกลุ่ม {groupId: groupData}

    const SPECIAL_WORDS = {
    'hello': 'animate__animated animate__heartBeat',
    'พลุ': 'animate__animated animate__tada',
    'หิมะ': 'animate__animated animate__lightSpeedInLeft', 
    'OMG': 'animate__animated animate__wobble'
    };
    // ฟังก์ชันตรวจสอบคำพิเศษที่ทำงานบน Client
    function checkSpecialEffects(message) {
        const messageUpper = message.toUpperCase();
        for (const [keyword, effectName] of Object.entries(SPECIAL_WORDS)) {
            if (messageUpper.includes(keyword.toUpperCase())) {
                return effectName; // ส่ง Class Name กลับไป
            }
        }
        return null; 
    }
    // NOTE: rooms state และ user state ถูกลบออก/เปลี่ยนชื่อ เพื่อใช้ users, groups, currentSocketId แทน

    // ---------------------------------
    // R3: ฟังก์ชันเริ่มต้นการเชื่อมต่อ
    // ---------------------------------
    const initialize = useCallback((username) => {
        if (isInitialized) return;
        
        socket.connect();
        socket.emit('set_username', username); 
        setIsInitialized(true);
        
    }, [isInitialized]);

    // ---------------------------------
    // Event Listeners (R4, R9, R7, R11)
    // ---------------------------------
    useEffect(() => {
        // RENDER GUARD: จะไม่ลงทะเบียน Listener จนกว่าจะเรียก initialize()
        if (!isInitialized) return;

        // เชื่อมต่อสำเร็จ
        socket.on('connect', () => {
            // **[แก้ไข]** ตั้งค่า currentSocketId เมื่อเชื่อมต่อสำเร็จ
            setCurrentSocketId(socket.id); 
            console.log("Connected with ID:", socket.id);
        });
        
        socket.on('user_list_update', setUsers);   // R4
        socket.on('group_list_update', setGroups); // R9
        
    
        socket.on('new_message', (msg) => {
        // **[แก้ไข]** ตรวจสอบเอฟเฟกต์ที่ Frontend ทันทีที่ได้รับข้อความ
        const effectClass = checkSpecialEffects(msg.message); 
            setMessages(prev => [
                ...prev, 
                {
                    ...msg, 
                    effect: effectClass // เพิ่ม property 'effect' เข้าไปในข้อความ
                }
            ]);
        });

        // Clean-up: 
        return () => {
            socket.off('connect');
            socket.off('user_list_update');
            socket.off('group_list_update');
            socket.off('new_message');
            // socket.disconnect(); // NOTE: มักจะไม่ตัดการเชื่อมต่อใน Hook แต่ให้ทำใน App.jsx เพื่อให้เชื่อมต่อค้างไว้
        };
    }, [isInitialized]); // Dependency Array คือ isInitialized

    // ---------------------------------
    // Emit Functions (R7, R8, R10, R11)
    // ---------------------------------
    
    // R7: ส่งข้อความส่วนตัว (แก้ไขปัญหา ReferenceError)
    const sendPrivateMessage = useCallback((receiverId, message) => {
        // [แก้ไข] ต้องมี currentSocketId ใน dependency array 
        // เพื่อให้แน่ใจว่าฟังก์ชันนี้ใช้ค่าล่าสุดและถูกสร้างใหม่เมื่อ ID เปลี่ยน
        if (!currentSocketId) {
            console.error("Cannot send private message: currentSocketId is null.");
            return;
        }
        
        console.log("ASDHADHI", receiverId)
        // NOTE: เราไม่ต้องสร้าง privateRoomId ที่นี่ เพราะ App.jsx จัดการส่ง receiverId ไปแล้ว
        // Server จะจัดการสร้าง Room ID และเข้าร่วม
        socket.emit('send_private_message', { receiverId, message });
    }, [currentSocketId]); // <--- [สำคัญ] ต้องใส่ currentSocketId

    // R8: สร้างกลุ่ม
    const createGroup = useCallback((groupName) => {
        socket.emit('create_group', groupName);
    }, []);

    // R10: เข้าร่วมกลุ่ม
    const joinGroup = useCallback((groupId) => {
        socket.emit('join_group', groupId);
    }, []);

    // R11: ส่งข้อความกลุ่ม
    const sendGroupMessage = useCallback((groupId, message) => {
        socket.emit('send_group_message', { groupId, message });
    }, []);

    // ---------------------------------
    // Return Values (แก้ไขชื่อตัวแปร)
    // ---------------------------------
    return { 
        isInitialized, 
        currentSocketId, // [แก้ไข] ต้องส่งออกตัวแปรนี้ด้วย
        messages, 
        users, // [แก้ไข] ใช้ users แทน user
        groups, 
        initialize, 
        sendPrivateMessage, 
        createGroup, 
        joinGroup, 
        sendGroupMessage
    };
};

export default useChatSocket;