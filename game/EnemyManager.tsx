import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LEVEL_MAP, TILE_SIZE, ENEMY_SPAWN_RATE } from '../constants';
import { Enemy, Bullet, EnemyType } from '../types';
import { soundManager } from '../utils/SoundManager';

interface EnemyManagerProps {
  playerRef: React.RefObject<THREE.Group>;
  projectiles: Bullet[];
  onRemoveProjectile: (id: string) => void;
  onPlayerHit: (damage: number) => void;
  onEnemyKilled: (points: number, position: THREE.Vector3) => void;
  wave: number;
  onWaveComplete: () => void;
}

export const EnemyManager: React.FC<EnemyManagerProps> = ({ 
  playerRef, 
  projectiles, 
  onRemoveProjectile, 
  onPlayerHit,
  onEnemyKilled,
  wave,
  onWaveComplete
}) => {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const lastSpawnTime = useRef(0);
  
  // Wave state
  const enemiesSpawned = useRef(0);
  const enemiesToSpawn = wave >= 5 ? 1 : 8 + (wave * 3); // 1 boss on wave 5, else normal scaling
  const waveCompletedRef = useRef(false);

  // Reset wave tracking when wave changes
  useEffect(() => {
      enemiesSpawned.current = 0;
      waveCompletedRef.current = false;
      setEnemies([]);
  }, [wave]);

  // Spawning Logic
  useFrame((state) => {
    // Check wave completion
    if (!waveCompletedRef.current && enemiesSpawned.current >= enemiesToSpawn && enemies.length === 0) {
        waveCompletedRef.current = true;
        onWaveComplete();
        return;
    }

    const time = state.clock.getElapsedTime() * 1000;
    // Dynamic spawn rate based on wave, Boss wave stops spawning after boss appears
    const isBossWave = wave >= 5;
    const spawnRate = isBossWave ? 1000 : Math.max(500, ENEMY_SPAWN_RATE - (wave * 150));

    if (time - lastSpawnTime.current > spawnRate && enemies.length < 25 && enemiesSpawned.current < enemiesToSpawn) {
      lastSpawnTime.current = time;
      spawnEnemy();
    }
  });

  const spawnEnemy = () => {
    // Find random empty tile
    let x, z;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * LEVEL_MAP[0].length);
      z = Math.floor(Math.random() * LEVEL_MAP.length);
      attempts++;
    } while (LEVEL_MAP[z][x] !== 0 && attempts < 100);

    const mapWidth = LEVEL_MAP[0].length * TILE_SIZE;
    const mapDepth = LEVEL_MAP.length * TILE_SIZE;
    
    const posX = x * TILE_SIZE - mapWidth / 2 + TILE_SIZE / 2;
    const posZ = z * TILE_SIZE - mapDepth / 2 + TILE_SIZE / 2;

    // Don't spawn too close to player
    if (playerRef.current) {
        const dist = new THREE.Vector3(posX, 1, posZ).distanceTo(playerRef.current.position);
        if (dist < 10) return;
    }

    // Determine Enemy Type based on Wave/Zone
    let type: EnemyType = 'drone';
    let baseHealth = 100;
    let baseSpeed = 4;
    let baseDamage = 10;
    let yPos = 1.5;

    if (wave >= 5) {
        // BOSS WAVE
        type = 'boss';
        baseHealth = 2000;
        baseSpeed = 2;
        baseDamage = 50;
        yPos = 3; // Taller
    } else if (wave >= 3) {
        // ZONE 2: Research (Drones, Parasites, Hybrids)
        const rand = Math.random();
        if (rand < 0.3) {
            type = 'hybrid';
            baseHealth = 250;
            baseSpeed = 3;
            baseDamage = 20;
        } else if (rand < 0.6) {
            type = 'parasite';
            baseHealth = 60;
            baseSpeed = 7;
            baseDamage = 5;
            yPos = 0.5; // Low to ground
        }
    } else {
        // ZONE 1: Cryo (Mostly Drones, some Parasites)
        if (Math.random() < 0.2) {
             type = 'parasite';
             baseHealth = 50;
             baseSpeed = 6;
             baseDamage = 5;
             yPos = 0.5;
        }
    }
    
    // Slight random variation
    const healthMult = 1 + (wave * 0.1);
    
    const newEnemy: Enemy = {
      id: Math.random().toString(),
      position: { x: posX, y: yPos, z: posZ },
      health: baseHealth * healthMult,
      maxHealth: baseHealth * healthMult,
      speed: baseSpeed * (0.9 + Math.random() * 0.2),
      type: type,
      damage: baseDamage
    };

    setEnemies(prev => [...prev, newEnemy]);
    enemiesSpawned.current += 1;
  };

  // Game Loop for Enemies
  useFrame((state, delta) => {
    if (!playerRef.current) return;

    const playerPos = playerRef.current.position;

    setEnemies(prevEnemies => {
      const nextEnemies = prevEnemies.map(enemy => {
        const enemyPos = new THREE.Vector3(enemy.position.x, enemy.position.y, enemy.position.z);
        const dirToPlayer = new THREE.Vector3().subVectors(playerPos, enemyPos);
        const distToPlayer = dirToPlayer.length();

        // Behavior based on type
        let moveSpeed = enemy.speed;
        
        // Drone hovers
        if (enemy.type === 'drone') {
            enemyPos.y = 2 + Math.sin(state.clock.elapsedTime * 2 + parseInt(enemy.id)) * 0.5;
        }

        // Move towards player
        if (distToPlayer > (enemy.type === 'boss' ? 4 : 1.5)) {
          dirToPlayer.normalize().multiplyScalar(moveSpeed * delta);
          enemyPos.add(dirToPlayer);
        } else {
          // Attack Player
          // Boss hits harder but slower (simulated by frame rate damage accumulation, we reduce it for boss)
          const damageMult = enemy.type === 'boss' ? 0.2 : 1.0; 
          onPlayerHit(enemy.damage * delta * damageMult); 
          if (Math.random() < 0.05) soundManager.playPlayerDamage(); 
        }

        // Projectile Collisions
        projectiles.forEach(proj => {
            const projPos = new THREE.Vector3(proj.position.x, proj.position.y, proj.position.z);
            // Larger hitbox for boss
            const hitDist = enemy.type === 'boss' ? 3.0 : 1.5;
            const dist = projPos.distanceTo(enemyPos);
            
            if (dist < hitDist) {
                enemy.health -= proj.damage;
                onRemoveProjectile(proj.id);
                soundManager.playEnemyDamage();
                
                // Knockback (Boss is immune)
                if (enemy.type !== 'boss') {
                    const knockback = dirToPlayer.clone().normalize().multiplyScalar(-0.5);
                    enemyPos.add(knockback);
                }
            }
        });

        return { ...enemy, position: { x: enemyPos.x, y: enemyPos.y, z: enemyPos.z } };
      });

      // Filter dead enemies
      const alive = nextEnemies.filter(e => {
          if (e.health <= 0) {
              const pos = new THREE.Vector3(e.position.x, e.position.y, e.position.z);
              // Boss gives massive score
              const points = e.type === 'boss' ? 5000 : e.type === 'hybrid' ? 300 : 100;
              onEnemyKilled(points, pos);
              soundManager.playEnemyDeath();
              return false;
          }
          return true;
      });

      return alive;
    });
  });

  return (
    <group>
      {enemies.map(enemy => (
        <EnemyMesh key={enemy.id} enemy={enemy} />
      ))}
    </group>
  );
};

const EnemyMesh: React.FC<{ enemy: Enemy }> = ({ enemy }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
      if (meshRef.current) {
          // Look at player logic could go here, for now just simple idle anims
          if (enemy.type === 'drone') {
              meshRef.current.rotation.y += 0.05;
          } else if (enemy.type === 'parasite') {
               meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 15) * 0.2;
          }
      }
  });

  const getMaterial = () => {
      switch (enemy.type) {
          case 'boss': return <meshStandardMaterial color="#330000" emissive="#ff0000" emissiveIntensity={0.5} />;
          case 'parasite': return <meshStandardMaterial color="#00ff00" roughness={0.1} />;
          case 'hybrid': return <meshStandardMaterial color="#884400" roughness={0.5} />;
          default: return <meshStandardMaterial color="#0099ff" emissive="#002244" />;
      }
  };

  return (
    <group ref={meshRef} position={[enemy.position.x, enemy.position.y, enemy.position.z]}>
      
      {/* SCOURGE BEAST (BOSS) */}
      {enemy.type === 'boss' && (
          <group scale={[3, 3, 3]}>
              <mesh position={[0, 0.5, 0]}>
                  <dodecahedronGeometry args={[1]} />
                  {getMaterial()}
              </mesh>
              {/* Glowing Core */}
              <pointLight color="red" distance={10} intensity={2} />
          </group>
      )}

      {/* DRONE */}
      {enemy.type === 'drone' && (
          <group>
            <mesh>
                <icosahedronGeometry args={[0.5, 0]} />
                {getMaterial()}
            </mesh>
            <mesh position={[0, 0, 0.4]}>
                <sphereGeometry args={[0.2]} />
                <meshBasicMaterial color="cyan" />
            </mesh>
          </group>
      )}

      {/* PARASITE */}
      {enemy.type === 'parasite' && (
          <group scale={[0.5, 0.5, 0.5]}>
              <mesh position={[0, -0.5, 0]}>
                  <octahedronGeometry args={[1]} />
                  {getMaterial()}
              </mesh>
          </group>
      )}

      {/* HYBRID */}
      {enemy.type === 'hybrid' && (
          <group>
              <mesh position={[0, 0, 0]}>
                  <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
                  {getMaterial()}
              </mesh>
              {/* Visor */}
              <mesh position={[0, 0.4, 0.3]}>
                  <boxGeometry args={[0.5, 0.2, 0.2]} />
                  <meshBasicMaterial color="orange" />
              </mesh>
          </group>
      )}
      
      {/* Health Bar (Simple) */}
      {enemy.health < enemy.maxHealth && (
          <mesh position={[0, enemy.type === 'boss' ? 4 : 1.5, 0]}>
              <planeGeometry args={[1 * (enemy.health / enemy.maxHealth), 0.1]} />
              <meshBasicMaterial color="red" />
          </mesh>
      )}
    </group>
  );
};