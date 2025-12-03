import React, { useState, useEffect, useRef } from 'react';
import { VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { MicOff, HeadphoneOff, User as UserIcon, Maximize2, Minimize2, Video, Monitor } from 'lucide-react';
import { useServerStore } from '../../store/serverStore';
import { VoiceParticipantState } from '../../store/voiceStore';

interface ParticipantTileProps {
    participant?: any; // Made optional for Preview Mode
    user?: any; // Direct user object for Preview Mode
    voiceState?: VoiceParticipantState; // For Preview Mode
    onContextMenu?: (e: React.MouseEvent, user: any) => void;
    isStage?: boolean;
    isMaximized?: boolean;
    onToggleMaximize?: () => void;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({ 
    participant, 
    user: propUser,
    voiceState,
    onContextMenu, 
    isStage = false, 
    isMaximized = false, 
    onToggleMaximize 
}) => {
  
  // Custom Voice Detection for higher sensitivity
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const speakingTimeout = useRef<NodeJS.Timeout | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
      if (!participant) {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          return;
      }

      const checkAudioActivity = () => {
          // Combine LiveKit's VAD flag AND raw audio level for maximum coverage
          // participant.isSpeaking handles the "logic", audioLevel handles the "raw signal"
          const level = participant.audioLevel || 0;
          const livekitIsSpeaking = participant.isSpeaking;
          
          // Trigger if EITHER LiveKit says speaking OR we detect ANY raw audio
          const isNowSpeaking = livekitIsSpeaking || level > 0;
          
          if (isNowSpeaking) {
              if (!isSpeakingRef.current) {
                  setIsSpeaking(true);
                  isSpeakingRef.current = true;
              }
              
              // Clear any pending "stop speaking" timeout
              if (speakingTimeout.current) {
                  clearTimeout(speakingTimeout.current);
                  speakingTimeout.current = null;
              }
          } else {
              // Add a small delay before turning off to prevent flickering
              if (!speakingTimeout.current && isSpeakingRef.current) {
                  speakingTimeout.current = setTimeout(() => {
                      setIsSpeaking(false);
                      isSpeakingRef.current = false;
                      speakingTimeout.current = null;
                  }, 200); // 200ms hold time
              }
          }

          // Loop
          rafId.current = requestAnimationFrame(checkAudioActivity);
      };

      // Start the loop
      rafId.current = requestAnimationFrame(checkAudioActivity);
      
      return () => {
          if (rafId.current) cancelAnimationFrame(rafId.current);
          if (speakingTimeout.current) clearTimeout(speakingTimeout.current);
      };
  }, [participant]);
  const { activeServer } = useServerStore();

  // Resolve User Data
  // If participant is provided, try to find member in store.
  // If not, use propUser (Preview Mode).
  let member;
  let user = propUser;
  let displayName = 'Utilisateur';
  let avatarUrl = null;

  if (participant) {
      member = activeServer?.members?.find(m => m.userId === participant.identity);
      user = member?.user;
      displayName = member?.nickname || user?.username || participant.identity || 'Utilisateur inconnu';
      avatarUrl = user?.avatarUrl;
  } else if (propUser) {
      // Preview Mode
      displayName = propUser.username || 'Utilisateur';
      avatarUrl = propUser.avatarUrl;
  }

  // Parse metadata for deafened state
  const [isDeafenedLocal, setIsDeafenedLocal] = React.useState(false);
  
  React.useEffect(() => {
      if (participant?.metadata) {
          try {
              const metadata = JSON.parse(participant.metadata);
              setIsDeafenedLocal(!!metadata.isDeafened);
          } catch (e) {
              setIsDeafenedLocal(false);
          }
      } else {
          setIsDeafenedLocal(false);
      }
  }, [participant?.metadata]);

  const isDeafened = participant ? isDeafenedLocal : (voiceState?.isDeafened || false);

  const handleContextMenu = (e: React.MouseEvent) => {
      if (onContextMenu && user) {
          onContextMenu(e, user);
      }
  };

  // Check for active video tracks directly from the participant object
  const cameraPub = participant?.getTrackPublication(Track.Source.Camera);
  const screenPub = participant?.getTrackPublication(Track.Source.ScreenShare);
  const micPub = participant?.getTrackPublication(Track.Source.Microphone);

  const isMicMuted = participant ? (micPub?.isMuted ?? true) : (voiceState?.isMuted || false);

  // Determine which track to show (Screen share takes priority)
  const activeVideoPub = (screenPub && !screenPub.isMuted && screenPub.isSubscribed) ? screenPub :
                         (cameraPub && !cameraPub.isMuted && cameraPub.isSubscribed) ? cameraPub : undefined;

  // Preview indicators (when no actual video track but state says it's on)
  const showCameraIndicator = !participant && voiceState?.isCameraOn;
  const showScreenIndicator = !participant && voiceState?.isScreenShareOn;

  return (
    <div 
        className={`
            bg-background-secondary rounded-lg overflow-hidden relative group border border-transparent hover:border-background-tertiary transition-all cursor-pointer flex flex-col items-center justify-center
            ${isMaximized ? 'w-full h-full' : isStage ? 'w-full h-full max-h-[70vh]' : 'aspect-video'} 
        `}
        onContextMenu={handleContextMenu}
    >
      {activeVideoPub ? (
          <>
            {/* Render Video */}
            <VideoTrack 
                trackRef={{
                participant: participant,
                source: activeVideoPub.source,
                publication: activeVideoPub
                }}
                className="w-full h-full object-contain bg-black" 
            />
            
            {/* Maximize/Minimize Button (Only for video/stream) */}
            {onToggleMaximize && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleMaximize();
                    }}
                    className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20"
                    title={isMaximized ? "Réduire" : "Agrandir"}
                >
                    {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
            )}
          </>
      ) : (
          // Render Avatar
          <div className={`
            rounded-full bg-background-tertiary flex items-center justify-center mb-3 overflow-hidden relative transition-all
            ${isStage ? 'w-32 h-32' : 'w-20 h-20'}
            ${isSpeaking ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-background-secondary shadow-[0_0_15px_rgba(34,197,94,0.6)] duration-0' : 'duration-300'}
          `}>
             {avatarUrl ? (
               <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
             ) : (
               <UserIcon size={isStage ? 64 : 40} className="text-text-muted" />
             )}
          </div>
      )}
      
      {/* Top-Left Status Icons (Camera/Screen) - Preview Mode */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
          {showScreenIndicator && (
              <div className="bg-background-tertiary/80 p-1.5 rounded-full text-green-500 backdrop-blur-sm shadow-lg animate-pulse border border-green-500/30" title="Partage d'écran en cours">
                  <Monitor size={16} />
              </div>
          )}
          {showCameraIndicator && (
              <div className="bg-background-tertiary/80 p-1.5 rounded-full text-green-500 backdrop-blur-sm shadow-lg animate-pulse border border-green-500/30" title="Caméra active">
                  <Video size={16} />
              </div>
          )}
      </div>

      {/* Bottom-Right Status Icons (Mute/Deafen) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 z-20">
          {isMicMuted && (
              <div className="bg-black/60 p-1.5 rounded-full text-white backdrop-blur-sm" title="Micro coupé">
                  <MicOff size={14} />
              </div>
          )}
          {isDeafened && (
              <div className="bg-black/60 p-1.5 rounded-full text-white backdrop-blur-sm" title="Casque coupé">
                  <HeadphoneOff size={14} />
              </div>
          )}
      </div>

      {/* Name Overlay */}
      <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded text-sm font-medium text-white backdrop-blur-sm flex items-center gap-2 z-10">
        <span className="truncate max-w-[120px]">{displayName}</span>
      </div>
    </div>
  );
};
