import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories';
import { AuthResponse } from '../shared/api-types';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    // Validation
    if (!email || !username || !password) {
      throw new Error('Tous les champs sont obligatoires');
    }
    if (password.length < 6) {
      throw new Error('Le mot de passe doit faire au moins 6 caractères');
    }

    // Vérifier si l'email existe déjà
    const emailExists = await userRepository.emailExists(email);
    if (emailExists) {
      throw new Error('Cet email est déjà utilisé');
    }

    // Générer un discriminateur unique
    const discriminator = await userRepository.generateDiscriminator(username);
    
    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Créer l'utilisateur
    const user = await userRepository.createUser({
      email,
      username,
      discriminator,
      passwordHash
    });

    // Générer le token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return { 
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username, 
        discriminator: user.discriminator,
        avatarUrl: user.avatarUrl
      }
    };
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Trouver l'utilisateur
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Identifiants invalides');
    }

    // Vérifier le mot de passe
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new Error('Identifiants invalides');
    }

    // Générer le token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    return { 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        discriminator: user.discriminator,
        avatarUrl: user.avatarUrl
      } 
    };
  }
}

export const authService = new AuthService();