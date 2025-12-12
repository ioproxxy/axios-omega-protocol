import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Player } from './Player';
import { Level } from './Level';
import { EnemyManager } from './EnemyManager';
import { Projectiles } from './Projectiles';
import { Destructibles } from './Destructibles';
import { PowerUps } from './PowerUps';
import { GameState, Destructible, PowerUp, PowerUpType, WeaponStats } from '../types';
import { TILE_SIZE, LEVEL_MAP } from '../constants';
import { soundManager } from '../utils/SoundManager';

interface WorldProps {
  gameState: GameState;
  onGameOver: (score: number) => void;
  onVictory: () => void;
  onWaveComplete: () => void;
  updateStats: (stats: any) => void;
  stats: any;
  weaponStats: WeaponStats;
}

export const World: React.FC<WorldProps> = ({ gameState, onGameOver, onVictory, onWaveComplete, updateStats, stats, weaponStats }) => {
  const playerRef = useRef<THREE.Group>(null);
  const [projectiles, setProjectiles] = useState<any[]>([]);
  const [destructibles, setDestructibles] = useState<Destructible[]>([]);
  const [powerups, setPowerups] = useState<PowerUp[]>([]);
  
  // Find a valid spawn point (first empty tile)
  const getSpawnPoint = () => {
    for (let z = 0; z < LEVEL_MAP.length; z++) {
      for (let x = 0; x < LEVEL_MAP[z].length; x++) {
        if (LEVEL_MAP[z][x] === 0) {
          return new THREE.Vector3(
            x * TILE_SIZE - (LEVEL_MAP[0].length * TILE_SIZE) / 2 + TILE_SIZE/2,
            1,
            z * TILE_SIZE - (LEVEL_MAP.length * TILE_SIZE) / 2 + TILE_SIZE/2
          );
        }
      }
    }
    return new THREE.Vector3(0, 1, 0);
  };

  const spawnPoint = useRef(getSpawnPoint()).current;

  // Initialize Destructibles randomly
  useEffect(() => {
    const initialDestructibles: Destructible[] = [];
    const mapWidth = LEVEL_MAP[0].length * TILE_SIZE;
    const mapDepth = LEVEL_MAP.length * TILE_SIZE;

    // Spawn 15 crates
    for(let i=0; i<15; i++) {
        let x, z;
        let attempts = 0;
        let valid = false;
        
        while(!valid && attempts < 50) {
            x = Math.floor(Math.random() * LEVEL_MAP[0].length);
            z = Math.floor(Math.random() * LEVEL_MAP.length);
            // Check if empty floor
            if(LEVEL_MAP[z][x] === 0) {
                const posX = x * TILE_SIZE - mapWidth / 2 + TILE_SIZE / 2;
                const posZ = z * TILE_SIZE - mapDepth / 2 + TILE_SIZE / 2;
                const pos = new THREE.Vector3(posX, 1, posZ);
                
                // Don't spawn on top of player
                if(pos.distanceTo(spawnPoint) > 5) {
                    valid = true;
                    initialDestructibles.push({
                        id: `crate-${i}`,
                        position: {x: posX, y: 1, z: posZ},
                        health: 30,
                        maxHealth: 30
                    });
                }
            }
            attempts++;
        }
    }
    setDestructibles(initialDestructibles);
  }, []);

  // Cleanup projectiles that are too old or hit something
  const removeProjectile = (id: string) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
  };

  const addProjectile = (position: THREE.Vector3, direction: THREE.Vector3) => {
    const id = Math.random().toString(36).substr(2, 9);
    setProjectiles(prev => [...prev, { 
        id, 
        position: position.clone(), 
        direction: direction.clone(), 
        damage: weaponStats.damage, // Snapshot damage at time of firing
        createdAt: Date.now() 
    }]);
  };

  const spawnPowerUp = (pos: THREE.Vector3) => {
      const typeRand = Math.random();
      let type: PowerUpType = 'SCORE';
      let value = 100;

      if(typeRand < 0.3) {
          type = 'HEALTH';
          value = 25;
      } else if (typeRand < 0.6) {
          type = 'AMMO';
          value = 50;
      }

      const id = Math.random().toString(36).substr(2, 9);
      setPowerups(prev => [...prev, {
          id,
          position: {x: pos.x, y: 1, z: pos.z},
          type,
          value
      }]);
  };

  const handleDestructibleHit = (id: string, pos: THREE.Vector3) => {
      setDestructibles(prev => {
          const target = prev.find(d => d.id === id);
          if(!target) return prev;
          
          const newHealth = target.health - weaponStats.damage;
          if(newHealth <= 0) {
              // Destroyed
              soundManager.playCrateBreak();
              if(Math.random() > 0.5) spawnPowerUp(pos);
              return prev.filter(d => d.id !== id);
          } else {
              // Update health
              return prev.map(d => d.id === id ? {...d, health: newHealth} : d);
          }
      });
  };

  const handleCollectPowerUp = (id: string, type: PowerUpType, value: number) => {
      soundManager.playPowerup();
      // Apply effects
      if (type === 'HEALTH') {
          updateStats({ health: Math.min(100, stats.health + value) });
      } else if (type === 'AMMO') {
          updateStats({ ammo: stats.ammo + value });
      } else if (type === 'SCORE') {
          updateStats({ score: stats.score + value });
      }
      
      // Remove
      setPowerups(prev => prev.filter(p => p.id !== id));
  };

  return (
    <>
      <group>
        <Level wave={stats.wave} />
        <Destructibles 
            items={destructibles} 
            projectiles={projectiles} 
            onRemoveProjectile={removeProjectile}
            onDestroy={handleDestructibleHit}
        />
        <PowerUps 
            items={powerups} 
            playerRef={playerRef} 
            onCollect={handleCollectPowerUp} 
        />
        <Player 
          ref={playerRef} 
          position={spawnPoint} 
          onShoot={addProjectile}
          updateStats={updateStats}
          currentAmmo={stats.ammo}
          destructibles={destructibles}
          weaponStats={weaponStats}
        />
        <EnemyManager 
          playerRef={playerRef} 
          projectiles={projectiles} 
          onRemoveProjectile={removeProjectile}
          onPlayerHit={(damage) => {
            const newHealth = Math.max(0, stats.health - damage);
            updateStats({ health: newHealth });
            if (newHealth <= 0) onGameOver(stats.score);
          }}
          onEnemyKilled={(points, pos) => {
              updateStats({ score: stats.score + points });
              if (Math.random() < 0.3 && pos) spawnPowerUp(pos);
          }}
          wave={stats.wave}
          onWaveComplete={onWaveComplete}
        />
        <Projectiles items={projectiles} onRemove={removeProjectile} />
      </group>
    </>
  );
};