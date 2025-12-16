
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
                    <p className="text-slate-400">Phase 3: Next Gen Glass</p>
                </div>
            </header>

            <div className="grid md:grid-cols-3 gap-8">
                
                {/* CONCEPT 1: The Prism */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center hover:border-cyan-500/50 transition-colors group">
                    <div className="mb-4 text-xs font-bold text-cyan-400 uppercase tracking-widest">Konzept 1</div>
                    <h2 className="text-xl font-bold mb-8">The Prism</h2>
                    
                    <div className="w-48 h-48 bg-[#0B0E14] rounded-3xl shadow-2xl shadow-cyan-900/10 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-50"></div>
                        
                        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="prismGrad" x1="0" y1="0" x2="100" y2="100">
                                    <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="white" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>
                            
                            {/* Main Body - Prism Look */}
                            <path d="M20 40 L80 40 L85 80 L15 80 L20 40 Z" fill="url(#prismGrad)" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
                            
                            {/* Top Arm - Angled */}
                            <path d="M20 35 L80 20 L85 30 L25 45 Z" fill="#22d3ee" fillOpacity="0.8" />
                            
                            {/* Play Button - Cutout style */}
                            <path d="M45 55 L60 62.5 L45 70 V55 Z" fill="white" />
                        </svg>
                    </div>

                    <p className="text-center text-slate-400 text-sm leading-relaxed mb-6">
                        Scharfe Kanten und Transparenz wie geschliffenes Glas. Der obere Arm ist ein solider Cyan-Akzent, der Rest wirkt zerbrechlich und edel.
                    </p>
                </div>

                {/* CONCEPT 2: The Continuous Line */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center hover:border-purple-500/50 transition-colors group">
                    <div className="mb-4 text-xs font-bold text-purple-400 uppercase tracking-widest">Konzept 2</div>
                    <h2 className="text-xl font-bold mb-8">The Glow Line</h2>
                    
                    <div className="w-48 h-48 bg-[#0B0E14] rounded-3xl shadow-2xl shadow-purple-900/10 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-500">
                         <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="neonStroke" x1="0" y1="0" x2="100" y2="100">
                                    <stop offset="0%" stopColor="#22d3ee" />
                                    <stop offset="100%" stopColor="#c084fc" />
                                </linearGradient>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="2" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            
                            {/* One continuous path */}
                            <path 
                                d="M25 35 L80 20 M80 20 V80 C80 82 78 84 76 84 H24 C22 84 20 82 20 80 V36.5" 
                                stroke="url(#neonStroke)" 
                                strokeWidth="8" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                filter="url(#glow)"
                            />
                            
                            <circle cx="50" cy="60" r="5" fill="white" />
                        </svg>
                    </div>

                    <p className="text-center text-slate-400 text-sm leading-relaxed mb-6">
                        Reduziert auf das absolute Minimum. Ein dicker, leuchtender Neon-Strich, der die Form andeutet. Sehr modern und passt perfekt zum Dark Mode.
                    </p>
                </div>

                {/* CONCEPT 3: Floating Panes */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center hover:border-blue-500/50 transition-colors group">
                    <div className="mb-4 text-xs font-bold text-blue-400 uppercase tracking-widest">Konzept 3</div>
                    <h2 className="text-xl font-bold mb-8">Floating Panes</h2>
                    
                    <div className="w-48 h-48 bg-[#0B0E14] rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-500">
                        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="paneGrad" x1="0" y1="0" x2="0" y2="100">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
                                </linearGradient>
                            </defs>
                            
                            {/* Bottom Pane (Body) */}
                            <rect x="20" y="40" width="60" height="40" rx="8" fill="url(#paneGrad)" />
                            
                            {/* Top Pane (Arm) - Floating above */}
                            <rect x="20" y="20" width="60" height="15" rx="4" fill="white" fillOpacity="0.9" transform="rotate(-10 50 27)" />
                            
                            {/* Detail Lines on Body */}
                            <path d="M35 40 V80" stroke="black" strokeOpacity="0.2" strokeWidth="2" />
                            <path d="M65 40 V80" stroke="black" strokeOpacity="0.2" strokeWidth="2" />
                        </svg>
                    </div>

                    <p className="text-center text-slate-400 text-sm leading-relaxed mb-6">
                        Zwei schwebende Elemente. Der Körper ist halbtransparentes, farbiges Glas, der Arm ist massives Weiß darüber. Erzeugt Tiefe und 3D-Effekt.
                    </p>
                </div>

            </div>

             <div className="mt-12 p-6 bg-slate-800 rounded-xl border border-slate-700 text-center">
                <p className="text-slate-300">
                    Na, ist "The One" dabei? Sag mir Bescheid (z.B. <strong>"Nimm Konzept 2"</strong>), und wir zementieren es!
                </p>
            </div>
        </div>
    </div>
  );
};
