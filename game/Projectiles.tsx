import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BULLET_SPEED } from '../constants';

export const Projectiles: React.FC<{ items: any[], onRemove: (id: string) => void }> = ({ items, onRemove }) => {
  return (
    <group>
      {items.map(item => (
        <Bullet key={item.id} {...item} onRemove={onRemove} />
      ))}
    </group>
  );
};

const Bullet: React.FC<any> = ({ id, position, direction, createdAt, onRemove }) => {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (!mesh.current) return;
    
    // Move
    const moveDist = direction.clone().multiplyScalar(BULLET_SPEED * delta);
    mesh.current.position.add(moveDist);

    // Lifetime check
    if (Date.now() - createdAt > 2000) {
        onRemove(id);
    }
  });

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshBasicMaterial color="#00FFEA" />
      <pointLight distance={3} intensity={2} color="#00FFEA" />
    </mesh>
  );
};