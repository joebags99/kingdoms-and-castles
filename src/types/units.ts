// Unit types
export type UnitType = 'infantry' | 'archer' | 'cavalry' | 'mage' | 'hero' | 'capital';

// Unit factions
export type UnitFaction = 'altaria' | 'cartasia' | 'neutral';

// Basic unit interface
export interface Unit {
  id: string;
  name: string;
  type: UnitType;
  faction: UnitFaction;
  attackPower: number;
  hitPoints: number;
  maxHitPoints: number;
  movement: number;
  range: number;
  abilities: string[];
  description: string;
  image?: string; // We'll use simple SVG icons at first
}

// Generate a unique ID for units
export const generateUnitId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Sample units
export const SAMPLE_UNITS: Record<string, Unit> = {
  // Altaria units (Faith)
  altariaInfantry: {
    id: 'altaria-infantry',
    name: 'Faith Warrior',
    type: 'infantry',
    faction: 'altaria',
    attackPower: 2,
    hitPoints: 3,
    maxHitPoints: 3,
    movement: 2,
    range: 1,
    abilities: ['divine_shield'],
    description: 'Basic Altaria infantry protected by divine light'
  },
  altariaArcher: {
    id: 'altaria-archer',
    name: 'Lightbringer Archer',
    type: 'archer',
    faction: 'altaria',
    attackPower: 3,
    hitPoints: 2,
    maxHitPoints: 2,
    movement: 2,
    range: 2,
    abilities: [],
    description: 'Ranged unit blessed with the power of light'
  },
  altariaMage: {
    id: 'altaria-mage',
    name: 'Divine Mage',
    type: 'mage',
    faction: 'altaria',
    attackPower: 3,
    hitPoints: 2,
    maxHitPoints: 2,
    movement: 1,
    range: 2,
    abilities: ['healing_light'],
    description: 'Can heal adjacent friendly units'
  },
  
  // Cartasia units (Blood)
  cartasiaInfantry: {
    id: 'cartasia-infantry',
    name: 'Blood Warrior',
    type: 'infantry',
    faction: 'cartasia',
    attackPower: 3,
    hitPoints: 2,
    maxHitPoints: 2,
    movement: 2,
    range: 1,
    abilities: ['bloodthirst'],
    description: 'Basic Cartasia infantry with aggressive tactics'
  },
  cartasiaArcher: {
    id: 'cartasia-archer',
    name: 'Shadow Archer',
    type: 'archer',
    faction: 'cartasia',
    attackPower: 2,
    hitPoints: 2,
    maxHitPoints: 2,
    movement: 2,
    range: 3,
    abilities: [],
    description: 'Long-range unit that can attack from the shadows'
  },
  cartasiaMage: {
    id: 'cartasia-mage',
    name: 'Blood Mage',
    type: 'mage',
    faction: 'cartasia',
    attackPower: 4,
    hitPoints: 1,
    maxHitPoints: 1,
    movement: 1,
    range: 2,
    abilities: ['life_drain'],
    description: 'Can drain life from enemies to heal itself'
  },
  
  // Capital units
  altariaCapital: {
    id: 'altaria-capital',
    name: 'Divine Citadel',
    type: 'capital',
    faction: 'altaria',
    attackPower: 0,
    hitPoints: 15,
    maxHitPoints: 15,
    movement: 0,
    range: 0,
    abilities: ['faith_generation'],
    description: 'The sacred capital of Altaria'
  },
  cartasiaCapital: {
    id: 'cartasia-capital',
    name: 'Bloodkeep',
    type: 'capital',
    faction: 'cartasia',
    attackPower: 0,
    hitPoints: 15,
    maxHitPoints: 15,
    movement: 0,
    range: 0,
    abilities: ['blood_generation'],
    description: 'The dark capital of Cartasia'
  }
};