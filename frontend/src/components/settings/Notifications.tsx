import { useSettingsStore } from '../../store/settingsStore';

export default function Notifications() {
  const { notifications, toggleSoundNotifications } = useSettingsStore();

  return (
    <div className="p-6 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-text-header mb-6">Notifications</h2>
      
      <div className="mb-8">
          <div className="flex items-center justify-between pb-6 border-b border-background-modifier-accent">
            <div>
              <h3 className="text-base font-medium text-text-normal mb-1">Sons de notification</h3>
              <p className="text-sm text-text-muted">
                Jouer un son lors de la réception d'un nouveau message privé.
              </p>
            </div>
            
            <button
              onClick={toggleSoundNotifications}
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background-primary ${
                notifications.enableSounds ? 'bg-status-green' : 'bg-background-tertiary'
              }`}
            >
              <span
                className={`${
                  notifications.enableSounds ? 'translate-x-5' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
              />
            </button>
          </div>

          {/* Placeholder for future settings */}
          <div className="opacity-50 pointer-events-none flex items-center justify-between pb-6 border-b border-background-modifier-accent mt-6">
             <div>
              <h3 className="text-base font-medium text-text-normal mb-1">Notifications de bureau (Bientôt)</h3>
              <p className="text-sm text-text-muted">
                Recevoir des notifications Windows lorsque l'application est réduite.
              </p>
            </div>
             <div className="h-6 w-10 bg-background-tertiary rounded-full relative">
                 <span className="absolute left-1 top-1 h-4 w-4 bg-text-muted/50 rounded-full"></span>
             </div>
          </div>

      </div>
    </div>
  );
}
