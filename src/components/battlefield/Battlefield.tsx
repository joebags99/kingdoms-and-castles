import React, { useState } from 'react';
import styled from 'styled-components';
import HexGrid from './HexGrid';
import UnitSelectionPanel from '../units/UnitSelectionPanel';
import { Unit } from '../../types/units';
import { SAMPLE_UNITS } from '../../types/units';

const BattlefieldContainer = styled.div`
  width: 100%;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const BattlefieldHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const BattlefieldTitle = styled.h2`
  margin: 0;
  color: #333;
`;

const GameInfo = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const PlayerInfo = styled.div<{ player: 'player1' | 'player2'; isActive: boolean }>`
  padding: 10px 15px;
  border-radius: 4px;
  background-color: ${props => 
    props.player === 'player1' 
      ? props.isActive ? '#b3d9ff' : '#d9e9ff'
      : props.isActive ? '#ffb3b3' : '#ffdddd'
  };
  font-weight: ${props => props.isActive ? 'bold' : 'normal'};
  border: 2px solid ${props => props.isActive ? '#333' : 'transparent'};
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
`;

const GameStatusText = styled.div`
  font-size: 1rem;
  color: #333;
  font-weight: 500;
`;

const Instructions = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 5px;
  font-style: italic;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #4a6fa5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
  
  &:hover {
    background-color: #385682;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

// Define a type for hex data
interface HexData {
  id: string;
  q: number;
  r: number;
  s: number;
  terrain: string;
  owner: 'player1' | 'player2' | 'neutral';
  unit?: Unit;
}

interface BattlefieldProps {
  width?: number;
  height?: number;
  hexSize?: number;
}

const Battlefield: React.FC<BattlefieldProps> = ({ width, height, hexSize }) => {
  // Game state
  const [currentPlayer, setCurrentPlayer] = useState<'player1' | 'player2'>('player1');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [placedUnits, setPlacedUnits] = useState<{ unit: Unit; hexId: string }[]>([]);
  
  // Capital placement
  const [capitalsPlaced, setCapitalsPlaced] = useState<boolean>(false);
  const [initialCapitals, setInitialCapitals] = useState<{ unit: Unit; position: { q: number; r: number; s: number } }[]>([]);
  const [capitalPlacementPhase, setCapitalPlacementPhase] = useState<boolean>(false);
  const [player1CapitalPlaced, setPlayer1CapitalPlaced] = useState<boolean>(false);
  const [player2CapitalPlaced, setPlayer2CapitalPlaced] = useState<boolean>(false);
  const [validCapitalPlacements, setValidCapitalPlacements] = useState<{q: number, r: number, s: number}[]>([]);
  const [currentCapitalToPlace, setCurrentCapitalToPlace] = useState<Unit | null>(null);
  
  // Access to the hex grid data
  const [hexes, setHexes] = useState<HexData[]>([]);
  
  // Callback to get hex data from HexGrid
  const handleHexGridInit = (gridHexes: HexData[]) => {
    setHexes(gridHexes);
  };
  
  // Handle unit selection
  const handleUnitSelect = (unit: Unit) => {
    setSelectedUnit(unit);
  };
  
  // Handle unit placement
  const handleUnitPlaced = (hex: any, unit: Unit) => {
    setPlacedUnits([...placedUnits, { unit, hexId: hex.id }]);
    setSelectedUnit(null); // Deselect unit after placement
  };
  
  // End turn and switch player
  const handleEndTurn = () => {
    setCurrentPlayer(currentPlayer === 'player1' ? 'player2' : 'player1');
    setSelectedUnit(null);
  };
  
  // Get player name
  const getPlayerName = (player: 'player1' | 'player2') => {
    return player === 'player1' ? 'Altaria' : 'Cartasia';
  };
  
  // Check if a position is valid for capital placement
  // (in player territory and all adjacent hexes are accessible and owned by player)
  const isValidCapitalPosition = (q: number, r: number, s: number, playerOwner: 'player1' | 'player2'): boolean => {
    // Find the hex
    const centerHex = hexes.find(h => h.q === q && h.r === r && h.s === s);
    if (!centerHex) return false;
    
    // Check if in correct territory
    if (centerHex.owner !== playerOwner) return false;
    
    // Check if all adjacent hexes are accessible (not mountains or occupied) AND owned by the player
    const adjacentCoords = [
      {q: q+1, r: r-1, s: s}, // top right
      {q: q+1, r: r, s: s-1}, // right
      {q: q, r: r+1, s: s-1}, // bottom right
      {q: q-1, r: r+1, s: s}, // bottom left
      {q: q-1, r: r, s: s+1}, // left
      {q: q, r: r-1, s: s+1}  // top left
    ];
    
    // All 6 adjacent hexes should be accessible and owned by the player
    let validAdjacentCount = 0;
    
    for (const coord of adjacentCoords) {
      const adjHex = hexes.find(h => h.q === coord.q && h.r === coord.r && h.s === coord.s);
      if (adjHex && 
          adjHex.terrain !== 'mountain' && 
          !adjHex.unit && 
          adjHex.owner === playerOwner) {
        validAdjacentCount++;
      }
    }
    
    return validAdjacentCount === 6;
  };
  
  // Start capital placement phase
  const handlePlaceCapitals = () => {
    // Create capital units
    const altariaCapital = { ...SAMPLE_UNITS.altariaCapital, id: 'altaria_capital_' + Date.now() };
    
    // Calculate valid placements for player 1 (Altaria)
    const validPositions: {q: number, r: number, s: number}[] = [];
    
    if (hexes.length > 0) {
      hexes.forEach(hex => {
        if (hex.owner === 'player1' && isValidCapitalPosition(hex.q, hex.r, hex.s, 'player1')) {
          validPositions.push({ q: hex.q, r: hex.r, s: hex.s });
        }
      });
    }
    
    // Set valid placement hexes
    setValidCapitalPlacements(validPositions);
    
    // Start capital placement phase with player 1 (Altaria)
    setCapitalPlacementPhase(true);
    setCurrentPlayer('player1');
    setCurrentCapitalToPlace(altariaCapital);
  };
  
  // Handle when a capital is placed
  const handleCapitalPlaced = (hex: any, capital: Unit) => {
    if (currentPlayer === 'player1') {
      // Set player 1's capital as placed
      setPlayer1CapitalPlaced(true);
      
      // Switch to player 2 and prepare their capital placement
      setCurrentPlayer('player2');
      const cartasiaCapital = { ...SAMPLE_UNITS.cartasiaCapital, id: 'cartasia_capital_' + Date.now() };
      setCurrentCapitalToPlace(cartasiaCapital);
      
      // Calculate valid placements for player 2 (Cartasia)
      const validPositions: {q: number, r: number, s: number}[] = [];
      
      if (hexes.length > 0) {
        hexes.forEach(hex => {
          if (hex.owner === 'player2' && isValidCapitalPosition(hex.q, hex.r, hex.s, 'player2')) {
            validPositions.push({ q: hex.q, r: hex.r, s: hex.s });
          }
        });
      }
      
      setValidCapitalPlacements(validPositions);
    } else {
      // Both capitals have been placed
      setPlayer2CapitalPlaced(true);
      setCapitalPlacementPhase(false);
      setValidCapitalPlacements([]);
      setCurrentCapitalToPlace(null);
      setCapitalsPlaced(true);
    }
  };

  return (
    <BattlefieldContainer>
      <BattlefieldHeader>
        <BattlefieldTitle>Kingdoms & Castles</BattlefieldTitle>
        <GameInfo>
          <PlayerInfo 
            player="player1" 
            isActive={currentPlayer === 'player1'}
          >
            Player 1: Altaria
          </PlayerInfo>
          <PlayerInfo 
            player="player2" 
            isActive={currentPlayer === 'player2'}
          >
            Player 2: Cartasia
          </PlayerInfo>
        </GameInfo>
      </BattlefieldHeader>
      
      <HexGrid 
        width={width} 
        height={height} 
        hexSize={hexSize} 
        currentPlayer={currentPlayer}
        selectedUnit={capitalPlacementPhase ? currentCapitalToPlace : selectedUnit}
        onUnitPlaced={capitalPlacementPhase ? handleCapitalPlaced : handleUnitPlaced}
        initialCapitals={initialCapitals}
        capitalsPlaced={capitalsPlaced}
        onHexGridInit={handleHexGridInit}
        capitalPlacementPhase={capitalPlacementPhase}
        validCapitalPlacements={validCapitalPlacements}
      />
      
      <ControlsContainer>
        {!capitalPlacementPhase && !capitalsPlaced ? (
          <>
            <GameStatusText>Start the game by placing capitals</GameStatusText>
            <Button onClick={handlePlaceCapitals}>
              Start Capital Placement
            </Button>
          </>
        ) : capitalPlacementPhase ? (
          <>
            <div>
              <GameStatusText>
                <strong>{getPlayerName(currentPlayer)} Capital Placement</strong>
              </GameStatusText>
              <Instructions>
                Click on a highlighted hex to place your capital. The capital must have all 6 surrounding hexes accessible.
              </Instructions>
            </div>
          </>
        ) : (
          <>
            <div>
              <GameStatusText>
                <strong>Current Turn:</strong> {getPlayerName(currentPlayer)}
              </GameStatusText>
              <Instructions>
                {selectedUnit ? 
                  "Click on your territory to place the selected unit" : 
                  "Select a unit from below to place, or click on one of your units to move it"
                }
              </Instructions>
            </div>
            <Button onClick={handleEndTurn}>
              End Turn
            </Button>
          </>
        )}
      </ControlsContainer>
      
      {capitalsPlaced && !capitalPlacementPhase && (
        <UnitSelectionPanel
          currentPlayer={currentPlayer}
          selectedUnit={selectedUnit}
          onSelectUnit={handleUnitSelect}
        />
      )}
    </BattlefieldContainer>
  );
};

export default Battlefield;