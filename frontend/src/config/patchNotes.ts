export const PATCH_NOTE_DATA = {
  // ID unique pour forcer l'affichage
  versionId: 'velmu-welcome-invite', 
  
  date: '27 Novembre 2025',
  title: 'Bienvenue sur Velmu ! 👋',
  
  // Bannière élégante
  bannerUrl: 'https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?q=80&w=2071&auto=format&fit=crop',
  
  // URL d'invitation au serveur Velmu
  inviteUrl: 'https://velmu.app/invite/velmu',
  
  sections: [
    {
      title: 'Serveur officiel Velmu',
      description: "Rejoins le serveur officiel pour découvrir la communauté, poser tes questions et rester informé des dernières nouveautés !",
      type: 'feature' as const
    }
  ],
  
  buttonText: "C'est parti, je découvre !"
};