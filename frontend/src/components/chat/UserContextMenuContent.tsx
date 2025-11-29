import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ContextMenuItem, ContextMenuSeparator, ContextMenuLabel } from '../ui/ContextMenu';
import { useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { Permissions } from '@backend/shared/permissions';
import api from '../../lib/api';

interface Props {
  memberId: string;
  serverId?: string;
  onClose: () => void;
}

import { usePermission } from '../../hooks/usePermission';

export default function UserContextMenuContent({ memberId, serverId, onClose }: Props) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { activeServer, updateMember } = useServerStore();

  const isMe = currentUser?.id === memberId;
  const member = activeServer?.members?.find(m => m.userId === memberId);
  
  // Permissions using hook
  const canKick = usePermission(Permissions.KICK_MEMBERS);
  const canBan = usePermission(Permissions.BAN_MEMBERS);
  const canManageRoles = usePermission(Permissions.MANAGE_ROLES);

  // Roles Logic
  const getManageableRoles = () => {
      if (!currentUser || !activeServer || !activeServer.roles || !member) return [];
      if (!canManageRoles) return [];

      const myMember = activeServer.members?.find(m => m.userId === currentUser.id);
      if (!myMember) return [];
      const isOwner = activeServer.ownerId === currentUser.id;

      // Filter roles lower than mine
      const myHighestPos = Math.max(...(myMember.roles.map(r => r.position) || [0]));
      
      return activeServer.roles.filter(r => {
          if (r.name === '@everyone') return false;
          if (isOwner) return true;
          return r.position < myHighestPos;
      }).sort((a, b) => b.position - a.position);
  };

  const handleRoleToggle = async (roleId: string, hasRole: boolean) => {
      if (!serverId || !member) return;
      
      let newRoleIds = member.roles.map(r => r.id);
      if (hasRole) {
          newRoleIds = newRoleIds.filter(id => id !== roleId);
      } else {
          newRoleIds.push(roleId);
      }

      try {
          const res = await api.put(`/members/${serverId}/${member.id}`, { roleIds: newRoleIds });
          updateMember(serverId, res.data);
      } catch (err) {
          console.error("Failed to update roles", err);
      }
  };

  const handleKick = async () => {
      if (!serverId || !member) return;
      if (!confirm(`Voulez-vous vraiment expulser ${member.user.username} ?`)) return;
      try {
          await api.delete(`/members/${serverId}/kick/${member.id}`);
          onClose();
      } catch (err) { console.error(err); }
  };

  const handleBan = async () => {
      // TODO: Implement Ban
      onClose();
  };

  const handleDM = async () => {
      try {
          const res = await api.post('/conversations', { targetUserId: memberId });
          navigate(`/channels/@me/${res.data.id}`);
          onClose();
      } catch (err) { console.error(err); }
  };

  const handleProfile = () => {
      // Logic to open profile modal (using a store or callback)
      // Since we don't have a global profile store yet, we might need to rely on prop callback or add one
      // The user wants it to work.
      // Assuming we can trigger it via a window event or store.
      // For now, let's console log, or if MemberList has a way...
      // MemberList passed onUserClick, but that's for clicking the item.
      // Let's assume we can navigate to a profile route or emit an event.
      // Actually, standard Discord opens a modal.
      // We will leave a TODO or try to implement if we can find the modal state.
      // `onOpenProfile` was passed to ServerChannels but not here.
      // Let's dispatch a custom event for now as a quick fix or just navigate if we had a route.
      window.dispatchEvent(new CustomEvent('open-profile', { detail: { userId: memberId } }));
      onClose();
  };

  const manageableRoles = getManageableRoles();
  const isServerContext = !!serverId && !!activeServer;

  return (
    <>
      <ContextMenuItem label="Profil" onClick={handleProfile} />
      {!isMe && <ContextMenuItem label="Envoyer un message" onClick={handleDM} />}
      
      {isServerContext && !isMe && (
          <>
            <ContextMenuSeparator />
            {canManageRoles && manageableRoles.length > 0 && (
                 <ContextMenuItem label="Rôles">
                     <ContextMenuLabel label="Membres" />
                     {manageableRoles.map(role => {
                         const hasRole = member?.roles.some(r => r.id === role.id);
                         return (
                             <ContextMenuItem 
                                key={role.id}
                                label={role.name}
                                onClick={() => handleRoleToggle(role.id, !!hasRole)}
                                icon={hasRole ? (
                                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                ) : (
                                    <div className="w-4 h-4 border border-zinc-500 rounded-sm"></div>
                                )}
                             />
                         );
                     })}
                 </ContextMenuItem>
            )}
            
            <ContextMenuSeparator />
            {canKick && <ContextMenuItem label="Exclure" variant="danger" onClick={handleKick} />}
            {canBan && <ContextMenuItem label="Bannir" variant="danger" onClick={handleBan} />}
          </>
      )}
    </>
  );
}
