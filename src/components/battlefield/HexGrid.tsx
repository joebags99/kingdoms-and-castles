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
type TerrainType = 'plain' | 'mountain' | 'forest' | 'river' | 'magic';

interface HexData {
  id: string;
  q: number;
  r: number;
  s: number;
  terrain: TerrainType;
  owner: 'player1' | 'player2' | 'neutral';
  unit?: Unit; // Now can store the actual unit object
}

interface HexGridProps {
  width?: number;
  height?: number;
  hexSize?: number;
  currentPlayer: 'player1' | 'player2';
  selectedUnit: Unit | null;
  onUnitPlaced: (hex: HexData, unit: Unit) => void;
  initialCapitals?: { unit: Unit; position: { q: number; r: number; s?: number } }[];
  capitalsPlaced?: boolean;
  onHexGridInit?: (hexes: HexData[]) => void;
  capitalPlacementPhase?: boolean;
  validCapitalPlacements?: {q: number, r: number, s: number}[];
  onHexInteraction?: (hex: HexData) => void;
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
  onHexInteraction
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
        let owner: 'player1' | 'player2' | 'neutral' = 'neutral';
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
  
  // Check if a hex is within building range of a capital (2 hexes)
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
      
      // If within 2 hexes of the capital
      if (distance <= 2) {
        // Color based on faction
        const colorMap: {[key: string]: string} = {
          'altaria': 'rgba(238, 236, 230, 0.3)', // Cream
          'cartasia': 'rgba(170, 0, 0, 0.2)',    // Deep red
          'durandur': 'rgba(0, 128, 128, 0.2)',  // Teal
          'belaklara': 'rgba(218, 165, 32, 0.2)', // Gold
          'shadowspawn': 'rgba(72, 0, 72, 0.2)'  // Dark purple
        };
        
        const color = colorMap[capitalHex.unit.faction] || 'rgba(255, 255, 255, 0.1)';
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

  const getHexFillColor = (hex: HexData) => {
    // Base colors by owner
    const baseColors = {
      player1: '#b3d9ff', // Light blue
      player2: '#ffb3b3', // Light red
      neutral: '#e6e6e6'  // Light gray
    };
    
    // Terrain modifiers
    const terrainColors = {
      plain: baseColors[hex.owner],
      mountain: '#a6a6a6', // Gray
      forest: '#99cc99',   // Green
      river: '#80bfff',    // Blue
      magic: '#d9b3ff'     // Purple
    };
    
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
    
    return terrainColors[hex.terrain];
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
  
  const handleHexClick = (hex: HexData) => {
    setSelectedHex(hex);
    console.log('Hex clicked:', hex);
    
    // CASE 1: If we have a unit from hand selected (placement mode)
    if (selectedUnit && !selectedUnitHex && isValidPlacement(hex)) {
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
          
          // Determine stroke color and width
          let strokeColor = "#666";
          let strokeWidth = "0.5";
          
          if (isSelectedUnitHex) {
            strokeColor = "#ff9900";
            strokeWidth = "2";
          } else if (isValidMoveHex) {
            strokeColor = "#00aaff";
            strokeWidth = "1.5";
          } else if (isValidPlacementHex) {
            strokeColor = "#00ff00";
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
            </g>
          );
        })}
      </svg>
    </HexGridContainer>
  );
};

export default HexGrid;