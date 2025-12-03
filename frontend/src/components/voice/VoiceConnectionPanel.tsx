import React, { useRef, useState } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { useVoiceStore } from '../../store/voiceStore';
import { useServerStore } from '../../store/serverStore';
import { PhoneOff, Mic, MicOff, Headphones, HeadphoneOff } from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { VoiceConnectionDetailsModal } from './VoiceConnectionDetailsModal';

export const VoiceConnectionPanel: React.FC = () => {
  const { 
    token, 
    isConnected, 
    leaveChannel, 
    isMuted, 
    toggleMute,
    isDeafened,
    toggleDeafen
  } = useVoiceStore();

  const { localParticipant } = useLocalParticipant();
  
  // Modal State
  const [showDetails, setShowDetails] = useState(false);
  
  // Ref to track if user was muted BEFORE deafening
  const wasMutedBeforeDeafen = useRef<boolean>(false);

  if (!token || !isConnected) return null;

  const handleToggleMute = async () => {
      if (!localParticipant) return;
      if (isDeafened) return;

      const newMutedState = !isMuted;
      toggleMute(); 

      try {
          await localParticipant.setMicrophoneEnabled(!newMutedState);
      } catch (e) {
          console.error('Failed to toggle microphone:', e);
          toggleMute(); 
      }
  };

  const handleToggleDeafen = async () => {
      if (!localParticipant) return;
      
      const newDeafenedState = !isDeafened;
      toggleDeafen();

      try {
          if (newDeafenedState) {
              wasMutedBeforeDeafen.current = isMuted;
              if (!isMuted) {
                  toggleMute();
                  await localParticipant.setMicrophoneEnabled(false);
              }
              await localParticipant.setMetadata(JSON.stringify({ isDeafened: true }));
          } else {
              await localParticipant.setMetadata(JSON.stringify({ isDeafened: false }));
              if (!wasMutedBeforeDeafen.current) {
                  toggleMute();
                  await localParticipant.setMicrophoneEnabled(true);
              }
          }
      } catch (e) {
          console.error('Failed to toggle deafen:', e);
          toggleDeafen();
      }
  };

  return (
    <>
        <div className="bg-background-secondary-alt/50 backdrop-blur-sm border-t border-background-tertiary p-2">
            <div className="flex flex-col gap-2 justify-center">
                {/* Connection Info - Clickable for Modal */}
                <button 
                    onClick={() => setShowDetails(true)}
                    className="w-full hover:bg-background-modifier-hover rounded-md p-1.5 transition-colors group"
                >
                    <div className="grid grid-cols-3 gap-1.5 items-center">
                        {/* Icon aligned with Mic button */}
                        <div className="flex justify-center">
                            <ConnectionQualityIndicator participant={localParticipant} />
                        </div>
                        
                        {/* Text spanning the rest */}
                        <div className="col-span-2 flex items-center">
                            <span className="text-xs font-black text-status-green uppercase tracking-widest group-hover:text-status-green/90 transition-colors">
                                Connecté
                            </span>
                        </div>
                    </div>
                </button>

                {/* Separator */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />

                {/* Controls - Uniform Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                    <Tooltip text={isMuted ? "Activer micro" : "Couper micro"} side="top">
                        <button 
                            onClick={handleToggleMute}
                            disabled={isDeafened}
                            className={`
                                w-full p-2 rounded-md transition-all flex items-center justify-center
                                ${isDeafened ? 'opacity-50 cursor-not-allowed text-text-muted bg-background-tertiary' : 'hover:bg-background-modifier-hover text-text-normal bg-background-secondary hover:text-white'}
                            `}
                        >
                            {isMuted ? <MicOff size={20} className="text-status-danger" /> : <Mic size={20} />}
                        </button>
                    </Tooltip>

                    <Tooltip text={isDeafened ? "Activer casque" : "Couper casque"} side="top">
                        <button 
                            onClick={handleToggleDeafen}
                            className="w-full p-2 rounded-md hover:bg-background-modifier-hover text-text-normal bg-background-secondary hover:text-white transition-all flex items-center justify-center"
                        >
                            {isDeafened ? <HeadphoneOff size={20} className="text-status-danger" /> : <Headphones size={20} />}
                        </button>
                    </Tooltip>

                    <Tooltip text="Déconnecter" side="top">
                        <button 
                            onClick={() => {
                                leaveChannel();
                                useServerStore.getState().setActiveChannel(null);
                            }}
                            className="w-full p-2 rounded-md hover:bg-status-danger/10 text-text-normal bg-background-secondary hover:text-status-danger transition-all flex items-center justify-center"
                        >
                            <PhoneOff size={20} />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>

        <VoiceConnectionDetailsModal 
            isOpen={showDetails} 
            onClose={() => setShowDetails(false)} 
        />
    </>
  );
};
