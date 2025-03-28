// src/types/gameState.ts
import { PhaseType } from './phases';
import { ResourcePool, createEmptyResourcePool } from './resources';
import { Unit } from './units';

// Define the hex data structure
export interface HexData {
  id: string;
  q: number;
  r: number;
  s: number;
  terrain: 'plain' | 'mountain' | 'forest' | 'river' | 'magic';
  owner: PlayerID;
  unit?: Unit;
  building?: Building;
}

// Player identifiers
export type PlayerID = 'player1' | 'player2' | 'neutral';

// Nation identifiers (matches unit factions)
export type NationID = 'altaria' | 'cartasia' | 'durandur' | 'belaklara' | 'void';

// Building types
export type BuildingType = 'resource' | 'defense' | 'utility';

// Building interface
export interface Building {
  id: string;
  name: string;
  type: BuildingType;
  owner: PlayerID;
  effects: Effect[];
  resourceGeneration?: ResourcePool;
}

// Effect interface for abilities and building effects
export interface Effect {
  type: string;
  value: any;
  description: string;
}

// Card interface for the player's hand
export interface Card {
  id: string;
  name: string;
  type: 'unit' | 'building' | 'intrigue';
  cost: ResourcePool;
  effects: Effect[];
  description: string;
  unit?: Unit;
  building?: Building;
}

// Player state interface
export interface PlayerState {
  id: PlayerID;
  nation: NationID;
  resources: ResourcePool;
  hand: Card[];
  deck: Card[];
  discard: Card[];
  unitsPlaced: number;
  buildingsPlaced: number;
  capitalHex?: HexData;
  capital?: Unit;
  selectedCard: Card | null;
  selectedHex: HexData | null;
  hasDrawnCard: boolean;
}

// Game state interface
export interface GameState {
    players: Record<PlayerID, PlayerState>;
    currentPlayer: PlayerID;
    currentPhase: PhaseType;
    turn: number;
    round: number; // Add this line to track game rounds
    hexes: HexData[];
    lastAction: string;
    gameOver: boolean;
    winner: PlayerID | null;
    log: string[];
  }

// Create an initial player state
export const createInitialPlayerState = (
  id: PlayerID, 
  nation: NationID
): PlayerState => {
  return {
    id,
    nation,
    resources: createEmptyResourcePool(),
    hand: [],
    deck: [],
    discard: [],
    unitsPlaced: 0,
    buildingsPlaced: 0,
    selectedCard: null,
    selectedHex: null,
    hasDrawnCard: false
  };
};

// Create initial game state
export const createInitialGameState = (): GameState => {
    return {
      players: {
        player1: createInitialPlayerState('player1', 'altaria'),
        player2: createInitialPlayerState('player2', 'cartasia'),
        neutral: createInitialPlayerState('neutral', 'altaria') // Placeholder for neutral "player"
      },
      currentPlayer: 'player1',
      currentPhase: 'SETUP',
      turn: 0, // Starting at 0 since SETUP doesn't count as a turn
      round: 0, // Starting at 0 since SETUP doesn't count as a round
      hexes: [],
      lastAction: 'Game started',
      gameOver: false,
      winner: null,
      log: ['Game initialized']
    };
  };

// Check if a player can perform an action based on the current phase
export const canPerformAction = (
  gameState: GameState, 
  action: 'placeUnit' | 'placeBuilding' | 'moveUnit' | 'attack' | 'playCard'
): boolean => {
  const { currentPhase } = gameState;
  
  switch (action) {
    case 'placeUnit':
      return ['DEVELOPMENT_1', 'DEVELOPMENT_2'].includes(currentPhase);
    case 'placeBuilding':
      return ['DEVELOPMENT_1', 'DEVELOPMENT_2'].includes(currentPhase);
    case 'moveUnit':
      return currentPhase === 'MOVEMENT';
    case 'attack':
      return currentPhase === 'COMBAT';
    case 'playCard':
      return ['DEVELOPMENT_1', 'DEVELOPMENT_2'].includes(currentPhase);
    default:
      return false;
  }
};

// Add an entry to the game log
export const addToGameLog = (
  gameState: GameState, 
  message: string
): GameState => {
  return {
    ...gameState,
    log: [...gameState.log, message],
    lastAction: message
  };
};

// Check for victory conditions
export const checkVictoryConditions = (gameState: GameState): GameState => {
  // Check if either player's capital is destroyed
  const { player1, player2 } = gameState.players;
  
  if (player1.capital && player1.capital.hitPoints <= 0) {
    return {
      ...gameState,
      gameOver: true,
      winner: 'player2',
      log: [...gameState.log, 'Player 2 wins - Altaria capital destroyed!']
    };
  }
  
  if (player2.capital && player2.capital.hitPoints <= 0) {
    return {
      ...gameState,
      gameOver: true,
      winner: 'player1',
      log: [...gameState.log, 'Player 1 wins - Cartasia capital destroyed!']
    };
  }
  
  // Optional domination victory (controlling all six border hexes)
  const borderHexes = gameState.hexes.filter(hex => hex.r === 0);
  const player1BorderHexCount = borderHexes.filter(hex => 
    hex.owner === 'player1' || (hex.unit && hex.unit.faction === 'altaria')
  ).length;
  
  const player2BorderHexCount = borderHexes.filter(hex => 
    hex.owner === 'player2' || (hex.unit && hex.unit.faction === 'cartasia')
  ).length;
  
  if (player1BorderHexCount === 6) {
    return {
      ...gameState,
      gameOver: true,
      winner: 'player1',
      log: [...gameState.log, 'Player 1 wins - Border domination achieved!']
    };
  }
  
  if (player2BorderHexCount === 6) {
    return {
      ...gameState,
      gameOver: true,
      winner: 'player2',
      log: [...gameState.log, 'Player 2 wins - Border domination achieved!']
    };
  }
  
  return gameState;
};