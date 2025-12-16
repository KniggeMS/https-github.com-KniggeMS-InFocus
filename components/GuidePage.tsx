
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Camera, Sparkles, BrainCircuit, 
  Share2, Trophy, List, Key, Shield, Smartphone, 
  MessageCircle, Layers, Star, Lock, Download, Filter, FileText,
  PlusSquare, Share
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface GuidePageProps {
    onBack?: () => void; // Optional prop to override navigation behavior (for AuthPage overlay)
}

export const GuidePage: React.FC<GuidePageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const handleBack = () => {
      if (onBack) {
          onBack();
      } else {
          navigate(-1);
      }
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    ...(isAdmin ? [{ id: 'start', label: 'Erste Schritte', icon: Key }] : []),
    { id: 'install', label: 'App Installation', icon: Smartphone },
    { id: 'search', label: 'Suchen & Filter', icon: Search },
    { id: 'import', label: 'Smart Import', icon: Download },
    { id: 'ai', label: 'AI Power Features', icon: Sparkles },
    { id: 'lists', label: 'Listen & Reviews', icon: List },
    { id: 'gamification', label: 'Level & Trophäen', icon: Trophy },
    { id: 'security', label: 'Sicherheit', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 relative overflow-x-hidden animate-in fade-in duration-300">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <header className="py-8 flex items-center gap-4">
          <button onClick={handleBack} className="p-2 rounded-full bg-slate-800/50 border border-slate-700 hover:bg-slate-700 transition-colors backdrop-blur-md z-50">
            <ArrowLeft size={24} />
          </button>
          <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                Benutzerhandbuch
              </h1>
              <p className="text-slate-400 text-sm mt-1">Version 1.9.29 • InFocus CineLog</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation (Desktop) */}
          <aside className="hidden lg:block sticky top-8 h-fit space-y-2">
            <nav className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Inhalt</p>
              {navItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-cyan-400 transition-all text-sm font-medium text-left"
                >
                  <item.icon size={16} /> {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-12">

            {/* SECTION: INSTALLATION (NEW) */}
            <section id="install" className="scroll-mt-24">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/20 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <Smartphone className="text-cyan-400" /> App Installation
                    </h2>
                    
                    <p className="text-slate-300 mb-6 leading-relaxed">
                        InFocus CineLog ist eine <strong>Progressive Web App (PWA)</strong>. Das bedeutet, du kannst sie direkt aus dem Browser heraus installieren – ohne App Store!
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* iOS */}
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <span className="bg-white text-black text-xs font-bold px-1.5 py-0.5 rounded">iOS</span> iPhone / iPad
                            </h3>
                            <ol className="space-y-4 text-sm text-slate-300">
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-cyan-400 font-bold shrink-0">1</span>
                                    <span>Öffne die App in <strong>Safari</strong>.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-cyan-400 font-bold shrink-0">2</span>
                                    <span>Tippe unten in der Leiste auf den <strong className="text-white inline-flex items-center gap-1"><Share size={14}/> Teilen</strong> Button.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-cyan-400 font-bold shrink-0">3</span>
                                    <span>Scrolle etwas nach unten und wähle <strong className="text-white inline-flex items-center gap-1"><PlusSquare size={14}/> Zum Home-Bildschirm</strong>.</span>
                                </li>
                            </ol>
                        </div>

                        {/* Android */}
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <span className="bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">Android</span> Chrome
                            </h3>
                            <ol className="space-y-4 text-sm text-slate-300">
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-cyan-400 font-bold shrink-0">1</span>
                                    <span>Öffne das Profil-Menü oben rechts (dein Avatar).</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-cyan-400 font-bold shrink-0">2</span>
                                    <span>Tippe auf <strong className="text-cyan-400">App installieren</strong>.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-cyan-400 font-bold shrink-0">3</span>
                                    <span>Alternativ erscheint oft automatisch ein Hinweis am unteren Bildschirmrand.</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 1: ERSTE SCHRITTE (ADMIN ONLY) */}
            {isAdmin && (
                <section id="start" className="scroll-mt-24">
                <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Key className="text-cyan-400" /> Erste Schritte (Admin)
                    </h2>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                    Damit InFocus CineLog funktioniert, benötigt die App Zugang zu Filmdatenbanken. Als Admin verwaltest du diese Keys für alle Nutzer.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                        <h3 className="font-bold text-white mb-2">1. TMDB API Key</h3>
                        <p className="text-sm text-slate-400 mb-3">Notwendig für Filmdaten, Cover und Schauspieler.</p>
                        <div className="text-xs bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-cyan-400 truncate">
                        4115939bdc... (Beispiel)
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                        <h3 className="font-bold text-white mb-2">2. OMDb API Key (Optional)</h3>
                        <p className="text-sm text-slate-400 mb-3">Hilft beim "Smart Import", wenn TMDB einen Titel nicht sofort findet.</p>
                    </div>
                    </div>
                    
                    <div className="mt-6 flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <Shield className="text-yellow-500 shrink-0 mt-1" size={20} />
                    <p className="text-xs text-yellow-200">
                        <strong>Admin Hinweis:</strong> Diese Sektion ist für normale Benutzer unsichtbar. Konfiguriere die Keys in den Einstellungen (Zahnrad).
                    </p>
                    </div>
                </div>
                </section>
            )}

            {/* SECTION 2: SUCHEN & VISION */}
            <section id="search" className="scroll-mt-24">
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Search className="text-purple-400" /> Suchen, Filtern & Hinzufügen
                </h2>

                <div className="space-y-8">
                  {/* Text Search Mockup */}
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/2">
                      <h3 className="text-lg font-bold text-white mb-2">Die "Pills" Filter</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        Oben in der App findest du jetzt schnelle Filter-Buttons ("Pills"). Klicke auf <span className="text-cyan-400 font-bold">MOVIES</span> oder <span className="text-purple-400 font-bold">SERIES</span>, um deine Ansicht sofort zu sortieren. "ALL" zeigt dir alles.
                      </p>
                      
                      <h3 className="text-lg font-bold text-white mb-2 mt-6">Klassische Suche</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Klicke auf das große <strong className="text-white">+</strong> oder die Lupe. Gib einfach den Titel ein. Wir zeigen dir sofort Ergebnisse mit Cover, Jahr und Bewertung an.
                      </p>
                    </div>
                    
                    <div className="w-full md:w-1/2 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                      {/* Pills Mockup */}
                      <div className="flex gap-2 mb-4">
                          <div className="px-3 py-1 rounded-full border border-white bg-white text-black text-xs font-bold">ALL</div>
                          <div className="px-3 py-1 rounded-full border border-cyan-500/50 bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> MOVIES</div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-3 border border-slate-600 mb-3">
                        <Search size={18} className="text-slate-400"/>
                        <span className="text-slate-500 text-sm">Matrix...</span>
                      </div>
                      <div className="flex gap-3 items-center p-2 bg-slate-700/50 rounded-lg">
                        <div className="w-8 h-12 bg-green-900/50 rounded border border-green-500/30"></div>
                        <div className="flex-grow">
                          <div className="h-2 w-24 bg-slate-500 rounded mb-1"></div>
                          <div className="h-1.5 w-16 bg-slate-600 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vision Search Mockup */}
                  <div className="flex flex-col md:flex-row-reverse gap-6 items-center border-t border-white/5 pt-8">
                    <div className="w-full md:w-1/2">
                      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Camera className="text-cyan-400" size={20}/> Vision Search
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Du bist im Kino oder siehst eine DVD bei einem Freund? <br/>
                        Öffne die Suche und klicke auf das <strong className="text-white">Kamera-Icon</strong>. Fotografiere das Cover ab – unsere AI erkennt den Film automatisch!
                      </p>
                    </div>
                    <div className="w-full md:w-1/2 relative group">
                       <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
                       <div className="relative bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
                          <Camera size={48} className="mx-auto text-slate-500 mb-2 group-hover:text-cyan-400 transition-colors" />
                          <span className="text-xs text-slate-400 uppercase tracking-widest">AI Scanner Ready</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION: SMART IMPORT */}
            <section id="import" className="scroll-mt-24">
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Download className="text-green-400" /> Smart Import
                </h2>

                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <p className="text-slate-300 mb-4 leading-relaxed text-sm">
                            Hast du eine alte Liste als Textdatei? Oder Excel? Kopiere sie einfach!
                            Der Smart Import analysiert Textzeilen, extrahiert Titel und Jahreszahlen und sucht automatisch die passenden Filme.
                        </p>
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2"><FileText size={16}/> Copy & Paste</h4>
                                <code className="block bg-slate-950 p-3 rounded text-xs font-mono text-slate-400">
                                    Inception (2010)<br/>
                                    Breaking Bad; Serie; Top!<br/>
                                    Der Pate
                                </code>
                            </div>
                            <div className="bg-green-900/10 p-3 rounded-lg border border-green-500/20">
                                <p className="text-xs text-green-300 flex items-center gap-2">
                                    <Star size={14} /> 
                                    <strong>Pro Tipp:</strong> Wenn ein OMDb Key hinterlegt ist, finden wir auch schwer auffindbare Titel via IMDb-Datenbank.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative">
                        <div className="absolute -top-3 -right-3 bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Neu</div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-green-500 rounded flex items-center justify-center"><div className="w-2 h-2 bg-green-500"></div></div>
                                <span className="text-sm text-white">Inception</span>
                                <span className="text-xs text-slate-500 ml-auto">TMDB Match</span>
                            </div>
                            <div className="flex items-center gap-3 opacity-50">
                                <div className="w-4 h-4 border-2 border-slate-600 rounded"></div>
                                <span className="text-sm text-slate-400">Unbekannter Titel...</span>
                            </div>
                            <button className="w-full bg-cyan-600/20 text-cyan-400 text-xs font-bold py-2 rounded mt-2">
                                Analysieren...
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: AI POWER */}
            <section id="ai" className="scroll-mt-24">
              <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 backdrop-blur-md border border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Sparkles className="text-yellow-400" /> AI Features
                </h2>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Feature 1 */}
                  <div className="bg-slate-800/60 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-colors">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 text-indigo-300">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="font-bold text-white mb-2">AI Empfehlungen</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Klicke auf den <span className="text-indigo-300 font-bold">AI Tipp</span> Button in der Sidebar. Die AI analysiert deine Favoriten und schlägt dir EINEN perfekten Film vor, den du noch nicht kennst.
                    </p>
                  </div>

                  {/* Feature 2 */}
                  <div className="bg-slate-800/60 p-5 rounded-2xl border border-white/5 hover:border-purple-500/50 transition-colors">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 text-purple-300">
                      <BrainCircuit size={20} />
                    </div>
                    <h3 className="font-bold text-white mb-2">Deep Analysis</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Wenn du deine Meinung schreibst ("Hat mir gefallen, aber das Ende war doof"), liest die AI diese Notizen und gibt dir beim nächsten Mal noch präzisere Tipps ("Deep Insight").
                    </p>
                  </div>

                  {/* Feature 3 */}
                  <div className="bg-slate-800/60 p-5 rounded-2xl border border-white/5 hover:border-cyan-500/50 transition-colors">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 text-cyan-300">
                      <MessageCircle size={20} />
                    </div>
                    <h3 className="font-bold text-white mb-2">CineChat</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Unten rechts findest du den Chatbot. Frag ihn Dinge wie: "Welche Horrorfilme aus den 80ern habe ich auf meiner Watchlist?". Er kennt deine Sammlung!
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: LISTEN & SOCIAL */}
            <section id="lists" className="scroll-mt-24">
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Share2 className="text-green-400" /> Listen & Social
                </h2>

                <div className="space-y-6">
                  <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Layers size={18} className="text-slate-400"/> Eigene Listen
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">
                        Neben "Gesehen" und "Watchlist" kannst du eigene Listen erstellen (z.B. "Halloween Marathon" oder "Marvel Phase 1").
                      </p>
                      <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
                        <li>Klicke auf das <span className="text-white bg-slate-700 px-1 rounded text-xs">+</span> neben "Meine Listen".</li>
                        <li>Füge Filme über das Menü auf der Filmkarte hinzu.</li>
                      </ul>
                    </div>
                    
                    <div className="w-px bg-slate-700 hidden md:block"></div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Share2 size={18} className="text-green-400"/> Öffentliche Rezensionen
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">
                        InFocus CineLog ist mehr als eine Liste. Schreibe deine Meinung zu Filmen!
                      </p>
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-xs text-green-200">
                        Deine "Private Notiz" ist jetzt eine <strong>Öffentliche Rezension</strong>. Andere Nutzer können sehen, was du denkst, und du siehst ihre Meinungen direkt unter dem Film.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: GAMIFICATION */}
            <section id="gamification" className="scroll-mt-24">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-yellow-500/20 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Trophy className="text-yellow-500" /> Level & Trophäen
                </h2>

                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <p className="text-slate-300 mb-4">
                      InFocus CineLog belohnt dich fürs Schauen! Für jede Minute Laufzeit deiner gesehenen Filme erhältst du <strong className="text-yellow-400">XP</strong>.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                        <Star className="text-yellow-500" size={20} />
                        <div>
                          <div className="text-sm font-bold text-white">Level System</div>
                          <div className="text-xs text-slate-400">Vom "Statist" zur "Hollywood Legende". Auch Rezensionen bringen XP!</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                        <Trophy className="text-orange-500" size={20} />
                        <div>
                          <div className="text-sm font-bold text-white">Trophäen</div>
                          <div className="text-xs text-slate-400">Sammle Auszeichnungen wie "Binge Master" oder "Genre Guru".</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-1/3 bg-slate-950 p-6 rounded-full aspect-square flex flex-col items-center justify-center border-4 border-slate-800 shadow-inner relative">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin-slow"></div>
                    <span className="text-3xl font-bold text-white">Lvl 5</span>
                    <span className="text-xs text-cyan-400 uppercase tracking-widest mt-1">Drehbuchautor</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 6: SICHERHEIT & PRIVACY */}
            <section id="security" className="scroll-mt-24">
              <div className="bg-slate-900/60 backdrop-blur-md border border-red-500/10 rounded-3xl p-6 md:p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Lock className="text-red-400" /> Sicherheit & Passwörter
                </h2>

                <div className="space-y-6">
                  <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50">
                      <h3 className="text-lg font-bold text-white mb-4">Warum "mindestens 8 Zeichen"?</h3>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">
                          Wir nerven dich nicht mit dem Zwang zu Sonderzeichen (<code className="bg-slate-900 px-1 py-0.5 rounded text-red-300">!$§%</code>). 
                          Moderne Sicherheitsexperten (NIST) wissen: <strong>Länge schlägt Komplexität.</strong>
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-lg">
                              <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Schlecht</span>
                              <div className="text-lg font-mono text-white mt-1">Tr4!n$</div>
                              <p className="text-xs text-slate-400 mt-2">Kurz, kryptisch, schwer am Handy zu tippen, aber für Computer leicht zu knacken.</p>
                          </div>
                          <div className="bg-green-900/10 border border-green-900/30 p-4 rounded-lg">
                              <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Super Sicher</span>
                              <div className="text-lg font-mono text-white mt-1">KaffeeSonneRegen</div>
                              <p className="text-xs text-slate-400 mt-2">Lang, einfach zu merken, extrem schwer zu knacken. Das nennt man "Passphrase".</p>
                          </div>
                      </div>
                  </div>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
};
