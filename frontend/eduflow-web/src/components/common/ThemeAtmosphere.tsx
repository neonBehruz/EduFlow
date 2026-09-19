import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { WebGLShaderCanvas } from './WebGLShaderCanvas';

export const ThemeAtmosphere: React.FC<{ withShader?: boolean }> = ({ withShader = false }) => {
  const { isNight, isMorning } = useTheme();

  // Generate deterministic stars for night mode
  const stars = useMemo(() => {
    return Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      top: `${(i * 17) % 96}%`,
      left: `${(i * 23) % 98}%`,
      size: (i % 3) + 1.2,
      delay: `${(i * 0.4) % 4}s`,
      duration: `${2 + (i % 3)}s`,
      opacity: 0.25 + ((i % 5) * 0.15),
    }));
  }, []);

  // Floating ambient light dust / orbs for morning mode
  const morningOrbs = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      top: `${(i * 21) % 90}%`,
      left: `${(i * 29) % 92}%`,
      size: 50 + (i % 4) * 40,
      delay: `${(i * 0.8) % 6}s`,
      duration: `${10 + (i % 6) * 3}s`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* =========================================================================
          INTERACTIVE HARDWARE-ACCELERATED WEBGL GLSL SHADER BACKGROUND
          Faqat saytga kirayotganda (Auth / Login) faollashadi
          ========================================================================= */}
      {withShader && <WebGLShaderCanvas />}

      {/* =========================================================================
          NIGHT ATMOSPHERE (Cosmic Starfield & Atmospheric Glows on top of Shader)
          ========================================================================= */}
      {isNight && (
        <div className="absolute inset-0 transition-opacity duration-1000 opacity-90">
          {/* Subtle Secondary Aurora Pulses */}
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] animate-aurora-pulse-1" />
          <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[130px] animate-aurora-pulse-2" />

          {/* Twinkling Starfield */}
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white transition-opacity"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: `twinkle ${star.duration} ease-in-out infinite ${star.delay}`,
                boxShadow: star.size > 2 ? '0 0 6px rgba(255,255,255,0.8)' : 'none',
              }}
            />
          ))}

          {/* Animated Shooting Star (Meteor Streak) */}
          <div className="absolute top-12 left-1/3 w-[120px] h-[1.5px] bg-gradient-to-r from-transparent via-cyan-300 to-white rounded-full -rotate-45 animate-meteor shadow-xs shadow-cyan-300" />
          <div className="absolute top-1/2 right-1/4 w-[140px] h-[1.5px] bg-gradient-to-r from-transparent via-indigo-300 to-white rounded-full -rotate-45 animate-meteor-delay shadow-xs shadow-indigo-300" />
        </div>
      )}

      {/* =========================================================================
          MORNING ATMOSPHERE (Golden Sunrise Rays & Soft Ambient Dust)
          ========================================================================= */}
      {isMorning && (
        <div className="absolute inset-0 transition-opacity duration-1000 opacity-80">
          {/* Soft Sunrise Beams */}
          <div className="absolute -top-32 left-1/4 w-[650px] h-[650px] bg-amber-200/20 rounded-full blur-[130px] animate-sun-drift" />
          <div className="absolute -top-20 right-10 w-[500px] h-[500px] bg-sky-200/20 rounded-full blur-[120px] animate-aurora-pulse-2" />

          {/* Floating Warm Dust Orbs */}
          {morningOrbs.map((orb) => (
            <div
              key={orb.id}
              className="absolute rounded-full bg-gradient-to-tr from-amber-300/10 to-sky-300/10 blur-xl pointer-events-none"
              style={{
                top: orb.top,
                left: orb.left,
                width: `${orb.size}px`,
                height: `${orb.size}px`,
                animation: `float-orb ${orb.duration} ease-in-out infinite alternate ${orb.delay}`,
              }}
            />
          ))}

          {/* Soft decorative morning sun rays */}
          <div className="absolute -top-10 -right-20 w-[450px] h-[450px] bg-gradient-to-bl from-amber-300/15 via-orange-200/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        </div>
      )}
    </div>
  );
};
