const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ใช้ middleware สำหรับรับ JSON
app.use(express.json());

// route ตัวอย่าง
app.get('/api/', (req, res) => {
  res.send('Hello from Node.js backend!');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
