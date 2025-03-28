// src/types/resources.ts

// Resource types in the game
export type ResourceType = 'faith' | 'chaos' | 'gold' | 'magic' | 'blood';

// Resource data with color and description
export interface ResourceData {
  type: ResourceType;
  name: string;
  color: string;
  description: string;
}

// Resources data for UI display
export const RESOURCES: Record<ResourceType, ResourceData> = {
  faith: {
    type: 'faith',
    name: 'Faith',
    color: '#ffcc00', // Gold
    description: 'Divine power and healing'
  },
  chaos: {
    type: 'chaos',
    name: 'Chaos',
    color: '#9933cc', // Purple
    description: 'Destruction and unpredictability'
  },
  gold: {
    type: 'gold',
    name: 'Gold',
    color: '#ffaa00', // Orange-gold
    description: 'Economy and mercenary forces'
  },
  magic: {
    type: 'magic',
    name: 'Magic',
    color: '#00ccff', // Blue
    description: 'Arcane power and control'
  },
  blood: {
    type: 'blood',
    name: 'Blood',
    color: '#cc0000', // Red
    description: 'Life force and aggression'
  }
};

// Nation resource affinities
export interface NationResources {
  [key: string]: ResourceType[];
}

// Define which resources each nation uses
export const NATION_RESOURCES: NationResources = {
  altaria: ['faith'],
  belaklara: ['gold'],
  void: ['chaos'],
  durandur: ['magic'],
  cartasia: ['blood'],
  // Dual-resource nations (simplified from the 10 mentioned in rules)
  celestialEmpire: ['faith', 'magic'],
  blackCouncil: ['blood', 'chaos'],
  mercenaryGuild: ['gold', 'blood'],
  chaosScholars: ['chaos', 'magic'],
  divineCommerce: ['faith', 'gold']
};

// Player's resource pool
export interface ResourcePool {
  faith: number;
  chaos: number;
  gold: number;
  magic: number;
  blood: number;
}

// Create empty resource pool
export const createEmptyResourcePool = (): ResourcePool => ({
  faith: 0,
  chaos: 0,
  gold: 0,
  magic: 0,
  blood: 0
});

// Create starting resource pool for a nation
export const createStartingResourcePool = (nation: string): ResourcePool => {
  const pool = createEmptyResourcePool();
  
  // Add 2 of each resource the nation uses
  const nationResources = NATION_RESOURCES[nation] || [];
  nationResources.forEach(resource => {
    pool[resource] = 2;
  });
  
  return pool;
};

// Add natural income to resource pool based on nation
export const addNaturalIncome = (pool: ResourcePool, nation: string): ResourcePool => {
  const newPool = { ...pool };
  
  // Add 1 of each resource the nation uses
  const nationResources = NATION_RESOURCES[nation] || [];
  nationResources.forEach(resource => {
    newPool[resource] += 1;
  });
  
  return newPool;
};

// Calculate and add resource generation from capital's surrounding hexes
export const addCapitalResourceGeneration = (
  pool: ResourcePool, 
  nation: string, 
  turn: number,
  hexes: any[], 
  capitalHex: any
): ResourcePool => {
  if (!capitalHex) return pool;
  
  const newPool = { ...pool };
  const nationResources = NATION_RESOURCES[nation] || [];
  
  // If no resources defined for this nation, return unchanged pool
  if (nationResources.length === 0) return newPool;
  
  // Get the primary resource this nation generates
  const primaryResource = nationResources[0];
  
  // Find all adjacent hexes to the capital
  const adjacentHexes = getAdjacentHexes(hexes, capitalHex);
  
  // Count empty adjacent hexes (no buildings)
  const emptyAdjacentHexes = adjacentHexes.filter(hex => !hex.building);
  
  // Calculate resource generation - 1 per empty hex, capped by current turn number
  // This means turn 1 = max 1 resource, turn 2 = max 2... up to turn 6 and beyond = max 6
  const resourceGenerationPerHex = 1;
  const maxHexesGenerating = Math.min(emptyAdjacentHexes.length, Math.min(turn, 6));
  const totalResourceGeneration = resourceGenerationPerHex * maxHexesGenerating;
  
  // Add generated resources to the pool
  newPool[primaryResource] += totalResourceGeneration;
  
  return newPool;
};

// Helper function to get adjacent hexes
const getAdjacentHexes = (hexes: any[], centerHex: any): any[] => {
  if (!centerHex) return [];
  
  const { q, r, s } = centerHex;
  
  // Adjacent hex coordinates relative to center
  const adjacentCoords = [
    {q: q+1, r: r-1, s: s}, // top right
    {q: q+1, r: r, s: s-1}, // right
    {q: q, r: r+1, s: s-1}, // bottom right
    {q: q-1, r: r+1, s: s}, // bottom left
    {q: q-1, r: r, s: s+1}, // left
    {q: q, r: r-1, s: s+1}  // top left
  ];
  
  // Find all hexes that match the adjacent coordinates
  return hexes.filter(hex => 
    adjacentCoords.some(coord => 
      hex.q === coord.q && hex.r === coord.r && (hex.s === coord.s || hex.s === undefined)
    )
  );
};

// Resource cost for a card or action
export interface ResourceCost {
  faith?: number;
  chaos?: number;
  gold?: number;
  magic?: number;
  blood?: number;
}

// Check if player can afford a cost
export const canAfford = (pool: ResourcePool, cost: ResourceCost): boolean => {
  return (
    (cost.faith || 0) <= pool.faith &&
    (cost.chaos || 0) <= pool.chaos &&
    (cost.gold || 0) <= pool.gold &&
    (cost.magic || 0) <= pool.magic &&
    (cost.blood || 0) <= pool.blood
  );
};

// Deduct cost from pool
export const deductResources = (pool: ResourcePool, cost: ResourceCost): ResourcePool => {
  return {
    faith: pool.faith - (cost.faith || 0),
    chaos: pool.chaos - (cost.chaos || 0),
    gold: pool.gold - (cost.gold || 0),
    magic: pool.magic - (cost.magic || 0),
    blood: pool.blood - (cost.blood || 0)
  };
};