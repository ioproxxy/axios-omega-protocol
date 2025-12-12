import React from 'react';
import { GameStats, LogMessage } from '../types';
import { Heart, Zap, Terminal, MapPin } from 'lucide-react';
import { ZONE_CONFIG } from '../constants';

interface HUDProps {
  stats: GameStats;
  logs?: LogMessage[];
}

export const HUD: React.FC<HUDProps> = ({ stats, logs = [] }) => {
  // Determine health color
  const healthColor = stats.health > 50 ? 'text-cyan-400' : stats.health > 20 ? 'text-yellow-400' : 'text-red-500';
  
  // Determine Zone Name
  const zoneId = stats.wave >= 5 ? 3 : stats.wave >= 3 ? 2 : 1;
  const zoneName = ZONE_CONFIG[zoneId as keyof typeof ZONE_CONFIG].name;

  return (
    <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/30 p-4 rounded-lg min-w-[200px]">
          <h1 className="text-xl font-bold text-cyan-500 tracking-widest">AXIOS UNIT</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className={`w-2 h-2 rounded-full ${stats.health > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
             <p className="text-xs text-gray-400">STATUS: {stats.health > 0 ? 'OPERATIONAL' : 'CRITICAL'}</p>
          </div>
          <div className="flex items-center gap-2 mt-2 border-t border-cyan-500/20 pt-2">
             <MapPin className="w-3 h-3 text-cyan-300" />
             <p className="text-[10px] text-cyan-300 tracking-wider font-bold">{zoneName}</p>
          </div>
        </div>
        
        <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/30 p-4 rounded-lg flex flex-col items-end">
          <span className="text-2xl font-bold text-white tracking-widest">{stats.score.toString().padStart(6, '0')}</span>
          <span className="text-xs text-gray-400">SCORE - WAVE {stats.wave}</span>
        </div>
      </div>

      {/* Middle - Empty for Crosshair */}
      
      {/* Bottom Area */}
      <div className="flex justify-between items-end mt-auto">
        
        {/* Narrative Log - Bottom Left */}
        <div className="flex flex-col gap-2 max-w-md mb-4 mr-4">
            {logs.map((log) => (
                <div key={log.id} className="animate-in fade-in slide-in-from-left duration-500 bg-black/60 backdrop-blur-sm p-3 border-l-2 border-cyan-500/50 rounded-r-md">
                    <div className="flex items-center gap-2 mb-1">
                        <Terminal className={`w-3 h-3 ${log.type === 'WARNING' ? 'text-red-500' : log.type === 'MEMORY' ? 'text-purple-400' : 'text-cyan-500'}`} />
                        <span className={`text-[10px] font-bold tracking-widest ${log.type === 'WARNING' ? 'text-red-500' : log.type === 'MEMORY' ? 'text-purple-400' : 'text-cyan-500'}`}>
                            {log.type}
                        </span>
                    </div>
                    <p className={`text-xs font-mono leading-relaxed ${log.type === 'MEMORY' ? 'text-purple-100 italic' : 'text-gray-300'}`}>
                        {log.text}
                    </p>
                </div>
            ))}
        </div>

        {/* Stats - Bottom Right (Actually distributed left/right) */}
        <div className="flex gap-4 items-end">
            {/* Health */}
            <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm border border-cyan-500/30 p-6 rounded-tr-2xl rounded-bl-lg">
            <Heart className={`w-8 h-8 ${healthColor}`} />
            <div>
                <div className={`text-4xl font-bold ${healthColor}`}>{Math.ceil(stats.health)}%</div>
                <div className="text-xs text-gray-400 uppercase">Integrity</div>
            </div>
            </div>

            {/* Ammo */}
            <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm border border-cyan-500/30 p-6 rounded-tl-2xl rounded-br-lg">
            <div className="text-right">
                <div className="text-4xl font-bold text-cyan-400">{stats.ammo}</div>
                <div className="text-xs text-gray-400 uppercase">Energy</div>
            </div>
            <Zap className="w-8 h-8 text-cyan-400" />
            </div>
        </div>
      </div>
      
      {/* Damage Overlay Effect */}
      {stats.health < 30 && (
         <div className="absolute inset-0 border-[20px] border-red-500/20 animate-pulse pointer-events-none rounded-lg mix-blend-overlay"></div>
      )}
    </div>
  );
};