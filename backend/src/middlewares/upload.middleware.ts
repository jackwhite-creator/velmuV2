import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';

dotenv.config();

// Vérification des clés Cloudinary
const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET;

let storage;

if (hasCloudinary) {
  // Configuration de Cloudinary avec tes clés (qui seront dans le .env)
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Définition du stockage : On envoie directement chez Cloudinary
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'velmu-uploads', // Le nom du dossier qui sera créé dans ton Cloudinary
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'pdf'], // Formats acceptés
      public_id: (req: any, file: any) => {
        // On génère un nom unique pour éviter les doublons
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        // On nettoie le nom d'origine pour éviter les caractères bizarres
        const cleanName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, "");
        return `${cleanName}-${uniqueSuffix}`;
      },
    } as any, // "as any" nécessaire pour contourner une petite erreur de typage de la librairie
  });
} else {
  // Fallback: Stockage local
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const cleanName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, "");
      cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
    }
  });
}

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: config.maxFileSize // 10MB par défaut
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error('Seules les images sont autorisées (jpg, jpeg, png, gif, webp)!'));
    }
    cb(null, true);
  }
});