
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MousePointer2, Waves, Zap, Fingerprint, ScanFace, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LogoShowcase: React.FC = () => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Track global mouse movement relative to the container
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="min-h-screen bg-[#020408] text-white p-8 relative overflow-hidden font-sans selection:bg-cyan-500/30"
    >
        
        {/* INTERACTIVE BACKGROUND: Spotlight follows mouse */}
        <div 
            className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
            style={{
                background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(34, 211, 238, 0.04), transparent 40%)`
            }}
        />

        {/* Ambient Noise Texture (Static) */}
        <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>

        <div className="max-w-7xl mx-auto relative z-10">
            <header className="flex items-center gap-6 mb-16 border-b border-white/5 pb-6">
                <button onClick={() => navigate('/')} className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all backdrop-blur-md">
                    <ArrowLeft size={20} className="text-slate-400 group-hover:-translate-x-1 transition-transform group-hover:text-white" />
                    <span className="text-sm font-mono text-slate-400 uppercase tracking-widest group-hover:text-white">Return</span>
                </button>
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Sparkles className="text-cyan-400" />
                        Design Lab <span className="text-cyan-600">.06</span>
                    </h1>
                    <p className="text-slate-500 font-mono text-xs mt-1 tracking-[0.2em] uppercase">Phase 6: Sentient Glass & Physics</p>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                
                {/* CONCEPT 1: SPOTLIGHT CARD */}
                {/* Creates a border glow effect based on mouse position */}
                <div className="group relative rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 overflow-hidden hover:bg-slate-900/60 transition-colors duration-500">
                    {/* The Spotlight Glow inside the card */}
                    <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                            background: `radial-gradient(400px circle at ${mousePos.x - (containerRef.current?.getBoundingClientRect().left || 0) - (containerRef.current?.querySelector('.concept-1')?.getBoundingClientRect()?.left || 0)}px ${mousePos.y - 300}px, rgba(34, 211, 238, 0.1), transparent 40%)`
                        }}
                    ></div>

                    <div className="concept-1 relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-cyan-900/20">
                            <MousePointer2 size={32} className="text-cyan-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Smart Light</h2>
                        <p className="text-sm text-slate-400 text-center leading-relaxed">
                            Beweg deine Maus. Das Licht folgt dir nicht nur im Hintergrund, sondern beleuchtet subtil die Ränder und Details dieser Karte. 
                        </p>
                        
                        <div className="mt-8 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 w-1/3 animate-[shimmer_2s_infinite] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONCEPT 2: LIQUID MAGMA */}
                <div className="relative group rounded-2xl overflow-hidden border border-white/5 p-8">
                    {/* Animated Liquid Background */}
                    <div className="absolute inset-0 bg-[#0B0E14]">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_10s_linear_infinite] opacity-30"
                             style={{ background: 'conic-gradient(from 0deg, transparent 0deg, #8b5cf6 120deg, transparent 180deg, #3b82f6 300deg, transparent 360deg)' }}>
                        </div>
                        <div className="absolute inset-[2px] bg-[#05070a] rounded-2xl"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center h-full justify-between">
                         <div className="mb-6 relative">
                             <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 animate-pulse"></div>
                             <Waves size={48} className="text-purple-400 relative z-10" />
                         </div>

                         <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Liquid Energy</h2>
                            <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                Kein statischer Rand. Ein lebendiger "Magma"-Strom, der sich permanent bewegt. Wirkt extrem hochwertig und futuristisch.
                            </p>
                         </div>

                         <button className="w-full py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all font-mono text-xs uppercase tracking-widest text-purple-300">
                             Activate
                         </button>
                    </div>
                </div>

                {/* CONCEPT 3: BIOMETRIC SCAN */}
                <div className="relative group rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 overflow-hidden flex flex-col items-center">
                    
                    {/* Scan Line Animation */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.8)] -translate-y-full group-hover:translate-y-[400px] transition-transform duration-1000 ease-in-out pointer-events-none"></div>

                    <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                        <div className="absolute inset-0 border border-dashed border-slate-700 rounded-full animate-[spin_20s_linear_infinite]"></div>
                        <div className="absolute inset-2 border border-slate-800 rounded-full"></div>
                        <ScanFace size={48} className="text-emerald-500/50 group-hover:text-emerald-400 transition-colors duration-300" />
                        
                        {/* Fingerprint Overlay appearing on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-50 group-hover:scale-100">
                            <Fingerprint size={64} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Biometric ID</h2>
                    <p className="text-sm text-slate-400 text-center leading-relaxed mb-6">
                        Hover mich. Ein Scanner läuft über die Karte und enthüllt einen Fingerabdruck. Interaktion, die eine Geschichte erzählt.
                    </p>

                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-mono text-emerald-500 uppercase">System Ready</span>
                    </div>
                </div>

            </div>

            <div className="mt-16 bg-slate-900/50 border border-slate-800 p-8 rounded-2xl text-center relative overflow-hidden">
                <div className="relative z-10">
                    <Zap size={32} className="mx-auto text-yellow-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Warum Phase 6?</h3>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        In modernen Apps geht es nicht mehr nur darum, wie etwas aussieht, sondern wie es sich <em>anfühlt</em>.
                        Die "Spotlight"-Technik (Maus-Tracking) wird von Branchenführern wie Vercel, Linear oder Apple genutzt, um Oberflächen Tiefe zu verleihen.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};
