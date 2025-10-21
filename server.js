import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import connectDB from './dbConfig/database.js';
import authRoutes from './routes/auth.routes.js';
import { initChatSocket } from './sockets/websocket.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use("/api/users", authRoutes);

const server = http.createServer(app);

// Initialize Socket.IO chat
initChatSocket(server);

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
