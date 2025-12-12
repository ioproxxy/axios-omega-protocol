import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PLAYER_SPEED, LEVEL_MAP, TILE_SIZE } from '../constants';
import { useKeyboard } from '../hooks/useKeyboard';
import { Destructible, WeaponStats } from '../types';
import { soundManager } from '../utils/SoundManager';

interface PlayerProps {
  position: THREE.Vector3;
  onShoot: (pos: THREE.Vector3, dir: THREE.Vector3) => void;
  updateStats: (stats: any) => void;
  currentAmmo: number;
  destructibles: Destructible[];
  weaponStats: WeaponStats;
}

export const Player = forwardRef<THREE.Group, PlayerProps>(({ position, onShoot, updateStats, currentAmmo, destructibles, weaponStats }, ref) => {
  const { camera } = useThree();
  const innerRef = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3());
  const lastShootTime = useRef(0);
  const lastStepTime = useRef(0);
  const keys = useKeyboard();
  
  // Expose the group ref to parent
  useImperativeHandle(ref, () => innerRef.current!);

  useEffect(() => {
    if (innerRef.current) {
      innerRef.current.position.copy(position);
    }
  }, [position]);

  useFrame((state, delta) => {
    if (!innerRef.current) return;

    // Movement Logic
    const speed = PLAYER_SPEED * delta;
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, Number(keys.current.backward) - Number(keys.current.forward));
    const sideVector = new THREE.Vector3(Number(keys.current.left) - Number(keys.current.right), 0, 0);

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(speed)
      .applyEuler(camera.rotation);

    // Footstep Sound
    if (direction.lengthSq() > 0) {
       const now = Date.now();
       if (now - lastStepTime.current > 400) { // 400ms interval for steps
           soundManager.playFootstep();
           lastStepTime.current = now;
       }
    }

    // Proposed next position
    const nextPos = innerRef.current.position.clone().add(direction);
    
    // 1. Grid Collision
    const mapWidth = LEVEL_MAP[0].length * TILE_SIZE;
    const mapDepth = LEVEL_MAP.length * TILE_SIZE;
    const xOffset = mapWidth / 2;
    const zOffset = mapDepth / 2;

    const gridX = Math.floor((nextPos.x + xOffset) / TILE_SIZE);
    const gridZ = Math.floor((nextPos.z + zOffset) / TILE_SIZE);

    let canMove = true;

    // Check map bounds and walls
    if (gridZ >= 0 && gridZ < LEVEL_MAP.length && gridX >= 0 && gridX < LEVEL_MAP[0].length) {
      if (LEVEL_MAP[gridZ][gridX] !== 0) {
        canMove = false;
        // Basic sliding
         const gridXOnly = Math.floor((innerRef.current.position.x + direction.x + xOffset) / TILE_SIZE);
         const currentGridZ = Math.floor((innerRef.current.position.z + zOffset) / TILE_SIZE);
         if (LEVEL_MAP[currentGridZ][gridXOnly] === 0) {
             direction.z = 0;
             canMove = true;
         } else {
             const gridZOnly = Math.floor((innerRef.current.position.z + direction.z + zOffset) / TILE_SIZE);
             const currentGridX = Math.floor((innerRef.current.position.x + xOffset) / TILE_SIZE);
             if (LEVEL_MAP[gridZOnly][currentGridX] === 0) {
                 direction.x = 0;
                 canMove = true;
             }
         }
      }
    } else {
        canMove = false;
    }

    // 2. Destructible Collision
    if (canMove) {
        const potentialPos = innerRef.current.position.clone().add(direction);
        for (const dest of destructibles) {
            const destPos = new THREE.Vector3(dest.position.x, dest.position.y, dest.position.z);
            if (potentialPos.distanceTo(destPos) < 1.5) {
                canMove = false;
                break;
            }
        }
    }

    if (canMove) {
        innerRef.current.position.add(direction);
    }

    // Sync camera to player
    camera.position.copy(innerRef.current.position);

    // Shooting
    if (keys.current.shoot && Date.now() - lastShootTime.current > weaponStats.fireRate && currentAmmo > 0) {
      lastShootTime.current = Date.now();
      
      const mainShootDir = new THREE.Vector3();
      camera.getWorldDirection(mainShootDir);
      
      const right = new THREE.Vector3(1, 0, 0).applyEuler(camera.rotation);
      const up = new THREE.Vector3(0, 1, 0).applyEuler(camera.rotation);
      const spawnPos = camera.position.clone()
        .add(mainShootDir.clone().multiplyScalar(0.5))
        .add(right.clone().multiplyScalar(0.2))
        .add(up.clone().multiplyScalar(-0.2));

      // Multi-shot logic
      const count = weaponStats.projectileCount;
      const spread = weaponStats.spread;

      for(let i = 0; i < count; i++) {
          const dir = mainShootDir.clone();
          if (count > 1) {
              // Apply spread
              const offsetX = (Math.random() - 0.5) * spread;
              const offsetY = (Math.random() - 0.5) * spread;
              dir.add(right.clone().multiplyScalar(offsetX));
              dir.add(up.clone().multiplyScalar(offsetY));
              dir.normalize();
          }
          onShoot(spawnPos, dir);
      }
      
      updateStats({ ammo: Math.max(0, currentAmmo - 1) });
      
      // Play Sound
      const pitch = 800 + Math.random() * 200;
      soundManager.playShoot(pitch);
      
      // Screen shake based on projectile count (more kick)
      camera.position.y += Math.random() * 0.05 * Math.sqrt(count);
    }
  });

  return (
    <group ref={innerRef}>
      <mesh visible={false}>
        <sphereGeometry args={[0.5]} />
        <meshBasicMaterial color="green" />
      </mesh>
    </group>
  );
});