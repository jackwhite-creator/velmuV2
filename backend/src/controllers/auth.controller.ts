import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
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
    
    const user = await AuthService.register(email, username, password);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};