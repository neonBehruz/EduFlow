import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Zap, GraduationCap, CheckCircle2 } from 'lucide-react';
import { WebGLShaderCanvas } from './WebGLShaderCanvas';

interface AnimatedEntranceProps {
  onComplete?: () => void;
}

export const AnimatedEntrance: React.FC<AnimatedEntranceProps> = ({ onComplete }) => {
  const [isRevealing, setIsRevealing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState(12);
  const [statusIndex, setStatusIndex] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const statusSteps = [
    { title: "EduFlow tizimi ishga tushirilmoqda...", desc: "Asosiy yadrolar va konfiguratsiyalar" },
    { title: "Xavfsiz ma'lumotlar bazasi ulanmoqda...", desc: "Multi-tenant shifrlangan ma'lumotlar" },
    { title: "O'quv markazi modullari tayyorlanmoqda...", desc: "Davomat, guruhlar, to'lovlar va CRM" },
    { title: "Platformaga xush kelibsiz!", desc: "EduFlow SaaS 2026 tayyor" },
  ];

  const handleFinish = () => {
    setIsRevealing(true);
    setTimeout(() => {
      setIsFinished(true);
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 450);
  };

  useEffect(() => {
    // Smooth progress counter (0 -> 100%)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const step = Math.floor(Math.random() * 14) + 10;
        const next = Math.min(100, prev + step);

        if (next >= 30 && next < 60) {
          setStatusIndex(1);
        } else if (next >= 60 && next < 90) {
          setStatusIndex(2);
        } else if (next >= 90) {
          setStatusIndex(3);
        }

        return next;
      });
    }, 90);

    // Auto-complete after ~1.8 seconds
    const timer = setTimeout(() => {
      handleFinish();
    }, 1900);

    // Keyboard shortcut to skip
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  if (isFinished) {
    return null;
  }

  const currentStatus = statusSteps[statusIndex];

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer select-none overflow-hidden transition-all duration-500 ease-out ${
        isRevealing
          ? 'opacity-0 scale-105 pointer-events-none filter blur-lg'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Hardware-accelerated Interactive WebGL Shader Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <WebGLShaderCanvas />
      </div>

      {/* Cinematic Ambient Dark Vignette */}
      <div className="absolute inset-0 z-1 pointer-events-none bg-radial from-transparent via-slate-950/40 to-slate-950/85" />

      {/* Subtle Aurora Light Orbs */}
      <div className="absolute inset-0 z-2 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute -bottom-32 right-1/4 w-[550px] h-[550px] bg-indigo-600/25 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-cyan-400/15 rounded-full blur-[160px]" />
      </div>

      {/* Central Glassmorphic Card */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-8 py-9 max-w-md w-[92%] rounded-3xl bg-slate-950/70 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-blue-950/80 animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[11px] font-bold tracking-wider uppercase mb-5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span>EduFlow SaaS Platformasi</span>
        </div>

        {/* Dynamic Holographic Medallion Logo */}
        <div className="relative mb-5 group">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 opacity-60 blur-xl animate-pulse" />
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-80" />

          <div className="relative w-22 h-22 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-white/30 flex items-center justify-center shadow-2xl overflow-hidden">
            <div className="flex flex-col items-center justify-center">
              <span className="font-black text-5xl tracking-tighter bg-gradient-to-tr from-cyan-300 via-blue-400 to-white bg-clip-text text-transparent drop-shadow-md">
                E
              </span>
            </div>

            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1.5">
          EduFlow
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm font-medium text-slate-300/80 mb-6 max-w-xs tracking-wide">
          O'quv Markazlari Ta'lim Boshqaruv Tizimi
        </p>

        {/* Progress Track */}
        <div className="w-full mb-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Yuklanmoqda</span>
            </span>
            <span className="font-mono text-cyan-300 font-bold">{progress}%</span>
          </div>

          <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/15 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0050cb] via-cyan-400 to-emerald-400 transition-all duration-150 ease-out shadow-sm shadow-cyan-400/60"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Dynamic Status Text */}
        <div className="flex flex-col items-center justify-center min-h-[42px] text-center mb-3">
          <span className="text-xs font-bold text-white transition-all duration-200">
            {currentStatus.title}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 transition-all duration-200">
            {currentStatus.desc}
          </span>
        </div>

        {/* Skip Hint / Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="group inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-cyan-300 transition-colors px-3 py-1 rounded-full border border-white/10 hover:border-cyan-400/40 bg-white/5 hover:bg-white/10 cursor-pointer mt-1"
        >
          <span>O'tkazib yuborish</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
