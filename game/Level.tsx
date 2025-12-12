import React, { useMemo } from 'react';
import * as THREE from 'three';
import { LEVEL_MAP, TILE_SIZE, WALL_HEIGHT } from '../constants';

export const Level: React.FC = () => {
  const { walls, floor } = useMemo(() => {
    const wallGeoms: React.ReactElement[] = [];
    
    const mapWidth = LEVEL_MAP[0].length * TILE_SIZE;
    const mapDepth = LEVEL_MAP.length * TILE_SIZE;

    // Floor
    const floorMesh = (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[mapWidth, mapDepth]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>
    );

    // Ceiling
    const ceilingMesh = (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_HEIGHT, 0]}>
          <planeGeometry args={[mapWidth, mapDepth]} />
          <meshStandardMaterial color="#0a0a0a" emissive="#050505" />
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
                color="#333" 
                roughness={0.5} 
                metalness={0.7}
                map={null} 
              />
              {/* Add some neon trim to walls */}
              <mesh position={[0, -WALL_HEIGHT/2 + 0.1, TILE_SIZE/2 + 0.01]}>
                 <boxGeometry args={[TILE_SIZE - 0.2, 0.2, 0.05]} />
                 <meshBasicMaterial color="#00ffcc" />
              </mesh>
            </mesh>
          );
        }
      });
    });

    return { walls: wallGeoms, floor: [floorMesh, ceilingMesh] };
  }, []);

  return (
    <group>
      {floor}
      {walls}
      {/* Ambient particles or details could go here */}
    </group>
  );
};