import { useEffect, useRef } from 'react';

export default function HeartsEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Pré-rendu du coeur pour optimiser les performances
    const heartCanvas = document.createElement('canvas');
    heartCanvas.width = 50;
    heartCanvas.height = 50;
    const heartCtx = heartCanvas.getContext('2d');
    if (heartCtx) {
      heartCtx.font = '40px Arial';
      heartCtx.textAlign = 'center';
      heartCtx.textBaseline = 'middle';
      heartCtx.fillText('❤️', 25, 25);
    }

    const particles: { x: number; y: number; size: number; speed: number; wind: number; rotation: number; rotationSpeed: number }[] = [];
    const particleCount = 40; // Réduit légèrement pour garantir la fluidité

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 20 + 15, // Taille un peu plus grande
        speed: Math.random() * 2 + 1.5, // Vitesse augmentée (1.5 à 3.5)
        wind: Math.random() * 1 - 0.5,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        // Utilisation de drawImage au lieu de fillText pour les perfs
        // On dessine l'image pré-rendue avec la taille voulue
        ctx.drawImage(heartCanvas, -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      
      update();
      requestAnimationFrame(draw);
    };

    const update = () => {
      particles.forEach(p => {
        p.y += p.speed;
        p.x += p.wind;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 50) {
          p.y = -50;
          p.x = Math.random() * width;
        }
        if (p.x > width + 50) p.x = -50;
        if (p.x < -50) p.x = width + 50;
      });
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    const animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ opacity: 0.8 }}
    />
  );
}
