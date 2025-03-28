import React, { ReactElement } from 'react';
import { Unit, UnitType } from '../../types/units';
import styled from 'styled-components';

const UnitContainer = styled.div<{ faction: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

// Simple SVG icons for different unit types
const getUnitSvgIcon = (type: UnitType, faction: string): ReactElement => {
  const color = faction === 'altaria' ? '#5c94ff' : faction === 'cartasia' ? '#ff5c5c' : '#aaaaaa';
  const factionColors = {
    'altaria': '#5c94ff',      // Blue
    'cartasia': '#ff5c5c',     // Red
    'durandur': '#00a0a0',     // Teal
    'belaklara': '#daa520',    // Gold
    'shadowspawn': '#480048'   // Dark purple
  };
  
  const factionColor = factionColors[faction as keyof typeof factionColors] || color;
  
  switch (type) {
    case 'infantry':
      return (
        <svg viewBox="0 0 24 24" width="80%" height="80%">
          <circle cx="12" cy="6" r="4" fill={factionColor} stroke="#000" strokeWidth="0.5" />
          <rect x="8" y="10" width="8" height="10" fill={factionColor} stroke="#000" strokeWidth="0.5" />
        </svg>
      );
    case 'archer':
      return (
        <svg viewBox="0 0 24 24" width="80%" height="80%">
          <circle cx="12" cy="6" r="4" fill={factionColor} stroke="#000" strokeWidth="0.5" />
          <path d="M8,10 h8 v6 h-8 z M12,16 v4" fill="none" stroke={factionColor} strokeWidth="2" />
          <path d="M6,14 L18,14" fill="none" stroke={factionColor} strokeWidth="2" />
        </svg>
      );
    case 'cavalry':
      return (
        <svg viewBox="0 0 24 24" width="80%" height="80%">
          <path d="M6,8 C6,5 10,4 12,7 C14,4 18,5 18,8 L18,18 L6,18 Z" fill={factionColor} stroke="#000" strokeWidth="0.5" />
          <circle cx="9" cy="10" r="1.5" fill="#000" />
          <circle cx="15" cy="10" r="1.5" fill="#000" />
        </svg>
      );
    case 'mage':
      return (
        <svg viewBox="0 0 24 24" width="80%" height="80%">
          <polygon points="12,3 16,12 12,18 8,12" fill={factionColor} stroke="#000" strokeWidth="0.5" />
          <path d="M8,18 h8 M12,18 v3" fill="none" stroke={factionColor} strokeWidth="2" />
        </svg>
      );
    case 'capital':
      // Enhanced capital icon with additional details
      return (
        <svg viewBox="0 0 24 24" width="80%" height="80%">
          {/* Base castle */}
          <path d="M4,20 V12 L12,6 L20,12 V20 Z" fill={factionColor} stroke="#000" strokeWidth="0.5" />
          
          {/* Castle details */}
          <path d="M7,20 V14 H10 V20" fill="#333" stroke="#000" strokeWidth="0.25" />
          <path d="M14,20 V14 H17 V20" fill="#333" stroke="#000" strokeWidth="0.25" />
          <path d="M11,13 h2 v7 h-2 z" fill="#333" stroke="#000" strokeWidth="0.25" />
          
          {/* Tower top */}
          <path d="M12,6 V1 M4,20 H20" fill="none" stroke="#000" strokeWidth="0.5" />
          
          {/* Banner */}
          <path d="M12,3 h3 v2 h-3" fill={factionColor} stroke="#000" strokeWidth="0.25" />
          
          {/* Windows */}
          <rect x="8.5" y="15" width="1" height="1.5" fill="#fff" />
          <rect x="14.5" y="15" width="1" height="1.5" fill="#fff" />
        </svg>
      );
    case 'hero':
      return (
        <svg viewBox="0 0 24 24" width="80%" height="80%">
          <polygon points="12,2 14,8 20,8 15,12 17,18 12,14 7,18 9,12 4,8 10,8" fill={factionColor} stroke="#000" strokeWidth="0.5" />
        </svg>
      );
    default:
      return <></>;
  }
};

// Status indicators for unit health
const HealthIndicator = styled.div<{ percentage: number }>`
  width: 70%;
  height: 3px;
  background-color: #ddd;
  border-radius: 2px;
  margin-top: 2px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.percentage}%;
    background-color: ${props => 
      props.percentage > 70 ? '#4CAF50' : 
      props.percentage > 30 ? '#FFC107' : 
      '#F44336'};
    border-radius: 2px;
  }
`;

interface UnitIconProps {
  unit: Unit;
  size?: number;
}

const UnitIcon: React.FC<UnitIconProps> = ({ unit, size = 30 }) => {
  const healthPercentage = (unit.hitPoints / unit.maxHitPoints) * 100;
  
  return (
    <UnitContainer faction={unit.faction}>
      {getUnitSvgIcon(unit.type, unit.faction)}
      
      {/* Show health bar (larger and more prominent for capitals) */}
      {unit.type === 'capital' ? (
        <div style={{ width: '100%', textAlign: 'center', marginTop: '3px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
            {unit.hitPoints}/{unit.maxHitPoints} HP
          </div>
          <HealthIndicator percentage={healthPercentage} style={{ height: '4px', marginTop: '2px' }} />
        </div>
      ) : (
        <HealthIndicator percentage={healthPercentage} />
      )}
    </UnitContainer>
  );
};

export default UnitIcon;