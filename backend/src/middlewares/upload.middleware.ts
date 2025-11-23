import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configuration Cloudinary (les variables seront dans ton .env sur Render)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'velmu-uploads', // Le nom du dossier dans ton Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf'],
    public_id: (req, file) => {
        // Générer un nom unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        return uniqueSuffix;
    }
  } as any, // "as any" est parfois nécessaire pour éviter des erreurs de typage TS strictes
});

export const upload = multer({ storage: storage });