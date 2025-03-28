// src/components/combat/CombatSystem.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Unit } from '../../types/units';
import { HexData } from '../../types/gameState';
import UnitIcon from '../units/UnitIcon';

const CombatContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const CombatTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #333;
`;

const CombatPanel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const UnitDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background-color: #f0f4f8;
  min-width: 100px;
`;

const UnitName = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  text-align: center;
`;

const UnitStats = styled.div`
  font-size: 0.8rem;
  display: flex;
  gap: 10px;
  margin-top: 5px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatValue = styled.div`
  font-weight: bold;
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  color: #666;
`;

const CombatActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
`;

const ActionButton = styled.button<{ actionType?: 'attack' | 'cancel' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  background-color: ${props => 
    props.actionType === 'attack' ? '#d9534f' : 
    props.actionType === 'cancel' ? '#f0f0f0' : '#4a6fa5'
  };
  color: ${props => props.actionType === 'cancel' ? '#333' : 'white'};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => 
      props.actionType === 'attack' ? '#c9302c' : 
      props.actionType === 'cancel' ? '#e0e0e0' : '#385682'
    };
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const VSSymbol = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #d9534f;
  margin: 0 20px;
`;

const CombatLog = styled.div`
  margin-top: 15px;
  max-height: 120px;
  overflow-y: auto;
  border-top: 1px solid #e9ecef;
  padding-top: 10px;
`;

const LogEntry = styled.div<{ isAttacker?: boolean }>`
  padding: 4px 8px;
  margin: 2px 0;
  border-radius: 4px;
  background-color: ${props => props.isAttacker ? '#fff8f8' : '#f8fff8'};
  font-size: 0.9rem;
`;

const CombatResultDisplay = styled.div<{ result: 'attacker' | 'defender' | 'draw' | null }>`
  margin-top: 15px;
  padding: 10px;
  text-align: center;
  font-weight: bold;
  border-radius: 4px;
  background-color: ${props => 
    props.result === 'attacker' ? '#ffebee' : 
    props.result === 'defender' ? '#e8f5e9' : 
    props.result === 'draw' ? '#fff8e1' : 'transparent'
  };
  color: ${props => 
    props.result === 'attacker' ? '#c62828' : 
    props.result === 'defender' ? '#2e7d32' : 
    props.result === 'draw' ? '#ff8f00' : '#333'
  };
  display: ${props => props.result ? 'block' : 'none'};
`;

interface CombatSystemProps {
  attackerHex: HexData | null;
  defenderHex: HexData | null;
  onCombatResolved: (
    attacker: HexData, 
    defender: HexData, 
    attackerDamage: number, 
    defenderDamage: number
  ) => void;
  onCombatCancelled: () => void;
  canAttack: boolean;
}

// Simulate battle between two units
const resolveCombat = (attacker: Unit, defender: Unit): {
  attackerDamage: number;
  defenderDamage: number;
  combatLog: string[];
  result: 'attacker' | 'defender' | 'draw';
} => {
  const attackerDamage = defender.attackPower;
  const defenderDamage = attacker.attackPower;
  
  const combatLog = [
    `${attacker.name} attacks ${defender.name}.`,
    `${attacker.name} deals ${defenderDamage} damage to ${defender.name}.`,
    `${defender.name} retaliates with ${attackerDamage} damage to ${attacker.name}.`
  ];
  
  // Apply damage (for display only - the actual update happens in the parent)
  const attackerNewHp = attacker.hitPoints - attackerDamage;
  const defenderNewHp = defender.hitPoints - defenderDamage;
  
  combatLog.push(`${attacker.name} has ${attackerNewHp} HP remaining.`);
  combatLog.push(`${defender.name} has ${defenderNewHp} HP remaining.`);
  
  // Determine who "won" the exchange
  let result: 'attacker' | 'defender' | 'draw';
  if (defenderNewHp <= 0 && attackerNewHp > 0) {
    result = 'attacker';
    combatLog.push(`${defender.name} is defeated!`);
  } else if (attackerNewHp <= 0 && defenderNewHp > 0) {
    result = 'defender';
    combatLog.push(`${attacker.name} is defeated!`);
  } else if (attackerNewHp <= 0 && defenderNewHp <= 0) {
    result = 'draw';
    combatLog.push(`Both units were defeated in combat!`);
  } else {
    // Compare percentage of remaining health
    const attackerHealthPercent = attackerNewHp / attacker.maxHitPoints;
    const defenderHealthPercent = defenderNewHp / defender.maxHitPoints;
    
    if (attackerHealthPercent > defenderHealthPercent) {
      result = 'attacker';
    } else if (defenderHealthPercent > attackerHealthPercent) {
      result = 'defender';
    } else {
      result = 'draw';
    }
  }
  
  return { attackerDamage, defenderDamage, combatLog, result };
};

const CombatSystem: React.FC<CombatSystemProps> = ({ 
  attackerHex, 
  defenderHex, 
  onCombatResolved, 
  onCombatCancelled,
  canAttack
}) => {
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [combatResult, setCombatResult] = useState<'attacker' | 'defender' | 'draw' | null>(null);
  const [combatResolved, setCombatResolved] = useState(false);
  
  // Reset combat state when units change
  useEffect(() => {
    setCombatLog([]);
    setCombatResult(null);
    setCombatResolved(false);
  }, [attackerHex, defenderHex]);
  
  // Execute attack
  const handleAttack = () => {
    if (!attackerHex?.unit || !defenderHex?.unit) return;
    
    // Resolve combat
    const { attackerDamage, defenderDamage, combatLog: log, result } = resolveCombat(
      attackerHex.unit,
      defenderHex.unit
    );
    
    // Update combat log
    setCombatLog(log);
    setCombatResult(result);
    setCombatResolved(true);
    
    // Notify parent component
    onCombatResolved(attackerHex, defenderHex, attackerDamage, defenderDamage);
  };
  
  // Cancel combat
  const handleCancel = () => {
    onCombatCancelled();
  };
  
  // Check if we have valid units for combat
  if (!attackerHex?.unit || !defenderHex?.unit) {
    return (
      <CombatContainer>
        <CombatTitle>Combat System</CombatTitle>
        <p>Select attacker and defender units to initiate combat.</p>
      </CombatContainer>
    );
  }
  
  const { unit: attacker } = attackerHex;
  const { unit: defender } = defenderHex;
  
  return (
    <CombatContainer>
      <CombatTitle>Combat System</CombatTitle>
      
      <CombatPanel>
        <UnitDisplay>
          <UnitName>{attacker.name}</UnitName>
          <div style={{ width: 60, height: 60 }}>
            <UnitIcon unit={attacker} />
          </div>
          <UnitStats>
            <StatItem>
              <StatValue>{attacker.attackPower}</StatValue>
              <StatLabel>Attack</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{attacker.hitPoints}/{attacker.maxHitPoints}</StatValue>
              <StatLabel>HP</StatLabel>
            </StatItem>
          </UnitStats>
        </UnitDisplay>
        
        <VSSymbol>VS</VSSymbol>
        
        <UnitDisplay>
          <UnitName>{defender.name}</UnitName>
          <div style={{ width: 60, height: 60 }}>
            <UnitIcon unit={defender} />
          </div>
          <UnitStats>
            <StatItem>
              <StatValue>{defender.attackPower}</StatValue>
              <StatLabel>Attack</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{defender.hitPoints}/{defender.maxHitPoints}</StatValue>
              <StatLabel>HP</StatLabel>
            </StatItem>
          </UnitStats>
        </UnitDisplay>
      </CombatPanel>
      
      {combatLog.length > 0 && (
        <CombatLog>
          {combatLog.map((entry, index) => (
            <LogEntry 
              key={index} 
              isAttacker={entry.includes(attacker.name)}
            >
              {entry}
            </LogEntry>
          ))}
        </CombatLog>
      )}
      
      <CombatResultDisplay result={combatResult}>
        {combatResult === 'attacker' && `${attacker.name} won the combat!`}
        {combatResult === 'defender' && `${defender.name} won the combat!`}
        {combatResult === 'draw' && 'The combat ended in a draw!'}
      </CombatResultDisplay>
      
      <CombatActions>
        {!combatResolved ? (
          <>
            <ActionButton 
              onClick={handleAttack} 
              disabled={!canAttack}
              actionType="attack"
            >
              Attack
            </ActionButton>
            <ActionButton 
              onClick={handleCancel}
              actionType="cancel"
            >
              Cancel
            </ActionButton>
          </>
        ) : (
          <ActionButton 
            onClick={handleCancel}
          >
            Done
          </ActionButton>
        )}
      </CombatActions>
    </CombatContainer>
  );
};

export default CombatSystem;