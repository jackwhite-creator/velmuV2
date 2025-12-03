import React, { useEffect } from 'react';
import { useMediaDeviceSelect } from '@livekit/components-react';
import { Check } from 'lucide-react';

interface DeviceSelectorProps {
  kind: MediaDeviceKind;
  onSelect?: (deviceId: string) => void;
  onClose: () => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({ kind, onSelect, onClose }) => {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });

  const handleSelect = async (deviceId: string) => {
    await setActiveMediaDevice(deviceId);
    if (onSelect) onSelect(deviceId);
    onClose();
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.device-selector-popover') && !target.closest('.device-selector-trigger')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="device-selector-popover absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-background-floating border border-background-tertiary rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
        <div className="px-3 py-2 text-xs font-bold text-text-muted uppercase tracking-wider">
          {kind === 'audioinput' ? 'Microphone' : 
           kind === 'audiooutput' ? 'Sortie Audio' : 
           kind === 'videoinput' ? 'Caméra' : 'Périphérique'}
        </div>
        
        {devices.map((device) => (
          <button
            key={device.deviceId}
            onClick={() => handleSelect(device.deviceId)}
            className={`
              w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition-colors
              ${device.deviceId === activeDeviceId 
                ? 'bg-primary/10 text-primary' 
                : 'text-text-normal hover:bg-background-modifier-hover'
              }
            `}
          >
            <span className="truncate flex-1 mr-2">{device.label || `Device ${device.deviceId.slice(0, 5)}...`}</span>
            {device.deviceId === activeDeviceId && (
              <Check size={16} className="text-primary flex-shrink-0" />
            )}
          </button>
        ))}

        {devices.length === 0 && (
          <div className="px-3 py-4 text-center text-text-muted text-sm italic">
            Aucun périphérique détecté
          </div>
        )}
      </div>
    </div>
  );
};
