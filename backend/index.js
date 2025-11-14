import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Message from "./models/Message.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // ภายหลังแก้เป็น localhost:5173 (React)
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Simple Route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

let users = {}; // username -> socketId
let rooms = {}; // groupName -> [members]

// Socket.IO logic
io.on("connection", (socket) => {
  console.log(`🟢 ${socket.id} connected`);

  // Client joins with a username
  socket.on("join", (username) => {
    // 🔽 เพิ่มส่วนนี้
    if (Object.values(users).includes(username)) {
      socket.emit("join_error", "Username is already taken.");
      return;
    }
    // 🔼 สิ้นสุดส่วนที่เพิ่ม

    users[socket.id] = username;

    // ส่ง greeting จาก server
    socket.emit("server_message", `👋 Welcome ${username}!`);

    // ส่งรายชื่อ user ทั้งหมดกลับไปให้ทุกคน
    io.emit("user_list", Object.values(users));
  });

  // 🔽 เพิ่ม Event Listener นี้เข้าไป 🔽
  // เมื่อ client ร้องขอ list ตอนโหลดหน้า
  socket.on("get_initial_lists", () => {
    console.log(`✨ ${users[socket.id]} requested initial lists`);
    // ส่ง list ทั้งสองกลับไปหา "แค่คนนั้น"
    socket.emit("user_list", Object.values(users));
    socket.emit("group_list", rooms);
  });
  // 🔼 สิ้นสุดส่วนที่เพิ่ม 🔼

  // รับข้อความ private
  socket.on("private_message", async ({ to, message }) => {
    const targetSocketId = Object.keys(users).find(
      key => users[key] === to
    );
    if (targetSocketId) {
      io.to(targetSocketId).emit("private_message", {
        from: users[socket.id],
        message
      });

      // 🔽🔽🔽 2. ส่งกลับมาหาตัวเอง (บรรทัดที่เพิ่ม) 🔽🔽🔽
      socket.emit("private_message", {
        from: users[socket.id],
        message
      });
      // ✅ บันทึกข้อความลง MongoDB
      try {
        await Message.create({
          sender: users[socket.id],
          receiver: to,
          content: message
        });
        console.log(`💾 Saved private message from ${users[socket.id]} to ${to}`);
      } catch (err) {
        console.error("❌ Error saving private message:", err);
      }
    }
  });

  // รับข้อความในกลุ่ม
  socket.on("group_message", async ({ room, message }) => {
    io.to(room).emit("group_message", {
      from: users[socket.id],
      message,
      room: room // 👈 🔽 เพิ่มบรรทัดนี้ 🔽
    });

    // ✅ บันทึกข้อความลง MongoDB
    try {
      await Message.create({
        sender: users[socket.id],
        room,
        content: message
      });
      console.log(`💾 Saved group message in ${room} from ${users[socket.id]}`);
    } catch (err) {
      console.error("❌ Error saving group message:", err);
    }
  });

  // สร้าง group
  socket.on("create_group", (groupName) => {
    rooms[groupName] = [users[socket.id]];
    socket.join(groupName);
    // ส่ง group_list ให้ทุกคน
    io.emit("group_list", rooms);
    // ส่ง members ของกลุ่มนี้ไปยังผู้สร้าง
    socket.emit("group_members_updated", { groupName, members: rooms[groupName] });
  });

  // เข้าร่วม group
  socket.on("join_group", (groupName) => {
    const username = users[socket.id];

    for (const room of socket.rooms) {
    if (room !== socket.id) {
      socket.leave(room);
      console.log(`🚪 ${username} left room ${room}`);
    }
  }
    socket.join(groupName);
    if (!rooms[groupName]) rooms[groupName] = [];
    
    if (username && !rooms[groupName].includes(username)) {
      rooms[groupName].push(username);
      // ส่ง group_list ให้ทุกคน
      io.emit("group_list", rooms);
      // ส่ง members ไปยังทุกคนในกลุ่มนี้
      io.to(groupName).emit("group_members_updated", { groupName, members: rooms[groupName] });
    }
    // ส่ง members ของกลุ่มนี้ไปยังผู้เข้าร่วม (แม้ว่าเป็นสมาชิกเดิมแล้ว)
    socket.emit("group_members_updated", { groupName, members: rooms[groupName] });
  });

  // disconnect
  socket.on("disconnect", () => {
    console.log(`🔴 ${socket.id} disconnected`);

    const username = users[socket.id]; // 🔽 เพิ่มส่วนนี้
    delete users[socket.id];

    // ลบ user ออกจากทุก group ที่เขาอยู่
    if (username) {
      Object.keys(rooms).forEach(groupName => {
        rooms[groupName] = rooms[groupName].filter(member => member !== username);
        // ถ้ากลุ่มไม่เหลือใคร อาจจะลบกลุ่มทิ้งไปเลยก็ได้
        if (rooms[groupName].length === 0) {
          delete rooms[groupName];
        }
      });
      io.emit("group_list", rooms); // (R9) อัปเดต list 
    }
    // 🔼 สิ้นสุดส่วนที่เพิ่ม

    io.emit("user_list", Object.values(users));
  });
});

// 🔹 ดึงข้อความ private (ระหว่างผู้ใช้สองคน)
app.get("/api/messages/private/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ timestamp: 1 }); // เรียงตามเวลาเก่าก่อนไปใหม่
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch private messages" });
  }
});

// 🔹 ดึงข้อความ group
app.get("/api/messages/group/:room", async (req, res) => {
  const { room } = req.params;
  try {
    const messages = await Message.find({ room }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group messages" });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));