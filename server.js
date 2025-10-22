import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import connectDB from './dbConfig/database.js';
import authRoutes from './routes/auth.routes.js';
import { initChatSocket } from './sockets/websocket.js';
import lessonRoutes from './routes/lesson.routes.js'
import chapterRoutes from './routes/chapter.routes.js'
import history from './routes/chat.routes.js'

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use("/api/users", authRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/history",history );
const server = http.createServer(app);

initChatSocket(server);

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
