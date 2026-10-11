import React, { useEffect, useRef, useState } from 'react';

/**
 * PALETTE Configuration
 * Theme-aware colors for the subtle futuristic grid and glowing data dots.
 */
export const PALETTE = {
  dark: {
    gridLine: 'rgba(99, 102, 241, 0.12)',
    gridHighlight: 'rgba(129, 140, 248, 0.24)',
    dot: 'rgba(199, 210, 254, 0.75)',
    dotGlow: 'rgba(99, 102, 241, 0.45)',
    gradientCenter: 'rgba(99, 102, 241, 0.16)',
    gradientOuter: 'rgba(3, 7, 18, 0)',
  },
  light: {
    gridLine: 'rgba(99, 102, 241, 0.11)',
    gridHighlight: 'rgba(79, 70, 229, 0.20)',
    dot: 'rgba(79, 70, 229, 0.70)',
    dotGlow: 'rgba(99, 102, 241, 0.35)',
    gradientCenter: 'rgba(99, 102, 241, 0.10)',
    gradientOuter: 'rgba(248, 250, 252, 0)',
  },
};

/**
 * AnimatedGrid
 * Subtle futuristic canvas background for the landing page.
 * - Horizontal lines moving downward smoothly.
 * - Small glowing dots rising upward and fading out as they approach the top.
 * - Responsive, theme-aware via PALETTE, respects prefers-reduced-motion.
 */
export const AnimatedGrid = ({ intensity = 0.8, theme: propTheme }) => {
  const canvasRef = useRef(null);
  const [activeTheme, setActiveTheme] = useState(() => {
    if (propTheme) return propTheme;
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    }
    return 'dark';
  });

  // Synchronize with propTheme or document data-theme attribute
  useEffect(() => {
    if (propTheme) {
      setActiveTheme(propTheme);
      return;
    }
    if (typeof document === 'undefined') return;

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      setActiveTheme(current);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, [propTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Accessibility check: prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Grid sizing and animation properties
    const gridSize = 52; // Cell spacing
    let offsetY = 0; // Moves downward
    const speed = prefersReducedMotion ? 0 : 0.4; // Downward rate

    // Glowing dots rising upward
    const dotCount = Math.min(Math.floor((width * height) / 36000), 34);
    const dots = Array.from({ length: dotCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.6 + 0.9,
      alpha: Math.random() * 0.55 + 0.25,
      speedY: Math.random() * 0.45 + 0.2, // Upward rate
      speedX: (Math.random() - 0.5) * 0.12,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));

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

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const colors = PALETTE[activeTheme] || PALETTE.dark;

      // 1. Subtle central ambient atmospheric glow
      const radial = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        20,
        width * 0.5,
        height * 0.35,
        Math.max(width * 0.65, 450)
      );
      radial.addColorStop(0, colors.gradientCenter);
      radial.addColorStop(1, colors.gradientOuter);
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      // 2. Futuristic Grid:
      // Vertical static grid column lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.gridLine;
      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      // Horizontal grid lines moving downward smoothly
      if (!prefersReducedMotion) {
        offsetY = (offsetY + speed) % gridSize;
      }
      ctx.beginPath();
      for (let y = -gridSize + offsetY; y <= height + gridSize; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Dynamic subtle accent scan line
      ctx.strokeStyle = colors.gridHighlight;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const pulseY = (offsetY * 3.2) % height;
      ctx.moveTo(0, pulseY);
      ctx.lineTo(width, pulseY);
      ctx.stroke();

      // 3. Small glowing dots rising upward and fading out
      dots.forEach((dot) => {
        if (!prefersReducedMotion) {
          dot.y -= dot.speedY; // Rising upward
          dot.x += dot.speedX;
          dot.pulse += dot.pulseSpeed;

          // Recycle dot when it rises beyond top
          if (dot.y < -15) {
            dot.y = height + Math.random() * 20;
            dot.x = Math.random() * width;
          }
          if (dot.x < 0) dot.x = width;
          if (dot.x > width) dot.x = 0;
        }

        // Fades out gracefully as it reaches the upper viewport
        const topFade = Math.min(1, Math.max(0, dot.y / (height * 0.4)));
        const pulseFactor = 0.7 + 0.3 * Math.sin(dot.pulse);
        const currentAlpha = dot.alpha * topFade * pulseFactor;

        if (currentAlpha > 0.01) {
          // Soft outer glow halo
          ctx.fillStyle = colors.dotGlow;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.size * 2.4, 0, Math.PI * 2);
          ctx.fill();

          // Focused dot core
          ctx.fillStyle = colors.dot;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: intensity }}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
};
