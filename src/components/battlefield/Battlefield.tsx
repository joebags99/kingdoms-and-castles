// src/components/battlefield/Battlefield.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import HexGrid, { HexData as HexGridHexData } from './HexGrid';
import UnitSelectionPanel from '../units/UnitSelectionPanel';
import PhaseController from '../phase/PhaseController';
import ResourceDisplay from '../resources/ResourceDisplay';
import { Unit, SAMPLE_UNITS } from '../../types/units';
import { PhaseType, PHASES, getNextPhase } from '../../types/phases';
import { 
  ResourcePool,
  createEmptyResourcePool, 
  createStartingResourcePool, 
  addNaturalIncome,
  NATION_RESOURCES
} from '../../types/resources';
import {
  GameState,
  HexData as GameHexData,
  PlayerID,
  createInitialGameState,
  canPerformAction,
  addToGameLog,
  checkVictoryConditions
} from '../../types/gameState';

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

const PlayerInfo = styled.div<{ $player: PlayerID; $isActive: boolean }>`
  padding: 10px 15px;
  border-radius: 4px;
  background-color: ${props => 
    props.$player === 'player1' 
      ? props.$isActive ? '#b3d9ff' : '#d9e9ff'
      : props.$isActive ? '#ffb3b3' : '#ffdddd'
  };
  font-weight: ${props => props.$isActive ? 'bold' : 'normal'};
  border: 2px solid ${props => props.$isActive ? '#333' : 'transparent'};
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

const GameLogContainer = styled.div`
  margin-top: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  max-height: 150px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const LogEntry = styled.div`
  padding: 4px 0;
  border-bottom: 1px solid #e9ecef;
  font-size: 0.9rem;
  
  &:last-child {
    border-bottom: none;
  }
`;

const LogHeader = styled.h3`
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem;
  color: #333;
`;

// Define a type alias for hex data to match the HexGrid component
type HexData = HexGridHexData;

interface BattlefieldProps {
  width?: number;
  height?: number;
  hexSize?: number;
}

const Battlefield: React.FC<BattlefieldProps> = ({ width = 13, height = 9, hexSize = 30 }) => {
  // Initialize game state
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  
  // UI state
  const [hexes, setHexes] = useState<HexData[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [player1Resources, setPlayer1Resources] = useState<ResourcePool>(createEmptyResourcePool());
  const [player2Resources, setPlayer2Resources] = useState<ResourcePool>(createEmptyResourcePool());
  
  // Resource hex state
  const [resourceHexes, setResourceHexes] = useState<{
    player1: {q: number, r: number, s: number}[],
    player2: {q: number, r: number, s: number}[]
  }>({
    player1: [],
    player2: []
  });
  
  // Capital placement state
  const [capitalPlacementPhase, setCapitalPlacementPhase] = useState<boolean>(false);
  const [validCapitalPlacements, setValidCapitalPlacements] = useState<{q: number, r: number, s: number}[]>([]);
  const [currentCapitalToPlace, setCurrentCapitalToPlace] = useState<Unit | null>(null);
  
  // Access to the hex grid data
  const handleHexGridInit = (gridHexes: HexData[]) => {
    // Only update state if the hexes array is empty (first initialization)
    // or if the length has changed significantly
    if (hexes.length === 0 || Math.abs(hexes.length - gridHexes.length) > 5) {
      setHexes(gridHexes);
      setGameState(prevState => ({
        ...prevState,
        hexes: gridHexes as unknown as GameHexData[]
      }));
    }
  };
  
  // Handle phase changes
  const handlePhaseChange = (newPhase: PhaseType) => {
    // Process phase-specific actions
    processPhaseTransition(gameState.currentPhase, newPhase);
    
    // Update game state with new phase
    setGameState(prevState => {
      const updatedState = {
        ...prevState,
        currentPhase: newPhase,
        lastAction: `Phase changed to ${PHASES[newPhase].displayName}`,
        log: [...prevState.log, `Phase changed to ${PHASES[newPhase].displayName}`]
      };
      
      // Check for victory conditions at the end of each turn
      if (newPhase === 'END') {
        return checkVictoryConditions(updatedState);
      }
      
      return updatedState;
    });
  };
  
  // Calculate resource-generating hexes around a capital
  const calculateResourceHexes = (
    capitalHex: HexData | undefined,
    round: number
  ): {q: number, r: number, s: number}[] => {
    const result: {q: number, r: number, s: number}[] = [];
    
    if (!capitalHex) return result;
    
    const { q, r, s } = capitalHex;
    
    // Define the 6 hexes around the capital in clockwise order starting from top
    const adjacentCoords = [
      {q: q, r: r-1, s: s+1},  // Top
      {q: q+1, r: r-1, s: s},  // Top Right
      {q: q+1, r: r, s: s-1},  // Bottom Right
      {q: q, r: r+1, s: s-1},  // Bottom
      {q: q-1, r: r+1, s: s},  // Bottom Left
      {q: q-1, r: r, s: s+1}   // Top Left
    ];
    
    // Number of hexes to unlock this round (capped at 6)
    const hexesToUnlock = Math.min(round, 6);
    
    // Add coordinates to the result
    for (let i = 0; i < hexesToUnlock; i++) {
      result.push(adjacentCoords[i]);
    }
    
    return result;
  };
  
  // This function is no longer used since we're directly adding resources
  // in the resource phase handling code
  
  // Process actions that happen during phase transitions
  const processPhaseTransition = (oldPhase: PhaseType, newPhase: PhaseType) => {
    const currentPlayerID = gameState.currentPlayer;
    
    if (oldPhase === 'END' && newPhase === 'RESOURCE') {
      // Start of a new turn
      const nextPlayer = currentPlayerID === 'player1' ? 'player2' : 'player1';
      
      // If we're going from player2 back to player1, increment the round counter
      const isNewRound = currentPlayerID === 'player2';
      const nextRound = isNewRound ? gameState.round + 1 : gameState.round;
      
      setGameState(prevState => ({
        ...prevState,
        turn: prevState.turn + 1,
        round: nextRound,
        currentPlayer: nextPlayer,
        log: [...prevState.log, `Turn ${prevState.turn + 1} begins${isNewRound ? ` (Round ${nextRound})` : ''}`]
      }));
    }
    
    // Special case for transitioning from SETUP to RESOURCE - initialize first real turn
    if (oldPhase === 'SETUP' && newPhase === 'RESOURCE') {
      setGameState(prevState => ({
        ...prevState,
        turn: 1, // First real turn starts now
        round: 1, // First round starts now
        log: [...prevState.log, `Game begins with Round 1`]
      }));
    }
    
    if (newPhase === 'RESOURCE') {
      // Resource generation - use round number
      const currentRound = gameState.round;
      
      // Only generate resources for the current player
      if (currentPlayerID === 'player1') {
        // Create a fresh copy of current resources
        let newResources = { ...player1Resources };
        
        // Calculate resource hexes
        const capitalHex = gameState.players.player1.capitalHex as HexData | undefined;
        const newResourceHexes = calculateResourceHexes(capitalHex, currentRound);
        
        // Update resource hexes for visualization
        setResourceHexes(prev => ({
          ...prev,
          player1: newResourceHexes
        }));
        
        // Add resources based ONLY on the resource hexes (no base income)
        // Each resource hex generates 1 Faith
        if (newResourceHexes.length > 0) {
          if (!newResources.faith) newResources.faith = 0;
          newResources.faith += newResourceHexes.length;
        }
        
        // Update player 1's resources
        setPlayer1Resources(newResources);
        
        // Generate resource message for log
        const resourcesGenerated = Math.min(currentRound, 6);
        
        // Update game state with new resources and log
        setGameState(prevState => {
          const updatedPlayers = { ...prevState.players };
          updatedPlayers.player1 = {
            ...updatedPlayers.player1,
            resources: newResources
          };
          
          return {
            ...prevState,
            players: updatedPlayers,
            log: [...prevState.log, 
              `Altaria generated ${resourcesGenerated} Faith from ${resourcesGenerated} unlocked hexes (Round ${currentRound})`
            ]
          };
        });
      } 
      else if (currentPlayerID === 'player2') {
        // Create a fresh copy of current resources
        let newResources = { ...player2Resources };
        
        // Calculate resource hexes
        const capitalHex = gameState.players.player2.capitalHex as HexData | undefined;
        const newResourceHexes = calculateResourceHexes(capitalHex, currentRound);
        
        // Update resource hexes for visualization
        setResourceHexes(prev => ({
          ...prev,
          player2: newResourceHexes
        }));
        
        // Add resources based ONLY on the resource hexes (no base income)
        // Each resource hex generates 1 Blood
        if (newResourceHexes.length > 0) {
          if (!newResources.blood) newResources.blood = 0;
          newResources.blood += newResourceHexes.length;
        }
        
        // Update player 2's resources
        setPlayer2Resources(newResources);
        
        // Generate resource message for log
        const resourcesGenerated = Math.min(currentRound, 6);
        
        // Update game state with new resources and log
        setGameState(prevState => {
          const updatedPlayers = { ...prevState.players };
          updatedPlayers.player2 = {
            ...updatedPlayers.player2,
            resources: newResources
          };
          
          return {
            ...prevState,
            players: updatedPlayers,
            log: [...prevState.log, 
              `Cartasia generated ${resourcesGenerated} Blood from ${resourcesGenerated} unlocked hexes (Round ${currentRound})`
            ]
          };
        });
      }
    }
    
    if (newPhase === 'DRAW') {
      // Draw a card (simulated for now)
      setGameState(prevState => {
        const updatedPlayers = { ...prevState.players };
        updatedPlayers[currentPlayerID] = {
          ...updatedPlayers[currentPlayerID],
          hasDrawnCard: true
        };
        
        return {
          ...prevState,
          players: updatedPlayers,
          log: [...prevState.log, `${currentPlayerID === 'player1' ? 'Altaria' : 'Cartasia'} drew a card`]
        };
      });
    }
    
    if (newPhase === 'END') {
      // Reset unit placement and movement flags for next turn
      setGameState(prevState => {
        const updatedPlayers = { ...prevState.players };
        updatedPlayers[currentPlayerID] = {
          ...updatedPlayers[currentPlayerID],
          unitsPlaced: 0,
          buildingsPlaced: 0,
          hasDrawnCard: false
        };
        
        return {
          ...prevState,
          players: updatedPlayers,
          log: [...prevState.log, `${currentPlayerID === 'player1' ? 'Altaria' : 'Cartasia'} ends their turn`]
        };
      });
    }
  };
  
  // Handle unit selection
  const handleUnitSelect = (unit: Unit) => {
    // Check if the action is allowed in current phase
    if (!canPerformAction(gameState, 'placeUnit')) {
      setGameState(prevState => addToGameLog(
        prevState, 
        `Cannot place units during ${PHASES[prevState.currentPhase].displayName}`
      ));
      return;
    }
    
    setSelectedUnit(unit);
  };
  
  // Handle unit placement
  const handleUnitPlaced = (hex: any, unit: Unit) => {
    // Check if this is the capital placement phase
    if (gameState.currentPhase === 'SETUP') {
      handleCapitalPlaced(hex, unit);
      return;
    }
    
    // Check if the action is allowed in current phase
    if (!canPerformAction(gameState, 'placeUnit')) {
      setGameState(prevState => addToGameLog(
        prevState, 
        `Cannot place units during ${PHASES[prevState.currentPhase].displayName}`
      ));
      return;
    }
    
    // Update game state with the placed unit
    setGameState(prevState => {
      const updatedPlayers = { ...prevState.players };
      updatedPlayers[prevState.currentPlayer] = {
        ...updatedPlayers[prevState.currentPlayer],
        unitsPlaced: updatedPlayers[prevState.currentPlayer].unitsPlaced + 1
      };
      
      // Update hexes with the new unit
      const updatedHexes = prevState.hexes.map(h => {
        if (h.id === hex.id) {
          return { ...h, unit: { ...unit, id: unit.id + '_' + Date.now() } };
        }
        return h;
      });
      
      return {
        ...prevState,
        players: updatedPlayers,
        hexes: updatedHexes,
        log: [...prevState.log, `${prevState.currentPlayer === 'player1' ? 'Altaria' : 'Cartasia'} placed ${unit.name}`]
      };
    });
    
    setSelectedUnit(null);
  };
  
  // Check if a position is valid for capital placement
  const isValidCapitalPosition = (q: number, r: number, s: number, playerOwner: PlayerID): boolean => {
    // Find the hex
    const centerHex = hexes.find(h => h.q === q && h.r === r && h.s === s);
    if (!centerHex) return false;
    
    // Check if in correct territory
    if (centerHex.owner !== playerOwner) return false;
    
    // Check if all adjacent hexes are accessible (not mountains or occupied) AND owned by the player
    const adjacentCoords = [
      {q: q, r: r-1, s: s+1},  // Top
      {q: q+1, r: r-1, s: s},  // Top Right
      {q: q+1, r: r, s: s-1},  // Bottom Right
      {q: q, r: r+1, s: s-1},  // Bottom
      {q: q-1, r: r+1, s: s},  // Bottom Left
      {q: q-1, r: r, s: s+1}   // Top Left
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
    setCurrentCapitalToPlace(altariaCapital);
    
    // Update game state
    setGameState(prevState => addToGameLog(
      prevState,
      "Capital placement phase started - Altaria chooses first"
    ));
  };
  
  // Handle when a capital is placed
  const handleCapitalPlaced = (hex: any, capital: Unit) => {
    const currentPlayer = gameState.currentPlayer;
    
    // Update hexes with the placed capital
    const updatedHexes = hexes.map(h => {
      if (h.id === hex.id) {
        return { ...h, unit: { ...capital, id: capital.id + '_' + Date.now() } };
      }
      return h;
    });
    
    setHexes(updatedHexes);
    
    // Update game state
    setGameState(prevState => {
      const updatedPlayers = { ...prevState.players };
      
      // Set this hex as the capital hex for this player
      updatedPlayers[currentPlayer] = {
        ...updatedPlayers[currentPlayer],
        capitalHex: hex,
        capital: capital
      };
      
      return {
        ...prevState,
        players: updatedPlayers,
        hexes: updatedHexes as unknown as GameHexData[],
        log: [...prevState.log, `${currentPlayer === 'player1' ? 'Altaria' : 'Cartasia'} placed their capital`]
      };
    });
    
    if (currentPlayer === 'player1') {
      // Switch to player 2 and prepare their capital placement
      setGameState(prevState => ({
        ...prevState,
        currentPlayer: 'player2',
        log: [...prevState.log, "Cartasia's turn to place capital"]
      }));
      
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
      // Both capitals have been placed, end setup phase
      setCapitalPlacementPhase(false);
      setValidCapitalPlacements([]);
      setCurrentCapitalToPlace(null);
      
      // Transition to Resource phase of first turn
      handlePhaseChange('RESOURCE');
      
      setGameState(prevState => ({
        ...prevState,
        currentPlayer: 'player1', // Make sure player 1 goes first
        log: [...prevState.log, "Setup complete. Starting game with Altaria's turn"]
      }));
    }
  };
  
  // Get player name based on ID
  const getPlayerName = (player: PlayerID) => {
    return player === 'player1' ? 'Altaria' : 'Cartasia';
  };
  
  // Get current phase instructions
  const getCurrentPhaseInstructions = () => {
    const phase = gameState.currentPhase;
    
    // Return different instructions based on the current phase
    switch (phase) {
      case 'SETUP':
        return "Place your capital on a valid hex in your territory.";
      case 'RESOURCE':
        return "Resources have been added to your pool based on your nation and unlocked hexes.";
      case 'DRAW':
        return "Draw a card from your deck.";
      case 'DEVELOPMENT_1':
        return "Deploy units and buildings to your kingdom.";
      case 'MOVEMENT':
        return "Move your units across the battlefield.";
      case 'COMBAT':
        return "Declare attacks against enemy units.";
      case 'DEVELOPMENT_2':
        return "Deploy additional units and buildings.";
      case 'END':
        return "End your turn and pass to the next player.";
      default:
        return "";
    }
  };
  
  // Load initial resources
  useEffect(() => {
    if (gameState.currentPhase === 'SETUP') {
      setPlayer1Resources(createEmptyResourcePool());
      setPlayer2Resources(createEmptyResourcePool());
    }
  }, [gameState.currentPhase]);
  
  return (
    <BattlefieldContainer>
      <BattlefieldHeader>
        <BattlefieldTitle>Kingdoms & Castles</BattlefieldTitle>
        <GameInfo>
          <PlayerInfo 
            $player="player1" 
            $isActive={gameState.currentPlayer === 'player1'}
          >
            Player 1: Altaria
          </PlayerInfo>
          <PlayerInfo 
            $player="player2" 
            $isActive={gameState.currentPlayer === 'player2'}
          >
            Player 2: Cartasia
          </PlayerInfo>
        </GameInfo>
      </BattlefieldHeader>
      
      {/* Phase Controller */}
      <PhaseController 
        currentPhase={gameState.currentPhase}
        onPhaseChange={handlePhaseChange}
        canAdvancePhase={
          gameState.currentPhase !== 'SETUP' || 
          !!(gameState.players.player1.capital && gameState.players.player2.capital)
        }
      />
      
      {/* Resource Display */}
      <ResourceDisplay 
        resources={gameState.currentPlayer === 'player1' ? player1Resources : player2Resources}
        nation={gameState.currentPlayer === 'player1' ? 'altaria' : 'cartasia'}
      />
      
      {/* Hex Grid */}
      <HexGrid 
        width={width} 
        height={height} 
        hexSize={hexSize} 
        currentPlayer={gameState.currentPlayer === 'neutral' ? 'player1' : gameState.currentPlayer}
        selectedUnit={capitalPlacementPhase ? currentCapitalToPlace : selectedUnit}
        onUnitPlaced={handleUnitPlaced}
        onHexGridInit={handleHexGridInit}
        capitalPlacementPhase={capitalPlacementPhase}
        validCapitalPlacements={validCapitalPlacements}
        resourceHexes={resourceHexes}
      />
      
      <ControlsContainer>
        {gameState.currentPhase === 'SETUP' && !capitalPlacementPhase ? (
          <>
            <GameStatusText>Start the game by placing capitals</GameStatusText>
            <Button onClick={handlePlaceCapitals}>
              Start Capital Placement
            </Button>
          </>
        ) : (
          <>
            <div>
              <GameStatusText>
                <strong>Current Turn:</strong> {getPlayerName(gameState.currentPlayer)} - 
                Turn {gameState.turn}{gameState.round > 0 ? ` (Round ${gameState.round})` : ''}
              </GameStatusText>
              <Instructions>
                {getCurrentPhaseInstructions()}
              </Instructions>
            </div>
          </>
        )}
      </ControlsContainer>
      
      {/* Unit Selection Panel - only show during development phases */}
      {(gameState.currentPhase === 'DEVELOPMENT_1' || gameState.currentPhase === 'DEVELOPMENT_2') && (
        <UnitSelectionPanel
          currentPlayer={gameState.currentPlayer === 'neutral' ? 'player1' : gameState.currentPlayer}
          selectedUnit={selectedUnit}
          onSelectUnit={handleUnitSelect}
        />
      )}
      
      {/* Game Log */}
      <GameLogContainer>
        <LogHeader>Game Log</LogHeader>
        {gameState.log.slice(-10).map((entry, index) => (
          <LogEntry key={index}>
            {entry}
          </LogEntry>
        ))}
      </GameLogContainer>
    </BattlefieldContainer>
  );
};

export default Battlefield;