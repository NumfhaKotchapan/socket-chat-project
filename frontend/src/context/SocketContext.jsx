// frontend/src/context/SocketContext.jsx
import React, { createContext, useContext } from 'react';
import { io } from 'socket.io-client';

// ----------------------------------------------------------------------

// 1. เชื่อมต่อกับ Backend (อย่าลืมแก้ URL ถ้าจำเป็น)
const socket = io("http://localhost:3001"); 

// 2. สร้าง Context
const SocketContext = createContext(socket);

// 3. สร้าง Hook สำหรับเรียกใช้ง่ายๆ
export const useSocket = () => {
  return useContext(SocketContext);
};

// 4. สร้าง Provider เพื่อ "หุ้ม" App ของเรา
export const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};