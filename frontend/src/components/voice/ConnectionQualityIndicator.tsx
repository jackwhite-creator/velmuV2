import React from 'react';
import { useConnectionQualityIndicator } from '@livekit/components-react';
import { ConnectionQuality } from 'livekit-client';
import Tooltip from '../ui/Tooltip';

interface ConnectionQualityIndicatorProps {
  participant?: any;
}

export const ConnectionQualityIndicator: React.FC<ConnectionQualityIndicatorProps> = ({ participant }) => {
  const { quality } = useConnectionQualityIndicator({ participant });

  // Map quality to number of active bars (0-4)
  let activeBars = 0;
  let color = 'bg-text-muted';
  let text = 'Connexion inconnue';

  switch (quality) {
    case ConnectionQuality.Excellent:
      activeBars = 4;
      color = 'bg-status-green';
      text = 'Connexion excellente';
      break;
    case ConnectionQuality.Good:
      activeBars = 3;
      color = 'bg-status-green';
      text = 'Bonne connexion';
      break;
    case ConnectionQuality.Poor:
      activeBars = 2;
      color = 'bg-status-warning';
      text = 'Mauvaise connexion';
      break;
    case ConnectionQuality.Lost:
      activeBars = 0;
      color = 'bg-status-danger';
      text = 'Connexion perdue';
      break;
    default:
      activeBars = 0;
      color = 'bg-text-muted';
      text = 'Connexion inconnue';
      break;
  }

  return (
    <Tooltip text={text} side="top">
      <div className="flex items-end gap-0.5 h-4 w-auto">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-sm transition-all duration-300 ${
              bar <= activeBars ? color : 'bg-background-tertiary'
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
    </Tooltip>
  );
};
