import { useState } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      login(res.data.token, res.data.user);
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-2xl border border-slate-700">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Bon retour !</h2>
          <p className="text-slate-400 text-sm mt-1">On est ravis de te revoir !</p>
        </div>
        
        {/* Error */}
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
              className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              placeholder="toi@exemple.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
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
                className="w-full p-2.5 pr-10 rounded bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="text-right mt-1">
              <a href="#" className="text-xs text-slate-400 hover:text-slate-300">Mot de passe oublié ?</a>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Link to Register */}
        <div className="text-sm text-slate-400 mt-4">
          Besoin d'un compte ? <Link to="/register" className="text-indigo-400 hover:underline">S'inscrire</Link>
        </div>
      </div>
    </div>
  );
}