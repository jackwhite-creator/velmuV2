import Tooltip from './Tooltip';

interface BadgeProps {
  name: string;
  iconUrl: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Badge({ name, iconUrl, description, size = 'md' }: BadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-auto',
    md: 'h-[22px] w-auto',
    lg: 'h-8 w-auto'
  };

  // Rendu standard pour tous les badges (y compris BOT)
  return (
    <Tooltip text={description || name} side="top">
      <div className="flex items-center justify-center cursor-pointer">
        <img 
          src={iconUrl} 
          alt={name} 
          className={`${sizeClasses[size]} object-contain`}
        />
      </div>
    </Tooltip>
  );
}
