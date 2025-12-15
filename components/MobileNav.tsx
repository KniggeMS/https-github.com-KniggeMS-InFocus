
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
    <div className="md:hidden fixed bottom-4 left-4 right-4 glass-panel pb-1 pt-1 z-40 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] rounded-2xl animate-in slide-in-from-bottom-10 duration-500">
      <div className="flex justify-around items-center h-14 px-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`
          }
        >
          <LayoutDashboard size={20} />
        </NavLink>
        
        <NavLink 
          to="/watchlist" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`
          }
        >
          <MonitorPlay size={20} />
        </NavLink>

        {/* Search Button (Floating Action Style - Clean) */}
        <div className="relative -top-8">
            <button 
                onClick={onSearchClick}
                className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl rotate-45 flex items-center justify-center text-white shadow-lg shadow-cyan-900/50 border-4 border-[#0B0E14] active:scale-95 transition-transform group"
            >
                <Search size={24} className="-rotate-45 group-hover:scale-110 transition-transform" />
            </button>
        </div>

        <NavLink 
          to="/favorites" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`
          }
        >
          <Heart size={20} />
        </NavLink>

        {/* Menu for Custom Lists */}
        <button 
            onClick={onListsClick}
            className="flex flex-col items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:text-slate-300 active:scale-90 transition-transform relative"
        >
          <List size={20} className={hasNotification ? 'text-white' : ''} />
          {hasNotification && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-slate-900 animate-pulse"></span>
          )}
        </button>
      </div>
    </div>
  );
};
