import { useState, useEffect } from 'react';

interface Props {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageViewerModal({ imageUrl, onClose }: Props) {
  const [scale, setScale] = useState(1);

  // Reset du zoom quand on change d'image
  useEffect(() => {
    setScale(1);
  }, [imageUrl]);

  // Gestion de la touche Echap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = imageUrl.split('/').pop() || 'image-velmu.png';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur téléchargement", error);
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose} // Le clic sur le fond ferme la modale
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <div 
        className="relative flex flex-col items-center justify-center w-full h-full p-4"
        // J'ai retiré le stopPropagation ici pour laisser passer le clic vers le fond
      >
        <img 
          src={imageUrl} 
          alt="Full size" 
          className="object-contain transition-transform duration-200 ease-out rounded-md shadow-2xl"
          style={{ 
            transform: `scale(${scale})`, 
            maxHeight: '85vh', 
            maxWidth: '90vw',
            cursor: scale > 1 ? 'zoom-out' : 'zoom-in'
          }}
          onClick={(e) => {
            e.stopPropagation(); // On empêche la fermeture quand on clique sur l'image
            setScale(s => s === 1 ? 2 : 1);
          }}
        />

        {/* Barre d'outils */}
        <div 
            className="absolute bottom-8 flex items-center gap-4 bg-slate-900/80 p-2 px-6 rounded-full border border-white/10 backdrop-blur-md text-white shadow-xl"
            onClick={(e) => e.stopPropagation()} // On empêche la fermeture quand on clique sur la barre
        >
          <button onClick={() => window.open(imageUrl, '_blank')} className="p-2 hover:text-indigo-400 transition" title="Ouvrir dans le navigateur">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
          <div className="w-px h-5 bg-white/20"></div>
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.5))} className="p-2 hover:text-indigo-400 transition" title="Dézoomer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <span className="text-xs font-mono w-12 text-center select-none">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, s + 0.5))} className="p-2 hover:text-indigo-400 transition" title="Zoomer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <div className="w-px h-5 bg-white/20"></div>
          <button onClick={handleDownload} className="p-2 hover:text-green-400 transition" title="Télécharger">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}