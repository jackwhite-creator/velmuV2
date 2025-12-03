import { ExternalLink, Code } from 'lucide-react';

export default function DeveloperSettings() {
  const openPortal = () => {
    window.open('/developers/applications', '_blank');
  };

  return (
    <div className="flex-1 bg-background-primary p-10 flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="w-24 h-24 rounded-full bg-background-secondary flex items-center justify-center mb-6">
        <Code size={48} className="text-brand-primary" />
      </div>
      
      <h2 className="text-2xl font-bold text-text-header mb-2 flex items-center justify-center gap-2">
        Portail Développeur
        <span className="bg-brand-primary/20 text-brand-primary text-xs px-2 py-0.5 rounded uppercase tracking-wider font-bold">Bêta</span>
      </h2>
      <p className="text-text-muted mb-8 max-w-md">
        Gère tes applications, crée des bots et configure tes intégrations via notre portail dédié.
      </p>

      <button
        onClick={openPortal}
        className="bg-brand-primary hover:bg-brand-hover text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2 group"
      >
        Ouvrir le Portail Développeur
        <ExternalLink size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
