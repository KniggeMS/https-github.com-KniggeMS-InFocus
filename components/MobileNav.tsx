
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MonitorPlay, Heart, List, Search } from 'lucide-react';

interface MobileNavProps {
  onSearchClick: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onSearchClick }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe z-40">
      <div className="flex justify-around items-center h-16 px-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`
          }
        >
          <LayoutDashboard size={22} />
        </NavLink>
        
        <NavLink 
          to="/watchlist" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`
          }
        >
          <MonitorPlay size={22} />
        </NavLink>

        {/* Search Button (Floating Action Style) */}
        <div className="relative -top-5">
            <button 
                onClick={onSearchClick}
                className="w-14 h-14 bg-cyan-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-900/40 border-4 border-slate-900"
            >
                <Search size={24} />
            </button>
        </div>

        <NavLink 
          to="/favorites" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-16 h-full space-y-1 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`
          }
        >
          <Heart size={22} />
        </NavLink>

        {/* Menu for Custom Lists (reusing Sidebar route or creating a mobile menu route) */}
        <button 
            onClick={() => document.getElementById('mobile-menu-trigger')?.click()}
            className="flex flex-col items-center justify-center w-16 h-full space-y-1 text-slate-500"
        >
          <List size={22} />
        </button>
      </div>
    </div>
  );
};
