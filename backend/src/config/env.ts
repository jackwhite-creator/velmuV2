import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Security
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Database
  databaseUrl: requireEnv('DATABASE_URL'),
  
  // CORS
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedOrigins: [
    'http://localhost:5173',
    'https://velmu.vercel.app',
    process.env.CLIENT_URL
  ].filter(Boolean) as string[],
  
  // Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB par défaut
  
  // Rate Limiting
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100,
  authRateLimitMax: 5,
  
  // reCAPTCHA
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || '', // Optionnel en dev
  recaptchaEnabled: process.env.RECAPTCHA_ENABLED !== 'false', // true par défaut
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
