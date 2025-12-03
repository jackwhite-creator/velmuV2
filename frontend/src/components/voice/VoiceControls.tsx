import React, { useRef, useState } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { 
  Mic, MicOff, Headphones, HeadphoneOff, 
  Video, VideoOff, Monitor, MonitorOff, 
  PhoneOff, ChevronDown 
} from 'lucide-react';
import { useVoiceStore } from '../../store/voiceStore';
import { useServerStore } from '../../store/serverStore';
import Tooltip from '../ui/Tooltip';
import { DeviceSelector } from './DeviceSelector';

export const VoiceControls: React.FC = () => {
    const { 
        isMuted, toggleMute, 
        isDeafened, toggleDeafen,
        isCameraOn, toggleCamera,
        isScreenShareOn, toggleScreenShare,
        leaveChannel 
    } = useVoiceStore();
    
    const { localParticipant } = useLocalParticipant();
    
    // Ref to track if user was muted BEFORE deafening
    const wasMutedBeforeDeafen = useRef<boolean>(false);

    // Device Selector State
    const [activeSelector, setActiveSelector] = useState<'mic' | 'output' | 'camera' | null>(null);

    const handleToggleMute = async () => {
        if (!localParticipant) return;
        
        // If deafened, we cannot unmute
        if (isDeafened) return;

        const newMutedState = !isMuted;
        
        // Optimistic Update
        toggleMute(); 

        try {
            await localParticipant.setMicrophoneEnabled(!newMutedState);
        } catch (e) {
            console.error('Failed to toggle microphone:', e);
            toggleMute(); // Revert on error
        }
    };

    const handleToggleDeafen = async () => {
        if (!localParticipant) return;
        
        const newDeafenedState = !isDeafened;

        // Optimistic Update
        toggleDeafen();

        try {
            if (newDeafenedState) {
                // --- ENABLING DEAFEN ---
                // 1. Store current mute state
                wasMutedBeforeDeafen.current = isMuted;
                
                // 2. If not already muted, mute mic now
                if (!isMuted) {
                    toggleMute(); // Optimistic mute
                    await localParticipant.setMicrophoneEnabled(false);
                }

                // 3. Set Deafen State
                await localParticipant.setMetadata(JSON.stringify({ isDeafened: true }));

            } else {
                // --- DISABLING DEAFEN ---
                // 1. Unset Deafen State
                await localParticipant.setMetadata(JSON.stringify({ isDeafened: false }));

                // 2. Restore Mic State
                // If we were NOT muted before deafening, we unmute now.
                // If we WERE muted before deafening, we stay muted.
                if (!wasMutedBeforeDeafen.current) {
                    toggleMute(); // Optimistic unmute
                    await localParticipant.setMicrophoneEnabled(true);
                }
            }
        } catch (e) {
            console.error('Failed to toggle deafen:', e);
            toggleDeafen(); // Revert deafen
        }
    };

    const handleToggleCamera = async () => {
        const newState = !isCameraOn;
        // Optimistic Update
        toggleCamera(newState);
        
        try {
            await localParticipant?.setCameraEnabled(newState);
        } catch (e) {
            console.error('Failed to toggle camera:', e);
            toggleCamera(!newState); // Revert
        }
    };

    const handleToggleScreenShare = async () => {
        const newState = !isScreenShareOn;
        // Optimistic Update
        toggleScreenShare(newState);

        try {
            await localParticipant?.setScreenShareEnabled(newState);
        } catch (e) {
            console.error('Failed to toggle screen share:', e);
            toggleScreenShare(!newState); // Revert
        }
    };

    return (
        <div className="bg-background-secondary/90 backdrop-blur-md border border-background-tertiary px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
            {/* Mic Group */}
            <div className="flex items-center gap-1 relative">
                <ControlButton 
                    isActive={!isMuted} 
                    onClick={handleToggleMute}
                    label={isMuted ? "Activer micro" : "Couper micro"}
                    activeIcon={<Mic size={20} />}
                    inactiveIcon={<MicOff size={20} className="text-status-danger" />}
                    disabled={isDeafened} 
                />
                <button 
                    onClick={() => setActiveSelector(activeSelector === 'mic' ? null : 'mic')}
                    className="device-selector-trigger p-1.5 rounded-lg hover:bg-background-modifier-hover text-text-muted hover:text-text-normal transition-colors"
                >
                    <ChevronDown size={14} />
                </button>
                {activeSelector === 'mic' && (
                    <DeviceSelector 
                        kind="audioinput" 
                        onClose={() => setActiveSelector(null)} 
                    />
                )}
            </div>

            {/* Audio/Headphone Group */}
            <div className="flex items-center gap-1 relative">
                <ControlButton 
                    isActive={!isDeafened} 
                    onClick={handleToggleDeafen}
                    label={isDeafened ? "Activer casque" : "Couper casque"}
                    activeIcon={<Headphones size={20} />}
                    inactiveIcon={<HeadphoneOff size={20} className="text-status-danger" />}
                />
                <button 
                    onClick={() => setActiveSelector(activeSelector === 'output' ? null : 'output')}
                    className="device-selector-trigger p-1.5 rounded-lg hover:bg-background-modifier-hover text-text-muted hover:text-text-normal transition-colors"
                >
                    <ChevronDown size={14} />
                </button>
                {activeSelector === 'output' && (
                    <DeviceSelector 
                        kind="audiooutput" 
                        onClose={() => setActiveSelector(null)} 
                    />
                )}
            </div>

            <div className="w-px h-8 bg-background-tertiary mx-2" />

            {/* Camera Group */}
            <div className="flex items-center gap-1 relative">
                <ControlButton 
                    isActive={!isCameraOn} 
                    onClick={handleToggleCamera}
                    label={isCameraOn ? "Désactiver caméra" : "Activer caméra"}
                    activeIcon={<VideoOff size={20} />}
                    inactiveIcon={<Video size={20} />}
                />
                <button 
                    onClick={() => setActiveSelector(activeSelector === 'camera' ? null : 'camera')}
                    className="device-selector-trigger p-1.5 rounded-lg hover:bg-background-modifier-hover text-text-muted hover:text-text-normal transition-colors"
                >
                    <ChevronDown size={14} />
                </button>
                {activeSelector === 'camera' && (
                    <DeviceSelector 
                        kind="videoinput" 
                        onClose={() => setActiveSelector(null)} 
                    />
                )}
            </div>

            {/* Screen Share Toggle */}
            <ControlButton 
                isActive={!isScreenShareOn} 
                onClick={handleToggleScreenShare}
                label={isScreenShareOn ? "Arrêter le stream" : "Partager l'écran"}
                activeIcon={<MonitorOff size={20} />}
                inactiveIcon={<Monitor size={20} />}
            />

            <div className="w-px h-8 bg-background-tertiary mx-2" />

            {/* Disconnect */}
            <Tooltip text="Déconnecter" side="top">
                <button 
                    onClick={() => {
                        leaveChannel();
                        useServerStore.getState().setActiveChannel(null);
                    }}
                    className="bg-status-danger hover:bg-red-600 text-white p-3 rounded-xl transition-all shadow-lg hover:shadow-red-500/20 group relative"
                >
                    <PhoneOff size={20} />
                </button>
            </Tooltip>
        </div>
    );
};

const ControlButton: React.FC<{ 
    isActive: boolean; 
    onClick: () => void; 
    label: string; 
    activeIcon: React.ReactNode; 
    inactiveIcon: React.ReactNode;
    disabled?: boolean;
}> = ({ isActive, onClick, label, activeIcon, inactiveIcon, disabled }) => (
    <Tooltip text={disabled ? "" : label} side="top">
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`
                p-3 rounded-xl transition-all relative group
                ${disabled ? 'opacity-50 cursor-not-allowed bg-background-tertiary' : 
                  isActive 
                    ? 'bg-background-tertiary text-text-normal hover:bg-background-modifier-hover' 
                    : 'bg-white text-black hover:bg-gray-200' 
                }
            `}
        >
            {isActive ? activeIcon : inactiveIcon}
        </button>
    </Tooltip>
);
