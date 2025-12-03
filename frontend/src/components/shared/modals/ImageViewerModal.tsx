import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';

interface Props {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageViewerModal({ imageUrl, onClose }: Props) {
  // Motion values for performant updates
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  
  // State for UI display
  const [scaleDisplay, setScaleDisplay] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset when image changes
  useEffect(() => {
    x.set(0);
    y.set(0);
    scale.set(1);
    setScaleDisplay(100);
  }, [imageUrl, x, y, scale]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Update scale display when motion value changes
  useEffect(() => {
    const unsubscribe = scale.on("change", (latest) => {
      setScaleDisplay(Math.round(latest * 100));
    });
    return unsubscribe;
  }, [scale]);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const currentScale = scale.get();
    // Determine zoom direction and factor
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.1 : 0.9;
    
    let newScale = currentScale * factor;
    // Clamp scale (0.2x to 5x)
    newScale = Math.min(Math.max(0.2, newScale), 5);

    // Calculate cursor position relative to the center of the container
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Mouse position relative to center
      const mouseX = e.clientX - rect.left - centerX;
      const mouseY = e.clientY - rect.top - centerY;

      // Adjust position to zoom towards cursor
      const currentX = x.get();
      const currentY = y.get();

      const moveX = (mouseX - currentX) * (factor - 1);
      const moveY = (mouseY - currentY) * (factor - 1);

      if (delta > 0) {
          x.set(currentX - moveX);
          y.set(currentY - moveY);
      } else {
          x.set(currentX - (mouseX - currentX) * (factor - 1));
          y.set(currentY - (mouseY - currentY) * (factor - 1));
      }
    }

    scale.set(newScale);
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = imageUrl.split('/').pop() || 'image-velmu.png';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur téléchargement", error);
      window.open(imageUrl, '_blank');
    }
  };

  const zoomIn = () => {
    const newScale = Math.min(5, scale.get() + 0.5);
    scale.set(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(0.2, scale.get() - 0.5);
    scale.set(newScale);
  };

  const resetZoom = () => {
    scale.set(1);
    x.set(0);
    y.set(0);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {imageUrl && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-hidden"
          onClick={onClose}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-3 text-text-muted hover:text-white bg-black/40 hover:bg-brand rounded-full transition z-50 backdrop-blur-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <motion.div 
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onWheel={handleWheel}
          >
            <motion.img 
              src={imageUrl} 
              alt="Full size" 
              className="max-w-none object-contain shadow-2xl"
              style={{ 
                x, 
                y, 
                scale,
                cursor: 'grab',
                maxHeight: '100vh',
                maxWidth: '100vw'
              }}
              drag
              dragConstraints={{ left: -2000, right: 2000, top: -2000, bottom: 2000 }}
              dragElastic={0.1}
              dragMomentum={false}
              onClick={(e) => e.stopPropagation()}
              whileTap={{ cursor: 'grabbing' }}
            />

            {/* Toolbar - Static, Solid, Punchy */}
            <div 
                className="absolute bottom-8 flex items-center gap-2 bg-background-tertiary border border-white/5 p-2 px-4 rounded-[8px] shadow-2xl z-50"
                onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => window.open(imageUrl, '_blank')} 
                className="p-2 hover:bg-background-modifier-selected rounded-[4px] text-text-normal transition text-[10px] font-bold uppercase tracking-wide" 
                title="Ouvrir l'original"
              >
                Ouvrir l'original
              </button>
              
              <div className="w-px h-4 bg-white/10 mx-2"></div>
              
              <button onClick={zoomOut} className="p-2 hover:bg-background-modifier-selected rounded-[4px] text-text-normal transition" title="Dézoomer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
              
              <button 
                onClick={resetZoom}
                className="text-[10px] font-bold font-mono w-12 text-center select-none text-text-muted hover:text-text-normal cursor-pointer transition"
                title="Réinitialiser"
              >
                {scaleDisplay}%
              </button>
              
              <button onClick={zoomIn} className="p-2 hover:bg-background-modifier-selected rounded-[4px] text-text-normal transition" title="Zoomer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
              
              <div className="w-px h-4 bg-white/10 mx-2"></div>
              
              <button onClick={handleDownload} className="p-2 hover:bg-background-modifier-selected rounded-[4px] text-text-normal transition" title="Télécharger">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}