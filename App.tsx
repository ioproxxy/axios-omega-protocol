import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls, Stars, Stats } from '@react-three/drei';
import { GameState, WeaponStats } from './types';
import { World } from './game/World';
import { HUD } from './components/HUD';
import { Menu } from './components/Menu';
import { Vector3 } from 'three';
import { soundManager } from './utils/SoundManager';

const INITIAL_WEAPON_STATS: WeaponStats = {
  damage: 35,
  fireRate: 200,
  projectileCount: 1,
  spread: 0.1
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [stats, setStats] = useState({ health: 100, ammo: 100, score: 0, wave: 1 });
  const [weaponStats, setWeaponStats] = useState<WeaponStats>(INITIAL_WEAPON_STATS);
  
  const startGame = () => {
    soundManager.resume();
    setGameState(GameState.PLAYING);
    setStats({ health: 100, ammo: 200, score: 0, wave: 1 });
    setWeaponStats(INITIAL_WEAPON_STATS);
  };

  const onGameOver = (score: number) => {
    setGameState(GameState.GAME_OVER);
    document.exitPointerLock();
  };

  const onVictory = () => {
    setGameState(GameState.VICTORY);
    document.exitPointerLock();
  };

  const onWaveComplete = () => {
    soundManager.playWaveComplete();
    setGameState(GameState.UPGRADE_MENU);
    document.exitPointerLock();
  };

  const handleUpgrade = (type: 'DAMAGE' | 'RATE' | 'MULTI') => {
    soundManager.playPowerup();
    setWeaponStats(prev => {
      const next = { ...prev };
      switch (type) {
        case 'DAMAGE':
          next.damage += 15;
          break;
        case 'RATE':
          next.fireRate = Math.max(50, next.fireRate - 30);
          break;
        case 'MULTI':
          next.projectileCount += 1;
          next.spread += 0.05;
          break;
      }
      return next;
    });
    // Start next wave
    setStats(prev => ({ ...prev, wave: prev.wave + 1, ammo: prev.ammo + 50 })); // Bonus ammo
    setGameState(GameState.PLAYING);
  };

  const updateStats = useCallback((newStats: Partial<typeof stats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  }, []);

  return (
    <div className="relative w-full h-full bg-black text-white font-mono">
      {/* 3D Scene */}
      <Canvas shadows camera={{ fov: 75 }}>
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 0, 30]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {gameState === GameState.PLAYING && (
          <>
            <PointerLockControls />
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={0.5} />
            <World 
              gameState={gameState}
              onGameOver={onGameOver}
              onVictory={onVictory}
              onWaveComplete={onWaveComplete}
              updateStats={updateStats}
              stats={stats}
              weaponStats={weaponStats}
            />
          </>
        )}
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {gameState === GameState.PLAYING && <HUD stats={stats} />}
        {gameState !== GameState.PLAYING && (
          <Menu 
            gameState={gameState} 
            startGame={startGame} 
            score={stats.score}
            onUpgrade={handleUpgrade}
            weaponStats={weaponStats}
          />
        )}
      </div>

      {/* Crosshair */}
      {gameState === GameState.PLAYING && (
        <div className="crosshair">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="2" fill="#00FFEA" />
            <path d="M20 10V4" stroke="#00FFEA" strokeWidth="2" />
            <path d="M20 36V30" stroke="#00FFEA" strokeWidth="2" />
            <path d="M30 20H36" stroke="#00FFEA" strokeWidth="2" />
            <path d="M4 20H10" stroke="#00FFEA" strokeWidth="2" />
            {/* Dynamic Crosshair spread indicator */}
            {weaponStats.projectileCount > 1 && (
               <>
                 <circle cx="20" cy="20" r={4 + weaponStats.spread * 20} stroke="#00FFEA" strokeWidth="1" strokeOpacity="0.5" />
               </>
            )}
          </svg>
        </div>
      )}
    </div>
  );
};

export default App;