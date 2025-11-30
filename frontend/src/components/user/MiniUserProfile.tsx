import { useEffect, useState } from 'react';
import { useServerStore } from '../../store/serverStore';
import api from '../../lib/api';
import Badge from '../ui/Badge';

interface MiniUserProfileProps {
  userId: string;
  serverId?: string;
  anchorRect: { top: number; left: number; width: number; height: number };
  source: 'chat' | 'member_list';
  onClose: () => void;
  onOpenFullProfile: (userId: string) => void;
}

interface UserData {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl?: string;
  bio?: string;
  banner?: string;
  bannerUrl?: string;
}

interface MemberData {
  id: string;
  nickname?: string;
  roleIds: string[];
}

export default function MiniUserProfile({ userId, serverId, anchorRect, source, onClose, onOpenFullProfile }: MiniUserProfileProps) {
  const { activeServer, onlineUsers } = useServerStore();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate popover position
  const getPopoverStyle = () => {
    const MODAL_WIDTH = 340;
    const GAP = 12; // Space between avatar and modal
    const PADDING = 10; // Minimum distance from screen edges

    let left = 0;
    let top = anchorRect.top;

    // Horizontal Positioning
    if (source === 'chat') {
      // Place to the right
      left = anchorRect.left + anchorRect.width + GAP;
    } else {
      // Place to the left (Member List)
      left = anchorRect.left - MODAL_WIDTH - GAP;
    }

    // Vertical Collision Detection
    const ESTIMATED_HEIGHT = 350;
    if (top + ESTIMATED_HEIGHT > window.innerHeight) {
      top = window.innerHeight - ESTIMATED_HEIGHT - PADDING;
    }
    // Ensure it doesn't go off top
    if (top < PADDING) top = PADDING;

    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
    };
  };

  const popoverStyle = getPopoverStyle();

  // Animation class based on source
  const animationClass = source === 'chat' 
    ? 'animate-in slide-in-from-left-4 fade-in duration-200' 
    : 'animate-in slide-in-from-right-4 fade-in duration-200';

  // Get user roles in the server
  const userRoles = memberData && serverId && activeServer?.roles
    ? activeServer.roles.filter(role => memberData.roleIds.includes(role.id))
        .sort((a, b) => b.position - a.position)
    : [];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const [userRes, badgesRes] = await Promise.all([
            api.get(`/users/${userId}`),
            api.get(`/badges/users/${userId}`)
        ]);
        setUserData(userRes.data);
        setBadges(badgesRes.data);

        if (serverId && activeServer) {
          const member = activeServer.members?.find(m => m.userId === userId);
          if (member) {
            setMemberData(member as unknown as MemberData);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId, serverId, activeServer]);

  if (loading) return null;
  if (!userData) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Transparent backdrop to catch clicks */}
      <div className="absolute inset-0 bg-transparent" />
      
      <div 
        style={popoverStyle}
        className={`bg-background-floating rounded-lg w-[340px] shadow-2xl overflow-hidden ${animationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="h-[100px] w-full relative bg-background-tertiary">
          {userData.banner || userData.bannerUrl ? (
            <img 
              src={userData.banner || userData.bannerUrl} 
              alt="Banner" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-background-tertiary to-background-secondary"></div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-4 relative">
          {/* Avatar - Clickable with hover effect */}
          <div className="absolute -top-12 left-4">
            <button
              onClick={() => {
                onOpenFullProfile(userId);
                onClose();
              }}
              className="group relative w-20 h-20 rounded-full border-[6px] border-background-floating bg-background-secondary overflow-hidden cursor-pointer transition-transform active:scale-95"
            >
              {userData.avatarUrl ? (
                <img src={userData.avatarUrl} alt={userData.username} className="w-full h-full object-cover" />
              ) : (
                <img src="/default_avatar.png" alt={userData.username} className="w-full h-full object-cover" />
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                 <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 uppercase tracking-wide drop-shadow-md">
                   Voir Profil
                 </span>
              </div>
            </button>
            
            {/* Online Status Indicator */}
            <div 
              className={`absolute bottom-1 right-1 w-5 h-5 border-[4px] border-background-tertiary rounded-full ${
                onlineUsers.has(userId) ? 'bg-status-green' : 'bg-text-muted'
              }`} 
              title={onlineUsers.has(userId) ? 'En ligne' : 'Hors ligne'}
            />
          </div>

          {/* Spacer for avatar */}
          <div className="h-10" />

          {/* User Info & Bio */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-text-header flex items-baseline gap-1">
                {userData.username}
                <span className="text-text-muted text-sm font-normal">#{userData.discriminator}</span>
                </h2>

                {/* Badges */}
                {badges && badges.length > 0 && (
                    <div className="flex items-center gap-2">
                        {badges.map(badge => (
                            <Badge 
                                key={badge.id} 
                                name={badge.name} 
                                iconUrl={badge.iconUrl} 
                                size="sm"
                            />
                        ))}
                    </div>
                )}
            </div>
            
            {memberData?.nickname && (
              <p className="text-xs text-text-muted mt-0.5">
                alias <span className="text-text-normal">{memberData.nickname}</span>
              </p>
            )}

            {/* Bio moved here */}
            {userData.bio && (
              <div className="mt-3">
                <p className="text-xs font-bold text-text-muted uppercase mb-1 tracking-wide text-[10px]">À Propos</p>
                <div className="text-sm text-text-normal leading-snug whitespace-pre-wrap">
                  {userData.bio}
                </div>
              </div>
            )}
          </div>

          {/* Roles */}
          {userRoles.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-bold text-text-muted uppercase mb-2 tracking-wide">Rôles ({userRoles.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {userRoles.map(role => (
                  <div
                    key={role.id}
                    className="px-1.5 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: `${role.color}15`,
                      color: role.color,
                      border: `1px solid ${role.color}30`
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shadow-[0_0_4px_currentColor]"
                      style={{ backgroundColor: role.color }}
                    />
                    {role.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
