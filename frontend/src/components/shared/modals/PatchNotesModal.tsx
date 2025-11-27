import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import Modal from '../../ui/Modal';
import { PATCH_NOTE_DATA } from '../../../config/patchNotes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PatchNotesModal({ isOpen, onClose }: Props) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
        requestAnimationFrame(() => {
            setShowContent(true);
        });
    } else {
        setShowContent(false);
    }
  }, [isOpen]);

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-brand text-white';
      case 'improvement': return 'bg-indigo-500 text-white';
      case 'fix': return 'bg-emerald-600 text-white';
      default: return 'bg-zinc-500 text-white';
    }
  };

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case 'feature': return 'NOUVEAU';
      case 'improvement': return 'ASTUCE';
      case 'fix': return 'INFO';
      default: return 'INFO';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div 
        className={`
            flex flex-col max-h-[85vh] bg-background-floating text-text-normal font-sans overflow-hidden cursor-default transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
      >
        
        {/* HEADER IMAGE */}
        <div className="relative h-48 flex-shrink-0 overflow-hidden bg-background-tertiary">
            {PATCH_NOTE_DATA.bannerUrl ? (
                <>
                    <div className="absolute inset-0 bg-gradient-to-t from-background-floating via-transparent to-transparent z-10" />
                    <img 
                        src={PATCH_NOTE_DATA.bannerUrl} 
                        className="w-full h-full object-cover opacity-90" 
                        alt="Update" 
                    />
                </>
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand to-indigo-900 flex items-center justify-center">
                    <span className="text-5xl drop-shadow-lg">✨</span>
                </div>
            )}
            
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-20 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white p-2 rounded-full transition-colors backdrop-blur-sm"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-4">
            <div className="mb-6">
                <span className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block">
                    {PATCH_NOTE_DATA.date}
                </span>
                <h1 className="text-2xl font-bold text-text-header leading-tight">
                    {PATCH_NOTE_DATA.title}
                </h1>
            </div>

            <div className="space-y-8 pb-6">
                {PATCH_NOTE_DATA.sections.map((section, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] shadow-sm tracking-wide ${getBadgeColor(section.type)}`}>
                                {getBadgeLabel(section.type)}
                            </span>
                            <h3 className="text-base font-semibold text-text-header">
                                {section.title}
                            </h3>
                        </div>
                        <p className="text-text-normal leading-relaxed text-[14px] border-l-2 border-background-modifier-accent pl-3 ml-1 text-zinc-300">
                            {section.description}
                        </p>
                    </div>
                ))}

                {/* Invitation Card - Subtle with left border */}
                {PATCH_NOTE_DATA.inviteUrl && (
                  <div className="mt-8 p-6 bg-background-secondary/50 border-l-4 border-brand rounded-r-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-brand/20 rounded-full flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-brand" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-text-header mb-2">
                          Rejoins le serveur officiel Velmu
                        </h4>
                        <p className="text-sm text-text-muted mb-4">
                          Rencontre la communauté, pose tes questions et découvre toutes les fonctionnalités !
                        </p>
                        <a
                          href={PATCH_NOTE_DATA.inviteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded text-sm font-semibold transition-colors shadow-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Rejoindre maintenant
                        </a>
                      </div>
                    </div>
                  </div>
                )}
            </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-background-secondary flex justify-center flex-shrink-0 border-t border-background-tertiary z-20">
            <button 
                onClick={onClose}
                className="bg-brand hover:bg-brand-hover text-white px-10 py-2.5 rounded-[3px] text-sm font-medium transition-colors shadow-sm"
            >
                {PATCH_NOTE_DATA.buttonText}
            </button>
        </div>

      </div>
    </Modal>
  );
}