import React from 'react';
import { GameStats } from '../types';
import { Heart, Zap, Crosshair } from 'lucide-react';

export const HUD: React.FC<{ stats: GameStats }> = ({ stats }) => {
  // Determine health color
  const healthColor = stats.health > 50 ? 'text-cyan-400' : stats.health > 20 ? 'text-yellow-400' : 'text-red-500';

  return (
    <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/30 p-4 rounded-lg">
          <h1 className="text-xl font-bold text-cyan-500 tracking-widest">AXIOS UNIT</h1>
          <p className="text-xs text-gray-400">PROTOCOL: ESCAPE</p>
        </div>
        
        <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/30 p-4 rounded-lg flex flex-col items-end">
          <span className="text-2xl font-bold text-white tracking-widest">{stats.score.toString().padStart(6, '0')}</span>
          <span className="text-xs text-gray-400">SCORE</span>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="flex justify-between items-end">
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
            <div className="text-xs text-gray-400 uppercase">Energy Cells</div>
          </div>
          <Zap className="w-8 h-8 text-cyan-400" />
        </div>
      </div>
      
      {/* Damage Overlay Effect */}
      {stats.health < 30 && (
         <div className="absolute inset-0 border-[20px] border-red-500/20 animate-pulse pointer-events-none rounded-lg mix-blend-overlay"></div>
      )}
    </div>
  );
};