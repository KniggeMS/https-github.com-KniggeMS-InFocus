import React, { useMemo, useState } from 'react';
import { MediaItem, MediaType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { ChevronDown, ChevronUp, Activity, Clock, Hash, MousePointer2 } from 'lucide-react';

interface StatsProps {
  items: MediaItem[];
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

// Custom active shape for hover effect (slight expansion)
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const Stats: React.FC<StatsProps> = ({ items }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [metric, setMetric] = useState<'count' | 'runtime'>('count');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // --- DATA PROCESSING ---
  const { data, totalMetricValue, totalLibraryRuntime, totalLibraryCount } = useMemo(() => {
    const stats: Record<string, { count: number; runtime: number }> = {};
    let libRuntime = 0;

    items.forEach(item => {
      // Calculate item runtime
      let itemRuntime = 0;
      if (item.type === MediaType.MOVIE) {
          itemRuntime = item.runtime || 120;
      } else {
          // Estimate series runtime if total minutes not explicitly stored
          const epRuntime = item.runtime || 45;
          const seasons = item.seasons || 1;
          // Simple heuristic: if episodes count exists use it, else guess per season (10 eps)
          const totalEps = item.episodes ? item.episodes : (seasons * 10);
          itemRuntime = (epRuntime * totalEps); 
      }
      libRuntime += itemRuntime;

      item.genre.forEach(g => {
        const genre = g.trim();
        if (!stats[genre]) stats[genre] = { count: 0, runtime: 0 };
        stats[genre].count += 1;
        stats[genre].runtime += itemRuntime;
      });
    });

    const mapped = Object.entries(stats)
      .map(([name, val]) => ({
        name,
        // Raw value for chart sizing
        value: metric === 'count' ? val.count : val.runtime,
        // Formatted value for display
        displayValue: metric === 'count' ? val.count : Math.round(val.runtime / 60)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6

    const currentTotal = mapped.reduce((acc, cur) => acc + cur.value, 0);

    return { 
        data: mapped, 
        totalMetricValue: currentTotal, // Total of the TOP 6 displayed
        totalLibraryRuntime: Math.round(libRuntime / 60), // Real Total Hours
        totalLibraryCount: items.length // Real Total Count
    };
  }, [items, metric]);

  // --- CENTER TEXT LOGIC ---
  const activeItem = activeIndex !== null && data[activeIndex] ? data[activeIndex] : null;
  
  // Main Value (Big Number)
  let centerValue: string = "0";
  // Sub Label (Small Text)
  let centerLabel = '';
  // Bottom context (Genre name or "Total")
  let centerContext = '';

  if (activeItem) {
      // Hover State
      centerValue = activeItem.displayValue.toLocaleString();
      centerLabel = metric === 'count' ? 'Titel' : 'Stunden';
      centerContext = activeItem.name;
  } else {
      // Default State
      if (metric === 'count') {
          centerValue = totalLibraryCount.toLocaleString();
          centerLabel = 'Titel';
          centerContext = 'Gesamt';
      } else {
          centerValue = totalLibraryRuntime.toLocaleString();
          centerLabel = 'Stunden';
          centerContext = 'Watchtime';
      }
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700 shadow-lg mb-6 md:mb-8 transition-all hover:border-slate-600">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 text-white group w-full sm:w-auto"
          >
            <div className={`p-2.5 rounded-xl transition-colors shadow-inner ${isExpanded ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'}`}>
                <Activity size={20} />
            </div>
            <div className="text-left flex-grow">
                <h3 className="text-sm md:text-base font-bold group-hover:text-cyan-400 transition-colors">Statistik & Trends</h3>
                <span className="text-xs text-slate-500 block">Genre-Verteilung (Deine Sammlung)</span>
            </div>
            <div className="sm:hidden">
                {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </div>
          </button>

          {/* METRIC SWITCH (Visible when expanded) */}
          {isExpanded && (
              <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700 self-end sm:self-auto animate-in fade-in slide-in-from-right-4 duration-300">
                  <button
                    onClick={() => setMetric('count')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${metric === 'count' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                      <Hash size={12} /> Anzahl
                  </button>
                  <button
                    onClick={() => setMetric('runtime')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${metric === 'runtime' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                      <Clock size={12} /> Laufzeit
                  </button>
              </div>
          )}
      </div>

      {/* CHART BODY */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'h-72 sm:h-64 mt-6 opacity-100' : 'h-0 opacity-0'}`}>
        <div className="flex flex-col sm:flex-row h-full items-center gap-4 md:gap-12 justify-center">
            
            {/* CHART AREA with CENTER INFO */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius="65%"
                            outerRadius="85%"
                            paddingAngle={4}
                            dataKey="value"
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            // @ts-ignore: activeIndex type definition issue in Recharts/React 19
                            activeIndex={activeIndex ?? -1}
                            activeShape={renderActiveShape}
                            stroke="none"
                        >
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                className="transition-all duration-300 outline-none"
                            />
                        ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* THE INFORMATIVE CENTER (Absolute overlay) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col animate-in fade-in duration-300 z-10">
                    <span className={`text-3xl md:text-4xl font-black leading-none tracking-tight ${metric === 'count' ? 'text-white' : 'text-purple-100'}`}>
                        {centerValue}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">
                        {centerLabel}
                    </span>
                    <div className={`mt-2 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors max-w-[90%] truncate ${activeItem ? 'bg-slate-700/80 border-slate-600 text-cyan-400' : 'bg-transparent border-transparent text-slate-600'}`}>
                        {centerContext}
                    </div>
                </div>
            </div>

            {/* CUSTOM LEGEND (Right Side) */}
            <div className="flex flex-col justify-center w-full sm:w-48 sm:border-l sm:border-slate-700/50 sm:pl-8 h-auto sm:h-[80%] my-auto">
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-1.5">
                    {data.map((entry, index) => {
                        const isActive = activeIndex === index;
                        // Calculate percentage relative to displayed data
                        const percent = Math.round((entry.value / totalMetricValue) * 100) || 0;
                        
                        return (
                            <div 
                                key={entry.name} 
                                className="flex items-center justify-between text-xs group cursor-pointer py-1" 
                                onMouseEnter={() => setActiveIndex(index)} 
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div 
                                        className={`w-2 h-2 rounded-full transition-transform duration-200 ${isActive ? 'scale-125 shadow-[0_0_8px_currentColor]' : ''}`} 
                                        style={{ backgroundColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}
                                    ></div>
                                    <span className={`truncate transition-colors font-medium max-w-[80px] sm:max-w-none ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                        {entry.name}
                                    </span>
                                </div>
                                <span className={`font-mono text-[10px] transition-colors ${isActive ? 'text-cyan-400 font-bold' : 'text-slate-600'}`}>
                                    {percent}%
                                </span>
                            </div>
                        );
                    })}
                </div>
                {/* Instruction Hint (Desktop only) */}
                <div className="hidden sm:flex mt-4 pt-4 border-t border-slate-700/50 text-[10px] text-slate-600 items-center gap-1.5">
                    <MousePointer2 size={10} />
                    <span>Hover für Details</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};