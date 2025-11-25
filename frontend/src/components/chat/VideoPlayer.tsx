import React, { useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';

interface Props {
  peer: SimplePeer.Instance;
  username: string;
} 

export default function VideoPlayer({ peer, username }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
  }, [peer]);

  return (
    <div className="relative bg-[#1e1f22] rounded-md overflow-hidden aspect-video shadow-md border border-[#2b2d31]">
      <video 
        playsInline 
        autoPlay 
        ref={ref} 
        className="w-full h-full object-cover transform scale-x-[-1]" 
      />
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white backdrop-blur-sm select-none">
        {username}
      </div>
    </div>
  );
}