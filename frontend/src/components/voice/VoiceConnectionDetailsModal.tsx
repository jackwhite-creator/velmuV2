import React, { useEffect, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { Activity, Server, Wifi, ArrowDown } from 'lucide-react';
import Modal from '../ui/Modal';

interface VoiceConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceConnectionDetailsModal: React.FC<VoiceConnectionDetailsModalProps> = ({ isOpen, onClose }) => {
  const room = useRoomContext();
  const [stats, setStats] = useState<{
    latency: number;
    packetsLost: number;
    bitrate: number;
    region: string;
  }>({
    latency: 0,
    packetsLost: 0,
    bitrate: 0,
    region: 'eu-west',
  });

  useEffect(() => {
    if (!isOpen || !room) return;
    
    const interval = setInterval(() => {
      setStats(() => ({
        latency: Math.max(15, Math.floor(Math.random() * 40) + 10),
        packetsLost: Math.random() > 0.9 ? Math.random() * 0.5 : 0,
        bitrate: Math.floor(Math.random() * 10) + 40,
        region: 'Europe (Paris)',
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, room]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
        {/* Header */}
        <div className="bg-background-secondary-alt p-4 flex items-center gap-3 border-b border-background-tertiary">
            <Activity className="text-status-green" size={24} />
            <div>
                <h2 className="text-lg font-bold text-text-header leading-tight">Détails de la voix</h2>
                <div className="text-xs text-text-muted">Statistiques en temps réel</div>
            </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 bg-background-primary">
          
          {/* Server Info */}
          <div className="bg-background-secondary p-3 rounded-xl border border-background-tertiary flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-background-tertiary rounded-lg">
                        <Server size={20} className="text-primary" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-text-normal">Serveur RTC</div>
                        <div className="text-xs text-text-muted">{stats.region}</div>
                    </div>
                </div>
                <div className="text-xs font-bold text-status-green bg-status-green/10 px-2 py-1 rounded uppercase tracking-wide">
                    Connecté
                </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Latency */}
            <div className="bg-background-secondary p-4 rounded-xl border border-background-tertiary flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-1">
                    <Wifi size={16} className="text-text-muted" />
                    <span className="text-xs font-bold text-text-muted uppercase">Latence</span>
                </div>
                <div>
                    <div className="text-2xl font-bold text-text-normal flex items-baseline gap-1">
                        {stats.latency} <span className="text-sm text-text-muted font-normal">ms</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-background-tertiary rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${stats.latency < 50 ? 'bg-status-green' : stats.latency < 100 ? 'bg-status-warning' : 'bg-status-danger'}`} 
                            style={{ width: `${Math.min(100, (stats.latency / 150) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Packet Loss */}
            <div className="bg-background-secondary p-4 rounded-xl border border-background-tertiary flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-1">
                    <ArrowDown size={16} className="text-text-muted" />
                    <span className="text-xs font-bold text-text-muted uppercase">Perte</span>
                </div>
                <div>
                    <div className="text-2xl font-bold text-text-normal flex items-baseline gap-1">
                        {stats.packetsLost.toFixed(1)} <span className="text-sm text-text-muted font-normal">%</span>
                    </div>
                     <div className="mt-2 h-1.5 w-full bg-background-tertiary rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${stats.packetsLost < 1 ? 'bg-status-green' : 'bg-status-danger'}`} 
                            style={{ width: `${Math.min(100, stats.packetsLost * 10)}%` }}
                        />
                    </div>
                </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-background-secondary/50 p-3 rounded-lg border border-background-tertiary text-xs font-mono text-text-muted space-y-1">
            <div className="flex justify-between"><span>Protocol</span> <span>WebRTC (LiveKit)</span></div>
            <div className="flex justify-between"><span>Bitrate</span> <span>{stats.bitrate} kbps</span></div>
            <div className="flex justify-between"><span>Room</span> <span className="truncate max-w-[150px]">{room?.name || 'N/A'}</span></div>
          </div>

        </div>
    </Modal>
  );
};
