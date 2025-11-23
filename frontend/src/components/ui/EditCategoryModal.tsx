import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Category } from '../../store/serverStore';
import ConfirmModal from './ConfirmModal';

interface Props {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
}

export default function EditCategoryModal({ isOpen, category, onClose }: Props) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (category) setName(category.name);
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await api.put(`/categories/${category.id}`, { name: name.toUpperCase() });
      onClose();
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await api.delete(`/categories/${category.id}`);
      onClose();
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); setShowDeleteConfirm(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden border border-slate-700 flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white uppercase tracking-wide">Modifier la catégorie</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-6">
            <form id="edit-cat-form" onSubmit={handleSave}>
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Nom de la catégorie</label>
                    <input 
                        value={name}
                        onChange={(e) => setName(e.target.value.toUpperCase())}
                        className="w-full bg-slate-900 text-white p-2.5 rounded border border-slate-700 focus:border-indigo-500 outline-none font-medium"
                    />
                </div>
            </form>
            <div className="h-px bg-slate-700 my-4"></div>
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Zone Danger</h3>
                <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-1.5 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded text-sm font-medium transition">Supprimer la catégorie</button>
            </div>
        </div>

        <div className="px-6 py-4 bg-slate-900/80 flex justify-end gap-3 border-t border-slate-700">
            <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:underline text-sm">Annuler</button>
            <button type="submit" form="edit-cat-form" disabled={isLoading} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium">Enregistrer</button>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`Supprimer ${category.name}`}
        message="Cela supprimera également tous les salons contenus dans cette catégorie. Continuer ?"
        isDestructive={true}
        confirmText="Supprimer"
      />
    </div>
  );
}