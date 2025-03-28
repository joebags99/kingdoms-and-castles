// src/components/phase/PhaseController.tsx
import React from 'react';
import styled from 'styled-components';
import { PhaseType, PHASES, getNextPhase } from '../../types/phases';

// Styled components for the phase controller
const PhaseControlContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const PhaseTitle = styled.h3`
  margin: 0 0 8px 0;
  color: #333;
  display: flex;
  align-items: center;
`;

const PhaseDescription = styled.p`
  margin: 0 0 15px 0;
  color: #666;
  font-size: 0.9rem;
`;

const PhaseActionButton = styled.button`
  padding: 8px 16px;
  background-color: #4a6fa5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  align-self: flex-end;
  transition: all 0.2s;
  
  &:hover {
    background-color: #385682;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const PhaseBadge = styled.span<{ isActive: boolean }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 10px;
  background-color: ${props => props.isActive ? '#4a6fa5' : '#e9ecef'};
  color: ${props => props.isActive ? 'white' : '#6c757d'};
`;

const PhasesProgressContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  position: relative;
  width: 100%;
  padding: 0 10px;
`;

const PhaseProgressWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 30px;
`;

const PhaseDot = styled.div<{ isActive: boolean, isPast: boolean, left: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => 
    props.isActive ? '#4a6fa5' : 
    props.isPast ? '#a5c0e5' : '#e9ecef'
  };
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s;
  cursor: ${props => (props.isActive || props.isPast) ? 'pointer' : 'default'};
  position: absolute;
  left: ${props => props.left};
  top: 50%;
  transform: translate(-50%, -50%);
`;

const PhaseLabel = styled.div<{ isActive: boolean, left: string }>`
  font-size: 0.7rem;
  color: ${props => props.isActive ? '#4a6fa5' : '#6c757d'};
  text-align: center;
  position: absolute;
  width: 70px;
  bottom: -20px;
  left: ${props => props.left};
  transform: translateX(-50%);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PhaseProgressBar = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  height: 3px;
  background-color: #e9ecef;
  width: 100%;
  z-index: 1;
`;

const PhaseProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background-color: #a5c0e5;
  width: ${props => props.progress}%;
  transition: width 0.3s;
`;

interface PhaseControllerProps {
  currentPhase: PhaseType;
  onPhaseChange: (newPhase: PhaseType) => void;
  canAdvancePhase?: boolean;
}

const PhaseController: React.FC<PhaseControllerProps> = ({ 
  currentPhase, 
  onPhaseChange,
  canAdvancePhase = true
}) => {
  const phaseData = PHASES[currentPhase];
  
  // Get all phase types except SETUP for the progress bar
  const gamePhases: PhaseType[] = ['RESOURCE', 'DRAW', 'DEVELOPMENT_1', 'MOVEMENT', 'COMBAT', 'DEVELOPMENT_2', 'END'];
  
  // Calculate which phase we're on (for the progress bar)
  const currentPhaseIndex = gamePhases.indexOf(currentPhase);
  const progressPercentage = currentPhaseIndex >= 0 
    ? (currentPhaseIndex / (gamePhases.length - 1)) * 100 
    : 0;
  
  const handleNextPhase = () => {
    const nextPhase = getNextPhase(currentPhase);
    onPhaseChange(nextPhase);
  };
  
  const handleDotClick = (phase: PhaseType) => {
    // Only allow going to past phases or current phase
    const clickedIndex = gamePhases.indexOf(phase);
    const currentIndex = gamePhases.indexOf(currentPhase);
    
    if (clickedIndex <= currentIndex) {
      onPhaseChange(phase);
    }
  };
  
  // Don't show the phase progress if we're in setup
  if (currentPhase === 'SETUP') {
    return (
      <PhaseControlContainer>
        <PhaseTitle>
          {phaseData.displayName}
          <PhaseBadge isActive={true}>Active</PhaseBadge>
        </PhaseTitle>
        <PhaseDescription>{phaseData.description}</PhaseDescription>
        {canAdvancePhase && (
          <PhaseActionButton onClick={handleNextPhase}>
            Start Game
          </PhaseActionButton>
        )}
      </PhaseControlContainer>
    );
  }
  
  // For all other phases, show the phase progress
  return (
    <PhaseControlContainer>
      <PhaseProgressWrapper>
        <PhasesProgressContainer>
          <PhaseProgressBar>
            <PhaseProgressFill progress={progressPercentage} />
          </PhaseProgressBar>
          
          {gamePhases.map((phase, index) => {
            const isActive = phase === currentPhase;
            const isPast = gamePhases.indexOf(phase) < gamePhases.indexOf(currentPhase);
            const left = `${(index / (gamePhases.length - 1)) * 100}%`;
            
            return (
              <React.Fragment key={phase}>
                <PhaseDot 
                  isActive={isActive} 
                  isPast={isPast}
                  left={left}
                  onClick={() => handleDotClick(phase)}
                >
                  {isActive && <span style={{ fontSize: '0.7rem', color: 'white' }}>•</span>}
                </PhaseDot>
                <PhaseLabel isActive={isActive} left={left}>
                  {PHASES[phase].displayName.split(' ')[0]}
                </PhaseLabel>
              </React.Fragment>
            );
          })}
        </PhasesProgressContainer>
      </PhaseProgressWrapper>
      
      <PhaseTitle>
        {phaseData.displayName}
        <PhaseBadge isActive={true}>Active</PhaseBadge>
      </PhaseTitle>
      <PhaseDescription>{phaseData.description}</PhaseDescription>
      
      {canAdvancePhase && (
        <PhaseActionButton onClick={handleNextPhase}>
          {currentPhase === 'END' ? 'End Turn' : 'Next Phase'}
        </PhaseActionButton>
      )}
    </PhaseControlContainer>
  );
};

export default PhaseController;