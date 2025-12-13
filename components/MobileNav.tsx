
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MonitorPlay, Heart, List, Search } from 'lucide-react';

interface MobileNavProps {
  onSearchClick: () => void;
  onListsClick: () => void;
  hasNotification?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onSearchClick, onListsClick, hasNotification }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 pb-safe z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center h-16 px-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors active:scale-90 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`
          }
        >
          <LayoutDashboard size={22} />
        </NavLink>
        
        <NavLink 
          to="/watchlist" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors active:scale-90 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`
          }
        >
          <MonitorPlay size={22} />
        </NavLink>

        {/* Search Button (Floating Action Style) */}
        <div className="relative -top-6">
            <button 
                onClick={onSearchClick}
                className="w-14 h-14 bg-cyan-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-900/40 border-4 border-slate-900 active:scale-95 transition-transform"
            >
                <Search size={24} />
            </button>
        </div>

        <NavLink 
          to="/favorites" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors active:scale-90 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`
          }
        >
          <Heart size={22} />
        </NavLink>

        {/* Menu for Custom Lists (Open Drawer) */}
        <button 
            onClick={onListsClick}
            className="flex flex-col items-center justify-center w-16 h-full space-y-1 text-slate-500 active:scale-90 transition-transform relative"
        >
          <List size={22} className={hasNotification ? 'text-cyan-400' : ''} />
          {hasNotification && (
              <span className="absolute top-3 right-4 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
          )}
        </button>
      </div>
    </div>
  );
};
