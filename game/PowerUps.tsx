import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PowerUp, PowerUpType } from '../types';

interface PowerUpsProps {
  items: PowerUp[];
  playerRef: React.RefObject<THREE.Group>;
  onCollect: (id: string, type: PowerUpType, value: number) => void;
}

export const PowerUps: React.FC<PowerUpsProps> = ({ items, playerRef, onCollect }) => {
  return (
    <group>
      {items.map(item => (
        <PowerUpItem 
          key={item.id} 
          item={item} 
          playerRef={playerRef}
          onCollect={onCollect}
        />
      ))}
    </group>
  );
};

const PowerUpItem: React.FC<{
  item: PowerUp;
  playerRef: React.RefObject<THREE.Group>;
  onCollect: (id: string, type: PowerUpType, value: number) => void;
}> = ({ item, playerRef, onCollect }) => {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current || !playerRef.current) return;

    // Animation
    group.current.rotation.y += delta * 2;
    group.current.position.y = item.position.y + Math.sin(state.clock.elapsedTime * 3) * 0.2;

    // Collision
    const dist = group.current.position.distanceTo(playerRef.current.position);
    if (dist < 1.5) {
      onCollect(item.id, item.type, item.value);
    }
  });

  const getColor = () => {
    switch(item.type) {
      case 'HEALTH': return '#ff0000';
      case 'AMMO': return '#ffff00';
      case 'SCORE': return '#00ffff';
      default: return '#ffffff';
    }
  };

  return (
    <group ref={group} position={[item.position.x, item.position.y, item.position.z]}>
      {/* Icon Mesh */}
      <mesh>
        {item.type === 'HEALTH' && <boxGeometry args={[0.6, 0.6, 0.6]} />}
        {item.type === 'AMMO' && <octahedronGeometry args={[0.4]} />}
        {item.type === 'SCORE' && <dodecahedronGeometry args={[0.4]} />}
        <meshBasicMaterial color={getColor()} />
      </mesh>
      
      {/* Glow */}
      <pointLight color={getColor()} distance={3} decay={2} intensity={2} />
      
      {/* Ring */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.6, 0.05, 8, 32]} />
        <meshBasicMaterial color={getColor()} transparent opacity={0.5} />
      </mesh>
    </group>
  );
};