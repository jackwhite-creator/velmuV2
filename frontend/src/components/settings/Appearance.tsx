import { useThemeStore, Theme } from '../../store/themeStore';

export default function Appearance() {
  const { theme, setTheme } = useThemeStore();

  const themes: { id: Theme; label: string; color: string }[] = [
    { id: 'light', label: 'Clair', color: '#ffffff' },
    { id: 'dark', label: 'Sombre', color: '#313338' },
    { id: 'amoled', label: 'AMOLED', color: '#000000' },
    { id: 'christmas', label: 'Noël 🎄', color: '#1a2f23' },
  ];

  return (
    <div className="p-6 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-text-header mb-6">Apparence</h2>
      
      <div className="mb-8">
        <h3 className="text-xs font-bold text-text-muted uppercase mb-4 tracking-wider">Thème</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((t) => (
            <div 
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`
                relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                ${theme === t.id ? 'border-brand ring-2 ring-brand/20' : 'border-transparent hover:border-background-tertiary'}
              `}
            >
              <div className="h-24 w-full flex items-center justify-center" style={{ backgroundColor: t.color }}>
                 {/* Preview circles */}
                 <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-500/20"></div>
                    <div className="w-16 h-6 rounded-md bg-zinc-500/20"></div>
                 </div>
              </div>
              <div className="p-3 bg-background-secondary flex items-center justify-between">
                <span className="font-medium text-text-header">{t.label}</span>
                {theme === t.id && (
                  <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
