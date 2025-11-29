import React, { useEffect, useState } from 'react';
import Modal from '../../ui/Modal';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';

interface UserProfile {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  createdAt: string;
  mutualServers?: {
      id: string;
      name: string;
      iconUrl: string | null;
  }[];
}

export default function UserProfileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOpenProfile = (e: CustomEvent<{ userId: string }>) => {
      setUserId(e.detail.userId);
      setIsOpen(true);
    };

    window.addEventListener('open-profile', handleOpenProfile as EventListener);
    return () => window.removeEventListener('open-profile', handleOpenProfile as EventListener);
  }, []);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      api.get(`/users/${userId}`)
        .then(res => setUser(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
        setUser(null);
    }
  }, [isOpen, userId]);

  const handleClose = () => setIsOpen(false);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
        <div className="w-full bg-background-floating rounded-md overflow-hidden relative">
            {/* Banner */}
            <div className="h-24 w-full bg-background-tertiary relative">
                {user?.bannerUrl && <img src={user.bannerUrl} alt="banner" className="w-full h-full object-cover" />}
            </div>

            {/* Avatar */}
            <div className="absolute top-16 left-4 rounded-full p-1.5 bg-background-floating">
                <div className="w-20 h-20 rounded-full bg-background-secondary overflow-hidden border-4 border-background-floating">
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-text-muted">
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="mt-14 px-4 pb-4">
                {loading ? (
                    <div className="text-center py-4 text-text-muted text-sm">Chargement...</div>
                ) : user ? (
                    <>
                        <h2 className="text-xl font-bold text-text-header">
                            {user.username}
                            <span className="text-text-muted font-medium text-base ml-1">#{user.discriminator}</span>
                        </h2>

                        <div className="mt-4 border-t border-background-modifier-accent pt-3">
                            <h3 className="text-xs font-bold text-text-muted uppercase mb-1">A PROPOS DE MOI</h3>
                            <p className="text-sm text-text-normal whitespace-pre-wrap">
                                {user.bio || "Pas de bio."}
                            </p>
                        </div>

                        <div className="mt-4 border-t border-background-modifier-accent pt-3">
                            <h3 className="text-xs font-bold text-text-muted uppercase mb-1">MEMBRE DEPUIS</h3>
                            <p className="text-sm text-text-normal">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Mutual Servers */}
                        {user.mutualServers && user.mutualServers.length > 0 && (
                            <div className="mt-4 border-t border-background-modifier-accent pt-3">
                                <h3 className="text-xs font-bold text-text-muted uppercase mb-2">SERVEURS EN COMMUN — {user.mutualServers.length}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.mutualServers.map(s => (
                                        <div key={s.id} className="w-8 h-8 rounded-full bg-background-secondary overflow-hidden" title={s.name}>
                                            {s.iconUrl ? (
                                                <img src={s.iconUrl} alt={s.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-text-muted">
                                                    {s.name.substring(0,2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-4 text-red-400 text-sm">Erreur de chargement.</div>
                )}
            </div>
        </div>
    </Modal>
  );
}
