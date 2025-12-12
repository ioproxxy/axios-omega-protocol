export const PLAYER_SPEED = 5;
export const PLAYER_RUN_SPEED = 8;
export const FIRE_RATE = 150; // ms
export const BULLET_SPEED = 40;
export const ENEMY_SPAWN_RATE = 2000;
export const MAX_HEALTH = 100;
export const MAP_SIZE = 50;
export const WALL_HEIGHT = 4;

// Simple map definition: 1 = wall, 0 = floor
// A simple arena layout
export const LEVEL_MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const TILE_SIZE = 4;

export const ZONE_CONFIG = {
  1: { name: "ZONE 1: CRYO WING", fogColor: '#001133', wallColor: '#223344', lightColor: '#00ffff' },
  2: { name: "ZONE 2: WEAPONS RESEARCH", fogColor: '#331100', wallColor: '#442211', lightColor: '#ff3300' },
  3: { name: "ZONE 3: CENTRAL NEXUS", fogColor: '#110022', wallColor: '#220033', lightColor: '#cc00ff' }
};