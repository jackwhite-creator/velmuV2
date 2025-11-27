import app from './app';
import http from 'http';
import { initSocket } from './socket';
import { config } from './config/env';
import logger from './lib/logger';

const PORT = config.port;

const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(httpServer);

// Make IO accessible in controllers
app.set('io', io);

httpServer.listen(PORT, () => {
  logger.info(`✅ Velmu server started on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});