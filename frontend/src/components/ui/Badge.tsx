import Tooltip from './Tooltip';

interface BadgeProps {
  name: string;
  iconUrl: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Badge({ name, iconUrl, size = 'md' }: BadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Tooltip text={name} side="top">
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
