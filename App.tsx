import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls, Stars, Stats } from '@react-three/drei';
import { GameState, WeaponStats, LogMessage } from './types';
import { World } from './game/World';
import { HUD } from './components/HUD';
import { Menu } from './components/Menu';
import { Vector3 } from 'three';
import { soundManager } from './utils/SoundManager';
import { ZONE_CONFIG } from './constants';

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
  const [logs, setLogs] = useState<LogMessage[]>([]);
  
  const addLog = (text: string, type: 'SYSTEM' | 'MEMORY' | 'WARNING' = 'SYSTEM') => {
    const newLog: LogMessage = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      type,
      timestamp: Date.now()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 5)); // Keep last 5 logs
  };

  const startGame = () => {
    soundManager.resume();
    setGameState(GameState.PLAYING);
    setStats({ health: 100, ammo: 200, score: 0, wave: 1 });
    setWeaponStats(INITIAL_WEAPON_STATS);
    setLogs([]);
    
    // Intro Story
    setTimeout(() => addLog("BOOT SEQUENCE INITIATED...", 'SYSTEM'), 500);
    setTimeout(() => addLog("SUBJECT IDENTITY: AXIOS", 'SYSTEM'), 1500);
    setTimeout(() => addLog("ZONE 1: CRYO WING - BREACH DETECTED", 'WARNING'), 2500);
    setTimeout(() => addLog("OBJECTIVE: ESCAPE FACILITY", 'SYSTEM'), 3500);
  };

  const onGameOver = (score: number) => {
    setGameState(GameState.GAME_OVER);
    document.exitPointerLock();
  };

  const onVictory = () => {
    setGameState(GameState.VICTORY);
    document.exitPointerLock();
    addLog("TARGET ELIMINATED. SURFACE ACCESS GRANTED.", 'SYSTEM');
  };

  const onWaveComplete = () => {
    soundManager.playWaveComplete();
    // Check if we just beat the boss (Wave 5)
    if (stats.wave >= 5) {
      onVictory();
    } else {
      setGameState(GameState.UPGRADE_MENU);
      document.exitPointerLock();
    }
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

    // Determine next wave number
    const nextWave = stats.wave + 1;
    setStats(prev => ({ ...prev, wave: nextWave, ammo: prev.ammo + 100 })); // Bonus ammo
    setGameState(GameState.PLAYING);

    // Narrative & Zone Progression
    setTimeout(() => {
      addLog(`COMBAT SYSTEMS ADAPTED.`, 'SYSTEM');
      
      // Narrative for Zones
      if (nextWave === 3) {
        addLog(`ENTERING ZONE 2: WEAPONS RESEARCH`, 'SYSTEM');
        setTimeout(() => addLog(`MEMORY FRAGMENT: "I wasn't born. I was forged in this lab."`, 'MEMORY'), 2000);
      } else if (nextWave === 5) {
        addLog(`ENTERING ZONE 3: CENTRAL NEXUS`, 'WARNING');
        setTimeout(() => addLog(`WARNING: MASSIVE BIOLOGICAL SIGNAL DETECTED`, 'WARNING'), 2000);
        setTimeout(() => addLog(`IT'S THE SOURCE. THE SCOURGE BEAST.`, 'MEMORY'), 4000);
      } else if (nextWave === 2) {
         setTimeout(() => addLog(`ANALYSIS: Drone patterns suggest hive-mind control.`, 'MEMORY'), 1500);
      } else if (nextWave === 4) {
         setTimeout(() => addLog(`INTERNAL: These 'Hybrids'... they wear the same uniforms the scientists did.`, 'MEMORY'), 1500);
      }
    }, 1000);
  };

  const updateStats = useCallback((newStats: Partial<typeof stats>) => {
    setStats(prev => {
        // Check for low health trigger
        if (newStats.health && newStats.health < 30 && prev.health >= 30) {
            addLog("CRITICAL WARNING: ORGANIC SYSTEMS FAILING.", 'WARNING');
        }
        return { ...prev, ...newStats };
    });
  }, []);

  const getZoneColor = (wave: number) => {
     if (wave >= 5) return ZONE_CONFIG[3].fogColor;
     if (wave >= 3) return ZONE_CONFIG[2].fogColor;
     return ZONE_CONFIG[1].fogColor;
  };

  return (
    <div className="relative w-full h-full bg-black text-white font-mono">
      {/* 3D Scene */}
      <Canvas shadows camera={{ fov: 75 }}>
        <color attach="background" args={[getZoneColor(stats.wave)]} />
        <fog attach="fog" args={[getZoneColor(stats.wave), 0, 40]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {gameState === GameState.PLAYING && (
          <>
            <PointerLockControls />
            <ambientLight intensity={0.3} />
            {/* Dynamic light position/color based on zone could go here, but kept simple for now */}
            <pointLight position={[0, 20, 0]} intensity={0.6} />
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
        {gameState === GameState.PLAYING && <HUD stats={stats} logs={logs} />}
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