import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String, // ใช้สำหรับ private message
  room: String,     // ใช้สำหรับ group message
  content: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
});

export default mongoose.model("Message", messageSchema);
