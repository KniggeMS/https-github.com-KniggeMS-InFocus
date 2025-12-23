import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

interface BottomSheetAction {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'success' | 'accent';
    active?: boolean;
}

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    actions: BottomSheetAction[];
    sections?: {
        title: string;
        actions: BottomSheetAction[];
    }[];
}

// Explicitly typing ActionButton as React.FC to resolve key prop TS error and moving it above usage
const ActionButton: React.FC<{ action: BottomSheetAction; onClose: () => void }> = ({ action, onClose }) => {
    const handleClick = () => {
        action.onClick();
        onClose();
    };

    const variantStyles = {
        default: 'text-slate-300 hover:text-white',
        danger: 'text-red-400 hover:bg-red-500/10',
        success: 'text-green-400 hover:bg-green-500/10',
        accent: 'text-cyan-400 hover:bg-cyan-500/10'
    };

    return (
        <button 
            onClick={handleClick}
            data-testid="bottom-sheet-action"
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors active:bg-white/10 ${variantStyles[action.variant || 'default']}`}
        >
            <div className="flex items-center gap-4">
                <span className="opacity-70">{action.icon}</span>
                <span className="text-base font-medium">{action.label}</span>
            </div>
            {action.active && <Check size={18} className="text-cyan-400" />}
        </button>
    );
};

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, actions, sections }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => {
                setIsMounted(false);
                document.body.style.overflow = 'unset';
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isMounted && !isOpen) return null;

    return createPortal(
        <div className={`fixed inset-0 z-[100] flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
                onClick={onClose}
            />
            
            {/* Sheet */}
            <div 
                data-testid="bottom-sheet"
                className={`relative w-full max-w-lg glass-panel rounded-t-3xl shadow-2xl border-t border-white/10 pb-safe transition-transform duration-300 ease-out transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>

                {/* Header */}
                {title && (
                    <div className="px-6 py-2 border-b border-white/5 mb-2">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</h3>
                    </div>
                )}

                {/* Simple Actions */}
                <div className="px-2 pb-4 max-h-[70vh] overflow-y-auto">
                    {actions.length > 0 && (
                        <div className="space-y-1">
                            {actions.map((action, idx) => (
                                // Fixed: key prop is now correctly handled by React.FC type
                                <ActionButton key={idx} action={action} onClose={onClose} />
                            ))}
                        </div>
                    )}

                    {/* Sectioned Actions (e.g. Lists) */}
                    {sections && sections.map((section, sIdx) => (
                        <div key={sIdx} className="mt-4 first:mt-0">
                            <div className="px-4 py-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {section.title}
                            </div>
                            <div className="space-y-1">
                                {section.actions.map((action, aIdx) => (
                                    // Fixed: key prop is now correctly handled by React.FC type
                                    <ActionButton key={aIdx} action={action} onClose={onClose} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};
