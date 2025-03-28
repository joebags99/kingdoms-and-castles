// src/types/phases.ts

// Define all possible game phases
export type PhaseType = 
  | 'SETUP'              // Initial game setup (capital placement)
  | 'RESOURCE'           // Collect resources
  | 'DRAW'               // Draw cards
  | 'DEVELOPMENT_1'      // First development phase (buildings, units)
  | 'MOVEMENT'           // Move units
  | 'COMBAT'             // Resolve combat
  | 'DEVELOPMENT_2'      // Second development phase 
  | 'END';               // End turn, check victory conditions

// Define phase data with display names and descriptions
export interface PhaseData {
  id: PhaseType;
  displayName: string;
  description: string;
  canPlaceUnits: boolean;
  canPlaceBuildings: boolean;
  canMoveUnits: boolean;
  canAttack: boolean;
  canPlayCards: boolean;
  canEndPhase: boolean;
}

// Define all phases with their properties
export const PHASES: Record<PhaseType, PhaseData> = {
  SETUP: {
    id: 'SETUP',
    displayName: 'Setup Phase',
    description: 'Place your capital to start the game.',
    canPlaceUnits: false,
    canPlaceBuildings: false,
    canMoveUnits: false,
    canAttack: false,
    canPlayCards: false,
    canEndPhase: true
  },
  RESOURCE: {
    id: 'RESOURCE',
    displayName: 'Resource Phase',
    description: 'Collect resources from your buildings and capital.',
    canPlaceUnits: false,
    canPlaceBuildings: false,
    canMoveUnits: false,
    canAttack: false,
    canPlayCards: false,
    canEndPhase: true
  },
  DRAW: {
    id: 'DRAW',
    displayName: 'Draw Phase',
    description: 'Draw a card from your deck.',
    canPlaceUnits: false,
    canPlaceBuildings: false,
    canMoveUnits: false,
    canAttack: false,
    canPlayCards: false,
    canEndPhase: true
  },
  DEVELOPMENT_1: {
    id: 'DEVELOPMENT_1',
    displayName: 'Development Phase',
    description: 'Deploy units and buildings to your kingdom.',
    canPlaceUnits: true,
    canPlaceBuildings: true,
    canMoveUnits: false,
    canAttack: false,
    canPlayCards: true,
    canEndPhase: true
  },
  MOVEMENT: {
    id: 'MOVEMENT',
    displayName: 'Movement Phase',
    description: 'Move your units across the battlefield.',
    canPlaceUnits: false,
    canPlaceBuildings: false,
    canMoveUnits: true,
    canAttack: false,
    canPlayCards: false,
    canEndPhase: true
  },
  COMBAT: {
    id: 'COMBAT',
    displayName: 'Combat Phase',
    description: 'Declare attacks against enemy units.',
    canPlaceUnits: false,
    canPlaceBuildings: false,
    canMoveUnits: false,
    canAttack: true,
    canPlayCards: false,
    canEndPhase: true
  },
  DEVELOPMENT_2: {
    id: 'DEVELOPMENT_2',
    displayName: 'Second Development Phase',
    description: 'Deploy additional units and buildings.',
    canPlaceUnits: true,
    canPlaceBuildings: true,
    canMoveUnits: false,
    canAttack: false,
    canPlayCards: true,
    canEndPhase: true
  },
  END: {
    id: 'END',
    displayName: 'End Phase',
    description: 'Resolve end-of-turn effects and check for victory.',
    canPlaceUnits: false,
    canPlaceBuildings: false,
    canMoveUnits: false,
    canAttack: false,
    canPlayCards: false,
    canEndPhase: true
  }
};

// Returns the next phase in sequence
export function getNextPhase(currentPhase: PhaseType): PhaseType {
  switch (currentPhase) {
    case 'SETUP':
      return 'RESOURCE';
    case 'RESOURCE':
      return 'DRAW';
    case 'DRAW':
      return 'DEVELOPMENT_1';
    case 'DEVELOPMENT_1':
      return 'MOVEMENT';
    case 'MOVEMENT':
      return 'COMBAT';
    case 'COMBAT':
      return 'DEVELOPMENT_2';
    case 'DEVELOPMENT_2':
      return 'END';
    case 'END':
      return 'RESOURCE'; // Loops back to start a new turn
    default:
      return 'RESOURCE';
  }
}