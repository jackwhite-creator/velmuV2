import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { useServerStore } from '../../../store/serverStore';
import { Permissions } from '@backend/shared/permissions';
import api from '../../../lib/api';

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  position: number;
}

interface Props {
  serverId: string;
}

export default function ServerRoles({ serverId }: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Loading & Error states could be added here

  useEffect(() => {
    loadRoles();
  }, [serverId]);

  const loadRoles = async () => {
    try {
      const res = await api.get(`/servers/${serverId}/roles`);
      // Sort roles by position DESC (highest at top) for UI
      const sortedRoles = res.data.sort((a: Role, b: Role) => b.position - a.position);
      setRoles(sortedRoles);

      if (sortedRoles.length > 0 && !selectedRoleId) {
        setSelectedRoleId(sortedRoles[0].id);
      setRoles(res.data);
      if (res.data.length > 0 && !selectedRoleId) {
        setSelectedRoleId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load roles", err);
    }
  };

  const handleCreateRole = async () => {
    try {
      const res = await api.post(`/servers/${serverId}/roles`);
      const newRole = res.data;
      // Add new role after the top one (if admin) or just at top
      // Typically new roles appear above @everyone but below others.
      // For simplicity, we refresh list which will sort by position
      loadRoles();
      setRoles([newRole, ...roles]);
      setSelectedRoleId(newRole.id);
    } catch (err) {
      console.error("Failed to create role", err);
    }
  };

  const handleUpdateRole = async (roleId: string, updates: Partial<Role>) => {
    setRoles(roles.map(r => r.id === roleId ? { ...r, ...updates } : r));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!selectedRoleId) return;
    const role = roles.find(r => r.id === selectedRoleId);
    if (!role) return;

    try {
      await api.put(`/servers/${serverId}/roles/${selectedRoleId}`, {
        name: role.name,
        color: role.color,
        permissions: role.permissions,
        position: role.position
      });
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to save role", err);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
      if (!confirm("Voulez-vous vraiment supprimer ce rôle ?")) return;
      try {
          await api.delete(`/servers/${serverId}/roles/${roleId}`);
          const newRoles = roles.filter(r => r.id !== roleId);
          setRoles(newRoles);
          if (selectedRoleId === roleId) setSelectedRoleId(newRoles[0]?.id || null);
      } catch (err) {
          console.error("Failed to delete role", err);
      }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(roles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRoles(items);

    // Calculate new positions based on UI order
    // UI: Index 0 is Top.
    // DB: Position N is Top.
    // So if we have N items:
    // Index 0 -> Position N
    // Index 1 -> Position N-1
    // ...
    // Index N -> Position 0 (@everyone)

    // Actually we keep @everyone at bottom always in logic usually, but here dragging allowed above?
    // Let's protect @everyone from being moved ideally, but dnd-kit can handle it.
    // For now, simple logic:

    const total = items.length;
    const updates = items.map((role, index) => ({
        id: role.id,
        position: total - 1 - index // Descending order
    // Update positions locally based on index (higher index = lower priority in array, but UI might show reverse)
    // Actually Discord roles: Top is highest priority.
    // Let's assume list is sorted desc by position.

    // Simplification: We just send the new order to backend
    setRoles(items);

    // Calculate new positions
    // We want the first item in the list to have the highest position
    const updates = items.map((role, index) => ({
        id: role.id,
        position: items.length - index - 1 // 0 is @everyone at bottom
    }));

    try {
        await api.put(`/servers/${serverId}/roles/positions`, { roles: updates });
    } catch (err) {
        console.error("Failed to reorder", err);
        loadRoles(); // Revert on error
        loadRoles(); // Refresh to be sure
    } catch (err) {
        console.error("Failed to reorder", err);
    }
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="flex h-full text-zinc-300">
      {/* Sidebar List */}
      <div className="w-60 bg-[#2b2d31] flex flex-col">
        <div className="p-4 border-b border-[#1f2023]">
          <h2 className="text-xs font-bold uppercase text-zinc-400 mb-2">Rôles</h2>
          <button
            onClick={handleCreateRole}
            className="flex items-center text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            <Plus className="w-4 h-4 mr-1" /> Créer un rôle
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="roles-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {roles.map((role, index) => (
                    <Draggable key={role.id} draggableId={role.id} index={index} isDragDisabled={role.name === '@everyone'}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          onClick={() => {
                              if (hasChanges && !confirm("Annuler les modifications non sauvegardées ?")) return;
                              setHasChanges(false);
                              setSelectedRoleId(role.id);
                          }}
                          className={`
                            group flex items-center px-2 py-1.5 rounded cursor-pointer text-sm mb-1
                            ${selectedRoleId === role.id ? 'bg-[#404249] text-white' : 'hover:bg-[#35373c]'}
                            ${snapshot.isDragging ? 'bg-[#404249] shadow-lg opacity-90' : ''}
                          `}
                        >
                          <div {...provided.dragHandleProps} className={`mr-2 ${role.name === '@everyone' ? 'invisible' : 'text-zinc-500 cursor-grab active:cursor-grabbing'}`}>
                             <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: role.color }}></div>
                          <span className="truncate flex-1 font-medium">{role.name}</span>
                            group flex items-center px-2 py-1.5 rounded cursor-pointer text-sm
                            ${selectedRoleId === role.id ? 'bg-[#404249] text-white' : 'hover:bg-[#35373c]'}
                          `}
                        >
                          <div {...provided.dragHandleProps} className={`mr-2 ${role.name === '@everyone' ? 'invisible' : 'text-zinc-500'}`}>
                             <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: role.color }}></div>
                          <span className="truncate flex-1">{role.name}</span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#313338] p-8 overflow-y-auto custom-scrollbar">
      <div className="flex-1 bg-[#313338] p-8 overflow-y-auto">
        {selectedRole ? (
          <div className="max-w-2xl space-y-8">
            <h2 className="text-xl font-bold text-white mb-6">Modifier le rôle - {selectedRole.name}</h2>

            {/* Display Settings */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold uppercase text-zinc-400">Affichage</h3>

               <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-400">NOM DU RÔLE</label>
                   <input
                      type="text"
                      value={selectedRole.name}
                      disabled={selectedRole.name === '@everyone'}
                      onChange={(e) => handleUpdateRole(selectedRole.id, { name: e.target.value })}
                      className="w-full bg-[#1e1f22] border-none rounded p-2 text-white focus:ring-0"
                   />
               </div>

               <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-400">COULEUR DU RÔLE</label>
                   <div className="flex gap-2">
                       <input
                          type="color"
                          value={selectedRole.color}
                          onChange={(e) => handleUpdateRole(selectedRole.id, { color: e.target.value })}
                          className="h-10 w-16 bg-transparent cursor-pointer rounded overflow-hidden"
                          className="h-10 w-16 bg-transparent cursor-pointer"
                       />
                       <div className="flex-1 bg-[#1e1f22] rounded p-2 text-zinc-400 text-sm flex items-center">
                           {selectedRole.color}
                       </div>
                   </div>
               </div>
            </div>

            <div className="h-px bg-[#3f4147] my-8" />

            {/* Permissions */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold uppercase text-zinc-400">Permissions Générales</h3>

               {Object.values(Permissions).map((perm) => {
                   const isEnabled = selectedRole.permissions.includes(perm);
                   const isCritical = perm === Permissions.ADMINISTRATOR;

                   return (
                       <div key={perm} className="flex items-center justify-between py-2 border-b border-[#3f4147] last:border-0 hover:bg-[#3f4147]/30 px-2 rounded">
                       <div key={perm} className="flex items-center justify-between py-2 border-b border-[#3f4147] last:border-0">
                           <div>
                               <div className={`font-medium ${isCritical ? 'text-red-400' : 'text-zinc-200'}`}>
                                   {perm.replace(/_/g, ' ')}
                               </div>
                               <div className="text-xs text-zinc-500">
                                   {isCritical ? "Accès complet au serveur. Dangereux." : "Autorise l'utilisateur à effectuer cette action."}
                               </div>
                           </div>

                           <button
                             onClick={() => {
                                 const newPerms = isEnabled
                                    ? selectedRole.permissions.filter(p => p !== perm)
                                    : [...selectedRole.permissions, perm];
                                 handleUpdateRole(selectedRole.id, { permissions: newPerms });
                             }}
                             className={`
                                w-10 h-6 rounded-full transition-colors relative
                                ${isEnabled ? 'bg-green-500' : 'bg-zinc-500'}
                             `}
                           >
                               <div className={`
                                  absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform
                                  ${isEnabled ? 'translate-x-4' : 'translate-x-0'}
                               `}/>
                           </button>
                       </div>
                   );
               })}
            </div>

            <div className="h-8" />

            {selectedRole.name !== '@everyone' && (
                <button
                    onClick={() => handleDeleteRole(selectedRole.id)}
                    className="text-red-400 text-xs hover:underline flex items-center"
                >
                    <Trash2 className="w-3 h-3 mr-1" /> Supprimer ce rôle
                </button>
            )}

            {/* Save Bar */}
            {hasChanges && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#111214] px-4 py-3 rounded flex items-center gap-8 shadow-xl animate-bounce-in z-50">
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#111214] px-4 py-3 rounded flex items-center gap-8 shadow-xl animate-bounce-in">
                    <span className="text-white font-medium">Attention - Vous avez des changements non enregistrés !</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setHasChanges(false);
                                loadRoles(); // Reset
                            }}
                            className="text-white hover:underline px-4 text-sm"
                        >
                            Réinitialiser
                        </button>
                        <button
                            onClick={saveChanges}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-1.5 rounded text-sm font-medium transition"
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>
            )}

          </div>
        ) : (
           <div className="flex flex-col items-center justify-center h-full text-zinc-500">
               <p>Sélectionnez un rôle pour le modifier</p>
           </div>
        )}
      </div>
    </div>
  );
}
