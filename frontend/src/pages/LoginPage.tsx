import { useState } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', formData);
      login(res.data.token, res.data.user);
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100 font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-2xl border border-slate-700">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Bon retour !</h2>
          <p className="text-slate-400 text-sm mt-1">Nous sommes ravis de vous revoir.</p>
        </div>
        
        {error && <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-800 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mot de passe</label>
            <input 
              type="password"
              required
              className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition duration-200">
            Se connecter
          </button>
        </form>
        <div className="text-sm text-slate-400 mt-4">
          Besoin d'un compte ? <Link to="/register" className="text-indigo-400 hover:underline">S'inscrire</Link>
        </div>
      </div>
    </div>
  );
}