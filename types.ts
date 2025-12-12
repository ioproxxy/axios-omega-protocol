export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  UPGRADE_MENU = 'UPGRADE_MENU'
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type EnemyType = 'drone' | 'parasite' | 'hybrid' | 'boss';

export interface Enemy {
  id: string;
  position: Vector3;
  health: number;
  maxHealth: number;
  speed: number;
  type: EnemyType;
  damage: number;
}

export interface Bullet {
  id: string;
  position: Vector3;
  direction: Vector3;
  damage: number;
  createdAt: number;
}

export interface Destructible {
  id: string;
  position: Vector3;
  health: number;
  maxHealth: number;
}

export type PowerUpType = 'HEALTH' | 'AMMO' | 'SCORE';

export interface PowerUp {
  id: string;
  position: Vector3;
  type: PowerUpType;
  value: number;
}

export interface WeaponStats {
  damage: number;
  fireRate: number; // ms delay
  projectileCount: number;
  spread: number;
}

export interface GameStats {
  health: number;
  ammo: number;
  score: number;
  wave: number;
}

export interface LogMessage {
  id: string;
  text: string;
  type: 'SYSTEM' | 'MEMORY' | 'WARNING';
  timestamp: number;
}