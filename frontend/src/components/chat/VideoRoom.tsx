import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { useNavigate } from 'react-router-dom';
import { useSocketStore } from '../../store/socketStore';
import { useAuthStore } from '../../store/authStore';
import { Channel } from '../../store/serverStore';
import VideoPlayer from './VideoPlayer';

interface Props {
  channel: Channel;
}

interface PeerData {
  peerID: string;
  peer: SimplePeer.Instance;
  username: string;
}

// Serveurs STUN publics de Google (GRATUITS et FIABLES)
// Ils permettent aux utilisateurs de traverser le NAT (Routeurs)
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' }
];

export default function VideoRoom({ channel }: Props) {
  const navigate = useNavigate();
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const userVideo = useRef<HTMLVideoElement>(null);
  // On utilise une Ref pour stocker le stream et éviter les closures périmées
  const streamRef = useRef<MediaStream | null>(null); 
  const peersRef = useRef<{ peerID: string; peer: SimplePeer.Instance }[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!socket || !user) return;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }

        setupAudioAnalysis(stream);

        // On dit au serveur qu'on rejoint
        console.log("📡 Joining room:", channel.id);
        socket.emit("join_voice_channel", channel.id);

        // 1. On reçoit la liste des gens DÉJÀ présents
        socket.on("all_users_in_room", (users: string[]) => {
          console.log("👥 Users already here:", users);
          const newPeers: PeerData[] = [];
          users.forEach((userID) => {
            // En tant que nouvel arrivant, je suis l'INITIATEUR
            const peer = createPeer(userID, socket.id!, stream);
            peersRef.current.push({ peerID: userID, peer });
            newPeers.push({ peerID: userID, peer, username: "Utilisateur" }); 
          });
          setPeers(newPeers);
        });

        // 2. Quelqu'un d'autre arrive, je reçois son signal
        socket.on("user_joined_voice", (payload: { signal: any; callerID: string }) => {
          console.log("👋 New user joined, receiving signal from:", payload.callerID);
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({ peerID: payload.callerID, peer });
          setPeers((prev) => [...prev, { peerID: payload.callerID, peer, username: "Nouvel arrivant" }]);
        });

        // 3. L'initiateur reçoit ma réponse (handshake final)
        socket.on("receiving_returned_signal", (payload: { signal: any; id: string }) => {
          console.log("🤝 Handshake completed with:", payload.id);
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          if (item) {
            item.peer.signal(payload.signal);
          }
        });

        socket.on("user_left_voice", (id: string) => {
          console.log("🏃 User left:", id);
          const peerObj = peersRef.current.find((p) => p.peerID === id);
          if (peerObj) peerObj.peer.destroy();
          const newPeersRef = peersRef.current.filter((p) => p.peerID !== id);
          peersRef.current = newPeersRef;
          setPeers((prev) => prev.filter((p) => p.peerID !== id));
        });

      } catch (err) {
        console.error("❌ Error accessing media devices:", err);
        alert("Impossible d'accéder à la caméra/micro. Vérifiez vos permissions.");
        navigate(`/channels/${channel.serverId}`);
      }
    };

    init();

    return () => {
      // Cleanup
      socket.emit("leave_voice_channel");
      socket.off("all_users_in_room");
      socket.off("user_joined_voice");
      socket.off("receiving_returned_signal");
      socket.off("user_left_voice");
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      peersRef.current.forEach(({ peer }) => peer.destroy());
      peersRef.current = [];
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [channel.id]);

  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setIsSpeaking(average > 15); // Seuil de détection
        animationRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
    } catch (e) {
        console.error("Audio Context Error", e);
    }
  };

  function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
      config: { iceServers: ICE_SERVERS } // <--- CRUCIAL POUR LE DÉPLOIEMENT
    });

    peer.on("signal", (signal) => {
      socket?.emit("sending_signal", { userToSignal, callerID, signal });
    });
    
    peer.on("error", (err) => console.error("Peer Error (Initiator):", err));

    return peer;
  }

  function addPeer(incomingSignal: any, callerID: string, stream: MediaStream) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
      config: { iceServers: ICE_SERVERS } // <--- CRUCIAL
    });

    peer.on("signal", (signal) => {
      socket?.emit("returning_signal", { signal, callerID });
    });

    peer.on("error", (err) => console.error("Peer Error (Receiver):", err));

    peer.signal(incomingSignal);
    return peer;
  }

  const toggleMute = () => {
    if (streamRef.current) {
        const audioTrack = streamRef.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
        }
    }
  };

  const handleLeave = () => {
      // Le cleanup du useEffect fera le reste
      navigate(`/channels/${channel.serverId}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#111214] h-full relative overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
            
            {/* MA VIDÉO */}
            <div className={`relative bg-[#1e1f22] rounded-md overflow-hidden aspect-video shadow-md transition-all duration-200 ${isSpeaking ? 'ring-2 ring-brand ring-offset-2 ring-offset-[#111214]' : 'border border-brand/50'}`}>
                <video muted ref={userVideo} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white backdrop-blur-sm select-none">
                    {user?.username} (Moi)
                </div>
                {isMuted && (
                    <div className="absolute top-2 right-2 bg-status-danger p-1.5 rounded-full shadow-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    </div>
                )}
            </div>

            {/* VIDÉOS DES AUTRES */}
            {peers.map((p) => (
                <VideoPlayer key={p.peerID} peer={p.peer} username={p.username} />
            ))}
        </div>
      </div>

      {/* BARRE DE CONTRÔLE */}
      <div className="h-20 bg-[#1e1f22] border-t border-[#2b2d31] flex items-center justify-center gap-6 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-50">
            <button 
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isVideoOff ? 'bg-white text-black' : 'bg-[#2b2d31] text-white hover:bg-[#383a40]'}`}
                title={isVideoOff ? "Activer la caméra" : "Désactiver la caméra"}
            >
                {isVideoOff ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                )}
            </button>

            <button 
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isMuted ? 'bg-white text-black' : 'bg-[#2b2d31] text-white hover:bg-[#383a40]'}`}
                title={isMuted ? "Activer le micro" : "Couper le micro"}
            >
                {isMuted ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                )}
            </button>

            <button 
                onClick={handleLeave}
                className="w-14 h-12 rounded-full bg-status-danger text-white hover:bg-red-600 transition flex items-center justify-center"
                title="Quitter"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
            </button>
      </div>
    </div>
  );
}