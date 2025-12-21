
import React, { useMemo, useState } from 'react';
import { MediaItem, MediaType, WatchStatus } from '../types';
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
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const Stats: React.FC<StatsProps> = ({ items }) => {
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed for cleaner UI
  const [metric, setMetric] = useState<'count' | 'runtime'>('count');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // --- DATA PROCESSING ---
  const { data, totalMetricValue, totalLibraryRuntime, totalLibraryCount } = useMemo(() => {
    const stats: Record<string, { count: number; runtime: number }> = {};
    let libRuntime = 0;

    items.forEach(item => {
      // Calculate item runtime with valid fallbacks
      let itemRuntime = 0;
      if (item.type === MediaType.MOVIE) {
          itemRuntime = item.runtime || 120;
      } else {
          // Estimate series runtime
          const epRuntime = item.runtime || 45;
          const seasons = item.seasons || 1;
          const totalEps = item.episodes && item.episodes > 0 ? item.episodes : (seasons * 10);
          itemRuntime = (epRuntime * totalEps); 
      }
      
      // LOGIC FIX: Runtime should only count WATCHED items (Watchtime), 
      // while Count usually represents Collection Size (All items)
      const isWatched = item.status === WatchStatus.WATCHED;

      if (isWatched) {
          libRuntime += itemRuntime;
      }

      // Distribute to genres - SAFE ACCESS
      const genresToMap = (Array.isArray(item.genre) && item.genre.length > 0) ? item.genre : ["Unbekannt"];

      genresToMap.forEach(g => {
        if (typeof g === 'string') {
            const genre = g.trim();
            if (!stats[genre]) stats[genre] = { count: 0, runtime: 0 };
            
            // Count always increments (Collection size)
            stats[genre].count += 1;
            
            // Runtime only increments if watched
            if (isWatched) {
                stats[genre].runtime += itemRuntime;
            }
        }
      });
    });

    // Convert to Array
    let mapped = Object.entries(stats)
      .map(([name, val]) => ({
        name,
        // Raw value for chart sizing
        value: metric === 'count' ? val.count : val.runtime,
        // Formatted value for display
        displayValue: metric === 'count' ? val.count : Math.round(val.runtime / 60)
      }))
      // Filter out genres with 0 value (e.g. genres that have items but none watched in runtime mode)
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    // "Others" Category Logic
    if (mapped.length > 5) {
        const top5 = mapped.slice(0, 5);
        const others = mapped.slice(5);
        
        const otherValue = others.reduce((acc, cur) => acc + cur.value, 0);
        const otherDisplay = others.reduce((acc, cur) => acc + cur.displayValue, 0);
        
        if (otherValue > 0) {
            mapped = [
                ...top5,
                { name: "Sonstige", value: otherValue, displayValue: otherDisplay }
            ];
        } else {
            mapped = top5;
        }
    }

    // Sum of the chart segments
    const currentChartTotal = mapped.reduce((acc, cur) => acc + cur.value, 0);

    return { 
        data: mapped, 
        totalMetricValue: currentChartTotal, 
        totalLibraryRuntime: Math.round(libRuntime / 60), // Real Total Hours (Watched only)
        totalLibraryCount: items.length // Real Total Count (All)
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
          centerContext = 'Sammlung';
      } else {
          centerValue = totalLibraryRuntime.toLocaleString();
          centerLabel = 'Stunden';
          centerContext = 'Watchtime';
      }
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg mb-8 transition-all hover:border-slate-600">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-4 text-white group w-full sm:w-auto"
          >
            <div className={`p-3 rounded-xl transition-colors shadow-inner ${isExpanded ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'}`}>
                <Activity size={24} />
            </div>
            <div className="text-left flex-grow">
                <h3 className="text-lg font-bold group-hover:text-cyan-400 transition-colors">Statistik & Trends</h3>
                <span className="text-sm text-slate-400 block">
                    {metric === 'count' ? 'Genre-Verteilung (Gesamt)' : 'Deine Watchtime (Gesehen)'}
                </span>
            </div>
            <div className="sm:hidden ml-auto">
                {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </div>
          </button>

          {/* METRIC SWITCH (Visible when expanded) */}
          {isExpanded && (
              <div className="flex bg-slate-900/50 p-1.5 rounded-lg border border-slate-700 self-end sm:self-auto animate-in fade-in slide-in-from-right-4 duration-300">
                  <button
                    onClick={() => setMetric('count')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${metric === 'count' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                      <Hash size={14} /> Anzahl
                  </button>
                  <button
                    onClick={() => setMetric('runtime')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${metric === 'runtime' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                      <Clock size={14} /> Laufzeit
                  </button>
              </div>
          )}
      </div>

      {/* CHART BODY */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'h-80 sm:h-[22rem] mt-8 opacity-100' : 'h-0 opacity-0'}`}>
        <div className="flex flex-col sm:flex-row h-full items-center gap-8 md:gap-16 justify-center">
            
            {/* CHART AREA with CENTER INFO */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex-shrink-0">
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
                            // @ts-ignore: activeIndex type definition issue
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
                    <span className={`text-6xl font-black leading-none tracking-tight ${metric === 'count' ? 'text-white' : 'text-purple-100'}`}>
                        {centerValue}
                    </span>
                    <span className="text-sm uppercase font-bold text-slate-400 tracking-widest mt-2">
                        {centerLabel}
                    </span>
                    <div className={`mt-3 px-4 py-1.5 rounded-md text-sm font-bold border transition-colors max-w-[90%] truncate ${activeItem ? 'bg-slate-700/80 border-slate-600 text-cyan-400' : 'bg-transparent border-transparent text-slate-500'}`}>
                        {centerContext}
                    </div>
                </div>
            </div>

            {/* CUSTOM LEGEND (Right Side) */}
            <div className="flex flex-col justify-center w-full sm:w-64 sm:border-l sm:border-slate-700/50 sm:pl-8 h-auto sm:h-[90%] my-auto">
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-6 gap-y-3">
                    {data.map((entry, index) => {
                        const isActive = activeIndex === index;
                        // Calculate percentage relative to displayed data (Total Chart Value)
                        const percent = totalMetricValue > 0 ? Math.round((entry.value / totalMetricValue) * 100) : 0;
                        
                        return (
                            <div 
                                key={entry.name} 
                                className="flex items-center justify-between text-base group cursor-pointer py-1.5" 
                                onMouseEnter={() => setActiveIndex(index)} 
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div 
                                        className={`w-3 h-3 rounded-full transition-transform duration-200 ${isActive ? 'scale-125 shadow-[0_0_8px_currentColor]' : ''}`} 
                                        style={{ backgroundColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}
                                    ></div>
                                    <span className={`truncate transition-colors font-medium ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-100'}`}>
                                        {entry.name}
                                    </span>
                                </div>
                                <span className={`font-mono text-sm transition-colors ${isActive ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                                    {percent}%
                                </span>
                            </div>
                        );
                    })}
                </div>
                {/* Instruction Hint (Desktop only) */}
                <div className="hidden sm:flex mt-6 pt-4 border-t border-slate-700/50 text-sm text-slate-500 items-center gap-2">
                    <MousePointer2 size={14} />
                    <span>Hover für Details</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
