// src/components/battlefield/HexGrid.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Unit } from '../../types/units';
import UnitIcon from '../units/UnitIcon';

const HexGridContainer = styled.div`
  width: 100%;
  height: 80vh;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

// Define our hex types
export type TerrainType = 'plain' | 'mountain' | 'forest' | 'river' | 'magic';
export type PlayerID = 'player1' | 'player2' | 'neutral';

export interface HexData {
  id: string;
  q: number;
  r: number;
  s: number;
  terrain: TerrainType;
  owner: PlayerID;
  unit?: Unit; // Now can store the actual unit object
}

interface HexGridProps {
  width?: number;
  height?: number;
  hexSize?: number;
  currentPlayer: PlayerID;
  selectedUnit: Unit | null;
  onUnitPlaced: (hex: HexData, unit: Unit) => void;
  initialCapitals?: { unit: Unit; position: { q: number; r: number; s?: number } }[];
  capitalsPlaced?: boolean;
  onHexGridInit?: (hexes: HexData[]) => void;
  capitalPlacementPhase?: boolean;
  validCapitalPlacements?: {q: number, r: number, s: number}[];
  onHexInteraction?: (hex: HexData) => void;
  resourceHexes?: {
    player1: {q: number, r: number, s: number}[],
    player2: {q: number, r: number, s: number}[]
  };
}

// Helper function to generate the points for a hexagon
const getHexPoints = (size: number): string => {
  const angles = [0, 60, 120, 180, 240, 300];
  return angles
    .map(angle => {
      const radians = (Math.PI / 180) * angle;
      return `${size * Math.cos(radians)},${size * Math.sin(radians)}`;
    })
    .join(' ');
};

// Helper function to calculate the pixel position of a hex
const hexToPixel = (q: number, r: number, size: number): { x: number; y: number } => {
  // Flat-topped hex
  const x = size * (3/2 * q);
  const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return { x, y };
};

const HexGrid: React.FC<HexGridProps> = ({ 
  width = 15, 
  height = 11, 
  hexSize = 30,
  currentPlayer,
  selectedUnit,
  onUnitPlaced,
  initialCapitals = [],
  capitalsPlaced = false,
  onHexGridInit,
  capitalPlacementPhase = false,
  validCapitalPlacements = [],
  onHexInteraction,
  resourceHexes
}) => {
  // Generate initial hex grid data
  const generateHexData = (): HexData[] => {
    const hexes: HexData[] = [];
    
    // For a grid with axial coordinates
    for (let q = -Math.floor(width/2); q <= Math.floor(width/2); q++) {
      const r1 = Math.max(-Math.floor(height/2), -q - Math.floor(height/2));
      const r2 = Math.min(Math.floor(height/2), -q + Math.floor(height/2));
      
      for (let r = r1; r <= r2; r++) {
        const s = -q - r; // In hexagonal grid, q + r + s = 0
        
        // Determine hex owner based on position
        let owner: PlayerID = 'neutral';
        if (r < -1) owner = 'player1';
        else if (r > 1) owner = 'player2';
        
        hexes.push({
          id: `${q},${r},${s}`,
          q,
          r,
          s,
          terrain: 'plain',
          owner
        });
      }
    }
    
    // Add some terrain features
    const addTerrain = (q: number, r: number, s: number, terrain: TerrainType) => {
      const hex = hexes.find(h => h.q === q && h.r === r && h.s === s);
      if (hex) {
        hex.terrain = terrain;
      }
    };
    
    // Add some mountains
    addTerrain(-4, -1, 5, 'mountain');
    addTerrain(-3, -2, 5, 'mountain');
    
    // Add some forests
    addTerrain(3, 2, -5, 'forest');
    addTerrain(4, 1, -5, 'forest');
    
    // Add a river
    for (let i = -2; i <= 2; i++) {
      addTerrain(i, 0, -i, 'river');
    }
    
    return hexes;
  };
  
  const [hexes, setHexes] = useState<HexData[]>(generateHexData());
  const [selectedHex, setSelectedHex] = useState<HexData | null>(null);
  
  // Send hex data to parent component
  useEffect(() => {
    if (onHexGridInit) {
      onHexGridInit(hexes);
    }
  }, [hexes, onHexGridInit]);
  
  // State for unit movement
  const [selectedUnitHex, setSelectedUnitHex] = useState<HexData | null>(null);
  const [movementRange, setMovementRange] = useState<string[]>([]);
  
  // Calculate building range around capitals
  const [buildingRange, setBuildingRange] = useState<{[hexId: string]: string}>({});
  
  // Check if a hex is within building range of a capital (1 hex)
  const isInBuildingRange = (hex: HexData): { inRange: boolean; color: string } => {
    // We'll calculate this dynamically based on the position of the capitals
    const capitalHexes = hexes.filter(h => h.unit?.type === 'capital');
    
    for (const capitalHex of capitalHexes) {
      if (!capitalHex.unit) continue;
      
      // Calculate distance
      const distance = Math.max(
        Math.abs(hex.q - capitalHex.q),
        Math.abs(hex.r - capitalHex.r),
        Math.abs(hex.s - capitalHex.s)
      );
      
      // If within 1 hex of the capital (changed from 2)
      if (distance <= 1) {
        // Color based on faction
        const colorMap: {[key: string]: string} = {
          'altaria': 'rgba(92, 148, 255, 0.3)', // Light blue
          'cartasia': 'rgba(255, 92, 92, 0.3)',  // Light red
          'durandur': 'rgba(0, 160, 160, 0.3)',  // Teal
          'belaklara': 'rgba(218, 165, 32, 0.3)', // Gold
          'shadowspawn': 'rgba(72, 0, 72, 0.3)'  // Dark purple
        };
        
        const color = colorMap[capitalHex.unit.faction] || 'rgba(255, 255, 255, 0.2)';
        return { inRange: true, color };
      }
    }
    
    return { inRange: false, color: '' };
  };
  
  // Update building range whenever capitals are placed or units move
  useEffect(() => {
    const newBuildingRange: {[hexId: string]: string} = {};
    
    hexes.forEach(hex => {
      const { inRange, color } = isInBuildingRange(hex);
      if (inRange) {
        newBuildingRange[hex.id] = color;
      }
    });
    
    setBuildingRange(newBuildingRange);
  }, [hexes]);
  
  // Effect to place capitals when they're provided
  useEffect(() => {
    if (capitalsPlaced && initialCapitals.length > 0) {
      const updatedHexes = [...hexes];
      
      initialCapitals.forEach(capital => {
        const { unit, position } = capital;
        const hexIndex = updatedHexes.findIndex(
          h => h.q === position.q && h.r === position.r
        );
        
        if (hexIndex !== -1) {
          updatedHexes[hexIndex] = {
            ...updatedHexes[hexIndex],
            unit: { ...unit }
          };
        }
      });
      
      setHexes(updatedHexes);
    }
  }, [capitalsPlaced, initialCapitals, hexes]);

  // Check if a hex is a resource-generating hex
  const isResourceHex = (hex: HexData, playerID: PlayerID): boolean => {
    if (!resourceHexes) return false;
    
    const playerResourceHexes = playerID === 'player1' 
      ? resourceHexes.player1 
      : resourceHexes.player2;
    
    return playerResourceHexes.some(
      coord => coord.q === hex.q && coord.r === coord.r && coord.s === coord.s
    );
  };
  
  // Check if a hex is valid for unit placement
  const isValidPlacement = (hex: HexData): boolean => {
    // Check if hex is owned by current player
    if (
      (currentPlayer === 'player1' && hex.owner !== 'player1') ||
      (currentPlayer === 'player2' && hex.owner !== 'player2')
    ) {
      return false;
    }
    
    // Check if hex already has a unit
    if (hex.unit) {
      return false;
    }
    
    // Can't place on mountains
    if (hex.terrain === 'mountain') {
      return false;
    }
    
    return true;
  };
  
  // Check if a hex is within movement range of the selected unit
  const isValidMove = (from: HexData, to: HexData): boolean => {
    if (!from.unit) return false;
    if (to.unit) return false; // Can't move to occupied hex
    if (to.terrain === 'mountain') return false; // Can't move to mountain
    
    // Calculate distance (axial coordinates)
    const distance = Math.max(
      Math.abs(from.q - to.q),
      Math.abs(from.r - to.r),
      Math.abs(from.s - to.s)
    );
    
    // Check if within unit's movement range
    return distance <= from.unit.movement;
  };
  
  // Calculate all valid movement hexes for a unit
  const calculateMovementRange = (hex: HexData): string[] => {
    if (!hex.unit) return [];
    
    const validHexes: string[] = [];
    
    hexes.forEach(target => {
      if (isValidMove(hex, target)) {
        validHexes.push(target.id);
      }
    });
    
    return validHexes;
  };

  const getHexFillColor = (hex: HexData) => {
    // Base colors by owner
    const baseColors = {
      player1: '#b3d9ff', // Light blue
      player2: '#ffb3b3', // Light red
      neutral: '#e6e6e6'  // Light gray
    };
    
    // Resource hex colors - slightly brighter to indicate active resource generation
    const resourceColors = {
      player1: '#99ccff', // Brighter blue
      player2: '#ff9999', // Brighter red
    };
    
    // Terrain modifiers - define this BEFORE using it
    const terrainColors = {
      plain: baseColors[hex.owner],
      mountain: '#a6a6a6', // Gray
      forest: '#99cc99',   // Green
      river: '#80bfff',    // Blue
      magic: '#d9b3ff'     // Purple
    };
    
    // Check if this is a resource-generating hex
    const isPlayer1Resource = isResourceHex(hex, 'player1');
    const isPlayer2Resource = isResourceHex(hex, 'player2');
    
    // Capital placement phase - highlight valid placement positions
    if (capitalPlacementPhase && validCapitalPlacements.some(pos => 
      pos.q === hex.q && pos.r === hex.r && pos.s === hex.s
    )) {
      return currentPlayer === 'player1' ? '#7bb5ff' : '#ff7b7b'; // Brighter highlight
    }
    
    // Highlight for selected unit hex
    if (selectedUnitHex && hex.id === selectedUnitHex.id) {
      return '#ffdd66'; // Golden highlight
    }
    
    // Highlight for movement range
    if (movementRange.includes(hex.id)) {
      const baseColor = terrainColors[hex.terrain];
      // Blend with light blue to indicate movement possibility
      return hex.terrain === 'mountain' ? baseColor : '#cceeff';
    }
    
    // If selected, highlight
    if (selectedHex && hex.id === selectedHex.id) {
      return '#ffff99'; // Yellow highlight for general selection
    }
    
    // If it's a resource hex, use the resource color
    if (isPlayer1Resource) {
      return resourceColors.player1;
    } else if (isPlayer2Resource) {
      return resourceColors.player2;
    }
    
    return terrainColors[hex.terrain];
  };
  
  const handleHexClick = (hex: HexData) => {
    setSelectedHex(hex);
    
    if (onHexInteraction) {
      onHexInteraction(hex);
    }
    
    // CASE 0: Capital placement phase
    if (capitalPlacementPhase && selectedUnit && selectedUnit.type === 'capital') {
      // Check if this is a valid hex for capital placement
      const isValid = validCapitalPlacements.some(pos => 
        pos.q === hex.q && pos.r === hex.r && pos.s === hex.s
      );
      
      if (isValid) {
        // Place the capital
        const updatedHexes = hexes.map(h => {
          if (h.id === hex.id) {
            return { ...h, unit: { ...selectedUnit, id: selectedUnit.id + '_' + Date.now() } };
          }
          return h;
        });
        
        setHexes(updatedHexes);
        
        // Notify parent component
        onUnitPlaced(hex, selectedUnit);
      }
    }
    // CASE 1: If we have a unit from hand selected (placement mode)
    else if (selectedUnit && !selectedUnitHex && isValidPlacement(hex)) {
      // Place the unit on the hex
      const updatedHexes = hexes.map(h => {
        if (h.id === hex.id) {
          return { ...h, unit: { ...selectedUnit, id: selectedUnit.id + '_' + Date.now() } };
        }
        return h;
      });
      
      setHexes(updatedHexes);
      
      // Notify parent component
      onUnitPlaced(hex, selectedUnit);
      
      // Clear movement range
      setMovementRange([]);
    }
    // CASE 2: If the clicked hex contains a unit belonging to current player (selection mode)
    else if (
      hex.unit && 
      ((currentPlayer === 'player1' && hex.unit.faction === 'altaria') ||
       (currentPlayer === 'player2' && hex.unit.faction === 'cartasia'))
    ) {
      // Select this unit for movement
      setSelectedUnitHex(hex);
      
      // Calculate and show movement range
      const range = calculateMovementRange(hex);
      setMovementRange(range);
    }
    // CASE 3: If we have a unit selected and clicked on a valid movement destination
    else if (selectedUnitHex && movementRange.includes(hex.id)) {
      // Move the unit
      const updatedHexes = hexes.map(h => {
        if (h.id === selectedUnitHex.id) {
          // Remove unit from original hex
          return { ...h, unit: undefined };
        }
        if (h.id === hex.id) {
          // Add unit to new hex
          return { ...h, unit: selectedUnitHex.unit };
        }
        return h;
      });
      
      setHexes(updatedHexes);
      
      // Clear selection and movement range
      setSelectedUnitHex(null);
      setMovementRange([]);
    }
    // CASE 4: Clicked elsewhere, clear selection
    else {
      setSelectedUnitHex(null);
      setMovementRange([]);
    }
  };
  
  // Calculate the SVG viewBox to ensure it's centered and shows all hexes
  const calculateViewBox = () => {
    // Calculate appropriate dimensions based on grid size and hex size
    const viewWidth = hexSize * 25; 
    const viewHeight = hexSize * 20;
    return `-${viewWidth/2} -${viewHeight/2} ${viewWidth} ${viewHeight}`;
  };
  
  return (
    <HexGridContainer>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={calculateViewBox()}
        style={{ overflow: 'visible' }}
      >
        {/* Define glow filter for building range */}
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {hexes.map((hex) => {
          const { x, y } = hexToPixel(hex.q, hex.r, hexSize);
          
          // Determine hex styling based on context
          const isValidPlacementHex = selectedUnit && isValidPlacement(hex);
          const isValidMoveHex = movementRange.includes(hex.id);
          const isSelectedUnitHex = selectedUnitHex && hex.id === selectedUnitHex.id;
          const isBuildingRangeHex = buildingRange[hex.id];
          
          // Check if this hex is a valid capital placement position
          const isValidCapitalHex = capitalPlacementPhase && validCapitalPlacements.some(pos => 
            pos.q === hex.q && pos.r === hex.r && pos.s === hex.s
          );
          
          // Check if this is a resource-generating hex
          const isPlayer1Resource = isResourceHex(hex, 'player1');
          const isPlayer2Resource = isResourceHex(hex, 'player2');
          const isResourceActiveHex = isPlayer1Resource || isPlayer2Resource;
          
          // Determine stroke color and width
          let strokeColor = "#666";
          let strokeWidth = "0.5";
          
          if (isSelectedUnitHex) {
            strokeColor = "#ff9900";
            strokeWidth = "2";
          } else if (isValidCapitalHex) {
            strokeColor = currentPlayer === 'player1' ? "#0066ff" : "#ff0066";
            strokeWidth = "2";
          } else if (isValidMoveHex) {
            strokeColor = "#00aaff";
            strokeWidth = "1.5";
          } else if (isValidPlacementHex) {
            strokeColor = "#00ff00";
            strokeWidth = "1.5";
          } else if (isResourceActiveHex) {
            strokeColor = isPlayer1Resource ? "#5c94ff" : "#ff5c5c";
            strokeWidth = "1.5";
          }
          
          return (
            <g key={hex.id} transform={`translate(${x}, ${y})`}>
              {/* Building range glow effect */}
              {isBuildingRangeHex && (
                <polygon
                  points={getHexPoints(hexSize + 2)}
                  fill={isBuildingRangeHex}
                  stroke="none"
                  filter="url(#glow)"
                />
              )}
              
              <polygon
                points={getHexPoints(hexSize)}
                fill={getHexFillColor(hex)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                className="hex"
                onClick={() => handleHexClick(hex)}
                style={{
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.strokeWidth = (parseFloat(strokeWidth) + 0.5).toString();
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.strokeWidth = strokeWidth;
                  e.currentTarget.style.opacity = '1';
                }}
              />
              
              {/* Small coordinate text for debugging */}
              <text
                textAnchor="middle"
                dy="-0.5em"
                fontSize="8"
                pointerEvents="none"
                opacity="0.6"
              >
                {`${hex.q},${hex.r}`}
              </text>
              
              {/* Display unit if exists */}
              {hex.unit && (
                <foreignObject
                  x={-hexSize * 0.6}
                  y={-hexSize * 0.6}
                  width={hexSize * 1.2}
                  height={hexSize * 1.2}
                  pointerEvents="none"
                >
                  <UnitIcon unit={hex.unit} />
                </foreignObject>
              )}
              
              {/* Visual indicator for valid capital placement */}
              {isValidCapitalHex && (
                <circle
                  cx="0"
                  cy="0"
                  r={hexSize * 0.2}
                  fill={currentPlayer === 'player1' ? 'rgba(0, 102, 255, 0.5)' : 'rgba(255, 0, 102, 0.5)'}
                  stroke={currentPlayer === 'player1' ? '#0066ff' : '#ff0066'}
                  strokeWidth="1"
                  pointerEvents="none"
                />
              )}
              
              {/* Resource hex indicator */}
              {isResourceActiveHex && (
                <>
                  <circle
                    cx="0"
                    cy="0"
                    r={hexSize * 0.3}
                    fill="none"
                    stroke={isPlayer1Resource ? "#5c94ff" : "#ff5c5c"}
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    opacity="0.7"
                    pointerEvents="none"
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={hexSize * 0.4}
                    fill={isPlayer1Resource ? "#0066cc" : "#cc0000"}
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {isPlayer1Resource ? "F" : "B"}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </HexGridContainer>
  );
};

export default HexGrid;