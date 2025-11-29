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

export default function UserContextMenuContent({ memberId, serverId, onClose }: Props) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { activeServer, updateMember } = useServerStore();

  const isMe = currentUser?.id === memberId;
  const member = activeServer?.members?.find(m => m.userId === memberId);
  
  // Roles Logic
  const getManageableRoles = () => {
      if (!currentUser || !activeServer || !activeServer.roles || !member) return [];
      
      const myMember = activeServer.members?.find(m => m.userId === currentUser.id);
      if (!myMember) return [];

      const isOwner = activeServer.ownerId === currentUser.id;
      const isAdmin = myMember.roles.some(r => r.permissions.includes(Permissions.ADMINISTRATOR));
      const canManageRoles = isAdmin || myMember.roles.some(r => r.permissions.includes(Permissions.MANAGE_ROLES));

      if (!isOwner && !canManageRoles) return [];

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

  const handleDM = async () => {
      try {
          const res = await api.post('/conversations', { targetUserId: memberId });
          navigate(`/channels/@me/${res.data.id}`);
          onClose();
      } catch (err) { console.error(err); }
  };

  const manageableRoles = getManageableRoles();
  const isServerContext = !!serverId && !!activeServer;

  return (
    <>
      <ContextMenuItem label="Profil" onClick={() => { /* TODO: Open Profile */ onClose(); }} />
      {!isMe && <ContextMenuItem label="Envoyer un message" onClick={handleDM} />}
      
      {isServerContext && !isMe && (
          <>
            <ContextMenuSeparator />
            {manageableRoles.length > 0 && (
                 <ContextMenuItem label="Rôles">
                     <ContextMenuLabel label="Membres" />
                     {manageableRoles.map(role => {
                         const hasRole = member?.roles.some(r => r.id === role.id);
                         return (
                             <ContextMenuItem 
                                key={role.id}
                                label={role.name}
                                onClick={() => handleRoleToggle(role.id, !!hasRole)}
                                icon={hasRole ? <div className="w-2 h-2 bg-white rounded-full"></div> : null}
                             />
                         );
                     })}
                 </ContextMenuItem>
            )}
            
            <ContextMenuSeparator />
            <ContextMenuItem label="Exclure" variant="danger" onClick={handleKick} />
            <ContextMenuItem label="Bannir" variant="danger" onClick={() => {}} />
          </>
      )}
    </>
  );
}
