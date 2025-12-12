import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LEVEL_MAP, TILE_SIZE, ENEMY_SPAWN_RATE } from '../constants';
import { Enemy, Bullet } from '../types';
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
  const enemiesToSpawn = 5 + (wave * 5); // Example scaling
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
    // Dynamic spawn rate based on wave
    const spawnRate = Math.max(500, ENEMY_SPAWN_RATE - (wave * 100));

    if (time - lastSpawnTime.current > spawnRate && enemies.length < 20 && enemiesSpawned.current < enemiesToSpawn) {
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

    // Scale enemy stats with wave
    const healthMult = 1 + (wave * 0.2);
    const speedMult = 1 + (wave * 0.05);

    const newEnemy: Enemy = {
      id: Math.random().toString(),
      position: { x: posX, y: 1.5, z: posZ },
      health: 100 * healthMult,
      speed: (2 + Math.random() * 2) * speedMult,
      type: Math.random() > 0.8 ? 'scourge_walker' : 'drone'
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

        // Move towards player
        if (distToPlayer > 1.5) {
          dirToPlayer.normalize().multiplyScalar(enemy.speed * delta);
          enemyPos.add(dirToPlayer);
        } else {
          // Attack Player
          onPlayerHit(0.5); // Damage per frame close contact
          if (Math.random() < 0.1) soundManager.playPlayerDamage(); // Limit sound frequency
        }

        // Projectile Collisions
        projectiles.forEach(proj => {
            const projPos = new THREE.Vector3(proj.position.x, proj.position.y, proj.position.z);
            const dist = projPos.distanceTo(enemyPos);
            if (dist < 1.5) {
                enemy.health -= proj.damage; // Use dynamic bullet damage
                onRemoveProjectile(proj.id);
                soundManager.playEnemyDamage();
                // Knockback
                const knockback = dirToPlayer.clone().normalize().multiplyScalar(-1);
                enemyPos.add(knockback);
            }
        });

        return { ...enemy, position: { x: enemyPos.x, y: enemyPos.y, z: enemyPos.z } };
      });

      // Filter dead enemies
      const alive = nextEnemies.filter(e => {
          if (e.health <= 0) {
              const pos = new THREE.Vector3(e.position.x, e.position.y, e.position.z);
              onEnemyKilled(100, pos);
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
  return (
    <group position={[enemy.position.x, enemy.position.y, enemy.position.z]}>
      {/* Main Body */}
      <mesh castShadow>
        {enemy.type === 'drone' ? (
          <icosahedronGeometry args={[0.8, 0]} />
        ) : (
          <boxGeometry args={[1, 2, 1]} />
        )}
        <meshStandardMaterial 
          color={enemy.type === 'drone' ? "#ff3333" : "#ff6600"} 
          emissive={enemy.type === 'drone' ? "#550000" : "#331100"}
          roughness={0.2}
        />
      </mesh>
      {/* Eye / Core */}
      <mesh position={[0, 0, 0.4]}>
          <sphereGeometry args={[0.3]} />
          <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
};