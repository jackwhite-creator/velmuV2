import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import serverRoutes from './routes/server.routes';
import categoryRoutes from './routes/category.routes';
import channelRoutes from './routes/channel.routes';
import inviteRoutes from './routes/invite.routes';
import memberRoutes from './routes/member.routes';
import conversationRoutes from './routes/conversation.routes';
import friendRoutes from './routes/friend.routes';
import messageRoutes from './routes/message.routes';

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://velmu.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean) as string[];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => { res.send('API Velmu is running 🚀'); });

// Middleware Gestion Erreur Global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Global Error:", err.stack);
  res.status(500).json({ error: "Une erreur interne est survenue" });
});

export default app;