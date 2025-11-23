import { useState } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [formData, setFormData] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      // 1. On inscrit l'utilisateur
      await api.post('/auth/register', formData);
      
      // 2. On le connecte automatiquement juste après
      const res = await api.post('/auth/login', { 
        email: formData.email, 
        password: formData.password 
      });

      // 3. On stocke le token
      login(res.data.token, res.data.user);
      
      // 4. On redirige vers le chat
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-center text-indigo-500">Créer un compte</h2>
        
        {error && <div className="p-3 text-sm text-red-200 bg-red-900/50 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              className="w-full p-2 rounded bg-slate-950 border border-slate-600 focus:border-indigo-500 outline-none"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pseudo</label>
            <input 
              type="text" 
              className="w-full p-2 rounded bg-slate-950 border border-slate-600 focus:border-indigo-500 outline-none"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input 
              type="password" 
              className="w-full p-2 rounded bg-slate-950 border border-slate-600 focus:border-indigo-500 outline-none"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full py-2 font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition">
            S'inscrire
          </button>
        </form>
        <p className="text-center text-sm text-slate-400">
          Déjà un compte ? <Link to="/login" className="text-indigo-400 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}