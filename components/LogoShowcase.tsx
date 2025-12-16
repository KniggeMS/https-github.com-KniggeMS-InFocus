
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LogoShowcase: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-8 relative overflow-hidden">
        {/* Background FX */}
        <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
            <header className="flex items-center gap-4 mb-12">
                <button onClick={() => navigate('/')} className="p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold">Design Lab</h1>
                    <p className="text-slate-400">Phase 2: Modern Glass Clapperboard</p>
                </div>
            </header>

            <div className="grid md:grid-cols-3 gap-8">
                
                {/* CONCEPT 1: The Glass Slate */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center hover:border-cyan-500/50 transition-colors group">
                    <div className="mb-4 text-xs font-bold text-cyan-400 uppercase tracking-widest">Konzept 1</div>
                    <h2 className="text-xl font-bold mb-8">The Glass Slate</h2>
                    
                    <div className="w-48 h-48 bg-[#0B0E14] rounded-3xl shadow-2xl shadow-cyan-900/10 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
                        {/* Background Glow inside icon */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 opacity-50 blur-xl"></div>
                        
                        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                            {/* Base Body - Glassy */}
                            <rect x="15" y="40" width="70" height="45" rx="6" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.3" strokeWidth="2" />
                            
                            {/* Clapper Top - Angled & Solid */}
                            <path d="M15 32 L85 32 L85 15 L15 15 Z" fill="url(#gradSlate)" />
                            <path d="M25 15 L15 32 M45 15 L35 32 M65 15 L55 32" stroke="#0B0E14" strokeWidth="3" />
                            
                            {/* Play Symbol on Glass */}
                            <path d="M45 55 L60 62.5 L45 70 V55 Z" fill="white" fillOpacity="0.9" />

                            <defs>
                                <linearGradient id="gradSlate" x1="0" y1="0" x2="100" y2="0">
                                    <stop offset="0%" stopColor="#22d3ee" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <p className="text-center text-slate-400 text-sm leading-relaxed mb-6">
                        Klassische Form, aber aus "Glas". Der untere Teil ist transparent (Glassmorphism), der obere Teil ein kräftiger Gradient-Akzent.
                    </p>
                </div>

                {/* CONCEPT 2: The Neon Outline */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center hover:border-purple-500/50 transition-colors group">
                    <div className="mb-4 text-xs font-bold text-purple-400 uppercase tracking-widest">Konzept 2</div>
                    <h2 className="text-xl font-bold mb-8">The Neon Edge</h2>
                    
                    <div className="w-48 h-48 bg-[#0B0E14] rounded-3xl shadow-2xl shadow-purple-900/10 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-500">
                         <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="gradNeon" x1="0" y1="0" x2="100" y2="100">
                                    <stop offset="0%" stopColor="#22d3ee" />
                                    <stop offset="50%" stopColor="#c084fc" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                            
                            {/* Outline with Gradient */}
                            <path d="M20 40 H80 V80 C80 82.2 78.2 84 76 84 H24 C21.8 84 20 82.2 20 80 V40 Z" stroke="url(#gradNeon)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                            
                            {/* Clapper Top - Open */}
                            <path d="M20 30 L80 18" stroke="url(#gradNeon)" strokeWidth="6" strokeLinecap="round" />
                            
                            {/* Detail Dots */}
                            <circle cx="50" cy="62" r="4" fill="white" fillOpacity="0.8" />
                            <circle cx="35" cy="62" r="2" fill="white" fillOpacity="0.4" />
                            <circle cx="65" cy="62" r="2" fill="white" fillOpacity="0.4" />
                        </svg>
                    </div>

                    <p className="text-center text-slate-400 text-sm leading-relaxed mb-6">
                        Minimalistisch und futuristisch. Die Form wird nur durch einen leuchtenden Neon-Verlauf angedeutet. Passt perfekt zum Dark Mode.
                    </p>
                </div>

                {/* CONCEPT 3: The Modern Solid */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center hover:border-blue-500/50 transition-colors group">
                    <div className="mb-4 text-xs font-bold text-blue-400 uppercase tracking-widest">Konzept 3</div>
                    <h2 className="text-xl font-bold mb-8">The Modern Solid</h2>
                    
                    <div className="w-48 h-48 bg-[#0B0E14] rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-500">
                        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="gradSolid" x1="10" y1="10" x2="90" y2="90">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>
                            
                            {/* Main Body - Solid Gradient */}
                            <rect x="20" y="20" width="60" height="60" rx="12" fill="url(#gradSolid)" />
                            
                            {/* Cutout Lines for Clapper look */}
                            <path d="M20 40 H80" stroke="#0B0E14" strokeWidth="4" />
                            <path d="M35 20 V40" stroke="#0B0E14" strokeWidth="4" />
                            <path d="M65 20 V40" stroke="#0B0E14" strokeWidth="4" />
                            
                            {/* Play Triangle overlay */}
                            <path d="M45 55 L60 62.5 L45 70 V55 Z" fill="#0B0E14" />
                            
                            {/* Small decorative circle */}
                            <circle cx="70" cy="70" r="3" fill="white" fillOpacity="0.5" />
                        </svg>
                    </div>

                    <p className="text-center text-slate-400 text-sm leading-relaxed mb-6">
                        Flach, fett und modern. Das App-Icon als Ganzes IST die Filmklappe. Hoher Wiedererkennungswert, sehr sauber.
                    </p>
                </div>

            </div>

             <div className="mt-12 p-6 bg-slate-800 rounded-xl border border-slate-700 text-center">
                <p className="text-slate-300">
                    Besser? Diese Varianten basieren alle auf der <strong>Filmklappe</strong>, nutzen aber Glas, Neon und moderne Geometrie.
                </p>
            </div>
        </div>
    </div>
  );
};
