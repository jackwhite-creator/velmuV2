import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Category } from '../../../store/serverStore';
import ConfirmModal from '../../ui/ConfirmModal';
import Modal from '../../ui/Modal';

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
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) { console.error(error); } 
    finally { 
      setIsLoading(false); 
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <div 
            className="flex flex-col h-full bg-background-floating rounded-md overflow-hidden font-sans"
            onContextMenu={(e) => e.stopPropagation()}
        >
            <div className="px-6 pt-6 pb-2 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-text-header mb-1">
                        Modifier la catégorie
                    </h2>
                    <p className="text-text-muted text-xs">
                        Change le nom de la catégorie ou supprime-la.
                    </p>
                </div>
                <button 
                    onClick={onClose} 
                    className="text-text-muted hover:text-text-header transition p-1 rounded-sm hover:bg-background-modifier-hover"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            <div className="p-6">
                <form id="edit-cat-form" onSubmit={handleSave}>
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wide ml-1">
                            Nom de la catégorie
                        </label>
                        
                        <div className="relative group">
                            <input 
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value.toUpperCase())}
                                className="w-full bg-background-tertiary border border-background-secondary text-text-normal text-sm p-3 rounded-sm focus:border-brand outline-none font-medium transition-all placeholder-text-muted shadow-inner"
                                maxLength={32}
                            />
                        </div>
                    </div>
                </form>
            </div>

            <div className="px-6 py-4 bg-background-secondary flex justify-between items-center mt-auto border-t border-background-tertiary">
                <div className="flex-1">
                    <button 
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-status-danger hover:underline text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        Supprimer
                    </button>
                </div>

                <div className="flex gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-text-normal hover:underline text-sm font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit" 
                        form="edit-cat-form"
                        disabled={isLoading || !name.trim()}
                        className="px-6 py-2 bg-brand hover:bg-brand-hover text-white rounded-sm text-sm font-bold transition-all shadow-md active:translate-y-[1px] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {isLoading ? '...' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`Supprimer ${category.name}`}
        message={
            <div className="space-y-2">
                <p>Êtes-vous sûr de vouloir supprimer la catégorie <strong className="text-text-header">{category.name}</strong> ?</p>
                <p className="text-xs text-status-danger bg-status-danger/10 p-2 rounded border border-status-danger/20 font-medium">
                    ⚠️ Cela supprimera également tous les salons qu'elle contient. Cette action est irréversible.
                </p>
            </div>
        }
        isDestructive={true}
        confirmText="Oui, supprimer la catégorie"
      />
    </>
  );
}