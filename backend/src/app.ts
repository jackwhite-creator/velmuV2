import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import logger from './lib/logger';

// Routes
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
import roleRoutes from './routes/role.routes';

const app = express();

// Trust proxy for rate limiting behind Render/Vercel
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(cors({ 
  origin: config.allowedOrigins, 
  credentials: true 
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Smart rate limiter - only for write operations (POST, PUT, DELETE, PATCH)
// GET requests (read operations) are NOT rate limited
const writeLimiter = rateLimit({
  windowMs: config.rateLimitWindow, // 15 minutes
  max: 200, // 200 write operations per 15 min
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for GET requests (read operations)
    return req.method === 'GET';
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({ error: 'Trop d\'actions, veuillez réessayer plus tard' });
  }
});

app.use('/api/', writeLimiter);

// Strict rate limiter for auth routes (both GET and POST)
const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: config.authRateLimitMax, // 5 attempts
  message: { error: 'Trop de tentatives de connexion, veuillez réessayer dans 2 minutes' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', roleRoutes); // roleRoutes are prefixed inside the router with /:serverId/roles or similar, or we can mount it at /api/roles if we change structure. But looking at route file, it expects /:serverId/roles.
// Let's check role.routes.ts export. It has router.get('/:serverId/roles'). So mounting at /api works.

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'API Velmu v2.0 🚀',
    status: 'running', 
    docs: '/api/health'
  });
});

// Error handling (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

export default app;