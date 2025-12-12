import React from 'react';
import { GameState, WeaponStats } from '../types';
import { Play, RotateCcw, ShieldAlert, Zap, Crosshair, Flame } from 'lucide-react';

interface MenuProps {
  gameState: GameState;
  startGame: () => void;
  score: number;
  onUpgrade?: (type: 'DAMAGE' | 'RATE' | 'MULTI') => void;
  weaponStats?: WeaponStats;
}

export const Menu: React.FC<MenuProps> = ({ gameState, startGame, score, onUpgrade, weaponStats }) => {
  return (
    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center pointer-events-auto text-center p-4 z-50">
      <div className="max-w-4xl w-full border border-cyan-900 bg-black/80 backdrop-blur-md p-12 rounded-2xl shadow-[0_0_50px_rgba(0,255,255,0.1)]">
        
        {gameState === GameState.MENU && (
          <>
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-700 mb-2 tracking-tighter">
              AXIOS
            </h1>
            <p className="text-xl text-cyan-500 tracking-[0.5em] mb-8 font-light">PROTOCOL OMEGA</p>
            
            <div className="space-y-4 mb-12 text-gray-400 font-mono text-sm border-l-2 border-cyan-800 pl-4 text-left mx-auto max-w-md">
              <p>{'>'} SYSTEM BOOT...</p>
              <p>{'>'} FACILITY STATUS: CRITICAL</p>
              <p>{'>'} THREAT DETECTED: THE SCOURGE</p>
              <p>{'>'} MISSION: SURVIVE. BREACH. ESCAPE.</p>
            </div>

            <button 
              onClick={startGame}
              className="group relative px-8 py-4 bg-cyan-900/20 hover:bg-cyan-500/20 border border-cyan-500 text-cyan-400 hover:text-white transition-all duration-300 uppercase tracking-widest font-bold text-lg w-full md:w-auto"
            >
              <span className="flex items-center justify-center gap-3">
                <Play className="w-5 h-5" /> Initialize
              </span>
              <div className="absolute inset-0 bg-cyan-400/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </button>
            
            <div className="mt-8 text-xs text-gray-600 font-mono">
              [W,A,S,D] Move | [MOUSE] Look | [CLICK] Fire
            </div>
          </>
        )}

        {gameState === GameState.GAME_OVER && (
          <>
            <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-5xl font-bold text-red-500 mb-4 tracking-tight">SIGNAL LOST</h2>
            <p className="text-gray-400 mb-8 font-mono">AXIOS UNIT DESTROYED</p>
            
            <div className="text-4xl font-mono text-white mb-12 border-b border-gray-800 pb-8">
              SCORE: <span className="text-cyan-400">{score}</span>
            </div>

            <button 
              onClick={startGame}
              className="px-8 py-4 bg-red-900/20 hover:bg-red-500/20 border border-red-500 text-red-400 hover:text-white transition-all duration-300 uppercase tracking-widest font-bold w-full md:w-auto flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Reboot System
            </button>
          </>
        )}

        {gameState === GameState.UPGRADE_MENU && onUpgrade && (
          <div className="animate-in fade-in zoom-in duration-300">
             <h2 className="text-4xl font-bold text-yellow-400 mb-2 tracking-tight">WAVE COMPLETE</h2>
             <p className="text-gray-400 mb-8 font-mono">SELECT WEAPON MODIFICATION</p>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Damage Upgrade */}
                <button 
                  onClick={() => onUpgrade('DAMAGE')}
                  className="group relative bg-black/50 border border-red-900 hover:border-red-500 p-6 rounded-lg transition-all hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] text-left"
                >
                  <Flame className="w-10 h-10 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-red-400 mb-2">PLASMA CHARGE</h3>
                  <p className="text-sm text-gray-400 mb-4">Increases projectile damage output.</p>
                  <div className="text-xs font-mono text-red-500">
                    CURRENT DMG: {weaponStats?.damage} <span className="text-white">→ {weaponStats ? weaponStats.damage + 15 : ''}</span>
                  </div>
                </button>

                {/* Fire Rate Upgrade */}
                <button 
                  onClick={() => onUpgrade('RATE')}
                  className="group relative bg-black/50 border border-yellow-900 hover:border-yellow-500 p-6 rounded-lg transition-all hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] text-left"
                >
                  <Zap className="w-10 h-10 text-yellow-500 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">ACCELERATOR</h3>
                  <p className="text-sm text-gray-400 mb-4">Reduces delay between shots.</p>
                  <div className="text-xs font-mono text-yellow-500">
                    DELAY: {weaponStats?.fireRate}ms <span className="text-white">→ {weaponStats ? Math.max(50, weaponStats.fireRate - 30) : ''}ms</span>
                  </div>
                </button>

                {/* Multi-shot Upgrade */}
                <button 
                  onClick={() => onUpgrade('MULTI')}
                  className="group relative bg-black/50 border border-cyan-900 hover:border-cyan-500 p-6 rounded-lg transition-all hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] text-left"
                >
                  <Crosshair className="w-10 h-10 text-cyan-500 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">SPLIT CHAMBER</h3>
                  <p className="text-sm text-gray-400 mb-4">Adds additional projectiles per shot.</p>
                  <div className="text-xs font-mono text-cyan-500">
                    PROJECTILES: {weaponStats?.projectileCount} <span className="text-white">→ {weaponStats ? weaponStats.projectileCount + 1 : ''}</span>
                  </div>
                </button>

             </div>
          </div>
        )}

      </div>
    </div>
  );
};