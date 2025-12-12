import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Destructible, Bullet } from '../types';

interface DestructiblesProps {
  items: Destructible[];
  projectiles: Bullet[];
  onRemoveProjectile: (id: string) => void;
  onDestroy: (id: string, position: THREE.Vector3) => void;
}

export const Destructibles: React.FC<DestructiblesProps> = ({ 
  items, 
  projectiles, 
  onRemoveProjectile, 
  onDestroy 
}) => {
  // We keep a local health state to avoid full re-renders on every hit if possible,
  // but for simplicity in this architecture we'll just derive from props or use internal tracking 
  // synced with parent if we wanted complex partial damage visuals.
  // For now, the parent handles the state update, we just detect collision.
  
  return (
    <group>
      {items.map(item => (
        <DestructibleItem 
          key={item.id} 
          item={item} 
          projectiles={projectiles}
          onRemoveProjectile={onRemoveProjectile}
          onDestroy={onDestroy}
        />
      ))}
    </group>
  );
};

const DestructibleItem: React.FC<{
  item: Destructible;
  projectiles: Bullet[];
  onRemoveProjectile: (id: string) => void;
  onDestroy: (id: string, pos: THREE.Vector3) => void;
}> = ({ item, projectiles, onRemoveProjectile, onDestroy }) => {
  const mesh = useRef<THREE.Mesh>(null);
  const [flash, setFlash] = useState(0);

  useFrame((state, delta) => {
    if (flash > 0) setFlash(Math.max(0, flash - delta * 5));

    // Simple collision check
    const myPos = new THREE.Vector3(item.position.x, item.position.y, item.position.z);
    
    projectiles.forEach(proj => {
      const projPos = new THREE.Vector3(proj.position.x, proj.position.y, proj.position.z);
      if (projPos.distanceTo(myPos) < 1.5) { // Box radius approx
        onRemoveProjectile(proj.id);
        setFlash(1);
        // Trigger damage in parent logic
        onDestroy(item.id, myPos); 
      }
    });
  });

  return (
    <mesh 
      ref={mesh} 
      position={[item.position.x, item.position.y, item.position.z]} 
      castShadow 
      receiveShadow
    >
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial 
        color={flash > 0 ? '#ffffff' : '#cd7f32'} // Flash white on hit, else bronze/crate color
        roughness={0.8}
        metalness={0.2}
      />
      {/* Decorative framing */}
      <mesh position={[0, 0, 0]} scale={[1.05, 1.05, 1.05]}>
         <boxGeometry args={[2, 2, 2]} />
         <meshBasicMaterial color="#ff9900" wireframe />
      </mesh>
    </mesh>
  );
};