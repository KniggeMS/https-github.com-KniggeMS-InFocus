
import React, { useMemo, useState } from 'react';
import { MediaItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChevronDown, ChevronUp, PieChart as PieChartIcon } from 'lucide-react';

interface StatsProps {
  items: MediaItem[];
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

export const Stats: React.FC<StatsProps> = ({ items }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const data = useMemo(() => {
    const genreCount: Record<string, number> = {};
    items.forEach(item => {
      item.genre.forEach(g => {
        const genre = g.trim();
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    return Object.entries(genreCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700 shadow-lg mb-6 md:mb-8">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center text-left"
      >
        <div className="flex items-center gap-2 text-white">
            <PieChartIcon size={18} className="text-cyan-400" />
            <h3 className="text-sm md:text-lg font-semibold">Genre Verteilung</h3>
        </div>
        <div className="md:hidden">
            {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'h-64 mt-4 opacity-100' : 'h-0 opacity-0 md:h-64 md:opacity-100 md:mt-4'}`}>
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                />
                <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
                />
            </PieChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
