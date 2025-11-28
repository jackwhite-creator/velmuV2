import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { verifyCaptcha } from '../lib/captcha';
import { config } from '../config/env';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, captchaToken } = req.body;
    
    // Vérification captcha (si activé)
    if (config.recaptchaEnabled) {
      if (!captchaToken) {
        return res.status(400).json({ error: 'Captcha manquant' });
      }
      
      const isValidCaptcha = await verifyCaptcha(captchaToken);
      if (!isValidCaptcha) {
        return res.status(400).json({ error: 'Captcha invalide' });
      }
    }
    
    const result = await authService.register(email, username, password);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};