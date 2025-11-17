import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import connectDB from './dbConfig/database.js';
import authRoutes from './routes/auth.routes.js';
import { initChatSocket } from './sockets/websocket.js';
import lessonRoutes from './routes/lesson.routes.js'
import chapterRoutes from './routes/chapter.routes.js'
import history from './routes/chat.routes.js'
import quiz from './routes/quiz.routes.js'
import subscriptions from './routes/subscription.routes.js'
import discounts from './routes/discount.routes.js'
import chatCategory from './routes/chatCategory.routes.js'
import user from './routes/user.routes.js'
import otp from './routes/otp.rotes.js'
import middleware from "i18next-http-middleware"
import i18n from './utils/i18n.js';
import atozRoutes from './routes/subtopicAtoz.routes.js';
import topics from './routes/topic.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import whyLearn from './routes/whyLearn.routes.js'; 
import cors from 'cors';
import onBoardQstns from './routes/onboarding.routes.js';
import grammerSubTopic from './routes/grammarSubTopics.js';
import userPerfomance from './routes/getUserPerfomance.routes.js';  
import languages from './routes/language.routes.js';
import payments from './routes/payments.routes.js';
import nativeLang from './routes/nativeLang.routes.js';
dotenv.config();
connectDB();


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ['http://localhost:5173'], 
  credentials: true,
}));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(middleware.handle(i18n));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/history",history );
app.use("/api/quizzes",quiz );
app.use("/api/subscriptions",subscriptions );
app.use("/api/discounts",discounts );
app.use("/api/chat-categories",chatCategory );
app.use("/api/users",user );
app.use("/api/otp", otp );
app.use("/api/atoz", atozRoutes); 
app.use("/api/topics", topics);
app.use("/api/why-learn", whyLearn);
app.use("/api/onboarding-questions", onBoardQstns);
app.use("/api/grammar-subtopics", grammerSubTopic);
app.use("/api/user-performance", userPerfomance);
app.use("/api/languages", languages);
app.use("/api/payments", payments);
app.use("/api/native-languages", nativeLang);
const server = http.createServer(app);

initChatSocket(server);

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on port 3000');
});
