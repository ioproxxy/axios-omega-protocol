import React, { useMemo } from 'react';
import * as THREE from 'three';
import { LEVEL_MAP, TILE_SIZE, WALL_HEIGHT, ZONE_CONFIG } from '../constants';

interface LevelProps {
  wave: number;
}

export const Level: React.FC<LevelProps> = ({ wave }) => {
  // Determine Zone
  const zoneId = wave >= 5 ? 3 : wave >= 3 ? 2 : 1;
  const config = ZONE_CONFIG[zoneId as keyof typeof ZONE_CONFIG];

  const { walls, floor } = useMemo(() => {
    const wallGeoms: React.ReactElement[] = [];
    
    const mapWidth = LEVEL_MAP[0].length * TILE_SIZE;
    const mapDepth = LEVEL_MAP.length * TILE_SIZE;

    // Floor
    const floorMesh = (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[mapWidth, mapDepth]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.4} />
      </mesh>
    );

    // Ceiling
    const ceilingMesh = (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_HEIGHT, 0]}>
          <planeGeometry args={[mapWidth, mapDepth]} />
          <meshStandardMaterial color="#050505" emissive="#000000" />
        </mesh>
      );

    // Generate Walls
    LEVEL_MAP.forEach((row, z) => {
      row.forEach((tile, x) => {
        if (tile === 1) {
          const posX = x * TILE_SIZE - mapWidth / 2 + TILE_SIZE / 2;
          const posZ = z * TILE_SIZE - mapDepth / 2 + TILE_SIZE / 2;
          
          wallGeoms.push(
            <mesh key={`wall-${x}-${z}`} position={[posX, WALL_HEIGHT / 2, posZ]} castShadow receiveShadow>
              <boxGeometry args={[TILE_SIZE, WALL_HEIGHT, TILE_SIZE]} />
              <meshStandardMaterial 
                color={config.wallColor} 
                roughness={0.4} 
                metalness={0.6}
              />
              {/* Neon Trim */}
              <mesh position={[0, -WALL_HEIGHT/2 + 0.1, TILE_SIZE/2 + 0.01]}>
                 <boxGeometry args={[TILE_SIZE - 0.2, 0.2, 0.05]} />
                 <meshBasicMaterial color={config.lightColor} toneMapped={false} />
                 <pointLight distance={3} intensity={0.5} color={config.lightColor} />
              </mesh>
              {/* Vertical accent */}
              <mesh position={[TILE_SIZE/2 + 0.01, 0, 0]}>
                 <boxGeometry args={[0.05, WALL_HEIGHT - 0.5, 0.2]} />
                 <meshBasicMaterial color={config.lightColor} toneMapped={false} />
              </mesh>
            </mesh>
          );
        }
      });
    });

    return { walls: wallGeoms, floor: [floorMesh, ceilingMesh] };
  }, [config]);

  return (
    <group>
      {floor}
      {walls}
    </group>
  );
};