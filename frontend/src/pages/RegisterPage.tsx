import { useState, useRef } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { Eye, EyeOff } from 'lucide-react';
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator';

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const captchaRef = useRef<ReCAPTCHA>(null);
  
  const [formData, setFormData] = useState({ 
    email: '', 
    username: '', 
    password: '', 
    passwordConfirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Validation temps réel
  const validateUsername = (username: string) => {
    if (username.length === 0) return '';
    if (username.length < 2) return 'Minimum 2 caractères';
    if (username.length > 15) return 'Maximum 15 caractères';
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(username)) return 'Caractères autorisés : lettres, chiffres, _ - . espace';
    return '';
  };

  const validateEmail = (email: string) => {
    if (email.length === 0) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email invalide';
    return '';
  };

  const validatePassword = (password: string) => {
    if (password.length === 0) return '';
    if (password.length < 8) return 'Minimum 8 caractères';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Doit contenir majuscule, minuscule et chiffre';
    }
    return '';
  };

  const validatePasswordConfirm = (confirm: string, password: string) => {
    if (confirm.length === 0) return '';
    if (confirm !== password) return 'Les mots de passe ne correspondent pas';
    return '';
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    const errors: Record<string, string> = {};
    const usernameError = validateUsername(formData.username);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmError = validatePasswordConfirm(formData.passwordConfirm, formData.password);

    if (usernameError) errors.username = usernameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    if (confirmError) errors.passwordConfirm = confirmError;

    if (!captchaToken) {
      setError('Valide le captcha pour continuer');
      setIsLoading(false);
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Inscription
      await api.post('/auth/register', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        captchaToken
      });
      
      // 2. Connexion automatique
      const res = await api.post('/auth/login', { 
        email: formData.email, 
        password: formData.password 
      });

      // 3. Stockage token
      login(res.data.token, res.data.user);
      
      // 4. Redirection
      navigate('/chat');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Une erreur est survenue';
      setError(errorMessage);
      captchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const usernameError = validateUsername(formData.username);
  const emailError = validateEmail(formData.email);
  const passwordError = validatePassword(formData.password);
  const confirmError = validatePasswordConfirm(formData.passwordConfirm, formData.password);

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-2xl border border-slate-700">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Créer un compte</h2>
          <p className="text-slate-400 text-sm mt-1">Rejoins Velmu dès aujourd'hui !</p>
        </div>

        {/* Error Global */}
        {error && (
          <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-800 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Email
            </label>
            <input 
              type="email" 
              required
              className={`w-full p-2.5 rounded bg-slate-950 border ${
                emailError && formData.email ? 'border-red-500' : 'border-slate-700'
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition`}
              placeholder="toi@exemple.com"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
            />
            {emailError && formData.email && (
              <p className="mt-1 text-xs text-red-400">{emailError}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Pseudo
            </label>
            <input 
              type="text"
              required
              maxLength={15}
              className={`w-full p-2.5 rounded bg-slate-950 border ${
                usernameError && formData.username ? 'border-red-500' : 
                formData.username && !usernameError ? 'border-green-500' : 'border-slate-700'
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition`}
              placeholder="TonPseudo"
              value={formData.username}
              onChange={e => handleChange('username', e.target.value)}
            />
            {usernameError && formData.username ? (
              <p className="mt-1 text-xs text-red-400">{usernameError}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">2-15 caractères : lettres, chiffres, _ - . espace</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                className={`w-full p-2.5 pr-10 rounded bg-slate-950 border ${
                  passwordError && formData.password ? 'border-red-500' : 'border-slate-700'
                } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition`}
                placeholder="••••••••"
                value={formData.password}
                onChange={e => handleChange('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && formData.password && (
              <p className="mt-1 text-xs text-red-400">{passwordError}</p>
            )}
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          {/* Password Confirm */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input 
                type={showPasswordConfirm ? "text" : "password"}
                required
                className={`w-full p-2.5 pr-10 rounded bg-slate-950 border ${
                  confirmError && formData.passwordConfirm ? 'border-red-500' : 
                  formData.passwordConfirm && !confirmError ? 'border-green-500' : 'border-slate-700'
                } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition`}
                placeholder="••••••••"
                value={formData.passwordConfirm}
                onChange={e => handleChange('passwordConfirm', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmError && formData.passwordConfirm && (
              <p className="mt-1 text-xs text-red-400">{confirmError}</p>
            )}
            {formData.passwordConfirm && !confirmError && (
              <p className="mt-1 text-xs text-green-400">✓ Les mots de passe correspondent</p>
            )}
          </div>

          {/* reCAPTCHA */}
          <div className="flex justify-center pt-2">
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              theme="dark"
            />
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>
        </form>

        {/* Link to Login */}
        <div className="text-sm text-slate-400 mt-4">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}