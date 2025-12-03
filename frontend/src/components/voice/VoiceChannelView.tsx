import React, { useEffect } from 'react';
import { useParticipants, useTracks, useRemoteParticipants } from '@livekit/components-react';
import { Track, RemoteAudioTrack } from 'livekit-client';
import { LogIn, User as UserIcon } from 'lucide-react';

import { useServerStore } from '../../store/serverStore';
import { useVoiceStore } from '../../store/voiceStore';
import { ParticipantTile } from './ParticipantTile';
import { VoiceControls } from './VoiceControls';

interface VoiceChannelViewProps {
    onUserContextMenu?: (e: React.MouseEvent, user: any) => void;
}

export const VoiceChannelView: React.FC<VoiceChannelViewProps & { channelId: string }> = ({ onUserContextMenu, channelId }) => {
  const { isConnected, joinChannel, isDeafened, currentChannelId } = useVoiceStore();
  const [maximizedParticipantId, setMaximizedParticipantId] = React.useState<string | null>(null);
  
  // LiveKit participants
  const livekitParticipants = useParticipants();
  
  // Store participants (fallback)
  const { participants: storeParticipantsMap, participantStates } = useVoiceStore();
  const storeParticipants = storeParticipantsMap[channelId] || [];
  const { activeServer } = useServerStore();

  // Only show LiveKit view if we are connected AND viewing the current channel
  const showLiveKit = isConnected && currentChannelId === channelId && livekitParticipants.length > 0;

  // --- Real Deafen Logic (Mute Incoming Audio) ---
  const remoteParticipants = useRemoteParticipants();
  
  useEffect(() => {
      // Iterate over all remote participants and their audio tracks
      remoteParticipants.forEach(participant => {
          participant.audioTrackPublications.forEach(pub => {
              if (pub.track && pub.track instanceof RemoteAudioTrack) {
                  // If deafened, set volume to 0. Otherwise, restore to 1 (or previous volume).
                  // We assume 1 is the default.
                  pub.track.setVolume(isDeafened ? 0 : 1);
              }
          });
      });
  }, [isDeafened, remoteParticipants]);


  // Filter participants for Stage (Video/Screen) vs Grid (Audio/Avatar)
  const videoTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: true });
  
  const videoParticipantIds = new Set(
      videoTracks
        .filter(t => !t.publication.isMuted)
        .map(t => t.participant.identity)
  );
  
  const stageParticipants = livekitParticipants.filter(p => videoParticipantIds.has(p.identity));
  const gridParticipants = livekitParticipants.filter(p => !videoParticipantIds.has(p.identity));

  // If maximized, we only show the maximized participant in the main area
  const maximizedParticipant = maximizedParticipantId ? livekitParticipants.find(p => p.identity === maximizedParticipantId) : null;



  return (
    <div className="flex-1 bg-background-primary flex flex-col relative overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar gap-4">
        
        {showLiveKit ? (
            maximizedParticipant ? (
                // MAXIMIZED VIEW
                <div className="flex-1 w-full h-full flex items-center justify-center p-2">
                    <ParticipantTile 
                        participant={maximizedParticipant}
                        onContextMenu={onUserContextMenu} 
                        isStage={true} 
                        isMaximized={true}
                        onToggleMaximize={() => setMaximizedParticipantId(null)}
                    />
                </div>
            ) : (
                // NORMAL VIEW (Stage + Grid)
                <>
                    {/* STAGE AREA (Video/Stream) */}
                    {stageParticipants.length > 0 && (
                        <div className="flex-1 min-h-[50%] flex items-center justify-center w-full transition-all duration-300">
                            <div className={`grid gap-4 w-full h-full ${
                                stageParticipants.length === 1 ? 'grid-cols-1' : 
                                stageParticipants.length === 2 ? 'grid-cols-2' : 
                                'grid-cols-2 md:grid-cols-3'
                            }`}>
                                {stageParticipants.map(participant => (
                                    <ParticipantTile 
                                        key={participant.identity}
                                        participant={participant}
                                        onContextMenu={onUserContextMenu} 
                                        isStage={true} 
                                        onToggleMaximize={() => setMaximizedParticipantId(participant.identity)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GRID AREA (Audio/Avatar) */}
                    <div className={`grid gap-4 w-full transition-all duration-300 ${
                        stageParticipants.length > 0 
                            ? 'flex-shrink-0 h-48 grid-cols-4 sm:grid-cols-5 md:grid-cols-6' 
                            : 'flex-1 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 content-center' 
                    }`}>
                        {gridParticipants.map(participant => (
                            <ParticipantTile 
                                key={participant.identity}
                                participant={participant}
                                onContextMenu={onUserContextMenu} 
                                isStage={false} 
                                onToggleMaximize={() => setMaximizedParticipantId(participant.identity)}
                            />
                        ))}
                    </div>
                </>
            )
        ) : (
            // Fallback View (Socket Data - Preview)
            <div className="flex-1 flex flex-col items-center justify-center">
                {storeParticipants.length > 0 ? (
                    <>
                        {/* PREVIEW GRID AREA (Unified) */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-center w-full transition-all duration-300">
                            {storeParticipants.map(userId => {
                                const member = activeServer?.members?.find(m => m.userId === userId);
                                const user = member?.user;
                                if (!user) return null;

                                return (
                                    <ParticipantTile 
                                        key={userId}
                                        user={user}
                                        voiceState={participantStates[userId]}
                                        onContextMenu={onUserContextMenu} 
                                        isStage={false} 
                                    />
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-20 h-20 rounded-full bg-background-secondary flex items-center justify-center mb-4">
                            <UserIcon size={40} className="text-text-muted" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-normal mb-1">C'est calme par ici...</h3>
                        <p className="text-text-muted text-sm">
                            Personne n'est connecté. Sois le premier à rejoindre !
                        </p>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Bottom Controls / Join Overlay */}
      <div className="p-4 flex justify-center w-full z-10 bg-background-primary">
        {!isConnected || currentChannelId !== channelId ? (
            <button 
                onClick={() => joinChannel(channelId)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors flex items-center gap-2"
            >
                <LogIn size={18} />
                {isConnected ? "Rejoindre ce salon" : "Rejoindre le salon vocal"}
            </button>
        ) : (
            <VoiceControls />
        )}
      </div>
    </div>
  );
};
