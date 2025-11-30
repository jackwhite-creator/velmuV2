import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PatchNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Category = 'global' | 'social' | 'servers' | 'chat' | 'settings';

interface UpdateItem {
  title: string;
  description: string;
  new?: boolean;
}

const UPDATES: Record<Category, UpdateItem[]> = {
  global: [
    { title: "Harmonisation du Design", description: "Une interface plus cohérente et harmonieuse pour une meilleure expérience.", new: true },
    { title: "Thèmes Personnalisés", description: "Choisis ton ambiance : Clair, Sombre, AMOLED ou le thème exclusif Noël !", new: true },
    { title: "Sécurité Renforcée", description: "Tes données et tes serveurs sont mieux protégés.", new: true },
    { title: "Et la suite ?", description: "De nombreuses fonctionnalités sont en cours de développement. Reste à l'affût !" }
  ],
  social: [
    { title: "Statut en Temps Réel", description: "Vois instantanément quand tes amis sont en ligne ou hors ligne.", new: true },
    { title: "Profils Riches", description: "Personnalise ta carte de visite : Bannière, Biographie et Avatar.", new: true },
    { title: "L'arrivée des Badges", description: "Découvre les nouveaux badges exclusifs sur les profils.", new: true },
    { title: "Nouveau Panel d'Invitation", description: "Invite tes amis sur tes serveurs avec une interface simplifiée." }
  ],
  servers: [
    { title: "Gestion Complète", description: "Crée, supprime ou quitte des serveurs en toute simplicité.", new: true },
    { title: "Embeds d'Invitation", description: "Des liens d'invitation visuels et attractifs pour rejoindre les communautés.", new: true },
    { title: "Système de Rôles", description: "Hiérarchise tes membres avec des rôles colorés et des permissions.", new: true },
    { title: "Modération", description: "Outils de kick et de ban pour garder tes serveurs sains." }
  ],
  chat: [
    { title: "Support Markdown", description: "Mets en forme tes messages : gras, italique, code, et plus encore.", new: true },
    { title: "Mentions", description: "Notifie des utilisateurs spécifiques (@user) ou tout le monde (@everyone).", new: true },
    { title: "Emojis", description: "Exprime-toi avec une large sélection d'emojis intégrés.", new: true },
    { title: "Sons Intelligents", description: "Des notifications sonores agréables qui ne te dérangent pas quand tu es actif.", new: true }
  ],
  settings: [
    { title: "Mon Compte", description: "Gère tes informations personnelles, change ton avatar et ta bannière.", new: true },
    { title: "Apparence", description: "Change de thème et personnalise l'affichage de l'application.", new: true },
    { title: "Notifications", description: "Contrôle quels sons et alertes tu souhaites recevoir.", new: true }
  ]
};

const TABS: { id: Category; label: string; icon: JSX.Element }[] = [
  { id: 'global', label: 'Global', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  { id: 'social', label: 'Social', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'servers', label: 'Serveurs', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg> },
  { id: 'chat', label: 'Chat', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { id: 'settings', label: 'Paramètres', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
];

export default function PatchNotesModal({ isOpen, onClose }: PatchNotesModalProps) {
  const [activeTab, setActiveTab] = useState<Category>('global');

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-background-primary rounded-md shadow-2xl border border-background-tertiary overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="relative h-40 bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-background-primary to-transparent"></div>
            
            <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-3 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-white tracking-wider">BÊTA PUBLIQUE</span>
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-sm mb-1">
                    Mise à jour Velmu
                </h1>
                <p className="text-white/80 font-medium text-sm">Découvre toutes les nouveautés de ton application préférée</p>
            </div>

            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors backdrop-blur-sm"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>

        {/* Beta Warning */}
        <div className="bg-brand/10 border-b border-brand/20 px-6 py-3 flex items-center gap-3 shrink-0">
            <svg className="w-5 h-5 text-brand shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p className="text-sm text-text-normal font-medium">
                <span className="font-bold text-brand">Note importante :</span> Velmu est encore en phase de développement (Bêta). Des bugs peuvent être présents, merci de ta compréhension et de tes retours !
            </p>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0">
            {/* Sidebar Navigation */}
            <div className="w-64 bg-background-secondary border-r border-background-tertiary p-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar shrink-0">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-bold transition-all duration-200 ${
                            activeTab === tab.id 
                                ? 'bg-brand text-white shadow-sm' 
                                : 'text-text-muted hover:bg-background-modifier-hover hover:text-text-normal'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-background-primary">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-2xl font-bold text-text-header capitalize">{TABS.find(t => t.id === activeTab)?.label}</h2>
                            <div className="h-px flex-1 bg-background-modifier-accent"></div>
                        </div>

                        <div className="grid gap-4">
                            {UPDATES[activeTab].map((item, index) => (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group bg-background-secondary p-5 rounded-md border border-background-tertiary hover:border-brand/30 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h3 className="text-lg font-bold text-text-header group-hover:text-brand transition-colors">
                                            {item.title}
                                        </h3>
                                        {item.new && (
                                            <span className="px-2 py-0.5 bg-brand text-white text-[10px] font-bold uppercase rounded-sm tracking-wider shadow-sm">
                                                Nouveau
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-text-normal text-sm leading-relaxed">
                                        {item.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-background-secondary border-t border-background-tertiary flex justify-end shrink-0">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-brand hover:bg-brand-hover text-white font-bold rounded-sm transition-colors shadow-sm"
            >
                C'est parti !
            </button>
        </div>

      </motion.div>
    </div>,
    document.body
  );
}