import React from 'react';
import styled from 'styled-components';
import { Unit, SAMPLE_UNITS } from '../../types/units';
import UnitIcon from './UnitIcon';

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #f0f0f0;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const PanelTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
`;

const UnitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
`;

const UnitCard = styled.div<{ isSelected: boolean, faction: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background-color: ${props => 
    props.isSelected ? 
      (props.faction === 'altaria' ? '#d6e4ff' : '#ffd6d6') : 
      '#ffffff'
  };
  border: 1px solid ${props => 
    props.faction === 'altaria' ? '#5c94ff' : 
    props.faction === 'cartasia' ? '#ff5c5c' : 
    '#aaaaaa'
  };
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

const UnitName = styled.div`
  font-size: 0.8rem;
  font-weight: bold;
  margin-top: 5px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const UnitStat = styled.div`
  font-size: 0.7rem;
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 2px;
`;

interface UnitSelectionPanelProps {
  currentPlayer: 'player1' | 'player2';
  selectedUnit: Unit | null;
  onSelectUnit: (unit: Unit) => void;
}

const UnitSelectionPanel: React.FC<UnitSelectionPanelProps> = ({ 
  currentPlayer, 
  selectedUnit, 
  onSelectUnit 
}) => {
  // Filter units based on current player
  const playerFaction = currentPlayer === 'player1' ? 'altaria' : 'cartasia';
  
  const playerUnits = Object.values(SAMPLE_UNITS).filter(
    unit => unit.faction === playerFaction && unit.type !== 'capital'
  );
  
  return (
    <PanelContainer>
      <PanelTitle>Available Units</PanelTitle>
      <UnitGrid>
        {playerUnits.map(unit => (
          <UnitCard 
            key={unit.id}
            isSelected={selectedUnit?.id === unit.id}
            faction={unit.faction}
            onClick={() => onSelectUnit(unit)}
          >
            <div style={{ width: 40, height: 40 }}>
              <UnitIcon unit={unit} />
            </div>
            <UnitName>{unit.name}</UnitName>
            <UnitStat>
              <span>AP: {unit.attackPower}</span>
              <span>HP: {unit.hitPoints}</span>
            </UnitStat>
            <UnitStat>
              <span>Move: {unit.movement}</span>
              <span>Range: {unit.range}</span>
            </UnitStat>
          </UnitCard>
        ))}
      </UnitGrid>
    </PanelContainer>
  );
};

export default UnitSelectionPanel;