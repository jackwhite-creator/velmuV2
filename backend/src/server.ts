import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import dotenv from 'dotenv';
import { initializeSocket } from './socket';

dotenv.config();

const PORT = process.env.PORT || 4000;

// 1. Création du serveur HTTP
const httpServer = createServer(app);

// 2. Configuration de Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// 3. IMPORTANT : On partage l'instance IO avec toute l'application Express
// Cela permet d'utiliser req.app.get('io') dans les contrôleurs
app.set('io', io);

// 4. Initialisation des événements Socket
initializeSocket(io);

// 5. Lancement
httpServer.listen(PORT, () => {
  console.log(`✅ Serveur Velmu lancé sur http://localhost:${PORT}`);
});