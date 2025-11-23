import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de Cloudinary avec tes clés (qui seront dans le .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Définition du stockage : On envoie directement chez Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'velmu-uploads', // Le nom du dossier qui sera créé dans ton Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'pdf'], // Formats acceptés
    public_id: (req, file) => {
      // On génère un nom unique pour éviter les doublons
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      // On nettoie le nom d'origine pour éviter les caractères bizarres
      const cleanName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, "");
      return `${cleanName}-${uniqueSuffix}`;
    },
  } as any, // "as any" nécessaire pour contourner une petite erreur de typage de la librairie
});

export const upload = multer({ storage: storage });