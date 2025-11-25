export const PATCH_NOTE_DATA = {
  // ID unique pour forcer l'affichage cette fois-ci
  versionId: 'velmu-launch-1.1', 
  
  date: '25 Novembre 2025',
  title: 'Bienvenue sur la version Alpha de Velmu ! 🚀',
  
  // Une belle image
  bannerUrl: 'https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?q=80&w=2071&auto=format&fit=crop',
  
  sections: [
    {
      title: 'Une messagerie ultra-réactive',
      description: "Fini les temps de chargement ! Tes messages partent désormais à la vitesse de la lumière (et de façon beaucoup plus fluide) grâce à notre nouveau système 'Optimistic UI'.",
      type: 'feature' as const
    },
    {
      title: 'Ne rate plus aucun DM',
      description: "On a totalement repensé tes messages privés. Tes amis qui t'écrivent apparaissent maintenant sous forme de bulles de notification directement dans ta barre latérale. Un clic, et tu es dans la conversation. C'est fluide, c'est propre, c'est Velmu.",
      type: 'improvement' as const
    },
    {
      title: 'Maîtrise ton serveur',
      description: "Crée ton espace, organise tes catégories et tes salons par simple glisser-déposer (Drag & Drop). Tu peux aussi générer des liens d'invitation temporaires ou infinis pour faire grandir ta communauté à ton rythme.",
      type: 'feature' as const
    },
    {
      title: 'Confort visuel et Ergonomie',
      description: "On a peaufiné l'expérience avec des menus contextuels (clic-droit) complets, des animations plus douces et une interface sombre soignée, un peu à l'ancienne (car on aime tous se sentir un peu OG dans l'âme). Profite d'une navigation plus intuitive que jamais.",
      type: 'fix' as const
    }
  ],
  
  buttonText: "C'est parti, je découvre !"
};