import app from './app';
import http from 'http';
import { initSocket } from './socket'; // Attention à l'import (initSocket, pas initializeSocket)
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

const httpServer = http.createServer(app);

// 👇 CHANGEMENT : On passe le httpServer à notre nouvelle fonction
const io = initSocket(httpServer);

// On rend 'io' accessible partout dans l'app (pour tes controlleurs)
app.set('io', io);

httpServer.listen(PORT, () => {
  console.log(`✅ Serveur Velmu lancé sur le port ${PORT}`);
});