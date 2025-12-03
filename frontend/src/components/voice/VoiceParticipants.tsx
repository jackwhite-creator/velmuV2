import React, { useState, useEffect, useRef } from 'react';
import { useVoiceStore } from '../../store/voiceStore';
import { Server } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { MicOff, HeadphoneOff, Video, Monitor } from 'lucide-react';
import { useParticipants } from '@livekit/components-react';

interface Props {
  channelId: string;
  server: Server;
}

interface SidebarParticipantItemProps {
    userId: string;
    displayUser: any;
    state: any;
}

const SidebarParticipantItem: React.FC<SidebarParticipantItemProps> = ({ userId, displayUser, state }) => {
    const participants = useParticipants();
    const participant = participants.find(p => p.identity === userId);
    
    // Optimized Voice Detection (Same as ParticipantTile)
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
            const level = participant.audioLevel || 0;
            const livekitIsSpeaking = participant.isSpeaking;
            
            const isNowSpeaking = livekitIsSpeaking || level > 0;
            
            if (isNowSpeaking) {
                if (!isSpeakingRef.current) {
                    setIsSpeaking(true);
                    isSpeakingRef.current = true;
                }
                
                if (speakingTimeout.current) {
                    clearTimeout(speakingTimeout.current);
                    speakingTimeout.current = null;
                }
            } else {
                if (!speakingTimeout.current && isSpeakingRef.current) {
                    speakingTimeout.current = setTimeout(() => {
                        setIsSpeaking(false);
                        isSpeakingRef.current = false;
                        speakingTimeout.current = null;
                    }, 200);
                }
            }

            rafId.current = requestAnimationFrame(checkAudioActivity);
        };

        rafId.current = requestAnimationFrame(checkAudioActivity);
        
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
            if (speakingTimeout.current) clearTimeout(speakingTimeout.current);
        };
    }, [participant]);

    return (
        <div className="flex items-center justify-between p-1 rounded hover:bg-background-modifier-hover cursor-pointer group pr-2">
            <div className="flex items-center gap-2 min-w-0">
                <div className={`w-5 h-5 rounded-full bg-background-secondary overflow-hidden flex-shrink-0 transition-all ${isSpeaking ? 'ring-2 ring-green-500 ring-offset-1 ring-offset-background-secondary shadow-[0_0_8px_rgba(34,197,94,0.8)] duration-0' : 'duration-300'}`}>
                {displayUser.avatarUrl ? (
                    <img src={displayUser.avatarUrl} alt={displayUser.username} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-text-muted bg-background-tertiary">
                        {displayUser.username.substring(0, 2).toUpperCase()}
                    </div>
                )}
                </div>
                <span className={`text-sm font-medium truncate group-hover:text-text-normal transition-colors ${state?.isMuted || state?.isDeafened ? 'text-text-muted' : 'text-text-normal'} ${isSpeaking ? 'text-text-normal' : ''}`}>
                    {displayUser.username}
                </span>
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {state?.isScreenShareOn && (
                    <div className="text-text-muted" title="Partage d'écran">
                        <Monitor size={14} />
                    </div>
                )}
                {state?.isCameraOn && (
                    <div className="text-text-muted" title="Caméra active">
                        <Video size={14} />
                    </div>
                )}
                {state?.isMuted && (
                    <div className="text-text-muted" title="Micro coupé">
                        <MicOff size={14} />
                    </div>
                )}
                {state?.isDeafened && (
                    <div className="text-text-muted" title="Casque coupé">
                        <HeadphoneOff size={14} />
                    </div>
                )}
            </div>
        </div>
    );
};

export const VoiceParticipants: React.FC<Props> = ({ channelId, server }) => {
  const { participants, participantStates } = useVoiceStore();
  const { user: currentUser } = useAuthStore();
  const channelParticipants = participants[channelId] || [];

  if (channelParticipants.length === 0) return null;

  return (
    <div className="pl-8 pr-2 pb-1 space-y-1">
      {channelParticipants.map(userId => {
        const member = server.members?.find(m => m.userId === userId);
        const user = member?.user || (userId === currentUser?.id ? currentUser : null);
        const state = participantStates[userId];
        
        const displayUser = user || { 
            id: userId, 
            username: 'Utilisateur Inconnu', 
            avatarUrl: null, 
            discriminator: '0000' 
        };

        return (
            <SidebarParticipantItem 
                key={userId} 
                userId={userId} 
                displayUser={displayUser} 
                state={state} 
            />
        );
      })}
    </div>
  );
};

