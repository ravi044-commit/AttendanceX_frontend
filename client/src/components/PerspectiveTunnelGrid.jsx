import React, { useEffect, useRef } from 'react';

/**
 * PerspectiveTunnelGrid
 * High-performance canvas-based 3D perspective grid & tunnel effect
 * with smooth mouse parallax, ambient gradient bloom, and reduced-motion support.
 */
export const PerspectiveTunnelGrid = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates for smooth parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    // Time offset for continuous forward grid motion
    let offset = 0;

    // Floating ambient data particles
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.6 + 0.6,
      alpha: Math.random() * 0.5 + 0.15,
      speedY: Math.random() * 0.3 + 0.1,
      speedX: (Math.random() - 0.5) * 0.15,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2,
    }));

    // Check system prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const handleMouseMove = (e) => {
      // Normalize to range [-1, 1]
      targetMouseX = (e.clientX / width - 0.5) * 2;
      targetMouseY = (e.clientY / height - 0.5) * 2;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const render = () => {
      // Lerp mouse coordinates smoothly
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      if (!prefersReducedMotion) {
        offset = (offset + 0.0035) % 1;
      }

      ctx.clearRect(0, 0, width, height);

      // Vanishing point with parallax influence
      const horizonY = height * 0.42 + mouseY * 22;
      const horizonX = width * 0.5 + mouseX * 36;

      // ─── 1. Deep Central Atmospheric Glow ──────────────────────────────
      const glowGrad = ctx.createRadialGradient(
        horizonX,
        horizonY,
        10,
        horizonX,
        horizonY,
        Math.max(width * 0.6, 400)
      );
      glowGrad.addColorStop(0, 'rgba(99, 102, 241, 0.18)');
      glowGrad.addColorStop(0.3, 'rgba(147, 51, 234, 0.09)');
      glowGrad.addColorStop(0.65, 'rgba(30, 27, 75, 0.04)');
      glowGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');

      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // ─── 2. Lower 3D Perspective Grid (Floor) ─────────────────────────
      ctx.save();
      const numPerspectiveLines = 26;
      const floorBottomSpread = width * 1.5;

      // Vertical converging perspective rays
      for (let i = 0; i <= numPerspectiveLines; i++) {
        const factor = i / numPerspectiveLines; // 0 to 1
        const bottomX = (width - floorBottomSpread) / 2 + factor * floorBottomSpread;

        const rayGrad = ctx.createLinearGradient(horizonX, horizonY, bottomX, height);
        rayGrad.addColorStop(0, 'rgba(99, 102, 241, 0)');
        rayGrad.addColorStop(0.2, 'rgba(99, 102, 241, 0.08)');
        rayGrad.addColorStop(0.7, 'rgba(129, 140, 248, 0.16)');
        rayGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(horizonX, horizonY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Horizontal depth grid rungs (hyperbolic distance)
      const numRungs = 18;
      for (let i = 1; i <= numRungs; i++) {
        const depth = (i + offset) / numRungs;
        // Non-linear distribution gives true 3D perspective
        const y = horizonY + Math.pow(depth, 2.6) * (height - horizonY);

        if (y > horizonY && y < height) {
          const depthAlpha = Math.sin(depth * Math.PI) * 0.22;
          const rungSpread = (y - horizonY) / (height - horizonY) * (floorBottomSpread / 2);
          const startX = Math.max(0, horizonX - rungSpread);
          const endX = Math.min(width, horizonX + rungSpread);

          const hGrad = ctx.createLinearGradient(startX, y, endX, y);
          hGrad.addColorStop(0, 'rgba(99, 102, 241, 0)');
          hGrad.addColorStop(0.5, `rgba(165, 180, 252, ${depthAlpha})`);
          hGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

          ctx.strokeStyle = hGrad;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();
        }
      }

      // ─── 3. Upper Subtle Grid Ceiling (Tunnel feeling) ────────────────
      const numTopLines = 16;
      const topSpread = width * 1.3;
      for (let i = 0; i <= numTopLines; i++) {
        const factor = i / numTopLines;
        const topX = (width - topSpread) / 2 + factor * topSpread;

        const topGrad = ctx.createLinearGradient(horizonX, horizonY, topX, 0);
        topGrad.addColorStop(0, 'rgba(139, 92, 246, 0)');
        topGrad.addColorStop(0.3, 'rgba(139, 92, 246, 0.05)');
        topGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

        ctx.strokeStyle = topGrad;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(horizonX, horizonY);
        ctx.lineTo(topX, 0);
        ctx.stroke();
      }

      // ─── 4. Horizon Cyber Light Beam / Glow line ──────────────────────
      const horizonLineGrad = ctx.createLinearGradient(0, horizonY, width, horizonY);
      horizonLineGrad.addColorStop(0, 'rgba(99, 102, 241, 0)');
      horizonLineGrad.addColorStop(0.3, 'rgba(129, 140, 248, 0.18)');
      horizonLineGrad.addColorStop(0.5, 'rgba(216, 180, 254, 0.35)');
      horizonLineGrad.addColorStop(0.7, 'rgba(129, 140, 248, 0.18)');
      horizonLineGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.strokeStyle = horizonLineGrad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();

      // ─── 5. Ambient Floating Particles / Stars ─────────────────────────
      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.y -= p.speedY;
          p.x += p.speedX;
          p.phase += p.pulseSpeed;

          // Wrap around edges
          if (p.y < 0) p.y = height;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
        }

        const alphaPulse = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));
        ctx.fillStyle = `rgba(199, 210, 254, ${alphaPulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      aria-hidden="true"
    />
  );
};
