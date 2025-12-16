
import React, { useEffect, useState } from 'react';
import { X, Download, Share, PlusSquare, Smartphone, Monitor } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface InstallPwaModalProps {
    isOpen: boolean;
    onClose: () => void;
    installPrompt: any; // The 'beforeinstallprompt' event
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose, installPrompt }) => {
    const { t } = useTranslation();
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    }, []);

    if (!isOpen) return null;

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                onClose();
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10">
                    <X size={24} />
                </button>

                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-900/50 mb-6">
                        <Download size={40} className="text-white" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">App installieren</h2>
                    
                    {isIOS ? (
                        // iOS INSTRUCTIONS
                        <div className="space-y-4 w-full">
                            <p className="text-slate-400 text-sm mb-4">
                                Installiere InFocus CineLog auf deinem iPhone für das beste Erlebnis (Vollbild, Offline-Modus).
                            </p>
                            
                            <div className="bg-slate-800 rounded-xl p-4 text-left space-y-3 border border-slate-700/50">
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0">1</span>
                                    <span>Tippe unten auf <strong className="text-white flex items-center gap-1 inline-flex"><Share size={14} /> Teilen</strong></span>
                                </div>
                                <div className="w-px h-4 bg-slate-700 ml-3"></div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0">2</span>
                                    <span>Wähle <strong className="text-white flex items-center gap-1 inline-flex"><PlusSquare size={14} /> Zum Home-Bildschirm</strong></span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // ANDROID / DESKTOP BUTTON
                        <div className="space-y-4 w-full">
                             <p className="text-slate-400 text-sm mb-4">
                                Füge die App zu deinem Startbildschirm hinzu für schnelleren Zugriff und Vollbild-Modus.
                            </p>
                            
                            {installPrompt ? (
                                <button 
                                    onClick={handleInstallClick}
                                    className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Download size={20} /> Jetzt installieren
                                </button>
                            ) : (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-xs">
                                    <p className="mb-1 font-bold">Installation bereits aktiv oder nicht unterstützt.</p>
                                    <p>Prüfe deine Browser-Einstellungen oder die Adressleiste.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
